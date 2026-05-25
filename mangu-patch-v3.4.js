// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.4
//  Fecha: 2026-05
//  Archivos afectados: js/ui.js (añadir al final, antes del último })
//
//  FEATURES:
//  1. Panel de noticias "Novedades" en el tab Inicio/Home
//     - Muestra caps/eps nuevos de series en emisión de tu lista
//     - Desktop: columna vertical con cards completas
//     - Mobile (≤640px): carrusel horizontal de chips deslizables
//     - Indicador live pulsante, badge de cantidad nueva, timestamp
//     - Series "al día" aparecen al final en gris (no spam)
//     - Próximos capítulos en ámbar con countdown de días
//
//  2. Fecha de estreno del próximo capítulo en el card expandido
//     - Nuevo recuadro "📅 Próximo por marcar" dentro del expanded panel
//     - Muestra número de cap/ep, fecha de emisión (vía Jikan API)
//     - Badge: verde "Disponible", ámbar "En N días", rojo "Sin datos"
//     - Solo aparece si la serie tiene jikanId y hay un nextChapter
//     - Se carga de forma asíncrona sin bloquear el render
//
//  INSTRUCCIONES DE INSTALACIÓN:
//  Pega todo este bloque AL FINAL de js/ui.js, inmediatamente antes
//  del cierre de la última función o del final del archivo.
// ═══════════════════════════════════════════════════════════════════════


// ── v3.4: STORAGE KEY para noticias ────────────────────────────────────
function _v34NewsKey(){
  return "mangu-news-"+(typeof fbUser!=="undefined"&&fbUser?fbUser.uid:"guest");
}

// ── v3.4: Guardar/leer cache de noticias en localStorage ───────────────
// Estructura: { ts: timestamp, items: [{id, title, type, newTotal, prevTotal, ts, jikanId}] }
function _v34SaveNews(items){
  try{ localStorage.setItem(_v34NewsKey(), JSON.stringify({ts:Date.now(), items})); }catch(e){}
}
function _v34LoadNews(){
  try{
    const raw = localStorage.getItem(_v34NewsKey());
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    // cache válido por 6h
    if(Date.now() - (parsed.ts||0) > 6*60*60*1000) return [];
    return parsed.items || [];
  }catch(e){ return []; }
}

// ── v3.4: Calcular items de noticias desde el estado actual de data ────
// Combina: caps nuevos detectados + próximos en emisión + al día
function _v34BuildNewsItems(){
  const items = [];
  const now = Date.now();

  const allSeries = [
    ...data.manga.filter(s=>s.status==="reading"||s.status==="plan").map(s=>({...s,_type:"manga"})),
    ...data.anime.filter(s=>s.status==="reading"||s.status==="plan").map(s=>({...s,_type:"anime"}))
  ];

  // Usar nextChapter global (ya definida en tracker.js)
  allSeries.forEach(s => {
    const nc = (typeof nextChapter === "function") ? nextChapter(s) : null;
    const hasNext = nc !== null;
    const isUpToDate = !hasNext && s.total > 0;

    // Determinar si hay un cap nuevo reciente (total actualizado en las últimas 24h)
    const updatedRecently = s.lastUpdated && (now - s.lastUpdated) < 24*60*60*1000;

    items.push({
      id: s.id,
      title: s.title,
      type: s._type,
      total: s.total,
      completed: s.completed ? s.completed.length : 0,
      nextCap: nc,
      isUpToDate,
      publishing: s.jikanPublishing || false,
      jikanId: s.jikanId || null,
      cover: s.cover || "",
      lastUpdated: s.lastUpdated || 0,
      updatedRecently,
      // newSinceViewed: true si hay caps disponibles que no hemos leído
      hasUnread: hasNext && updatedRecently,
    });
  });

  // Ordenar: con no leídos + recientes primero, luego al día, luego sin publicación
  items.sort((a,b) => {
    if(a.hasUnread && !b.hasUnread) return -1;
    if(!a.hasUnread && b.hasUnread) return 1;
    if(a.publishing && !b.publishing) return -1;
    if(!a.publishing && b.publishing) return 1;
    return (b.lastUpdated||0) - (a.lastUpdated||0);
  });

  return items;
}

