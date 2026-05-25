// ═══════════════════════════════════════════════════════════════════════
//  MANGU — Parche v3.4 (final v3)
//  Instalación: js/patch-v3.4.js — después de ui.js en index.html
// ═══════════════════════════════════════════════════════════════════════

(function(){
  if(window._v34Patched) return;
  window._v34Patched = true;

  // ── CSS ────────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.id = "mangu-patch-v34-css";
  style.textContent = `

/* ═══════════════════════════════════════
   PANEL NOVEDADES — Desktop (fixed)
   Solo visible cuando hay espacio real
   (≥1100px viewport width)
   ═══════════════════════════════════════ */

#v34-news-panel {
  display: none; /* JS lo muestra si hay espacio */
  position: fixed;
  top: 16px;
  width: 230px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overflow-x: hidden;
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
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 13px 9px;
  border-bottom: 1px solid rgba(255,255,255,.06);
  background: rgba(13,15,26,.97);
  position: sticky;
  top: 0;
  z-index: 1;
}
.v34-live-dot {
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
  cursor: pointer;
  transition: background .12s;
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
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  margin-bottom:1px;
}
.v34-sub  { font-size:10px; color:var(--t2); }
.v34-right { text-align:right; flex-shrink:0; }
.v34-when  { font-size:10px; font-weight:700; margin-bottom:1px; }
.v34-udot  {
  width:6px; height:6px; border-radius:50%;
  background:#6377ed; flex-shrink:0;
}

/* ═══════════════════════════════════════
   PANEL NOVEDADES — Mobile (inline)
   Carrusel antes de "Continuar leyendo"
   Solo visible <1100px
   ═══════════════════════════════════════ */

#v34-mob {
  margin: 0 0 14px;
  background: rgba(255,255,255,.025);
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 12px;
  overflow: hidden;
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
.v34-chip-stripe {
  position:absolute; top:0; left:0; right:0; height:2px;
}
.v34-chip-type {
  font-size:8px; font-weight:700; letter-spacing:.07em; margin-bottom:3px;
}
.v34-chip-title {
  font-size:11px; font-weight:700; color:var(--t1);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px;
}
.v34-chip-sub { font-size:10px; color:var(--t2); margin-bottom:6px; }
.v34-chip-when {
  font-size:9px; font-weight:700;
  padding:2px 7px; border-radius:20px; display:inline-block;
}
.v34-chip-dot {
  position:absolute; top:8px; right:8px;
  width:6px; height:6px; border-radius:50%; background:#6377ed;
}
#v34-mob-hint {
  text-align:center; font-size:9px; color:var(--t3);
  padding:0 0 7px; letter-spacing:.05em;
}

/* ═══════════════════════════════════════
   RECUADRO FECHA en card expandido
   ═══════════════════════════════════════ */

.v34-airbox {
  margin:0 0 10px;
  background:linear-gradient(135deg,rgba(99,119,237,.09) 0%,rgba(52,211,153,.04) 100%);
  border:1px solid rgba(99,119,237,.2); border-radius:10px; padding:10px 13px;
}
.v34-airbox-hdr {
  display:flex; align-items:center; justify-content:space-between; margin-bottom:7px;
}
.v34-airbox-lbl {
  font-size:9px; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:#6377ed;
}
.v34-airbox-badge {
  font-size:9px; font-weight:700; padding:2px 8px; border-radius:20px;
}
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
@keyframes v34skel { 0%,100%{opacity:.35} 50%{opacity:.65} }
.v34-skel { animation:v34skel 1.2s ease infinite; }

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
    try{
      const e2=type==="manga"?"manga":"anime";
      const f=type==="manga"?"chapters":"episodes";
      const pg=Math.ceil(ep/100);
      const r=await _jikanFetch(`https://api.jikan.moe/v4/${e2}/${jid}/${f}?page=${pg}`,8000,1);
      if(!r||!Array.isArray(r.data)) return (_airCache[k]=null);
      const entry=r.data.find(e=>{
        const n=type==="anime"?Number(e.mal_id||e.episode_id||e.episode):parseFloat(e.chapter||e.chapters||"0");
        return Math.floor(n)===ep;
      });
      if(!entry) return (_airCache[k]=null);
      const from=type==="anime"?(entry.aired?.from||entry.air_date||null):(entry.published?.from||null);
      return (_airCache[k]={date:from?new Date(from):null, title:entry.title||entry.name||null});
    }catch(e){ return (_airCache[k]=null); }
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
      return (_schedCache[jid]={episode:nae.episode, date:new Date(nae.airingAt*1000)});
    }catch(e){ return (_schedCache[jid]=null); }
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

  // ── BUILD ITEMS ────────────────────────────────────────────────────
  function _items(){
    const now=Date.now(), res=[];
    for(const t of ["manga","anime"]){
      (data[t]||[]).filter(s=>s.status==="reading"||s.status==="plan").forEach(s=>{
        const nc=typeof nextChapter==="function"?nextChapter(s):null;
        const upToDate=nc===null&&s.total>0&&!s.jikanPublishing;
        const fresh=s.lastUpdated&&(now-s.lastUpdated)<48*3600*1000;
        res.push({id:s.id,title:s.title,type:t,total:s.total,
          completed:s.completed?.length||0, nextCap:nc, upToDate,
          pub:s.jikanPublishing||false, jid:s.jikanId||null,
          cover:s.cover||"", lu:s.lastUpdated||0,
          unread:nc!==null&&fresh});
      });
    }
    return res.sort((a,b)=>{
      if(a.unread!==b.unread) return a.unread?-1:1;
      if(a.pub!==b.pub) return a.pub?-1:1;
      return (b.lu||0)-(a.lu||0);
    });
  }

  function _texts(item){
    const L=item.type==="manga"?"Cap.":"Ep.";
    if(item.unread)       return {sub:`${L} ${item.nextCap} disponible`,   when:_ago(item.lu),      wc:"#34d399"};
    if(item.nextCap!==null&&item.pub) return {sub:`${L} ${item.nextCap} — próximamente`, when:"En emisión", wc:"#fbbf24"};
    if(item.upToDate)     return {sub:"Al día ✓",                          when:_ago(item.lu),      wc:"var(--t3)"};
    if(item.nextCap!==null) return {sub:`${L} ${item.nextCap} pendiente`,  when:_ago(item.lu),      wc:"var(--t2)"};
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

  // ── DESKTOP PANEL ─────────────────────────────────────────────────
  function _desktopPanel(items){
    const unread=items.filter(i=>i.unread).length;
    const p=document.createElement("div"); p.id="v34-news-panel";

    const hdr=document.createElement("div"); hdr.className="v34-phdr";
    const dot=document.createElement("div"); dot.className="v34-live-dot";
    const ttl=document.createElement("span"); ttl.className="v34-hdr-title"; ttl.textContent="Novedades";
    hdr.append(dot,ttl);
    if(unread>0){const b=document.createElement("span");b.className="v34-nbadge";b.textContent=`${unread} nuevo${unread>1?"s":""}`;hdr.appendChild(b);}
    p.appendChild(hdr);

    items.slice(0,10).forEach(item=>{
      const ac=item.type==="manga"?"#a78bfa":"#34d399";
      const {sub,when,wc}=_texts(item);
      const el=document.createElement("div");
      el.className="v34-item"+(item.unread?" v34-unread":"");
      if(item.unread) el.style.borderLeftColor=ac;

      // cover
      let cov;
      if(item.cover){
        cov=document.createElement("img"); cov.className="v34-cover";
        cov.src=item.cover; cov.onerror=()=>cov.style.display="none";
      } else {
        cov=document.createElement("div"); cov.className="v34-cover-ph";
        cov.style.cssText=`background:${item.type==="manga"?"rgba(167,139,250,.12)":"rgba(52,211,153,.1)"};color:${ac};`;
        cov.textContent=item.title.charAt(0);
      }

      const info=document.createElement("div"); info.className="v34-info";
      info.innerHTML=`<span class="v34-tpill" style="background:${item.type==="manga"?"rgba(167,139,250,.15)":"rgba(52,211,153,.1)"};color:${ac};">${item.type==="manga"?"MANGA":"ANIME"}</span><div class="v34-title">${item.title}</div><div class="v34-sub">${sub}</div>`;

      const right=document.createElement("div"); right.className="v34-right";
      right.innerHTML=`<div class="v34-when" style="color:${wc};">${when}</div>`;

      el.append(cov,info,right);
      if(item.unread){const ud=document.createElement("div");ud.className="v34-udot";el.appendChild(ud);}
      el.onclick=()=>_nav(item);
      p.appendChild(el);
    });

    _enrichSched(items,p,"desktop");
    return p;
  }

  // ── MOBILE PANEL ──────────────────────────────────────────────────
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
    items.slice(0,8).forEach(item=>{
      const ac=item.type==="manga"?"#a78bfa":"#34d399";
      const {sub,when,wc}=_texts(item);
      const chip=document.createElement("div"); chip.className="v34-chip";
      const stripe=document.createElement("div"); stripe.className="v34-chip-stripe"; stripe.style.background=ac;
      chip.appendChild(stripe);
      chip.innerHTML+=`<div class="v34-chip-type" style="color:${ac};">${item.type==="manga"?"MANGA":"ANIME"}</div><div class="v34-chip-title">${item.title}</div><div class="v34-chip-sub">${sub}</div><span class="v34-chip-when" style="background:${item.unread?"rgba(52,211,153,.15)":item.pub?"rgba(251,191,36,.1)":"rgba(255,255,255,.05)"};color:${wc};">${when||"—"}</span>`;
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

  // Enriquecer con schedule real de AniList (async)
  async function _enrichSched(items,container,mode){
    for(let i=0;i<items.length;i++){
      const item=items[i];
      if(!item.jid||!item.pub||item.type!=="anime") continue;
      try{
        const sc=await _fetchSched(item.jid); if(!sc) continue;
        const diff=Math.ceil((sc.date.getTime()-Date.now())/86400000);
        const L="Ep.";
        const newSub=diff<=0?`${L} ${sc.episode} disponible`:`${L} ${sc.episode} — ${sc.date.toLocaleDateString("es-CL",{day:"numeric",month:"short"})}`;
        const newWhen=diff<=0?"Hoy":`En ${diff}d`;
        const newWc=diff<=0?"#34d399":"#fbbf24";
        if(mode==="desktop"){
          const els=container.querySelectorAll(".v34-item");
          const el=els[i]; if(!el) continue;
          const s2=el.querySelector(".v34-sub"), w2=el.querySelector(".v34-when");
          if(s2) s2.textContent=newSub;
          if(w2){w2.textContent=newWhen; w2.style.color=newWc;}
        } else {
          const chips=container.querySelectorAll(".v34-chip");
          const chip=chips[i]; if(!chip) continue;
          const s2=chip.querySelector(".v34-chip-sub"), w2=chip.querySelector(".v34-chip-when");
          if(s2) s2.textContent=newSub;
          if(w2){w2.textContent=newWhen; w2.style.color=newWc;}
        }
      }catch(e){}
      await new Promise(r=>setTimeout(r,300));
    }
  }

  // ── POSICIONAMIENTO DESKTOP ────────────────────────────────────────
  // Mide el espacio entre el borde izquierdo de la ventana y el #app.
  // Si hay ≥256px disponibles → muestra el panel y añade padding al #app.
  // Si no → oculta el panel y quita el padding.
  const PANEL_W = 230;
  const GAP     = 12; // espacio entre panel y #app

  function _positionPanel(){
    const panel = document.getElementById("v34-news-panel");
    const appEl = document.getElementById("app");
    if(!panel||!appEl) return;

    const appRect = appEl.getBoundingClientRect();
    const spaceLeft = appRect.left; // px desde borde izq de ventana hasta #app

    if(spaceLeft >= PANEL_W + GAP*2){
      // Hay espacio: mostrar panel a la izquierda del #app
      panel.style.display = "block";
      const left = appRect.left - PANEL_W - GAP;
      panel.style.left  = left + "px";
      panel.style.width = PANEL_W + "px";
    } else {
      // Sin espacio: ocultar panel desktop (mobile panel lo cubre)
      panel.style.display = "none";
    }
  }

  // ── AIRBOX en card expandido ───────────────────────────────────────
  function _injectAirbox(cpnl,series,type){
    if(cpnl.querySelector(".v34-airbox")) return;
    const nc=typeof nextChapter==="function"?nextChapter(series):null;
    if(nc===null||!series.jikanId) return;
    const L=type==="manga"?"Cap.":"Ep.";

    const box=document.createElement("div"); box.className="v34-airbox";
    box.innerHTML=`<div class="v34-airbox-hdr"><span class="v34-airbox-lbl">📅 Próximo por marcar</span><span class="v34-airbox-badge v34-skel" style="background:rgba(255,255,255,.07);color:var(--t3);">cargando...</span></div><div class="v34-airbox-main"><span class="v34-airbox-num">${L} ${nc}</span><span class="v34-airbox-eptitle v34-skel" style="color:var(--t3);">consultando Jikan...</span></div><div class="v34-airbox-dates"><span class="v34-skel" style="color:var(--t3);font-size:10px;">buscando fecha...</span></div>`;

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

  // ── MUTATION OBSERVER para airbox ─────────────────────────────────
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

    // Limpiar paneles anteriores
    document.getElementById("v34-news-panel")?.remove();
    document.getElementById("v34-mob")?.remove();

    const items=_items();
    if(!items.length) return;

    const appEl=document.getElementById("app");

    // 1. Desktop: panel fixed al body
    const dp=_desktopPanel(items);
    document.body.appendChild(dp);
    _positionPanel();

    // 2. Mobile: panel inline antes de "Continuar leyendo"
    //    (se muestra via CSS solo cuando el desktop panel no tiene espacio)
    const mp=_mobilePanel(items);
    const cont=appEl?.querySelector(".continue-section");
    if(cont) appEl.insertBefore(mp,cont);
    else if(appEl){
      const sr=appEl.querySelector(".sr");
      if(sr) appEl.insertBefore(mp,sr.nextSibling);
      else appEl.appendChild(mp);
    }

    // Mostrar/ocultar mobile panel según si el desktop panel tiene espacio
    const appRect=appEl?.getBoundingClientRect();
    const spaceLeft=appRect?appRect.left:0;
    mp.style.display=(spaceLeft>=PANEL_W+GAP*2)?"none":"block";
  };

  // Re-posicionar y re-evaluar al resize
  window.addEventListener("resize",()=>{
    _positionPanel();
    const appEl=document.getElementById("app");
    const appRect=appEl?.getBoundingClientRect();
    const spaceLeft=appRect?appRect.left:0;
    const mp=document.getElementById("v34-mob");
    if(mp) mp.style.display=(spaceLeft>=PANEL_W+GAP*2)?"none":"block";
  },{passive:true});

  // ── PATCH NOTES v3.4 ──────────────────────────────────────────────
  // P28_PATCH_NOTES está definido con const en ui.js, por lo que
  // window.P28_PATCH_NOTES no alcanza el binding local del closure.
  // Solución: parchear el innerHTML del patch-panel directamente
  // interceptando el render cuando showPatch===true.
  const V34_HTML=`<div class="patch-version"><div class="patch-ver-tag">Parche v3.4 — 2026-05</div><ul class="patch-ver-items"><li>📰 <b>Panel de novedades lateral (desktop)</b> — columna fija position:fixed a la izquierda del bloque #app; se muestra únicamente cuando hay espacio real disponible (mide getBoundingClientRect en tiempo real); no afecta el ancho ni el layout del contenido principal; se oculta automáticamente en ventanas más pequeñas o al hacer resize</li><li>📱 <b>Carrusel mobile de novedades</b> — cuando el panel desktop no tiene espacio aparece un banner horizontal scrolleable inline antes de "Continuar leyendo"; chips de 145px con franja de color por tipo (morado manga / verde anime), countdown de días, dot azul para no leídos</li><li>📅 <b>Fechas de estreno en card expandido</b> — recuadro "Próximo por marcar" con número de cap/ep, título del episodio, fecha exacta de estreno desde Jikan API; para anime en emisión muestra además la fecha del próximo episodio a estrenar via AniList GraphQL nextAiringEpisode con countdown en días</li><li>🗓 <b>Countdown dinámico para próximos estrenos</b> — los items del panel y el card muestran "En Nd" para próximos estreno y "✓ Hoy/Hace Nd" para caps ya disponibles; se actualiza via AniList GraphQL sin afectar el rate limit de Jikan</li><li>⚡ <b>Cache de fechas por sesión</b> — las fechas de Jikan y schedules de AniList se cachean en objetos JS; no se re-fetchea al abrir y cerrar el mismo card repetidamente; respeta el rate limit de 3 req/s</li></ul></div>`;

  // Inyectar en el patch-panel después de cada render cuando showPatch===true
  const _injectPatchNote = () => {
    const pp = document.querySelector(".patch-panel");
    if(!pp) return;
    // Solo inyectar si no está ya
    if(pp.querySelector(".v34-injected")) return;
    const h3 = pp.querySelector("h3");
    if(!h3) return;
    const div = document.createElement("div");
    div.className = "v34-injected";
    div.innerHTML = V34_HTML;
    // Insertar justo después del h3
    h3.insertAdjacentElement("afterend", div);
  };

  // Observar el #app para detectar cuando aparece el patch-panel
  const patchObs = new MutationObserver(() => _injectPatchNote());
  patchObs.observe(document.getElementById("app") || document.body, {
    childList: true, subtree: false
  });

  // Trigger inicial
  if(typeof render==="function") render();

})();
// ── FIN PARCHE v3.4 ────────────────────────────────────────────────────
