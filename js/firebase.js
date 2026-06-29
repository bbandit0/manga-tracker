// FIREBASE — CONFIGURACIÓN PARA SINCRONIZACIÓN CROSS-DEVICE
// PASOS para habilitar sync entre celular y PC:
//
//  1. Ir a https://console.firebase.google.com → Crear proyecto nuevo
//  2. Agregar app Web → copiar el objeto firebaseConfig y pegar abajo
//  3. En Firestore Database → Crear database → modo producción
//     Luego en Rules reemplazar todo con:
//
//     rules_version = '2';
//     service cloud.firestore {
//       match /databases/{database}/documents {
//         match /users/{userId}/{document=**} {
//           allow read, write: if request.auth != null
//                              && request.auth.uid == userId;
//         }
//         match /public_profiles/{userId} {
//           allow read: if request.auth != null;
//           allow write: if request.auth != null && request.auth.uid == userId;
//         }
//         match /usernames/{username} {
//           allow read: if request.auth != null;
//           allow write: if request.auth != null
//                         && request.resource.data.uid == request.auth.uid;
//         }
//       }
//     }
//
//  4. En Authentication → Sign-in method → Habilitar Google
//  5. En Authentication → Settings → Authorized domains → agregar:
//     bbandit0.github.io
//  6. Pegar tu config en el objeto FIREBASE_CONFIG de abajo
//  7. Subir firebase.js actualizado a GitHub → listo
//
// Una vez configurado: la app detecta cambios en tiempo real
// (onSnapshot) — cualquier edición en el cel se ve en el PC
// instantáneamente sin hacer nada manual.
// SEGURIDAD: la apiKey de Firebase es pública por diseño (se envía al browser),
// pero DEBES restringirla en Google Cloud Console > APIs & Services > Credentials
// > Application restrictions: HTTP referrers > agregar solo bbandit0.github.io/*
// Y configurar Firestore Security Rules para que solo usuarios autenticados lean/escriban.
// Más info: https://firebase.google.com/docs/projects/api-keys

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBHNVcM547Y4SK43sZuh6P-8TKtdPDxG54",
  authDomain: "manga-tracker-fad56.firebaseapp.com",
  projectId: "manga-tracker-fad56",
  storageBucket: "manga-tracker-fad56.firebasestorage.app",
  messagingSenderId: "852661427743",
  appId: "1:852661427743:web:3446004609d33c0ce0ff2a"
};

const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey !== "";
let fb=null,fbAuth=null,fbDb=null,fbUser=null,fbUnsub=null,fbUnsubFriends=null,pendingRequestsCount=0;
let _authResolved=false; // true tras la primera resolucion de Firebase Auth (login confirmado o invitado confirmado) — Fix v3.9.1

// ── CONTADOR de writes propios pendientes de ser consumidos por onSnapshot.
// Firestore puede emitir HASTA 2 eventos por write en PC:
//   1) Evento de cache local (inmediato, metadata.hasPendingWrites === true)
//   2) Confirmacion del servidor (tardio, metadata.hasPendingWrites === false)
// Usamos contador en vez de booleano para absorber ambos sin bloquear
// eventos externos que lleguen despues.
let _localWriteCount = 0;
let _localWriteTimer = null;
function _markLocalWrite() {
  _localWriteCount += 2; // +2 cubre cache local + confirmacion servidor
  if(_localWriteTimer) clearTimeout(_localWriteTimer);
  // Ventana de 10s: margen para conexiones lentas o alta latencia en PC
  _localWriteTimer = setTimeout(function(){ _localWriteCount = 0; }, 10000);
}

// ── GUARDIA DE SCORE: suma de completed[] + 1 por item existente.
// Un save() accidental con data vacia produce score=0 y nunca pisa datos reales.
// Esta guardia SOLO se aplica a eventos externos (otro dispositivo).
function _cloudScoreOf(d) {
  if(!d) return -1;
  var score = 0;
  ["manga","anime"].forEach(function(t) {
    if(Array.isArray(d[t])) {
      d[t].forEach(function(s) {
        score += (s.completed ? s.completed.length : 0) + 1;
      });
    }
  });
  return score;
}

// ── GUARDIA DE ESTRUCTURA: valida que el objeto tenga forma usable antes
// de cualquier lectura/escritura. Evita que un documento malformado se propague.
function _isValidData(d) {
  return d && typeof d === "object" && Array.isArray(d.manga) && Array.isArray(d.anime);
}