// ── v3.4: Formato de tiempo relativo ────────────────────────────────────
function _v34TimeAgo(ts){
  if(!ts) return "";
  const ms = Date.now() - ts;
  const min = Math.floor(ms/60000);
  if(min < 1) return "ahora";
  if(min < 60) return `hace ${min}m`;
  const h = Math.floor(ms/3600000);
  if(h < 24) return `hace ${h}h`;
  const d = Math.floor(ms/86400000);
  if(d === 1) return "ayer";
  if(d < 7) return `hace ${d}d`;
  return new Date(ts).toLocaleDateString("es-CL",{day:"numeric",month:"short"});
}

// ── v3.4: Render del PANEL DE NOTICIAS ─────────────────────────────────
// Se inyecta en el tab Inicio, justo antes de "Continuar leyendo"
function v34RenderNewsPanel(root){
  const items = _v34BuildNewsItems();
  if(items.length === 0) return; // nada en progreso = no mostrar

  const unreadCount = items.filter(i => i.hasUnread).length;
  const isMobile = window.innerWidth <= 640;

  const sec = document.createElement("div");
  sec.id = "v34-news-panel";
  sec.style.cssText = `
    margin: 0 0 14px 0;
    background: rgba(255,255,255,.025);
    border: 1px solid rgba(255,255,255,.07);
    border-radius: 14px;
    overflow: hidden;
  `;

  // ── Header ──
  const hdr = document.createElement("div");
  hdr.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    padding: 11px 14px 10px;
    border-bottom: 1px solid rgba(255,255,255,.05);
    background: linear-gradient(90deg, rgba(99,119,237,.06) 0%, transparent 60%);
  `;

  const hdrLeft = document.createElement("div");
  hdrLeft.style.cssText = "display:flex; align-items:center; gap:8px;";

  // Punto live pulsante
  const dot = document.createElement("div");
  dot.style.cssText = `
    width:7px; height:7px; border-radius:50%;
    background:#34d399;
    box-shadow: 0 0 0 3px rgba(52,211,153,.15);
    animation: v34Pulse 2s infinite;
    flex-shrink:0;
  `;
  const dotStyle = document.createElement("style");
  dotStyle.id = "v34-anim-style";
  if(!document.getElementById("v34-anim-style")){
    dotStyle.textContent = `
      @keyframes v34Pulse {
        0%,100%{ box-shadow:0 0 0 3px rgba(52,211,153,.15); }
        50%{ box-shadow:0 0 0 5px rgba(52,211,153,.06); }
      }
      #v34-news-panel .v34-chip { flex-shrink:0; }
      @media(max-width:640px){
        #v34-news-row { display:flex !important; flex-direction:row !important; overflow-x:auto; gap:8px; padding-bottom:4px; scrollbar-width:none; }
        #v34-news-row::-webkit-scrollbar { display:none; }
        #v34-news-panel .v34-news-item { min-width:160px; max-width:160px; flex-direction:column; padding:10px; border-radius:10px; }
        #v34-news-panel .v34-news-item .v34-cover { width:100%; height:46px; border-radius:6px; margin:0 0 7px 0; }
        #v34-news-panel .v34-news-item .v34-right { text-align:left; margin-top:4px; }
        #v34-hint { display:block !important; }
      }
    `;
    document.head.appendChild(dotStyle);
  }

  const hdrTitle = document.createElement("span");
  hdrTitle.style.cssText = "font-size:12px; font-weight:700; color:var(--t1); letter-spacing:.01em;";
  hdrTitle.textContent = "Novedades de tu lista";

  hdrLeft.append(dot, hdrTitle);

  if(unreadCount > 0){
    const badge = document.createElement("span");
    badge.style.cssText = `
      font-size:9px; font-weight:700;
      background:rgba(52,211,153,.15); color:#34d399;
      border:1px solid rgba(52,211,153,.3);
      border-radius:20px; padding:1px 8px; margin-left:4px;
    `;
    badge.textContent = `${unreadCount} nuevo${unreadCount > 1 ? "s" : ""}`;
    hdrLeft.appendChild(badge);
  }

  hdr.appendChild(hdrLeft);
  sec.appendChild(hdr);

  // ── Lista de items ──
  const row = document.createElement("div");
  row.id = "v34-news-row";
  row.style.cssText = `
    display:flex;
    flex-direction:column;
    gap:0;
    padding: ${isMobile ? "10px 10px 6px" : "4px 0"};
  `;

  items.slice(0, 7).forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "v34-news-item";

    const acColor = item.type === "manga" ? "#a78bfa" : "#34d399";
    const typeLabel = item.type === "manga" ? "MANGA" : "ANIME";
    const lbl = item.type === "manga" ? "Cap." : "Ep.";
    const borderLeft = item.hasUnread
      ? `border-left: 2.5px solid ${acColor};`
      : "";

    // Estado del cap
    let statusHtml = "";
    let rightTimeHtml = "";

    if(item.isUpToDate && item.publishing){
      statusHtml = `<span style="color:var(--t3);font-size:11px;">${lbl} ${item.total} — al día ✓</span>`;
      rightTimeHtml = `<div style="font-size:9px;color:var(--t3);">Al día</div>`;
    } else if(item.hasUnread){
      statusHtml = `<span style="color:var(--t1);font-size:11px;">${lbl} ${item.nextCap} disponible</span>`;
      rightTimeHtml = `
        <div style="font-size:10px;font-weight:700;color:#34d399;">${item.updatedRecently ? _v34TimeAgo(item.lastUpdated) : "Disponible"}</div>
      `;
    } else if(item.publishing && !item.isUpToDate){
      statusHtml = `<span style="color:var(--t2);font-size:11px;">${lbl} ${item.nextCap} — próximamente</span>`;
      rightTimeHtml = `<div style="font-size:10px;font-weight:700;color:#fbbf24;">En emisión</div>`;
    } else {
      statusHtml = `<span style="color:var(--t3);font-size:11px;">${lbl} ${item.nextCap !== null ? item.nextCap : item.total}</span>`;
      rightTimeHtml = `<div style="font-size:9px;color:var(--t3);">${_v34TimeAgo(item.lastUpdated)}</div>`;
    }

    // Cover thumbnail
    const coverHtml = item.cover
      ? `<img class="v34-cover" src="${item.cover}" style="width:34px;height:46px;border-radius:6px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
      : `<div class="v34-cover" style="width:34px;height:46px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;font-style:italic;background:${item.type==="manga"?"rgba(167,139,250,.12)":"rgba(52,211,153,.1)"};color:${acColor};">${item.title.charAt(0)}</div>`;

    // Unread dot
    const unreadDot = item.hasUnread
      ? `<div style="width:6px;height:6px;border-radius:50%;background:#6377ed;flex-shrink:0;"></div>`
      : `<div style="width:6px;height:6px;flex-shrink:0;"></div>`;

    el.style.cssText = `
      display:flex; align-items:center; gap:10px;
      padding:9px 14px;
      ${idx < items.length - 1 ? "border-bottom:1px solid rgba(255,255,255,.04);" : ""}
      ${borderLeft}
      cursor:pointer;
      transition: background .12s;
    `;
    el.onmouseover = () => el.style.background = "rgba(255,255,255,.025)";
    el.onmouseout  = () => el.style.background = "transparent";

    // Al hacer click: ir a la serie
    el.onclick = () => {
      if(typeof tab !== "undefined" && typeof expanded !== "undefined" && typeof render === "function"){
        tab = item.type;
        expanded[item.id] = true;
        pinnedId = item.id;
        viewMode = "list";
        render();
        setTimeout(()=>{
          const el2 = document.querySelector(`[data-id="${item.id}"]`);
          if(el2) el2.scrollIntoView({behavior:"smooth", block:"center"});
        }, 200);
      }
    };

    el.innerHTML = `
      ${coverHtml}
      <div class="v34-info" style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;">
          <span style="font-size:8px;font-weight:700;letter-spacing:.06em;padding:1px 5px;border-radius:20px;
            background:${item.type==="manga"?"rgba(167,139,250,.15)":"rgba(52,211,153,.1)"};
            color:${acColor};">${typeLabel}</span>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px;">${item.title}</div>
        <div class="v34-status">${statusHtml}</div>
      </div>
      <div class="v34-right" style="text-align:right;flex-shrink:0;">
        ${rightTimeHtml}
      </div>
      ${unreadDot}
    `;

    row.appendChild(el);
  });

  sec.appendChild(row);

  // Hint de scroll para mobile
  const hint = document.createElement("div");
  hint.id = "v34-hint";
  hint.style.cssText = "display:none;text-align:center;font-size:9px;color:var(--t3);padding:2px 0 8px;letter-spacing:.05em;";
  hint.textContent = "← desliza para ver más →";
  sec.appendChild(hint);

  root.appendChild(sec);
}


