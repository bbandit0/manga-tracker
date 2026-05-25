// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.5 — Rediseño de perfiles de amigo
//  Instalación: <script src="js/patch-v3.5.js"></script> después de patch-v3.4.js
//
//  Estrategia: MutationObserver sobre #friends-panel-container.
//  Detecta cuando community.js inyecta .fn-profile y lo reemplaza
//  inmediatamente. No modifica renderFriendsPanel() ni community.js.
// ═══════════════════════════════════════════════════════════════════════

(function(){
  if(window._v35Patched) return;
  window._v35Patched = true;

  // ── CSS ────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.id = "mangu-patch-v35-css";
  style.textContent = `

/* ═══════════════════════════════════════
   PERFIL AMIGO v3.5 — layout completo
   ═══════════════════════════════════════ */

.v35-wrap { animation: v35in .22s ease; font-family:'Outfit',sans-serif; }
@keyframes v35in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }

/* Banner */
.v35-banner {
  position:relative; overflow:hidden; height:200px;
}
.v35-banner-bg {
  position:absolute; inset:0;
  background-size:cover; background-position:center top;
  filter:brightness(.4) saturate(1.6);
}
.v35-banner-pattern {
  position:absolute; inset:0; z-index:0;
  background:
    repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0,rgba(255,255,255,.02) 1px,transparent 1px,transparent 18px),
    radial-gradient(ellipse 90% 90% at 15% 60%,rgba(104,211,145,.12) 0%,transparent 55%),
    radial-gradient(ellipse 70% 90% at 88% 20%,rgba(99,179,237,.1) 0%,transparent 55%);
}
.v35-banner-overlay {
  position:absolute; inset:0; z-index:1;
  background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(10,14,26,.6) 60%,rgba(10,14,26,.98) 100%);
}
.v35-banner-info {
  position:absolute; bottom:12px; left:20px; right:20px;
  z-index:2; display:flex; align-items:center; gap:8px;
}
.v35-banner-series {
  font-size:11px; font-weight:700; color:rgba(255,255,255,.75);
  flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  text-shadow:0 1px 8px rgba(0,0,0,.95);
}
.v35-banner-pct {
  font-size:9px; font-family:'Space Mono',monospace;
  color:rgba(255,255,255,.5); background:rgba(0,0,0,.5);
  padding:1px 7px; border-radius:4px; flex-shrink:0;
}

/* Header avatar + meta */
.v35-prof-hdr {
  display:flex; align-items:flex-end; gap:14px;
  padding:0 20px 16px; margin-top:-50px;
  position:relative; z-index:3;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.v35-av {
  width:72px; height:72px; border-radius:50%;
  border:3px solid rgba(255,255,255,.1);
  object-fit:cover; flex-shrink:0; display:block;
  background:rgba(255,255,255,.05);
}
.v35-av-ph {
  width:72px; height:72px; border-radius:50%;
  border:3px solid rgba(255,255,255,.1);
  background:linear-gradient(135deg,rgba(99,179,237,.25),rgba(104,211,145,.15));
  display:flex; align-items:center; justify-content:center;
  font-size:28px; font-weight:800; color:var(--t1); flex-shrink:0;
}
.v35-prof-meta { flex:1; min-width:0; padding-bottom:4px; }
.v35-username {
  font-size:18px; font-weight:800; color:var(--t1);
  letter-spacing:-.02em; margin-bottom:5px;
}
.v35-rank {
  display:inline-flex; align-items:center; gap:4px;
  font-size:10px; font-weight:700;
  padding:2px 9px; border-radius:20px; border:1px solid;
  margin-bottom:7px;
}
.v35-rank-scroll   {background:rgba(139,92,246,.12);border-color:rgba(139,92,246,.3);color:#a78bfa;}
.v35-rank-katana   {background:rgba(99,179,237,.12);border-color:rgba(99,179,237,.3);color:#63b3ed;}
.v35-rank-ryuu     {background:rgba(52,211,153,.12);border-color:rgba(52,211,153,.3);color:#34d399;}
.v35-rank-kami     {background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.3);color:#f59e0b;}
.v35-rank-shinigami{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.3);color:#f87171;}
.v35-hcounts {display:flex;gap:10px;flex-wrap:wrap;}
.v35-hcount {font-size:10px;color:var(--t3);font-family:'Space Mono',monospace;}
.v35-hcount b {color:var(--t2);font-weight:600;}

/* Stats */
.v35-stats {
  display:grid; grid-template-columns:repeat(4,1fr);
  gap:8px; padding:14px 16px;
  border-bottom:1px solid rgba(255,255,255,.05);
}
.v35-stat {
  background:rgba(255,255,255,.03);
  border:1px solid rgba(255,255,255,.06);
  border-radius:10px; padding:10px 8px; text-align:center;
}
.v35-stat-v {
  font-size:18px; font-weight:800;
  font-family:'Space Mono',monospace;
  line-height:1; margin-bottom:4px;
}
.v35-stat-l {font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;font-weight:600;}
.v35-stat-s {font-size:8px;color:var(--t3);margin-top:2px;font-family:'Space Mono',monospace;}

/* Compat */
.v35-compat {
  margin:0 16px 12px;
  background:rgba(0,0,0,.2);
  border:1px solid rgba(255,255,255,.07);
  border-radius:14px; overflow:hidden;
}
.v35-compat-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px 8px;
}
.v35-compat-lbl {font-size:11px;font-weight:700;color:var(--t1);display:flex;align-items:center;gap:6px;}
.v35-compat-score {font-family:'Space Mono',monospace;font-size:20px;font-weight:800;}
.v35-compat-bar {margin:0 16px 8px;height:6px;background:rgba(255,255,255,.07);border-radius:4px;overflow:hidden;}
.v35-compat-fill {height:100%;border-radius:4px;transition:width .8s cubic-bezier(.34,1.56,.64,1);}
.v35-compat-tags {display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;}
.v35-compat-tag {
  font-size:9px;font-weight:700;padding:3px 9px;border-radius:20px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:var(--t2);
}
.v35-compare {font-size:11px;color:var(--t2);padding:0 16px 14px;line-height:1.5;}

/* Series en común */
.v35-common {
  margin:0 16px 14px;padding:12px 14px;
  background:rgba(99,179,237,.05);
  border:1px solid rgba(99,179,237,.14); border-radius:12px;
}
.v35-common-lbl {font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;}
.v35-common-chips {display:flex;flex-wrap:wrap;gap:5px;}
.v35-common-chip {
  display:flex;align-items:center;gap:4px;font-size:10px;
  background:rgba(99,179,237,.1);border:1px solid rgba(99,179,237,.2);
  color:var(--t1);padding:3px 9px;border-radius:20px;
}
.v35-cdot {width:5px;height:5px;border-radius:50%;flex-shrink:0;}

/* Tabs */
.v35-tabs {
  display:flex;border-bottom:1px solid rgba(255,255,255,.06);
  padding:0 16px;overflow-x:auto;scrollbar-width:none;
}
.v35-tabs::-webkit-scrollbar{display:none;}
.v35-tab {
  font-size:11px;font-weight:600;color:var(--t3);
  padding:10px 14px;border-bottom:2px solid transparent;
  cursor:pointer;white-space:nowrap;transition:color .15s,border-color .15s;
  background:none;border-top:none;border-left:none;border-right:none;
  font-family:'Outfit',sans-serif;
}
.v35-tab.on {color:var(--t1);border-bottom-color:var(--am);}
.v35-tab-body {padding:14px 16px;}

/* Lista de series con portadas */
.v35-list {display:flex;flex-direction:column;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.06);}
.v35-row {
  display:flex;align-items:center;gap:10px;padding:9px 12px;
  border-bottom:1px solid rgba(255,255,255,.04);transition:background .12s;
}
.v35-row:last-child{border-bottom:none;}
.v35-row:hover{background:rgba(255,255,255,.02);}
.v35-cov {width:36px;height:50px;border-radius:5px;object-fit:cover;flex-shrink:0;}
.v35-cov-ph {
  width:36px;height:50px;border-radius:5px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:800;font-style:italic;
}
.v35-sinfo{flex:1;min-width:0;}
.v35-stitle{font-size:12px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.v35-sprog{font-size:10px;color:var(--t2);margin-bottom:4px;}
.v35-sbar{height:2px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;}
.v35-sbfill{height:100%;border-radius:2px;}
.v35-sbadge{flex-shrink:0;font-size:8px;font-weight:700;padding:2px 6px;border-radius:8px;border:1px solid;}

/* Mini grid portadas */
.v35-grid {display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.v35-gcard {position:relative;border-radius:8px;overflow:hidden;background:rgba(255,255,255,.04);aspect-ratio:2/3;}
.v35-gcov {width:100%;height:100%;object-fit:cover;display:block;}
.v35-gcov-ph {width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;font-style:italic;}
.v35-gov {position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 100%);padding:14px 6px 6px;}
.v35-gtitle {font-size:9px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.v35-gpct {font-size:8px;font-family:'Space Mono',monospace;color:rgba(255,255,255,.6);}
.v35-gtype {position:absolute;top:5px;right:5px;font-size:7px;font-weight:800;padding:1px 5px;border-radius:4px;letter-spacing:.04em;}

/* Gradientes placeholder por título */
.v35-g1{background:linear-gradient(135deg,#1a1535,#0d0b1f);}
.v35-g2{background:linear-gradient(135deg,#0e2030,#071520);}
.v35-g3{background:linear-gradient(135deg,#1a1020,#0d0815);}
.v35-g4{background:linear-gradient(135deg,#0e1a10,#070d08);}
.v35-g5{background:linear-gradient(135deg,#201510,#100a08);}

/* Nota parche */
.v35-injected{animation:v35in .3s ease;}

  `;
  document.head.appendChild(style);

  // ── HELPERS ────────────────────────────────────────────────────────
  function _rank(n){
    if(n>=5000) return {icon:"💀",label:"Shinigami",cls:"v35-rank-shinigami"};
    if(n>=2000) return {icon:"⚡",label:"Kami",cls:"v35-rank-kami"};
    if(n>=800)  return {icon:"🐉",label:"Ryuu",cls:"v35-rank-ryuu"};
    if(n>=300)  return {icon:"⚔️",label:"Katana",cls:"v35-rank-katana"};
    return             {icon:"📜",label:"Lector",cls:"v35-rank-scroll"};
  }
  function _grad(title){
    let h=0; for(let i=0;i<title.length;i++) h=(h*31+title.charCodeAt(i))&0xFFFFFF;
    return "v35-g"+((h%5)+1);
  }
  function _time(mc,ae){
    const m=mc*8+ae*23;
    if(m<60) return m+"m";
    const h=Math.floor(m/60);
    if(h<24) return h+"h";
    return Math.floor(h/24)+"d";
  }
  function _hasCover(s){return s.cover&&typeof s.cover==="string"&&s.cover.startsWith("http");}

  function _rowHtml(s,ac,idx){
    const isM=s.type==="M", clr=isM?ac:"var(--aa)";
    const pct=s.total>0?Math.round((s.completed||0)/s.total*100):0;
    const lch=s.lastChapter||(s.completed)||0;
    const lbl=isM?"Cap.":"Ep.";
    const bg=idx%2===0?"rgba(255,255,255,.02)":"rgba(255,255,255,.01)";
    const covHtml=_hasCover(s)
      ?`<img class="v35-cov" src="${s.cover}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
        <div class="v35-cov-ph ${_grad(s.title)}" style="display:none;color:${isM?"#a78bfa":"#34d399"}">${s.title.charAt(0)}</div>`
      :`<div class="v35-cov-ph ${_grad(s.title)}" style="color:${isM?"#a78bfa":"#34d399"}">${s.title.charAt(0)}</div>`;
    return `<div class="v35-row" style="background:${bg}">
      ${covHtml}
      <div class="v35-sinfo">
        <div class="v35-stitle">${s.title}</div>
        <div class="v35-sprog">${lbl} <b style="color:var(--t1)">${lch}</b>${s.total>0?` / ${s.total} · <span style="color:${clr}">${pct}%</span>`:""}</div>
        <div class="v35-sbar"><div class="v35-sbfill" style="width:${pct}%;background:${clr}"></div></div>
      </div>
      <span class="v35-sbadge" style="color:${clr};background:${isM?"var(--amd)":"var(--aad)"};border-color:${isM?"rgba(99,179,237,.2)":"rgba(104,211,145,.2)"}">${isM?"M":"A"}</span>
    </div>`;
  }

  function _listHtml(arr,ac,empty){
    if(!arr.length) return `<div class="fn-status">${empty}</div>`;
    return `<div class="v35-list">${arr.map((s,i)=>_rowHtml(s,ac,i)).join("")}</div>`;
  }

  function _gridHtml(arr){
    if(!arr.length) return `<div class="fn-status">Sin series en progreso</div>`;
    return `<div class="v35-grid">${arr.slice(0,6).map(s=>{
      const isM=s.type==="M";
      const clr=isM?"#a78bfa":"#34d399";
      const pct=s.total>0?Math.round((s.completed||0)/s.total*100):0;
      const covHtml=_hasCover(s)
        ?`<img class="v35-gcov" src="${s.cover}" loading="lazy" onerror="this.style.display='none';this.nextSibling.style.display='flex'">
          <div class="v35-gcov-ph ${_grad(s.title)}" style="display:none;font-size:18px;color:${clr}">${s.title.charAt(0)}</div>`
        :`<div class="v35-gcov-ph ${_grad(s.title)}" style="color:${clr}">${s.title.charAt(0)}</div>`;
      return `<div class="v35-gcard">
        ${covHtml}
        <div class="v35-gtype" style="background:${isM?"rgba(167,139,250,.85)":"rgba(52,211,153,.85)"};color:#fff">${isM?"M":"A"}</div>
        <div class="v35-gov">
          <div class="v35-gtitle">${s.title}</div>
          <div class="v35-gpct">${pct}%</div>
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  // ── FUNCIÓN PRINCIPAL: reconstruye el DOM del perfil ───────────────
  function _rebuildProfile(fp){
    // Leer datos del DOM ya renderizado por community.js
    // Los datos están en friendsState y en el pData ya cargado

    if(typeof friendsState==="undefined"||friendsState.view!=="profile") return;
    const pData=friendsState.viewingData;
    if(!pData) return;

    // Evitar re-render si ya aplicamos el parche
    if(fp.dataset.v35==="1") return;
    fp.dataset.v35="1";

    const _pUsername=pData.username||"usuario";
    const ac=typeof theme!=="undefined"?theme.accentManga:"#63b3ed";

    const allSeries=[
      ...(pData.allManga||pData.topManga||[]).map(s=>({...s,type:"M"})),
      ...(pData.allAnime||pData.topAnime||[]).map(s=>({...s,type:"A"}))
    ];
    const reading  =allSeries.filter(s=>s.status==="reading").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0));
    const completed=allSeries.filter(s=>s.status==="completed").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,8);
    const paused   =allSeries.filter(s=>s.status==="paused"||s.status==="plan").sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,6);
    const readingM =reading.filter(s=>s.type==="M");
    const readingA =reading.filter(s=>s.type==="A");

    const totalMC=(pData.allManga||pData.topManga||[]).reduce((s,x)=>s+(x.completed||0),0);
    const totalAE=(pData.allAnime||pData.topAnime||[]).reduce((s,x)=>s+(x.completed||0),0);
    const totalCaps=totalMC+totalAE;
    const rank=_rank(totalCaps);
    const timeEst=_time(totalMC,totalAE);

    const _compat=typeof calcCompatibility==="function"?calcCompatibility(data,pData):{score:0,label:"Sin datos",color:"#4a5568",emoji:"🎲"};

    const myTotal=data.manga.reduce((s,x)=>s+x.completed.length,0)+data.anime.reduce((s,x)=>s+x.completed.length,0);
    const diff=Math.abs(myTotal-totalCaps);
    const compareText=myTotal>totalCaps
      ?`Tú llevas <b style="color:${ac}">${diff} caps más</b> en total`
      :myTotal<totalCaps
      ?`<b style="color:#f87171">@${_pUsername} te lleva ${diff} caps</b>`
      :`Están <b style="color:#34d399">empatados</b> en caps`;

    // Tags en común
    const myTags=new Set([...data.manga,...data.anime].flatMap(s=>s.tags||[]));
    const frTags=new Set(allSeries.flatMap(s=>s.tags||[]));
    const commonTags=[...myTags].filter(t=>frTags.has(t)).slice(0,5);

    // Series en común
    const myMT=new Set(data.manga.map(s=>s.title.toLowerCase().trim()));
    const myAT=new Set(data.anime.map(s=>s.title.toLowerCase().trim()));
    const comM=(pData.allManga||pData.topManga||[]).filter(s=>myMT.has((s.title||"").toLowerCase().trim())).map(s=>s.title).slice(0,4);
    const comA=(pData.allAnime||pData.topAnime||[]).filter(s=>myAT.has((s.title||"").toLowerCase().trim())).map(s=>s.title).slice(0,4);
    const allCommon=[...new Set([...comM,...comA])].slice(0,6);

    // Banner: obtener src de la img ya cargada por community.js
    const existingBannerImg=fp.querySelector("#fp-banner-img");
    const bannerSrc=existingBannerImg?.src||"";
    const topS=reading[0]||null;
    const topPct=topS&&topS.total>0?Math.round((topS.completed||0)/topS.total*100):0;

    // Fallback color hash banner
    let hv=0;for(let i=0;i<_pUsername.length;i++){hv=(hv*31+_pUsername.charCodeAt(i))&0xFFFFFF;}hv=hv%360;
    const fb=`linear-gradient(135deg,hsl(${hv},65%,30%) 0%,hsl(${(hv+55)%360},60%,22%) 55%,hsl(${(hv+115)%360},55%,17%) 100%)`;

    // Avatar
    const avHtml=pData.avatarUrl
      ?`<img class="v35-av" src="${pData.avatarUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="v35-av-ph" style="display:none">${_pUsername.charAt(0).toUpperCase()}</div>`
      :`<div class="v35-av-ph">${_pUsername.charAt(0).toUpperCase()}</div>`;

    const vuid=friendsState.viewingUid;

    // Guardar tab data globalmente para el switcher
    window._v35d={reading,readingM,readingA,completed,paused,ac,curSub:friendsState.profileInlineTab||"manga"};

    fp.className="fn-profile v35-wrap";
    fp.style.padding="0";
    fp.innerHTML=`
      <!-- Barra control -->
      <div style="padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.05)">
        <button class="fn-btn sec" onclick="friendsState.view='list';friendsState.viewingUid=null;friendsState.viewingData=null;renderFriendsPanel()" style="font-size:11px;padding:6px 12px">← Volver</button>
        <span style="flex:1"></span>
        <button style="padding:6px 12px;border:1px solid rgba(231,76,76,.3);background:rgba(231,76,76,.07);color:var(--t3);font-size:10px;border-radius:10px;cursor:pointer;font-weight:600;font-family:'Outfit',sans-serif;transition:.15s"
          onmouseover="this.style.color='var(--dng)';this.style.borderColor='var(--dng)'"
          onmouseout="this.style.color='var(--t3)';this.style.borderColor='rgba(231,76,76,.3)'"
          onclick="showModal('Eliminar amigo','¿Eliminar a @${_pUsername} de tus amigos?','❌',()=>fnRemoveFriend('${vuid}'))">✕ Eliminar</button>
      </div>

      <!-- Banner -->
      <div class="v35-banner" style="background:${fb}">
        <div class="v35-banner-pattern"></div>
        ${bannerSrc?`<div class="v35-banner-bg" style="background-image:url('${bannerSrc}')"></div>`:""}
        <div class="v35-banner-overlay"></div>
        ${topS?`<div class="v35-banner-info">
          <span class="v35-banner-series">▶ ${topS.title}</span>
          <span class="v35-banner-pct">${topPct}%</span>
        </div>`:""}
      </div>

      <!-- Avatar + meta -->
      <div class="v35-prof-hdr">
        ${avHtml}
        <div class="v35-prof-meta">
          <div class="v35-username">@${_pUsername}</div>
          <div class="v35-rank ${rank.cls}">${rank.icon} ${rank.label}</div>
          <div class="v35-hcounts">
            <span class="v35-hcount"><b>${pData.mangaCount||0}</b> manga</span>
            <span class="v35-hcount" style="color:rgba(255,255,255,.15)">·</span>
            <span class="v35-hcount"><b>${pData.animeCount||0}</b> anime</span>
            <span class="v35-hcount" style="color:rgba(255,255,255,.15)">·</span>
            <span class="v35-hcount" style="color:var(--suc)"><b>${reading.length}</b> en curso</span>
          </div>
        </div>
      </div>

      <!-- Stats enriquecidas -->
      <div class="v35-stats">
        <div class="v35-stat"><div class="v35-stat-v" style="color:${ac}">${totalMC}</div><div class="v35-stat-l">📖 Caps</div></div>
        <div class="v35-stat"><div class="v35-stat-v" style="color:var(--aa)">${totalAE}</div><div class="v35-stat-l">▶ Eps</div></div>
        <div class="v35-stat"><div class="v35-stat-v" style="color:#fbbf24">${timeEst}</div><div class="v35-stat-l">⏱ Tiempo</div><div class="v35-stat-s">estimado</div></div>
        <div class="v35-stat"><div class="v35-stat-v" style="color:#34d399">${completed.length}</div><div class="v35-stat-l">✅ Complet.</div></div>
      </div>

      <!-- Compatibilidad -->
      <div class="v35-compat">
        <div class="v35-compat-hdr">
          <div class="v35-compat-lbl"><span style="font-size:16px">${_compat.emoji}</span><span>${_compat.label}</span></div>
          <span class="v35-compat-score" style="color:${_compat.color}">${_compat.score}%</span>
        </div>
        <div class="v35-compat-bar"><div class="v35-compat-fill" style="width:${_compat.score}%;background:linear-gradient(90deg,${_compat.color}88,${_compat.color})"></div></div>
        ${commonTags.length?`<div class="v35-compat-tags">${commonTags.map(t=>`<span class="v35-compat-tag">🎯 ${t}</span>`).join("")}</div>`:""}
        <div class="v35-compare">${compareText}</div>
      </div>

      <!-- Series en común -->
      ${allCommon.length?`<div class="v35-common">
        <div class="v35-common-lbl" style="color:${ac}">🤝 En común (${allCommon.length})</div>
        <div class="v35-common-chips">${allCommon.map(t=>{
          const isM=comM.includes(t);
          return `<span class="v35-common-chip"><span class="v35-cdot" style="background:${isM?ac:"var(--aa)"}"></span>${t}</span>`;
        }).join("")}</div>
      </div>`:""}

      <!-- Tabs -->
      <div class="v35-tabs" id="v35-tabs">
        <button class="v35-tab on" data-tab="reading" onclick="_v35tab('reading')">▶ En progreso (${reading.length})</button>
        <button class="v35-tab" data-tab="grid"    onclick="_v35tab('grid')">🖼 Portadas</button>
        ${completed.length?`<button class="v35-tab" data-tab="done" onclick="_v35tab('done')">✅ Completados (${completed.length})</button>`:""}
        ${paused.length?`<button class="v35-tab" data-tab="paused" onclick="_v35tab('paused')">⏸ Pausados (${paused.length})</button>`:""}
      </div>
      <div class="v35-tab-body" id="v35-tab-body"></div>
    `;

    // Render tab inicial
    _v35tab("reading");
  }

  // ── Tab switcher (global para onclick inline) ──────────────────────
  window._v35tab = function(id){
    const tabs=document.getElementById("v35-tabs");
    const body=document.getElementById("v35-tab-body");
    const d=window._v35d;
    if(!tabs||!body||!d) return;
    tabs.querySelectorAll(".v35-tab").forEach(b=>b.classList.toggle("on",b.dataset.tab===id));
    const ac=d.ac;
    let html="";
    if(id==="reading"){
      const sub=d.curSub||"manga";
      html=`<div style="display:flex;gap:8px;margin-bottom:12px">
        <button onclick="window._v35d.curSub='manga';_v35tab('reading')"
          style="flex:1;padding:7px;border-radius:8px;font-size:11px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
          background:${sub==="manga"?"rgba(99,179,237,.15)":"rgba(255,255,255,.04)"};
          border:1px solid ${sub==="manga"?"rgba(99,179,237,.3)":"rgba(255,255,255,.07)"};
          color:${sub==="manga"?ac:"var(--t3)"}">📚 Manga (${d.readingM.length})</button>
        <button onclick="window._v35d.curSub='anime';_v35tab('reading')"
          style="flex:1;padding:7px;border-radius:8px;font-size:11px;font-weight:600;font-family:'Outfit',sans-serif;cursor:pointer;
          background:${sub==="anime"?"rgba(104,211,145,.15)":"rgba(255,255,255,.04)"};
          border:1px solid ${sub==="anime"?"rgba(104,211,145,.3)":"rgba(255,255,255,.07)"};
          color:${sub==="anime"?"var(--aa)":"var(--t3)"}">🎬 Anime (${d.readingA.length})</button>
      </div>
      ${sub==="manga"?_listHtml(d.readingM,ac,"Sin manga en progreso"):_listHtml(d.readingA,ac,"Sin anime en progreso")}`;
    } else if(id==="grid"){
      html=_gridHtml(d.reading);
    } else if(id==="done"){
      html=_listHtml(d.completed,ac,"Sin completados");
    } else if(id==="paused"){
      html=_listHtml(d.paused,ac,"Sin pausados");
    }
    body.innerHTML=html;
  };



  // ── OBSERVER DEFINITIVO ──────────────────────────────────────────
  // El container #friends-panel-container existe en el DOM cuando carga
  // el parche, pero su contenido (innerHTML) se escribe 80ms después via
  // renderFriendsPanel(). Observamos el container con childList:true
  // Y TAMBIÉN el body con subtree:true como doble red de seguridad.
  // Además hacemos polling con setInterval como última garantía.
  function _checkAndApply(){
    const fp=document.querySelector("#friends-panel-container .fn-profile");
    if(fp&&!fp.dataset.v35) _rebuildProfile(fp);
  }

  // Observer 1: sobre el container directo
  function _observeContainer(){
    const c=document.getElementById("friends-panel-container");
    if(c){
      new MutationObserver(_checkAndApply).observe(c,{childList:true,subtree:true});
    }
  }

  // Observer 2: sobre el body para detectar cuando se crea el container
  new MutationObserver(muts=>{
    _checkAndApply();
    // Si el container acaba de aparecer, empezar a observarlo también
    muts.forEach(m=>m.addedNodes.forEach(node=>{
      if(node instanceof Element&&node.id==="friends-panel-container") _observeContainer();
      if(node instanceof Element){
        const c=node.querySelector&&node.querySelector("#friends-panel-container");
        if(c) _observeContainer();
      }
    }));
  }).observe(document.body,{childList:true,subtree:true});

  // Polling de seguridad: verifica cada 500ms durante 30s
  let _v35polls=0;
  const _v35poll=setInterval(()=>{
    _checkAndApply();
    if(++_v35polls>60) clearInterval(_v35poll);
  },500);

  // ── PATCH NOTES v3.5 ───────────────────────────────────────────────
  const V35=`<div class="patch-version v35-injected"><div class="patch-ver-tag">Parche v3.5 — 2026-05</div><ul class="patch-ver-items"><li>🎨 <b>Rediseño perfil de amigo</b> — banner 200px con overlay dramático, nuevo layout de avatar solapado sobre el banner, sin modificar community.js (MutationObserver reemplaza el DOM post-render)</li><li>🏅 <b>Sistema de rango</b> — badge junto al @username por caps totales: 📜 Lector → ⚔️ Katana → 🐉 Ryuu → ⚡ Kami → 💀 Shinigami (5000+)</li><li>📊 <b>Stats enriquecidas</b> — caps, eps, tiempo estimado (8min/cap · 23min/ep) y completados; reemplaza el grid genérico anterior</li><li>🎯 <b>Compatibilidad rediseñada</b> — emoji grande, barra animada y chips de tags en común</li><li>🤝 <b>Series en común mejoradas</b> — chips con punto de color indicando manga (morado) o anime (verde)</li><li>🖼 <b>Tab "Portadas"</b> — mini-grid 3×2 con portadas de las series en progreso; placeholder con gradiente único por título</li><li>📚 <b>Portadas en todas las listas</b> — thumbnails 36×50px en En progreso, Completados y Pausados</li><li>🗂 <b>Tabs: En progreso / Portadas / Completados / Pausados</b> — con sub-tabs Manga/Anime dentro de "En progreso"</li></ul></div>`;
  function _injectV35(){
    const pp=document.querySelector(".patch-panel");
    if(!pp||pp.querySelector(".v35-injected")) return;
    const v34=pp.querySelector(".v34-injected");
    const h3=pp.querySelector("h3");
    const d=document.createElement("div"); d.innerHTML=V35;
    if(v34){
      // Insertar v3.5 ANTES de v3.4 para que aparezca primero (más reciente arriba)
      v34.insertAdjacentElement("beforebegin",d.firstElementChild);
    } else if(h3){
      h3.insertAdjacentElement("afterend",d.firstElementChild);
    }
  }
  new MutationObserver(()=>_injectV35()).observe(document.body,{childList:true,subtree:true});

})();
// ── FIN PARCHE v3.5 ────────────────────────────────────────────────────
