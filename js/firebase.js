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
// ── SEGURIDAD: la apiKey de Firebase es pública por diseño (se envía al browser),
// pero DEBES restringirla en Google Cloud Console → APIs & Services → Credentials
// → Application restrictions: HTTP referrers → agregar solo bbandit0.github.io/*
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

// ── FLAG: indica que el próximo evento onSnapshot fue generado por este mismo
// dispositivo (via saveToCloud). Cuando está activo, el onSnapshot omite la
// guardia de score y acepta el snapshot tal cual, porque refleja el estado
// local que ya fue aplicado (incluyendo deletes y edits legítimos).
let _localWritePending = false;
let _localWriteTimer = null;
function _markLocalWrite() {
  _localWritePending = true;
  // Ventana de 5s: si Firestore no dispara el onSnapshot en ese tiempo, resetear
  if(_localWriteTimer) clearTimeout(_localWriteTimer);
  _localWriteTimer = setTimeout(function(){ _localWritePending = false; }, 5000);
}

// ── GUARDIA: compara dos snapshots de data y decide si el incoming es "más rico"
// Criterio: suma de completed[] de todos los items. Un save() accidental con
// data vacía tiene score=0 y nunca pisará un estado local con progreso real.
// NOTA: este score NO se usa para bloquear writes propios (ver _localWritePending).
function _cloudScoreOf(d) {
  if(!d) return -1;
  var score = 0;
  ["manga","anime"].forEach(function(t) {
    if(Array.isArray(d[t])) {
      d[t].forEach(function(s) {
        score += (s.completed ? s.completed.length : 0) + 1; // +1 por existir
      });
    }
  });
  return score;
}

// ── GUARDIA: valida que un objeto data tenga estructura mínima usable
function _isValidData(d) {
  return d && typeof d === "object" && Array.isArray(d.manga) && Array.isArray(d.anime);
}

if(FIREBASE_ENABLED){
  try{
    fb = firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();

    // Handle redirect result for Safari (popup blocked → redirect fallback)
    fbAuth.getRedirectResult().then(function(result){
      if(result && result.user){ fbUser = result.user; loadFromCloud(); }
    }).catch(function(){});

    fbAuth.onAuthStateChanged(async function(u){
      var prevUid = fbUser ? fbUser.uid : null;
      fbUser = u;
      if(u){
        if(prevUid && prevUid !== u.uid){
          // Usuario distinto: limpiar estado anterior SIN tocar localStorage del nuevo uid
          data = {manga:[], anime:[]};
          localStorage.removeItem("mat-v4-" + prevUid);
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
    // Safari bloquea popups — usar redirect como fallback
    if(e.code==="auth/popup-blocked" || e.code==="auth/cancelled-popup-request" || e.code==="auth/popup-closed-by-user"){
      try{
        await fbAuth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
      }catch(re){ showToast("Error al iniciar sesión: " + (re.code || re.message)); }
    } else {
      showToast("Error al iniciar sesión: " + (e.code || e.message));
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
  // GUARDIA: nunca subir data vacía o inválida a la nube
  if(!_isValidData(data)){
    console.warn("[MANGU] saveToCloud bloqueado: data inválida", data);
    return;
  }
  var totalItems = (data.manga ? data.manga.length : 0) + (data.anime ? data.anime.length : 0);
  if(totalItems === 0){
    // Si local está vacío, verificar primero si la nube tiene datos antes de sobreescribir
    try{
      var check = await fbDb.collection("users").doc(fbUser.uid).get();
      if(check.exists && _isValidData(check.data().data) && _cloudScoreOf(check.data().data) > 0){
        console.warn("[MANGU] saveToCloud bloqueado: intento de subir vacío cuando nube tiene datos");
        return;
      }
    }catch(e){}
  }
  try{
    // Marcar ANTES del set() para que el onSnapshot que esto dispara
    // sea reconocido como write propio y no active la guardia de score
    _markLocalWrite();
    await fbDb.collection("users").doc(fbUser.uid).set({
      data: JSON.parse(JSON.stringify(data)),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
    fnSaveMyPublicProfile().catch(function(){});
  }catch(e){
    _localWritePending = false; // reset en caso de error
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
        // La nube tiene igual o más progreso: usar nube (caso normal)
        ["manga","anime"].forEach(function(t){ if(c[t]) c[t] = c[t].map(migrate); });
        data = c;
        saveLocal();
        render();
        showToast("✓ Sincronizado");
        setTimeout(function(){ checkUpToDateNewChapters(); }, 4000);
      } else {
        // Local tiene más progreso: re-subir local a la nube en lugar de pisar
        console.warn("[MANGU] loadFromCloud: local más completo (local=" + localScore + " nube=" + cloudScore + "), re-subiendo local...");
        showToast("✓ Datos locales más recientes, sincronizando...");
        await saveToCloud();
      }
    } else {
      // No hay datos en la nube: subir lo que hay localmente
      await saveToCloud();
      showToast("Datos subidos a la nube");
    }

    // Activar listener en tiempo real
    if(fbUnsub) fbUnsub();
    fbUnsub = fbDb.collection("users").doc(fbUser.uid).onSnapshot(function(snap){
      if(!snap.exists) return;
      var d = snap.data().data;
      if(!_isValidData(d)) return;

      // Si este evento fue generado por un write propio (saveToCloud de este dispositivo),
      // aceptarlo sin guardia: refleja el estado local que ya aplicamos, incluyendo
      // deletes, edits y cualquier reducción legítima de score.
      if(_localWritePending){
        _localWritePending = false;
        if(_localWriteTimer){ clearTimeout(_localWriteTimer); _localWriteTimer = null; }
        return; // no re-aplicar: data local ya está correcto
      }

      // Evento externo (otro dispositivo): aplicar guardia de score.
      // Solo rechazar si el score entrante es SIGNIFICATIVAMENTE menor (>20%),
      // para evitar falsos positivos por diferencias pequeñas.
      var incomingScore = _cloudScoreOf(d);
      var currentScore  = _cloudScoreOf(data);
      var threshold = currentScore * 0.8; // tolerar hasta 20% menos

      if(incomingScore < threshold){
        console.warn("[MANGU] onSnapshot externo bloqueado: nube (" + incomingScore + ") << local (" + currentScore + "), re-subiendo local...");
        saveToCloud();
        return;
      }

      ["manga","anime"].forEach(function(t){ if(d[t]) d[t] = d[t].map(migrate); });
      data = d;
      saveLocal();
      render();
    });

    // Listener solicitudes de amistad
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
          showToast("📨 Nueva solicitud de amistad");
        }
      }, function(err){ console.warn("friends_received listener:", err.message); });

  }catch(e){ console.warn("Cloud load:", e); }
}