// ── FIX v3.10 — CAMBIO ESTRUCTURAL: merge item-por-item en vez de reemplazo
// de array completo basado en score agregado.
//
// Motivo: comparar "que array completo tiene mayor score" y reemplazar TODO
// en base a eso es inherentemente fragil — un solo bug, en cualquier punto
// de la cadena (boot, onSnapshot, una sesion vieja con cache stale), puede
// hacer que se pise la coleccion ENTERA de un dispositivo. Esa ha sido la
// causa raiz comun de los incidentes de perdida de datos.
//
// Con merge item-por-item, el peor caso posible deja de ser "perder todo" y
// pasa a ser, como mucho, "un item no se actualizo a tiempo" — que se
// autocorrige en el siguiente sync. Cada serie se resuelve independientemente
// por su propio `lastUpdated` (o `createdAt` como respaldo), no por el score
// total de la coleccion.
//
// Tombstones (`deletedIds`): como el merge nunca borra nada por iniciativa
// propia, necesitamos una forma explicita de decirle "esta serie SI se borro
// a proposito, no la repongas". markDeleted() (en tracker.js) registra eso
// cada vez que el usuario elimina una serie o hace un reset total.
function mergeMangu(local, cloud){
  local = (local && typeof local === "object") ? local : {manga:[],anime:[],deletedIds:[]};
  cloud = (cloud && typeof cloud === "object") ? cloud : {manga:[],anime:[],deletedIds:[]};

  // Combinar tombstones de ambos lados: si un id se borro en cualquier lugar,
  // se respeta el borrado MAS RECIENTE que se conozca para ese id.
  var tombById = new Map();
  [].concat(local.deletedIds||[], cloud.deletedIds||[]).forEach(function(t){
    if(!t || !t.id) return;
    var prev = tombById.get(t.id);
    if(!prev || t.deletedAt > prev.deletedAt) tombById.set(t.id, t);
  });

  var merged = {manga:[], anime:[], deletedIds: Array.from(tombById.values())};

  ["manga","anime"].forEach(function(type){
    var byId = new Map();
    (local[type]||[]).forEach(function(item){ byId.set(String(item.id), item); });
    (cloud[type]||[]).forEach(function(item){
      var id = String(item.id);
      var existing = byId.get(id);
      if(!existing){ byId.set(id, item); return; }
      var eUp = existing.lastUpdated || existing.createdAt || 0;
      var iUp = item.lastUpdated || item.createdAt || 0;
      // Gana la version mas reciente; en empate exacto, la de mayor progreso.
      if(iUp > eUp || (iUp === eUp && (item.completed?.length||0) > (existing.completed?.length||0))){
        byId.set(id, item);
      }
    });
    // Aplicar tombstones: descartar items borrados, A MENOS que se hayan
    // vuelto a editar DESPUES de su propio borrado (recupera ediciones
    // legitimas que llegaron tarde desde un dispositivo que no sabia del delete).
    merged[type] = Array.from(byId.values()).filter(function(item){
      var t = tombById.get(String(item.id));
      if(!t) return true;
      var itemUp = item.lastUpdated || item.createdAt || 0;
      return itemUp > t.deletedAt;
    });
  });

  return merged;
}

if(FIREBASE_ENABLED){
  try{
    fb = firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();

    // Handle redirect result for Safari (popup blocked, redirect fallback)
    fbAuth.getRedirectResult().then(function(result){
      if(result && result.user){
        fbUser = result.user;
        if(!_authResolved) reloadLocalForCurrentUser(); // Fix v3.9.1: misma carrera aplica al flujo de redirect (Safari)
        loadFromCloud();
      }
    }).catch(function(){});

    fbAuth.onAuthStateChanged(async function(u){
      var prevUid = fbUser ? fbUser.uid : null;
      var firstResolution = !_authResolved; // capturar ANTES de marcar resuelto
      _authResolved = true;
      fbUser = u;
      if(u){
        if(prevUid && prevUid !== u.uid){
          // Usuario distinto: limpiar estado anterior SIN tocar localStorage del nuevo uid
          data = {manga:[], anime:[]};
          localStorage.removeItem("mat-v4-" + prevUid);
        } else if(firstResolution){
          // FIX v3.9.1: esta es la PRIMERA resolucion de auth tras el boot.
          // "data" fue cargada por initData() bajo la clave de invitado, porque
          // en ese momento Firebase todavia no sabia el uid real. Releer/fusionar ahora,
          // ANTES de comparar contra la nube en loadFromCloud().
          reloadLocalForCurrentUser();
        }
        // FIX: Cargar username ANTES del primer render para evitar "Sin @username"
        try{
          var doc = await fbDb.collection("public_profiles").doc(u.uid).get();
          if(doc.exists && doc.data().username){
            friendsState.cachedUsername = doc.data().username;
            friendsState.usernameCacheUid = u.uid;
          }
        }catch(e){}
        loadFromCloud();
      }
      render();
    });
  }catch(e){ console.warn("Firebase init error:", e); }
}

