
// ── Clave dinámica por UID — evita que usuarios distintos compartan caché local ──
function getSKEY(){return fbUser?"mat-v4-"+fbUser.uid:"mat-v4-guest";}
const TKEY="mat-theme",OLD_KEYS=["mat-v3","mat-data-v2","mat-data","mat-v4"];
const DT={accentManga:"#22c55e",accentAnime:"#16a34a",bgMode:"midnight",customTags:[],qnextStyle:"default",distMangaColor:"#22c55e",distAnimeColor:"#16a34a",fontSize:15};
const BGS={dark:{bg1:"#0d0d0f",bg2:"#16161a",bg3:"#1c1c22",bg4:"#24242c",bgi:"#1a1a20",t1:"#e8e6e3",t2:"#8a8a96",t3:"#55555f",bd:"#2a2a32",bdl:"#33333d"},midnight:{bg1:"#0a0e1a",bg2:"#111827",bg3:"#1a2235",bg4:"#243049",bgi:"#141c2e",t1:"#e2e8f0",t2:"#8994a8",t3:"#556078",bd:"#253045",bdl:"#30405a"},amoled:{bg1:"#000",bg2:"#0a0a0a",bg3:"#141414",bg4:"#1e1e1e",bgi:"#0c0c0c",t1:"#f0f0f0",t2:"#888",t3:"#555",bd:"#222",bdl:"#333"},warm:{bg1:"#141210",bg2:"#1c1916",bg3:"#24201c",bg4:"#2e2924",bgi:"#1a1714",t1:"#e8e2d8",t2:"#968e82",t3:"#605a50",bd:"#302b25",bdl:"#3a342c"},light:{bg1:"#f4f4f5",bg2:"#e8e8ea",bg3:"#fff",bg4:"#eeeef0",bgi:"#f0f0f2",t1:"#1a1a1e",t2:"#6b6b78",t3:"#a0a0ad",bd:"#d4d4d8",bdl:"#c0c0c6"}};
const APS=["#e74c6f","#f43f5e","#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#06b6d4","#4ca6e7","#3b82f6","#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899"];
const STATUSES=[{key:"reading",label:"Leyendo",icon:"📖"},{key:"completed",label:"Completado",icon:"✅"},{key:"paused",label:"En pausa",icon:"⏸"},{key:"dropped",label:"Dropped",icon:"❌"},{key:"plan",label:"Por leer",icon:"📋"}];function getStatusLabel(key){if(key==="plan"&&tab==="anime")return"Por ver";const s=STATUSES.find(x=>x.key===key);return s?s.label:key;}
const SM=Object.fromEntries(STATUSES.map(s=>[s.key,s]));
const ALL_TAGS=["Shōnen","Seinen","Shōjo","Josei","Isekai","Mecha","Slice of Life","Horror","Romance","Comedia","Acción","Fantasy","Sci-Fi","Thriller","Deportes","Sobrenatural"];
const CHAR_ST=["Vivo","Muerto","Desconocido"];

let data,theme,tab="manga",search="",expanded={},viewMode="catalog",sortKey="recent",showSettings=false,showPatch=false,editTotal=null,editTotalVal="",newCover="",newCoverIsUrl=false,newTags=[],newStatus="reading",newTitle="",newTotal="",pinnedId=null,filterStatus="all",filterTag="all",showFavsOnly=false,jikanResults=[],jikanSearchTimeout=null;
function today(){return new Date().toISOString().slice(0,10);}

