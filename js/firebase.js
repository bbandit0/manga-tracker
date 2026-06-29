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

  // GUARDIA 2: no subir vacio si la nube tiene datos reales
  // Cubre el race condition de inicializacion donde data={manga:[],anime:[]}
  // todavia no fue reemplazado por los datos del usuario.
  var totalItems = (data.manga ? data.manga.length : 0) + (data.anime ? data.anime.length : 0);
  if(totalItems === 0){
    try{
      var check = await fbDb.collection("users").doc(fbUser.uid).get();
      if(check.exists && _isValidData(check.data().data) && _cloudScoreOf(check.data().data) > 0){
        console.warn("[MANGU] saveToCloud bloqueado: intento de subir vacio cuando nube tiene datos");
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

async function loadFromCloud(){
  if(!fbUser || !fbDb) return;
  try{
    var doc = await fbDb.collection("users").doc(fbUser.uid).get();
    if(doc.exists && _isValidData(doc.data().data)){
      var c = doc.data().data;
      var cloudScore = _cloudScoreOf(c);
      var localScore = _cloudScoreOf(data);

      if(cloudScore >= localScore){
        // La nube tiene igual o mas progreso: usar nube (caso normal al iniciar sesion)
        ["manga","anime"].forEach(function(t){ if(c[t]) c[t] = c[t].map(migrate); });
        data = c;
        saveLocal();
        render();
        showToast("Sincronizado");
        setTimeout(function(){ checkUpToDateNewChapters(); }, 4000);
      } else {
        // Local tiene mas progreso que la nube: re-subir local en lugar de pisar
        // Ocurre cuando se editó offline o la nube tiene una version antigua.
        console.warn("[MANGU] loadFromCloud: local mas completo (local=" + localScore + " nube=" + cloudScore + "), re-subiendo local...");
        showToast("Datos locales mas recientes, sincronizando...");
        await saveToCloud();
      }
    } else {
      // No hay datos validos en la nube: subir lo que hay localmente
      await saveToCloud();
      showToast("Datos subidos a la nube");
    }

    // Activar listener en tiempo real
    if(fbUnsub) fbUnsub();
    fbUnsub = fbDb.collection("users").doc(fbUser.uid).onSnapshot(function(snap){
      if(!snap.exists) return;
      var d = snap.data().data;
      if(!_isValidData(d)) return;

      // Si este evento fue generado por un write propio de este dispositivo,
      // consumir el contador y salir SIN re-aplicar data desde Firestore.
      // El estado local ya es correcto (incluye deletes, edits, +1 cap, etc.).
      // Razon: si re-aplicaramos, migrate() podria borrar activityLog u otros
      // campos que solo existen localmente.
      if(_localWriteCount > 0){
        _localWriteCount--;
        if(_localWriteCount === 0 && _localWriteTimer){
          clearTimeout(_localWriteTimer);
          _localWriteTimer = null;
        }
        return;
      }

      // Evento externo (otro dispositivo o sesion diferente):
      // Aplicar guardia de score con umbral del 20% para tolerar diferencias
      // pequeñas (ej: otro dispositivo que no tenia un cap marcado).
      // Solo rechazar si la diferencia es SIGNIFICATIVA (vaciado accidental).
      var incomingScore = _cloudScoreOf(d);
      var currentScore  = _cloudScoreOf(data);
      var threshold = currentScore * 0.8;

      if(incomingScore < threshold){
        console.warn("[MANGU] onSnapshot externo bloqueado: nube (" + incomingScore + ") << local (" + currentScore + "), re-subiendo local...");
        saveToCloud();
        return;
      }

      // Aplicar snapshot externo: reemplazar data local con la version de la nube
      ["manga","anime"].forEach(function(t){ if(d[t]) d[t] = d[t].map(migrate); });
      data = d;
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