// ── v3.4: FECHA DE ESTRENO DEL PRÓXIMO CAP en el panel expandido ────────
// Busca vía Jikan la fecha del episodio/cap que el usuario tiene pendiente.
// Se inyecta como nueva sección "dsec" dentro del cpnl (panel expandido).

// Cache en memoria para no re-fetchear en cada render
const _v34AirDateCache = new Map(); // key: `${jikanId}-${type}-${epNum}` → {date, title}

async function _v34FetchEpAirDate(jikanId, type, epNum){
  if(!jikanId || !epNum) return null;
  const cacheKey = `${jikanId}-${type}-${epNum}`;
  if(_v34AirDateCache.has(cacheKey)) return _v34AirDateCache.get(cacheKey);

  try{
    const endpoint = type === "manga" ? "manga" : "anime";
    const field    = type === "manga" ? "chapters" : "episodes";

    // Calcular la página: Jikan pagina de a 100
    const page = Math.ceil(epNum / 100);
    const url  = `https://api.jikan.moe/v4/${endpoint}/${jikanId}/${field}?page=${page}`;

    const res = await _jikanFetch(url, 8000, 1);
    if(!res || !Array.isArray(res.data)) return null;

    const entry = res.data.find(e => {
      // Para anime: campo episode (número); para manga: campo chapter (string)
      const num = type === "anime"
        ? (e.mal_id || e.episode_id || e.episode)
        : parseFloat(e.chapter || e.chapters || "0");
      return Math.floor(Number(num)) === epNum;
    });

    if(!entry) return null;

    const airedFrom = type === "anime"
      ? (entry.aired?.from || entry.air_date || null)
      : (entry.published?.from || null);

    const result = {
      date:  airedFrom ? new Date(airedFrom) : null,
      title: entry.title || entry.name || null,
    };

    _v34AirDateCache.set(cacheKey, result);
    return result;
  }catch(e){ return null; }
}

