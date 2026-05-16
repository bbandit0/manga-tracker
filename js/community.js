
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
    const _profileBannerHtml=`<div class="fn-profile-banner-v5" style="position:relative;overflow:hidden;height:160px;background:${_profBannerFallbackBg}">
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0,rgba(255,255,255,.02) 1px,transparent 1px,transparent 18px),radial-gradient(ellipse 90% 90% at 15% 60%,rgba(104,211,145,.15) 0%,transparent 55%),radial-gradient(ellipse 70% 90% at 88% 20%,rgba(99,179,237,.12) 0%,transparent 55%);z-index:0"></div>
      <img id="fp-banner-img" src="${_topCoverUrl||''}" onerror="this.style.opacity=0" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center top;filter:brightness(.45) saturate(1.5);z-index:1;transition:opacity .7s ease;opacity:${_topCoverUrl?'1':'0'}">
      <div style="position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,rgba(0,0,0,.05) 0%,rgba(10,14,26,.9) 100%)"></div>
      ${_topS?`<div id="fp-banner-lbl" style="position:absolute;bottom:10px;left:20px;right:20px;display:flex;align-items:center;gap:8px;z-index:3"><span style="font-size:10px;font-weight:700;color:rgba(255,255,255,.75);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 8px rgba(0,0,0,.95)">&#9654; ${_topS.title}</span><span style="font-size:9px;font-family:Space Mono,monospace;color:rgba(255,255,255,.5);background:rgba(0,0,0,.5);padding:1px 6px;border-radius:4px;flex-shrink:0">${_topPct}%</span></div>`:""}
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
    container.innerHTML=`
      <div class="fn-profile" style="padding:0">
        <div style="padding:14px 16px 12px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05)">
          <button class="fn-btn sec" onclick="friendsState.view='list';friendsState.viewingUid=null;friendsState.viewingData=null;renderFriendsPanel()" style="font-size:11px;padding:6px 12px">&larr; Volver</button>
          <span style="flex:1"></span>
          <button style="padding:6px 12px;border:1px solid rgba(231,76,76,.3);background:rgba(231,76,76,.07);color:var(--t3);font-size:10px;border-radius:10px;cursor:pointer;font-weight:600;font-family:'Outfit',sans-serif;transition:.15s" onmouseover="this.style.color='var(--dng)';this.style.borderColor='var(--dng)'" onmouseout="this.style.color='var(--t3)';this.style.borderColor='rgba(231,76,76,.3)'" onclick="showModal('Eliminar amigo','¿Eliminar a @${_pUsername} de tus amigos?','❌',()=>fnRemoveFriend('${vuid}'))">✕ Eliminar</button>
        </div>
        ${_profileBannerHtml}
        <div style="display:flex;align-items:flex-end;gap:14px;padding:0 20px 16px;margin-top:-40px;position:relative;z-index:3;border-bottom:1px solid rgba(255,255,255,.06)">
          ${_pAv}
          <div style="flex:1;min-width:0;padding-bottom:2px">
            <div class="fn-profile-name">@${_pUsername}</div>
            <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap">
              <span style="font-size:10px;color:var(--t3);font-family:'Space Mono',monospace">${pData.mangaCount||0} manga</span>
              <span style="font-size:10px;color:var(--t3)">·</span>
              <span style="font-size:10px;color:var(--t3);font-family:'Space Mono',monospace">${pData.animeCount||0} anime</span>
              <span style="font-size:10px;color:var(--t3)">·</span>
              <span style="font-size:10px;color:var(--suc);font-family:'Space Mono',monospace">${reading.length} en curso</span>
            </div>
          </div>
        </div>
        <div class="fn-profile-stats" style="grid-template-columns:repeat(4,1fr)">
          <div class="fn-ps"><div class="fn-ps-v" style="color:${ac}">${totalMangaCh}</div><div class="fn-ps-l">📖 Caps</div></div>
          <div class="fn-ps"><div class="fn-ps-v" style="color:var(--aa)">${totalAnimeEp}</div><div class="fn-ps-l">▶ Eps</div></div>
          <div class="fn-ps"><div class="fn-ps-v" style="color:var(--wrn)">${completed.length}</div><div class="fn-ps-l">✅ Complet.</div></div>
          <div class="fn-ps"><div class="fn-ps-v" style="color:var(--purple)">${pData.mangaCount+pData.animeCount||0}</div><div class="fn-ps-l">🗂 Total</div></div>
        </div>
        <div style="margin:14px 16px 10px;padding:12px 16px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.07);border-radius:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--t3)">${_pCompat.emoji} ${_pCompat.label}</span>
            <span style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${_pCompat.color}">${_pCompat.score}%</span>
          </div>
          <div style="height:6px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;margin-bottom:10px">
            <div style="height:100%;width:${_pCompat.score}%;background:linear-gradient(90deg,${_pCompat.color}99,${_pCompat.color});border-radius:4px;transition:width .8s cubic-bezier(.34,1.56,.64,1)"></div>
          </div>
          <div style="font-size:11px;color:var(--t2)">${compareText}</div>
        </div>
        ${allCommon.length>0?`
        <div style="margin:0 16px 14px;padding:12px 14px;background:rgba(99,179,237,.06);border:1px solid rgba(99,179,237,.15);border-radius:12px">
          <div style="font-size:9px;font-weight:700;color:${ac};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">🤝 En común</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px">${allCommon.map(t=>`<span style="background:rgba(99,179,237,.12);border:1px solid rgba(99,179,237,.22);color:var(--t1);font-size:10px;padding:3px 9px;border-radius:20px">${t}</span>`).join("")}</div>
        </div>`:""} 
        ${reading.length>0?`
        <div class="fn-prof-tabs" id="fn-prof-tabs-reading">
          <button class="fn-prof-tab${friendsState.profileInlineTab!=='anime'?' active':''}" onclick="friendsState.profileInlineTab='manga';document.getElementById('fn-prof-tab-manga').style.display='';document.getElementById('fn-prof-tab-anime').style.display='none';this.className='fn-prof-tab active';this.nextElementSibling.className='fn-prof-tab'">📚 Manga (${readingManga.length})</button>
          <button class="fn-prof-tab${friendsState.profileInlineTab==='anime'?' active':''}" onclick="friendsState.profileInlineTab='anime';document.getElementById('fn-prof-tab-manga').style.display='none';document.getElementById('fn-prof-tab-anime').style.display='';this.className='fn-prof-tab active';this.previousElementSibling.className='fn-prof-tab'">🎬 Anime (${readingAnime.length})</button>
        </div>
        <div id="fn-prof-tab-manga" style="padding:14px 16px 6px;${friendsState.profileInlineTab==='anime'?'display:none':''}">
          ${readingManga.length>0?buildList(readingManga,"—"):`<div class="fn-status">Sin manga en progreso</div>`}
        </div>
        <div id="fn-prof-tab-anime" style="padding:14px 16px 6px;${friendsState.profileInlineTab!=='anime'?'display:none':''}">
          ${readingAnime.length>0?buildList(readingAnime,"—"):`<div class="fn-status">Sin anime en progreso</div>`}
        </div>`:`<div class="fn-status" style="margin:14px 16px">Nada en progreso actualmente</div>`}
        ${completed.length>0?`
        <div style="padding:14px 16px 6px">
          <div class="fn-profile-list-title" style="padding:0 0 10px">✅ Últimos completados</div>
          ${buildList(completed,"—")}
        </div>`:""}
        ${paused.length>0?`
        <div style="padding:14px 16px 14px">
          <div class="fn-profile-list-title" style="padding:0 0 10px">⏸ En pausa / Pendientes</div>
          ${buildList(paused,"—")}
        </div>`:""}
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

    html+=`<div class="my-profile-card">
      <div class="my-profile-banner" style="${_myBannerUrl?"":"background:"+_myGrad}">
        <img id="my-banner-img" class="my-profile-banner-img" src="${_myBannerUrl||""}" style="opacity:${_myBannerUrl?1:0}" onerror="this.style.opacity=0">
        <div class="my-profile-banner-overlay"></div>
        ${_myTopS?`<div class="my-profile-banner-label" title="${_myTopS.title}">${_myTopS.title}</div>`:""}
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
    html+=`<div class="com-section-lbl" style="margin-top:16px">Mis amigos <span style="font-size:9px;padding:1px 7px;border-radius:20px;background:rgba(255,255,255,.07);color:var(--t2);font-family:'Space Mono',monospace;margin-left:4px;font-weight:700">${friends.length}</span></div>
    <div class="com-friends-grid">`;
    for(const f of friendsSorted){
      const fp=_friendProfiles.get(f.uid)||null;
      const un=fp?.username||f.username||"usuario";
      const mC=fp?.mangaCount||0;const aC=fp?.animeCount||0;
      const allF=[...(fp?.allManga||fp?.topManga||[]).map(s=>({...s,_t:"M"})),
                  ...(fp?.allAnime||fp?.topAnime||[]).map(s=>({...s,_t:"A"}))];
      const readingF=allF.filter(s=>s.status==="reading").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
      const readingCount=readingF.length;
      const lastActive=allF.reduce((m,s)=>Math.max(m,s.lastUpdated||0),0);
      const lastActiveStr=lastActive>0?_histTimeAgo(lastActive):"";
      const isRecentlyActive=lastActive>Date.now()-3600000*24;
      const topS=readingF.find(s=>s.cover&&typeof s.cover==="string"&&s.cover.startsWith("http"))||readingF[0]||null;
      let bannerUrl=topS?.cover&&typeof topS.cover==="string"&&topS.cover.startsWith("http")?topS.cover:"";
      if(!bannerUrl&&topS?.title){
        const _ck=((topS._t==="A"?"anime":"manga")+":"+topS.title).toLowerCase();
        const _cc=_coverUrlCache.get(_ck);
        if(_cc&&_cc!=="pending") bannerUrl=_cc;
        else if(!_cc){
          fnFetchCoverUrl(topS.title,topS._t==="A"?"anime":"manga").then(url=>{
            if(url){
              const el=document.querySelector(`[data-fc-uid="${f.uid}"] .friend-card-banner-img`);
              if(el){el.style.transition="opacity .5s ease";el.src=url;el.onload=()=>{el.style.opacity="1";};}
            }
          });
        }
      }
      let _h=0;for(let i=0;i<un.length;i++){_h=(_h*31+un.charCodeAt(i))&0xFFFFFF;}_h=_h%360;
      const _grad=`linear-gradient(135deg,hsl(${_h},65%,22%) 0%,hsl(${(_h+60)%360},58%,15%) 100%)`;
      const _avSrc=fp?.avatarUrl||f.avatarUrl||"";
      const _avHtml=_avSrc
        ?`<div class="friend-card-avatar"><img src="${_avSrc}" onerror="this.parentElement.textContent='${un.charAt(0).toUpperCase()}'"></div>`
        :`<div class="friend-card-avatar" style="background:linear-gradient(135deg,hsl(${_h},65%,42%),hsl(${(_h+50)%360},58%,33%))">${un.charAt(0).toUpperCase()}</div>`;

      // Actividad reciente (top 3)
      const recentActivity=readingF.slice(0,3);

      const actHtml=recentActivity.length>0
        ? recentActivity.map(s=>{
            const pct=s.total>0?Math.round((s.completed||0)/s.total*100):0;
            const barClr=s._t==="M"?ac:"var(--aa)";
            const barGlow=pct>80?`;box-shadow:0 0 6px ${barClr}66`:"";
            const typeTag=s._t==="M"
              ?`<span style="font-size:8px;font-weight:700;color:${ac};background:rgba(99,179,237,.15);padding:1px 6px;border-radius:4px;flex-shrink:0;letter-spacing:.3px">M</span>`
              :`<span style="font-size:8px;font-weight:700;color:var(--aa);background:rgba(104,211,145,.13);padding:1px 6px;border-radius:4px;flex-shrink:0;letter-spacing:.3px">A</span>`;
            return `<div class="fc-activity-item">
              <div class="fc-act-top">${typeTag}<span class="fc-act-title">${s.title}</span>${s.total>0?`<span style="font-size:9px;color:var(--t3);font-family:'Space Mono',monospace;flex-shrink:0">${s.completed||0}/${s.total}</span>`:""}
              </div>
              ${s.total>0?`<div class="fc-act-bar"><div class="fc-act-fill" style="width:${pct}%;background:${barClr}${barGlow}"></div></div>
              <div class="fc-act-pct" style="color:${barClr};font-weight:700">${pct}%</div>`:""}
            </div>`;
          }).join("")
        : `<div style="font-size:10px;color:var(--t3);padding:4px 2px;font-style:italic">Sin series en progreso</div>`;

      // Stats extra: completados totales
      const totalCompletedF=(fp?.allManga||fp?.topManga||[]).filter(s=>s.status==="completed").length+(fp?.allAnime||fp?.topAnime||[]).filter(s=>s.status==="completed").length;
      const allFScored=[...(fp?.allManga||fp?.topManga||[]),...(fp?.allAnime||fp?.topAnime||[])].filter(s=>s.score>0);
      const avgFScore=allFScored.length>0?(allFScored.reduce((s,x)=>s+(x.score||0),0)/allFScored.length).toFixed(1):null;
      const _compat=calcCompatibility(data,fp||{});
      const compatBar=_compat.score>0?`<div style="display:flex;align-items:center;gap:5px;margin-top:5px">
        <div style="flex:1;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden"><div style="height:100%;width:${_compat.score}%;background:linear-gradient(90deg,${_compat.color}88,${_compat.color});border-radius:2px;transition:width .6s ease"></div></div>
        <span style="font-size:9px;color:${_compat.color};font-family:'Space Mono',monospace;font-weight:700;white-space:nowrap">${_compat.score}% ${_compat.emoji}</span>
      </div>`:"";
      // Dot "activo recientemente"
      const activeDot=isRecentlyActive?`<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 6px #34d39988;flex-shrink:0;margin-left:2px" title="Activo recientemente"></span>`:"";

      html+=`<div class="friend-card-v2" data-fc-uid="${f.uid}" data-view-uid="${f.uid}">
        <div class="friend-card-banner" style="${bannerUrl?"":"background:"+_grad}">
          <img class="friend-card-banner-img" src="${bannerUrl||""}" style="opacity:${bannerUrl?1:0}" onerror="this.style.opacity=0">
          <div class="friend-card-banner-overlay"></div>
          ${topS?`<div class="friend-card-banner-label">${topS.title}</div>`:""}
          ${lastActiveStr?`<div style="position:absolute;top:8px;right:8px;z-index:3;font-size:8px;font-weight:700;color:rgba(255,255,255,.7);background:rgba(0,0,0,.55);padding:2px 7px;border-radius:10px;backdrop-filter:blur(4px);font-family:'Space Mono',monospace">${lastActiveStr}</div>`:""}
        </div>
        <div class="fc-v2-body">
          <div class="fc-v2-header">
            ${_avHtml}
            <div class="fc-v2-info">
              <div style="display:flex;align-items:center;gap:5px"><div class="friend-card-name" style="font-size:14px">@${un}</div>${activeDot}</div>
              <div class="fc-v2-stats">
                <span style="color:${ac};font-weight:700">${mC}M</span>
                <span style="color:var(--t3)">·</span>
                <span style="color:var(--aa);font-weight:700">${aC}A</span>
                ${avgFScore?`<span style="color:var(--t3)">·</span><span style="color:var(--wrn)">★${avgFScore}</span>`:""}
                ${totalCompletedF>0?`<span style="color:var(--t3)">·</span><span style="color:var(--suc)">✓${totalCompletedF}</span>`:""}
              </div>
              ${compatBar}
            </div>
            <button onclick="event.stopPropagation();showModal('Eliminar amigo','¿Eliminar a @${un} de tus amigos?','❌',()=>fnRemoveFriend('${f.uid}'))" class="friend-card-remove" title="Eliminar">✕</button>
          </div>
          ${recentActivity.length>0?`<div style="font-size:8px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:flex;align-items:center;gap:6px">Leyendo ahora <div style="flex:1;height:1px;background:rgba(255,255,255,.05)"></div></div>`:""}
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


