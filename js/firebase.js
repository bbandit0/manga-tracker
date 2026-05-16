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
//  7. Subir index.html actualizado a GitHub → listo
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
// Validar que Firestore Rules estén publicadas (solo avisa en consola, no bloquea)
if(location.hostname==="localhost"||location.hostname==="127.0.0.1"){
}
const FIREBASE_ENABLED = FIREBASE_CONFIG.apiKey !== "";
let fb=null,fbAuth=null,fbDb=null,fbUser=null,fbUnsub=null,fbUnsubFriends=null,pendingRequestsCount=0;
if(FIREBASE_ENABLED){try{fb=firebase.initializeApp(FIREBASE_CONFIG);fbAuth=firebase.auth();fbDb=firebase.firestore();
// Handle redirect result for Safari (popup blocked → redirect fallback)
fbAuth.getRedirectResult().then(result=>{if(result&&result.user){fbUser=result.user;loadFromCloud();}}).catch(()=>{});
fbAuth.onAuthStateChanged(async u=>{const prevUid=fbUser?fbUser.uid:null;fbUser=u;if(u){if(prevUid&&prevUid!==u.uid){data={manga:[],anime:[]};localStorage.removeItem("mat-v4-"+prevUid);}// FIX: Cargar username ANTES del primer render para evitar "Sin @username"
try{const doc=await fbDb.collection("public_profiles").doc(u.uid).get();if(doc.exists&&doc.data().username){friendsState.cachedUsername=doc.data().username;friendsState.usernameCacheUid=u.uid;}}catch(e){}loadFromCloud();}render();});}catch(e){console.warn("Firebase init error:",e);}}
async function signIn(){
  if(!FIREBASE_ENABLED)return showToast("Configura Firebase primero");
  try{
    const provider=new firebase.auth.GoogleAuthProvider();
    const result=await fbAuth.signInWithPopup(provider);
    if(result&&result.user){fbUser=result.user;loadFromCloud();}
  }catch(e){
    // Safari bloquea popups — usar redirect como fallback
    if(e.code==="auth/popup-blocked"||e.code==="auth/cancelled-popup-request"||e.code==="auth/popup-closed-by-user"){
      try{
        await fbAuth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
      }catch(re){showToast("Error al iniciar sesión: "+(re.code||re.message));}
    } else {
      showToast("Error al iniciar sesión: "+(e.code||e.message));
    }
  }
}
async function signOut(){if(fbUnsub)fbUnsub();fbUnsub=null;if(fbUnsubFriends)fbUnsubFriends();fbUnsubFriends=null;pendingRequestsCount=0;friendsState.cachedUsername=null;friendsState.usernameCacheUid=null;try{const keyToRemove=getSKEY();await fbAuth.signOut();fbUser=null;localStorage.removeItem(keyToRemove);data={manga:[],anime:[]};render();}catch(e){}}
async function saveToCloud(){if(!fbUser||!fbDb)return;try{await fbDb.collection("users").doc(fbUser.uid).set({data:JSON.parse(JSON.stringify(data)),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});fnSaveMyPublicProfile().catch(()=>{});}catch(e){console.warn("Cloud save:",e);}}
async function loadFromCloud(){if(!fbUser||!fbDb)return;try{const doc=await fbDb.collection("users").doc(fbUser.uid).get();if(doc.exists&&doc.data().data){const c=doc.data().data;["manga","anime"].forEach(t=>{if(c[t])c[t]=c[t].map(migrate);});data=c;saveLocal();render();showToast("✓ Sincronizado");setTimeout(()=>checkUpToDateNewChapters(),4000);}else{await saveToCloud();showToast("Datos subidos a la nube");}if(fbUnsub)fbUnsub();fbUnsub=fbDb.collection("users").doc(fbUser.uid).onSnapshot(snap=>{if(!snap.exists)return;const d=snap.data().data;if(!d)return;["manga","anime"].forEach(t=>{if(d[t])d[t]=d[t].map(migrate);});data=d;saveLocal();render();});if(fbUnsubFriends)fbUnsubFriends();fbUnsubFriends=fbDb.collection("users").doc(fbUser.uid).collection("friends_received").onSnapshot(snap=>{const prev=pendingRequestsCount;pendingRequestsCount=snap.size;const badge=document.getElementById("friends-badge");if(badge){badge.textContent=pendingRequestsCount>9?"9+":pendingRequestsCount;badge.style.display=pendingRequestsCount>0?"flex":"none";}if(tab==="friends"&&document.getElementById("friends-panel-container")){renderFriendsPanel();}if(pendingRequestsCount>prev&&document.readyState==="complete"){showToast("📨 Nueva solicitud de amistad");}},err=>{console.warn("friends_received listener:",err.message);});}catch(e){console.warn("Cloud load:",e);}}