async function signIn(){
  if(!FIREBASE_ENABLED) return showToast("Configura Firebase primero");
  try{
    var provider = new firebase.auth.GoogleAuthProvider();
    var result = await fbAuth.signInWithPopup(provider);
    if(result && result.user){ fbUser = result.user; loadFromCloud(); }
  }catch(e){
    // Safari bloquea popups, usar redirect como fallback
    if(e.code==="auth/popup-blocked" || e.code==="auth/cancelled-popup-request" || e.code==="auth/popup-closed-by-user"){
      try{
        await fbAuth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
      }catch(re){ showToast("Error al iniciar sesion: " + (re.code || re.message)); }
    } else {
      showToast("Error al iniciar sesion: " + (e.code || e.message));
    }
  }
}

async function signOut(){
  if(fbUnsub) fbUnsub(); fbUnsub = null;
  if(fbUnsubFriends) fbUnsubFriends(); fbUnsubFriends = null;
  pendingRequestsCount = 0;
  friendsState.cachedUsername = null;
  friendsState.usernameCacheUid = null;
  try{
    var keyToRemove = getSKEY();
    await fbAuth.signOut();
    fbUser = null;
    localStorage.removeItem(keyToRemove);
    data = {manga:[], anime:[]};
    render();
  }catch(e){}
}