function migrate(s){return{id:s.id,title:s.title,total:s.total??0,completed:s.completed||[],cover:s.cover||"",coverIsUrl:s.coverIsUrl||false,status:s.status||(s.completed?.length===s.total&&s.total>0?"completed":"reading"),tags:s.tags||[],notes:s.notes||"",score:s.score||0,favorite:s.favorite||false,rewatch:s.rewatch||false,lastUpdated:s.lastUpdated||parseInt(s.id)||Date.now(),createdAt:s.createdAt||parseInt(s.id)||Date.now(),startDate:s.startDate||"",endDate:s.endDate||"",seasons:s.seasons||[],characters:s.characters||[],jikanId:s.jikanId||null,jikanPublishing:s.jikanPublishing||false,activityLog:s.activityLog||[]};}
function initData(){
  // Cargar siempre con la clave del usuario actual (uid-based) para aislar datos por cuenta
  const skey=getSKEY();
  let raw=loadJ(skey);
  // Solo migrar claves antiguas si NO hay usuario autenticado (guest session)
  // Si hay usuario, NUNCA leer claves antiguas para evitar mezcla de cuentas
  if(!raw){
    for(const k of OLD_KEYS){raw=loadJ(k);if(raw){localStorage.setItem(skey,JSON.stringify(raw));break;}}
  }
  if(raw){["manga","anime"].forEach(t=>{if(!raw[t])raw[t]=[];raw[t]=raw[t].map(migrate);});data=raw;}
  else data={manga:[],anime:[]};
  saveLocal();
}
function loadJ(k){try{const r=localStorage.getItem(k);return r?JSON.parse(r):null;}catch(e){return null;}}

// ── FIX v3.10: tombstones de borrado, para que el merge item-por-item sepa
// distinguir "esta serie nunca existio en este dispositivo" de "esta serie
// existio y se borro a proposito" — sin esto, un merge ingenuo resucitaria
// series borradas cada vez que llega una version vieja desde otro dispositivo/nube.
function markDeleted(type,id){
  if(!data.deletedIds)data.deletedIds=[];
  data.deletedIds.push({id:String(id),type,deletedAt:Date.now()});
  // Poda tombstones de mas de 90 dias: para entonces todo dispositivo activo
  // ya deberia haber convergido, no hace falta seguir cargandolos para siempre.
  const cutoff=Date.now()-90*24*3600*1000;
  data.deletedIds=data.deletedIds.filter(t=>t.deletedAt>=cutoff);
}
function saveLocal(){localStorage.setItem(getSKEY(),JSON.stringify(data));localStorage.setItem(TKEY,JSON.stringify(theme));}
function save(){saveLocal();if(fbUser)saveToCloud();}

