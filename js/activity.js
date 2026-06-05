// ── MANGU ACTIVITY MODULE — Parche 3.2 ──────────────────────────────────────
// Heatmap anual + tiempo por serie + logros en el perfil propio
// Estrategia: monkey-patch de renderFriendsPanel para inyección garantizada
// Orden en index.html: firebase.js → community.js → tracker.js → ui.js → activity.js
// ────────────────────────────────────────────────────────────────────────────

(function(){

// ── 1. LOGGING DE ACTIVIDAD ──────────────────────────────────────────────────

window.logManguActivity = function(series, countDelta){
  if(!series || countDelta <= 0) return;
  const d = new Date().toISOString().slice(0,10);
  if(!series.activityLog) series.activityLog = [];
  const ex = series.activityLog.find(e => e.date === d);
  if(ex){ ex.count += countDelta; }
  else { series.activityLog.push({date:d, count:countDelta}); }
};

// ── 2. AGREGAR activityLog A migrate() ────────────────────────────────────────
// Parchear migrate para que las series existentes reciban el campo

const _origMigrate = window.migrate;
if(typeof _origMigrate === "function"){
  window.migrate = function(s){
    const r = _origMigrate(s);
    r.activityLog = s.activityLog || [];
    return r;
  };
}

// ── 3. FUNCIONES DE AGREGACIÓN ───────────────────────────────────────────────

function buildActivityMap(){
  if(typeof data === "undefined") return {};
  const map = {};
  [...(data.manga||[]), ...(data.anime||[])].forEach(s=>{
    (s.activityLog||[]).forEach(e=>{
      map[e.date] = (map[e.date]||0) + e.count;
    });
  });
  return map;
}

function weeklyTotal(m){
  let s=0;
  for(let i=0;i<7;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    s += m[d.toISOString().slice(0,10)]||0;
  }
  return s;
}

function monthlyTotal(m){
  const prefix = new Date().toISOString().slice(0,7);
  return Object.entries(m).filter(([k])=>k.startsWith(prefix)).reduce((s,[,v])=>s+v,0);
}

function currentStreak(m){
  let streak=0;
  const d=new Date();
  while(true){
    const key=d.toISOString().slice(0,10);
    if(!m[key]) break;
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

function seriesAge(s){
  const ref = s.startDate
    ? new Date(s.startDate).getTime()
    : (s.createdAt||parseInt(s.id)||Date.now());
  const days = Math.max(0, Math.floor((Date.now()-ref)/86400000));
  return {
    days,
    weeks: Math.floor(days/7),
    months: (days/30.44).toFixed(1),
    label: days>=60 ? (days/30.44).toFixed(1)+"m" : days>=14 ? Math.floor(days/7)+"sem" : days+"d"
  };
}

function hexA(hex, a){
  hex = hex.replace("#","");
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── 4. CSS ───────────────────────────────────────────────────────────────────

function injectCSS(){
  if(document.getElementById("mg-activity-css")) return;
  const st = document.createElement("style");
  st.id = "mg-activity-css";
  st.textContent = `
#mg-activity-root{margin-top:12px}
.mg-act-tab{flex:1;padding:7px;border:none;background:none;border-radius:9px;font-size:11px;font-weight:600;color:rgba(255,255,255,.3);cursor:pointer;transition:all .18s;font-family:'Outfit',sans-serif}
.mg-act-on{background:rgba(255,255,255,.09)!important;color:#f0f4ff!important}
.mg-act-kpi{border-radius:14px;padding:11px 13px;border:1px solid rgba(255,255,255,.07)}
.mg-act-kl{font-size:9px;text-transform:uppercase;letter-spacing:.09em;margin-bottom:4px}
.mg-act-kv{font-size:20px;font-weight:700;letter-spacing:-.04em;font-family:'Space Mono',monospace;line-height:1}
.mg-act-ku{font-size:10px;font-weight:400;opacity:.45}
.mg-act-ks{font-size:9px;color:rgba(255,255,255,.28);margin-top:3px}
.mg-act-tcard{border-radius:14px;border:1px solid rgba(255,255,255,.07);padding:12px 14px;display:flex;align-items:center;gap:12px;transition:border-color .18s;cursor:default}
.mg-act-tcard:hover{border-color:rgba(255,255,255,.16)!important}
.mg-act-logro{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.018);margin-bottom:7px;transition:background .15s;cursor:default}
.mg-act-logro:hover{background:rgba(255,255,255,.04)!important}
`;
  document.head.appendChild(st);
}

// ── 5. RENDER PRINCIPAL ──────────────────────────────────────────────────────

function renderActivitySection(){
  const el = document.getElementById("mg-activity-root");
  if(!el) return;
  if(typeof data === "undefined"){ el.innerHTML=""; return; }

  const actMap  = buildActivityMap();
  const wk      = weeklyTotal(actMap);
  const mo      = monthlyTotal(actMap);
  const streak  = currentStreak(actMap);
  const maxV    = Math.max(...Object.values(actMap), 1);

  const YEAR    = new Date().getFullYear();
  const sy      = new Date(YEAR, 0, 1);
  const today   = new Date();
  const totalDays = Math.floor((today - sy)/86400000)+1;

  const mangaCaps = (data.manga||[]).reduce((s,x)=>s+x.completed.length,0);
  const animeCaps = (data.anime||[]).reduce((s,x)=>s+x.completed.length,0);
  const totalCaps = mangaCaps + animeCaps;
  const hours     = Math.round((mangaCaps*8 + animeCaps*23)/60);
  const mn = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const PAL = ["rgba(99,102,241,.22)","rgba(99,102,241,.48)","rgba(99,102,241,.78)","#818cf8"];
  const cb  = v => { if(!v) return null; const r=v/maxV; return r<.2?PAL[0]:r<.45?PAL[1]:r<.75?PAL[2]:PAL[3]; };

  const pipHtml = Array.from({length:Math.min(streak,14)},(_,i)=>
    `<div style="height:4px;width:${Math.max(10,Math.floor(180/Math.max(streak,1)))}px;border-radius:2px;background:${i<streak?"#6366f1":"rgba(255,255,255,.08)"}"></div>`
  ).join("");

  el.innerHTML = `
<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
  <div style="width:22px;height:22px;border-radius:6px;background:rgba(99,102,241,.15);display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  </div>
  <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:rgba(255,255,255,.35)">Mi actividad</span>
  <div style="flex:1;height:1px;background:rgba(255,255,255,.06)"></div>
</div>

<div style="display:flex;gap:2px;margin-bottom:14px;background:rgba(255,255,255,.04);border-radius:12px;padding:3px">
  <button onclick="mgActSwitch('hm',this)" class="mg-act-tab mg-act-on">Heatmap</button>
  <button onclick="mgActSwitch('tiempo',this)" class="mg-act-tab">Tiempo</button>
  <button onclick="mgActSwitch('logros',this)" class="mg-act-tab">Logros</button>
</div>

<div id="mg-act-hm">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
    <div class="mg-act-kpi" style="background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.22)">
      <div class="mg-act-kl" style="color:rgba(165,180,252,.55)">Racha</div>
      <div class="mg-act-kv" style="color:#a5b4fc">${streak}<span class="mg-act-ku"> d</span></div>
      <div style="display:flex;gap:3px;margin-top:6px;flex-wrap:wrap">${pipHtml}</div>
    </div>
    <div class="mg-act-kpi" style="background:rgba(6,182,212,.08);border-color:rgba(6,182,212,.2)">
      <div class="mg-act-kl" style="color:rgba(103,232,249,.55)">Total</div>
      <div class="mg-act-kv" style="color:#67e8f9">${hours}<span class="mg-act-ku"> h</span></div>
      <div class="mg-act-ks">${totalCaps} caps</div>
    </div>
    <div class="mg-act-kpi" style="background:rgba(139,92,246,.09);border-color:rgba(139,92,246,.2)">
      <div class="mg-act-kl" style="color:rgba(196,181,253,.55)">Semana</div>
      <div class="mg-act-kv" style="color:#c4b5fd">${wk}<span class="mg-act-ku"></span></div>
      <div class="mg-act-ks">caps/eps</div>
    </div>
    <div class="mg-act-kpi" style="background:rgba(34,197,94,.07);border-color:rgba(34,197,94,.18)">
      <div class="mg-act-kl" style="color:rgba(134,239,172,.55)">Mes</div>
      <div class="mg-act-kv" style="color:#86efac">${mo}<span class="mg-act-ku"></span></div>
      <div class="mg-act-ks">${mn[today.getMonth()]}</div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px">
    <span style="font-size:12px;font-weight:700;color:#f0f4ff">Actividad ${YEAR}</span>
    <div style="display:flex;align-items:center;gap:3px;font-size:9px;color:rgba(255,255,255,.22);font-family:'Space Mono',monospace">
      <span>–</span>
      <div style="width:9px;height:9px;border-radius:2px;background:rgba(255,255,255,.08)"></div>
      ${PAL.map(c=>`<div style="width:9px;height:9px;border-radius:2px;background:${c}"></div>`).join("")}
      <span>+</span>
    </div>
  </div>

  <div id="mg-hm-container" style="width:100%;overflow:hidden"></div>
  <div id="mg-hm-tip" style="margin-top:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:9px;padding:6px 11px;font-size:10px;color:rgba(255,255,255,.25);font-family:'Space Mono',monospace;min-height:28px">
    › pasa el cursor sobre un día
  </div>

  <div style="margin-top:14px">
    <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,.25);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">Por mes</div>
    <div id="mg-mbar-row" style="display:flex;gap:4px;align-items:flex-end;height:52px"></div>
    <div id="mg-mbar-labels" style="display:flex;gap:4px;margin-top:4px"></div>
  </div>
</div>

<div id="mg-act-tiempo" style="display:none">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="mg-time-grid"></div>
</div>

<div id="mg-act-logros" style="display:none">
  <div id="mg-logros-list"></div>
</div>`;

  // ── HEATMAP ───────────────────────────────────────────────────────────────
  const hmCont = document.getElementById("mg-hm-container");
  const tip    = document.getElementById("mg-hm-tip");
  const WEEKS  = 53;
  const startDow = (sy.getDay()+6)%7;

  // fila de meses
  const mrow = document.createElement("div");
  mrow.style.cssText = "display:flex;margin-bottom:3px;font-size:9px;color:rgba(255,255,255,.22);font-family:'Space Mono',monospace";
  const spc = document.createElement("div");
  spc.style.cssText = "flex-shrink:0;width:18px;margin-right:3px";
  mrow.appendChild(spc);
  let lastM=-1;
  for(let w=0;w<WEEKS;w++){
    const di=w*7-startDow;
    const d=new Date(YEAR,0,1+di);
    const m=d.getMonth();
    const sp=document.createElement("div");
    sp.style.cssText="flex:1;min-width:0;overflow:hidden;text-align:left";
    sp.textContent=(m!==lastM&&di>=0&&di<totalDays)?mn[m].slice(0,1):"";
    lastM=m; mrow.appendChild(sp);
  }
  hmCont.appendChild(mrow);

  // grilla
  const inner=document.createElement("div");
  inner.style.cssText="display:flex;gap:3px;width:100%";

  const dayCol=document.createElement("div");
  dayCol.style.cssText="display:flex;flex-direction:column;gap:2px;flex-shrink:0;width:16px";
  ["L","","X","","V","","D"].forEach(n=>{
    const l=document.createElement("div");
    l.style.cssText="font-size:8px;color:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:flex-end;padding-right:2px;font-family:'Space Mono',monospace;height:11px;flex-shrink:0";
    l.textContent=n; dayCol.appendChild(l);
  });
  inner.appendChild(dayCol);

  for(let w=0;w<WEEKS;w++){
    const col=document.createElement("div");
    col.style.cssText="display:flex;flex-direction:column;flex:1;min-width:0;gap:2px";
    for(let dow=0;dow<7;dow++){
      const di=w*7+dow-startDow;
      const date=new Date(YEAR,0,1+di);
      const cell=document.createElement("div");
      const valid=date.getFullYear()===YEAR&&di>=0&&di<totalDays;
      const v=valid?(actMap[date.toISOString().slice(0,10)]||0):0;
      const bg=valid?(cb(v)||"rgba(255,255,255,.06)"):"transparent";
      cell.style.cssText=`width:100%;height:11px;border-radius:2px;background:${bg};transition:transform .1s;cursor:default`;
      if(valid){
        const ds=date.toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
        cell.addEventListener("mouseenter",()=>{
          cell.style.transform="scale(1.4)";
          tip.textContent=v>0?`${ds}  ›  ${v} cap${v>1?"s":""}/ep${v>1?"s":""}`:`${ds}  ›  sin actividad`;
          tip.style.color=v>0?"#818cf8":"rgba(255,255,255,.2)";
        });
        cell.addEventListener("mouseleave",()=>{
          cell.style.transform="scale(1)";
          tip.textContent="› pasa el cursor sobre un día";
          tip.style.color="rgba(255,255,255,.25)";
        });
      }
      col.appendChild(cell);
    }
    inner.appendChild(col);
  }
  hmCont.appendChild(inner);

  // barras mensuales
  const monthTotals=Array(12).fill(0);
  Object.entries(actMap).forEach(([k,v])=>{ if(k.startsWith(String(YEAR))){ monthTotals[parseInt(k.slice(5,7))-1]+=v; } });
  const maxM=Math.max(...monthTotals,1);
  const shortM=["E","F","M","A","M","J","J","A","S","O","N","D"];
  const BCOLS=["#6366f1","#818cf8","#4f46e5","#6366f1","#7c3aed","#818cf8","#6366f1","#4f46e5","#818cf8","#6366f1","#7c3aed","#4f46e5"];
  const mbRow=document.getElementById("mg-mbar-row");
  const mbLbls=document.getElementById("mg-mbar-labels");
  monthTotals.forEach((v,i)=>{
    const col=document.createElement("div");
    col.style.cssText="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;height:100%";
    const bar=document.createElement("div");
    bar.style.cssText=`width:100%;border-radius:4px 4px 0 0;min-height:3px;cursor:default;transition:opacity .15s;height:${v>0?Math.max(Math.round((v/maxM)*100),7):4}%;background:${v>0?BCOLS[i]:"rgba(255,255,255,.07)"}`;
    bar.addEventListener("mouseenter",()=>bar.style.opacity=".65");
    bar.addEventListener("mouseleave",()=>bar.style.opacity="1");
    col.appendChild(bar); mbRow.appendChild(col);
    const lbl=document.createElement("div");
    lbl.style.cssText="flex:1;font-size:8px;color:rgba(255,255,255,.2);font-family:'Space Mono',monospace;text-align:center";
    lbl.textContent=shortM[i]; mbLbls.appendChild(lbl);
  });

  // ── TIEMPO POR SERIE ──────────────────────────────────────────────────────
  const tGrid=document.getElementById("mg-time-grid");
  const SCOLORS=["#f97316","#8b5cf6","#e24b4a","#06b6d4","#22c55e","#ef4444","#fbbf24","#ec4899","#14b8a6","#6366f1"];
  const activeAll=[
    ...(data.manga||[]).filter(s=>s.status==="reading").map(s=>({...s,_type:"Manga"})),
    ...(data.anime||[]).filter(s=>s.status==="reading").map(s=>({...s,_type:"Anime"})),
  ].sort((a,b)=>(b.lastUpdated||0)-(a.lastUpdated||0)).slice(0,6);

  if(activeAll.length===0){
    tGrid.innerHTML=`<div style="grid-column:1/-1;font-size:12px;color:rgba(255,255,255,.28);text-align:center;padding:20px">Sin series activas</div>`;
  } else {
    activeAll.forEach((s,idx)=>{
      const age=seriesAge(s);
      const pct=s.total>0?Math.round((s.completed.length/s.total)*100):0;
      const color=SCOLORS[idx%SCOLORS.length];
      const init=(s.title||"?").slice(0,2).toUpperCase();
      const card=document.createElement("div");
      card.className="mg-act-tcard";
      card.style.cssText=`background:${hexA(color,.05)}`;
      card.innerHTML=`
        <div style="width:40px;height:54px;border-radius:9px;background:${hexA(color,.13)};color:${color};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0;font-family:'Space Mono',monospace;border:1px solid ${hexA(color,.2)}">${init}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${s.title}</div>
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:${color};opacity:.7;margin-bottom:6px">${s._type}</div>
          <div style="height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden;margin-bottom:7px">
            <div style="width:${pct}%;height:100%;border-radius:2px;background:${color}"></div>
          </div>
          <div style="font-size:20px;font-weight:800;font-family:'Space Mono',monospace;line-height:1;letter-spacing:-.03em;color:${color}">${age.label}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.28);margin-top:3px">${age.days}d · ${age.weeks}sem · ${age.months}m</div>
        </div>`;
      tGrid.appendChild(card);
    });
  }

  // ── LOGROS ────────────────────────────────────────────────────────────────
  const lgList=document.getElementById("mg-logros-list");
  const SVG={
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>',
    book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    tv:'<rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
    check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    stack:'<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    heart:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  };
  const scoredCount=[...(data.manga||[]),...(data.anime||[])].filter(s=>s.score>0).length;
  const completedCount=[...(data.manga||[]),...(data.anime||[])].filter(s=>s.status==="completed").length;
  const logros=[
    {label:"Primera racha",       sub:`${streak} día${streak!==1?"s":""} consecutivos`,        unlocked:streak>=1,                               bg:hexA("#f97316",.15), c:"#fb923c", svg:SVG.flame},
    {label:"Racha de fuego",      sub:"7 días seguidos",                                        unlocked:streak>=7,                               bg:hexA("#ef4444",.15), c:"#f87171", svg:SVG.flame},
    {label:"Racha legendaria",    sub:"30 días seguidos",                                       unlocked:streak>=30,                              bg:hexA("#f59e0b",.15), c:"#fbbf24", svg:SVG.flame},
    {label:"Lector constante",    sub:`${totalCaps} caps/eps marcados`,                         unlocked:totalCaps>=100,                          bg:hexA("#6366f1",.15), c:"#818cf8", svg:SVG.book},
    {label:"Devorador de manga",  sub:"500+ caps de manga",                                     unlocked:mangaCaps>=500,                          bg:hexA("#8b5cf6",.15), c:"#a5b4fc", svg:SVG.book},
    {label:"Maratonista",         sub:"100+ eps de anime",                                      unlocked:animeCaps>=100,                          bg:hexA("#06b6d4",.15), c:"#22d3ee", svg:SVG.tv},
    {label:"100 horas",           sub:`${hours}h acumuladas`,                                   unlocked:hours>=100,                              bg:hexA("#8b5cf6",.15), c:"#c4b5fd", svg:SVG.clock},
    {label:"Coleccionista",       sub:`${(data.manga||[]).length+(data.anime||[]).length} series en lista`, unlocked:(data.manga||[]).length+(data.anime||[]).length>=10, bg:hexA("#22c55e",.14), c:"#4ade80", svg:SVG.stack},
    {label:"Completionista",      sub:`${completedCount} series completadas`,                   unlocked:completedCount>=5,                       bg:hexA("#f59e0b",.14), c:"#fcd34d", svg:SVG.check},
    {label:"Otaku certificado",   sub:"Manga + anime activos",                                  unlocked:(data.manga||[]).length>0&&(data.anime||[]).length>0, bg:hexA("#ec4899",.14), c:"#f472b6", svg:SVG.heart},
    {label:"Puntuador exigente",  sub:"10+ series con score",                                   unlocked:scoredCount>=10,                         bg:hexA("#f59e0b",.14), c:"#fde68a", svg:SVG.star},
  ];
  logros.forEach(l=>{
    const row=document.createElement("div");
    row.className="mg-act-logro";
    row.innerHTML=`
      <div style="width:40px;height:40px;border-radius:10px;background:${l.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${l.c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${l.svg}</svg>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:700;color:${l.unlocked?"#e2e8f0":"rgba(255,255,255,.3)"}">${l.label}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.28);margin-top:2px">${l.sub}</div>
      </div>
      ${l.unlocked
        ?`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${l.c}" stroke-width="2.2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        :`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`}`;
    lgList.appendChild(row);
  });
}

// ── 6. TABS ──────────────────────────────────────────────────────────────────

window.mgActSwitch = function(id, btn){
  ["hm","tiempo","logros"].forEach(t=>{
    const el=document.getElementById("mg-act-"+t);
    if(el) el.style.display=t===id?"block":"none";
  });
  document.querySelectorAll(".mg-act-tab").forEach(b=>b.classList.remove("mg-act-on"));
  if(btn) btn.classList.add("mg-act-on");
};

// ── 7. MONTE DEL ROOT ─────────────────────────────────────────────────────────

function mountRoot(){
  // Si ya existe, re-renderizar (actualiza datos)
  if(document.getElementById("mg-activity-root")){
    renderActivitySection();
    return;
  }
  // Buscar my-profile-card en el DOM
  const card=document.querySelector(".my-profile-card");
  if(!card) return;

  const root=document.createElement("div");
  root.id="mg-activity-root";
  // Insertar justo después de my-profile-card
  card.parentNode.insertBefore(root, card.nextSibling);
  injectCSS();
  renderActivitySection();
}

// ── 8. MONKEY-PATCH DE renderFriendsPanel ─────────────────────────────────────
// Esta es la estrategia robusta: esperamos a que renderFriendsPanel esté definida
// (se define en community.js que carga antes) y la envolvemos para que después
// de terminar llame a mountRoot().

function patchRenderFriendsPanel(){
  if(typeof window.renderFriendsPanel !== "function") return false;
  const _orig = window.renderFriendsPanel;
  window.renderFriendsPanel = async function(){
    await _orig.apply(this, arguments);
    // Pequeño delay para que el innerHTML termine de pintarse
    setTimeout(mountRoot, 100);
  };
  return true;
}

// Intentar parchear inmediatamente (community.js ya cargó)
if(!patchRenderFriendsPanel()){
  // Fallback: esperar a que el DOM esté listo
  document.addEventListener("DOMContentLoaded", patchRenderFriendsPanel);
}

})();
