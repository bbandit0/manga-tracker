// ── MANGU ACTIVITY MODULE — Parche 3.5 ──────────────────────────────────────
// Todo expandido, sin tabs, con colores vibrantes coherentes con el perfil
// ────────────────────────────────────────────────────────────────────────────

(function(){

// ── 1. LOGGING ───────────────────────────────────────────────────────────────

window.logManguActivity = function(series, countDelta){
  if(!series||countDelta<=0) return;
  const d=new Date().toISOString().slice(0,10);
  if(!series.activityLog) series.activityLog=[];
  const ex=series.activityLog.find(e=>e.date===d);
  if(ex) ex.count+=countDelta; else series.activityLog.push({date:d,count:countDelta});
};

// ── 2. PATCH migrate() ───────────────────────────────────────────────────────

const _origMigrate=window.migrate;
if(typeof _origMigrate==="function"){
  window.migrate=function(s){ const r=_origMigrate(s); r.activityLog=s.activityLog||[]; return r; };
}

// ── 3. HELPERS ───────────────────────────────────────────────────────────────

function buildMap(){ if(typeof data==="undefined") return {}; const m={}; [...(data.manga||[]),(data.anime||[])].flat().forEach(s=>{ (s.activityLog||[]).forEach(e=>{ m[e.date]=(m[e.date]||0)+e.count; }); }); return m; }
function weekTotal(m){ let s=0; for(let i=0;i<7;i++){ const d=new Date(); d.setDate(d.getDate()-i); s+=m[d.toISOString().slice(0,10)]||0; } return s; }
function monthTotal(m){ const p=new Date().toISOString().slice(0,7); return Object.entries(m).filter(([k])=>k.startsWith(p)).reduce((s,[,v])=>s+v,0); }
function streak(m){ let n=0,d=new Date(); while(true){ const k=d.toISOString().slice(0,10); if(!m[k]) break; n++; d.setDate(d.getDate()-1); } return n; }
function age(s){ const ref=s.startDate?new Date(s.startDate).getTime():(s.createdAt||parseInt(s.id)||Date.now()); const days=Math.max(0,Math.floor((Date.now()-ref)/86400000)); return{days,weeks:Math.floor(days/7),months:(days/30.44).toFixed(1),label:days>=60?(days/30.44).toFixed(1)+"m":days>=14?Math.floor(days/7)+"sem":days+"d"}; }
function ha(hex,a){ hex=hex.replace("#",""); return `rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${a})`; }

// ── 4. CSS ───────────────────────────────────────────────────────────────────

function injectCSS(){
  if(document.getElementById("mga-css")) return;
  const st=document.createElement("style"); st.id="mga-css";
  st.textContent=`
#mga-root{padding:0 0 24px}

/* ── Divider ── */
.mga-div{display:flex;align-items:center;gap:10px;margin:22px 0 14px}
.mga-div-icon{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mga-div-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.35)}
.mga-div-line{flex:1;height:1px;background:linear-gradient(to right,rgba(255,255,255,.1),transparent)}

/* ── KPIs ── */
.mga-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px}
.mga-kpi{border-radius:16px;padding:14px 12px;border:1px solid;text-align:center;position:relative;overflow:hidden}
.mga-kpi-val{font-size:24px;font-weight:800;letter-spacing:-.04em;font-family:'Space Mono',monospace;line-height:1;display:block}
.mga-kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;margin-top:5px;display:block;opacity:.55}
.mga-kpi-sub{font-size:9px;margin-top:4px;opacity:.4;display:block}

/* ── Heatmap ── */
.mga-hm-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.mga-hm-title{font-size:13px;font-weight:700;color:#f0f4ff}
.mga-hm-legend{display:flex;align-items:center;gap:3px;font-size:9px;color:rgba(255,255,255,.25);font-family:'Space Mono',monospace}
.mga-lb{width:10px;height:10px;border-radius:2px}
.mga-tip{margin-top:9px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:7px 12px;font-size:10px;color:rgba(255,255,255,.3);font-family:'Space Mono',monospace;min-height:30px;transition:color .15s}

/* ── Barras mensuales ── */
.mga-bars-title{font-size:10px;font-weight:700;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:.09em;margin:14px 0 8px}
.mga-bars-row{display:flex;gap:4px;align-items:flex-end;height:56px}
.mga-bc{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;height:100%}
.mga-bar{width:100%;border-radius:4px 4px 0 0;min-height:3px;transition:opacity .15s;cursor:default}
.mga-bar:hover{opacity:.65}
.mga-bl{font-size:8px;color:rgba(255,255,255,.22);font-family:'Space Mono',monospace}

/* ── Tiempo por serie ── */
.mga-time-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mga-tc{border-radius:14px;border:1px solid rgba(255,255,255,.08);padding:13px 14px;display:flex;align-items:center;gap:12px;transition:border-color .18s,background .18s;cursor:default;background:rgba(255,255,255,.02)}
.mga-tc:hover{border-color:rgba(255,255,255,.18)!important;background:rgba(255,255,255,.04)!important}
.mga-tc-init{width:42px;height:56px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;font-family:'Space Mono',monospace}
.mga-tc-title{font-size:12px;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.mga-tc-type{font-size:9px;text-transform:uppercase;letter-spacing:.08em;opacity:.65;margin-bottom:7px}
.mga-tc-pb{height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-bottom:8px}
.mga-tc-pf{height:100%;border-radius:2px}
.mga-tc-big{font-size:22px;font-weight:800;font-family:'Space Mono',monospace;letter-spacing:-.04em;line-height:1}
.mga-tc-sub{font-size:9px;color:rgba(255,255,255,.3);margin-top:3px}

/* ── Logros ── */
.mga-logro{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:13px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);margin-bottom:7px;transition:background .15s,border-color .15s;cursor:default}
.mga-logro:hover{background:rgba(255,255,255,.045)!important;border-color:rgba(255,255,255,.12)!important}
.mga-logro.locked{opacity:.4}
.mga-logro-icon{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.mga-logro-title{font-size:12px;font-weight:700;color:#e2e8f0}
.mga-logro-sub{font-size:10px;color:rgba(255,255,255,.3);margin-top:2px}
`;
  document.head.appendChild(st);
}

// ── 5. SECTION DIVIDER ───────────────────────────────────────────────────────

function sectionDiv(label, iconSvg, iconBg){
  const d=document.createElement("div"); d.className="mga-div";
  d.innerHTML=`<div class="mga-div-icon" style="background:${iconBg}">${iconSvg}</div><span class="mga-div-label">${label}</span><div class="mga-div-line"></div>`;
  return d;
}

// ── 6. RENDER ────────────────────────────────────────────────────────────────

function renderActivitySection(){
  const root=document.getElementById("mga-root");
  if(!root||typeof data==="undefined") return;
  root.innerHTML="";

  const actMap=buildMap();
  const wk=weekTotal(actMap), mo=monthTotal(actMap), str=streak(actMap);
  const maxV=Math.max(...Object.values(actMap),1);
  const YEAR=new Date().getFullYear(), today=new Date(), sy=new Date(YEAR,0,1);
  const totalDays=Math.floor((today-sy)/86400000)+1;
  const mCaps=(data.manga||[]).reduce((s,x)=>s+x.completed.length,0);
  const aCaps=(data.anime||[]).reduce((s,x)=>s+x.completed.length,0);
  const total=mCaps+aCaps;
  const hours=Math.round((mCaps*8+aCaps*23)/60);
  const mn=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Accent colors from theme
  const acM=(typeof theme!=="undefined"&&theme.accentManga)||"#818cf8";
  const acA=(typeof theme!=="undefined"&&theme.accentAnime)||"#22c55e";

  // ── KPIs ──────────────────────────────────────────────────────────────────
  root.appendChild(sectionDiv("Mi actividad",
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
    "rgba(99,102,241,.18)"));

  const pipW=Math.max(8,Math.floor(160/Math.max(str,1)));
  const pipHtml=Array.from({length:Math.min(str,14)},(_,i)=>
    `<div style="height:4px;width:${pipW}px;border-radius:2px;background:${i<str?acM:"rgba(255,255,255,.1)"}"></div>`
  ).join("");

  const kpiGrid=document.createElement("div"); kpiGrid.className="mga-kpi-grid";
  [
    {val:str>0?str:"0", unit:" d", sub:"racha actual", bg:ha(acM,.12), border:ha(acM,.28), color:acM, extra:`<div style="display:flex;gap:3px;margin-top:8px;flex-wrap:wrap;justify-content:center">${pipHtml}</div>`},
    {val:hours, unit:" h", sub:`${total} caps totales`, bg:"rgba(6,182,212,.1)", border:"rgba(6,182,212,.28)", color:"#22d3ee"},
    {val:wk, unit:"", sub:"esta semana", bg:"rgba(139,92,246,.1)", border:"rgba(139,92,246,.28)", color:"#c4b5fd"},
    {val:mo, unit:"", sub:mn[today.getMonth()], bg:ha(acA,.1), border:ha(acA,.28), color:acA},
  ].forEach(k=>{
    const c=document.createElement("div"); c.className="mga-kpi";
    c.style.cssText=`background:${k.bg};border-color:${k.border}`;
    c.innerHTML=`<span class="mga-kpi-val" style="color:${k.color}">${k.val}<span style="font-size:13px;opacity:.55">${k.unit}</span></span><span class="mga-kpi-label" style="color:${k.color}">${k.sub}</span>${k.extra||""}`;
    kpiGrid.appendChild(c);
  });
  root.appendChild(kpiGrid);

  // ── HEATMAP ───────────────────────────────────────────────────────────────
  const PAL=[ha(acM,.18),ha(acM,.38),ha(acM,.65),acM];
  const cb=v=>{ if(!v) return null; const r=v/maxV; return r<.2?PAL[0]:r<.45?PAL[1]:r<.75?PAL[2]:PAL[3]; };

  const hmHeader=document.createElement("div"); hmHeader.className="mga-hm-header";
  hmHeader.innerHTML=`<span class="mga-hm-title">Actividad ${YEAR}</span>
    <div class="mga-hm-legend"><span>–</span>
      <div class="mga-lb" style="background:rgba(255,255,255,.08)"></div>
      ${PAL.map(c=>`<div class="mga-lb" style="background:${c}"></div>`).join("")}
      <span>+</span>
    </div>`;
  root.appendChild(hmHeader);

  // Grid container
  const hmWrap=document.createElement("div"); hmWrap.style.cssText="width:100%;overflow:hidden";
  const WEEKS=53, startDow=(sy.getDay()+6)%7;

  // Month row
  const mrow=document.createElement("div"); mrow.style.cssText="display:flex;margin-bottom:4px;font-size:9px;color:rgba(255,255,255,.22);font-family:'Space Mono',monospace";
  const spc=document.createElement("div"); spc.style.cssText="flex-shrink:0;width:18px;margin-right:3px"; mrow.appendChild(spc);
  let lastM=-1;
  for(let w=0;w<WEEKS;w++){ const di=w*7-startDow,d=new Date(YEAR,0,1+di),m=d.getMonth(); const sp=document.createElement("div"); sp.style.cssText="flex:1;min-width:0;overflow:hidden;text-align:left"; sp.textContent=(m!==lastM&&di>=0&&di<totalDays)?mn[m].slice(0,1):""; lastM=m; mrow.appendChild(sp); }
  hmWrap.appendChild(mrow);

  // Grid
  const grid=document.createElement("div"); grid.style.cssText="display:flex;gap:3px;width:100%";
  const dayCol=document.createElement("div"); dayCol.style.cssText="display:flex;flex-direction:column;gap:2px;flex-shrink:0;width:16px";
  ["L","","X","","V","","D"].forEach(n=>{ const l=document.createElement("div"); l.style.cssText="font-size:8px;color:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:flex-end;padding-right:2px;font-family:'Space Mono',monospace;height:11px;flex-shrink:0"; l.textContent=n; dayCol.appendChild(l); });
  grid.appendChild(dayCol);

  const tip=document.createElement("div"); tip.className="mga-tip"; tip.textContent="› pasa el cursor sobre un día";

  for(let w=0;w<WEEKS;w++){
    const col=document.createElement("div"); col.style.cssText="display:flex;flex-direction:column;flex:1;min-width:0;gap:2px";
    for(let dow=0;dow<7;dow++){
      const di=w*7+dow-startDow,date=new Date(YEAR,0,1+di),cell=document.createElement("div");
      const valid=date.getFullYear()===YEAR&&di>=0&&di<totalDays,v=valid?(actMap[date.toISOString().slice(0,10)]||0):0;
      cell.style.cssText=`width:100%;height:11px;border-radius:2px;background:${valid?(cb(v)||"rgba(255,255,255,.07)"):"transparent"};transition:transform .1s;cursor:default`;
      if(valid){
        const ds=date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
        cell.addEventListener("mouseenter",()=>{ cell.style.transform="scale(1.45)"; tip.textContent=v>0?`${ds}  ›  ${v} cap${v>1?"s":""}/ep${v>1?"s":""}`:`${ds}  ›  sin actividad`; tip.style.color=v>0?acM:"rgba(255,255,255,.25)"; });
        cell.addEventListener("mouseleave",()=>{ cell.style.transform="scale(1)"; tip.textContent="› pasa el cursor sobre un día"; tip.style.color="rgba(255,255,255,.3)"; });
      }
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
  hmWrap.appendChild(grid);
  root.appendChild(hmWrap);
  root.appendChild(tip);

  // Barras mensuales
  const mT=Array(12).fill(0); Object.entries(actMap).forEach(([k,v])=>{ if(k.startsWith(String(YEAR))) mT[parseInt(k.slice(5,7))-1]+=v; });
  const maxM=Math.max(...mT,1);
  const sM=["E","F","M","A","M","J","J","A","S","O","N","D"];
  const bTitle=document.createElement("div"); bTitle.className="mga-bars-title"; bTitle.textContent="Por mes";
  root.appendChild(bTitle);
  const bRow=document.createElement("div"); bRow.className="mga-bars-row";
  const bLblRow=document.createElement("div"); bLblRow.style.cssText="display:flex;gap:4px;margin-top:4px";
  mT.forEach((v,i)=>{
    const col=document.createElement("div"); col.className="mga-bc";
    const pct=v>0?Math.max(Math.round((v/maxM)*100),7):4;
    // Gradient color across months: accent manga → accent anime
    const ratio=i/11;
    const bar=document.createElement("div"); bar.className="mga-bar";
    bar.style.cssText=`height:${pct}%;background:${v>0?`linear-gradient(to top,${ha(acM,1)},${ha(acA,.8)})`:"rgba(255,255,255,.08)"}`;
    if(v>0) bar.title=`${mn[i]}: ${v} caps`;
    col.appendChild(bar); bRow.appendChild(col);
    const lbl=document.createElement("div"); lbl.className="mga-bl"; lbl.textContent=sM[i]; bLblRow.appendChild(lbl);
  });
  root.appendChild(bRow); root.appendChild(bLblRow);

  // ── TIEMPO ────────────────────────────────────────────────────────────────
  root.appendChild(sectionDiv("Tiempo siguiendo",
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    "rgba(6,182,212,.18)"));

  const SC=["#f97316","#8b5cf6","#e24b4a","#06b6d4","#22c55e","#ef4444","#fbbf24","#ec4899","#14b8a6","#6366f1"];
  const active=[
    ...(data.manga||[]).filter(s=>s.status==="reading").map(s=>({...s,_t:"Manga"})),
    ...(data.anime||[]).filter(s=>s.status==="reading").map(s=>({...s,_t:"Anime"}))
  ].sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,6);

  const tGrid=document.createElement("div"); tGrid.className="mga-time-grid";
  if(active.length===0){
    tGrid.style.gridTemplateColumns="1fr";
    tGrid.innerHTML=`<div style="font-size:12px;color:rgba(255,255,255,.3);text-align:center;padding:20px">Sin series activas</div>`;
  } else {
    active.forEach((s,i)=>{
      const a=age(s), pct=s.total>0?Math.round((s.completed.length/s.total)*100):0;
      const c=SC[i%SC.length], init=(s.title||"?").slice(0,2).toUpperCase();
      const card=document.createElement("div"); card.className="mga-tc";
      card.style.borderColor=ha(c,.2);
      card.innerHTML=`
        <div class="mga-tc-init" style="background:${ha(c,.15)};color:${c};border:1px solid ${ha(c,.25)}">${init}</div>
        <div style="flex:1;min-width:0">
          <div class="mga-tc-title">${s.title}</div>
          <div class="mga-tc-type" style="color:${c}">${s._t}</div>
          <div class="mga-tc-pb"><div class="mga-tc-pf" style="width:${pct}%;background:linear-gradient(to right,${c},${ha(c,.7)})"></div></div>
          <div class="mga-tc-big" style="color:${c}">${a.label}</div>
          <div class="mga-tc-sub">${a.days}d · ${a.weeks}sem · ${a.months}m</div>
        </div>`;
      tGrid.appendChild(card);
    });
  }
  root.appendChild(tGrid);

  // ── LOGROS ────────────────────────────────────────────────────────────────
  root.appendChild(sectionDiv("Logros",
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    "rgba(245,158,11,.18)"));

  const SV={
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    tv:'<rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
    check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    stack:'<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    heart:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  };
  const allS=[...(data.manga||[]),...(data.anime||[])];
  const compCount=allS.filter(s=>s.status==="completed").length;
  const scoreCount=allS.filter(s=>s.score>0).length;

  [
    {label:"Primera racha",   sub:`${str} día${str!==1?"s":""} seguidos`,    unlocked:str>=1,              bg:"rgba(249,115,22,.18)",  border:"rgba(249,115,22,.3)",  c:"#fb923c", svg:SV.flame},
    {label:"Racha de fuego",  sub:"7 días consecutivos",                      unlocked:str>=7,              bg:"rgba(239,68,68,.18)",   border:"rgba(239,68,68,.3)",   c:"#f87171", svg:SV.flame},
    {label:"Racha legendaria",sub:"30 días seguidos",                         unlocked:str>=30,             bg:"rgba(245,158,11,.18)",  border:"rgba(245,158,11,.3)",  c:"#fbbf24", svg:SV.flame},
    {label:"Lector constante",sub:`${total} caps/eps totales`,                unlocked:total>=100,          bg:ha(acM,.18),             border:ha(acM,.32),            c:acM,       svg:SV.book},
    {label:"Devorador",       sub:"500+ caps de manga",                       unlocked:mCaps>=500,          bg:"rgba(139,92,246,.18)",  border:"rgba(139,92,246,.3)",  c:"#a5b4fc", svg:SV.book},
    {label:"Maratonista",     sub:"100+ eps de anime",                        unlocked:aCaps>=100,          bg:"rgba(6,182,212,.18)",   border:"rgba(6,182,212,.3)",   c:"#22d3ee", svg:SV.tv},
    {label:"100 horas",       sub:`${hours}h acumuladas`,                     unlocked:hours>=100,          bg:"rgba(139,92,246,.18)",  border:"rgba(139,92,246,.3)",  c:"#c4b5fd", svg:SV.clock},
    {label:"Coleccionista",   sub:`${allS.length} series en lista`,           unlocked:allS.length>=10,     bg:ha(acA,.15),             border:ha(acA,.28),            c:acA,       svg:SV.stack},
    {label:"Completionista",  sub:`${compCount} series completadas`,          unlocked:compCount>=5,        bg:"rgba(245,158,11,.16)",  border:"rgba(245,158,11,.28)", c:"#fcd34d", svg:SV.check},
    {label:"Otaku",           sub:"Manga + anime activos",                    unlocked:(data.manga||[]).length>0&&(data.anime||[]).length>0, bg:"rgba(236,72,153,.16)",border:"rgba(236,72,153,.28)",c:"#f472b6",svg:SV.heart},
    {label:"Crítico exigente",sub:"10+ series puntuadas",                     unlocked:scoreCount>=10,      bg:"rgba(245,158,11,.15)",  border:"rgba(245,158,11,.26)", c:"#fde68a", svg:SV.star},
  ].forEach(l=>{
    const row=document.createElement("div");
    row.className=`mga-logro${l.unlocked?"":" locked"}`;
    if(l.unlocked) row.style.cssText=`background:${l.bg};border-color:${l.border}`;
    row.innerHTML=`
      <div class="mga-logro-icon" style="background:${l.unlocked?l.bg:"rgba(255,255,255,.06)"}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${l.unlocked?l.c:"rgba(255,255,255,.25)"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${l.svg}</svg>
      </div>
      <div style="flex:1;min-width:0">
        <div class="mga-logro-title" style="${l.unlocked?`color:${l.c}`:"color:rgba(255,255,255,.35)"}">${l.label}</div>
        <div class="mga-logro-sub">${l.sub}</div>
      </div>
      ${l.unlocked
        ?`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${l.c}" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        :`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`}`;
    root.appendChild(row);
  });
}

// ── 7. MOUNT ─────────────────────────────────────────────────────────────────

function tryMount(){
  const wrap=document.querySelector(".pubprof-wrap");
  if(!wrap) return false;
  let root=document.getElementById("mga-root");
  if(root&&root.parentNode===wrap) return true;
  if(root) root.remove();
  root=document.createElement("div"); root.id="mga-root";
  wrap.appendChild(root);
  injectCSS();
  renderActivitySection();
  return true;
}

let _t=null;
function startPoll(){
  if(_t) return;
  _t=setInterval(()=>{
    if(tryMount()){
      clearInterval(_t);
      _t=setInterval(()=>{
        const wrap=document.querySelector(".pubprof-wrap");
        const root=document.getElementById("mga-root");
        if(wrap&&(!root||root.parentNode!==wrap)){
          if(root) root.remove();
          const r=document.createElement("div"); r.id="mga-root";
          wrap.appendChild(r); injectCSS(); renderActivitySection();
        }
      },1500);
    }
  },200);
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",startPoll);
else startPoll();

})();