// ── FIX v3.9.1: carrera de arranque entre initData() (sincrono) y onAuthStateChanged (asincrono) ──
// initData() corre ANTES de que Firebase resuelva la sesion, por lo que getSKEY()
// siempre lee "mat-v4-guest" al boot, sin importar si el usuario ya tenia sesion.
// Si el usuario edita algo en esa ventana (ej: agrega una serie justo al abrir la app),
// ese cambio queda guardado bajo la clave de invitado y, si despues la nube "gana"
// la comparacion de scores en loadFromCloud(), se pierde sin dejar rastro.
//
// Esta funcion se llama UNA SOLA VEZ, justo cuando Firebase confirma el uid real
// (dentro de onAuthStateChanged), ANTES de loadFromCloud(). Relee la clave local
// correcta del uid y, si en el medio hubo actividad como invitado (score > 0),
// conserva la version con MAYOR score en vez de descartarla.
function reloadLocalForCurrentUser(){
  const guestData = data; // lo cargado al boot bajo "mat-v4-guest" (+ ediciones en la ventana de carrera)
  const guestScore = _cloudScoreOf(guestData);
  const skey = getSKEY(); // ahora SI devuelve "mat-v4-"+uid porque fbUser ya esta seteado
  let raw = loadJ(skey);
  let uidData = {manga:[], anime:[], deletedIds:[]};
  if(raw){
    ["manga","anime"].forEach(t=>{ if(!raw[t]) raw[t] = []; raw[t] = raw[t].map(migrate); });
    uidData = raw;
  }
  if(guestScore > 0){
    // FIX v3.10: fusionar item-por-item (mergeMangu, definido en firebase.js)
    // en vez de quedarse con el array completo de mayor score. Nunca se descarta nada.
    console.warn("[MANGU] reloadLocalForCurrentUser: fusionando ventana de carrera (guest_score=" + guestScore + ") con cache del uid");
    data = mergeMangu(guestData, uidData);
  } else {
    data = uidData;
  }
  saveLocal(); // persistir de inmediato bajo la clave correcta del uid
}
function applyTheme(){const bg=BGS[theme.bgMode]||BGS.midnight;const root=document.documentElement;Object.entries(bg).forEach(([k,v])=>root.style.setProperty("--"+k,v));root.style.setProperty("--am",theme.accentManga);root.style.setProperty("--amd",hexAlpha(theme.accentManga,.13));root.style.setProperty("--aa",theme.accentAnime);root.style.setProperty("--aad",hexAlpha(theme.accentAnime,.13));const fs=theme.fontSize||15;root.style.setProperty("--fsz",fs+"px");
// Usar font-size en body en vez de zoom (zoom no soportado en Safari/WebKit - Parche 2.5)
const appEl=document.getElementById("app");
if(appEl){appEl.style.zoom="";}
root.style.zoom="";
document.body.style.fontSize=fs+"px";}
function hexAlpha(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;}
function initTheme(){const saved=loadJ(TKEY);theme=saved?{...DT,...saved}:{...DT};}
initTheme();initData();applyTheme();
// ── DEFAULT TAB BASED ON CONTENT (Patch 1.8) ──
(function(){
  const mLen=data.manga.length;
  const aLen=data.anime.length;
  if(mLen===0 && aLen>0){tab="anime";}
  else if(mLen>0 && aLen>mLen){tab="anime";}
})();
function showToast(msg,dur=2500){const t=document.querySelector(".toast");if(t)t.remove();const el=document.createElement("div");el.className="toast";el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),dur);}
function showModal(title,desc,icon,onOk){const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML=`<div class="modal"><div class="modal-icon">${icon}</div><div class="modal-title">${title}</div><div class="modal-desc">${desc}</div><div class="modal-btns"><button class="mbtn" id="mc">Cancelar</button><button class="mbtn dng" id="mo">Confirmar</button></div></div>`;document.body.appendChild(bg);bg.querySelector("#mc").onclick=()=>bg.remove();bg.querySelector("#mo").onclick=()=>{onOk();bg.remove();};}
function showCascadeModal(title,desc,icon,onSingle,onAll){const bg=document.createElement("div");bg.className="modal-bg";bg.innerHTML=`<div class="modal"><div class="modal-icon">${icon}</div><div class="modal-title">${title}</div><div class="modal-desc">${desc}</div><div class="modal-btns"><button class="mbtn" id="mc">Cancelar</button><button class="mbtn" id="ms">Solo este</button><button class="mbtn dng" id="ma">Desmarcar todos</button></div></div>`;document.body.appendChild(bg);bg.querySelector("#mc").onclick=()=>bg.remove();bg.querySelector("#ms").onclick=()=>{onSingle();bg.remove();};bg.querySelector("#ma").onclick=()=>{onAll();bg.remove();};}
function resizeImg(file,cb,maxW=300){const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const s=Math.min(1,maxW/img.width);c.width=img.width*s;c.height=img.height*s;c.getContext("2d").drawImage(img,0,0,c.width,c.height);cb(c.toDataURL("image/jpeg",.8));};img.src=e.target.result;};r.readAsDataURL(file);}
function timeAgo(ts){const d=Math.floor((Date.now()-ts)/1000);if(d<60)return"ahora";if(d<3600)return`${Math.floor(d/60)}m`;if(d<86400)return`${Math.floor(d/3600)}h`;return`${Math.floor(d/86400)}d`;}
function scoreColor(v){v=parseFloat(v);if(v>=9)return"#22c55e";if(v>=7)return"#84cc16";if(v>=5)return"#eab308";if(v>=3)return"#f97316";return"#e74c4c";}
function charCls(st){const l=st.toLowerCase();return l==="vivo"?"vivo":l==="muerto"?"muerto":l==="desconocido"?"desconocido":"custom";}
function nextChapter(s){
  if(!s.total||s.total<1)return null;
  const done=new Set(s.completed);
  for(let i=1;i<=s.total;i++){if(!done.has(i))return i;}
  // Para series en emisión: si ya se leyeron todos los caps conocidos, el siguiente
  // sería total+1 (hay más por publicar). No mostrar "completo" prematuramente.
  if(s.jikanPublishing)return s.total+1;
  return null;
}
function filterList(list){let r=list;if(showFavsOnly)r=r.filter(s=>s.favorite);if(filterStatus!=="all")r=r.filter(s=>s.status===filterStatus);if(filterTag!=="all")r=r.filter(s=>(s.tags||[]).includes(filterTag));if(search){const q=search.toLowerCase();r=r.filter(s=>s.title.toLowerCase().includes(q)||(s.tags||[]).some(t=>t.toLowerCase().includes(q))||(s.notes||'').toLowerCase().includes(q));}return r;}
function sortList(list){return[...list].sort((a,b)=>{switch(sortKey){case"name-asc":return a.title.localeCompare(b.title);case"name-desc":return b.title.localeCompare(a.title);case"progress-desc":{const pa=a.total>0?a.completed.length/a.total:0,pb=b.total>0?b.completed.length/b.total:0;return pb-pa;}case"progress-asc":{const pa=a.total>0?a.completed.length/a.total:0,pb=b.total>0?b.completed.length/b.total:0;return pa-pb;}case"score":return(b.score||0)-(a.score||0);case"total-desc":return b.total-a.total;case"updated":return(b.lastUpdated||0)-(a.lastUpdated||0);
// Orden por defecto: el último al que se le marcó un cap/ep aparece primero (Parche 2.5)
default:return(b.lastUpdated||b.createdAt||parseInt(b.id)||0)-(a.lastUpdated||a.createdAt||parseInt(a.id)||0);}});}

