// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.4 (reescrito completo)
//  Instalación: <script src="js/patch-v3.4.js"></script> después de ui.js
// ═══════════════════════════════════════════════════════════════════════

(function(){
  if(window._v34Patched) return;
  window._v34Patched = true;

  // ── CSS ────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.id = "mangu-patch-v34-css";
  style.textContent = `
/* ── LAYOUT DOS COLUMNAS desktop ── */
#v34-page-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  align-items: start;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 12px;
}
#v34-news-col {
  position: sticky;
  top: 12px;
}
#v34-main-col {
  min-width: 0;
}
@media (max-width: 820px) {
  #v34-page-layout {
    grid-template-columns: 1fr;
    padding: 0;
  }
  #v34-news-col {
    position: static;
  }
}

/* ── Panel novedades ── */
#v34-news-panel {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 14px;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
}
#v34-news-panel .v34-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px 9px;
  border-bottom: 1px solid rgba(255,255,255,.05);
  background: linear-gradient(90deg,rgba(99,119,237,.07) 0%,transparent 70%);
}
#v34-news-panel .v34-hdr-left {
  display: flex;
  align-items: center;
  gap: 7px;
}
#v34-news-panel .v34-live-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #34d399;
  animation: v34pulse 2s infinite;
  flex-shrink: 0;
}
@keyframes v34pulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(52,211,153,.15); }
  50%      { box-shadow: 0 0 0 5px rgba(52,211,153,.05); }
}
#v34-news-panel .v34-hdr-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--t1);
  letter-spacing: .01em;
}
#v34-news-panel .v34-new-badge {
  font-size: 9px; font-weight: 700;
  background: rgba(52,211,153,.15);
  color: #34d399;
  border: 1px solid rgba(52,211,153,.3);
  border-radius: 20px;
  padding: 1px 7px;
}
#v34-news-panel .v34-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255,255,255,.04);
  cursor: pointer;
  transition: background .12s;
}
#v34-news-panel .v34-item:last-child { border-bottom: none; }
#v34-news-panel .v34-item:hover { background: rgba(255,255,255,.03); }
#v34-news-panel .v34-item.v34-unread {
  border-left: 2px solid;
}
#v34-news-panel .v34-cover {
  width: 32px; height: 44px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
}
#v34-news-panel .v34-cover-ph {
  width: 32px; height: 44px;
  border-radius: 5px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; font-style: italic;
}
#v34-news-panel .v34-info { flex: 1; min-width: 0; }
#v34-news-panel .v34-type-pill {
  font-size: 8px; font-weight: 700;
  letter-spacing: .06em;
  padding: 1px 5px; border-radius: 20px;
  display: inline-block; margin-bottom: 2px;
}
#v34-news-panel .v34-title {
  font-size: 11px; font-weight: 600;
  color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 1px;
}
#v34-news-panel .v34-sub {
  font-size: 10px;
  color: var(--t2);
}
#v34-news-panel .v34-right {
  text-align: right; flex-shrink: 0;
}
#v34-news-panel .v34-when {
  font-size: 10px; font-weight: 700;
  margin-bottom: 1px;
}
#v34-news-panel .v34-dot-unread {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #6377ed;
  flex-shrink: 0;
}

/* ── Mobile: carrusel horizontal ── */
@media (max-width: 820px) {
  #v34-news-panel {
    margin: 0 0 12px 0;
    border-radius: 12px;
  }
  #v34-news-list {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto;
    gap: 8px;
    padding: 10px 12px 8px !important;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  #v34-news-list::-webkit-scrollbar { display: none; }
  #v34-news-panel .v34-item {
    min-width: 148px; max-width: 148px;
    flex-direction: column;
    align-items: flex-start;
    padding: 9px 10px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,.07) !important;
    border-bottom: 1px solid rgba(255,255,255,.07) !important;
    border-left: none !important;
    background: rgba(255,255,255,.025);
    flex-shrink: 0;
    gap: 0;
  }
  #v34-news-panel .v34-item.v34-unread {
    border-top: 2px solid !important;
    border-left: none !important;
  }
  #v34-news-panel .v34-cover,
  #v34-news-panel .v34-cover-ph {
    width: 100% !important; height: 40px !important;
    border-radius: 5px !important;
    margin-bottom: 7px;
  }
  #v34-news-panel .v34-right { text-align: left; margin-top: 4px; }
  #v34-news-panel .v34-dot-unread { display: none; }
  #v34-news-hint { display: block !important; }
}
#v34-news-hint {
  display: none;
  text-align: center;
  font-size: 9px;
  color: var(--t3);
  padding: 2px 0 8px;
  letter-spacing: .05em;
}

/* ── Recuadro fecha en card expandido ── */
.v34-airbox {
  margin: 0 0 10px;
  background: linear-gradient(135deg,rgba(99,119,237,.09) 0%,rgba(52,211,153,.04) 100%);
  border: 1px solid rgba(99,119,237,.2);
  border-radius: 10px;
  padding: 10px 13px;
}
.v34-airbox-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7px;
}
.v34-airbox-lbl {
  font-size: 9px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  color: #6377ed;
}
.v34-airbox-badge {
  font-size: 9px; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
}
.v34-airbox-main {
  display: flex; align-items: baseline; gap: 7px;
  margin-bottom: 6px;
}
.v34-airbox-num {
  font-size: 19px; font-weight: 800;
  color: var(--t1);
  font-family: 'Space Mono', monospace;
  letter-spacing: -.02em;
}
.v34-airbox-eptitle {
  font-size: 11px; color: var(--t2);
  font-style: italic; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.v34-airbox-dates {
  display: flex; align-items: center;
  justify-content: space-between;
  font-size: 10px; color: var(--t2);
}
.v34-airbox-date-val { font-weight: 600; color: var(--t1); }
@keyframes v34skel {
  0%,100%{ opacity:.35; } 50%{ opacity:.6; }
}
.v34-skel { animation: v34skel 1.2s ease infinite; }
  `;
  document.head.appendChild(style);

  // ── HELPERS ────────────────────────────────────────────────────────
  function _timeAgo(ts){
    if(!ts) return "";
    const ms = Date.now()-ts, m = Math.floor(ms/60000);
    if(m<1) return "ahora";
    if(m<60) return `hace ${m}m`;
    const h = Math.floor(ms/3600000);
    if(h<24) return `hace ${h}h`;
    const d = Math.floor(ms/86400000);
    if(d===1) return "ayer";
    if(d<7) return `hace ${d}d`;
    return new Date(ts).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
  }

  // Cache de fechas de Jikan (por sesión)
  const _airCache = new Map();

  async function _fetchAirDate(jikanId, type, epNum){
    if(!jikanId||!epNum) return null;
    const key = `${jikanId}-${type}-${epNum}`;
    if(_airCache.has(key)) return _airCache.get(key);
    try{
      const ep = type==="manga"?"manga":"anime";
      const field = type==="manga"?"chapters":"episodes";
      const page = Math.ceil(epNum/100);
      const res = await _jikanFetch(
        `https://api.jikan.moe/v4/${ep}/${jikanId}/${field}?page=${page}`,
        8000, 1
      );
      if(!res||!Array.isArray(res.data)) return null;
      const entry = res.data.find(e=>{
        const n = type==="anime"
          ? Number(e.mal_id||e.episode_id||e.episode)
          : parseFloat(e.chapter||e.chapters||"0");
        return Math.floor(n)===epNum;
      });
      if(!entry){ _airCache.set(key,null); return null; }
      const from = type==="anime"
        ? (entry.aired?.from||entry.air_date||null)
        : (entry.published?.from||null);
      const result = {
        date: from ? new Date(from) : null,
        title: entry.title||entry.name||null
      };
      _airCache.set(key, result);
      return result;
    }catch(e){ return null; }
  }

  // Cache de schedule de AniList (próximos episodios de anime en emisión)
  const _scheduleCache = new Map();

  async function _fetchNextAirDate(jikanId, type){
    if(!jikanId||type!=="anime") return null;
    const key = `sched-${jikanId}`;
    if(_scheduleCache.has(key)) return _scheduleCache.get(key);
    try{
      const gql = `{Media(idMal:${jikanId},type:ANIME){nextAiringEpisode{episode airingAt}}}`;
      const res = await fetch("https://graphql.anilist.co",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({query:gql}),
        signal: AbortSignal.timeout(5000)
      });
      if(!res.ok) return null;
      const json = await res.json();
      const nae = json?.data?.Media?.nextAiringEpisode;
      if(!nae){ _scheduleCache.set(key,null); return null; }
      const result = {
        episode: nae.episode,
        date: new Date(nae.airingAt*1000)
      };
      _scheduleCache.set(key, result);
      return result;
    }catch(e){ return null; }
  }

  function _airBadge(date){
    if(!date) return {label:"Sin datos",bg:"rgba(255,255,255,.08)",color:"var(--t3)"};
    const diff = Math.ceil((date.getTime()-Date.now())/86400000);
    if(diff<=0){
      const ago = Math.abs(Math.floor((date.getTime()-Date.now())/86400000));
      const when = ago===0?"Hoy":ago===1?"Ayer":`Hace ${ago}d`;
      return {label:`✓ Disponible · ${when}`, bg:"rgba(52,211,153,.15)", color:"#34d399"};
    }
    if(diff<=7) return {label:`⏳ En ${diff} día${diff===1?"":"s"}`, bg:"rgba(251,191,36,.12)", color:"#fbbf24"};
    return {
      label: date.toLocaleDateString("es-CL",{day:"numeric",month:"short"}),
      bg:"rgba(99,119,237,.12)", color:"#a5b4fc"
    };
  }

  // ── PANEL DE NOVEDADES ─────────────────────────────────────────────
  function _buildNewsItems(){
    const now = Date.now();
    const items = [];
    for(const type of ["manga","anime"]){
      data[type]
        .filter(s=>s.status==="reading"||s.status==="plan")
        .forEach(s=>{
          const nc = (typeof nextChapter==="function") ? nextChapter(s) : null;
          const isUpToDate = nc===null && s.total>0 && !s.jikanPublishing;
          // "nuevo" = el total se actualizó hace <48h y hay cap disponible
          const recentlyUpdated = s.lastUpdated && (now-s.lastUpdated)<48*3600*1000;
          const hasUnread = nc!==null && recentlyUpdated;
          items.push({
            id:s.id, title:s.title, type,
            total:s.total, completed:s.completed?.length||0,
            nextCap:nc, isUpToDate,
            publishing: s.jikanPublishing||false,
            jikanId: s.jikanId||null,
            cover: s.cover||"",
            lastUpdated: s.lastUpdated||0,
            hasUnread
          });
        });
    }
    // Orden: no leídos recientes → en emisión → al día → resto
    items.sort((a,b)=>{
      if(a.hasUnread!==b.hasUnread) return a.hasUnread?-1:1;
      if(a.publishing!==b.publishing) return a.publishing?-1:1;
      return (b.lastUpdated||0)-(a.lastUpdated||0);
    });
    return items;
  }

  function _renderNewsPanel(){
    const items = _buildNewsItems();
    if(!items.length) return null;

    const unread = items.filter(i=>i.hasUnread).length;
    const panel = document.createElement("div");
    panel.id = "v34-news-panel";

    // Header
    const hdr = document.createElement("div");
    hdr.className = "v34-hdr";
    const dot = document.createElement("div");
    dot.className = "v34-live-dot";
    const ttl = document.createElement("span");
    ttl.className = "v34-hdr-title";
    ttl.textContent = "Novedades";
    const left = document.createElement("div");
    left.className = "v34-hdr-left";
    left.append(dot, ttl);
    if(unread>0){
      const badge = document.createElement("span");
      badge.className = "v34-new-badge";
      badge.textContent = `${unread} nuevo${unread>1?"s":""}`;
      left.appendChild(badge);
    }
    hdr.appendChild(left);
    panel.appendChild(hdr);

    // Lista
    const list = document.createElement("div");
    list.id = "v34-news-list";

    items.slice(0,8).forEach(item=>{
      const ac = item.type==="manga" ? "#a78bfa" : "#34d399";
      const lbl = item.type==="manga" ? "Cap." : "Ep.";
      const typeLabel = item.type==="manga" ? "MANGA" : "ANIME";

      // Texto del estado
      let subText="", whenText="", whenColor="var(--t2)";
      if(item.hasUnread){
        subText = `${lbl} ${item.nextCap} disponible`;
        whenText = _timeAgo(item.lastUpdated);
        whenColor = "#34d399";
      } else if(item.nextCap!==null && item.publishing){
        subText = `${lbl} ${item.nextCap} — próximamente`;
        whenText = "En emisión";
        whenColor = "#fbbf24";
      } else if(item.isUpToDate){
        subText = `Al día ✓`;
        whenText = _timeAgo(item.lastUpdated);
        whenColor = "var(--t3)";
      } else if(item.nextCap!==null){
        subText = `${lbl} ${item.nextCap} pendiente`;
        whenText = _timeAgo(item.lastUpdated);
      }

      const el = document.createElement("div");
      el.className = "v34-item" + (item.hasUnread?" v34-unread":"");
      if(item.hasUnread) el.style.borderLeftColor = ac;
      // En mobile el borde es top
      if(item.hasUnread) el.style.borderTopColor = ac;

      // Cover
      let coverEl;
      if(item.cover){
        coverEl = document.createElement("img");
        coverEl.className = "v34-cover";
        coverEl.src = item.cover;
        coverEl.onerror = ()=>{ coverEl.style.display="none"; };
      } else {
        coverEl = document.createElement("div");
        coverEl.className = "v34-cover-ph";
        coverEl.style.cssText = `background:${item.type==="manga"?"rgba(167,139,250,.12)":"rgba(52,211,153,.1)"};color:${ac};`;
        coverEl.textContent = item.title.charAt(0);
      }

      // Info
      const info = document.createElement("div");
      info.className = "v34-info";
      info.innerHTML = `
        <span class="v34-type-pill" style="background:${item.type==="manga"?"rgba(167,139,250,.15)":"rgba(52,211,153,.1)"};color:${ac};">${typeLabel}</span>
        <div class="v34-title">${item.title}</div>
        <div class="v34-sub">${subText}</div>
      `;

      // Right
      const right = document.createElement("div");
      right.className = "v34-right";
      right.innerHTML = `<div class="v34-when" style="color:${whenColor};">${whenText}</div>`;

      // Dot unread
      const udot = document.createElement("div");
      if(item.hasUnread){ udot.className = "v34-dot-unread"; }

      el.append(coverEl, info, right);
      if(item.hasUnread) el.appendChild(udot);

      // Click → ir a la serie
      el.onclick = ()=>{
        if(typeof tab!=="undefined"&&typeof expanded!=="undefined"&&typeof render==="function"){
          tab = item.type;
          expanded[item.id] = true;
          pinnedId = item.id;
          viewMode = "list";
          render();
          setTimeout(()=>{
            const node = document.querySelector(`[data-id="${item.id}"]`);
            if(node) node.scrollIntoView({behavior:"smooth",block:"center"});
          },200);
        }
      };

      list.appendChild(el);
    });

    panel.appendChild(list);

    // Hint mobile
    const hint = document.createElement("div");
    hint.id = "v34-news-hint";
    hint.textContent = "← desliza →";
    panel.appendChild(hint);

    // Fetch asíncrono de fechas de próximos eps para series en emisión
    _enrichNewsWithDates(items, list);

    return panel;
  }

  // Enriquece los items del panel con fechas reales de AniList (anime)
  async function _enrichNewsWithDates(items, listEl){
    for(const item of items){
      if(!item.jikanId||!item.publishing) continue;
      if(item.type!=="anime") continue; // para manga no hay schedule confiable
      try{
        const sched = await _fetchNextAirDate(item.jikanId, item.type);
        if(!sched) continue;
        // Encontrar el elemento correspondiente en el DOM
        const els = listEl.querySelectorAll(".v34-item");
        // Buscar por title (los items están en el mismo orden)
        const idx = items.indexOf(item);
        const el = els[idx];
        if(!el) continue;
        const subEl = el.querySelector(".v34-sub");
        const whenEl = el.querySelector(".v34-when");
        if(!subEl||!whenEl) continue;

        const lbl = item.type==="manga"?"Cap.":"Ep.";
        const badge = _airBadge(sched.date);
        const diffDays = Math.ceil((sched.date.getTime()-Date.now())/86400000);

        if(diffDays>0){
          subEl.textContent = `${lbl} ${sched.episode} — ${sched.date.toLocaleDateString("es-CL",{day:"numeric",month:"short"})}`;
          whenEl.textContent = `En ${diffDays}d`;
          whenEl.style.color = "#fbbf24";
        } else {
          subEl.textContent = `${lbl} ${sched.episode} disponible`;
          whenEl.textContent = "Hoy";
          whenEl.style.color = "#34d399";
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,300)); // rate limit
    }
  }

  // ── INYECTAR LAYOUT DOS COLUMNAS ──────────────────────────────────
  // Wrappea el contenido que va después del header/stats/toolbar
  // en un grid de dos columnas: [novedades | contenido principal]
  function _wrapLayout(root){
    // Solo en el tab con Continuar Leyendo (home view)
    // Buscar la sección continue-section que ya existe
    const continueSection = root.querySelector(".continue-section");
    if(!continueSection) return;

    // El "main col" empieza desde continue-section hasta el final
    // Recolectar todos los nodos desde continue-section en adelante
    const allChildren = [...root.children];
    const continueIdx = allChildren.indexOf(continueSection);
    if(continueIdx < 0) return;

    const mainNodes = allChildren.slice(continueIdx);

    // Crear layout
    const layout = document.createElement("div");
    layout.id = "v34-page-layout";

    // Columna izquierda: novedades
    const newsCol = document.createElement("div");
    newsCol.id = "v34-news-col";
    const newsPanel = _renderNewsPanel();
    if(newsPanel) newsCol.appendChild(newsPanel);

    // Columna derecha: contenido existente
    const mainCol = document.createElement("div");
    mainCol.id = "v34-main-col";
    mainNodes.forEach(n => mainCol.appendChild(n));

    layout.append(newsCol, mainCol);
    root.appendChild(layout);
  }

  // ── RECUADRO FECHA EN CARD EXPANDIDO ──────────────────────────────
  function _injectAirBox(cpnl, series, type){
    if(cpnl.querySelector(".v34-airbox")) return; // ya inyectado
    const nc = (typeof nextChapter==="function") ? nextChapter(series) : null;
    if(nc===null||!series.jikanId) return;

    const lbl = type==="manga"?"Cap.":"Ep.";
    const box = document.createElement("div");
    box.className = "v34-airbox";
    box.innerHTML = `
      <div class="v34-airbox-hdr">
        <span class="v34-airbox-lbl">📅 Próximo por marcar</span>
        <span class="v34-airbox-badge v34-skel" style="background:rgba(255,255,255,.07);color:var(--t3);">cargando...</span>
      </div>
      <div class="v34-airbox-main">
        <span class="v34-airbox-num">${lbl} ${nc}</span>
        <span class="v34-airbox-eptitle v34-skel" style="color:var(--t3);">buscando información...</span>
      </div>
      <div class="v34-airbox-dates">
        <span class="v34-skel" style="color:var(--t3);font-size:10px;">Consultando Jikan API...</span>
      </div>
    `;

    // Insertar ANTES del primer dsec
    const firstDsec = cpnl.querySelector(".dsec");
    if(firstDsec) cpnl.insertBefore(box, firstDsec);
    else cpnl.prepend(box);

    // Fetch async
    _loadAirBox(box, series.jikanId, type, nc);
    // Para anime en emisión también buscar el PRÓXIMO no publicado
    if(type==="anime"&&series.jikanPublishing){
      _loadScheduleBox(box, series.jikanId, nc);
    }
  }

  async function _loadAirBox(box, jikanId, type, epNum){
    const info = await _fetchAirDate(jikanId, type, epNum);
    if(!document.body.contains(box)) return;

    const badge = _airBadge(info?.date||null);
    const dateStr = info?.date
      ? info.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short",year:"numeric"})
      : null;

    const badgeEl = box.querySelector(".v34-airbox-badge");
    const titleEl = box.querySelector(".v34-airbox-eptitle");
    const datesEl = box.querySelector(".v34-airbox-dates");

    if(badgeEl){
      badgeEl.textContent = badge.label;
      badgeEl.style.background = badge.bg;
      badgeEl.style.color = badge.color;
      badgeEl.classList.remove("v34-skel");
    }
    if(titleEl){
      titleEl.textContent = info?.title ? `"${info.title}"` : "";
      titleEl.classList.remove("v34-skel");
    }
    if(datesEl){
      datesEl.classList.remove("v34-skel");
      datesEl.innerHTML = dateStr
        ? `<span>📡 Estrenó <span class="v34-airbox-date-val">${dateStr}</span></span>`
        : `<span style="color:var(--t3)">Fecha no disponible en Jikan</span>`;
    }
  }

  async function _loadScheduleBox(box, jikanId, currentEp){
    // Para el PRÓXIMO episodio aún no publicado (anime en emisión)
    const sched = await _fetchNextAirDate(jikanId, "anime");
    if(!sched||!document.body.contains(box)) return;
    if(sched.episode <= currentEp) return; // ya está disponible, no agregar sección extra

    // Agregar una fila extra debajo con la info del próximo ep
    const nextBadge = _airBadge(sched.date);
    const dateStr = sched.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
    const extra = document.createElement("div");
    extra.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05);";
    extra.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);">Próximo ep. a estrenar</span>
        <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;background:${nextBadge.bg};color:${nextBadge.color};">${nextBadge.label}</span>
      </div>
      <div style="margin-top:5px;font-size:10px;color:var(--t2);">
        <span>🗓 Ep. ${sched.episode}</span>
        <span style="color:var(--t3);margin:0 6px;">·</span>
        <span class="v34-airbox-date-val">${dateStr}</span>
      </div>
    `;
    const datesEl = box.querySelector(".v34-airbox-dates");
    if(datesEl) datesEl.appendChild(extra);
  }

  // ── OBSERVER: inyecta airbox al expandir un card ───────────────────
  const observer = new MutationObserver(muts=>{
    muts.forEach(mut=>{
      mut.addedNodes.forEach(node=>{
        if(!(node instanceof Element)) return;
        const cpnls = node.classList?.contains("cpnl") ? [node] : [...node.querySelectorAll(".cpnl")];
        cpnls.forEach(cpnl=>{
          const scard = cpnl.closest(".scard");
          if(!scard) return;
          const sid = scard.getAttribute("data-id");
          if(!sid) return;
          let series=null, seriesType=null;
          for(const t of ["manga","anime"]){
            const f = data[t].find(s=>s.id===sid);
            if(f){ series=f; seriesType=t; break; }
          }
          if(!series||!series.jikanId) return;
          _injectAirBox(cpnl, series, seriesType);
        });
      });
    });
  });
  observer.observe(document.getElementById("app")||document.body, {childList:true,subtree:true});

  // ── PATCH render ───────────────────────────────────────────────────
  const _origRender = window.render;
  window.render = function(){
    _origRender();
    // Después del render, envolver en layout 2 columnas
    const root = document.getElementById("app");
    if(root) _wrapLayout(root);
  };

  // ── PATCH NOTES ────────────────────────────────────────────────────
  const v34notes = `<div class="patch-version"><div class="patch-ver-tag">Parche v3.4 — 2026-05</div><ul class="patch-ver-items"><li>📰 <b>Panel de novedades lateral</b> — columna izquierda fija en desktop (sticky); en mobile se convierte en carrusel horizontal deslizable; muestra caps/eps nuevos disponibles, próximos a estrenar con fecha real (AniList para anime), y series al día</li><li>📅 <b>Fechas de estreno reales</b> — el recuadro "Próximo por marcar" dentro del card expandido consulta Jikan API para obtener la fecha exacta del cap/ep pendiente; para anime en emisión también muestra el próximo episodio a estrenar con countdown en días via AniList</li><li>📱 <b>Layout adaptado mobile</b> — el panel de novedades colapsa a carrusel horizontal en pantallas ≤820px; la columna lateral desaparece y todo vuelve a flujo vertical</li></ul></div>`;
  if(typeof P28_PATCH_NOTES!=="undefined") window.P28_PATCH_NOTES = v34notes + P28_PATCH_NOTES;

  // Trigger inicial
  if(typeof render==="function") render();

})();
// ── FIN PARCHE v3.4 ────────────────────────────────────────────────────
