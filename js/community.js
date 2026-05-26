
// PARCHE 2.2 — SISTEMA DE AMIGOS

let friendsState={
  view:"list",
  viewingUid:null,
  viewingData:null,
  searchUsername:"",
  searchResult:null,
  searchLoading:false,
  statusMsg:"",
  statusType:"",
  cachedUsername:null,
  usernameCacheUid:null,
  customPhotoUrl:null,
  activeTab:"friends",
  profileInlineTab:"all"
};

// ── COVER URL CACHE: maps title → HTTP cover URL fetched from Jikan ──
const _coverUrlCache=new Map();
async function fnFetchCoverUrl(title,type="manga"){
  if(!title) return "";
  const key=(type+":"+title).toLowerCase().trim();
  if(_coverUrlCache.has(key)){const v=_coverUrlCache.get(key);return v==="pending"?"":v;}
  _coverUrlCache.set(key,"pending");
  try{
    // Try the given type first, then the other
    const endpoints=[type==="manga"?"manga":"anime",type==="manga"?"anime":"manga"];
    for(const ep of endpoints){
      const r=await fetch(`https://api.jikan.moe/v4/${ep}?q=${encodeURIComponent(title)}&limit=1`);
      if(r.ok){
        const d=await r.json();
        const url=d?.data?.[0]?.images?.jpg?.image_url||"";
        if(url){_coverUrlCache.set(key,url);return url;}
      }
    }
    _coverUrlCache.set(key,"");return "";
  }catch(e){_coverUrlCache.set(key,"");return "";}
}