function timeInvested(){
  const mMin=data.manga.reduce((s,x)=>s+x.completed.length*8,0);
  const aMin=data.anime.reduce((s,x)=>s+x.completed.length*23,0);
  const tot=mMin+aMin;
  if(!tot)return{val:"0h",sub:"sin datos"};
  const h=Math.floor(tot/60);
  if(h>=48)return{val:`${Math.floor(h/24)}d`,sub:`${h}h totales`};
  return{val:`${h}h`,sub:`${tot%60}min adicionales`};
}
function readingRate(){
  const all=[...data.manga,...data.anime];
  if(!all.length)return"0";
  const oldest=Math.min(...all.filter(s=>s.createdAt).map(s=>s.createdAt),Date.now());
  const weeks=Math.max((Date.now()-oldest)/(7*24*3600*1000),1);
  return(all.reduce((s,x)=>s+x.completed.length,0)/weeks).toFixed(1);
}
function scoreHist(items){const h=Array(10).fill(0);items.filter(s=>s.score>0).forEach(s=>h[s.score-1]++);return h;}
function topGenres(items,n=6){
  const c={};
  items.forEach(s=>(s.tags||[]).forEach(t=>{c[t]=(c[t]||0)+1;}));
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,n);
}
function bestRated(items,n=5){return[...items].filter(s=>s.score>0).sort((a,b)=>b.score-a.score||b.completed.length-a.completed.length).slice(0,n);}
function completionRate(items){if(!items.length)return 0;return Math.round(items.filter(s=>s.status==="completed").length/items.length*100);}
function avgScore(items){const sc=items.filter(s=>s.score>0);if(!sc.length)return null;return(sc.reduce((s,x)=>s+x.score,0)/sc.length).toFixed(1);}

const svg={book:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,tv:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>`,plus:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,trash:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,chd:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`,chu:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`,search:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,edit:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,img:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,up:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,pal:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2"/><circle cx="17.5" cy="10.5" r="2"/><circle cx="8.5" cy="7.5" r="2"/><circle cx="6.5" cy="12.5" r="2"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.38-.15-.74-.39-1.04-.24-.3-.39-.66-.39-1.04 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.49-9-10-9z"/></svg>`,grid:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,list:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,chart:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,exp:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,imp:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,star:`<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,starO:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`};
function h(tag,cls,html,attrs){const el=document.createElement(tag);if(cls)el.className=cls;if(html!=null)el.innerHTML=String(html);if(attrs)Object.entries(attrs).forEach(([k,v])=>{if(k.startsWith("on"))el[k]=v;else el.setAttribute(k,v);});return el;}


