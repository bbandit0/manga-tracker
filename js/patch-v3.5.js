// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.5 — Rediseño de perfiles de amigo
//  Instalación: <script src="js/patch-v3.5.js"></script> después de patch-v3.4.js
// ═══════════════════════════════════════════════════════════════════════

(function(){
  if(window._v35Patched) return;
  window._v35Patched = true;

  // ── CSS ────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.id = "mangu-patch-v35-css";
  style.textContent = `

/* ═══════════════════════════════════════
   PERFIL DE AMIGO v3.5
   ═══════════════════════════════════════ */

/* Banner más alto y dramático */
.v35-banner {
  position: relative;
  overflow: hidden;
  height: 200px;
}
.v35-banner-bg {
  position: absolute; inset: 0;
  background-size: cover;
  background-position: center top;
  filter: brightness(.4) saturate(1.6);
  transition: opacity .8s ease;
}
.v35-banner-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,.0) 0%,
    rgba(10,14,26,.6) 60%,
    rgba(10,14,26,.98) 100%
  );
  z-index: 1;
}
.v35-banner-pattern {
  position: absolute; inset: 0; z-index: 0;
  background:
    repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0,rgba(255,255,255,.02) 1px,transparent 1px,transparent 18px),
    radial-gradient(ellipse 90% 90% at 15% 60%,rgba(104,211,145,.12) 0%,transparent 55%),
    radial-gradient(ellipse 70% 90% at 88% 20%,rgba(99,179,237,.1) 0%,transparent 55%);
}
.v35-banner-info {
  position: absolute; bottom: 12px; left: 20px; right: 20px;
  z-index: 3;
  display: flex; align-items: center; gap: 8px;
}
.v35-banner-series {
  font-size: 11px; font-weight: 700;
  color: rgba(255,255,255,.75);
  flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  text-shadow: 0 1px 8px rgba(0,0,0,.95);
}
.v35-banner-pct {
  font-size: 9px; font-family: 'Space Mono', monospace;
  color: rgba(255,255,255,.5);
  background: rgba(0,0,0,.5); padding: 1px 7px;
  border-radius: 4px; flex-shrink: 0;
}

/* Avatar + header info */
.v35-profile-header {
  display: flex; align-items: flex-end; gap: 14px;
  padding: 0 20px 16px;
  margin-top: -50px;
  position: relative; z-index: 3;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.v35-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.1);
  object-fit: cover; flex-shrink: 0;
  background: rgba(255,255,255,.05);
}
.v35-avatar-ph {
  width: 72px; height: 72px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.1);
  background: linear-gradient(135deg,rgba(99,179,237,.25),rgba(104,211,145,.15));
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 800; color: var(--t1);
  flex-shrink: 0;
}
.v35-header-meta { flex: 1; min-width: 0; padding-bottom: 4px; }
.v35-username {
  font-size: 18px; font-weight: 800;
  color: var(--t1); letter-spacing: -.02em;
  margin-bottom: 4px;
}
.v35-rank-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700;
  padding: 2px 9px; border-radius: 20px;
  margin-bottom: 6px;
  border: 1px solid;
}
.v35-header-counts {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.v35-hcount {
  font-size: 10px; color: var(--t3);
  font-family: 'Space Mono', monospace;
}
.v35-hcount b { color: var(--t2); font-weight: 600; }

/* Stats enriquecidas */
.v35-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,.05);
}
.v35-stat {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}
.v35-stat-val {
  font-size: 18px; font-weight: 800;
  font-family: 'Space Mono', monospace;
  line-height: 1; margin-bottom: 4px;
}
.v35-stat-lbl {
  font-size: 9px; color: var(--t3);
  text-transform: uppercase; letter-spacing: .07em;
  font-weight: 600;
}
.v35-stat-sub {
  font-size: 8px; color: var(--t3);
  margin-top: 2px; font-family: 'Space Mono', monospace;
}

/* Panel de compatibilidad rediseñado */
.v35-compat {
  margin: 0 16px 12px;
  background: rgba(0,0,0,.2);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px;
  overflow: hidden;
}
.v35-compat-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 10px;
}
.v35-compat-label {
  font-size: 11px; font-weight: 700; color: var(--t1);
  display: flex; align-items: center; gap: 6px;
}
.v35-compat-score {
  font-family: 'Space Mono', monospace;
  font-size: 20px; font-weight: 800;
}
.v35-compat-bar-wrap {
  margin: 0 16px 10px;
  height: 6px; background: rgba(255,255,255,.07);
  border-radius: 4px; overflow: hidden;
}
.v35-compat-bar-fill {
  height: 100%; border-radius: 4px;
  transition: width .8s cubic-bezier(.34,1.56,.64,1);
}
.v35-compat-details {
  padding: 0 16px 14px;
  display: flex; gap: 8px; flex-wrap: wrap;
}
.v35-compat-chip {
  font-size: 9px; font-weight: 700;
  padding: 3px 9px; border-radius: 20px;
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.08);
  color: var(--t2);
}
.v35-compare-text {
  font-size: 11px; color: var(--t2);
  padding: 0 16px 12px;
  line-height: 1.5;
}

/* Series en común — chips visuales */
.v35-common {
  margin: 0 16px 14px;
  padding: 12px 14px;
  background: rgba(99,179,237,.05);
  border: 1px solid rgba(99,179,237,.14);
  border-radius: 12px;
}
.v35-common-lbl {
  font-size: 9px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  margin-bottom: 8px;
}
.v35-common-chips {
  display: flex; flex-wrap: wrap; gap: 5px;
}
.v35-common-chip {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px;
  background: rgba(99,179,237,.1);
  border: 1px solid rgba(99,179,237,.2);
  color: var(--t1);
  padding: 3px 9px; border-radius: 20px;
}
.v35-common-chip-dot {
  width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
}

/* Lista de series con portadas */
.v35-series-list {
  display: flex; flex-direction: column;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255,255,255,.06);
}
.v35-series-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  transition: background .12s;
}
.v35-series-item:last-child { border-bottom: none; }
.v35-series-item:hover { background: rgba(255,255,255,.02); }
.v35-series-cover {
  width: 36px; height: 50px; border-radius: 5px;
  object-fit: cover; flex-shrink: 0;
}
.v35-series-cover-ph {
  width: 36px; height: 50px; border-radius: 5px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800; font-style: italic;
}
.v35-series-info { flex: 1; min-width: 0; }
.v35-series-title {
  font-size: 12px; font-weight: 600; color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 3px;
}
.v35-series-prog {
  font-size: 10px; color: var(--t2); margin-bottom: 4px;
}
.v35-series-pbar {
  height: 2px; background: rgba(255,255,255,.07);
  border-radius: 2px; overflow: hidden;
}
.v35-series-pfill {
  height: 100%; border-radius: 2px;
  transition: width .4s ease;
}
.v35-series-badge {
  flex-shrink: 0; font-size: 8px; font-weight: 700;
  padding: 2px 6px; border-radius: 8px;
  border: 1px solid;
}

/* Mini grid catálogo 3 columnas para series en progreso */
.v35-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 4px 0;
}
.v35-mini-card {
  position: relative; border-radius: 8px; overflow: hidden;
  background: rgba(255,255,255,.04);
  cursor: default;
  aspect-ratio: 2/3;
}
.v35-mini-cover {
  width: 100%; height: 100%; object-fit: cover;
  display: block;
}
.v35-mini-cover-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 800; font-style: italic;
}
.v35-mini-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 100%);
  padding: 14px 6px 6px;
}
.v35-mini-title {
  font-size: 9px; font-weight: 700; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 3px;
}
.v35-mini-pct {
  font-size: 8px; font-family: 'Space Mono', monospace;
  color: rgba(255,255,255,.6);
}
.v35-mini-type {
  position: absolute; top: 5px; right: 5px;
  font-size: 7px; font-weight: 800;
  padding: 1px 5px; border-radius: 4px;
  letter-spacing: .04em;
}

/* Tabs de secciones */
.v35-tab-bar {
  display: flex; border-bottom: 1px solid rgba(255,255,255,.06);
  padding: 0 16px;
  overflow-x: auto; scrollbar-width: none;
}
.v35-tab-bar::-webkit-scrollbar { display: none; }
.v35-tab-btn {
  font-size: 11px; font-weight: 600; color: var(--t3);
  padding: 10px 14px;
  border-bottom: 2px solid transparent;
  cursor: pointer; white-space: nowrap;
  transition: color .15s, border-color .15s;
  background: none; border-top: none; border-left: none; border-right: none;
  font-family: 'Outfit', sans-serif;
}
.v35-tab-btn.active {
  color: var(--t1);
  border-bottom-color: var(--am);
}
.v35-tab-content {
  padding: 14px 16px;
}

/* Placeholder gradiente para series sin portada */
.v35-cover-gradient-1 { background: linear-gradient(135deg,#1a1535,#0d0b1f); }
.v35-cover-gradient-2 { background: linear-gradient(135deg,#0e2030,#071520); }
.v35-cover-gradient-3 { background: linear-gradient(135deg,#1a1020,#0d0815); }
.v35-cover-gradient-4 { background: linear-gradient(135deg,#0e1a10,#070d08); }
.v35-cover-gradient-5 { background: linear-gradient(135deg,#201510,#100a08); }

/* Rank badge colors */
.v35-rank-scroll   { background: rgba(139,92,246,.12); border-color: rgba(139,92,246,.3); color: #a78bfa; }
.v35-rank-katana   { background: rgba(99,179,237,.12); border-color: rgba(99,179,237,.3); color: #63b3ed; }
.v35-rank-ryuu     { background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.3); color: #34d399; }
.v35-rank-kami     { background: rgba(245,158,11,.12); border-color: rgba(245,158,11,.3); color: #f59e0b; }
.v35-rank-shinigami{ background: rgba(239,68,68,.12);  border-color: rgba(239,68,68,.3);  color: #f87171; }

/* Animación entrada */
.v35-profile-wrap { animation: v35fadeIn .25s ease; }
@keyframes v35fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

/* Nota parche */
.v35-injected { animation: v35fadeIn .3s ease; }

  `;
  document.head.appendChild(style);

  // ── HELPERS ────────────────────────────────────────────────────────

  // Sistema de rango basado en caps totales
  function _getRank(totalCaps){
    if(totalCaps >= 5000) return {icon:"💀",label:"Shinigami",cls:"v35-rank-shinigami"};
    if(totalCaps >= 2000) return {icon:"⚡",label:"Kami",cls:"v35-rank-kami"};
    if(totalCaps >= 800)  return {icon:"🐉",label:"Ryuu",cls:"v35-rank-ryuu"};
    if(totalCaps >= 300)  return {icon:"⚔️",label:"Katana",cls:"v35-rank-katana"};
    return                       {icon:"📜",label:"Lector",cls:"v35-rank-scroll"};
  }

  // Gradiente determinístico por título (sin random, siempre igual)
  function _titleGradient(title){
    let h=0; for(let i=0;i<title.length;i++) h=(h*31+title.charCodeAt(i))&0xFFFFFF;
    return `v35-cover-gradient-${(h%5)+1}`;
  }

  // Color de texto para el gradiente de cover
  function _coverTextColor(type){ return type==="M"?"#a78bfa":"#34d399"; }

  // Estima tiempo invertido: 8 min/cap manga, 23 min/ep anime
  function _estimateTime(mangaCaps, animeEps){
    const min = mangaCaps*8 + animeEps*23;
    if(min < 60) return min+"m";
    const h = Math.floor(min/60);
    if(h < 24) return h+"h";
    return Math.floor(h/24)+"d";
  }

  // Construye el HTML de un item de serie con portada
  function _buildSeriesItem(s, ac, idx){
    const isM = s.type==="M";
    const clr = isM ? ac : "var(--aa)";
    const pct = s.total>0 ? Math.round((s.completed||0)/s.total*100) : 0;
    const lastCh = s.lastChapter||(s.completed)||0;
    const chLbl = isM?"Cap.":"Ep.";
    const gradClass = _titleGradient(s.title);
    const coverHtml = (s.cover&&typeof s.cover==="string"&&s.cover.startsWith("http"))
      ? `<img class="v35-series-cover" src="${s.cover}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="v35-series-cover-ph ${gradClass}" style="display:none;color:${_coverTextColor(s.type)}">${s.title.charAt(0)}</div>`
      : `<div class="v35-series-cover-ph ${gradClass}" style="color:${_coverTextColor(s.type)}">${s.title.charAt(0)}</div>`;
    const bg = idx%2===0 ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.01)";
    return `<div class="v35-series-item" style="background:${bg}">
      ${coverHtml}
      <div class="v35-series-info">
        <div class="v35-series-title">${s.title}</div>
        <div class="v35-series-prog">${chLbl} <b style="color:var(--t1)">${lastCh}</b>${s.total>0?` / ${s.total} · <span style="color:${clr}">${pct}%</span>`:""}</div>
        <div class="v35-series-pbar"><div class="v35-series-pfill" style="width:${pct}%;background:${clr}"></div></div>
      </div>
      <span class="v35-series-badge" style="color:${clr};background:${isM?"var(--amd)":"var(--aad)"};border-color:${isM?"rgba(99,179,237,.2)":"rgba(104,211,145,.2)"}">${isM?"M":"A"}</span>
    </div>`;
  }

  // Construye mini-grid de portadas (vista catálogo compacta)
  function _buildMiniGrid(arr, ac){
    if(!arr.length) return `<div class="fn-status">Sin series en progreso</div>`;
    return `<div class="v35-mini-grid">${arr.slice(0,6).map(s=>{
      const isM=s.type==="M";
      const clr=isM?ac:"var(--aa)";
      const pct=s.total>0?Math.round((s.completed||0)/s.total*100):0;
      const hasCover=s.cover&&typeof s.cover==="string"&&s.cover.startsWith("http");
      const gradClass=_titleGradient(s.title);
      return `<div class="v35-mini-card">
        ${hasCover
          ?`<img class="v35-mini-cover" src="${s.cover}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <div class="v35-mini-cover-ph ${gradClass}" style="display:none;color:${_coverTextColor(s.type)};font-size:18px">${s.title.charAt(0)}</div>`
          :`<div class="v35-mini-cover-ph ${gradClass}" style="color:${_coverTextColor(s.type)}">${s.title.charAt(0)}</div>`
        }
        <div class="v35-mini-type" style="background:${isM?"rgba(167,139,250,.8)":"rgba(52,211,153,.8)"};color:#fff">${isM?"M":"A"}</div>
        <div class="v35-mini-overlay">
          <div class="v35-mini-title">${s.title}</div>
          <div class="v35-mini-pct">${pct}%</div>
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  // ── FUNCIÓN PRINCIPAL: reemplaza el render del perfil expandido ────
  // Intercepta renderFriendsPanel y sustituye el innerHTML del perfil
  // con el nuevo diseño una vez que el DOM está construido.
  const _origRFP = window.renderFriendsPanel;
  window.renderFriendsPanel = async function(){
    await _origRFP();

    // Solo actuar si estamos en vista de perfil de amigo
    if(typeof friendsState==="undefined") return;
    if(friendsState.view !== "profile" || !friendsState.viewingUid) return;

    const container = document.getElementById("friends-panel-container");
    if(!container) return;

    const fp = document.querySelector(".fn-profile");
    if(!fp) return;

    // Obtener los datos ya cargados por el render original
    const pData = friendsState.viewingData;
    if(!pData) return;

    // Datos del amigo
    const _pUsername = pData.username || "usuario";
    const allSeries = [
      ...(pData.allManga||pData.topManga||[]).map(s=>({...s,type:"M"})),
      ...(pData.allAnime||pData.topAnime||[]).map(s=>({...s,type:"A"}))
    ];
    const reading   = allSeries.filter(s=>s.status==="reading").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
    const completed = allSeries.filter(s=>s.status==="completed").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,8);
    const paused    = allSeries.filter(s=>s.status==="paused"||s.status==="plan").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,6);

    const totalMangaCh = (pData.allManga||pData.topManga||[]).reduce((s,x)=>s+(x.completed||0),0);
    const totalAnimeEp = (pData.allAnime||pData.topAnime||[]).reduce((s,x)=>s+(x.completed||0),0);
    const totalCaps    = totalMangaCh + totalAnimeEp;
    const rank         = _getRank(totalCaps);
    const timeEst      = _estimateTime(totalMangaCh, totalAnimeEp);

    // Compat
    const _compat = typeof calcCompatibility==="function"
      ? calcCompatibility(data, pData)
      : {score:0,label:"Sin datos",color:"#4a5568",emoji:"🎲"};

    // Comparación personal
    const myTotalCaps = data.manga.reduce((s,x)=>s+x.completed.length,0)+data.anime.reduce((s,x)=>s+x.completed.length,0);
    const friendTotalCaps = totalCaps;
    const diffCaps = Math.abs(myTotalCaps-friendTotalCaps);
    const ac = typeof theme!=="undefined" ? theme.accentManga : "#63b3ed";
    const compareText = myTotalCaps>friendTotalCaps
      ? `Tú llevas <b style="color:${ac}">${diffCaps} caps más</b> en total`
      : myTotalCaps<friendTotalCaps
      ? `<b style="color:#f87171">@${_pUsername} te lleva ${diffCaps} caps</b>`
      : `Están <b style="color:#34d399">empatados</b> en caps totales`;

    // Tags compatibles (para chips de compatibilidad)
    const myTags = new Set([...data.manga,...data.anime].flatMap(s=>s.tags||[]));
    const friendTags = new Set(allSeries.flatMap(s=>s.tags||[]));
    const commonTags = [...myTags].filter(t=>friendTags.has(t)).slice(0,5);

    // Series en común
    const myMangaTitles = new Set(data.manga.map(s=>s.title.toLowerCase().trim()));
    const myAnimeTitles = new Set(data.anime.map(s=>s.title.toLowerCase().trim()));
    const commonManga = (pData.allManga||pData.topManga||[]).filter(s=>myMangaTitles.has((s.title||"").toLowerCase().trim())).map(s=>s.title).slice(0,4);
    const commonAnime = (pData.allAnime||pData.topAnime||[]).filter(s=>myAnimeTitles.has((s.title||"").toLowerCase().trim())).map(s=>s.title).slice(0,4);
    const allCommon = [...new Set([...commonManga,...commonAnime])].slice(0,6);

    // Banner: reutilizar la imagen que el render original ya cargó
    const bannerImg = fp.querySelector("#fp-banner-img");
    const bannerSrc = bannerImg?.src || "";
    const _topS = reading[0]||null;
    const _topPct = _topS&&_topS.total>0?Math.round((_topS.completed||0)/_topS.total*100):0;

    // Hash color para fallback del banner
    let _hv=0; for(let i=0;i<_pUsername.length;i++){_hv=(_hv*31+_pUsername.charCodeAt(i))&0xFFFFFF;}_hv=_hv%360;
    const _b1=`hsl(${_hv},65%,30%)`,_b2=`hsl(${(_hv+55)%360},60%,22%)`,_b3=`hsl(${(_hv+115)%360},55%,17%)`;
    const fallbackBg=`linear-gradient(135deg,${_b1} 0%,${_b2} 55%,${_b3} 100%)`;

    // Avatar
    const avatarHtml = pData.avatarUrl
      ? `<img class="v35-avatar" src="${pData.avatarUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="v35-avatar-ph" style="display:none">${_pUsername.charAt(0).toUpperCase()}</div>`
      : `<div class="v35-avatar-ph">${_pUsername.charAt(0).toUpperCase()}</div>`;

    const vuid = friendsState.viewingUid;

    // Series por tab
    const readingManga = reading.filter(s=>s.type==="M");
    const readingAnime = reading.filter(s=>s.type==="A");

    // Construir listas HTML
    const buildList = (arr) => arr.length
      ? `<div class="v35-series-list">${arr.map((s,i)=>_buildSeriesItem(s,ac,i)).join("")}</div>`
      : `<div class="fn-status">Sin series aquí</div>`;

    // ── RENDER NUEVO ──────────────────────────────────────────────────
    fp.className = "fn-profile v35-profile-wrap";
    fp.style.padding = "0";
    fp.innerHTML = `

      <!-- Botones de control -->
      <div style="padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05)">
        <button class="fn-btn sec" onclick="friendsState.view='list';friendsState.viewingUid=null;friendsState.viewingData=null;renderFriendsPanel()" style="font-size:11px;padding:6px 12px">← Volver</button>
        <span style="flex:1"></span>
        <button style="padding:6px 12px;border:1px solid rgba(231,76,76,.3);background:rgba(231,76,76,.07);color:var(--t3);font-size:10px;border-radius:10px;cursor:pointer;font-weight:600;font-family:'Outfit',sans-serif;transition:.15s"
          onmouseover="this.style.color='var(--dng)';this.style.borderColor='var(--dng)'"
          onmouseout="this.style.color='var(--t3)';this.style.borderColor='rgba(231,76,76,.3)'"
          onclick="showModal('Eliminar amigo','¿Eliminar a @${_pUsername} de tus amigos?','❌',()=>fnRemoveFriend('${vuid}'))">✕ Eliminar</button>
      </div>

      <!-- Banner -->
      <div class="v35-banner" style="background:${fallbackBg}">
        <div class="v35-banner-pattern"></div>
        ${bannerSrc ? `<div class="v35-banner-bg" style="background-image:url('${bannerSrc}')"></div>` : ""}
        <div class="v35-banner-overlay"></div>
        ${_topS ? `<div class="v35-banner-info">
          <span class="v35-banner-series">▶ ${_topS.title}</span>
          <span class="v35-banner-pct">${_topPct}%</span>
        </div>` : ""}
      </div>

      <!-- Avatar + header -->
      <div class="v35-profile-header">
        ${avatarHtml}
        <div class="v35-header-meta">
          <div class="v35-username">@${_pUsername}</div>
          <span class="v35-rank-badge ${rank.cls}">${rank.icon} ${rank.label}</span>
          <div class="v35-header-counts">
            <span class="v35-hcount"><b>${pData.mangaCount||0}</b> manga</span>
            <span class="v35-hcount" style="color:rgba(255,255,255,.15)">·</span>
            <span class="v35-hcount"><b>${pData.animeCount||0}</b> anime</span>
            <span class="v35-hcount" style="color:rgba(255,255,255,.15)">·</span>
            <span class="v35-hcount" style="color:var(--suc)"><b>${reading.length}</b> en curso</span>
          </div>
        </div>
      </div>

      <!-- Stats enriquecidas: caps, eps, tiempo, completados -->
      <div class="v35-stats-grid">
        <div class="v35-stat">
          <div class="v35-stat-val" style="color:${ac}">${totalMangaCh}</div>
          <div class="v35-stat-lbl">📖 Caps</div>
        </div>
        <div class="v35-stat">
          <div class="v35-stat-val" style="color:var(--aa)">${totalAnimeEp}</div>
          <div class="v35-stat-lbl">▶ Eps</div>
        </div>
        <div class="v35-stat">
          <div class="v35-stat-val" style="color:#fbbf24">${timeEst}</div>
          <div class="v35-stat-lbl">⏱ Tiempo</div>
          <div class="v35-stat-sub">estimado</div>
        </div>
        <div class="v35-stat">
          <div class="v35-stat-val" style="color:#34d399">${completed.length}</div>
          <div class="v35-stat-lbl">✅ Complet.</div>
        </div>
      </div>

      <!-- Compatibilidad rediseñada -->
      <div class="v35-compat">
        <div class="v35-compat-header">
          <div class="v35-compat-label">
            <span style="font-size:16px">${_compat.emoji}</span>
            <span>${_compat.label}</span>
          </div>
          <span class="v35-compat-score" style="color:${_compat.color}">${_compat.score}%</span>
        </div>
        <div class="v35-compat-bar-wrap">
          <div class="v35-compat-bar-fill" style="width:${_compat.score}%;background:linear-gradient(90deg,${_compat.color}88,${_compat.color})"></div>
        </div>
        ${commonTags.length>0 ? `<div class="v35-compat-details">
          ${commonTags.map(t=>`<span class="v35-compat-chip">🎯 ${t}</span>`).join("")}
        </div>` : ""}
        <div class="v35-compare-text">${compareText}</div>
      </div>

      <!-- Series en común -->
      ${allCommon.length>0 ? `<div class="v35-common">
        <div class="v35-common-lbl" style="color:${ac}">🤝 En común (${allCommon.length})</div>
        <div class="v35-common-chips">
          ${allCommon.map(t=>{
            const isM=commonManga.includes(t);
            const clr=isM?ac:"var(--aa)";
            return `<span class="v35-common-chip">
              <span class="v35-common-chip-dot" style="background:${clr}"></span>
              ${t}
            </span>`;
          }).join("")}
        </div>
      </div>` : ""}

      <!-- Tabs: En progreso / Completados / En pausa -->
      <div class="v35-tab-bar" id="v35-tab-bar">
        <button class="v35-tab-btn active" data-tab="reading" onclick="window._v35setTab('reading')">
          ▶ En progreso (${reading.length})
        </button>
        <button class="v35-tab-btn" data-tab="grid" onclick="window._v35setTab('grid')">
          🖼 Portadas
        </button>
        ${completed.length>0?`<button class="v35-tab-btn" data-tab="completed" onclick="window._v35setTab('completed')">✅ Completados (${completed.length})</button>`:""}
        ${paused.length>0?`<button class="v35-tab-btn" data-tab="paused" onclick="window._v35setTab('paused')">⏸ Pausados (${paused.length})</button>`:""}
      </div>

      <!-- Contenido de tabs -->
      <div class="v35-tab-content" id="v35-tab-content">
        <!-- Se rellena por _v35setTab() -->
      </div>
    `;

    // Datos para los tabs (accesibles desde el closure de _v35setTab)
    window._v35TabData = {
      reading, readingManga, readingAnime,
      completed, paused, ac,
      buildList,
      currentSubTab: friendsState.profileInlineTab||"manga"
    };

    // Render del tab activo inicial
    window._v35setTab("reading");
  };

  // ── Tab switcher ───────────────────────────────────────────────────
  window._v35setTab = function(tabId){
    const bar     = document.getElementById("v35-tab-bar");
    const content = document.getElementById("v35-tab-content");
    const d       = window._v35TabData;
    if(!bar||!content||!d) return;

    // Actualizar botones activos
    bar.querySelectorAll(".v35-tab-btn").forEach(b=>{
      b.classList.toggle("active", b.dataset.tab===tabId);
    });

    const ac = d.ac;
    let html = "";

    if(tabId==="reading"){
      if(!d.reading.length){ html=`<div class="fn-status">Nada en progreso</div>`; }
      else {
        // Sub-tabs Manga / Anime dentro de "En progreso"
        const subTab = d.currentSubTab||"manga";
        html = `
          <div style="display:flex;gap:8px;margin-bottom:12px">
            <button onclick="window._v35TabData.currentSubTab='manga';window._v35setTab('reading')"
              style="flex:1;padding:7px;border-radius:8px;font-size:11px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
              background:${subTab==="manga"?"rgba(99,179,237,.15)":"rgba(255,255,255,.04)"};
              border:1px solid ${subTab==="manga"?"rgba(99,179,237,.3)":"rgba(255,255,255,.07)"};
              color:${subTab==="manga"?ac:"var(--t3)"}">
              📚 Manga (${d.readingManga.length})
            </button>
            <button onclick="window._v35TabData.currentSubTab='anime';window._v35setTab('reading')"
              style="flex:1;padding:7px;border-radius:8px;font-size:11px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
              background:${subTab==="anime"?"rgba(104,211,145,.15)":"rgba(255,255,255,.04)"};
              border:1px solid ${subTab==="anime"?"rgba(104,211,145,.3)":"rgba(255,255,255,.07)"};
              color:${subTab==="anime"?"var(--aa)":"var(--t3)"}">
              🎬 Anime (${d.readingAnime.length})
            </button>
          </div>
          ${subTab==="manga"
            ? (d.readingManga.length ? `<div class="v35-series-list">${d.readingManga.map((s,i)=>_buildSeriesItem(s,ac,i)).join("")}</div>` : `<div class="fn-status">Sin manga en progreso</div>`)
            : (d.readingAnime.length ? `<div class="v35-series-list">${d.readingAnime.map((s,i)=>_buildSeriesItem(s,ac,i)).join("")}</div>` : `<div class="fn-status">Sin anime en progreso</div>`)
          }`;
      }
    } else if(tabId==="grid"){
      html = _buildMiniGrid(d.reading, ac);
    } else if(tabId==="completed"){
      html = d.completed.length
        ? `<div class="v35-series-list">${d.completed.map((s,i)=>_buildSeriesItem(s,ac,i)).join("")}</div>`
        : `<div class="fn-status">Sin completados</div>`;
    } else if(tabId==="paused"){
      html = d.paused.length
        ? `<div class="v35-series-list">${d.paused.map((s,i)=>_buildSeriesItem(s,ac,i)).join("")}</div>`
        : `<div class="fn-status">Sin pausados</div>`;
    }

    content.innerHTML = html;
  };

  // ── PATCH NOTES v3.5 ───────────────────────────────────────────────
  const V35_HTML=`<div class="patch-version v35-injected"><div class="patch-ver-tag">Parche v3.5 — 2026-05</div><ul class="patch-ver-items"><li>🎨 <b>Rediseño completo del perfil de amigo</b> — nuevo layout con banner más alto (200px) y overlay dramático; sin tocar community.js, el render original se intercepta y reemplaza el DOM post-render</li><li>🏅 <b>Sistema de rango</b> — badge junto al username según caps totales leídos: 📜 Lector (0-299), ⚔️ Katana (300-799), 🐉 Ryuu (800-1999), ⚡ Kami (2000-4999), 💀 Shinigami (5000+)</li><li>📊 <b>Stats enriquecidas</b> — 4 cards con caps, eps, tiempo invertido estimado (8min/cap manga · 23min/ep anime) y completados; reemplaza el grid genérico anterior</li><li>🎯 <b>Compatibilidad rediseñada</b> — panel con emoji grande, barra animada y chips de tags en común; más legible que el texto anterior "GUSTOS DISTINTOS"</li><li>🤝 <b>Series en común mejoradas</b> — chips con punto de color (morado manga / verde anime) indicando el tipo de cada serie compartida</li><li>🖼 <b>Tab "Portadas"</b> — mini-grid 3 columnas con las portadas de las series en progreso del amigo; placeholder con gradiente determinístico por título cuando no hay imagen</li><li>📚 <b>Portadas en listas de series</b> — todas las listas (en progreso, completados, pausados) muestran miniatura 36×50px con fallback a gradiente de color; las series sin portada HTTP usan gradiente único generado del título</li><li>🗂 <b>Tabs: En progreso / Portadas / Completados / Pausados</b> — navegación por tabs con sub-tabs Manga/Anime dentro de "En progreso"; reemplaza los tabs anteriores de community.js</li></ul></div>`;

  // Inyectar en notas del parche (mismo mecanismo que v3.4)
  function _injectV35Note(){
    const pp=document.querySelector(".patch-panel");
    if(!pp||pp.querySelector(".v35-injected")) return;
    const v34=pp.querySelector(".v34-injected");
    const ref=v34||pp.querySelector("h3");
    if(!ref) return;
    const div=document.createElement("div");
    div.innerHTML=V35_HTML;
    if(v34) v34.insertAdjacentElement("afterend",div.firstElementChild);
    else ref.insertAdjacentElement("afterend",div.firstElementChild);
  }
  const patchObs35=new MutationObserver(()=>_injectV35Note());
  patchObs35.observe(document.body,{childList:true,subtree:true});

})();
// ── FIN PARCHE v3.5 ────────────────────────────────────────────────────