// Compress base64 cover to small thumbnail for Firestore (~2KB)
function compressCoverForProfile(dataUrl){
  return new Promise(resolve=>{
    if(!dataUrl||dataUrl.startsWith("http")){resolve(dataUrl||"");return;}
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas");
      c.width=40;c.height=57;
      c.getContext("2d").drawImage(img,0,0,40,57);
      resolve(c.toDataURL("image/jpeg",0.55));
    };
    img.onerror=()=>resolve("");
    img.src=dataUrl;
  });
}
async function fnSaveMyPublicProfile(){
  if(!fbUser||!fbDb) return;
  const uid=fbUser.uid;
  const mangaCount=data.manga.length;
  const animeCount=data.anime.length;
  const compressAll=async(list)=>Promise.all(list.map(async s=>({
    title:s.title,completed:s.completed.length,total:s.total,
    lastChapter:s.completed.length>0?Math.max(...s.completed):0,
    cover:await compressCoverForProfile(s.cover),
    status:s.status,lastUpdated:s.lastUpdated||0
  })));
  const topMangaRaw=data.manga.filter(s=>s.status==="reading")
    .sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,5);
  const topAnimeRaw=data.anime.filter(s=>s.status==="reading")
    .sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,5);
  const topManga=await compressAll(topMangaRaw);
  const topAnime=await compressAll(topAnimeRaw);
  const allManga=await compressAll(data.manga);
  const allAnime=await compressAll(data.anime);
  // Nota: usamos merge:true para no sobreescribir el username si ya existe
  try{
    await fbDb.collection("public_profiles").doc(uid).set({
      uid,
      displayName:fbUser.displayName||"",
      avatarUrl:fbUser.photoURL||"",
      mangaCount,animeCount,topManga,topAnime,allManga,allAnime,
      lastActive:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  }catch(e){console.warn("fnSaveMyPublicProfile:",e);}
}

async function fnRegisterUsername(username){
  if(!fbUser||!fbDb) return {ok:false,msg:"Debes iniciar sesion"};
  const clean=username.trim().toLowerCase().replace(/[^a-z0-9_]/g,"");
  if(clean.length<3) return {ok:false,msg:"Minimo 3 caracteres (letras, numeros, _)"};
  if(clean.length>20) return {ok:false,msg:"Maximo 20 caracteres"};
  try{
    // Verificar si username ya existe
    let checkDoc=null;
    try{
      checkDoc=await fbDb.collection("usernames").doc(clean).get();
    }catch(readErr){
      if(readErr.code==="permission-denied"){
        return {ok:false,msg:"Error de permisos — publica las reglas de Firestore (boton Publicar en la consola)"};
      }
    }
    if(checkDoc&&checkDoc.exists){
      // Si el doc existe y ya le pertenece a este usuario, permitir re-registro
      if(checkDoc.data().uid!==fbUser.uid){
        return {ok:false,msg:"Ese username ya esta tomado"};
      }
    }
    // Escribir el username — set() puro: si no existe = CREATE, si ya es del mismo user = OVERWRITE (permitido por la regla update)
    await fbDb.collection("usernames").doc(clean).set({
      uid:fbUser.uid,
      createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    // Escribir el perfil publico con merge:false para set completo
    await fbDb.collection("public_profiles").doc(fbUser.uid).set({
      uid:fbUser.uid,username:clean,
      displayName:fbUser.displayName||"",
      avatarUrl:fbUser.photoURL||"",
      mangaCount:data.manga.length,animeCount:data.anime.length,
      topManga:[],topAnime:[],allManga:[],allAnime:[],
      lastActive:firebase.firestore.FieldValue.serverTimestamp()
    });
    // Actualizar cache inmediatamente para que el siguiente render no lea Firestore
    friendsState.cachedUsername=clean;
    friendsState.usernameCacheUid=fbUser.uid;
    return {ok:true};
  }catch(e){
    if(e.code==="permission-denied"){
      return {ok:false,msg:"Error de permisos — ve a Firebase Console → Firestore → Reglas y haz clic en Publicar"};
    }
    return {ok:false,msg:"Error: "+e.message};
  }
}

async function fnGetMyUsername(forceRefresh=false){
  if(!fbUser||!fbDb) return null;
  // Usar cache si pertenece al mismo usuario y no se fuerza refresco
  if(!forceRefresh && friendsState.cachedUsername!==null && friendsState.usernameCacheUid===fbUser.uid){
    return friendsState.cachedUsername;
  }
  try{
    const doc=await fbDb.collection("public_profiles").doc(fbUser.uid).get();
    const username=doc.exists?doc.data().username||null:null;
    friendsState.cachedUsername=username;
    friendsState.usernameCacheUid=fbUser.uid;
    return username;
  }catch(e){return null;}
}

async function fnSearchUser(username){
  if(!fbDb||!fbUser) return null;
  const clean=username.trim().toLowerCase().replace(/[^a-z0-9_]/g,"");
  if(!clean) return null;
  try{
    const doc=await fbDb.collection("usernames").doc(clean).get();
    if(!doc.exists) return "not-found";
    const uid=doc.data().uid;
    if(uid===fbUser.uid) return "self";
    const profile=await fbDb.collection("public_profiles").doc(uid).get();
    if(!profile.exists) return "not-found";
    return {uid,profile:profile.data()};
  }catch(e){
    if(e.code==="permission-denied") return "perm-error";
    return null;
  }
}

async function fnSendRequest(toUid){
  if(!fbUser||!fbDb) return {ok:false,msg:"Sin sesion"};
  try{
    // Verificar que yo tengo username registrado (requerido para que el receptor pueda identificarme)
    const myProfile=await fbDb.collection("public_profiles").doc(fbUser.uid).get();
    const myUsername=myProfile.exists?myProfile.data().username||"":"";
    if(!myUsername) return {ok:false,msg:"Debes registrar tu @username antes de agregar amigos"};

    let isFriend=false,hasSent=false,hasReceived=false;
    try{
      const existing=await fbDb.collection("users").doc(fbUser.uid).collection("friends_accepted").doc(toUid).get();
      isFriend=existing.exists;
      const sentCheck=await fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").doc(toUid).get();
      hasSent=sentCheck.exists;
      // También verificar si ese usuario ya me envió solicitud (aceptar directamente)
      const recvCheck=await fbDb.collection("users").doc(fbUser.uid).collection("friends_received").doc(toUid).get();
      hasReceived=recvCheck.exists;
    }catch(readErr){console.warn("send request pre-check:",readErr.code);}
    if(isFriend) return {ok:false,msg:"Ya son amigos"};
    if(hasSent) return {ok:false,msg:"Solicitud ya enviada"};
    if(hasReceived) return {ok:false,msg:"Ese usuario ya te envió solicitud — acéptala desde tu panel de solicitudes"};

    const ts=firebase.firestore.FieldValue.serverTimestamp();
    // Escribir en mi colección friends_sent
    await fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").doc(toUid).set({
      toUid,ts,status:"pending"
    });
    // Escribir en la colección friends_received del destinatario
    // (requiere regla Firestore: allow create si request.auth.uid == fromUid)
    await fbDb.collection("users").doc(toUid).collection("friends_received").doc(fbUser.uid).set({
      fromUid:fbUser.uid,ts,status:"pending",
      displayName:fbUser.displayName||fbUser.email||"",
      username:myUsername,
      avatarUrl:fbUser.photoURL||""
    });
    return {ok:true};
  }catch(e){
    if(e.code==="permission-denied"){
      return {ok:false,msg:"Error de permisos — asegúrate de haber publicado las reglas de Firestore correctamente"};
    }
    return {ok:false,msg:"Error: "+e.message};
  }
}

async function fnSyncAcceptedRequests(){
  // Para cada solicitud enviada, verifica si el receptor ya la aceptó
  // (es decir, si yo aparezco en su friends_accepted)
  // Si es así, me agrego a mí mismo como amigo y limpio la solicitud enviada
  if(!fbUser||!fbDb) return;
  try{
    const sentSnap=await withTimeout(fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").get());
    for(const doc of sentSnap.docs){
      const toUid=doc.id;
      try{
        // Intenta leer si el receptor me tiene en su friends_accepted
        const acceptedDoc=await fbDb.collection("users").doc(toUid).collection("friends_accepted").doc(fbUser.uid).get();
        if(acceptedDoc.exists){
          // ¡Fue aceptado! Agregar a mis amigos y limpiar la solicitud enviada
          const theirProfile=await fbDb.collection("public_profiles").doc(toUid).get();
          const ts=firebase.firestore.FieldValue.serverTimestamp();
          await fbDb.collection("users").doc(fbUser.uid).collection("friends_accepted").doc(toUid).set({
            since:ts,uid:toUid,
            displayName:theirProfile.exists?theirProfile.data().displayName||"":"",
            username:theirProfile.exists?theirProfile.data().username||"":"",
            avatarUrl:theirProfile.exists?theirProfile.data().avatarUrl||"":""
          });
          await fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").doc(toUid).delete();
          showToast("✓ ¡"+( theirProfile.exists?theirProfile.data().displayName||"Usuario":"Usuario")+" aceptó tu solicitud!");
        }
      }catch(e){/* puede fallar por permisos si la otra persona no aceptó aún */}
    }
  }catch(e){console.warn("fnSyncAcceptedRequests:",e.message);}
}

async function fnAcceptRequest(fromUid,fromData){
  if(!fbUser||!fbDb) return;
  try{
    const ts=firebase.firestore.FieldValue.serverTimestamp();
    const myProfile=await fbDb.collection("public_profiles").doc(fbUser.uid).get();
    const myUsername=myProfile.exists?myProfile.data().username:"";

    // Solo escribimos en NUESTRAS propias colecciones (sin escritura cruzada)
    // 1. Agregar el remitente a MI lista de amigos aceptados
    await fbDb.collection("users").doc(fbUser.uid).collection("friends_accepted").doc(fromUid).set({
      since:ts,uid:fromUid,
      displayName:fromData.displayName||"",username:fromData.username||"",avatarUrl:fromData.avatarUrl||""
    });
    // 2. Eliminar la solicitud de MI friends_received
    await fbDb.collection("users").doc(fbUser.uid).collection("friends_received").doc(fromUid).delete();
    // 3. Escribir en MI friends_accepted un marcador especial que el remitente puede leer
    //    para saber que fue aceptado (él lo detecta vía su propia friends_sent → estado "accepted")
    // 4. Actualizar el estado en MI friends_sent del remitente hacia mí
    //    — NO podemos escribir en el doc del remitente sin reglas especiales,
    //    por eso usamos su public_profile para notificarle indirectamente.
    //    El remitente, al hacer Sync o abrir el panel, verá que está en friends_accepted del receptor.

    // Intentar limpiar su friends_sent (puede fallar por permisos — no es crítico)
    try{
      await fbDb.collection("users").doc(fromUid).collection("friends_sent").doc(fbUser.uid).delete();
    }catch(e){console.warn("No se pudo limpiar friends_sent del remitente:",e.code);}

    // Intentar escribir en su friends_accepted (puede fallar por permisos)
    try{
      await fbDb.collection("users").doc(fromUid).collection("friends_accepted").doc(fbUser.uid).set({
        since:ts,uid:fbUser.uid,
        displayName:fbUser.displayName||"",username:myUsername,avatarUrl:fbUser.photoURL||""
      });
    }catch(e){console.warn("No se pudo escribir friends_accepted del remitente:",e.code);}

    showToast("✓ ¡Amigo agregado!");
    friendsState.searchResult=null;
    renderFriendsPanel();
  }catch(e){
    showToast("Error al aceptar: "+(e.code||e.message));
  }
}

async function fnRejectRequest(fromUid){
  if(!fbUser||!fbDb) return;
  try{
    await fbDb.collection("users").doc(fbUser.uid).collection("friends_received").doc(fromUid).delete();
    try{
      await fbDb.collection("users").doc(fromUid).collection("friends_sent").doc(fbUser.uid).delete();
    }catch(e){console.warn("No se pudo limpiar friends_sent del remitente:",e.code);}
    renderFriendsPanel();
  }catch(e){showToast("Error al rechazar: "+e.message);}
}

async function fnCancelRequest(toUid){
  if(!fbUser||!fbDb) return;
  try{
    const batch=fbDb.batch();
    batch.delete(fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").doc(toUid));
    batch.delete(fbDb.collection("users").doc(toUid).collection("friends_received").doc(fbUser.uid));
    await batch.commit();
    showToast("Solicitud cancelada");
    renderFriendsPanel();
  }catch(e){showToast("Error al cancelar: "+e.message);}
}

async function fnRemoveFriend(friendUid){
  if(!fbUser||!fbDb) return;
  try{
    // Eliminamos NUESTRO propio friends_accepted (no necesitamos tocar el del otro)
    await fbDb.collection("users").doc(fbUser.uid).collection("friends_accepted").doc(friendUid).delete();
    // Intentar eliminar el nuestro del lado del amigo (puede fallar por permisos — no crítico)
    try{
      await fbDb.collection("users").doc(friendUid).collection("friends_accepted").doc(fbUser.uid).delete();
    }catch(e){console.warn("No se pudo limpiar friends_accepted del otro usuario:",e.code);}
    friendsState.view="list";friendsState.viewingUid=null;friendsState.viewingData=null;
    showToast("Amigo eliminado");
    renderFriendsPanel();
  }catch(e){showToast("Error al eliminar: "+e.message);}
}

// Helper: timeout para cualquier promesa de Firestore (evita cuelgues infinitos)
function withTimeout(promise,ms=8000){
  return Promise.race([
    promise,
    new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))
  ]);
}


// ── COMPATIBILIDAD DE GUSTOS ──
function calcCompatibility(myData, friendProfile){
  let score = 0;
  const myAll = [...(myData.manga||[]), ...(myData.anime||[])];
  const friendAll = [...(friendProfile?.allManga||friendProfile?.topManga||[]).map(s=>({...s,type:"M"})),
                     ...(friendProfile?.allAnime||friendProfile?.topAnime||[]).map(s=>({...s,type:"A"}))];
  if(!myAll.length || !friendAll.length) return {score:0,label:"Sin datos",color:"#4a5568"};

  // 1. Tags/géneros en común (50 pts)
  const myTags = new Set(myAll.flatMap(s=>s.tags||[]));
  const friendTags = new Set(friendAll.flatMap(s=>s.tags||[]));
  const commonTagCount = [...myTags].filter(t=>friendTags.has(t)).length;
  const tagUnion = new Set([...myTags,...friendTags]).size;
  const tagScore = tagUnion > 0 ? (commonTagCount / tagUnion) * 50 : 0;
  score += tagScore;

  // 2. Scores similares — diferencia promedio (25 pts)
  const myScored = myAll.filter(s=>s.score>0);
  const friendScored = friendAll.filter(s=>s.score>0);
  if(myScored.length && friendScored.length){
    const myAvg = myScored.reduce((s,x)=>s+x.score,0)/myScored.length;
    const frAvg = friendScored.reduce((s,x)=>s+(x.score||0),0)/friendScored.length;
    const diff = Math.abs(myAvg - frAvg);
    score += Math.max(0, 25 - diff*5); // max 25 pts, -5 por cada punto de diferencia
  } else score += 12; // neutral si no hay scores

  // 3. Series en común (25 pts)
  const myTitles = new Set(myAll.map(s=>(s.title||"").toLowerCase().trim()));
  const friendTitles = friendAll.map(s=>(s.title||"").toLowerCase().trim());
  const commonSeries = friendTitles.filter(t=>myTitles.has(t)).length;
  const maxPossible = Math.max(myTitles.size, friendAll.length, 1);
  score += Math.min(25, (commonSeries / Math.sqrt(maxPossible)) * 25);

  score = Math.round(Math.min(100, score));
  
  let label, color, emoji;
  if(score >= 90){label="Almas gemelas";color="#f59e0b";emoji="✨";}
  else if(score >= 75){label="Super compatible";color="#34d399";emoji="🔥";}
  else if(score >= 55){label="Buen match";color="#63b3ed";emoji="👌";}
  else if(score >= 35){label="Algo en común";color="#a78bfa";emoji="🤝";}
  else{label="Gustos distintos";color="#94a3b8";emoji="🎲";}
  
  return {score, label, color, emoji};
}

async function renderFriendsPanel(){
  const container=document.getElementById("friends-panel-container");
  if(!container) return;
  // Skeleton loading — muestra la estructura antes de que lleguen los datos
  container.innerHTML=`
    <div style="padding:0 0 8px">
      <div class="skel-card"><div class="skel-avatar"></div><div style="flex:1"><div class="skel-line med"></div><div class="skel-line short" style="margin-bottom:0"></div></div></div>
      <div class="skel-card"><div class="skel-avatar"></div><div style="flex:1"><div class="skel-line full"></div><div class="skel-line med" style="margin-bottom:0"></div></div></div>
      <div class="skel-card"><div class="skel-avatar"></div><div style="flex:1"><div class="skel-line med"></div><div class="skel-line short" style="margin-bottom:0"></div></div></div>
    </div>`;
  if(!fbUser){
    container.innerHTML=`<div class="fn-status">Inicia sesion con Google para usar el sistema de amigos</div>`;
    return;
  }
  try{
    await _renderFriendsPanelInner(container);
  }catch(err){
    const msg=err.message==="timeout"?"Tiempo de espera agotado — revisa tu conexion":"Error al cargar: "+err.message;
    container.innerHTML=`<div class="fn-status error" style="padding:24px;text-align:center">
      ${msg}<br><br>
      <button class="fn-btn sec" onclick="renderFriendsPanel()" style="margin:0 auto">Reintentar</button>
    </div>`;
  }
}

async function _renderFriendsPanelInner(container){
  // fnSaveMyPublicProfile NO va aqui — se llama desde saveLocal() al modificar datos,
  // no al renderizar la UI (causaba ciclo infinito con onSnapshot)
  const myUsername=await withTimeout(fnGetMyUsername());
  const ac=theme.accentManga||"#e74c6f";

  // Sincronizar solicitudes aceptadas por el remitente (detecta si alguien aceptó mi solicitud)
  fnSyncAcceptedRequests().catch(()=>{});

  // Vista perfil de amigo
  if(friendsState.view==="profile" && friendsState.viewingUid){
    let pData=friendsState.viewingData;
    if(!pData){
      const doc=await withTimeout(fbDb.collection("public_profiles").doc(friendsState.viewingUid).get());
      pData=doc.exists?doc.data():null;
    }
    if(!pData){container.innerHTML=`<div class="fn-status error">No se pudo cargar el perfil</div>`;return;}
    // ── solo username — sin displayName (privacidad)
    const _pUsername=pData.username||"usuario";
    // Avatar
    const _pAv=pData.avatarUrl
      ?`<img class="fn-profile-avatar" src="${pData.avatarUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`+`<div class="fn-profile-avatar-ph" style="display:none">${_pUsername.charAt(0).toUpperCase()}</div>`
      :`<div class="fn-profile-avatar-ph">${_pUsername.charAt(0).toUpperCase()}</div>`;
    const allSeries=[...(pData.allManga||pData.topManga||[]).map(s=>({...s,type:"M"})),
                     ...(pData.allAnime||pData.topAnime||[]).map(s=>({...s,type:"A"}))];
    const reading=allSeries.filter(s=>s.status==="reading").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
    const completed=allSeries.filter(s=>s.status==="completed").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,8);
    const paused=allSeries.filter(s=>s.status==="paused"||s.status==="plan").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,5);
    // stats globales
    const totalMangaCh=(pData.allManga||pData.topManga||[]).reduce((s,x)=>s+(x.completed||0),0);
    const totalAnimeEp=(pData.allAnime||pData.topAnime||[]).reduce((s,x)=>s+(x.completed||0),0);
    // banner color hash desde username
    const _uh=_pUsername;let _hv=0;for(let i=0;i<_uh.length;i++){_hv=(_hv*31+_uh.charCodeAt(i))&0xFFFFFF;}_hv=_hv%360;
    const _b1=`hsl(${_hv},65%,30%)`,_b2=`hsl(${(_hv+55)%360},60%,22%)`,_b3=`hsl(${(_hv+115)%360},55%,17%)`;
    // Serie más activa — solo URL HTTP para el banner (las Base64 son miniaturas 40x57 que se ven mal)
    const _topS=reading[0]||null;
    const _topSWithUrl=reading.find(s=>s.cover&&typeof s.cover==="string"&&s.cover.startsWith("http"))||null;
    let _topCoverUrl=_topSWithUrl?.cover||"";
    if(!_topCoverUrl&&_topS?.title){
      const _ck=((_topS.type==="A"?"anime":"manga")+":"+_topS.title).toLowerCase().trim();
      const _cv=_coverUrlCache.get(_ck);
      if(_cv&&_cv!=="pending") _topCoverUrl=_cv;
      else if(!_cv) fnFetchCoverUrl(_topS.title,_topS.type==="A"?"anime":"manga").then(url=>{
        if(url){
          // Actualización quirúrgica del banner del perfil expandido
          const bannerEl=document.getElementById("fp-banner-img");
          if(bannerEl){
            bannerEl.src=url;
            bannerEl.style.display="block";
            const lbl=document.getElementById("fp-banner-lbl");
            if(lbl) lbl.style.display="flex";
          } else {
            friendsState.viewingData=null;
            renderFriendsPanel();
          }
        }
      });
    }
    const _topPct=_topS&&_topS.total>0?Math.round((_topS.completed||0)/_topS.total*100):0;
    // Banner mejorado — pre-calcular estilos para evitar template literals anidados
    const _profBannerFallbackBg=`linear-gradient(135deg,${_b1} 0%,${_b2} 55%,${_b3} 100%)`;
    // FIX: mostrar label siempre (con o sin imagen de banner)
    const _chLabel=_topS?.type==="A"?"Ep.":"Cap.";
    const _profileBannerHtml=`<div class="fn-profile-banner-v5 fnv3-banner-profile" data-fnv3-un="${_pUsername}" style="position:relative;overflow:hidden;height:170px">
      <svg class="fnv3-banner-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;z-index:1"></svg>
      <div style="position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,rgba(8,12,20,.15) 0%,rgba(8,12,20,.5) 50%,rgba(8,12,20,1) 100%)"></div>
      <div class="fnv3-accent-line" id="fp-accent-line" style="position:absolute;top:0;left:0;right:0;height:3px;z-index:4"></div>
      ${_topS?`<div id="fp-banner-lbl" style="position:absolute;bottom:14px;left:18px;right:18px;z-index:3;display:flex;align-items:center;gap:8px">
        <span style="flex:1;min-width:0">
          <div style="font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:2px">${_topS.type==="A"?"🎬 Anime en progreso":"📖 Manga en progreso"}</div>
          <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 8px rgba(0,0,0,.9)">${_topS.title}</div>
          ${_topS.total>0?`<div style="margin-top:5px;height:3px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden"><div style="height:100%;width:${_topPct}%;background:rgba(255,255,255,.7);border-radius:2px"></div></div>`:""}
        </span>
        ${_topS.total>0?`<span style="font-size:10px;font-family:'Space Mono',monospace;font-weight:700;color:rgba(255,255,255,.55);background:rgba(0,0,0,.55);padding:3px 8px;border-radius:20px;flex-shrink:0;white-space:nowrap">${_chLabel} ${_topS.completed||0}/${_topS.total}</span>`:""}
      </div>`:""}
    </div>`;
    // series en común
    const myMangaTitles=new Set(data.manga.map(s=>s.title.toLowerCase().trim()));
    const myAnimeTitles=new Set(data.anime.map(s=>s.title.toLowerCase().trim()));
    const commonManga=(pData.allManga||pData.topManga||[]).filter(s=>myMangaTitles.has((s.title||"").toLowerCase().trim())).map(s=>s.title).slice(0,6);
    const commonAnime=(pData.allAnime||pData.topAnime||[]).filter(s=>myAnimeTitles.has((s.title||"").toLowerCase().trim())).map(s=>s.title).slice(0,6);
    const allCommon=[...commonManga,...commonAnime];
    // Compatibilidad — definir _pCompat en este scope
    const _pCompat=calcCompatibility(data,pData);
    // buildList mejorado
    const buildList=(arr,emptyMsg)=>{
      if(!arr.length) return `<div class="fn-status">${emptyMsg}</div>`;
      return `<div style="display:flex;flex-direction:column;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.06)">` + arr.map((s,idx)=>{
        const coverSrc=(s.cover&&typeof s.cover==="string"&&s.cover.length>10)?s.cover:"";
        const cvr=coverSrc
          ?`<img class="fn-series-cover" src="${coverSrc}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`+`<div class="fn-series-cover-ph" style="display:none;color:${s.type==='M'?'var(--am)':'var(--aa)'}">${s.title.charAt(0)}</div>`
          :`<div class="fn-series-cover-ph" style="display:flex;color:${s.type==='M'?'var(--am)':'var(--aa)'}">${s.title.charAt(0)}</div>`;
        const pct=s.total>0?Math.round((s.completed||0)/s.total*100):0;
        const lastCh=s.lastChapter||(s.completed)||0;
        const chLabel=s.type==="M"?"Cap.":"Ep.";
        const clr=s.type==="M"?ac:"var(--aa)";
        return `<div class="fn-series-item" style="background:${idx%2===0?'rgba(255,255,255,.02)':'rgba(255,255,255,.01)'}">
          ${cvr}
          <div class="fn-series-info">
            <div class="fn-series-title">${s.title}</div>
            <div class="fn-series-prog">${chLabel} <b style="color:var(--t1)">${lastCh}</b>${s.total>0?` / ${s.total} &nbsp;·&nbsp; <span style="color:${clr}">${pct}%</span>`:""}</div>
            <div class="fn-series-pbar"><div class="fn-series-pfill" style="width:${pct}%;background:${clr}"></div></div>
          </div>
          <span style="flex-shrink:0;font-size:9px;font-weight:700;color:${clr};background:${s.type==='M'?'var(--amd)':'var(--aad)'};padding:2px 7px;border-radius:10px;border:1px solid ${s.type==='M'?'rgba(99,179,237,.2)':'rgba(104,211,145,.2)'}">${s.type==="M"?"MANGA":"ANIME"}</span>
        </div>`;
      }).join("") + `</div>`;
    };
    const readingManga=reading.filter(s=>s.type==="M");
    const readingAnime=reading.filter(s=>s.type==="A");
    const vuid=friendsState.viewingUid;
    // Compare personal
    const myTotalCaps=data.manga.reduce((s,x)=>s+x.completed.length,0)+data.anime.reduce((s,x)=>s+x.completed.length,0);
    const friendTotalCaps=totalMangaCh+totalAnimeEp;
    const diffCaps=Math.abs(myTotalCaps-friendTotalCaps);
    const compareText=myTotalCaps>friendTotalCaps
      ?`Tú llevas <b style="color:${ac}">${diffCaps} caps más</b> en total`
      :myTotalCaps<friendTotalCaps
      ?`@${_pUsername} te lleva <b style="color:var(--dng)">${diffCaps} caps</b>`
      :`Están <b style="color:var(--suc)">empatados</b> en caps totales`;
    // Nivel estimado desde total de series
    const _lvl=Math.max(1,Math.floor(Math.sqrt((pData.mangaCount||0)+(pData.animeCount||0))));
    // Badges de logros
    const _profBadges=[];
    if((pData.mangaCount||0)===0&&(pData.animeCount||0)>0) _profBadges.push({t:"🎬 Solo anime",c:"var(--aa)",bg:"rgba(34,197,94,.08)",bd:"rgba(34,197,94,.22)"});
    if((pData.animeCount||0)===0&&(pData.mangaCount||0)>0) _profBadges.push({t:"📚 Solo manga",c:ac,bg:"rgba(99,179,237,.08)",bd:"rgba(99,179,237,.22)"});
    if(completed.length>=10) _profBadges.push({t:"🏆 Top lector",c:"#ffaa00",bg:"rgba(255,170,0,.1)",bd:"rgba(255,170,0,.28)"});
    if(_pCompat.score>=90) _profBadges.push({t:"✨ Alma gemela",c:"#f59e0b",bg:"rgba(245,158,11,.1)",bd:"rgba(245,158,11,.28)"});
    if(reading.length>0) _profBadges.push({t:"▶ Activo",c:"var(--suc)",bg:"rgba(0,255,136,.07)",bd:"rgba(0,255,136,.22)"});
    const _badgesHtml=_profBadges.slice(0,4).map(b=>`<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:9px;font-weight:700;color:${b.c};background:${b.bg};border:1px solid ${b.bd};letter-spacing:.02em">${b.t}</span>`).join("");
    container.innerHTML=`
      <div class="fn-profile" style="padding:0">
        <div style="padding:12px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05)">
          <button class="fn-btn sec" onclick="friendsState.view='list';friendsState.viewingUid=null;friendsState.viewingData=null;renderFriendsPanel()" style="font-size:11px;padding:6px 12px">&larr; Volver</button>
          <span style="flex:1"></span>
          <button style="padding:6px 12px;border:1px solid rgba(231,76,76,.3);background:rgba(231,76,76,.07);color:var(--t3);font-size:10px;border-radius:10px;cursor:pointer;font-weight:600;font-family:'Outfit',sans-serif;transition:.15s" onmouseover="this.style.color='var(--dng)';this.style.borderColor='var(--dng)'" onmouseout="this.style.color='var(--t3)';this.style.borderColor='rgba(231,76,76,.3)'" onclick="showModal('Eliminar amigo','¿Eliminar a @${_pUsername} de tus amigos?','❌',()=>fnRemoveFriend('${vuid}'))">✕ Eliminar</button>
        </div>
        ${_profileBannerHtml}
        <!-- IDENTIDAD: fondo sólido propio, NO superpuesto al banner -->
        <div style="background:#0d1219;padding:16px 18px 14px;border-bottom:1px solid rgba(255,255,255,.06)">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px">
            <!-- Avatar con fondo sólido para tapar el banner SVG -->
            <div style="position:relative;flex-shrink:0">
              ${_pAv}
              <div style="position:absolute;bottom:-4px;right:-4px;background:#0d1219;border:2px solid rgba(255,255,255,.12);border-radius:20px;padding:1px 7px;font-size:9px;font-weight:800;color:#a0b0cc;font-family:'Space Mono',monospace;white-space:nowrap">Lv${_lvl}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div class="fn-profile-name">@${_pUsername}</div>
              <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap;align-items:center">
                <span style="font-size:10px;color:var(--t3);font-family:'Space Mono',monospace">${pData.mangaCount||0}M · ${pData.animeCount||0}A</span>
                <span style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.18);flex-shrink:0;display:inline-block"></span>
                <span style="font-size:10px;color:var(--suc);font-family:'Space Mono',monospace;font-weight:700">${reading.length} en curso</span>
              </div>
            </div>
          </div>
          ${_badgesHtml?`<div style="display:flex;flex-wrap:wrap;gap:5px">${_badgesHtml}</div>`:""}
        </div>
        <!-- STATS -->
        <div class="fn-profile-stats" style="grid-template-columns:repeat(4,1fr)">
          <div class="fn-ps"><div class="fn-ps-v" style="color:${ac}">${totalMangaCh}</div><div class="fn-ps-l">📖 Caps</div></div>
          <div class="fn-ps"><div class="fn-ps-v" style="color:var(--aa)">${totalAnimeEp}</div><div class="fn-ps-l">▶ Eps</div></div>
          <div class="fn-ps"><div class="fn-ps-v" style="color:var(--wrn)">${completed.length}</div><div class="fn-ps-l">✅ Complet.</div></div>
          <div class="fn-ps"><div class="fn-ps-v" style="color:var(--purple)">${(pData.mangaCount||0)+(pData.animeCount||0)}</div><div class="fn-ps-l">🗂 Total</div></div>
        </div>
        <!-- COMPATIBILIDAD -->
        <div style="margin:14px 16px 10px;padding:14px 16px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.07);border-radius:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div>
              <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--t3);margin-bottom:3px">Compatibilidad de gustos</div>
              <div style="font-size:13px;font-weight:700;color:${_pCompat.color}">${_pCompat.emoji} ${_pCompat.label}</div>
            </div>
            <span style="font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:${_pCompat.color}">${_pCompat.score}%</span>
          </div>
          <div style="height:7px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;margin-bottom:10px">
            <div style="height:100%;width:${_pCompat.score}%;background:linear-gradient(90deg,${_pCompat.color}77,${_pCompat.color});border-radius:4px;transition:width .8s cubic-bezier(.34,1.56,.64,1)"></div>
          </div>
          <div style="font-size:11px;color:var(--t2)">${compareText}</div>
          ${allCommon.length>0?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)">
            <div style="font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:var(--t3);margin-bottom:7px">🤝 En común</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px">${allCommon.map(t=>`<span style="background:rgba(99,179,237,.1);border:1px solid rgba(99,179,237,.2);color:var(--t1);font-size:10px;padding:3px 10px;border-radius:20px">${t}</span>`).join("")}</div>
          </div>`:""}
        </div>
        <!-- TABS PROGRESO -->
        ${reading.length>0?`
        <div class="fn-prof-tabs" id="fn-prof-tabs-reading">
          <button class="fn-prof-tab${friendsState.profileInlineTab!=='anime'?' active':''}" onclick="friendsState.profileInlineTab='manga';document.getElementById('fn-prof-tab-manga').style.display='';document.getElementById('fn-prof-tab-anime').style.display='none';this.className='fn-prof-tab active';this.nextElementSibling.className='fn-prof-tab'">📚 Manga (${readingManga.length})</button>
          <button class="fn-prof-tab${friendsState.profileInlineTab==='anime'?' active':''}" onclick="friendsState.profileInlineTab='anime';document.getElementById('fn-prof-tab-manga').style.display='none';document.getElementById('fn-prof-tab-anime').style.display='';this.className='fn-prof-tab active';this.previousElementSibling.className='fn-prof-tab'">🎬 Anime (${readingAnime.length})</button>
        </div>
        <div id="fn-prof-tab-manga" style="padding:12px 16px 6px;${friendsState.profileInlineTab==='anime'?'display:none':''}">
          ${readingManga.length>0?buildList(readingManga,"—"):`<div class="fn-status">Sin manga en progreso</div>`}
        </div>
        <div id="fn-prof-tab-anime" style="padding:12px 16px 6px;${friendsState.profileInlineTab!=='anime'?'display:none':''}">
          ${readingAnime.length>0?buildList(readingAnime,"—"):`<div class="fn-status">Sin anime en progreso</div>`}
        </div>`:`<div class="fn-status" style="margin:14px 16px">Nada en progreso actualmente</div>`}
        ${completed.length>0?`
        <div style="padding:12px 16px 6px">
          <div class="fn-profile-list-title" style="padding:0 0 10px">✅ Últimos completados</div>
          ${buildList(completed,"—")}
        </div>`:""}
        ${paused.length>0?`
        <div style="padding:12px 16px 14px">
          <div class="fn-profile-list-title" style="padding:0 0 10px">⏸ En pausa / Pendientes</div>
          ${buildList(paused,"—")}
        </div>`:""}
        <div style="height:10px"></div>
      </div>`;
    return;
  }

  // Vista lista — todas las queries con timeout
  let received=[], friends=[], sent=[], receivedError=null, friendsError=null;
  try{
    const rSnap=await withTimeout(fbDb.collection("users").doc(fbUser.uid).collection("friends_received").get());
    received=rSnap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){receivedError=e.code||e.message;console.warn("friends_received:",e.code,e.message);}
  try{
    const fSnap=await withTimeout(fbDb.collection("users").doc(fbUser.uid).collection("friends_accepted").get());
    // Deduplicar por uid para evitar dobles entradas (bug amigo duplicado - Parche 2.5)
    const fAll=fSnap.docs.map(d=>({id:d.id,...d.data()}));
    const fSeen=new Set();
    friends=fAll.filter(f=>{
      const k=f.uid||f.id;
      if(!k||fSeen.has(k))return false;
      fSeen.add(k);
      return true;
    });
  }catch(e){friendsError=e.code||e.message;console.warn("friends_accepted:",e.code,e.message);}
  try{
    const sSnap=await withTimeout(fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").get());
    sent=sSnap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.warn("friends_sent:",e.message);}

  let html=`<div class="com-panel">
    <div class="com-header">
      <div class="com-header-title">👥 Comunidad</div>
      <button class="com-refresh-btn" onclick="renderFriendsPanel()" title="Actualizar">↻</button>
    </div>`;

  // ── Mi perfil card
  if(!myUsername){
    html+=`<div class="com-section-lbl">Mi usuario</div>
      <div class="com-setup">
        <div class="com-setup-desc">Elige un @username para que tus amigos puedan encontrarte</div>
        <input class="fn-input" id="fn-username-input" placeholder="ej: bandito" maxlength="20" style="margin-bottom:8px">
        <button class="fn-btn" id="fn-register-btn">Registrar @username</button>
        ${friendsState.statusMsg?`<div class="com-status-msg ${friendsState.statusType}" style="margin-top:8px">${friendsState.statusMsg}</div>`:""}
      </div>`;
  }else{
    const _storedPhoto=(()=>{try{return localStorage.getItem("fn-custom-photo-"+(fbUser?.uid||""))||"";}catch(e){return "";}})();
    if(_storedPhoto&&!friendsState.customPhotoUrl) friendsState.customPhotoUrl=_storedPhoto;
    const _customPhoto=_storedPhoto||friendsState.customPhotoUrl||"";
    const _photoSrc=_customPhoto||fbUser.photoURL||"";
    const _myInitial=(myUsername||"?").charAt(0).toUpperCase();

    // Serie más activa para el banner
    const _myReadingAll=[...data.manga.map(s=>({...s,_t:"M"})),...data.anime.map(s=>({...s,_t:"A"}))].filter(s=>s.status==="reading").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
    const _myTopS=_myReadingAll[0]||null;
    let _myBannerUrl=_myTopS?.cover&&typeof _myTopS.cover==="string"&&_myTopS.cover.startsWith("http")?_myTopS.cover:"";
    if(!_myBannerUrl&&_myTopS?.title){
      const _mck=((_myTopS._t==="A"?"anime":"manga")+":"+_myTopS.title).toLowerCase();
      const _mcc=_coverUrlCache.get(_mck);
      if(_mcc&&_mcc!=="pending") _myBannerUrl=_mcc;
      else if(!_mcc) fnFetchCoverUrl(_myTopS.title,_myTopS._t==="A"?"anime":"manga").then(url=>{
        if(url){const el=document.getElementById("my-banner-img");if(el){el.src=url;el.style.opacity="1";}}
      });
    }

    // Hash color for fallback gradient
    let _mhv=0;for(let i=0;i<myUsername.length;i++){_mhv=(_mhv*31+myUsername.charCodeAt(i))&0xFFFFFF;}_mhv=_mhv%360;
    const _myGrad=`linear-gradient(135deg,hsl(${_mhv},60%,22%) 0%,hsl(${(_mhv+60)%360},55%,16%) 100%)`;

    const _myTotalCaps=data.manga.reduce((s,x)=>s+x.completed.length,0)+data.anime.reduce((s,x)=>s+x.completed.length,0);

    // Avatar HTML
    const _myAv=_photoSrc
      ?`<div class="my-profile-avatar"><img src="${_photoSrc}" onerror="this.parentElement.textContent='${_myInitial}'"></div>`
      :`<div class="my-profile-avatar">${_myInitial}</div>`;

    html+=`<div class="my-profile-card" data-fnv3-un="${myUsername}">
      <div class="my-profile-banner">
        <svg class="fnv3-banner-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;z-index:1"></svg>
        <div class="fnv3-banner-grad my-profile-banner-overlay"></div>
        ${_myTopS?`<div class="my-profile-banner-label">${_myTopS.title}</div>`:""}
      </div>
      <div class="my-profile-body">
        ${_myAv}
        <div class="my-profile-info">
          <div class="my-profile-name">@${myUsername}</div>
          <div class="my-profile-sub">
            <span>${_myTotalCaps} caps</span>
            <span class="my-profile-sub-dot"></span>
            <span>${_myReadingAll.length} en curso</span>
          </div>
        </div>
        <div class="my-profile-actions">
          <button class="fn-btn sec" id="fn-change-user-btn" style="font-size:11px;padding:6px 10px" title="Cambiar @username">✏️ @</button>
          <button class="fn-btn sec" id="fn-change-photo-btn" style="font-size:11px;padding:6px 10px" title="Cambiar foto">🖼</button>
        </div>
      </div>
      <div id="fn-change-user-form" style="display:none" class="my-profile-form">
        <input class="fn-input" id="fn-username-input" placeholder="Nuevo @username" maxlength="20" value="${myUsername}" style="margin-bottom:8px">
        <button class="fn-btn" id="fn-register-btn" style="font-size:12px">Guardar</button>
        ${friendsState.statusMsg?`<div class="com-status-msg ${friendsState.statusType}" style="margin-top:8px">${friendsState.statusMsg}</div>`:""}
      </div>
      <div id="fn-change-photo-form" style="display:none" class="my-profile-form">
        <input id="fn-photo-url-input" class="fn-input" placeholder="URL de imagen (Imgur, etc.)" value="${_customPhoto}" style="margin-bottom:8px">
        <div style="display:flex;gap:6px">
          <button class="fn-btn" id="fn-save-photo-btn" style="font-size:11px">Guardar foto</button>
          ${_customPhoto?`<button class="fn-btn sec" id="fn-remove-photo-btn" style="font-size:11px">Quitar</button>`:""}
        </div>
        <div class="my-profile-form-hint">Pega una URL directa de imagen (ej: https://i.imgur.com/...)</div>
      </div>
    </div>`;
  }

  // ── Buscar amigo
  if(myUsername){
    html+=`<div class="com-section-lbl" style="margin-top:18px">Agregar amigo</div>
      <div class="com-search-box">
        <input class="com-search-input" id="fn-search-input" placeholder="@username del amigo" value="${friendsState.searchUsername}">
        <button class="com-search-btn" id="fn-search-btn">Buscar</button>
      </div>`;

    if(friendsState.searchResult==="perm-error"){
      html+=`<div class="com-status-msg error" style="margin-top:8px">Error de permisos — publica las reglas de Firestore</div>`;
    }else if(friendsState.searchResult==="not-found"){
      html+=`<div class="com-status-msg error" style="margin-top:8px">Usuario no encontrado</div>`;
    }else if(friendsState.searchResult==="self"){
      html+=`<div class="com-status-msg" style="margin-top:8px">Ese eres tú 😄</div>`;
    }else if(friendsState.searchResult && typeof friendsState.searchResult==="object"){
      const sr=friendsState.searchResult;
      const isFriend=friends.some(f=>f.uid===sr.uid);
      let hasSent=false;
      try{hasSent=(await withTimeout(fbDb.collection("users").doc(fbUser.uid).collection("friends_sent").doc(sr.uid).get())).exists;}catch(e){}
      const _srAv=sr.profile.avatarUrl
        ?`<div class="com-req-av" style="background:transparent"><img src="${sr.profile.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"></div>`
        :`<div class="com-req-av">${(sr.profile.username||"?").charAt(0).toUpperCase()}</div>`;
      html+=`<div class="com-result-card">
        ${_srAv}
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:var(--t1);font-family:'Space Mono',monospace">@${sr.profile.username||"usuario"}</div>
          <div style="font-size:10px;color:var(--t3);margin-top:2px">${sr.profile.mangaCount||0} manga · ${sr.profile.animeCount||0} anime</div>
        </div>
        ${isFriend?`<span style="font-size:11px;color:var(--suc);font-weight:700">✓ Amigos</span>`:
          hasSent?`<span style="font-size:11px;color:var(--t3)">Enviado</span>`:
          `<button class="fn-btn" id="fn-add-btn" data-uid="${sr.uid}" style="font-size:11px;padding:7px 14px">Agregar</button>`}
      </div>`;
    }
    if(friendsState.statusMsg) html+=`<div class="com-status-msg ${friendsState.statusType}" style="margin-top:8px">${friendsState.statusMsg}</div>`;
  }

  // ── Pre-cargar perfiles de amigos y construir feed (necesario antes de renderizar cards)
  const _friendProfiles=new Map();
  const _feedEvts=[];
  if(friends.length>0){
    for(const f of friends){
      try{
        const fDoc=await withTimeout(fbDb.collection("public_profiles").doc(f.uid).get());
        if(fDoc.exists)_friendProfiles.set(f.uid,fDoc.data());
      }catch(e){}
    }
    for(const [uid,fp] of _friendProfiles){
      const un=fp.username||"usuario";
      const allF=[...(fp.allManga||fp.topManga||[]).map(s=>({...s,_t:"M",uid,un})),
                  ...(fp.allAnime||fp.topAnime||[]).map(s=>({...s,_t:"A",uid,un}))];
      allF.sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
      allF.slice(0,3).forEach(s=>{
        if(!s.lastUpdated)return;
        const ageMs=Date.now()-s.lastUpdated;
        if(ageMs>30*24*3600*1000)return;
        _feedEvts.push({un,uid,title:s.title,_t:s._t,completed:s.completed||0,total:s.total||0,status:s.status,lastUpdated:s.lastUpdated,ageMs});
      });
    }
    _feedEvts.sort((a,b)=>a.ageMs-b.ageMs);
  }

  // ── Solicitudes recibidas (al fondo — menos urgente que ver a tus amigos)
  if(received.length>0){
    html+=`<div class="com-section-lbl" style="margin-top:22px">📨 Solicitudes (${received.length})</div>`;
    if(receivedError){
      html+=`<div class="com-status-msg error">Error al leer solicitudes — revisa las reglas de Firestore</div>`;
    }else{
      received.forEach(req=>{
        const _rn=req.username||"usuario";
        const _rav=req.avatarUrl
          ?`<div class="com-req-av"><img src="${req.avatarUrl}" onerror="this.parentElement.textContent='${_rn.charAt(0).toUpperCase()}'"></div>`
          :`<div class="com-req-av">${_rn.charAt(0).toUpperCase()}</div>`;
        html+=`<div class="com-req-card">${_rav}
          <div style="flex:1;min-width:0">
            <div class="com-req-name">@${_rn}</div>
          </div>
          <div class="com-req-btns">
            <button class="com-req-btn-accept" data-accept="${req.id}" data-dname="${(req.displayName||"").replace(/"/g,"&quot;")}" data-uname="${req.username||""}" data-avatar="${req.avatarUrl||""}">✓ Aceptar</button>
            <button class="com-req-btn-reject" data-reject="${req.id}">✕</button>
          </div></div>`;
      });
    }
  }

  // ── Solicitudes enviadas pendientes
  const friendUids=new Set(friends.map(f=>f.uid||f.id));
  sent=sent.filter(s=>!friendUids.has(s.id));
  if(sent.length>0){
    html+=`<div class="com-section-lbl" style="margin-top:18px">📤 Enviadas (${sent.length})</div>`;
    for(const s of sent){
      let sp=null;
      try{const sd=await withTimeout(fbDb.collection("public_profiles").doc(s.id).get());sp=sd.exists?sd.data():null;}catch(e){}
      const _sn=sp?.username||s.id;
      html+=`<div class="com-req-card">
        <div class="com-req-av">${_sn.charAt(0).toUpperCase()}</div>
        <div style="flex:1"><div class="com-req-name">@${_sn}</div></div>
        <button class="com-req-btn-reject" data-cancel="${s.id}">✕ Cancelar</button>
      </div>`;
    }
  }

  // ── Lista de amigos — PRIMERO, visible sin scrollear
  if(friends.length>0){
    // Ordenar por actividad más reciente primero
    const friendsSorted=[...friends].sort((a,b)=>{
      const fpA=_friendProfiles.get(a.uid);const fpB=_friendProfiles.get(b.uid);
      const allA=[...(fpA?.allManga||fpA?.topManga||[]),...(fpA?.allAnime||fpA?.topAnime||[])];
      const allB=[...(fpB?.allManga||fpB?.topManga||[]),...(fpB?.allAnime||fpB?.topAnime||[])];
      const latestA=allA.reduce((m,s)=>Math.max(m,s.lastUpdated||0),0);
      const latestB=allB.reduce((m,s)=>Math.max(m,s.lastUpdated||0),0);
      return latestB-latestA;
    });
    html+=`<div class="com-section-lbl" style="margin-top:16px">Mis amigos <span class="fnv3-count-badge">${friends.length}</span></div>
    <div class="com-friends-grid">`;
    for(const f of friendsSorted){
      const fp=_friendProfiles.get(f.uid)||null;
      const un=fp?.username||f.username||"usuario";
      const mC=fp?.mangaCount||0;const aC=fp?.animeCount||0;
      const allF=[...(fp?.allManga||fp?.topManga||[]).map(s=>({...s,_t:"M"})),
                  ...(fp?.allAnime||fp?.topAnime||[]).map(s=>({...s,_t:"A"}))];
      const readingF=allF.filter(s=>s.status==="reading").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
      const lastActive=allF.reduce((m,s)=>Math.max(m,s.lastUpdated||0),0);
      const lastActiveStr=lastActive>0?_histTimeAgo(lastActive):"";
      const isRecentlyActive=lastActive>Date.now()-3600000*24;

      // Paleta neón determinista por username
      const _pal=window.fnv3GetPalette?window.fnv3GetPalette(un):{neon:"#00ff88",dim:"rgba(0,255,136,.25)",accent:"linear-gradient(90deg,#00ff88,#00d4ff,transparent)",compatColor:"#00ff88"};

      const _avSrc=fp?.avatarUrl||f.avatarUrl||"";
      const _avHtml=_avSrc
        ?`<div class="fnv3-avatar" style="border-color:${_pal.neon};box-shadow:0 0 12px ${_pal.dim}"><img src="${_avSrc}" onerror="this.parentElement.innerHTML='${un.charAt(0).toUpperCase()}'"></div>`
        :`<div class="fnv3-avatar" style="border-color:${_pal.neon};box-shadow:0 0 12px ${_pal.dim};background:#141c2a">${un.charAt(0).toUpperCase()}</div>`;

      // Actividad reciente (top 3)
      const recentActivity=readingF.slice(0,3);
      const actHtml=recentActivity.length>0
        ? recentActivity.map(s=>{
            const pct=s.total>0?Math.round((s.completed||0)/s.total*100):0;
            const isM=s._t==="M";
            const clr=isM?ac:"var(--aa)";
            const glow=pct>80?`box-shadow:0 0 6px ${clr}55`:"";
            return `<div class="fnv3-act-item">
              <div class="fnv3-act-row">
                <span class="fnv3-type-tag" style="color:${clr};background:${isM?"rgba(99,179,237,.14)":"rgba(104,211,145,.12)"}">${s._t}</span>
                <span class="fnv3-act-title">${s.title}</span>
                ${s.total>0?`<span class="fnv3-act-cnt">${s.completed||0}/${s.total}</span>`:""}
              </div>
              ${s.total>0?`<div class="fnv3-act-bar"><div class="fnv3-act-fill" style="width:${pct}%;background:${clr};${glow}"></div></div>
              <div class="fnv3-act-pct" style="color:${clr}">${pct}%</div>`:""}
            </div>`;
          }).join("")
        : `<div class="fnv3-empty-act">Sin series en progreso</div>`;

      // Stats
      const totalCapsF=allF.reduce((s,x)=>s+(x.completed||0),0);
      const totalCompletedF=allF.filter(s=>s.status==="completed").length;
      const allFScored=allF.filter(s=>s.score>0);
      const avgFScore=allFScored.length>0?(allFScored.reduce((s,x)=>s+(x.score||0),0)/allFScored.length).toFixed(1):null;

      // Compatibilidad
      const _compat=calcCompatibility(data,fp||{});

      // Badges de logros
      const _badges=[];
      if(readingF.length===0&&allF.length>0)_badges.push(`<span class="fnv3-badge" style="color:#ffaa00;background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.28)">📦 En pausa</span>`);
      const _streakVal=(()=>{try{const k="p28-streak-"+(fbUser?.uid||"");const d=JSON.parse(localStorage.getItem(k)||"{}");return d.count||0;}catch(e){return 0;}})();
      if(f.uid===fbUser?.uid&&_streakVal>1)_badges.push(`<span class="fnv3-badge" style="color:#ffaa00;background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.28)">🔥 ${_streakVal}d racha</span>`);
      if(mC===0&&aC>0)_badges.push(`<span class="fnv3-badge" style="color:var(--aa);background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.22)">🎬 Solo anime</span>`);
      if(aC===0&&mC>0)_badges.push(`<span class="fnv3-badge" style="color:${ac};background:rgba(99,179,237,.08);border-color:rgba(99,179,237,.22)">📚 Solo manga</span>`);
      if(avgFScore&&parseFloat(avgFScore)>=8)_badges.push(`<span class="fnv3-badge" style="color:#bf5fff;background:rgba(191,95,255,.1);border-color:rgba(191,95,255,.28)">⭐ Score ${avgFScore}</span>`);
      if(_compat.score>=90)_badges.push(`<span class="fnv3-badge" style="color:${_pal.neon};background:rgba(0,255,136,.08);border-color:rgba(0,255,136,.25)">✨ Alma gemela</span>`);
      if(totalCompletedF>=10)_badges.push(`<span class="fnv3-badge" style="color:#ffaa00;background:rgba(255,170,0,.1);border-color:rgba(255,170,0,.28)">🏆 Top lector</span>`);
      if(isRecentlyActive&&_badges.length<3)_badges.push(`<span class="fnv3-badge" style="color:${_pal.neon};background:rgba(0,255,136,.08);border-color:rgba(0,255,136,.22)">🌐 Activo</span>`);
      const badgesHtml=_badges.slice(0,3).join("");

      // Timestamp
      const tsHtml=lastActiveStr?`<div class="fnv3-ts">${lastActiveStr}</div>`:"";
      // Online dot
      const dotHtml=isRecentlyActive?`<span class="fnv3-dot" style="background:${_pal.neon};box-shadow:0 0 6px ${_pal.neon}"></span>`:"";

      html+=`<div class="fnv3-card friend-card-v2" data-fc-uid="${f.uid}" data-view-uid="${f.uid}" data-fnv3-un="${un}">
        <div class="fnv3-accent-line" style="background:${_pal.accent}"></div>
        <div class="fnv3-banner friend-card-banner">
          <svg class="fnv3-banner-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;z-index:1"></svg>
          <div class="fnv3-banner-grad friend-card-banner-overlay"></div>
          ${tsHtml}
          ${recentActivity[0]?`<div class="fnv3-np friend-card-banner-label"><span class="fnv3-np-dot" style="background:${_pal.neon}"></span>${recentActivity[0].title}${recentActivity[0].total>0?" — "+(recentActivity[0]._t==="M"?"Cap.":"Ep.")+" "+(recentActivity[0].completed||0)+"/"+recentActivity[0].total:""}</div>`:""}
        </div>
        <div class="fnv3-body fc-v2-body">
          <div class="fnv3-header fc-v2-header">
            ${_avHtml}
            <div class="fnv3-info fc-v2-info">
              <div class="fnv3-name-row">
                <span class="fnv3-username friend-card-name">@${un}</span>
                ${dotHtml}
              </div>
              <div class="fnv3-submeta fc-v2-stats">${mC}M · ${aC}A${lastActiveStr?" · "+lastActiveStr:""}</div>
            </div>
            <button class="fnv3-del friend-card-remove" onclick="event.stopPropagation();showModal('Eliminar amigo','¿Eliminar a @${un} de tus amigos?','❌',()=>fnRemoveFriend('${f.uid}'))" title="Eliminar">✕</button>
          </div>
          <div class="fnv3-stats-grid">
            <div class="fnv3-stat"><span class="fnv3-stat-v" style="color:${_pal.neon}">${totalCapsF>999?(totalCapsF/1000).toFixed(1)+"k":totalCapsF}</span><span class="fnv3-stat-l">Caps+Eps</span></div>
            <div class="fnv3-stat fnv3-stat-sep"><span class="fnv3-stat-v" style="color:#bf5fff">${totalCompletedF}</span><span class="fnv3-stat-l">Complet.</span></div>
            <div class="fnv3-stat fnv3-stat-sep"><span class="fnv3-stat-v" style="color:#ffaa00">${mC+aC}</span><span class="fnv3-stat-l">Series</span></div>
            <div class="fnv3-stat fnv3-stat-sep"><span class="fnv3-stat-v" style="color:${_compat.color}">${_compat.score}%</span><span class="fnv3-stat-l">Match</span></div>
          </div>
          <div class="fnv3-compat-row">
            <div class="fnv3-compat-bar"><div class="fnv3-compat-fill" style="width:${_compat.score}%;background:linear-gradient(90deg,${_compat.color}88,${_compat.color})"></div></div>
            <span class="fnv3-compat-lbl" style="color:${_compat.color}">${_compat.score}% ${_compat.emoji} ${_compat.label}</span>
          </div>
          ${badgesHtml?`<div class="fnv3-badges">${badgesHtml}</div>`:""}
          ${recentActivity.length>0?`<div class="fnv3-act-label">Leyendo ahora</div>`:""}
          <div class="fc-v2-activity">${actHtml}</div>
        </div>
      </div>`;
    }
    html+=`</div>`; // cierre com-friends-grid
  } else {
    html+=`<div class="com-section-lbl" style="margin-top:16px">Mis amigos</div><div class="com-feed-empty">Sin amigos aún<br><span style="font-size:10px;opacity:.6">Búscalos por @username abajo</span></div>`;
  }

  // ── Feed de actividad de amigos (debajo de las cards)
  if(friends.length>0){
    html+=`<div class="com-section-lbl" style="margin-top:22px">📡 Actividad reciente</div>`;
    if(_feedEvts.length>0){
      html+=`<div class="com-feed">`;
      let _lastDay="";
      _feedEvts.slice(0,15).forEach(ev=>{
        const d=new Date(ev.lastUpdated);
        const today=new Date();const yesterday=new Date(today);yesterday.setDate(today.getDate()-1);
        const dk=d.toDateString();
        const dayLabel=dk===today.toDateString()?"Hoy":dk===yesterday.toDateString()?"Ayer":d.toLocaleDateString("es-CL",{day:"numeric",month:"short"});
        if(dk!==_lastDay){html+=`<div class="com-feed-day">${dayLabel}</div>`;_lastDay=dk;}
        let _fh=0;for(let i=0;i<ev.un.length;i++)_fh=(_fh*31+ev.un.charCodeAt(i))&0xFFFFFF;
        const _fc=`hsl(${_fh%360},60%,42%)`;const _fc2=`hsl(${(_fh%360+50)%360},55%,35%)`;
        const ageH=Math.floor(ev.ageMs/3600000);const ageMin=Math.floor(ev.ageMs/60000);
        const timeStr=ageMin<60?`${ageMin}m`:ageH<24?`${ageH}h`:`${Math.floor(ageH/24)}d`;
        const chL=ev._t==="M"?"Cap.":"Ep.";
        const pct=ev.total>0?Math.round(ev.completed/ev.total*100):0;
        let txt="";
        if(ev.status==="completed"){
          txt=`<span class="com-feed-badge done" style="margin-right:6px">✓ Completado</span><strong>${ev.title}</strong>`;
        }else{
          const bCls=ev._t==="M"?"m":"a";
          txt=`<strong>${ev.title}</strong><div class="com-feed-meta"><span class="com-feed-badge ${bCls}">${ev._t==="M"?"MANGA":"ANIME"}</span>${ev.total>0?`<span class="com-feed-pct">${chL} ${ev.completed}/${ev.total} · ${pct}%</span>`:""}</div>`;
        }
        const _barColor=ev._t==="M"?ac:"var(--aa)";
        html+=`<div class="com-feed-item">
          <div class="com-feed-av" style="background:linear-gradient(135deg,${_fc},${_fc2})">${ev.un.charAt(0).toUpperCase()}</div>
          <div class="com-feed-body">
            <div class="com-feed-user">@${ev.un}</div>
            <div class="com-feed-text">${txt}</div>
            ${ev.status!=="completed"&&ev.total>0?`<div class="com-feed-pbar"><div class="com-feed-pbar-fill" style="width:${pct}%;background:${ev._t==="M"?ac:"var(--aa)"}"></div></div>`:""}
          </div>
          <div class="com-feed-time">${timeStr}</div>
        </div>`;
      });
      html+=`</div>`;
    } else {
      html+=`<div class="com-feed-empty">Sin actividad reciente de tus amigos en los últimos 30 días</div>`;
    }
  }

  html+=`</div>`; // cierre com-panel
  container.innerHTML=html;


  // Event listeners
  const changeUserBtn=document.getElementById("fn-change-user-btn");
  if(changeUserBtn){
    changeUserBtn.onclick=()=>{
      const form=document.getElementById("fn-change-user-form");
      const photoForm=document.getElementById("fn-change-photo-form");
      if(form){
        const open=form.style.display==="none"||!form.style.display;
        form.style.display=open?"block":"none";
        if(photoForm&&open) photoForm.style.display="none";
        changeUserBtn.textContent=open?"✕":"✏️ @";
      }
    };
  }
  const changePhotoBtn=document.getElementById("fn-change-photo-btn");
  if(changePhotoBtn){
    changePhotoBtn.onclick=()=>{
      const form=document.getElementById("fn-change-photo-form");
      const userForm=document.getElementById("fn-change-user-form");
      if(form){
        const open=form.style.display==="none"||!form.style.display;
        form.style.display=open?"block":"none";
        if(userForm&&open) userForm.style.display="none";
      }
    };
  }
  const savePhotoBtn=document.getElementById("fn-save-photo-btn");
  if(savePhotoBtn){
    savePhotoBtn.onclick=()=>{
      const val=(document.getElementById("fn-photo-url-input")?.value||"").trim();
      try{localStorage.setItem("fn-custom-photo-"+fbUser.uid,val);}catch(e){}
      friendsState.customPhotoUrl=val;
      if(fbDb&&fbUser){fbDb.collection("public_profiles").doc(fbUser.uid).set({avatarUrl:val},{merge:true}).catch(()=>{});}
      showToast("Foto actualizada ✓");
      renderFriendsPanel();
    };
  }
  const removePhotoBtn=document.getElementById("fn-remove-photo-btn");
  if(removePhotoBtn){
    removePhotoBtn.onclick=()=>{
      try{localStorage.removeItem("fn-custom-photo-"+fbUser.uid);}catch(e){}
      friendsState.customPhotoUrl="";
      if(fbDb&&fbUser){fbDb.collection("public_profiles").doc(fbUser.uid).set({avatarUrl:fbUser.photoURL||""},{merge:true}).catch(()=>{});}
      showToast("Foto eliminada");
      renderFriendsPanel();
    };
  }
  const regBtn=document.getElementById("fn-register-btn");
  if(regBtn) regBtn.onclick=async()=>{
    const val=document.getElementById("fn-username-input")?.value||"";
    friendsState.statusMsg="Registrando...";friendsState.statusType="";renderFriendsPanel();
    const res=await fnRegisterUsername(val);
    friendsState.statusMsg=res.ok?"¡Username registrado!":res.msg;
    friendsState.statusType=res.ok?"success":"error";renderFriendsPanel();
  };
  const searchBtn=document.getElementById("fn-search-btn");
  if(searchBtn) searchBtn.onclick=async()=>{
    const val=document.getElementById("fn-search-input")?.value||"";
    friendsState.searchUsername=val;friendsState.searchResult=null;friendsState.statusMsg="";renderFriendsPanel();
    const res=await fnSearchUser(val);
    friendsState.searchResult=res;renderFriendsPanel();
  };
  const addBtn=document.getElementById("fn-add-btn");
  if(addBtn) addBtn.onclick=async()=>{
    const toUid=addBtn.dataset.uid;
    friendsState.statusMsg="Enviando solicitud...";friendsState.statusType="";renderFriendsPanel();
    const res=await fnSendRequest(toUid);
    friendsState.statusMsg=res.ok?"¡Solicitud enviada!":res.msg;
    friendsState.statusType=res.ok?"success":"error";renderFriendsPanel();
  };
  container.querySelectorAll("[data-accept]").forEach(btn=>{
    btn.onclick=async(e)=>{
      e.stopPropagation();
      btn.disabled=true;btn.textContent="Aceptando...";
      await fnAcceptRequest(btn.dataset.accept,{displayName:btn.dataset.dname,username:btn.dataset.uname,avatarUrl:btn.dataset.avatar});
    };
  });
  container.querySelectorAll("[data-reject]").forEach(btn=>{
    btn.onclick=async(e)=>{e.stopPropagation();await fnRejectRequest(btn.dataset.reject);};
  });
  container.querySelectorAll("[data-cancel]").forEach(btn=>{
    btn.onclick=async(e)=>{e.stopPropagation();showModal('Cancelar solicitud','¿Cancelar la solicitud de amistad enviada?','↩️',async()=>await fnCancelRequest(btn.dataset.cancel));};
  });
  container.querySelectorAll("[data-view-uid]").forEach(card=>{
    card.onclick=async()=>{
      friendsState.view="profile";friendsState.viewingUid=card.dataset.viewUid;friendsState.viewingData=null;renderFriendsPanel();
    };
  });
}

// FIN PARCHE 2.2

// ══════════════════════════════════════════════════════════════════
// FNV3 — GAMING NEON DESIGN SYSTEM
// Sistema completo: paletas, banners SVG procedurales, CSS neón.
// ══════════════════════════════════════════════════════════════════
(function fnv3Init(){
  // ── PALETAS NEÓN ────────────────────────────────────────────────
  const FNV3_PALETTES=[
    {bg:['#010d06','#011a0b'],cols:['#00ff88','#00cc6a','#00d4ff','#009950','#33ffaa'],neon:'#00ff88',dim:'rgba(0,255,136,.25)',accent:'linear-gradient(90deg,#00ff88,#00d4ff,transparent)',color:'#00ff88'},
    {bg:['#13001f','#1f0031'],cols:['#ff4da6','#dd3a8e','#bf5fff','#9933cc','#ff88cc'],neon:'#ff4da6',dim:'rgba(255,74,166,.25)',accent:'linear-gradient(90deg,#ff4da6,#bf5fff,transparent)',color:'#ff4da6'},
    {bg:['#00121f','#001d31'],cols:['#00d4ff','#0099cc','#ffaa00','#0077bb','#66eeff'],neon:'#00d4ff',dim:'rgba(0,212,255,.25)',accent:'linear-gradient(90deg,#00d4ff,#ffaa00,transparent)',color:'#00d4ff'},
    {bg:['#1b0a00','#290f00'],cols:['#ffaa00','#ff8800','#ff4da6','#ffcc33','#ffdd66'],neon:'#ffaa00',dim:'rgba(255,170,0,.25)',accent:'linear-gradient(90deg,#ffaa00,#ff4da6,transparent)',color:'#ffaa00'},
    {bg:['#0b001b','#140029'],cols:['#bf5fff','#9933cc','#00d4ff','#dd77ff','#ff4da6'],neon:'#bf5fff',dim:'rgba(191,95,255,.25)',accent:'linear-gradient(90deg,#bf5fff,#00d4ff,transparent)',color:'#bf5fff'},
  ];

  function fnv3hash(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))&0x7FFFFFFF;return h;}
  function fnv3rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/0xFFFFFFFF;};}

  window.fnv3GetPalette=function(un){return FNV3_PALETTES[fnv3hash(un||'x')%FNV3_PALETTES.length];};

  // ── GENERADOR SVG ───────────────────────────────────────────────
  const PATS=['triangles','hexagons','circuits'];
  window.fnv3DrawBanner=function(svg,un){
    const W=360,H=120;
    const h=fnv3hash(un||'x');
    const pal=FNV3_PALETTES[h%FNV3_PALETTES.length];
    const pat=PATS[(h>>3)%PATS.length];
    const r=fnv3rng(h);
    let out=`<rect width="${W}" height="${H}" fill="${pal.bg[0]}"/>`;
    for(let i=0;i<3;i++){
      const cx=(r()*.9+.05)*W,cy=r()*H,rx=55+r()*130,ry=28+r()*75;
      out+=`<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${pal.bg[1]}" opacity="${(.55+r()*.45).toFixed(2)}"/>`;
    }
    if(pat==='triangles'){
      for(let i=0;i<22;i++){
        const x1=r()*W,y1=r()*H,x2=x1+(r()-.5)*130,y2=y1+(r()-.5)*85,x3=x1+(r()-.5)*130,y3=y1+(r()-.5)*85;
        const col=pal.cols[Math.floor(r()*pal.cols.length)],op=(.04+r()*.16).toFixed(2);
        out+=`<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}" fill="${col}" opacity="${op}"/>`;
      }
      for(let i=0;i<12;i++){
        const col=pal.cols[Math.floor(r()*pal.cols.length)],op=(.07+r()*.18).toFixed(2);
        out+=`<line x1="${(r()*W).toFixed(1)}" y1="${(r()*H).toFixed(1)}" x2="${(r()*W).toFixed(1)}" y2="${(r()*H).toFixed(1)}" stroke="${col}" stroke-width="${(.5+r()*1.4).toFixed(1)}" opacity="${op}"/>`;
      }
    }else if(pat==='hexagons'){
      const hx=(cx,cy,s)=>Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return`${(cx+s*Math.cos(a)).toFixed(1)},${(cy+s*Math.sin(a)).toFixed(1)}`;}).join(' ');
      for(let i=0;i<26;i++){
        const cx=r()*W,cy=r()*H,s=6+r()*26,col=pal.cols[Math.floor(r()*pal.cols.length)],op=(.04+r()*.15).toFixed(2);
        if(r()>.5)out+=`<polygon points="${hx(cx,cy,s)}" fill="${col}" opacity="${op}"/>`;
        else out+=`<polygon points="${hx(cx,cy,s)}" fill="none" stroke="${col}" stroke-width="${(.5+r()*.9).toFixed(1)}" opacity="${(parseFloat(op)+.07).toFixed(2)}"/>`;
      }
    }else{
      const g=22;
      for(let i=0;i<28;i++){
        const x1=Math.round(r()*(W/g))*g,y1=Math.round(r()*(H/g))*g,col=pal.cols[Math.floor(r()*pal.cols.length)],op=(.09+r()*.2).toFixed(2);
        const horiz=r()>.5,x2=horiz?x1+(Math.ceil(r()*4))*g:x1,y2=horiz?y1:y1+(Math.ceil(r()*3))*g;
        out+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="${r()>.65?1.5:.6}" opacity="${op}"/>`;
        if(r()>.5)out+=`<circle cx="${x2}" cy="${y2}" r="${1+r()*2.8}" fill="${col}" opacity="${(parseFloat(op)+.1).toFixed(2)}"/>`;
      }
      for(let i=0;i<6;i++){
        const cx=r()*W,cy=r()*H,s=4+r()*10,col=pal.cols[Math.floor(r()*pal.cols.length)];
        out+=`<rect x="${(cx-s/2).toFixed(1)}" y="${(cy-s/2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="none" stroke="${col}" stroke-width=".6" opacity="${(.1+r()*.22).toFixed(2)}" transform="rotate(${(r()*45).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
      }
    }
    // puntos de brillo
    for(let i=0;i<7;i++){
      const col=pal.cols[Math.floor(r()*pal.cols.length)];
      out+=`<circle cx="${(r()*W).toFixed(1)}" cy="${(r()*H).toFixed(1)}" r="${(1.5+r()*4).toFixed(1)}" fill="${col}" opacity="${(.28+r()*.5).toFixed(2)}"/>`;
    }
    svg.innerHTML=out;
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    return pal;
  };

  // ── INICIALIZAR BANNERS ─────────────────────────────────────────
  function fnv3Apply(root){
    // Tarjetas de amigo
    (root||document).querySelectorAll('.fnv3-card[data-fnv3-un]').forEach(card=>{
      if(card.dataset.fnv3done==='1')return;
      card.dataset.fnv3done='1';
      const un=card.dataset.fnv3Un||'x';
      const svg=card.querySelector('.fnv3-banner-svg');
      if(svg)fnv3DrawBanner(svg,un);
    });
    // Mi perfil
    (root||document).querySelectorAll('.my-profile-card[data-fnv3-un]').forEach(card=>{
      if(card.dataset.fnv3done==='1')return;
      card.dataset.fnv3done='1';
      const un=card.dataset.fnv3Un||'me';
      const svg=card.querySelector('.fnv3-banner-svg');
      if(svg){
        const pal=fnv3DrawBanner(svg,un);
        const av=card.querySelector('.my-profile-avatar');
        if(av){av.style.borderColor=pal.neon;av.style.boxShadow=`0 0 14px ${pal.dim}`;}
      }
    });
    // Perfil expandido
    (root||document).querySelectorAll('.fnv3-banner-profile[data-fnv3-un]').forEach(banner=>{
      if(banner.dataset.fnv3done==='1')return;
      banner.dataset.fnv3done='1';
      const un=banner.dataset.fnv3Un||'x';
      const svg=banner.querySelector('.fnv3-banner-svg');
      if(!svg)return;
      const pal=fnv3DrawBanner(svg,un);
      const line=banner.querySelector('#fp-accent-line,.fnv3-accent-line');
      if(line)line.style.background=pal.accent;
      const prof=banner.closest('.fn-profile');
      if(prof){
        const av=prof.querySelector('.fn-profile-avatar,.fn-profile-avatar-ph');
        if(av){av.style.borderColor=pal.neon;av.style.boxShadow=`0 0 18px ${pal.dim}`;}
      }
    });
  }

  const fnv3obs=new MutationObserver(muts=>{
    for(const m of muts)for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      if(n.querySelector)fnv3Apply(n);
    }
  });
  fnv3obs.observe(document.body,{childList:true,subtree:true});
  fnv3Apply();

  // ── CSS GAMING NEÓN ─────────────────────────────────────────────
  if(document.getElementById('fnv3-css'))return;
  const st=document.createElement('style');
  st.id='fnv3-css';
  st.textContent=`
/* ── RESET / BASE ─────────────────────────────────────────────── */
.com-friends-grid{display:flex!important;flex-direction:column!important;gap:10px!important}

/* ── TARJETA (fnv3-card) ──────────────────────────────────────── */
.fnv3-card{border-radius:16px!important;overflow:hidden!important;position:relative!important;border:1px solid rgba(255,255,255,.08)!important;background:#0d1219!important;transition:transform .18s ease,box-shadow .18s ease!important;cursor:pointer!important}
.fnv3-card:hover{transform:translateY(-3px)!important;box-shadow:0 14px 44px rgba(0,0,0,.55)!important}
.fnv3-accent-line{position:absolute!important;top:0!important;left:0!important;right:0!important;height:2px!important;z-index:6!important;pointer-events:none!important}

/* ── BANNER ───────────────────────────────────────────────────── */
.fnv3-banner,.friend-card-banner{position:relative!important;height:110px!important;overflow:hidden!important;background:#0d1219!important}
@media(min-width:600px){.fnv3-banner,.friend-card-banner{height:120px!important}}
.fnv3-banner-grad,.friend-card-banner-overlay{position:absolute!important;inset:0!important;z-index:2!important;background:linear-gradient(to bottom,rgba(8,12,20,.05) 20%,rgba(8,12,20,.97) 100%)!important}
.fnv3-np,.friend-card-banner-label{position:absolute!important;top:10px!important;left:12px!important;right:auto!important;z-index:4!important;display:flex!important;align-items:center!important;gap:5px!important;background:rgba(8,12,20,.78)!important;border-radius:20px!important;padding:3px 10px 3px 6px!important;border:1px solid rgba(255,255,255,.1)!important;font-size:9px!important;font-weight:700!important;color:#f0f4ff!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:75%!important;text-shadow:none!important}
.fnv3-np-dot{width:6px!important;height:6px!important;border-radius:50%!important;flex-shrink:0!important;animation:fnv3pulse 2s infinite!important}
@keyframes fnv3pulse{0%,100%{opacity:1}50%{opacity:.3}}
.fnv3-ts{position:absolute!important;top:10px!important;right:10px!important;z-index:4!important;font-size:8px!important;font-weight:700!important;color:rgba(255,255,255,.55)!important;background:rgba(8,12,20,.72)!important;padding:3px 8px!important;border-radius:20px!important;font-family:'Space Mono',monospace!important;border:1px solid rgba(255,255,255,.08)!important}

/* ── AVATAR ───────────────────────────────────────────────────── */
.fnv3-avatar,.friend-card-avatar{width:50px!important;height:50px!important;border-radius:50%!important;border:2px solid #00ff88!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:19px!important;font-weight:800!important;color:#fff!important;flex-shrink:0!important;margin-top:-25px!important;position:relative!important;z-index:5!important;background:#141c2a!important}
.fnv3-avatar img,.friend-card-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}

/* ── BODY / HEADER ────────────────────────────────────────────── */
.fnv3-body,.fc-v2-body{padding:0 13px 13px!important}
.fnv3-header,.fc-v2-header{display:flex!important;align-items:flex-start!important;gap:10px!important;padding-bottom:11px!important;border-bottom:1px solid rgba(255,255,255,.05)!important}
.fnv3-info,.fc-v2-info{flex:1!important;min-width:0!important;padding-top:5px!important}
.fnv3-name-row{display:flex!important;align-items:center!important;gap:5px!important}
.fnv3-username,.friend-card-name{font-size:14px!important;font-weight:800!important;color:#f0f4ff!important;letter-spacing:-.01em!important;font-family:'Outfit',sans-serif!important}
.fnv3-dot{width:7px!important;height:7px!important;border-radius:50%!important;flex-shrink:0!important}
.fnv3-submeta,.fc-v2-stats{font-size:10px!important;color:#3d4e6a!important;margin-top:3px!important;font-family:'Space Mono',monospace!important;display:block!important}
.fnv3-del,.friend-card-remove{background:transparent!important;border:1px solid rgba(231,76,76,.18)!important;color:rgba(231,76,76,.35)!important;border-radius:8px!important;width:26px!important;height:26px!important;font-size:11px!important;cursor:pointer!important;transition:all .15s!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important;margin-top:3px!important}
.fnv3-del:hover,.friend-card-remove:hover{background:rgba(231,76,76,.15)!important;color:#f87171!important;border-color:#f87171!important}

/* ── STATS GRID ───────────────────────────────────────────────── */
.fnv3-stats-grid{display:flex!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:10px!important;overflow:hidden!important;margin:10px 0!important}
.fnv3-stat{flex:1!important;text-align:center!important;padding:8px 4px!important}
.fnv3-stat-sep{border-left:1px solid rgba(255,255,255,.07)!important}
.fnv3-stat-v{display:block!important;font-family:'Space Mono',monospace!important;font-size:15px!important;font-weight:700!important;line-height:1.2!important}
.fnv3-stat-l{display:block!important;font-size:8px!important;text-transform:uppercase!important;letter-spacing:.07em!important;color:#3d4e6a!important;margin-top:2px!important}

/* ── COMPAT ───────────────────────────────────────────────────── */
.fnv3-compat-row{display:flex!important;align-items:center!important;gap:7px!important;margin-bottom:10px!important}
.fnv3-compat-bar{flex:1!important;height:4px!important;background:rgba(255,255,255,.06)!important;border-radius:2px!important;overflow:hidden!important}
.fnv3-compat-fill{height:100%!important;border-radius:2px!important;transition:width .7s ease!important}
.fnv3-compat-lbl{font-size:9px!important;font-family:'Space Mono',monospace!important;font-weight:700!important;white-space:nowrap!important;max-width:130px!important;overflow:hidden!important;text-overflow:ellipsis!important}

/* ── BADGES ───────────────────────────────────────────────────── */
.fnv3-badges{display:flex!important;gap:5px!important;flex-wrap:wrap!important;margin-bottom:10px!important}
.fnv3-badge{display:inline-flex!important;align-items:center!important;padding:3px 9px!important;border-radius:20px!important;font-size:9px!important;font-weight:700!important;border:1px solid!important;letter-spacing:.02em!important;line-height:1.3!important}

/* ── ACTIVIDAD ────────────────────────────────────────────────── */
.fnv3-act-label{font-size:8px!important;font-weight:800!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#3d4e6a!important;margin-bottom:7px!important;display:flex!important;align-items:center!important;gap:6px!important}
.fnv3-act-label::after{content:''!important;flex:1!important;height:1px!important;background:rgba(255,255,255,.05)!important}
.fnv3-act-item{background:rgba(255,255,255,.025)!important;border:1px solid rgba(255,255,255,.055)!important;border-radius:10px!important;padding:8px 10px!important;margin-bottom:6px!important;transition:background .12s!important}
.fnv3-act-item:last-child{margin-bottom:0!important}
.fnv3-act-item:hover{background:rgba(255,255,255,.045)!important}
.fnv3-act-row{display:flex!important;align-items:center!important;gap:6px!important;margin-bottom:5px!important}
.fnv3-type-tag{font-size:8px!important;font-weight:700!important;padding:1px 6px!important;border-radius:4px!important;flex-shrink:0!important;letter-spacing:.3px!important}
.fnv3-act-title{flex:1!important;font-size:11px!important;font-weight:600!important;color:#f0f4ff!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.fnv3-act-cnt{font-size:9px!important;color:#3d4e6a!important;font-family:'Space Mono',monospace!important;flex-shrink:0!important}
.fnv3-act-bar{height:4px!important;border-radius:2px!important;background:rgba(255,255,255,.06)!important;overflow:hidden!important;margin-bottom:3px!important}
.fnv3-act-fill{height:100%!important;border-radius:2px!important;transition:width .4s!important}
.fnv3-act-pct{font-family:'Space Mono',monospace!important;font-size:10px!important;text-align:right!important;font-weight:700!important}
.fnv3-empty-act{font-size:10px!important;color:#3d4e6a!important;padding:4px 2px!important;font-style:italic!important}

/* ── MI PERFIL CARD ───────────────────────────────────────────── */
.my-profile-card{border-radius:16px!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.08)!important;background:#0d1219!important;margin-bottom:4px!important;position:relative!important}
.my-profile-banner{position:relative!important;height:95px!important;overflow:hidden!important;background:#0d1219!important}
.my-profile-banner-img{display:none!important}
.my-profile-banner-overlay,.fnv3-banner-grad{position:absolute!important;inset:0!important;z-index:2!important;background:linear-gradient(to bottom,rgba(8,12,20,.05) 20%,rgba(8,12,20,.97) 100%)!important}
.my-profile-banner-label{position:absolute!important;bottom:7px!important;left:13px!important;z-index:3!important;font-size:9px!important;font-weight:700!important;color:rgba(255,255,255,.65)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:70%!important}
.my-profile-body{display:flex!important;align-items:center!important;gap:11px!important;padding:0 13px 13px!important}
.my-profile-avatar{width:52px!important;height:52px!important;border-radius:50%!important;border:2px solid #00ff88!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:20px!important;font-weight:800!important;color:#fff!important;flex-shrink:0!important;margin-top:-26px!important;position:relative!important;z-index:3!important;background:#141c2a!important;box-shadow:0 0 14px rgba(0,255,136,.26)!important}
.my-profile-avatar img{width:100%!important;height:100%!important;object-fit:cover!important}
.my-profile-info{flex:1!important;min-width:0!important;padding-top:7px!important}
.my-profile-name{font-size:16px!important;font-weight:800!important;color:#f0f4ff!important;letter-spacing:-.015em!important}
.my-profile-sub{display:flex!important;align-items:center!important;gap:6px!important;font-size:10px!important;color:#3d4e6a!important;margin-top:3px!important;font-family:'Space Mono',monospace!important}
.my-profile-sub-dot{width:3px!important;height:3px!important;border-radius:50%!important;background:#3d4e6a!important;flex-shrink:0!important}
.my-profile-actions{display:flex!important;gap:6px!important;flex-shrink:0!important;padding-top:7px!important}
.my-profile-form{padding:0 13px 13px!important;border-top:1px solid rgba(255,255,255,.05)!important}
.my-profile-form-hint{font-size:10px!important;color:#3d4e6a!important;margin-top:6px!important}

/* ── PERFIL EXPANDIDO ─────────────────────────────────────────── */
.fn-profile{border-radius:16px!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.08)!important;background:#0d1219!important;animation:fnv3in .22s ease!important}
@keyframes fnv3in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.fn-profile-banner-v5{background:#0d1219!important}
.fn-profile-avatar{width:70px!important;height:70px!important;border-radius:50%!important;border:3px solid #00ff88!important;overflow:hidden!important;object-fit:cover!important;display:block!important;flex-shrink:0!important;box-shadow:0 0 20px rgba(0,255,136,.3)!important;background:#0d1219!important}
.fn-profile-avatar-ph{width:70px!important;height:70px!important;border-radius:50%!important;border:3px solid #00ff88!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:26px!important;font-weight:800!important;color:#fff!important;background:#0d1219!important;flex-shrink:0!important;box-shadow:0 0 20px rgba(0,255,136,.3)!important}
.fn-profile-name{font-size:21px!important;font-weight:900!important;color:#f0f4ff!important;letter-spacing:-.025em!important}
.fn-profile-stats{display:grid!important;border-top:1px solid rgba(255,255,255,.06)!important;border-bottom:1px solid rgba(255,255,255,.06)!important}
.fn-ps{text-align:center!important;padding:14px 5px!important;border-right:1px solid rgba(255,255,255,.06)!important;position:relative!important;overflow:hidden!important}
.fn-ps:last-child{border-right:none!important}
.fn-ps-v{display:block!important;font-family:'Space Mono',monospace!important;font-size:20px!important;font-weight:700!important;line-height:1.1!important}
.fn-ps-l{display:block!important;font-size:8px!important;color:#3d4e6a!important;text-transform:uppercase!important;letter-spacing:.08em!important;margin-top:3px!important}
.fn-prof-tabs{display:flex!important;border-bottom:1px solid rgba(255,255,255,.06)!important;padding:0 16px!important;margin-top:4px!important}
.fn-prof-tab{padding:10px 14px!important;font-size:11px!important;font-weight:700!important;color:#3d4e6a!important;border:none!important;border-bottom:2px solid transparent!important;background:none!important;cursor:pointer!important;transition:all .15s!important;font-family:'Outfit',sans-serif!important}
.fn-prof-tab.active{color:#f0f4ff!important;border-bottom-color:#00ff88!important}
.fn-series-item{display:grid!important;grid-template-columns:42px 1fr auto!important;align-items:center!important;gap:10px!important;padding:8px 12px!important;border-radius:10px!important;transition:background .1s!important;margin-bottom:3px!important}
.fn-series-item:hover{background:rgba(255,255,255,.04)!important}
.fn-series-cover{width:42px!important;height:58px!important;border-radius:6px!important;object-fit:cover!important;display:block!important;border:1px solid rgba(255,255,255,.08)!important}
.fn-series-cover-ph{width:42px!important;height:58px!important;border-radius:6px!important;background:rgba(255,255,255,.06)!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:16px!important;font-weight:800!important;flex-shrink:0!important;border:1px solid rgba(255,255,255,.08)!important}
.fn-series-info{min-width:0!important}
.fn-series-title{font-size:11px!important;font-weight:700!important;color:#d8e4f8!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;margin-bottom:2px!important}
.fn-series-prog{font-size:9px!important;color:#3d4e6a!important;font-family:'Space Mono',monospace!important;margin-bottom:5px!important}
.fn-series-pbar{height:3px!important;border-radius:2px!important;background:rgba(255,255,255,.07)!important;overflow:hidden!important}
.fn-series-pfill{height:100%!important;border-radius:2px!important;transition:width .5s ease!important}
.fn-profile-list-title{font-size:9px!important;font-weight:800!important;letter-spacing:.09em!important;text-transform:uppercase!important;color:#3d4e6a!important}
.fn-status{padding:16px!important;font-size:11px!important;color:#3d4e6a!important;text-align:center!important;font-style:italic!important}

/* ── FEED ─────────────────────────────────────────────────────── */
.com-feed{background:rgba(255,255,255,.018)!important;border:1px solid rgba(255,255,255,.06)!important;border-radius:16px!important;padding:5px!important;display:flex!important;flex-direction:column!important;gap:3px!important}
.com-feed-item{display:flex!important;align-items:center!important;gap:10px!important;padding:8px 10px!important;border-radius:11px!important;transition:background .12s!important}
.com-feed-item:hover{background:rgba(255,255,255,.035)!important}
.com-feed-av{width:32px!important;height:32px!important;border-radius:50%!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:13px!important;font-weight:800!important;color:#fff!important;flex-shrink:0!important}
.com-feed-day{font-size:8px!important;font-weight:800!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#3d4e6a!important;padding:6px 10px 2px!important}
.com-feed-user{font-size:10px!important;font-weight:700!important;color:#7a8aaa!important;font-family:'Space Mono',monospace!important}
.com-feed-body{flex:1!important;min-width:0!important}
.com-feed-text{font-size:11px!important;color:#f0f4ff!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.com-feed-pbar{height:3px!important;background:rgba(255,255,255,.07)!important;border-radius:2px!important;overflow:hidden!important;margin-top:4px!important}
.com-feed-pbar-fill{height:100%!important;border-radius:2px!important}
.com-feed-time{font-size:8px!important;color:#3d4e6a!important;font-family:'Space Mono',monospace!important;flex-shrink:0!important}
.com-feed-badge{font-size:8px!important;font-weight:700!important;padding:2px 7px!important;border-radius:8px!important}
.com-feed-badge.m{background:rgba(255,74,166,.14);color:#ff4da6}
.com-feed-badge.a{background:rgba(34,197,94,.1);color:#00ff88}
.com-feed-badge.done{background:rgba(0,212,255,.1);color:#00d4ff}
.com-feed-empty{text-align:center!important;padding:24px 16px!important;font-size:11px!important;color:#3d4e6a!important;background:rgba(255,255,255,.015)!important;border:1px dashed rgba(255,255,255,.06)!important;border-radius:14px!important}

/* ── SOLICITUDES / BÚSQUEDA ───────────────────────────────────── */
.com-req-card{display:flex!important;align-items:center!important;gap:12px!important;background:rgba(255,255,255,.022)!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:14px!important;padding:11px 13px!important;margin-bottom:8px!important;transition:background .12s!important}
.com-req-card:hover{background:rgba(255,255,255,.04)!important}
.com-req-av{width:38px!important;height:38px!important;border-radius:50%!important;background:rgba(255,255,255,.07)!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:15px!important;font-weight:800!important;color:#f0f4ff!important;overflow:hidden!important;flex-shrink:0!important}
.com-req-name{font-size:13px!important;font-weight:700!important;color:#f0f4ff!important;font-family:'Space Mono',monospace!important}
.com-req-btns{display:flex!important;gap:6px!important;flex-shrink:0!important}
.com-req-btn-accept{background:rgba(0,255,136,.1)!important;border:1px solid rgba(0,255,136,.26)!important;color:#00ff88!important;border-radius:8px!important;font-size:11px!important;font-weight:700!important;padding:5px 11px!important;cursor:pointer!important;transition:background .15s!important}
.com-req-btn-accept:hover{background:rgba(0,255,136,.22)!important}
.com-req-btn-reject{background:rgba(231,76,76,.08)!important;border:1px solid rgba(231,76,76,.18)!important;color:#f87171!important;border-radius:8px!important;font-size:11px!important;font-weight:700!important;padding:5px 10px!important;cursor:pointer!important;transition:background .15s!important}
.com-req-btn-reject:hover{background:rgba(231,76,76,.2)!important}
.com-section-lbl{font-size:9px!important;font-weight:800!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#3d4e6a!important;margin-bottom:9px!important;display:flex!important;align-items:center!important;gap:8px!important}
.com-section-lbl::after{content:''!important;flex:1!important;height:1px!important;background:linear-gradient(to right,rgba(255,255,255,.07),transparent)!important}
.fnv3-count-badge{font-size:9px!important;padding:1px 8px!important;border-radius:20px!important;background:rgba(0,255,136,.1)!important;border:1px solid rgba(0,255,136,.25)!important;color:#00ff88!important;font-family:'Space Mono',monospace!important;margin-left:4px!important;font-weight:700!important}
.com-search-box{display:flex!important;gap:8px!important;margin-bottom:4px!important}
.com-search-input{flex:1!important;background:rgba(255,255,255,.04)!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:12px!important;padding:10px 13px!important;font-size:12px!important;color:#f0f4ff!important;outline:none!important;transition:border-color .15s!important;font-family:'Outfit',sans-serif!important}
.com-search-input:focus{border-color:#00ff88!important;box-shadow:0 0 0 2px rgba(0,255,136,.1)!important}
.com-search-btn{background:#00ff88!important;border:none!important;border-radius:12px!important;padding:10px 17px!important;font-size:13px!important;font-weight:800!important;color:#080c14!important;cursor:pointer!important;transition:opacity .15s!important;font-family:'Outfit',sans-serif!important}
.com-search-btn:hover{opacity:.85!important}
.com-result-card{display:flex!important;align-items:center!important;gap:12px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:14px!important;padding:11px 13px!important;margin-top:8px!important}
.com-setup{background:rgba(255,255,255,.022)!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:14px!important;padding:14px!important;margin-bottom:4px!important}
.com-setup-desc{font-size:12px!important;color:#7a8aaa!important;margin-bottom:12px!important}
.com-status-msg{font-size:11px!important;padding:8px 12px!important;border-radius:10px!important;background:rgba(255,255,255,.03)!important;color:#7a8aaa!important}
.com-status-msg.success{color:#00ff88!important;background:rgba(0,255,136,.08)!important}
.com-status-msg.error{color:#f87171!important;background:rgba(231,76,76,.08)!important}
.fn-btn{background:#00ff88!important;color:#080c14!important;border:none!important;border-radius:10px!important;padding:8px 16px!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important;transition:opacity .15s!important;font-family:'Outfit',sans-serif!important}
.fn-btn:hover{opacity:.85!important}
.fn-btn.sec{background:rgba(255,255,255,.05)!important;color:#7a8aaa!important;border:1px solid rgba(255,255,255,.09)!important}
.fn-btn.sec:hover{background:rgba(255,255,255,.09)!important;color:#f0f4ff!important}
.fn-input{background:rgba(255,255,255,.04)!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:10px!important;padding:9px 12px!important;font-size:12px!important;color:#f0f4ff!important;width:100%!important;outline:none!important;transition:border-color .15s!important;font-family:'Outfit',sans-serif!important}
.fn-input:focus{border-color:#00ff88!important}
.com-panel{padding:2px 0!important}
.com-header-title{font-size:16px!important;font-weight:800!important;color:#f0f4ff!important}
.com-refresh-btn{width:30px!important;height:30px!important;border-radius:50%!important;background:rgba(255,255,255,.05)!important;border:1px solid rgba(255,255,255,.09)!important;color:#7a8aaa!important;font-size:14px!important;cursor:pointer!important;transition:all .15s!important}
.com-refresh-btn:hover{color:#00ff88!important;border-color:rgba(0,255,136,.3)!important}

/* ── RESPONSIVE ───────────────────────────────────────────────── */
@media(max-width:480px){
  .fn-profile-stats{grid-template-columns:repeat(2,1fr)!important}
  .fn-ps:nth-child(2){border-right:none!important}
  .fn-ps:nth-child(3){border-top:1px solid rgba(255,255,255,.06)!important}
  .fn-ps:nth-child(4){border-top:1px solid rgba(255,255,255,.06)!important;border-right:none!important}
  .fnv3-compat-lbl{display:none!important}
  .fnv3-banner,.friend-card-banner{height:95px!important}
}
  `;
  document.head.appendChild(st);
})();


