// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.4 (final)
//  Instalación: <script src="js/patch-v3.4.js"></script> después de ui.js
// ═══════════════════════════════════════════════════════════════════════

(function(){
  if(window._v34Patched) return;
  window._v34Patched = true;

  // ── CSS ────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.id = "mangu-patch-v34-css";
  style.textContent = `

/* ═══════════════════════════════════════════
   PANEL NOVEDADES — Desktop
   Columna fija a la izquierda del contenido.
   No toca el layout principal de la app.
   ═══════════════════════════════════════════ */

#v34-news-panel {
  position: fixed;
  top: 12px;
  /* Se calcula dinámicamente via JS para quedar pegado al borde izq del #app */
  width: 240px;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  z-index: 10;
  background: rgba(13,15,26,.97);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px;
  font-family: 'Outfit', sans-serif;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: opacity .2s, transform .2s;
}
#v34-news-panel::-webkit-scrollbar { display: none; }

/* Ocultar en mobile — se muestra como banner arriba */
@media (max-width: 860px) {
  #v34-news-panel {
    display: none !important;
  }
  #v34-news-mobile {
    display: block !important;
  }
}

/* ── Header del panel ── */
#v34-news-panel .v34-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px 9px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  background: linear-gradient(90deg, rgba(99,119,237,.08) 0%, transparent 70%);
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: rgba(13,15,26,.97);
}
.v34-live-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #34d399;
  flex-shrink: 0;
  animation: v34pulse 2s infinite;
}
@keyframes v34pulse {
  0%,100% { box-shadow: 0 0 0 3px rgba(52,211,153,.15); }
  50%      { box-shadow: 0 0 0 5px rgba(52,211,153,.05); }
}
.v34-hdr-left {
  display: flex;
  align-items: center;
  gap: 7px;
}
.v34-hdr-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--t1);
  letter-spacing: .01em;
}
.v34-new-badge {
  font-size: 9px; font-weight: 700;
  background: rgba(52,211,153,.15);
  color: #34d399;
  border: 1px solid rgba(52,211,153,.3);
  border-radius: 20px;
  padding: 1px 7px;
}

/* ── Items del panel desktop ── */
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
#v34-news-panel .v34-item.v34-unread { border-left: 2px solid; }

.v34-cover {
  width: 32px; height: 44px;
  border-radius: 5px;
  object-fit: cover;
  flex-shrink: 0;
}
.v34-cover-ph {
  width: 32px; height: 44px;
  border-radius: 5px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; font-style: italic;
}
.v34-info { flex: 1; min-width: 0; }
.v34-type-pill {
  font-size: 8px; font-weight: 700;
  letter-spacing: .06em;
  padding: 1px 5px; border-radius: 20px;
  display: inline-block; margin-bottom: 2px;
}
.v34-title {
  font-size: 11px; font-weight: 600;
  color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 1px;
}
.v34-sub { font-size: 10px; color: var(--t2); }
.v34-right { text-align: right; flex-shrink: 0; }
.v34-when { font-size: 10px; font-weight: 700; margin-bottom: 1px; }
.v34-dot-unread {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #6377ed;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════
   PANEL NOVEDADES — Mobile
   Banner horizontal scrolleable arriba del
   "Continuar leyendo". Solo visible ≤860px.
   ═══════════════════════════════════════════ */

#v34-news-mobile {
  display: none;
  margin: 0 0 12px 0;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Outfit', sans-serif;
}
#v34-news-mobile .v34-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 13px 8px;
  border-bottom: 1px solid rgba(255,255,255,.05);
  background: linear-gradient(90deg, rgba(99,119,237,.07) 0%, transparent 70%);
}
#v34-news-mobile .v34-chips-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 12px 8px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
#v34-news-mobile .v34-chips-row::-webkit-scrollbar { display: none; }
#v34-news-mobile .v34-chip {
  flex-shrink: 0;
  width: 140px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 9px;
  padding: 9px 10px;
  cursor: pointer;
  transition: background .12s;
  position: relative;
  overflow: hidden;
}
#v34-news-mobile .v34-chip:hover { background: rgba(255,255,255,.06); }
#v34-news-mobile .v34-chip-stripe {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
}
#v34-news-mobile .v34-chip-type {
  font-size: 8px; font-weight: 700;
  letter-spacing: .07em;
  margin-bottom: 3px;
}
#v34-news-mobile .v34-chip-title {
  font-size: 11px; font-weight: 700;
  color: var(--t1);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px;
}
#v34-news-mobile .v34-chip-sub {
  font-size: 10px; color: var(--t2);
  margin-bottom: 6px;
}
#v34-news-mobile .v34-chip-when {
  font-size: 9px; font-weight: 700;
  padding: 2px 7px; border-radius: 20px;
  display: inline-block;
}
#v34-news-mobile .v34-chip-dot {
  position: absolute;
  top: 8px; right: 8px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #6377ed;
}
#v34-news-hint-m {
  text-align: center;
  font-size: 9px;
  color: var(--t3);
  padding: 0 0 7px;
  letter-spacing: .05em;
}

/* ═══════════════════════════════════════════
   RECUADRO FECHA en card expandido
   ═══════════════════════════════════════════ */

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
  0%,100%{ opacity:.35; } 50%{ opacity:.65; }
}
.v34-skel { animation: v34skel 1.2s ease infinite; }

  `;
  document.head.appendChild(style);

  // ── HELPERS ────────────────────────────────────────────────────────
  function _timeAgo(ts){
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

  const _airCache = new Map();
  const _schedCache = new Map();

  async function _fetchAirDate(jikanId, type, epNum){
    if(!jikanId||!epNum) return null;
    const k=`${jikanId}-${type}-${epNum}`;
    if(_airCache.has(k)) return _airCache.get(k);
    try{
      const ep=type==="manga"?"manga":"anime";
      const field=type==="manga"?"chapters":"episodes";
      const page=Math.ceil(epNum/100);
      const res=await _jikanFetch(
        `https://api.jikan.moe/v4/${ep}/${jikanId}/${field}?page=${page}`,8000,1);
      if(!res||!Array.isArray(res.data)) return null;
      const entry=res.data.find(e=>{
        const n=type==="anime"
          ?Number(e.mal_id||e.episode_id||e.episode)
          :parseFloat(e.chapter||e.chapters||"0");
        return Math.floor(n)===epNum;
      });
      if(!entry){_airCache.set(k,null);return null;}
      const from=type==="anime"
        ?(entry.aired?.from||entry.air_date||null)
        :(entry.published?.from||null);
      const result={date:from?new Date(from):null, title:entry.title||entry.name||null};
      _airCache.set(k,result);
      return result;
    }catch(e){return null;}
  }

  async function _fetchSchedule(jikanId){
    const k=`sched-${jikanId}`;
    if(_schedCache.has(k)) return _schedCache.get(k);
    try{
      const gql=`{Media(idMal:${jikanId},type:ANIME){nextAiringEpisode{episode airingAt}}}`;
      const res=await fetch("https://graphql.anilist.co",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query:gql}),
        signal:AbortSignal.timeout(5000)
      });
      if(!res.ok) return null;
      const json=await res.json();
      const nae=json?.data?.Media?.nextAiringEpisode;
      if(!nae){_schedCache.set(k,null);return null;}
      const result={episode:nae.episode, date:new Date(nae.airingAt*1000)};
      _schedCache.set(k,result);
      return result;
    }catch(e){return null;}
  }

  function _airBadge(date){
    if(!date) return {label:"Sin datos",bg:"rgba(255,255,255,.08)",color:"var(--t3)"};
    const diff=Math.ceil((date.getTime()-Date.now())/86400000);
    if(diff<=0){
      const ago=Math.abs(Math.floor((date.getTime()-Date.now())/86400000));
      const when=ago===0?"Hoy":ago===1?"Ayer":`Hace ${ago}d`;
      return {label:`✓ ${when}`, bg:"rgba(52,211,153,.15)", color:"#34d399"};
    }
    if(diff<=7) return {label:`En ${diff}d`, bg:"rgba(251,191,36,.12)", color:"#fbbf24"};
    return {label:date.toLocaleDateString("es-CL",{day:"numeric",month:"short"}), bg:"rgba(99,119,237,.12)", color:"#a5b4fc"};
  }

  // ── BUILD NEWS ITEMS ───────────────────────────────────────────────
  function _buildItems(){
    const now=Date.now();
    const items=[];
    for(const type of ["manga","anime"]){
      data[type]
        .filter(s=>s.status==="reading"||s.status==="plan")
        .forEach(s=>{
          const nc=(typeof nextChapter==="function")?nextChapter(s):null;
          const isUpToDate=nc===null&&s.total>0&&!s.jikanPublishing;
          const recentlyUpdated=s.lastUpdated&&(now-s.lastUpdated)<48*3600*1000;
          const hasUnread=nc!==null&&recentlyUpdated;
          items.push({
            id:s.id, title:s.title, type,
            total:s.total, completed:s.completed?.length||0,
            nextCap:nc, isUpToDate,
            publishing:s.jikanPublishing||false,
            jikanId:s.jikanId||null,
            cover:s.cover||"",
            lastUpdated:s.lastUpdated||0,
            hasUnread
          });
        });
    }
    items.sort((a,b)=>{
      if(a.hasUnread!==b.hasUnread) return a.hasUnread?-1:1;
      if(a.publishing!==b.publishing) return a.publishing?-1:1;
      return (b.lastUpdated||0)-(a.lastUpdated||0);
    });
    return items;
  }

  function _itemTexts(item){
    const lbl=item.type==="manga"?"Cap.":"Ep.";
    let subText="", whenText="", whenColor="var(--t2)";
    if(item.hasUnread){
      subText=`${lbl} ${item.nextCap} disponible`;
      whenText=_timeAgo(item.lastUpdated); whenColor="#34d399";
    } else if(item.nextCap!==null&&item.publishing){
      subText=`${lbl} ${item.nextCap} — próximamente`;
      whenText="En emisión"; whenColor="#fbbf24";
    } else if(item.isUpToDate){
      subText=`Al día ✓`;
      whenText=_timeAgo(item.lastUpdated); whenColor="var(--t3)";
    } else if(item.nextCap!==null){
      subText=`${lbl} ${item.nextCap} pendiente`;
      whenText=_timeAgo(item.lastUpdated);
    }
    return {subText, whenText, whenColor};
  }

  function _navToSeries(item){
    if(typeof tab!=="undefined"&&typeof expanded!=="undefined"&&typeof render==="function"){
      tab=item.type; expanded[item.id]=true; pinnedId=item.id; viewMode="list";
      render();
      setTimeout(()=>{
        const node=document.querySelector(`[data-id="${item.id}"]`);
        if(node) node.scrollIntoView({behavior:"smooth",block:"center"});
      },200);
    }
  }

  // ── PANEL DESKTOP ──────────────────────────────────────────────────
  function _buildDesktopPanel(items){
    const unread=items.filter(i=>i.hasUnread).length;
    const panel=document.createElement("div");
    panel.id="v34-news-panel";

    // Header
    const hdr=document.createElement("div");
    hdr.className="v34-hdr";
    const left=document.createElement("div");
    left.className="v34-hdr-left";
    const dot=document.createElement("div");
    dot.className="v34-live-dot";
    const ttl=document.createElement("span");
    ttl.className="v34-hdr-title";
    ttl.textContent="Novedades";
    left.append(dot,ttl);
    if(unread>0){
      const badge=document.createElement("span");
      badge.className="v34-new-badge";
      badge.textContent=`${unread} nuevo${unread>1?"s":""}`;
      left.appendChild(badge);
    }
    hdr.appendChild(left);
    panel.appendChild(hdr);

    // Items
    items.slice(0,10).forEach((item,idx)=>{
      const ac=item.type==="manga"?"#a78bfa":"#34d399";
      const typeLabel=item.type==="manga"?"MANGA":"ANIME";
      const {subText,whenText,whenColor}=_itemTexts(item);

      const el=document.createElement("div");
      el.className="v34-item"+(item.hasUnread?" v34-unread":"");
      if(item.hasUnread) el.style.borderLeftColor=ac;

      // Cover
      let coverEl;
      if(item.cover){
        coverEl=document.createElement("img");
        coverEl.className="v34-cover";
        coverEl.src=item.cover;
        coverEl.onerror=()=>{coverEl.style.display="none";};
      } else {
        coverEl=document.createElement("div");
        coverEl.className="v34-cover-ph";
        coverEl.style.cssText=`background:${item.type==="manga"?"rgba(167,139,250,.12)":"rgba(52,211,153,.1)"};color:${ac};`;
        coverEl.textContent=item.title.charAt(0);
      }

      const info=document.createElement("div");
      info.className="v34-info";
      info.innerHTML=`
        <span class="v34-type-pill" style="background:${item.type==="manga"?"rgba(167,139,250,.15)":"rgba(52,211,153,.1)"};color:${ac};">${typeLabel}</span>
        <div class="v34-title">${item.title}</div>
        <div class="v34-sub">${subText}</div>
      `;

      const right=document.createElement("div");
      right.className="v34-right";
      right.innerHTML=`<div class="v34-when" style="color:${whenColor};">${whenText}</div>`;

      el.append(coverEl,info,right);
      if(item.hasUnread){
        const udot=document.createElement("div");
        udot.className="v34-dot-unread";
        el.appendChild(udot);
      }
      el.onclick=()=>_navToSeries(item);
      panel.appendChild(el);
    });

    // Enriquecer con fechas reales de AniList (async, sin bloquear)
    _enrichWithSchedule(items, panel, "desktop");

    return panel;
  }

  // ── PANEL MOBILE ───────────────────────────────────────────────────
  function _buildMobilePanel(items){
    const unread=items.filter(i=>i.hasUnread).length;
    const wrap=document.createElement("div");
    wrap.id="v34-news-mobile";

    const hdr=document.createElement("div");
    hdr.className="v34-hdr";
    const left=document.createElement("div");
    left.className="v34-hdr-left";
    const dot=document.createElement("div");
    dot.className="v34-live-dot";
    dot.style.width="6px"; dot.style.height="6px";
    const ttl=document.createElement("span");
    ttl.className="v34-hdr-title";
    ttl.textContent="Novedades";
    left.append(dot,ttl);
    if(unread>0){
      const badge=document.createElement("span");
      badge.className="v34-new-badge";
      badge.textContent=`${unread} nuevo${unread>1?"s":""}`;
      left.appendChild(badge);
    }
    hdr.appendChild(left);
    wrap.appendChild(hdr);

    const row=document.createElement("div");
    row.className="v34-chips-row";

    items.slice(0,8).forEach(item=>{
      const ac=item.type==="manga"?"#a78bfa":"#34d399";
      const typeLabel=item.type==="manga"?"MANGA":"ANIME";
      const {subText,whenText,whenColor}=_itemTexts(item);

      const chip=document.createElement("div");
      chip.className="v34-chip";

      const stripe=document.createElement("div");
      stripe.className="v34-chip-stripe";
      stripe.style.background=ac;
      chip.appendChild(stripe);

      chip.innerHTML+=`
        <div class="v34-chip-type" style="color:${ac};">${typeLabel}</div>
        <div class="v34-chip-title">${item.title}</div>
        <div class="v34-chip-sub">${subText}</div>
        <span class="v34-chip-when" style="background:${item.hasUnread?"rgba(52,211,153,.15)":item.publishing?"rgba(251,191,36,.1)":"rgba(255,255,255,.05)"};color:${whenColor};">${whenText||"—"}</span>
      `;
      if(item.hasUnread){
        const udot=document.createElement("div");
        udot.className="v34-chip-dot";
        chip.appendChild(udot);
      }
      chip.onclick=()=>_navToSeries(item);
      row.appendChild(chip);
    });

    wrap.appendChild(row);

    const hint=document.createElement("div");
    hint.id="v34-news-hint-m";
    hint.textContent="← desliza para ver más →";
    wrap.appendChild(hint);

    _enrichWithSchedule(items, wrap, "mobile");
    return wrap;
  }

  // Enriquece sub-textos con fechas reales de AniList
  async function _enrichWithSchedule(items, container, mode){
    for(let i=0;i<items.length;i++){
      const item=items[i];
      if(!item.jikanId||!item.publishing||item.type!=="anime") continue;
      try{
        const sched=await _fetchSchedule(item.jikanId);
        if(!sched) continue;
        const diff=Math.ceil((sched.date.getTime()-Date.now())/86400000);
        const lbl="Ep.";
        let newSub="", newWhen="", newColor="var(--t2)";
        if(diff<=0){
          newSub=`${lbl} ${sched.episode} disponible`;
          newWhen="Hoy"; newColor="#34d399";
        } else {
          const dateStr=sched.date.toLocaleDateString("es-CL",{day:"numeric",month:"short"});
          newSub=`${lbl} ${sched.episode} — ${dateStr}`;
          newWhen=`En ${diff}d`; newColor="#fbbf24";
        }
        // Actualizar DOM
        if(mode==="desktop"){
          const els=container.querySelectorAll(".v34-item");
          const el=els[i]; if(!el) continue;
          const subEl=el.querySelector(".v34-sub");
          const whenEl=el.querySelector(".v34-when");
          if(subEl) subEl.textContent=newSub;
          if(whenEl){whenEl.textContent=newWhen; whenEl.style.color=newColor;}
        } else {
          const chips=container.querySelectorAll(".v34-chip");
          const chip=chips[i]; if(!chip) continue;
          const subEl=chip.querySelector(".v34-chip-sub");
          const whenEl=chip.querySelector(".v34-chip-when");
          if(subEl) subEl.textContent=newSub;
          if(whenEl){whenEl.textContent=newWhen; whenEl.style.color=newColor;}
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,300));
    }
  }

  // ── POSICIONAR EL PANEL DESKTOP ────────────────────────────────────
  // El panel va a la izquierda del #app, calculando la posición en px.
  function _positionDesktopPanel(){
    const panel=document.getElementById("v34-news-panel");
    if(!panel) return;
    const appEl=document.getElementById("app");
    if(!appEl) return;
    const appRect=appEl.getBoundingClientRect();
    // El panel queda entre el borde izquierdo de la ventana y el app
    const spaceLeft=appRect.left; // píxeles disponibles a la izquierda
    if(spaceLeft<260){
      // No hay espacio suficiente: ocultar (el CSS de media query lo maneja
      // pero por si acaso el viewport es intermedio)
      panel.style.display="none";
      return;
    }
    panel.style.display="block";
    // Centrar el panel en el espacio izquierdo disponible
    const panelW=Math.min(240, spaceLeft-16);
    panel.style.width=panelW+"px";
    panel.style.left=(appRect.left-panelW-12)+"px";
    panel.style.top="12px";
  }

  // ── RECUADRO FECHA EN CARD EXPANDIDO ──────────────────────────────
  function _injectAirBox(cpnl, series, type){
    if(cpnl.querySelector(".v34-airbox")) return;
    const nc=(typeof nextChapter==="function")?nextChapter(series):null;
    if(nc===null||!series.jikanId) return;
    const lbl=type==="manga"?"Cap.":"Ep.";

    const box=document.createElement("div");
    box.className="v34-airbox";
    box.innerHTML=`
      <div class="v34-airbox-hdr">
        <span class="v34-airbox-lbl">📅 Próximo por marcar</span>
        <span class="v34-airbox-badge v34-skel" style="background:rgba(255,255,255,.07);color:var(--t3);">cargando...</span>
      </div>
      <div class="v34-airbox-main">
        <span class="v34-airbox-num">${lbl} ${nc}</span>
        <span class="v34-airbox-eptitle v34-skel" style="color:var(--t3);">consultando Jikan...</span>
      </div>
      <div class="v34-airbox-dates">
        <span class="v34-skel" style="color:var(--t3);font-size:10px;">buscando fecha de estreno...</span>
      </div>
    `;

    const firstDsec=cpnl.querySelector(".dsec");
    if(firstDsec) cpnl.insertBefore(box,firstDsec);
    else cpnl.prepend(box);

    // Cargar fecha del episodio actual
    _loadAirBox(box,series.jikanId,type,nc);
    // Para anime en emisión: también mostrar próximo no publicado
    if(type==="anime"&&series.jikanPublishing){
      _loadNextEpBox(box,series.jikanId,nc);
    }
  }

  async function _loadAirBox(box,jikanId,type,epNum){
    const info=await _fetchAirDate(jikanId,type,epNum);
    if(!document.body.contains(box)) return;
    const badge=_airBadge(info?.date||null);
    const dateStr=info?.date
      ?info.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short",year:"numeric"})
      :null;
    const badgeEl=box.querySelector(".v34-airbox-badge");
    const titleEl=box.querySelector(".v34-airbox-eptitle");
    const datesEl=box.querySelector(".v34-airbox-dates");
    if(badgeEl){badgeEl.textContent=badge.label;badgeEl.style.background=badge.bg;badgeEl.style.color=badge.color;badgeEl.classList.remove("v34-skel");}
    if(titleEl){titleEl.textContent=info?.title?`"${info.title}"`:"";}
    titleEl?.classList.remove("v34-skel");
    if(datesEl){
      datesEl.classList.remove("v34-skel");
      datesEl.innerHTML=dateStr
        ?`<span>📡 Estrenó <span class="v34-airbox-date-val">${dateStr}</span></span>`
        :`<span style="color:var(--t3)">Fecha no disponible en Jikan</span>`;
    }
  }

  async function _loadNextEpBox(box,jikanId,currentEp){
    const sched=await _fetchSchedule(jikanId);
    if(!sched||!document.body.contains(box)) return;
    if(sched.episode<=currentEp) return;
    const badge=_airBadge(sched.date);
    const dateStr=sched.date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
    const extra=document.createElement("div");
    extra.style.cssText="margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.05);";
    extra.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);">Próximo estreno</span>
        <span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;background:${badge.bg};color:${badge.color};">${badge.label}</span>
      </div>
      <div style="margin-top:5px;font-size:10px;color:var(--t2);">
        <span>🗓 Ep. ${sched.episode}</span>
        <span style="color:var(--t3);margin:0 6px;">·</span>
        <span class="v34-airbox-date-val">${dateStr}</span>
      </div>
    `;
    const datesEl=box.querySelector(".v34-airbox-dates");
    if(datesEl) datesEl.appendChild(extra);
  }

  // ── OBSERVER para cards expandidos ────────────────────────────────
  const observer=new MutationObserver(muts=>{
    muts.forEach(mut=>{
      mut.addedNodes.forEach(node=>{
        if(!(node instanceof Element)) return;
        const cpnls=node.classList?.contains("cpnl")?[node]:[...node.querySelectorAll(".cpnl")];
        cpnls.forEach(cpnl=>{
          const scard=cpnl.closest(".scard"); if(!scard) return;
          const sid=scard.getAttribute("data-id"); if(!sid) return;
          let series=null,seriesType=null;
          for(const t of ["manga","anime"]){
            const f=data[t].find(s=>s.id===sid);
            if(f){series=f;seriesType=t;break;}
          }
          if(!series||!series.jikanId) return;
          _injectAirBox(cpnl,series,seriesType);
        });
      });
    });
  });
  observer.observe(document.getElementById("app")||document.body,{childList:true,subtree:true});

  // ── PATCH render ───────────────────────────────────────────────────
  const _origRender=window.render;
  window.render=function(){
    _origRender();

    // 1. Remover paneles anteriores
    document.getElementById("v34-news-panel")?.remove();
    document.getElementById("v34-news-mobile")?.remove();

    const items=_buildItems();
    if(!items.length) return;

    // 2. Panel desktop — se añade al body (position:fixed)
    const desktopPanel=_buildDesktopPanel(items);
    document.body.appendChild(desktopPanel);
    _positionDesktopPanel();

    // 3. Panel mobile — se inyecta antes de "Continuar leyendo" dentro del #app
    const mobilePanel=_buildMobilePanel(items);
    const appEl=document.getElementById("app");
    const continueSection=appEl?.querySelector(".continue-section");
    if(continueSection){
      appEl.insertBefore(mobilePanel, continueSection);
    } else if(appEl){
      // Si no hay "continuar leyendo", insertar antes del primer child no-header
      const sr=appEl.querySelector(".sr");
      if(sr) appEl.insertBefore(mobilePanel, sr.nextSibling);
      else appEl.appendChild(mobilePanel);
    }
  };

  // Re-posicionar al hacer resize
  window.addEventListener("resize", _positionDesktopPanel, {passive:true});

  // ── PATCH NOTES ────────────────────────────────────────────────────
  const v34notes=`<div class="patch-version"><div class="patch-ver-tag">Parche v3.4 — 2026-05</div><ul class="patch-ver-items"><li>📰 <b>Panel de novedades lateral (desktop)</b> — columna fija position:fixed a la izquierda del bloque central de la app; no afecta el ancho ni el layout del contenido principal; se posiciona automáticamente calculando el espacio disponible entre el borde de la ventana y el div #app; se oculta si no hay espacio suficiente (≤860px)</li><li>📱 <b>Carrusel mobile</b> — en pantallas ≤860px aparece como banner horizontal scrolleable justo antes de "Continuar leyendo"; chips de 140px con franja de color por tipo, countdown de días para próximos estreno</li><li>📅 <b>Fechas reales de estreno en card expandido</b> — recuadro "Próximo por marcar" con fecha exacta del cap/ep pendiente desde Jikan; para anime en emisión muestra además la fecha del próximo episodio a estrenar via AniList nextAiringEpisode; cache en memoria por sesión</li><li>🗓 <b>Countdown dinámico</b> — los items del panel y el card muestran "En Nd" para próximos estreno y "✓ Hoy/Hace Nd" para caps ya disponibles; se actualiza via AniList GraphQL sin afectar el rate limit de Jikan</li></ul></div>`;
  if(typeof P28_PATCH_NOTES!=="undefined") window.P28_PATCH_NOTES=v34notes+P28_PATCH_NOTES;

  // Trigger inicial
  if(typeof render==="function") render();

})();
// ── FIN PARCHE v3.4 ────────────────────────────────────────────────────