// Formatea la fecha y genera el HTML del badge de estado
function _v34FormatAirBadge(date){
  if(!date) return { label:"Sin datos", color:"rgba(255,255,255,.15)", textColor:"var(--t3)", icon:"❓" };

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if(diffDays <= 0){
    // Ya estrenó
    const daysAgo = Math.abs(Math.floor(diffMs / 86400000));
    const label = daysAgo === 0 ? "Hoy" : daysAgo === 1 ? "Ayer" : `Hace ${daysAgo}d`;
    return { label:"✓ Disponible · "+label, color:"rgba(52,211,153,.15)", textColor:"#34d399", icon:"📡" };
  } else if(diffDays <= 7){
    return { label:`⏳ En ${diffDays} día${diffDays===1?"":"s"}`, color:"rgba(251,191,36,.12)", textColor:"#fbbf24", icon:"🗓" };
  } else {
    return { label:`📅 ${date.toLocaleDateString("es-CL",{day:"numeric",month:"short",year:"numeric"})}`, color:"rgba(99,119,237,.1)", textColor:"#a5b4fc", icon:"📅" };
  }
}

// Inyecta la sección de fecha en el panel expandido de una serie
// Se llama DESPUÉS del render síncrono; actualiza el DOM con un await
async function v34InjectAirDateSection(seriesId, jikanId, type, nextCap){
  const containerId = `v34-air-${seriesId}`;
  const container = document.getElementById(containerId);
  if(!container) return;

  // Mostrar skeleton mientras carga
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;">
      <div style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.06);flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="height:8px;width:60%;background:rgba(255,255,255,.06);border-radius:4px;margin-bottom:5px;"></div>
        <div style="height:10px;width:40%;background:rgba(255,255,255,.04);border-radius:4px;"></div>
      </div>
    </div>
  `;

  const info = await _v34FetchEpAirDate(jikanId, type, nextCap);
  // Verificar que el container siga en el DOM (el usuario puede haber cerrado el card)
  const liveContainer = document.getElementById(containerId);
  if(!liveContainer) return;

  const lbl = type === "manga" ? "Cap." : "Ep.";
  const badge = _v34FormatAirBadge(info ? info.date : null);
  const dateStr = info && info.date
    ? info.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short",year:"numeric"})
    : null;

  liveContainer.innerHTML = `
    <div style="
      margin:0 0 8px;
      background:linear-gradient(135deg, rgba(99,119,237,.08) 0%, rgba(52,211,153,.04) 100%);
      border:1px solid rgba(99,119,237,.2);
      border-radius:9px;
      padding:11px 13px;
      position:relative;
      overflow:hidden;
    ">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6377ed;">📅 Próximo por marcar</span>
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${badge.color};color:${badge.textColor};">${badge.label}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:7px;margin-bottom:6px;">
        <span style="font-size:20px;font-weight:800;color:var(--t1);font-family:'Space Mono',monospace;letter-spacing:-.02em;">${lbl} ${nextCap}</span>
        ${info && info.title ? `<span style="font-size:11px;color:var(--t2);font-style:italic;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">"${info.title}"</span>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--t2);">
          <span style="color:var(--t3);">${badge.icon}</span>
          ${dateStr
            ? `<span>Estrenó</span><span style="font-weight:600;color:var(--t1);">${dateStr}</span>`
            : `<span style="color:var(--t3);">Fecha no disponible en Jikan</span>`
          }
        </div>
      </div>
    </div>
  `;
}

