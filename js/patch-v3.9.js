// ═══════════════════════════════════════════════════════════════════
// MANGU — Parche v3.9 — Panel de Noticias
// REEMPLAZA cualquier versión anterior de patch-v3.9.js
//
// Estrategia de layout:
//   Desktop con espacio ≥ 264px a la derecha del #app:
//     → panel position:fixed a la derecha (espejo de v3.4 izquierdo)
//   Desktop sin espacio suficiente / mobile:
//     → panel inline dentro del #app, entre "Continuar Leyendo" y tabs
//
// Fuentes:
//   "Mis series" → Jikan /news por jikanId de series en reading
//   "Anime" / "Industria" → ANN RSS via allorigins.win + corsproxy.io
// ═══════════════════════════════════════════════════════════════════

(function(){
'use strict';

// ── Limpiar instancias anteriores de cualquier versión previa ────────
['p39-panel','p39-news-panel'].forEach(id=>{
  document.getElementById(id)?.remove();
});
if(document.getElementById('mng-p39-style')){
  document.getElementById('mng-p39-style').remove();
}

// ── Constantes ───────────────────────────────────────────────────────
const PANEL_W     = 300;
const GAP         = 14;
const CACHE_KEY   = 'p39-news-cache';
const CACHE_TTL   = 30 * 60 * 1000;
const ANN_RSS     = 'https://www.animenewsnetwork.com/all/rss.xml';
const JIKAN_DELAY = 420;
const MAX_ITEMS   = 10;

// ── Estilos ──────────────────────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.id = 'mng-p39-style';
styleEl.textContent = `
/* ── Panel fixed (desktop, derecha del #app) ── */
#p39-panel {
  display: none;
  position: fixed;
  top: 16px;
  width: ${PANEL_W}px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  z-index: 100;
  background: rgba(8,12,20,.97);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  font-family: 'Outfit', sans-serif;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
#p39-panel::-webkit-scrollbar { display: none; }

/* ── Panel inline (fallback dentro del #app) ── */
#p39-inline {
  display: none;
  background: #080c14;
  border: 1px solid #131d2e;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 18px 20px;
  font-family: 'Outfit', sans-serif;
}
@media(max-width:768px){
  #p39-inline {
    max-height: 340px;
    display: flex;
    flex-direction: column;
  }
  #p39-inline .p39-fc {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    flex: 1;
    min-height: 0;
  }
  #p39-inline .p39-fc::-webkit-scrollbar { display: none; }
  #p39-inline .p39-footer { flex-shrink: 0; }
}
@media(max-width:540px){
  #p39-inline { margin:0 0 20px; border-radius:0; border-left:none; border-right:none; }
}

/* ── Shared ── */
.p39-phdr {
  position: sticky; top: 0; z-index: 1;
  background: rgba(8,12,20,.97);
  padding: 13px 14px 0;
}
#p39-inline .p39-phdr { background: #080c14; position: static; }
.p39-title-row { display:flex; align-items:center; gap:7px; margin-bottom:10px; }
.p39-pulse {
  width:7px; height:7px; border-radius:50%;
  background:#00e5a0; position:relative; flex-shrink:0;
}
.p39-pulse::after {
  content:''; position:absolute; inset:-3px; border-radius:50%;
  border:1.5px solid #00e5a0; opacity:.4;
  animation:p39rng 1.8s ease-out infinite;
}
@keyframes p39rng{0%{transform:scale(1);opacity:.4}100%{transform:scale(2.4);opacity:0}}
.p39-lbl { font-size:11px; font-weight:700; letter-spacing:.08em; color:#c8dae8; text-transform:uppercase; flex:1; }
.p39-upd { font-size:9px; color:#1e3045; }
.p39-tabs {
  display:flex; border-bottom:1px solid #0d1828;
  margin:0 -14px; padding:0 14px; gap:2px;
}
.p39-tab {
  position:relative; padding:6px 9px; font-size:10px; font-weight:700;
  letter-spacing:.05em; text-transform:uppercase; cursor:pointer;
  color:#1e3045; background:none; border:none;
  font-family:'Outfit',sans-serif; transition:color .15s;
  display:flex; align-items:center; gap:4px;
}
.p39-tab:hover { color:#4a7090; }
.p39-tab.on   { color:#00e5a0; }
.p39-tab.on-a { color:#c084fc; }
.p39-tab.on-i { color:#fbbf24; }
.p39-tab-ul { position:absolute; bottom:-1px; left:0; right:0; height:2px; border-radius:2px 2px 0 0; display:none; }
.p39-tab.on   .p39-tab-ul { display:block; background:#00e5a0; }
.p39-tab.on-a .p39-tab-ul { display:block; background:#c084fc; }
.p39-tab.on-i .p39-tab-ul { display:block; background:#fbbf24; }
.p39-cnt {
  display:inline-flex; align-items:center; justify-content:center;
  min-width:14px; height:14px; padding:0 3px; border-radius:99px;
  font-size:8px; font-weight:800;
  background:rgba(255,255,255,.04); color:#1e3045;
}
.p39-tab.on   .p39-cnt { background:rgba(0,229,160,.12);   color:#00e5a0; }
.p39-tab.on-a .p39-cnt { background:rgba(192,132,252,.12); color:#c084fc; }
.p39-tab.on-i .p39-cnt { background:rgba(251,191,36,.12);  color:#fbbf24; }
.p39-feed { display:flex; flex-direction:column; }
.p39-item {
  display:flex; gap:9px; align-items:flex-start;
  padding:10px 14px; border-bottom:1px solid #0a1422;
  cursor:pointer; transition:background .12s;
  position:relative; text-decoration:none;
}
.p39-item:last-child { border-bottom:none; }
.p39-item:hover { background:rgba(255,255,255,.022); }
.p39-item:hover .p39-arr { opacity:1; }
.p39-bar { width:3px; border-radius:0 2px 2px 0; flex-shrink:0; align-self:stretch; min-height:36px; }
.p39-bar-m { background:#00e5a0; } .p39-bar-a { background:#c084fc; } .p39-bar-i { background:#fbbf24; }
.p39-ico { width:32px; height:44px; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.p39-ico-m { background:rgba(0,229,160,.06);   border:1px solid rgba(0,229,160,.1); }
.p39-ico-a { background:rgba(192,132,252,.06); border:1px solid rgba(192,132,252,.1); }
.p39-ico-i { background:rgba(251,191,36,.06);  border:1px solid rgba(251,191,36,.1); }
.p39-body { flex:1; min-width:0; padding-right:10px; }
.p39-src { font-size:8.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; margin-bottom:3px; }
.p39-src-m { color:#00e5a0; } .p39-src-a { color:#c084fc; } .p39-src-i { color:#fbbf24; }
.p39-headline { font-size:11.5px; font-weight:600; color:#c8dae8; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.p39-foot { display:flex; align-items:center; gap:5px; margin-top:4px; flex-wrap:wrap; }
.p39-time { font-size:9px; color:#263850; }
.p39-dotsep { width:2px; height:2px; border-radius:50%; background:#1a2e44; flex-shrink:0; }
.p39-badge { font-size:8px; font-weight:700; padding:1px 6px; border-radius:99px; letter-spacing:.03em; }
.p39-badge-new { background:rgba(0,229,160,.09);  color:#00b87a; border:1px solid rgba(0,229,160,.16); }
.p39-badge-hot { background:rgba(251,191,36,.09); color:#b8960a; border:1px solid rgba(251,191,36,.16); }
.p39-arr { position:absolute; right:10px; top:50%; transform:translateY(-50%); font-size:12px; color:#263850; opacity:0; transition:opacity .15s; }
.p39-loading { display:flex; align-items:center; justify-content:center; gap:7px; padding:24px 14px; font-size:11px; color:#1e3045; }
.p39-spinner { width:13px; height:13px; border:2px solid #131d2e; border-top-color:#00e5a0; border-radius:50%; animation:p39spin .7s linear infinite; flex-shrink:0; }
@keyframes p39spin { to { transform:rotate(360deg); } }
.p39-empty { padding:24px 14px; text-align:center; font-size:11px; color:#1e3045; font-style:italic; line-height:1.5; }
.p39-footer { display:flex; align-items:center; justify-content:space-between; padding:8px 14px; border-top:1px solid #0a1422; }
.p39-fl { font-size:9px; color:#1a2e44; display:flex; align-items:center; gap:4px; }
.p39-fr { display:flex; align-items:center; gap:8px; }
.p39-btn { font-size:9px; color:#263850; cursor:pointer; display:flex; align-items:center; gap:3px; background:none; border:none; font-family:'Outfit',sans-serif; transition:color .15s; padding:0; }
.p39-btn:hover { color:#00e5a0; }
.p39-fsep { width:1px; height:9px; background:#0f1826; }
`;
document.head.appendChild(styleEl);

// ── Utilidades ───────────────────────────────────────────────────────
function _ago(ds){
  const d=new Date(ds); if(isNaN(d))return'';
  const s=Math.floor((Date.now()-d)/1000);
  if(s<60)return'ahora'; if(s<3600)return Math.floor(s/60)+'min';
  if(s<86400)return Math.floor(s/3600)+'h'; return Math.floor(s/86400)+'d';
}
const _sleep=ms=>new Promise(r=>setTimeout(r,ms));
function _getCache(){ try{ const r=localStorage.getItem(CACHE_KEY); if(!r)return null; const o=JSON.parse(r); return(Date.now()-o.ts)<CACHE_TTL?o.data:null; }catch(e){return null;} }
function _setCache(d){ try{localStorage.setItem(CACHE_KEY,JSON.stringify({ts:Date.now(),data:d}));}catch(e){} }

// ── Fetch ANN ────────────────────────────────────────────────────────
async function _fetchANN(){
  const proxies=[
    `https://api.allorigins.win/get?url=${encodeURIComponent(ANN_RSS)}`,
    `https://corsproxy.io/?${encodeURIComponent(ANN_RSS)}`,
  ];
  for(const url of proxies){
    try{
      const res=await fetch(url,{signal:AbortSignal.timeout(8000)});
      if(!res.ok)continue;
      let txt=null;
      const clone=res.clone();
      try{ const j=await res.json(); txt=j&&j.contents?j.contents:null; }
      catch(e){ txt=await clone.text(); }
      if(!txt||!txt.includes('<rss'))continue;
      const dom=new DOMParser().parseFromString(txt,'text/xml');
      return[...dom.querySelectorAll('item')].slice(0,40).map(it=>({
        title:it.querySelector('title')?.textContent||'',
        link:it.querySelector('link')?.textContent||'',
        pubDate:it.querySelector('pubDate')?.textContent||'',
        desc:it.querySelector('description')?.textContent||'',
        cat:it.querySelector('category')?.textContent?.toLowerCase()||'',
      }));
    }catch(e){continue;}
  }
  return[];
}

function _classify(item){
  const txt=(item.title+' '+item.cat+' '+item.desc).toLowerCase();
  const kw=['licens','licencia','crunchyroll','netflix','funimation','studio','estudio',
    'streaming','mappa','ufotable','toei','award','premio','event','evento',
    'viz media','shueisha','kadokawa','hidive','announce','anuncia','produc'];
  for(const k of kw){if(txt.includes(k))return'industria';}
  return'anime';
}

async function _fetchJikan(s){
  if(!s.jikanId)return[];
  const isA=typeof data!=='undefined'&&data.anime&&data.anime.some(x=>x.id===s.id);
  const type=isA?'anime':'manga';
  try{
    const res=await fetch(`https://api.jikan.moe/v4/${type}/${s.jikanId}/news?limit=3`,{signal:AbortSignal.timeout(6000)});
    if(res.status===429||!res.ok)return[];
    const j=await res.json();
    return(j.data||[]).slice(0,2).map(n=>({title:n.title||'',link:n.url||'',pubDate:n.date||'',forumEntries:n.forum_entries||0,seriesTitle:s.title,seriesType:type}));
  }catch(e){return[];}
}

async function _loadNews(force){
  if(!force){const c=_getCache();if(c)return c;}
  const r={mis:[],anime:[],industria:[],updatedAt:Date.now()};
  if(typeof data!=='undefined'){
    const reading=[...(data.manga||[]).filter(s=>s.status==='reading'&&s.jikanId),...(data.anime||[]).filter(s=>s.status==='reading'&&s.jikanId)].slice(0,8);
    for(let i=0;i<reading.length;i++){r.mis.push(...await _fetchJikan(reading[i]));if(i<reading.length-1)await _sleep(JIKAN_DELAY);}
    r.mis=r.mis.slice(0,MAX_ITEMS);
  }
  const ann=await _fetchANN();
  for(const item of ann){
    const t=_classify(item);
    if(t==='anime'&&r.anime.length<MAX_ITEMS)r.anime.push(item);
    if(t==='industria'&&r.industria.length<MAX_ITEMS)r.industria.push(item);
    if(r.anime.length>=MAX_ITEMS&&r.industria.length>=MAX_ITEMS)break;
  }
  _setCache(r);return r;
}

// ── SVG ──────────────────────────────────────────────────────────────
const _iBook =`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const _iFilm =`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
const _iGlobe=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
const _iRefr =`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
const _iClock=`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

// ── Render item ───────────────────────────────────────────────────────
function _renderItem(item,tipo){
  const isA=tipo==='anime'||(tipo==='mis'&&item.seriesType==='anime');
  const isI=tipo==='industria';
  const barC=isI?'p39-bar-i':isA?'p39-bar-a':'p39-bar-m';
  const icoC=isI?'p39-ico-i':isA?'p39-ico-a':'p39-ico-m';
  const srcC=isI?'p39-src-i':isA?'p39-src-a':'p39-src-m';
  const ico=isI?_iGlobe:isA?_iFilm:_iBook;
  const clr=isI?'#fbbf24':isA?'#c084fc':'#00e5a0';
  let src='';
  if(tipo==='mis'){const t=item.seriesTitle||'';src=(t.length>16?t.slice(0,14)+'…':t)+' · '+(item.seriesType==='anime'?'Anime':'Manga');}
  else{src=isI?'Industria':'Anime';}
  const age=item.pubDate?Date.now()-new Date(item.pubDate).getTime():9e9;
  const badge=age<6*3600*1000?'<span class="p39-badge p39-badge-new">NUEVO</span>':(item.forumEntries||0)>50?'<span class="p39-badge p39-badge-hot">POPULAR</span>':'';
  const t=_ago(item.pubDate||'');
  const el=document.createElement('a');
  el.className='p39-item';el.href=item.link||'#';el.target='_blank';el.rel='noopener noreferrer';
  el.innerHTML=`<div class="p39-bar ${barC}"></div><div class="p39-ico ${icoC}" style="color:${clr}">${ico}</div><div class="p39-body"><div class="p39-src ${srcC}">${src}</div><div class="p39-headline">${item.title}</div><div class="p39-foot">${t?`<span class="p39-time">${t}</span>`:''}${t&&badge?'<div class="p39-dotsep"></div>':''}${badge}</div></div><span class="p39-arr">›</span>`;
  return el;
}

// ── Estado ────────────────────────────────────────────────────────────
let _tab='mis', _nd=null, _busy=false;
let _fixedPanel=null, _inlinePanel=null;

// Devuelve el panel actualmente visible
function _activePanel(){
  return _fixedPanel&&_fixedPanel.style.display!=='none' ? _fixedPanel : _inlinePanel;
}

function _renderFeed(tipo, panelEl){
  _tab=tipo;
  const p=panelEl||_activePanel();
  if(!p||!_nd)return;
  const fc=p.querySelector('.p39-fc');
  if(!fc)return;
  fc.innerHTML='';
  p.querySelectorAll('.p39-tab').forEach(b=>{
    const t=b.dataset.tab,map={mis:'on',anime:'on-a',industria:'on-i'};
    b.className='p39-tab'+(t===tipo?' '+map[t]:'');
  });
  const items=_nd[tipo]||[];
  if(!items.length){
    const e=document.createElement('div');e.className='p39-empty';
    e.textContent=tipo==='mis'?'Agrega series desde MAL para ver noticias':'No se pudieron cargar. Intenta refrescar.';
    fc.appendChild(e);return;
  }
  const feed=document.createElement('div');feed.className='p39-feed';
  items.forEach(item=>feed.appendChild(_renderItem(item,tipo)));
  fc.appendChild(feed);
}

function _buildContent(panelEl, nd){
  _nd=nd;
  panelEl.innerHTML='';
  const counts={mis:(nd.mis||[]).length,anime:(nd.anime||[]).length,industria:(nd.industria||[]).length};
  const min=Math.round((Date.now()-(nd.updatedAt||Date.now()))/60000);
  const updStr=min<1?'ahora mismo':`hace ${min} min`;

  const hdr=document.createElement('div'); hdr.className='p39-phdr';
  hdr.innerHTML=`<div class="p39-title-row"><div class="p39-pulse"></div><span class="p39-lbl">Noticias</span><span class="p39-upd" id="p39-upd-${panelEl.id}">${updStr}</span></div><div class="p39-tabs">${['mis','anime','industria'].map(t=>{const L={mis:'Mis series',anime:'Anime',industria:'Industria'},C={mis:'on',anime:'on-a',industria:'on-i'};return`<button class="p39-tab${t===_tab?' '+C[t]:''}" data-tab="${t}">${L[t]}<span class="p39-cnt">${counts[t]||0}</span><div class="p39-tab-ul"></div></button>`;}).join('')}</div>`;
  panelEl.appendChild(hdr);
  hdr.querySelectorAll('.p39-tab').forEach(b=>{ b.onclick=()=>_renderFeed(b.dataset.tab, panelEl); });

  const fc=document.createElement('div'); fc.className='p39-fc';
  panelEl.appendChild(fc);
  _renderFeed(_tab, panelEl);

  const footer=document.createElement('div'); footer.className='p39-footer';
  footer.innerHTML=`<div class="p39-fl">${_iClock} 30 min</div><div class="p39-fr"><button class="p39-btn p39-ref-btn">${_iRefr} Refrescar</button><div class="p39-fsep"></div><button class="p39-btn p39-ann-btn">ANN ›</button></div>`;
  panelEl.appendChild(footer);
  footer.querySelector('.p39-ref-btn').onclick=()=>_refresh(true);
  footer.querySelector('.p39-ann-btn').onclick=()=>window.open('https://www.animenewsnetwork.com','_blank');
}

async function _refresh(force){
  if(_busy)return; _busy=true;
  [_fixedPanel,_inlinePanel].forEach(p=>{ if(p){ const fc=p.querySelector('.p39-fc'); if(fc)fc.innerHTML=`<div class="p39-loading"><div class="p39-spinner"></div>Cargando...</div>`; }});
  try{
    const nd=await _loadNews(force); _nd=nd;
    [_fixedPanel,_inlinePanel].forEach(p=>{ if(p&&p.style.display!=='none') _renderFeed(_tab,p); });
    document.querySelectorAll('[id^="p39-upd-"]').forEach(el=>el.textContent='ahora mismo');
  }catch(e){
    [_fixedPanel,_inlinePanel].forEach(p=>{ if(p){ const fc=p.querySelector('.p39-fc'); if(fc)fc.innerHTML='<div class="p39-empty">Error. Intenta de nuevo.</div>'; }});
  }finally{_busy=false;}
}

// ── Posicionamiento ───────────────────────────────────────────────────
function _position(){
  const appEl=document.getElementById('app');
  if(!appEl||!_fixedPanel||!_inlinePanel)return;
  const appRect=appEl.getBoundingClientRect();
  const spaceRight=window.innerWidth-appRect.right;

  if(spaceRight>=PANEL_W+GAP*2){
    // Hay espacio — mostrar panel fixed a la derecha, ocultar inline
    _fixedPanel.style.display='block';
    _fixedPanel.style.left=(appRect.right+GAP)+'px';
    _fixedPanel.style.width=PANEL_W+'px';
    _inlinePanel.style.display='none';
  }else{
    // Sin espacio — ocultar fixed, mostrar inline
    _fixedPanel.style.display='none';
    _inlinePanel.style.display='flex';
    _inlinePanel.style.flexDirection='column';
  }
}

// ── Inicialización ────────────────────────────────────────────────────
let _ready=false;
let _lastReadingKey='';

async function _setup(){
  if(_ready)return;
  _ready=true;

  // Panel fixed (body)
  _fixedPanel=document.createElement('div');
  _fixedPanel.id='p39-panel';
  document.body.appendChild(_fixedPanel);

  // Panel inline (dentro del #app antes de .mgnav)
  _inlinePanel=document.createElement('div');
  _inlinePanel.id='p39-inline';
  const navEl=document.querySelector('.mgnav');
  if(navEl&&navEl.parentNode){
    navEl.parentNode.insertBefore(_inlinePanel,navEl);
  }

  // Skeleton en ambos
  const skHtml=`<div class="p39-loading"><div class="p39-spinner"></div>Cargando noticias...</div>`;
  _fixedPanel.innerHTML=skHtml;
  _inlinePanel.innerHTML=skHtml;

  // Posicionar antes de cargar (determina cuál se muestra)
  _position();

  // Cargar datos
  const nd=await _loadNews(false);
  _buildContent(_fixedPanel, nd);
  _buildContent(_inlinePanel, nd);
  _position();
}

window.addEventListener('resize',_position,{passive:true});

// ── Hook en render() ─────────────────────────────────────────────────
const _origRender=window.render;
window.render=function(){
  _origRender.apply(this,arguments);
  setTimeout(()=>{
    if(!_ready){
      _setup();
    }else{
      // Re-insertar inline si el DOM fue reconstruido
      if(_inlinePanel&&!document.getElementById('p39-inline')){
        const nav=document.querySelector('.mgnav');
        if(nav&&nav.parentNode) nav.parentNode.insertBefore(_inlinePanel,nav);
      }
      _position();
      // Invalidar caché si cambiaron las series en reading
      if(typeof data!=='undefined'){
        const key=[...(data.manga||[]),...(data.anime||[])].filter(s=>s.status==='reading'&&s.jikanId).map(s=>s.id).sort().join(',');
        if(_lastReadingKey&&_lastReadingKey!==key){localStorage.removeItem(CACHE_KEY);_refresh(true);}
        _lastReadingKey=key;
      }
    }
  },150);
};

})();