async function saveToCloud(){
  if(!fbUser || !fbDb) return;

  // GUARDIA 1: estructura invalida
  if(!_isValidData(data)){
    console.warn("[MANGU] saveToCloud bloqueado: data invalida", data);
    return;
  }

  // GUARDIA 2: no subir vacio SIN EXPLICACION si la nube tiene datos reales.
  // FIX v3.10: antes esto bloqueaba TAMBIEN un vaciado intencional (boton
  // "Reset todos los datos"), porque no habia forma de distinguir "se rompio
  // algo y data quedo vacio por accidente" de "el usuario borro todo a proposito".
  // Ahora usamos los tombstones (deletedIds) como esa señal: si hay tombstones
  // recientes que explican por que esta vacio, se permite subir.
  var totalItems = (data.manga ? data.manga.length : 0) + (data.anime ? data.anime.length : 0);
  var hasIntentionalTombstones = Array.isArray(data.deletedIds) && data.deletedIds.length > 0;
  if(totalItems === 0 && !hasIntentionalTombstones){
    try{
      var check = await fbDb.collection("users").doc(fbUser.uid).get();
      if(check.exists && _isValidData(check.data().data) && _cloudScoreOf(check.data().data) > 0){
        console.warn("[MANGU] saveToCloud bloqueado: intento de subir vacio sin explicacion cuando nube tiene datos");
        return;
      }
    }catch(e){}
  }

  try{
    // Marcar ANTES del set() para que el onSnapshot resultante sea reconocido
    // como write propio y no active la guardia de score externa.
    // +2 porque Firestore emite hasta 2 eventos: cache local + confirmacion servidor.
    _markLocalWrite();
    await fbDb.collection("users").doc(fbUser.uid).set({
      data: JSON.parse(JSON.stringify(data)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
    fnSaveMyPublicProfile().catch(function(){});
  }catch(e){
    _localWriteCount = 0; // reset en caso de error de red
    console.warn("Cloud save:", e);
  }
}

// ── FIX v3.10 — RED DE SEGURIDAD: respaldo automatico versionado.
// Independiente de que el merge item-por-item ya elimina la causa raiz de
// fondo, esto da una via de recuperacion real para CUALQUIER escenario futuro
// que no hayamos previsto — sin tener que hacer arqueologia manual de
// localStorage como tuvimos que hacer esta vez.
// Maximo 1 respaldo nuevo por dia real por usuario (no por sesion), y se
// mantienen como maximo 20 versiones rotando (~20 dias de historial).
// Corre dentro del tier gratuito de Firestore (no requiere plan Blaze).
async function _maybeBackup(){
  if(!fbUser || !fbDb) return;
  try{
    var backupsRef = fbDb.collection("users").doc(fbUser.uid).collection("backups");
    var last = await backupsRef.orderBy("savedAt","desc").limit(1).get();
    var lastSavedAt = last.empty ? 0 : (last.docs[0].data().savedAt?.toMillis?.() || 0);
    if(Date.now() - lastSavedAt < 24*60*60*1000) return; // ya hay un respaldo de hoy

    await backupsRef.add({
      data: JSON.parse(JSON.stringify(data)),
      savedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    var snap = await backupsRef.orderBy("savedAt","desc").get();
    var MAX_BACKUPS = 20;
    if(snap.docs.length > MAX_BACKUPS){
      var toDelete = snap.docs.slice(MAX_BACKUPS);
      await Promise.all(toDelete.map(function(d2){ return d2.ref.delete(); }));
    }
  }catch(e){ console.warn("[MANGU] backup automatico fallido:", e); }
}

// ── Herramientas de recuperacion manual, invocables desde la consola:
//   await listBackups()              -> lista los respaldos disponibles con fecha y score
//   await restoreBackup("xxxxx")     -> restaura uno especifico (usa el id que muestra listBackups)
async function listBackups(){
  if(!fbUser || !fbDb) return [];
  var snap = await fbDb.collection("users").doc(fbUser.uid).collection("backups").orderBy("savedAt","desc").get();
  var out = snap.docs.map(function(d){
    return {id: d.id, savedAt: d.data().savedAt?.toDate?.(), score: _cloudScoreOf(d.data().data)};
  });
  console.log("[MANGU] Backups disponibles:", out);
  return out;
}
async function restoreBackup(backupId){
  if(!fbUser || !fbDb) return;
  var doc = await fbDb.collection("users").doc(fbUser.uid).collection("backups").doc(backupId).get();
  if(!doc.exists){ console.warn("[MANGU] Backup no encontrado:", backupId); return; }
  var restored = doc.data().data;
  ["manga","anime"].forEach(function(t){ if(restored[t]) restored[t] = restored[t].map(migrate); });
  data = restored;
  saveLocal();
  await saveToCloud();
  render();
  console.log("[MANGU] ✓ Restaurado backup", backupId);
}

async function loadFromCloud(){
  if(!fbUser || !fbDb) return;
  try{
    var doc = await fbDb.collection("users").doc(fbUser.uid).get();
    if(doc.exists && _isValidData(doc.data().data)){
      // FIX v3.10: merge item-por-item en vez de "el que tenga mayor score gana todo".
      var c = doc.data().data;
      ["manga","anime"].forEach(function(t){ if(c[t]) c[t] = c[t].map(migrate); });
      var merged = mergeMangu(data, c);
      var localHadExtra = _cloudScoreOf(merged) > _cloudScoreOf(c);
      data = merged;
      saveLocal();
      render();
      showToast("Sincronizado");
      if(localHadExtra){
        // El local tenia algo que la nube no tenia (ej: la ventana de carrera
        // de boot, o ediciones offline) — re-publicar para que converjan.
        await saveToCloud();
      }
      setTimeout(function(){ checkUpToDateNewChapters(); }, 4000);
    } else {
      // No hay datos validos en la nube: subir lo que hay localmente
      await saveToCloud();
      showToast("Datos subidos a la nube");
    }

    _maybeBackup(); // fire-and-forget, no bloquea el render

    // Activar listener en tiempo real
    if(fbUnsub) fbUnsub();
    fbUnsub = fbDb.collection("users").doc(fbUser.uid).onSnapshot(function(snap){
      if(!snap.exists) return;
      var d = snap.data().data;
      if(!_isValidData(d)) return;

      // Si este evento fue generado por un write propio de este dispositivo,
      // consumir el contador y salir SIN re-aplicar data desde Firestore.
      if(_localWriteCount > 0){
        _localWriteCount--;
        if(_localWriteCount === 0 && _localWriteTimer){
          clearTimeout(_localWriteTimer);
          _localWriteTimer = null;
        }
        return;
      }

      // FIX v3.10: evento externo real (otro dispositivo) -> fusionar item por
      // item en vez de reemplazar el array completo. Esto es lo que elimina la
      // clase de bug que causaba que un dispositivo con estado parcial/viejo
      // pudiera borrar de un plumazo el resto de la coleccion.
      ["manga","anime"].forEach(function(t){ if(d[t]) d[t] = d[t].map(migrate); });
      data = mergeMangu(data, d);
      saveLocal();
      render();
    });

    // Listener de solicitudes de amistad pendientes
    if(fbUnsubFriends) fbUnsubFriends();
    fbUnsubFriends = fbDb.collection("users").doc(fbUser.uid)
      .collection("friends_received").onSnapshot(function(snap){
        var prev = pendingRequestsCount;
        pendingRequestsCount = snap.size;
        var badge = document.getElementById("friends-badge");
        if(badge){
          badge.textContent = pendingRequestsCount > 9 ? "9+" : pendingRequestsCount;
          badge.style.display = pendingRequestsCount > 0 ? "flex" : "none";
        }
        if(tab==="friends" && document.getElementById("friends-panel-container")){
          renderFriendsPanel();
        }
        if(pendingRequestsCount > prev && document.readyState === "complete"){
          showToast("Nueva solicitud de amistad");
        }
      }, function(err){ console.warn("friends_received listener:", err.message); });

  }catch(e){ console.warn("Cloud load:", e); }
}