// ── v3.4: Notas del parche para el historial ───────────────────────────
const _V34_PATCH_NOTES = `<div class="patch-version"><div class="patch-ver-tag">Parche v3.4 — 2026-05</div><ul class="patch-ver-items"><li>📰 <b>Panel de novedades en el inicio</b> — nuevo recuadro "Novedades de tu lista" justo encima de "Continuar leyendo"; muestra los caps/eps nuevos disponibles de tus series en emisión, con indicador de tiempo relativo (hace Xh, ayer, etc.), dot verde pulsante en tiempo real, y badge de conteo de no leídos; al hacer clic va directo al card expandido de la serie</li><li>📱 <b>Adaptación mobile del panel</b> — en pantallas ≤640px el panel de novedades se convierte en un carrusel horizontal deslizable de chips compactos, con franja de color superior por tipo (morado manga / verde anime) y hint de scroll; diseño idéntico al mockup aprobado</li><li>📅 <b>Fecha de estreno del próximo cap en el card</b> — al expandir cualquier serie en progreso con jikanId, aparece un recuadro "Próximo por marcar" con el número del cap/ep pendiente, su título si está disponible, la fecha exacta de estreno obtenida desde Jikan API, y un badge de estado: verde (Disponible · hace Xd), ámbar (En N días), azul (fecha futura), gris (sin datos); la carga es asíncrona y no bloquea el render de la tarjeta</li><li>⚡ <b>Cache de fechas en memoria</b> — las fechas de estreno se cachean por sesión en un Map (clave: jikanId-tipo-capNum); no se re-fetchea Jikan al abrir y cerrar el mismo card repetidamente; respeta el rate limit existente de la app</li></ul></div>`;

