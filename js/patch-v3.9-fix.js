// ═══════════════════════════════════════════════════════════════════
// MANGU — Parche v3.9 (CORREGIDO)
// Fix 1: ANN RSS — usa allorigins.win como proxy CORS público ya que
//         el Cloudflare Worker solo acepta dominios MangaDex.
//         Fallback: si allorigins falla, intenta cors.sh como backup.
// Fix 2: El panel de noticias se inserta en el contenedor correcto
//         según el layout real de 3 columnas. Se inyecta dentro del
//         div que contiene el #app (columna central), no en el #app.
//         PENDIENTE: necesita patch-v3.4/v3.5 para ubicación exacta.
// ═══════════════════════════════════════════════════════════════════

(function(){
'use strict';

const P39_CACHE_KEY  = 'p39-news-cache';
const P39_CACHE_TTL  = 30 * 60 * 1000;
const P39_ANN_RSS    = 'https://www.animenewsnetwork.com/all/rss.xml';
const P39_DELAY      = 420;
const P39_MAX        = 10;

// ── Estilos ─────────────────────────────────────────────────────────
if(!document.getElementById('mng-p39-style')){
  const s = document.createElement('style');
  s.id = 'mng-p39-style';
  s.textContent = `
#p39-news-panel{
  background:#080c14;
  border:1px solid #131d2e;
  border-radius:16px;
  overflow:hidden;
  margin:0 18px 20px;
  font-family:'Outfit',sans-serif;
}
.p39-topbar{
  display:flex;align-items:center;
  justify-content:space-between;
  padding:13px 16px 0;
}
.p39-title-row{display:flex;align-items:center;gap:8px}
.p39-pulse{
  width:7px;height:7px;border-radius:50%;
  background:#00e5a0;position:relative;flex-shrink:0;
}
.p39-pulse::after{
  content:'';position:absolute;inset:-3px;border-radius:50%;
  border:1.5px solid #00e5a0;opacity:.4;
  animation:p39rng 1.8s ease-out infinite;
}
@keyframes p39rng{0%{transform:scale(1);opacity:.4}100%{transform:scale(2.4);opacity:0}}
.p39-lbl{font-size:11px;font-weight:700;letter-spacing:.08em;color:#c8dae8;text-transform:uppercase}
.p39-meta{font-size:10px;color:#1e3045}
.p39-tabs{display:flex;padding:10px 16px 0;border-bottom:1px solid #0d1828;gap:2px}
.p39-tab{
  position:relative;padding:7px 12px;font-size:11px;font-weight:700;
  letter-spacing:.05em;text-transform:uppercase;cursor:pointer;color:#1e3045;
  background:none;border:none;font-family:'Outfit',sans-serif;
  transition:color .15s;display:flex;align-items:center;gap:6px;
}
.p39-tab:hover{color:#4a7090}
.p39-tab.on{color:#00e5a0}.p39-tab.on-a{color:#c084fc}.p39-tab.on-i{color:#fbbf24}
.p39-tab-ul{position:absolute;bottom:-1px;left:0;right:0;height:2px;border-radius:2px 2px 0 0;display:none}
.p39-tab.on .p39-tab-ul{display:block;background:#00e5a0}
.p39-tab.on-a .p39-tab-ul{display:block;background:#c084fc}
.p39-tab.on-i .p39-tab-ul{display:block;background:#fbbf24}
.p39-cnt{
  display:inline-flex;align-items:center;justify-content:center;
  min-width:16px;height:16px;padding:0 4px;border-radius:99px;
  font-size:9px;font-weight:800;
  background:rgba(255,255,255,.04);color:#1e3045;
  transition:background .15s,color .15s;
}
.p39-tab.on .p39-cnt{background:rgba(0,229,160,.12);color:#00e5a0}
.p39-tab.on-a .p39-cnt{background:rgba(192,132,252,.12);color:#c084fc}
.p39-tab.on-i .p39-cnt{background:rgba(251,191,36,.12);color:#fbbf24}
.p39-feed{display:flex;flex-direction:column}
.p39-item{
  display:flex;gap:12px;align-items:flex-start;
  padding:11px 16px;border-bottom:1px solid #0a1422;
  cursor:pointer;transition:background .12s;
  position:relative;text-decoration:none;
}
.p39-item:last-child{border-bottom:none}
.p39-item:hover{background:rgba(255,255,255,.022)}
.p39-item:hover .p39-arr{opacity:1}
.p39-bar{width:3px;border-radius:0 2px 2px 0;flex-shrink:0;align-self:stretch;min-height:40px}
.p39-bar-m{background:#00e5a0}.p39-bar-a{background:#c084fc}.p39-bar-i{background:#fbbf24}
.p39-icon{width:38px;height:52px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.p39-icon-m{background:rgba(0,229,160,.06);border:1px solid rgba(0,229,160,.1)}
.p39-icon-a{background:rgba(192,132,252,.06);border:1px solid rgba(192,132,252,.1)}
.p39-icon-i{background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.1)}
.p39-body{flex:1;min-width:0;padding-right:14px}
.p39-source{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}
.p39-src-m{color:#00e5a0}.p39-src-a{color:#c084fc}.p39-src-i{color:#fbbf24}
.p39-title-news{
  font-size:12.5px;font-weight:600;color:#c8dae8;line-height:1.45;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.p39-foot{display:flex;align-items:center;gap:6px;margin-top:5px}
.p39-time{font-size:10px;color:#263850}
.p39-dot{width:2px;height:2px;border-radius:50%;background:#1a2e44;flex-shrink:0}
.p39-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:99px;letter-spacing:.03em}
.p39-badge-new{background:rgba(0,229,160,.09);color:#00b87a;border:1px solid rgba(0,229,160,.16)}
.p39-badge-hot{background:rgba(251,191,36,.09);color:#b8960a;border:1px solid rgba(251,191,36,.16)}
.p39-arr{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:13px;color:#263850;opacity:0;transition:opacity .15s}
.p39-loading{display:flex;align-items:center;justify-content:center;gap:8px;padding:28px 16px;font-size:12px;color:#1e3045}
.p39-spinner{width:14px;height:14px;border:2px solid #131d2e;border-top-color:#00e5a0;border-radius:50%;animation:p39spin .7s linear infinite}
@keyframes p39spin{to{transform:rotate(360deg)}}
.p39-empty{padding:28px 16px;text-align:center;font-size:12px;color:#1e3045;font-style:italic}
.p39-footer{display:flex;align-items:center;justify-content:space-between;padding:9px 16px;border-top:1px solid #0a1422}
.p39-footer-l{font-size:10px;color:#1a2e44;display:flex;align-items:center;gap:5px}
.p39-footer-r{display:flex;align-items:center;gap:10px}
.p39-refbtn{font-size:10px;color:#263850;cursor:pointer;display:flex;align-items:center;gap:4px;background:none;border:none;font-family:'Outfit',sans-serif;transition:color .15s;padding:0}
.p39-refbtn:hover{color:#00e5a0}
.p39-sep{width:1px;height:10px;background:#0f1826}
@media(max-width:540px){
  #p39-news-panel{margin:0 0 20px;border-radius:0;border-left:none;border-right:none}
  .p39-tab{padding:7px 9px;font-size:10px}
}
`;
  document.head.appendChild(s);
}

// ── Utilidades ──────────────────────────────────────────────────────
function p39TimeAgo(dateStr){
  const d=new Date(dateStr);
  if(isNaN(d))return'';
  const diff=Math.floor((Date.now()-d)/1000);
  if(diff<60)return'ahora';
  if(diff<3600)return Math.floor(diff/60)+'min';
  if(diff<86400)return Math.floor(diff/3600)+'h';
  return Math.floor(diff/86400)+'d';
}
function p39Sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function p39GetCache(){
  try{
    const raw=localStorage.getItem(P39_CACHE_KEY);
    if(!raw)return null;
    const obj=JSON.parse(raw);
    if(Date.now()-obj.ts>P39_CACHE_TTL)return null;
    return obj.data;
  }catch(e){return null;}
}
function p39SetCache(d){
  try{localStorage.setItem(P39_CACHE_KEY,JSON.stringify({ts:Date.now(),data:d}));}
  catch(e){}
}

// ── Fetch ANN RSS — múltiples proxies CORS ──────────────────────────
// El Cloudflare Worker de MANGU solo acepta MangaDex.
// Usamos allorigins.win (gratuito, sin auth) como proxy CORS para ANN.
async function p39FetchANN(){
  const proxies = [
    // allorigins devuelve { contents: "...", status: { url, content_type } }
    `https://api.allorigins.win/get?url=${encodeURIComponent(P39_ANN_RSS)}`,
    // corsproxy.io como fallback
    `https://corsproxy.io/?${encodeURIComponent(P39_ANN_RSS)}`,
  ];

  let txt = null;
  for(const proxyUrl of proxies){
    try{
      const res = await fetch(proxyUrl, {signal: AbortSignal.timeout(8000)});
      if(!res.ok) continue;
      const json = await res.json().catch(()=>null);
      if(json && json.contents){
        txt = json.contents; // allorigins format
        break;
      }
      // corsproxy devuelve el contenido directamente como texto
      txt = await res.text();
      if(txt && txt.includes('<rss')) break;
      txt = null;
    }catch(e){ txt = null; }
  }

  if(!txt) return [];

  try{
    const dom = new DOMParser().parseFromString(txt, 'text/xml');
    const items = [...dom.querySelectorAll('item')];
    return items.slice(0,40).map(item => ({
      title:   item.querySelector('title')?.textContent   || '',
      link:    item.querySelector('link')?.textContent    || '',
      pubDate: item.querySelector('pubDate')?.textContent || '',
      desc:    item.querySelector('description')?.textContent || '',
      cat:     item.querySelector('category')?.textContent?.toLowerCase() || '',
    }));
  }catch(e){ return []; }
}

// Clasifica noticia ANN como 'anime' o 'industria'
function p39Classify(item){
  const txt = (item.title+' '+item.cat+' '+item.desc).toLowerCase();
  const indKw = ['licens','licencia','crunchyroll','netflix','funimation','studio','estudio',
    'streaming','mappa','ufotable','toei','box office','award','premio','event','evento',
    'viz media','shueisha','kadokawa','hidive','announce','anuncia','produc'];
  for(const k of indKw){ if(txt.includes(k)) return 'industria'; }
  return 'anime';
}

// ── Fetch Jikan news por serie ──────────────────────────────────────
async function p39FetchJikanNews(series){
  if(!series.jikanId) return [];
  const isAnime = (typeof data!=='undefined') && data.anime && data.anime.some(s=>s.id===series.id);
  const type = isAnime ? 'anime' : 'manga';
  try{
    const res = await fetch(
      `https://api.jikan.moe/v4/${type}/${series.jikanId}/news?limit=3`,
      {signal: AbortSignal.timeout(6000)}
    );
    if(res.status===429) return [];
    if(!res.ok) return [];
    const json = await res.json();
    return (json.data||[]).slice(0,2).map(n=>({
      title:        n.title||'',
      link:         n.url||'',
      pubDate:      n.date||'',
      forumEntries: n.forum_entries||0,
      seriesTitle:  series.title,
      seriesType:   type,
    }));
  }catch(e){ return []; }
}

// ── Carga completa ──────────────────────────────────────────────────
async function p39LoadNews(force){
  if(!force){
    const cached=p39GetCache();
    if(cached) return cached;
  }
  const result={mis:[],anime:[],industria:[],updatedAt:Date.now()};

  // Mis series — Jikan
  if(typeof data!=='undefined'){
    const reading=[
      ...(data.manga||[]).filter(s=>s.status==='reading'&&s.jikanId),
      ...(data.anime||[]).filter(s=>s.status==='reading'&&s.jikanId),
    ].slice(0,8);
    for(let i=0;i<reading.length;i++){
      const items=await p39FetchJikanNews(reading[i]);
      result.mis.push(...items);
      if(i<reading.length-1) await p39Sleep(P39_DELAY);
    }
    result.mis=result.mis.slice(0,P39_MAX);
  }

  // ANN RSS — anime e industria
  const annItems=await p39FetchANN();
  for(const item of annItems){
    const tipo=p39Classify(item);
    if(tipo==='anime'     && result.anime.length    <P39_MAX) result.anime.push(item);
    if(tipo==='industria' && result.industria.length<P39_MAX) result.industria.push(item);
    if(result.anime.length>=P39_MAX && result.industria.length>=P39_MAX) break;
  }

  p39SetCache(result);
  return result;
}

// ── SVG icons ───────────────────────────────────────────────────────
const _svgBook =`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const _svgFilm =`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
const _svgGlobe=`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
const _svgRefr =`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
const _svgClock=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

// ── Render ítem ──────────────────────────────────────────────────────
function p39RenderItem(item, tipo){
  const isAnime = tipo==='anime' || (tipo==='mis' && item.seriesType==='anime');
  const isInd   = tipo==='industria';
  const barCls  = isInd?'p39-bar-i':isAnime?'p39-bar-a':'p39-bar-m';
  const icoCls  = isInd?'p39-icon-i':isAnime?'p39-icon-a':'p39-icon-m';
  const srcCls  = isInd?'p39-src-i':isAnime?'p39-src-a':'p39-src-m';
  const ico     = isInd?_svgGlobe:isAnime?_svgFilm:_svgBook;
  const color   = isInd?'#fbbf24':isAnime?'#c084fc':'#00e5a0';

  let source='';
  if(tipo==='mis'){
    const t=item.seriesTitle||'';
    source=(t.length>20?t.slice(0,18)+'…':t)+' · '+(item.seriesType==='anime'?'Anime':'Manga');
  }else{
    source=isInd?'Industria':'Anime';
  }

  const ageMs=item.pubDate?Date.now()-new Date(item.pubDate).getTime():999999999;
  const isNew=ageMs<6*3600*1000;
  const isHot=(item.forumEntries||0)>50;
  const badge=isNew?'<span class="p39-badge p39-badge-new">NUEVO</span>':isHot?'<span class="p39-badge p39-badge-hot">POPULAR</span>':'';
  const timeStr=p39TimeAgo(item.pubDate||'');

  const el=document.createElement('a');
  el.className='p39-item';
  el.href=item.link||'#';
  el.target='_blank';
  el.rel='noopener noreferrer';
  el.innerHTML=`
    <div class="p39-bar ${barCls}"></div>
    <div class="p39-icon ${icoCls}" style="color:${color}">${ico}</div>
    <div class="p39-body">
      <div class="p39-source ${srcCls}">${source}</div>
      <div class="p39-title-news">${item.title}</div>
      <div class="p39-foot">
        ${timeStr?`<span class="p39-time">${timeStr}</span>`:''}
        ${timeStr&&badge?'<div class="p39-dot"></div>':''}
        ${badge}
      </div>
    </div>
    <span class="p39-arr" aria-hidden="true">›</span>
  `;
  return el;
}

// ── Estado del panel ─────────────────────────────────────────────────
let _p39Tab     = 'mis';
let _p39Data    = null;
let _p39Panel   = null;
let _p39Loading = false;

function p39RenderFeed(tipo){
  _p39Tab=tipo;
  const container=document.getElementById('p39-feed-container');
  if(!container||!_p39Data)return;
  container.innerHTML='';

  // Actualizar tabs activos
  if(_p39Panel){
    const tabOnCls={mis:'on',anime:'on-a',industria:'on-i'};
    _p39Panel.querySelectorAll('.p39-tab').forEach(btn=>{
      const t=btn.dataset.tab;
      btn.className='p39-tab'+(t===tipo?' '+tabOnCls[t]:'');
    });
  }

  const items=_p39Data[tipo]||[];
  if(!items.length){
    const empty=document.createElement('div');
    empty.className='p39-empty';
    empty.textContent=tipo==='mis'
      ?'Agrega series desde MAL para ver noticias de tus títulos'
      :'No se pudieron cargar las noticias de ANN. Intenta refrescar.';
    container.appendChild(empty);
    return;
  }
  const feed=document.createElement('div');
  feed.className='p39-feed';
  items.forEach(item=>feed.appendChild(p39RenderItem(item,tipo)));
  container.appendChild(feed);
}

function p39BuildPanel(newsData){
  _p39Data=newsData;
  _p39Panel.innerHTML='';

  const counts={mis:(newsData.mis||[]).length,anime:(newsData.anime||[]).length,industria:(newsData.industria||[]).length};
  const updMin=Math.round((Date.now()-(newsData.updatedAt||Date.now()))/60000);
  const updStr=updMin<1?'ahora mismo':`hace ${updMin} min`;

  // Top bar
  const topBar=document.createElement('div');
  topBar.className='p39-topbar';
  topBar.innerHTML=`
    <div class="p39-title-row">
      <div class="p39-pulse"></div>
      <span class="p39-lbl">Noticias</span>
    </div>
    <span class="p39-meta" id="p39-upd-lbl">Actualizado ${updStr}</span>
  `;
  _p39Panel.appendChild(topBar);

  // Tabs
  const tabsEl=document.createElement('div');
  tabsEl.className='p39-tabs';
  const tabDefs=[
    {id:'mis',    label:'Mis series', onCls:'on'},
    {id:'anime',  label:'Anime',      onCls:'on-a'},
    {id:'industria',label:'Industria',onCls:'on-i'},
  ];
  tabDefs.forEach(({id,label,onCls})=>{
    const btn=document.createElement('button');
    btn.className='p39-tab'+(id===_p39Tab?' '+onCls:'');
    btn.dataset.tab=id;
    btn.innerHTML=`${label}<span class="p39-cnt">${counts[id]||0}</span><div class="p39-tab-ul"></div>`;
    btn.onclick=()=>p39RenderFeed(id);
    tabsEl.appendChild(btn);
  });
  _p39Panel.appendChild(tabsEl);

  // Feed container
  const feedContainer=document.createElement('div');
  feedContainer.id='p39-feed-container';
  _p39Panel.appendChild(feedContainer);
  p39RenderFeed(_p39Tab);

  // Footer
  const footer=document.createElement('div');
  footer.className='p39-footer';
  footer.innerHTML=`
    <div class="p39-footer-l">${_svgClock} Refresca cada 30 min</div>
    <div class="p39-footer-r">
      <button class="p39-refbtn" id="p39-refresh-btn">${_svgRefr} Refrescar</button>
      <div class="p39-sep"></div>
      <button class="p39-refbtn" id="p39-ann-btn">ANN ›</button>
    </div>
  `;
  _p39Panel.appendChild(footer);
  footer.querySelector('#p39-refresh-btn').onclick=()=>p39Refresh(true);
  footer.querySelector('#p39-ann-btn').onclick=()=>window.open('https://www.animenewsnetwork.com','_blank');
}

async function p39Refresh(force){
  if(_p39Loading)return;
  _p39Loading=true;
  const container=document.getElementById('p39-feed-container');
  if(container) container.innerHTML=`<div class="p39-loading"><div class="p39-spinner"></div><span>Cargando...</span></div>`;
  const btn=document.getElementById('p39-refresh-btn');
  if(btn) btn.style.color='#00e5a0';
  try{
    const nd=await p39LoadNews(force);
    _p39Data=nd;
    p39RenderFeed(_p39Tab);
    const lbl=document.getElementById('p39-upd-lbl');
    if(lbl) lbl.textContent='Actualizado ahora mismo';
  }catch(e){
    const cont=document.getElementById('p39-feed-container');
    if(cont) cont.innerHTML='<div class="p39-empty">Error al cargar. Intenta de nuevo.</div>';
  }finally{
    _p39Loading=false;
    if(btn) btn.style.color='';
  }
}

// ── Inyección del panel ──────────────────────────────────────────────
// El panel se inserta ANTES de .mgnav (barra de tabs).
// Funciona igual independientemente del layout externo de 3 columnas
// que crean los parches v3.4/v3.5 — esos parches manipulan el
// contenedor del #app, no su contenido interno.
async function p39InjectPanel(){
  if(document.getElementById('p39-news-panel')) return;

  // Solo en tabs principales
  const mainTabs=['manga','anime','dashboard'];
  if(typeof tab!=='undefined' && !mainTabs.includes(tab)) return;

  // Crear panel
  _p39Panel=document.createElement('div');
  _p39Panel.id='p39-news-panel';

  // Insertar antes de .mgnav
  const navEl=document.querySelector('.mgnav');
  if(!navEl||!navEl.parentNode) return;
  navEl.parentNode.insertBefore(_p39Panel,navEl);

  // Skeleton
  _p39Panel.innerHTML=`<div class="p39-loading"><div class="p39-spinner"></div><span>Cargando noticias...</span></div>`;

  // Cargar
  const newsData=await p39LoadNews(false);
  p39BuildPanel(newsData);
}

// ── Hook render ──────────────────────────────────────────────────────
const _p39OrigRender=window.render;
window.render=function(){
  _p39OrigRender.apply(this,arguments);
  setTimeout(p39InjectPanel,120);
};

})();
