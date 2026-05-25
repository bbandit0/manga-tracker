// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.4 (versión final completa)
//  Instalación: js/patch-v3.4.js — después de ui.js en index.html
// ═══════════════════════════════════════════════════════════════════════

(function(){
  if(window._v34Patched) return;
  window._v34Patched = true;

  // ── CSS COMPLETO ───────────────────────────────────────────────────
  const style = document.createElement("style");
  style.id = "mangu-patch-v34-css";
  style.textContent = `

/* ═══════════════════════════════════════
   PANEL NOVEDADES — Desktop (fixed)
   ═══════════════════════════════════════ */
#v34-news-panel {
  display: none;
  position: fixed;
  top: 16px;
  width: 230px;
  max-height: calc(100vh - 32px);
  overflow-y: auto; overflow-x: hidden;
  scrollbar-width: none;
  z-index: 100;
  background: rgba(13,15,26,.97);
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 14px;
  font-family: 'Outfit', sans-serif;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
#v34-news-panel::-webkit-scrollbar { display: none; }
#v34-news-panel .v34-phdr {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 13px 9px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  background: rgba(13,15,26,.97);
  position: sticky; top: 0; z-index: 1;
}
/* Sección "Esta semana" */
.v34-week-hdr {
  padding: 8px 13px 5px;
  font-size: 9px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  color: var(--t3);
  border-top: 1px solid rgba(255,255,255,.05);
  margin-top: 2px;
}
.v34-week-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid rgba(255,255,255,.03);
  cursor: pointer; transition: background .12s;
}
.v34-week-item:hover { background: rgba(255,255,255,.025); }
.v34-week-mini-cover {
  width: 24px; height: 34px; border-radius: 4px;
  object-fit: cover; flex-shrink: 0;
}
.v34-week-mini-ph {
  width: 24px; height: 34px; border-radius: 4px;
  flex-shrink: 0; display: flex; align-items: center;
  justify-content: center; font-size: 10px; font-weight: 800;
}
.v34-week-info { flex: 1; min-width: 0; }
.v34-week-title {
  font-size: 10px; font-weight: 600; color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 1px;
}
.v34-week-sub { font-size: 9px; color: var(--t2); }
.v34-week-when {
  font-size: 9px; font-weight: 700;
  padding: 1px 6px; border-radius: 20px; flex-shrink: 0;
}

/* Botón +1 en items del panel de novedades */
.v34-plus-btn {
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid rgba(52,211,153,.35);
  background: rgba(52,211,153,.12);
  color: #34d399;
  font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all .15s;
  line-height: 1;
}
.v34-plus-btn:hover {
  background: rgba(52,211,153,.25);
  border-color: rgba(52,211,153,.6);
  transform: scale(1.08);
}
.v34-plus-btn:active { transform: scale(.95); }
.v34-plus-btn:disabled {
  opacity: .3; cursor: not-allowed; transform: none;
}
.v34-plus-btn.manga-btn {
  border-color: rgba(167,139,250,.35);
  background: rgba(167,139,250,.12);
  color: #a78bfa;
}
.v34-plus-btn.manga-btn:hover {
  background: rgba(167,139,250,.25);
  border-color: rgba(167,139,250,.6);
}

/* Mini toast de feedback +1 en panel */
.v34-mini-toast {
  position: fixed;
  z-index: 9999;
  background: rgba(13,15,26,.95);
  border: 1px solid rgba(52,211,153,.4);
  color: #34d399;
  font-size: 11px; font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  pointer-events: none;
  animation: v34toastAnim .9s ease forwards;
}
@keyframes v34toastAnim {
  0%   { opacity:0; transform:translateY(0) scale(.8); }
  20%  { opacity:1; transform:translateY(-8px) scale(1); }
  70%  { opacity:1; transform:translateY(-12px) scale(1); }
  100% { opacity:0; transform:translateY(-20px) scale(.9); }
}
  width: 7px; height: 7px; border-radius: 50%;
  background: #34d399; flex-shrink: 0;
  animation: v34pulse 2s infinite;
}
@keyframes v34pulse {
  0%,100%{ box-shadow:0 0 0 3px rgba(52,211,153,.15); }
  50%     { box-shadow:0 0 0 5px rgba(52,211,153,.05); }
}
.v34-hdr-title {
  font-size: 11px; font-weight: 700;
  color: var(--t1); letter-spacing:.01em;
}
.v34-nbadge {
  font-size: 9px; font-weight: 700;
  background: rgba(52,211,153,.15); color: #34d399;
  border: 1px solid rgba(52,211,153,.3);
  border-radius: 20px; padding: 1px 7px;
}

/* Items desktop */
#v34-news-panel .v34-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  cursor: pointer; transition: background .12s;
}
#v34-news-panel .v34-item:last-child { border-bottom: none; }
#v34-news-panel .v34-item:hover { background: rgba(255,255,255,.03); }
#v34-news-panel .v34-item.v34-unread { border-left: 2.5px solid; }
.v34-cover {
  width: 30px; height: 42px; border-radius: 5px;
  object-fit: cover; flex-shrink: 0;
}
.v34-cover-ph {
  width: 30px; height: 42px; border-radius: 5px; flex-shrink: 0;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:800; font-style:italic;
}
.v34-info { flex:1; min-width:0; }
.v34-tpill {
  font-size:8px; font-weight:700; letter-spacing:.06em;
  padding:1px 5px; border-radius:20px;
  display:inline-block; margin-bottom:2px;
}
.v34-title {
  font-size:11px; font-weight:600; color:var(--t1);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:1px;
}
.v34-sub  { font-size:10px; color:var(--t2); }
.v34-right { text-align:right; flex-shrink:0; }
.v34-when  { font-size:10px; font-weight:700; margin-bottom:1px; }
.v34-udot  { width:6px; height:6px; border-radius:50%; background:#6377ed; flex-shrink:0; }

/* ═══════════════════════════════════════
   PANEL NOVEDADES — Mobile (inline)
   ═══════════════════════════════════════ */
#v34-mob {
  margin: 0 0 14px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px; overflow: hidden;
  font-family: 'Outfit', sans-serif;
}
#v34-mob .v34-phdr {
  display:flex; align-items:center; gap:7px;
  padding:9px 13px 8px;
  border-bottom:1px solid rgba(255,255,255,.05);
  background:linear-gradient(90deg,rgba(99,119,237,.07) 0%,transparent 70%);
}
#v34-mob .v34-chips {
  display:flex; gap:8px; overflow-x:auto;
  padding:10px 12px 8px;
  scrollbar-width:none; -webkit-overflow-scrolling:touch;
}
#v34-mob .v34-chips::-webkit-scrollbar { display:none; }
.v34-chip {
  flex-shrink:0; width:145px;
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.08);
  border-radius:9px; padding:9px 10px;
  cursor:pointer; transition:background .12s;
  position:relative; overflow:hidden;
}
.v34-chip:hover { background:rgba(255,255,255,.06); }
.v34-chip-stripe { position:absolute; top:0; left:0; right:0; height:2px; }
.v34-chip-type { font-size:8px; font-weight:700; letter-spacing:.07em; margin-bottom:3px; }
.v34-chip-title {
  font-size:11px; font-weight:700; color:var(--t1);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
}
.v34-chip-sub { font-size:10px; color:var(--t2); margin-bottom:6px; }
.v34-chip-when { font-size:9px; font-weight:700; padding:2px 7px; border-radius:20px; display:inline-block; }
.v34-chip-dot { position:absolute; top:8px; right:8px; width:6px; height:6px; border-radius:50%; background:#6377ed; }
#v34-mob-hint { text-align:center; font-size:9px; color:var(--t3); padding:0 0 7px; letter-spacing:.05em; }

/* ═══════════════════════════════════════
   INDICADOR VISUAL EN CATÁLOGO
   Punto verde pulsante en cards con cap nuevo
   ═══════════════════════════════════════ */
.v34-cat-new-dot {
  position: absolute;
  top: 6px; left: 6px;
  width: 9px; height: 9px;
  border-radius: 50%;
  background: #34d399;
  border: 2px solid rgba(13,15,26,.8);
  z-index: 3;
  animation: v34catpulse 2s infinite;
}
@keyframes v34catpulse {
  0%,100%{ box-shadow:0 0 0 0 rgba(52,211,153,.5); }
  50%     { box-shadow:0 0 0 4px rgba(52,211,153,.0); }
}
/* Franja superior en card del catálogo con cap nuevo */
.v34-cat-new-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #34d399, #6377ed);
  z-index: 3;
  border-radius: 8px 8px 0 0;
}

/* ═══════════════════════════════════════
   BADGE "NUEVO" EN TABS
   ═══════════════════════════════════════ */
.v34-tab-badge {
  display: inline-flex;
  align-items: center; justify-content: center;
  min-width: 16px; height: 16px;
  background: #34d399;
  color: #0d0f1a;
  font-size: 9px; font-weight: 800;
  border-radius: 20px;
  padding: 0 4px;
  margin-left: 4px;
  vertical-align: middle;
  animation: v34badgepop .3s ease;
}
@keyframes v34badgepop {
  0%  { transform: scale(0); opacity:0; }
  70% { transform: scale(1.2); }
  100%{ transform: scale(1); opacity:1; }
}

/* ═══════════════════════════════════════
   SKELETON LOADING — Continuar Leyendo
   ═══════════════════════════════════════ */
@keyframes v34shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.v34-skel-card {
  flex-shrink: 0;
  width: 110px;
  border-radius: 10px;
  overflow: hidden;
}
.v34-skel-cover {
  width: 110px; height: 155px;
  border-radius: 8px; margin-bottom: 6px;
  background: linear-gradient(90deg,
    rgba(255,255,255,.04) 0%,
    rgba(255,255,255,.08) 50%,
    rgba(255,255,255,.04) 100%);
  background-size: 800px 100%;
  animation: v34shimmer 1.4s ease infinite;
}
.v34-skel-line {
  height: 8px; border-radius: 4px; margin-bottom: 5px;
  background: linear-gradient(90deg,
    rgba(255,255,255,.04) 0%,
    rgba(255,255,255,.07) 50%,
    rgba(255,255,255,.04) 100%);
  background-size: 800px 100%;
  animation: v34shimmer 1.4s ease infinite;
}
.v34-skel-line.short { width: 60%; }

/* ═══════════════════════════════════════
   RECUADRO FECHA en card expandido
   Colapsable en mobile
   ═══════════════════════════════════════ */
.v34-airbox {
  margin:0 0 10px;
  background:linear-gradient(135deg,rgba(99,119,237,.09) 0%,rgba(52,211,153,.04) 100%);
  border:1px solid rgba(99,119,237,.2); border-radius:10px;
  overflow: hidden;
}
.v34-airbox-toggle {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 13px;
  cursor: pointer;
  user-select: none;
}
.v34-airbox-toggle:hover { background: rgba(255,255,255,.02); }
.v34-airbox-lbl {
  font-size:9px; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:#6377ed;
}
.v34-airbox-toggle-right {
  display: flex; align-items: center; gap: 7px;
}
.v34-airbox-badge {
  font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px;
}
.v34-airbox-chv {
  font-size: 10px; color: var(--t3);
  transition: transform .2s;
}
.v34-airbox-chv.open { transform: rotate(180deg); }
.v34-airbox-body {
  padding: 0 13px 10px;
  display: none; /* JS toggle */
}
.v34-airbox-body.open { display: block; }
.v34-airbox-main {
  display:flex; align-items:baseline; gap:7px; margin-bottom:6px;
}
.v34-airbox-num {
  font-size:19px; font-weight:800; color:var(--t1);
  font-family:'Space Mono',monospace; letter-spacing:-.02em;
}
.v34-airbox-eptitle {
  font-size:11px; color:var(--t2); font-style:italic; flex:1;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.v34-airbox-dates {
  display:flex; align-items:center; justify-content:space-between;
  font-size:10px; color:var(--t2);
}
.v34-airbox-dval { font-weight:600; color:var(--t1); }

/* En desktop: expandido por defecto */
@media (min-width: 641px) {
  .v34-airbox-body { display: block !important; }
  .v34-airbox-chv { display: none; }
  .v34-airbox-toggle { cursor: default; }
}

@keyframes v34skel { 0%,100%{opacity:.35} 50%{opacity:.65} }
.v34-skel { animation:v34skel 1.2s ease infinite; }

/* ═══════════════════════════════════════
   PATCH NOTES — nota v3.4
   ═══════════════════════════════════════ */
.v34-injected { animation: v34FadeIn .3s ease; }
@keyframes v34FadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }

  `;
  document.head.appendChild(style);

  // ── HELPERS ────────────────────────────────────────────────────────
  function _ago(ts){
    if(!ts) return "";
    const ms=Date.now()-ts, m=Math.floor(ms/60000);
    if(m<1) return "ahora";
    if(m<60) return `hace ${m}m`;
    const h=Math.floor(ms/3600000);
    if(h<24) return `hace ${h}h`;
    const d=Math.floor(ms/86400000);
    if(d===1) return "ayer";
    if(d<7) return `hace ${d}d`;
    return new Date(ts).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
  }

  const _airCache={}, _schedCache={};

  async function _fetchAir(jid,type,ep){
    const k=`${jid}-${type}-${ep}`;
    if(k in _airCache) return _airCache[k];

    // Para anime: AniList tiene datos de episodios mucho más completos que Jikan.
    // Estrategia: AniList primero para el episodio actual, Jikan como fallback.
    if(type==="anime"){
      try{
        const gql=`{Media(idMal:${jid},type:ANIME){
          airingSchedule(page:1,perPage:50){nodes{episode airingAt}}
          nextAiringEpisode{episode airingAt}
        }}`;
        const r=await fetch("https://graphql.anilist.co",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({query:gql}),signal:AbortSignal.timeout(5000)
        });
        if(r.ok){
          const j=await r.json();
          const nodes=j?.data?.Media?.airingSchedule?.nodes||[];
          // Buscar el episodio exacto en el schedule
          const node=nodes.find(n=>n.episode===ep);
          if(node&&node.airingAt){
            const result={date:new Date(node.airingAt*1000),title:null};
            // Intentar obtener el título del ep de Jikan en paralelo (no bloqueante)
            _fetchAir_jikanTitle(jid,ep).then(t=>{if(t) result.title=t;});
            return (_airCache[k]=result);
          }
          // Si no está en el schedule pero el ep ya existe (serie finalizada),
          // buscar por nextAiringEpisode para saber si está antes del próximo
          const nae=j?.data?.Media?.nextAiringEpisode;
          if(nae&&ep<nae.episode){
            // El ep ya se emitió pero AniList no tiene el schedule histórico
            // Estimar: el ep se emitió semanalmente antes del nae
            const weeksBack=nae.episode-ep;
            const estimatedDate=new Date((nae.airingAt-weeksBack*7*86400)*1000);
            return (_airCache[k]={date:estimatedDate,title:null});
          }
        }
      }catch(e){}
      // Fallback a Jikan si AniList no tiene datos
    }

    // Para manga y fallback de anime: Jikan
    try{
      const e2=type==="manga"?"manga":"anime", f=type==="manga"?"chapters":"episodes";
      const r=await _jikanFetch(`https://api.jikan.moe/v4/${e2}/${jid}/${f}?page=${Math.ceil(ep/100)}`,8000,1);
      if(!r||!Array.isArray(r.data)) return (_airCache[k]=null);
      const entry=r.data.find(e=>{
        const n=type==="anime"?Number(e.mal_id||e.episode_id||e.episode):parseFloat(e.chapter||e.chapters||"0");
        return Math.floor(n)===ep;
      });
      if(!entry) return (_airCache[k]=null);
      const from=type==="anime"?(entry.aired?.from||entry.air_date||null):(entry.published?.from||null);
      return (_airCache[k]={date:from?new Date(from):null,title:entry.title||entry.name||null});
    }catch(e){return(_airCache[k]=null);}
  }

  // Helper: obtiene solo el título del episodio desde Jikan (no bloquea el flujo principal)
  async function _fetchAir_jikanTitle(jid,ep){
    try{
      const r=await _jikanFetch(`https://api.jikan.moe/v4/anime/${jid}/episodes?page=${Math.ceil(ep/100)}`,5000,1);
      const entry=r?.data?.find(e=>Number(e.mal_id||e.episode_id||e.episode)===ep);
      return entry?.title||entry?.name||null;
    }catch(e){return null;}
  }

  async function _fetchSched(jid){
    if(jid in _schedCache) return _schedCache[jid];
    try{
      const gql=`{Media(idMal:${jid},type:ANIME){nextAiringEpisode{episode airingAt}}}`;
      const r=await fetch("https://graphql.anilist.co",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query:gql}),signal:AbortSignal.timeout(5000)
      });
      if(!r.ok) return (_schedCache[jid]=null);
      const j=await r.json();
      const nae=j?.data?.Media?.nextAiringEpisode;
      if(!nae) return (_schedCache[jid]=null);
      return (_schedCache[jid]={episode:nae.episode,date:new Date(nae.airingAt*1000)});
    }catch(e){return(_schedCache[jid]=null);}
  }

  function _badge(date){
    if(!date) return {label:"Sin datos",bg:"rgba(255,255,255,.08)",color:"var(--t3)"};
    const diff=Math.ceil((date.getTime()-Date.now())/86400000);
    if(diff<=0){
      const ago=Math.abs(Math.floor((date.getTime()-Date.now())/86400000));
      return {label:`✓ ${ago===0?"Hoy":ago===1?"Ayer":"Hace "+ago+"d"}`,bg:"rgba(52,211,153,.15)",color:"#34d399"};
    }
    if(diff<=7) return {label:`En ${diff}d`,bg:"rgba(251,191,36,.12)",color:"#fbbf24"};
    return {label:date.toLocaleDateString("es-CL",{day:"numeric",month:"short"}),bg:"rgba(99,119,237,.12)",color:"#a5b4fc"};
  }

  // ── BUILD NEWS ITEMS ───────────────────────────────────────────────
  function _items(){
    const now=Date.now(), res=[];
    for(const t of ["manga","anime"]){
      (data[t]||[]).filter(s=>s.status==="reading"||s.status==="plan").forEach(s=>{
        const nc=typeof nextChapter==="function"?nextChapter(s):null;
        const upToDate=nc===null&&s.total>0&&!s.jikanPublishing;
        const fresh=s.lastUpdated&&(now-s.lastUpdated)<48*3600*1000;
        res.push({id:s.id,title:s.title,type:t,total:s.total,
          completed:s.completed?.length||0,nextCap:nc,upToDate,
          pub:s.jikanPublishing||false,jid:s.jikanId||null,
          cover:s.cover||"",lu:s.lastUpdated||0,unread:nc!==null&&fresh});
      });
    }
    return res.sort((a,b)=>{
      if(a.unread!==b.unread) return a.unread?-1:1;
      if(a.pub!==b.pub) return a.pub?-1:1;
      return (b.lu||0)-(a.lu||0);
    });
  }

  // Series en emisión que están AL DÍA (para "Esta semana")
  function _upToDatePub(){
    const res=[];
    for(const t of ["manga","anime"]){
      (data[t]||[]).filter(s=>(s.status==="reading"||s.status==="plan")&&s.jikanPublishing&&s.jikanId).forEach(s=>{
        const nc=typeof nextChapter==="function"?nextChapter(s):null;
        if(nc===null) res.push({id:s.id,title:s.title,type:t,jid:s.jikanId,cover:s.cover||""});
      });
    }
    return res;
  }

  function _texts(item){
    const L=item.type==="manga"?"Cap.":"Ep.";
    if(item.unread)              return {sub:`${L} ${item.nextCap} disponible`,   when:_ago(item.lu),   wc:"#34d399"};
    if(item.nextCap!==null&&item.pub) return {sub:`${L} ${item.nextCap} — próx.`, when:"En emisión",    wc:"#fbbf24"};
    if(item.upToDate)            return {sub:"Al día ✓",                          when:_ago(item.lu),   wc:"var(--t3)"};
    if(item.nextCap!==null)      return {sub:`${L} ${item.nextCap} pendiente`,    when:_ago(item.lu),   wc:"var(--t2)"};
    return {sub:"",when:"",wc:"var(--t2)"};
  }

  function _nav(item){
    if(typeof tab!=="undefined"){
      tab=item.type; expanded[item.id]=true; pinnedId=item.id; viewMode="list";
      render();
      setTimeout(()=>document.querySelector(`[data-id="${item.id}"]`)
        ?.scrollIntoView({behavior:"smooth",block:"center"}),200);
    }
  }

  // Mini toast flotante para feedback +1 desde el panel
  function _miniToast(btn, text){
    const rect=btn.getBoundingClientRect();
    const t=document.createElement("div"); t.className="v34-mini-toast";
    t.textContent=text;
    t.style.left=(rect.left+rect.width/2)+"px";
    t.style.top=(rect.top-4)+"px";
    t.style.transform="translateX(-50%)";
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),950);
  }

  // Marca +1 desde el panel de novedades sin abrir el card
  function _markPlusOne(item, btn, subEl, whenEl){
    if(btn.disabled) return;
    btn.disabled=true;
    const series=(data[item.type]||[]).find(s=>s.id===item.id);
    if(!series){btn.disabled=false;return;}
    const nc=typeof nextChapter==="function"?nextChapter(series):null;
    if(nc===null){btn.disabled=false;return;}
    // Marcar
    if(!series.completed.includes(nc)) series.completed.push(nc);
    series.completed.sort((a,b)=>a-b);
    series.lastUpdated=Date.now();
    if(series.jikanPublishing&&nc>series.total) series.total=nc;
    const wasCompleted=series.completed.length===series.total&&series.total>0&&!series.jikanPublishing;
    if(wasCompleted){series.status="completed";}
    else if(series.status==="plan") series.status="reading";
    // Efectos
    if(typeof p29PlayTick==="function") p29PlayTick();
    if(typeof p29BumpGoal==="function") p29BumpGoal();
    if(typeof p28TouchStreak==="function") p28TouchStreak();
    const L=item.type==="manga"?"Cap.":"Ep.";
    _miniToast(btn,`${L} ${nc} ✓`);
    if(typeof save==="function") save();
    // Actualizar UI del item en el panel sin re-renderizar todo
    const newNc=typeof nextChapter==="function"?nextChapter(series):null;
    if(subEl){
      if(newNc===null&&series.jikanPublishing) subEl.textContent="Al día · en emisión";
      else if(newNc===null) subEl.textContent="Al día ✓";
      else subEl.textContent=`${L} ${newNc} disponible`;
    }
    if(whenEl){whenEl.textContent="ahora";whenEl.style.color="#34d399";}
    if(newNc===null) btn.disabled=true; // al día: deshabilitar
    else btn.disabled=false;
    // Re-render diferido para actualizar contadores
    setTimeout(()=>{ if(typeof render==="function") render(); },400);
  }

  // ── DESKTOP PANEL ──────────────────────────────────────────────────
  function _desktopPanel(items){
    const unread=items.filter(i=>i.unread).length;
    const p=document.createElement("div"); p.id="v34-news-panel";

    // Header
    const hdr=document.createElement("div"); hdr.className="v34-phdr";
    const dot=document.createElement("div"); dot.className="v34-live-dot";
    const ttl=document.createElement("span"); ttl.className="v34-hdr-title"; ttl.textContent="Novedades";
    hdr.append(dot,ttl);
    if(unread>0){const b=document.createElement("span");b.className="v34-nbadge";b.textContent=`${unread} nuevo${unread>1?"s":""}`;hdr.appendChild(b);}
    p.appendChild(hdr);

    // Items con cap pendiente
    items.slice(0,8).forEach(item=>{
      const ac=item.type==="manga"?"#a78bfa":"#34d399";
      const {sub,when,wc}=_texts(item);
      const el=document.createElement("div");
      el.className="v34-item"+(item.unread?" v34-unread":"");
      if(item.unread) el.style.borderLeftColor=ac;

      let cov;
      if(item.cover){cov=document.createElement("img");cov.className="v34-cover";cov.src=item.cover;cov.onerror=()=>cov.style.display="none";}
      else{cov=document.createElement("div");cov.className="v34-cover-ph";cov.style.cssText=`background:${item.type==="manga"?"rgba(167,139,250,.12)":"rgba(52,211,153,.1)"};color:${ac};`;cov.textContent=item.title.charAt(0);}

      const info=document.createElement("div"); info.className="v34-info";
      const subSpan=document.createElement("div"); subSpan.className="v34-sub"; subSpan.textContent=sub;
      info.innerHTML=`<span class="v34-tpill" style="background:${item.type==="manga"?"rgba(167,139,250,.15)":"rgba(52,211,153,.1)"};color:${ac};">${item.type==="manga"?"MANGA":"ANIME"}</span><div class="v34-title">${item.title}</div>`;
      info.appendChild(subSpan);

      const right=document.createElement("div"); right.className="v34-right";
      const whenEl=document.createElement("div"); whenEl.className="v34-when"; whenEl.style.color=wc; whenEl.textContent=when;
      right.appendChild(whenEl);

      // Botón +1 — solo si hay cap pendiente
      const plusBtn=document.createElement("button");
      plusBtn.className="v34-plus-btn"+(item.type==="manga"?" manga-btn":"");
      plusBtn.textContent="+";
      plusBtn.title=`Marcar ${item.type==="manga"?"cap.":"ep."} ${item.nextCap}`;
      if(item.nextCap===null) plusBtn.disabled=true;

      plusBtn.addEventListener("click",(e)=>{
        e.stopPropagation(); // no navegar al card
        _markPlusOne(item,plusBtn,subSpan,whenEl);
      });

      el.append(cov,info,right,plusBtn);
      if(item.unread){const ud=document.createElement("div");ud.className="v34-udot";el.appendChild(ud);}

      // Click en el item (no en el botón +1) navega al card
      el.addEventListener("click",(e)=>{
        if(e.target===plusBtn||plusBtn.contains(e.target)) return;
        _nav(item);
      });

      p.appendChild(el);
    });

    // Sección "Esta semana" — series al día pero con próximo estreno
    const upToDate=_upToDatePub();
    if(upToDate.length>0){
      const secLbl=document.createElement("div"); secLbl.className="v34-week-hdr";
      secLbl.textContent="📅 Esta semana";
      p.appendChild(secLbl);
      upToDate.slice(0,5).forEach(item=>{
        const ac=item.type==="manga"?"#a78bfa":"#34d399";
        const el=document.createElement("div"); el.className="v34-week-item";
        let cov;
        if(item.cover){cov=document.createElement("img");cov.className="v34-week-mini-cover";cov.src=item.cover;cov.onerror=()=>cov.style.display="none";}
        else{cov=document.createElement("div");cov.className="v34-week-mini-ph";cov.style.cssText=`background:${item.type==="manga"?"rgba(167,139,250,.12)":"rgba(52,211,153,.1)"};color:${ac};`;cov.textContent=item.title.charAt(0);}
        const info=document.createElement("div"); info.className="v34-week-info";
        info.innerHTML=`<div class="v34-week-title">${item.title}</div><div class="v34-week-sub">Cargando fecha...</div>`;
        const when=document.createElement("span"); when.className="v34-week-when";
        when.style.cssText="background:rgba(255,255,255,.06);color:var(--t3);"; when.textContent="...";
        el.append(cov,info,when);
        el.onclick=()=>_nav(item);
        p.appendChild(el);
        // Cargar fecha real async
        if(item.type==="anime"&&item.jid){
          _fetchSched(item.jid).then(sc=>{
            if(!sc||!document.body.contains(el)) return;
            const diff=Math.ceil((sc.date.getTime()-Date.now())/86400000);
            const b=_badge(sc.date);
            const sub2=el.querySelector(".v34-week-sub");
            if(sub2) sub2.textContent=`Ep. ${sc.episode} — ${sc.date.toLocaleDateString("es-CL",{day:"numeric",month:"short"})}`;
            when.textContent=b.label; when.style.background=b.bg; when.style.color=b.color;
          });
        } else {
          const sub2=el.querySelector(".v34-week-sub");
          if(sub2) sub2.textContent="En emisión — sin fecha exacta";
          when.textContent="📡"; when.style.color="var(--t2)";
        }
      });
    }

    _enrichSched(items,p,"desktop");
    return p;
  }

  // ── MOBILE PANEL ───────────────────────────────────────────────────
  function _mobilePanel(items){
    const unread=items.filter(i=>i.unread).length;
    const wrap=document.createElement("div"); wrap.id="v34-mob";
    const hdr=document.createElement("div"); hdr.className="v34-phdr";
    const dot=document.createElement("div"); dot.className="v34-live-dot"; dot.style.cssText="width:6px;height:6px;";
    const ttl=document.createElement("span"); ttl.className="v34-hdr-title"; ttl.textContent="Novedades";
    hdr.append(dot,ttl);
    if(unread>0){const b=document.createElement("span");b.className="v34-nbadge";b.textContent=`${unread} nuevo${unread>1?"s":""}`;hdr.appendChild(b);}
    wrap.appendChild(hdr);
    const row=document.createElement("div"); row.className="v34-chips";
    // Combinar items pendientes + al día en emisión
    const upToDate=_upToDatePub().map(i=>({...i,nextCap:null,upToDate:true,pub:true,unread:false,lu:0}));
    const allItems=[...items.slice(0,6),...upToDate.slice(0,4)];
    allItems.forEach(item=>{
      const ac=item.type==="manga"?"#a78bfa":"#34d399";
      const {sub,when,wc}=_texts(item);
      const chip=document.createElement("div"); chip.className="v34-chip";
      const stripe=document.createElement("div"); stripe.className="v34-chip-stripe"; stripe.style.background=ac;
      chip.appendChild(stripe);
      chip.innerHTML+=`<div class="v34-chip-type" style="color:${ac};">${item.type==="manga"?"MANGA":"ANIME"}</div><div class="v34-chip-title">${item.title}</div><div class="v34-chip-sub">${sub||"Al día · en emisión"}</div><span class="v34-chip-when" style="background:${item.unread?"rgba(52,211,153,.15)":item.pub?"rgba(251,191,36,.1)":"rgba(255,255,255,.05)"};color:${wc||"#fbbf24"};">${when||"En emisión"}</span>`;
      if(item.unread){const ud=document.createElement("div");ud.className="v34-chip-dot";chip.appendChild(ud);}
      chip.onclick=()=>_nav(item);
      row.appendChild(chip);
    });
    wrap.appendChild(row);
    const hint=document.createElement("div"); hint.id="v34-mob-hint"; hint.textContent="← desliza →";
    wrap.appendChild(hint);
    _enrichSched(items,wrap,"mobile");
    return wrap;
  }

  async function _enrichSched(items,container,mode){
    for(let i=0;i<items.length;i++){
      const item=items[i];
      if(!item.jid||!item.pub||item.type!=="anime") continue;
      try{
        const sc=await _fetchSched(item.jid); if(!sc) continue;
        const diff=Math.ceil((sc.date.getTime()-Date.now())/86400000);
        const newSub=diff<=0?`Ep. ${sc.episode} disponible`:`Ep. ${sc.episode} — ${sc.date.toLocaleDateString("es-CL",{day:"numeric",month:"short"})}`;
        const newWhen=diff<=0?"Hoy":`En ${diff}d`;
        const newWc=diff<=0?"#34d399":"#fbbf24";
        if(mode==="desktop"){
          const els=container.querySelectorAll(".v34-item");
          const el=els[i]; if(!el) continue;
          const s2=el.querySelector(".v34-sub"), w2=el.querySelector(".v34-when");
          if(s2) s2.textContent=newSub; if(w2){w2.textContent=newWhen;w2.style.color=newWc;}
        } else {
          const chips=container.querySelectorAll(".v34-chip");
          const chip=chips[i]; if(!chip) continue;
          const s2=chip.querySelector(".v34-chip-sub"), w2=chip.querySelector(".v34-chip-when");
          if(s2) s2.textContent=newSub; if(w2){w2.textContent=newWhen;w2.style.color=newWc;}
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,300));
    }
  }

  // ── POSICIONAMIENTO DESKTOP ────────────────────────────────────────
  const PANEL_W=230, GAP=12;
  function _positionPanel(){
    const panel=document.getElementById("v34-news-panel");
    const appEl=document.getElementById("app");
    if(!panel||!appEl) return;
    const appRect=appEl.getBoundingClientRect();
    const spaceLeft=appRect.left;
    if(spaceLeft>=PANEL_W+GAP*2){
      panel.style.display="block";
      panel.style.left=(appRect.left-PANEL_W-GAP)+"px";
      panel.style.width=PANEL_W+"px";
    } else {
      panel.style.display="none";
    }
  }

  // ── SKELETON "CONTINUAR LEYENDO" ───────────────────────────────────
  // Inyecta skeletons mientras las imágenes del carrusel cargan
  function _injectContinueSkeleton(continueRow){
    if(!continueRow) return;
    // Solo si hay imágenes aún cargando
    const imgs=continueRow.querySelectorAll("img");
    let loading=0;
    imgs.forEach(img=>{if(!img.complete) loading++;});
    if(loading===0) return;
    // Agregar placeholders skeleton al final del row
    for(let i=0;i<Math.min(loading,2);i++){
      const sk=document.createElement("div"); sk.className="v34-skel-card";
      sk.innerHTML=`<div class="v34-skel-cover"></div><div class="v34-skel-line"></div><div class="v34-skel-line short"></div>`;
      continueRow.appendChild(sk);
    }
    // Remover skeletons cuando todas las imágenes carguen
    let loaded=0;
    imgs.forEach(img=>{
      const done=()=>{loaded++;if(loaded>=loading)continueRow.querySelectorAll(".v34-skel-card").forEach(s=>s.remove());};
      if(img.complete) done();
      else{img.onload=done;img.onerror=done;}
    });
  }

  // ── BADGE "NUEVO" EN TABS ─────────────────────────────────────────
  // Fix: solo Manga y Anime tienen .tab-c (el span con el conteo de series).
  // Perfil, Descubrir e Historial NO tienen .tab-c → no reciben badge.
  function _injectTabBadges(){
    const now=Date.now();
    const mangaNew=(data.manga||[]).filter(s=>{
      const nc=typeof nextChapter==="function"?nextChapter(s):null;
      return nc!==null&&s.lastUpdated&&(now-s.lastUpdated)<48*3600*1000;
    }).length;
    const animeNew=(data.anime||[]).filter(s=>{
      const nc=typeof nextChapter==="function"?nextChapter(s):null;
      return nc!==null&&s.lastUpdated&&(now-s.lastUpdated)<48*3600*1000;
    }).length;
    document.querySelectorAll("button.tab").forEach(btn=>{
      btn.querySelectorAll(".v34-tab-badge").forEach(b=>b.remove());
      if(!btn.querySelector(".tab-c")) return; // solo Manga y Anime tienen .tab-c
      const txt=btn.textContent||"";
      const count=txt.includes("Manga")?mangaNew:txt.includes("Anime")?animeNew:0;
      if(count>0){
        const b=document.createElement("span"); b.className="v34-tab-badge"; b.textContent=count;
        btn.appendChild(b);
      }
    });
  }

  // ── INDICADORES DE NOVEDAD ────────────────────────────────────────
  // Construye mapa título→id para lookup rápido (evita iterar data[] por cada card)
  function _buildNewSet(){
    const newIds=new Set();
    const now=Date.now();
    for(const t of ["manga","anime"]){
      (data[t]||[]).forEach(s=>{
        const nc=typeof nextChapter==="function"?nextChapter(s):null;
        if(nc!==null&&s.lastUpdated&&(now-s.lastUpdated)<48*3600*1000) newIds.add(s.id);
      });
    }
    return newIds;
  }

  // Mapa título→{id,type} para matchear cards por texto sin iterar todo data[]
  function _buildTitleMap(){
    const m=new Map();
    for(const t of ["manga","anime"]) (data[t]||[]).forEach(s=>m.set(s.title,{id:s.id,type:t}));
    return m;
  }

  // Vista CATÁLOGO (.catc): dot pulsante + franja superior
  function _injectCatalogIndicators(newIds, titleMap){
    if(newIds.size===0) return;
    document.querySelectorAll(".catc").forEach(card=>{
      if(card.querySelector(".v34-cat-new-dot")) return;
      const title=card.querySelector(".catt")?.textContent||"";
      const entry=titleMap.get(title);
      if(!entry||!newIds.has(entry.id)) return;
      const wrap=card.querySelector("div"); if(!wrap) return;
      const dot=document.createElement("div"); dot.className="v34-cat-new-dot";
      const stripe=document.createElement("div"); stripe.className="v34-cat-new-stripe";
      wrap.appendChild(dot);
      wrap.insertBefore(stripe,wrap.firstChild);
      // Badge "NUEVO" sobre la portada (esquina inferior izquierda)
      const badge=document.createElement("div");
      badge.style.cssText="position:absolute;bottom:26px;left:0;right:0;display:flex;justify-content:center;z-index:4;";
      badge.innerHTML=`<span style="font-size:8px;font-weight:800;letter-spacing:.06em;background:linear-gradient(90deg,#34d399,#6377ed);color:#fff;padding:2px 8px;border-radius:20px;box-shadow:0 2px 8px rgba(52,211,153,.4);">NUEVO</span>`;
      wrap.appendChild(badge);
    });
  }

  // Vista LISTA (.scard): franja verde izquierda + badge inline en el título
  function _injectListIndicators(newIds, titleMap){
    if(newIds.size===0) return;
    document.querySelectorAll(".scard").forEach(card=>{
      if(card.querySelector(".v34-list-new-bar")) return;
      const sid=card.getAttribute("data-id"); if(!sid) return;
      let found=false;
      for(const t of ["manga","anime"]){if((data[t]||[]).some(s=>s.id===sid&&newIds.has(sid))){found=true;break;}}
      if(!found) return;
      // Franja izquierda verde (borde del scard completo)
      card.style.borderLeft="2.5px solid #34d399";
      card.style.borderRadius="10px";
      const bar=document.createElement("div"); bar.className="v34-list-new-bar";
      bar.style.display="none"; // solo marker para evitar re-inyección
      card.appendChild(bar);
      // Badge "NUEVO" junto al título
      const titEl=card.querySelector(".stit");
      if(titEl&&!titEl.querySelector(".v34-list-badge")){
        const b=document.createElement("span"); b.className="v34-list-badge";
        b.style.cssText="font-size:8px;font-weight:800;letter-spacing:.05em;background:linear-gradient(90deg,#34d399,#6377ed);color:#fff;padding:1px 7px;border-radius:20px;margin-left:6px;vertical-align:middle;display:inline-block;";
        b.textContent="NUEVO";
        titEl.appendChild(b);
      }
    });
  }

  // ── AIRBOX en card expandido (colapsable en mobile) ───────────────
  function _injectAirbox(cpnl,series,type){
    if(cpnl.querySelector(".v34-airbox")) return;
    const nc=typeof nextChapter==="function"?nextChapter(series):null;
    if(nc===null||!series.jikanId) return;
    const L=type==="manga"?"Cap.":"Ep.";

    const box=document.createElement("div"); box.className="v34-airbox";

    // Toggle header (colapsable en mobile)
    const toggle=document.createElement("div"); toggle.className="v34-airbox-toggle";
    toggle.innerHTML=`<span class="v34-airbox-lbl">📅 Próximo por marcar</span><div class="v34-airbox-toggle-right"><span class="v34-airbox-badge v34-skel" style="background:rgba(255,255,255,.07);color:var(--t3);">cargando...</span><span class="v34-airbox-chv">▼</span></div>`;
    box.appendChild(toggle);

    // Body
    const body=document.createElement("div"); body.className="v34-airbox-body";
    body.innerHTML=`<div class="v34-airbox-main"><span class="v34-airbox-num">${L} ${nc}</span><span class="v34-airbox-eptitle v34-skel" style="color:var(--t3);">consultando Jikan...</span></div><div class="v34-airbox-dates"><span class="v34-skel" style="color:var(--t3);font-size:10px;">buscando fecha...</span></div>`;
    box.appendChild(body);

    // Toggle click (solo efectivo en mobile)
    toggle.addEventListener("click",()=>{
      if(window.innerWidth>640) return;
      const open=body.classList.toggle("open");
      const chv=toggle.querySelector(".v34-airbox-chv");
      if(chv) chv.classList.toggle("open",open);
    });

    // En desktop abrir por defecto
    if(window.innerWidth>640) body.classList.add("open");

    const firstDsec=cpnl.querySelector(".dsec");
    if(firstDsec) cpnl.insertBefore(box,firstDsec); else cpnl.prepend(box);

    _fillAirbox(box,series.jikanId,type,nc);
    if(type==="anime"&&series.jikanPublishing) _fillNextEp(box,series.jikanId,nc);
  }

  async function _fillAirbox(box,jid,type,ep){
    const info=await _fetchAir(jid,type,ep);
    if(!document.body.contains(box)) return;
    const b=_badge(info?.date||null);
    const ds=info?.date?info.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short",year:"numeric"}):null;
    const be=box.querySelector(".v34-airbox-badge");
    const te=box.querySelector(".v34-airbox-eptitle");
    const de=box.querySelector(".v34-airbox-dates");
    if(be){be.textContent=b.label;be.style.background=b.bg;be.style.color=b.color;be.classList.remove("v34-skel");}
    if(te){te.textContent=info?.title?`"${info.title}"`:"";te.classList.remove("v34-skel");}
    if(de){de.classList.remove("v34-skel");de.innerHTML=ds?`<span>📡 Estrenó <span class="v34-airbox-dval">${ds}</span></span>`:`<span style="color:var(--t3)">Fecha no disponible en Jikan</span>`;}
  }

  async function _fillNextEp(box,jid,curEp){
    const sc=await _fetchSched(jid);
    if(!sc||!document.body.contains(box)||sc.episode<=curEp) return;
    const b=_badge(sc.date);
    const ds=sc.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
    const extra=document.createElement("div");
    extra.style.cssText="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05);";
    extra.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);">Próximo estreno</span><span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;background:${b.bg};color:${b.color};">${b.label}</span></div><div style="margin-top:5px;font-size:10px;color:var(--t2);">🗓 Ep. ${sc.episode}<span style="color:var(--t3);margin:0 6px;">·</span><span class="v34-airbox-dval">${ds}</span></div>`;
    const de=box.querySelector(".v34-airbox-dates");
    if(de) de.appendChild(extra);
  }

  // ── NOTA DEL PARCHE v3.4 ──────────────────────────────────────────
  // P28_PATCH_NOTES es const en ui.js, no alcanzable via window.
  // Usamos MutationObserver sobre el body para detectar .patch-panel
  const V34_HTML=`<div class="patch-version v34-injected"><div class="patch-ver-tag">Parche v3.4 — 2026-05</div><ul class="patch-ver-items"><li>📰 <b>Panel de novedades lateral (desktop)</b> — columna fija a la izquierda del #app con position:fixed; se muestra solo cuando hay espacio disponible (mide getBoundingClientRect); incluye sección "Esta semana" con próximos estrenos de series al día en emisión con fechas reales de AniList</li><li>➕ <b>Botón +1 directo en el panel de novedades</b> — cada item del panel tiene un botón +1 para marcar el cap/ep sin abrir el card; actualiza el estado del item en tiempo real con mini toast de feedback; anti-doble-tap incluido</li><li>📅 <b>AniList como fuente primaria de fechas para anime</b> — el recuadro "Próximo por marcar" ahora consulta AniList airingSchedule antes que Jikan para obtener fechas exactas de emisión; Jikan queda como fallback; para eps ya emitidos sin schedule histórico estima la fecha por diferencia semanal respecto al próximo ep conocido</li><li>📱 <b>Carrusel mobile de novedades</b> — banner horizontal scrolleable inline antes de "Continuar leyendo"; chips de 145px con franja de color por tipo, countdown de días, dot azul para no leídos</li><li>🟢 <b>Indicador visual en catálogo</b> — dot verde pulsante, franja de gradiente y badge "NUEVO" en cards con cap disponible en las últimas 48h</li><li>📋 <b>Indicador en vista lista</b> — franja izquierda verde y badge "NUEVO" junto al título de la serie; visible sin expandir el card</li><li>🔴 <b>Fix badge en tabs</b> — corregido bug donde el badge aparecía en Perfil, Descubrir e Historial; ahora solo se aplica a los tabs Manga y Anime (identificados por .tab-c)</li><li>💀 <b>Skeleton loading en Continuar Leyendo</b> — placeholders animados con shimmer mientras cargan las portadas</li><li>📅 <b>Fechas de estreno colapsables en card expandido</b> — recuadro "Próximo por marcar" colapsable en mobile, expandido en desktop; fecha desde AniList/Jikan con countdown en días</li></ul></div>`;

  function _injectPatchNote(){
    const pp=document.querySelector(".patch-panel");
    if(!pp||pp.querySelector(".v34-injected")) return;
    const h3=pp.querySelector("h3");
    if(!h3) return;
    const div=document.createElement("div");
    div.innerHTML=V34_HTML;
    h3.insertAdjacentElement("afterend",div.firstElementChild);
  }

  // Observer sobre body (no solo #app) para capturar patch-panel
  const patchObs=new MutationObserver(()=>_injectPatchNote());
  patchObs.observe(document.body,{childList:true,subtree:true});

  // ── MUTATION OBSERVER para airbox en cards expandidos ────────────
  const obs=new MutationObserver(muts=>{
    muts.forEach(m=>m.addedNodes.forEach(node=>{
      if(!(node instanceof Element)) return;
      const cpnls=node.classList?.contains("cpnl")?[node]:[...node.querySelectorAll(".cpnl")];
      cpnls.forEach(cpnl=>{
        const sc=cpnl.closest(".scard"); if(!sc) return;
        const sid=sc.getAttribute("data-id"); if(!sid) return;
        let series=null,stype=null;
        for(const t of ["manga","anime"]){const f=data[t]?.find(s=>s.id===sid);if(f){series=f;stype=t;break;}}
        if(series?.jikanId) _injectAirbox(cpnl,series,stype);
      });
    }));
  });
  obs.observe(document.getElementById("app")||document.body,{childList:true,subtree:true});

  // ── PATCH render ───────────────────────────────────────────────────
  const _orig=window.render;
  window.render=function(){
    _orig();

    // 1. Limpiar paneles anteriores
    document.getElementById("v34-news-panel")?.remove();
    document.getElementById("v34-mob")?.remove();

    const items=_items();
    const appEl=document.getElementById("app");

    // 2. Panel desktop (body, fixed)
    if(items.length||_upToDatePub().length){
      const dp=_desktopPanel(items);
      document.body.appendChild(dp);
      _positionPanel();
    }

    // 3. Panel mobile (inline antes de continuar leyendo)
    if(items.length||_upToDatePub().length){
      const mp=_mobilePanel(items);
      const cont=appEl?.querySelector(".continue-section");
      if(cont) appEl.insertBefore(mp,cont);
      else if(appEl){const sr=appEl.querySelector(".sr");if(sr)appEl.insertBefore(mp,sr.nextSibling);else appEl.appendChild(mp);}
      // Mostrar/ocultar según espacio
      const appRect=appEl?.getBoundingClientRect();
      mp.style.display=((appRect?.left||0)>=PANEL_W+GAP*2)?"none":"block";
    }

    // 4. Skeleton en continuar leyendo
    const continueRow=appEl?.querySelector(".continue-row");
    if(continueRow) _injectContinueSkeleton(continueRow);

    // 5. Badges en tabs
    requestAnimationFrame(_injectTabBadges);

    // 6. Indicadores en catálogo y vista lista
    requestAnimationFrame(()=>{
      const newIds=_buildNewSet();
      const titleMap=_buildTitleMap();
      _injectCatalogIndicators(newIds, titleMap);
      _injectListIndicators(newIds, titleMap);
    });

    // 7. Nota del parche (por si ya está visible)
    requestAnimationFrame(_injectPatchNote);
  };

  window.addEventListener("resize",()=>{
    _positionPanel();
    const appEl=document.getElementById("app");
    const appRect=appEl?.getBoundingClientRect();
    const mp=document.getElementById("v34-mob");
    if(mp) mp.style.display=((appRect?.left||0)>=PANEL_W+GAP*2)?"none":"block";
  },{passive:true});

  if(typeof render==="function") render();

})();
// ── FIN PARCHE v3.4 ────────────────────────────────────────────────────