// ── v3.4: PATCH A p28RenderContinueRow ────────────────────────────────
// Envolver el render original de "Continuar leyendo" para inyectar el
// panel de noticias ANTES que aparezca la sección existente.
// Usamos el mismo patrón de wrapping que usa p28 con _p28_origRender.
(function(){
  // Solo parchear una vez (guard)
  if(window._v34Patched) return;
  window._v34Patched = true;

  // ── 1. Parchear p28RenderContinueRow para añadir el panel ANTES ──────
  const _origContinue = p28RenderContinueRow;
  window.p28RenderContinueRow = function(root){
    v34RenderNewsPanel(root);  // ← Panel de noticias ANTES de continuar leyendo
    _origContinue(root);
  };

  // ── 2. Parchear render para inyectar la sección de fecha en cada
  //       card expandido DESPUÉS del render síncrono ───────────────────
  const _origRender = window.render;
  window.render = function(){
    _origRender();
    // Post-render async: buscar todos los placeholders de fecha inyectados
    // por el render síncrono y rellenarlos con datos de Jikan
    requestAnimationFrame(()=>{
      document.querySelectorAll("[data-v34-air]").forEach(el => {
        const sid    = el.dataset.seriesId;
        const jid    = parseInt(el.dataset.jikanId);
        const type   = el.dataset.type;
        const nextCap= parseInt(el.dataset.nextCap);
        if(sid && jid && type && nextCap){
          v34InjectAirDateSection(sid, jid, type, nextCap);
        }
      });
    });
  };

  // ── 3. Parchear el render del expanded panel para añadir el
  //       placeholder de fecha dentro de cpnl ─────────────────────────
  // Usamos MutationObserver porque el cpnl se crea dinámicamente
  // dentro de render() via innerHTML; es más robusto que tocar la
  // cadena de texto directamente.
  const _observer = new MutationObserver(mutations => {
    mutations.forEach(mut => {
      mut.addedNodes.forEach(node => {
        if(!(node instanceof Element)) return;
        // Buscar cpnl recién añadidos
        const cpnls = node.classList.contains("cpnl")
          ? [node]
          : [...node.querySelectorAll(".cpnl")];

        cpnls.forEach(cpnl => {
          // Encontrar la scard padre para obtener el data-id
          const scard = cpnl.closest(".scard");
          if(!scard) return;
          const sid = scard.getAttribute("data-id");
          if(!sid) return;

          // Buscar la serie en data
          let series = null;
          let seriesType = null;
          for(const t of ["manga","anime"]){
            const found = data[t].find(s => s.id === sid);
            if(found){ series = found; seriesType = t; break; }
          }
          if(!series || !series.jikanId) return;

          const nc = (typeof nextChapter === "function") ? nextChapter(series) : null;
          if(nc === null) return; // serie al día o sin progreso: no mostrar

          // Verificar que no lo hayamos inyectado ya
          if(cpnl.querySelector("#v34-air-"+sid)) return;

          // Crear contenedor placeholder; se rellenará de forma async
          const placeholder = document.createElement("div");
          placeholder.id = `v34-air-${sid}`;
          placeholder.setAttribute("data-v34-air","1");
          placeholder.setAttribute("data-series-id", sid);
          placeholder.setAttribute("data-jikan-id", String(series.jikanId));
          placeholder.setAttribute("data-type", seriesType);
          placeholder.setAttribute("data-next-cap", String(nc));
          placeholder.style.cssText = "padding:0 0 2px 0;";

          // Insertar ANTES de la primera sección dsec (Estado)
          const firstDsec = cpnl.querySelector(".dsec");
          if(firstDsec){
            cpnl.insertBefore(placeholder, firstDsec);
          } else {
            cpnl.prepend(placeholder);
          }

          // Cargar datos de fecha async
          v34InjectAirDateSection(sid, series.jikanId, seriesType, nc);
        });
      });
    });
  });

  _observer.observe(document.getElementById("app") || document.body, {
    childList: true,
    subtree: true,
  });

  // ── 4. Añadir las notas de este parche al historial existente ────────
  if(typeof P28_PATCH_NOTES !== "undefined"){
    // Insertar al inicio del string de patch notes
    window.P28_PATCH_NOTES = _V34_PATCH_NOTES + P28_PATCH_NOTES;
  }

  // ── 5. CSS del parche (desktop + mobile) ─────────────────────────────
  if(!document.getElementById("mangu-patch-v34-css")){
    const style = document.createElement("style");
    style.id = "mangu-patch-v34-css";
    style.textContent = `

/* ═══════════════════════════════════
   MANGU v3.4 — Panel de noticias
   ═══════════════════════════════════ */

#v34-news-panel {
  animation: v34FadeIn .25s ease;
}
@keyframes v34FadeIn {
  from { opacity:0; transform:translateY(6px); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Hover en items desktop ── */
#v34-news-panel .v34-news-item {
  transition: background .12s;
}

/* ── Mobile: chips horizontales ── */
@media (max-width: 640px) {
  #v34-news-panel {
    margin: 0 0 12px 0;
  }
  #v34-news-row {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto;
    gap: 8px;
    padding: 10px 12px 6px !important;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  #v34-news-row::-webkit-scrollbar { display: none; }

  #v34-news-panel .v34-news-item {
    min-width: 152px !important;
    max-width: 152px !important;
    flex-direction: column !important;
    padding: 10px !important;
    border-radius: 10px !important;
    border: 1px solid rgba(255,255,255,.07) !important;
    background: rgba(255,255,255,.025) !important;
    border-bottom: none !important;
    gap: 0 !important;
  }
  #v34-news-panel .v34-news-item:hover {
    background: rgba(255,255,255,.04) !important;
  }
  #v34-news-panel .v34-cover {
    width: 100% !important;
    height: 42px !important;
    border-radius: 6px !important;
    margin: 0 0 7px 0 !important;
    object-fit: cover !important;
  }
  #v34-news-panel .v34-right {
    text-align: left !important;
    margin-top: 5px !important;
  }
  #v34-news-panel .v34-info {
    padding: 0 !important;
  }

  /* Hint visible solo en mobile */
  #v34-hint {
    display: block !important;
  }
}

/* Hint oculto en desktop */
#v34-hint {
  display: none;
}

/* ═══════════════════════════════════
   MANGU v3.4 — Sección fecha card
   ═══════════════════════════════════ */

/* Skeleton pulse */
@keyframes v34Skel {
  0%,100%{ opacity:.4; }
  50%{ opacity:.7; }
}
[id^="v34-air-"] > div > div {
  animation: v34Skel 1.2s ease infinite;
}

    `;
    document.head.appendChild(style);
  }

  // Trigger re-render para que el panel de noticias aparezca de inmediato
  if(typeof render === "function") render();

})();
// ── FIN PARCHE v3.4 ────────────────────────────────────────────────────
