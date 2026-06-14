// ═══════════════════════════════════════════════════════════════════
// MANGU — Parche v3.8 (CORREGIDO)
// Fixes vs versión anterior:
//   - Dashboard: selector .dash-wrap → .dash (clase real en ui.js)
//   - scard expandida: selector .cp → .cpnl (clase real en ui.js)
//   - Chip desafío activo: .daily-goal-bar → .mgsr-bot (contenedor racha+meta)
//   - Discover tab: selector .reco-wrap → discRoot es div sin clase, 
//       se inyecta via hook sobre p28RenderRecoSection
//   - Panel amigos: .com-panel → #friends-panel-container (id real)
//   - window._p38PublicMode: bandera anti race-condition para perfil público
//   - Hook duplicado en renderFriendsPanel: eliminado _origRFP sin usar
// ═══════════════════════════════════════════════════════════════════

(function(){
'use strict';

// ── Estilos del parche ──────────────────────────────────────────────
if(!document.getElementById('mng-p38-style')){
  const s=document.createElement('style');
  s.id='mng-p38-style';
  s.textContent=`
/* ── Predictor ── */
.p38-pred{display:flex;align-items:center;gap:6px;padding:7px 10px;background:rgba(0,229,160,.05);border:1px solid rgba(0,229,160,.12);border-radius:8px;margin-top:8px}
.p38-pred.anime{background:rgba(192,132,252,.05);border-color:rgba(192,132,252,.12)}
.p38-pred-ico{font-size:13px;flex-shrink:0}
.p38-pred-txt{font-size:11px;color:#a8c0d0;flex:1;line-height:1.4}
.p38-pred-date{font-size:11px;font-weight:700;color:#00e5a0;flex-shrink:0}
.p38-pred.anime .p38-pred-date{color:#c084fc}
.p38-pred-na{font-size:11px;color:#2d4460;font-style:italic}

/* ── Dashboard finalizaciones ── */
.p38-dash-section{background:#080c14;border:1px solid #141e30;border-radius:14px;padding:14px 16px;margin-bottom:14px}
.p38-dash-title{font-size:10px;font-weight:700;letter-spacing:.1em;color:#1a2a3a;text-transform:uppercase;margin-bottom:12px}
.p38-dash-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #0f1826}
.p38-dash-row:last-child{border-bottom:none}
.p38-dash-cover{width:32px;height:44px;border-radius:5px;object-fit:cover;flex-shrink:0;background:#141e30}
.p38-dash-cover-ph{width:32px;height:44px;border-radius:5px;background:#141e30;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.p38-dash-info{flex:1;min-width:0}
.p38-dash-name{font-size:12px;font-weight:600;color:#c8dae8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p38-dash-sub{font-size:10px;color:#2d4460;margin-top:2px}
.p38-dash-est{font-size:11px;font-weight:700;color:#00e5a0;flex-shrink:0;text-align:right}
.p38-dash-est.anime{color:#c084fc}
.p38-dash-empty{font-size:12px;color:#1e3045;text-align:center;padding:16px 0}

/* ── Recomendaciones cruzadas ── */
.p38-cross-section{margin-top:18px}
.p38-cross-title{font-size:10px;font-weight:700;letter-spacing:.1em;color:#1a2a3a;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.p38-cross-title::after{content:'';flex:1;height:1px;background:#0f1826}
.p38-cross-grid{display:flex;flex-direction:column;gap:8px}
.p38-cross-card{background:#0a1020;border:1px solid #141e30;border-radius:10px;padding:10px 12px;display:flex;align-items:center;gap:10px}
.p38-cross-cover{width:36px;height:50px;border-radius:6px;object-fit:cover;flex-shrink:0;background:#141e30}
.p38-cross-cover-ph{width:36px;height:50px;border-radius:6px;background:#141e30;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.p38-cross-info{flex:1;min-width:0}
.p38-cross-name{font-size:13px;font-weight:600;color:#c8dae8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p38-cross-meta{font-size:11px;color:#2d4460;margin-top:3px}
.p38-cross-who{font-size:10px;color:#00e5a0;margin-top:3px;font-weight:600}
.p38-cross-who.anime{color:#c084fc}
.p38-cross-add{padding:5px 10px;border-radius:7px;background:rgba(0,229,160,.1);border:1px solid rgba(0,229,160,.2);color:#00e5a0;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;flex-shrink:0;white-space:nowrap}
.p38-cross-add:hover{background:rgba(0,229,160,.18)}
.p38-cross-add.anime{background:rgba(192,132,252,.1);border-color:rgba(192,132,252,.2);color:#c084fc}
.p38-cross-add.anime:hover{background:rgba(192,132,252,.18)}
.p38-cross-loading{font-size:12px;color:#1e3045;text-align:center;padding:20px 0}
.p38-cross-empty{font-size:12px;color:#1e3045;text-align:center;padding:16px 0;font-style:italic}
.p38-cross-nologin{font-size:12px;color:#1e3045;text-align:center;padding:16px 0}

/* ── Desafíos ── */
.p38-ch-section{margin-top:16px}
.p38-ch-title{font-size:10px;font-weight:700;letter-spacing:.1em;color:#1a2a3a;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.p38-ch-title::after{content:'';flex:1;height:1px;background:#0f1826}
.p38-ch-create{background:#080c14;border:1px solid #141e30;border-radius:10px;padding:12px 14px;margin-bottom:10px}
.p38-ch-create-hdr{font-size:12px;font-weight:600;color:#c8dae8;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.p38-ch-form{display:flex;flex-direction:column;gap:8px}
.p38-ch-inp{background:#0d1520;border:1.5px solid #141e30;border-radius:8px;padding:8px 12px;font-size:13px;color:#e8f0f8;outline:none;transition:border-color .17s;font-family:inherit;width:100%;box-sizing:border-box}
.p38-ch-inp::placeholder{color:rgba(232,240,248,.3)}
.p38-ch-inp:focus{border-color:#00e5a0}
.p38-ch-row{display:flex;gap:8px}
.p38-ch-sel{background:#0d1520;border:1.5px solid #141e30;border-radius:8px;padding:8px 12px;font-size:12px;color:#c8dae8;outline:none;flex:1;font-family:inherit}
.p38-ch-btn{padding:8px 14px;border-radius:8px;background:#00e5a0;color:#001a0e;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all .15s;white-space:nowrap}
.p38-ch-btn:hover{filter:brightness(1.1)}
.p38-ch-btn.sec{background:#0d1520;color:#4a6070;border:1px solid #141e30}
.p38-ch-btn.sec:hover{border-color:#00e5a0;color:#00e5a0}
.p38-ch-card{background:#080c14;border:1px solid #141e30;border-radius:10px;padding:12px 14px;margin-bottom:8px}
.p38-ch-card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.p38-ch-card-title{font-size:13px;font-weight:700;color:#c8dae8}
.p38-ch-card-badge{font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:rgba(0,229,160,.1);color:#00e5a0;border:1px solid rgba(0,229,160,.2)}
.p38-ch-card-badge.done{background:rgba(251,191,36,.1);color:#fbbf24;border-color:rgba(251,191,36,.2)}
.p38-ch-card-badge.expired{background:rgba(224,92,92,.1);color:#e05c5c;border-color:rgba(224,92,92,.2)}
.p38-ch-deadline{font-size:10px;color:#2d4460;margin-bottom:8px}
.p38-ch-lb{display:flex;flex-direction:column;gap:6px}
.p38-ch-lb-row{display:flex;align-items:center;gap:8px}
.p38-ch-lb-rank{font-size:11px;font-weight:700;color:#1e3045;width:16px;flex-shrink:0;text-align:center}
.p38-ch-lb-rank.gold{color:#fbbf24}
.p38-ch-lb-name{font-size:12px;font-weight:600;color:#a8c0d0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p38-ch-lb-bar-wrap{width:80px;height:6px;background:#0f1826;border-radius:3px;flex-shrink:0}
.p38-ch-lb-bar{height:100%;border-radius:3px;background:#00e5a0;transition:width .4s}
.p38-ch-lb-val{font-size:11px;font-weight:700;color:#00e5a0;width:36px;text-align:right;flex-shrink:0}
.p38-ch-empty{font-size:12px;color:#1e3045;text-align:center;padding:12px 0;font-style:italic}
.p38-ch-nologin{font-size:12px;color:#1e3045;text-align:center;padding:16px 0}

/* ── Chip desafío activo en pantalla principal ── */
.p38-active-ch{display:flex;align-items:center;gap:8px;padding:8px 14px;background:#080c14;border:1px solid rgba(0,229,160,.15);border-radius:10px;margin:6px 0;cursor:pointer;transition:border-color .15s}
.p38-active-ch:hover{border-color:rgba(0,229,160,.35)}
.p38-active-ch-ico{font-size:14px}
.p38-active-ch-txt{font-size:12px;color:#a8c0d0;flex:1}
.p38-active-ch-txt b{color:#00e5a0}
.p38-active-ch-arr{font-size:12px;color:#1e3045}

/* ── Perfil público URL ── */
.p38-pub-shell{max-width:480px;margin:0 auto;padding:20px 16px}
.p38-pub-back{display:flex;align-items:center;gap:6px;font-size:12px;color:#2d4460;cursor:pointer;margin-bottom:16px;transition:color .15s}
.p38-pub-back:hover{color:#c8dae8}
.p38-pub-loading{text-align:center;padding:60px 0;color:#1e3045;font-size:14px}
.p38-pub-error{text-align:center;padding:60px 0;color:#e05c5c;font-size:14px}
`;
  document.head.appendChild(s);
}

// ═══════════════════════════════════════════
// 1. PREDICTOR DE FINALIZACIÓN
// ═══════════════════════════════════════════

function p38PredictFinish(series){
  if(!series||series.status==='completed')return null;
  const remaining=(series.total||0)-series.completed.length;
  if(remaining<=0)return null;

  const log=series.activityLog||[];
  const cutoff=Date.now()-30*24*3600*1000;
  const recentDays=new Set();
  let recentCaps=0;
  log.forEach(function(e){
    if((e.ts||0)>=cutoff){recentCaps+=(e.delta||1);recentDays.add((e.date||''));}
  });

  if(recentCaps===0){
    const daysSinceUpdate=series.lastUpdated?(Date.now()-series.lastUpdated)/(24*3600*1000):999;
    if(daysSinceUpdate>14)return{type:'inactive'};
    recentCaps=Math.max(1,series.completed.length>0?1:0);
    recentDays.add('est');
  }

  const capsPerDay=recentCaps/30;
  if(capsPerDay<0.01)return{type:'inactive'};

  const daysLeft=Math.ceil(remaining/capsPerDay);
  if(daysLeft>3650)return{type:'inactive'};

  const finishDate=new Date(Date.now()+daysLeft*24*3600*1000);
  const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dateStr=finishDate.getDate()+' '+months[finishDate.getMonth()];

  return{type:'ok',days:daysLeft,date:dateStr,capsPerDay:capsPerDay.toFixed(1)};
}

function p38RenderPredChip(series,isAnime){
  const pred=p38PredictFinish(series);
  const cls=isAnime?'p38-pred anime':'p38-pred';
  if(!pred)return'';
  if(pred.type==='inactive')return`<div class="${cls}"><span class="p38-pred-ico">😴</span><span class="p38-pred-na">Sin actividad reciente — retómalo cuando quieras</span></div>`;
  return`<div class="${cls}"><span class="p38-pred-ico">⏱</span><span class="p38-pred-txt">A tu ritmo (~${pred.capsPerDay} ${isAnime?'eps':'caps'}/día) terminas en <b>${pred.days} días</b></span><span class="p38-pred-date">est. ${pred.date}</span></div>`;
}

// ── Inyectar predictor en tarjetas expandidas
// FIX: panel expandido usa clase "cpnl", NO ".cp"
function p38InjectPredictors(){
  document.querySelectorAll('.scard').forEach(function(card){
    const sid=card.getAttribute('data-id');
    if(!sid)return;
    // FIX: clase correcta del panel expandido es "cpnl"
    const cpnl=card.querySelector('.cpnl');
    if(!cpnl)return; // tarjeta no está expandida
    if(cpnl.querySelector('.p38-pred'))return; // ya inyectado

    const allSeries=[...(data.manga||[]),...(data.anime||[])];
    const series=allSeries.find(function(s){return s.id===sid;});
    if(!series)return;
    if(series.status==='completed'||series.status==='plan')return;

    // Detectar si es anime buscando la serie en data.anime
    const isAnime=(data.anime||[]).some(function(s){return s.id===sid;});
    const chipHtml=p38RenderPredChip(series,isAnime);
    if(!chipHtml)return;

    const tmp=document.createElement('div');
    tmp.innerHTML=chipHtml;
    // Insertar como primer hijo del cpnl (antes de las secciones dsec)
    const firstDsec=cpnl.querySelector('.dsec');
    if(firstDsec)cpnl.insertBefore(tmp.firstChild,firstDsec);
    else cpnl.appendChild(tmp.firstChild);
  });
}

// Hook de render — inyectar predictores con delay
const _origRender=window.render;
window.render=function(){
  _origRender.apply(this,arguments);
  setTimeout(p38InjectPredictors,80);
};

// ── Dashboard predictor
// FIX: clase correcta del dashboard es "dash", NO ".dash-wrap"
function p38RenderDashPredictor(root){
  const allSeries=[...data.manga.map(function(s){return{...s,_t:'M'};}),
                   ...data.anime.map(function(s){return{...s,_t:'A'};})];
  const inProgress=allSeries.filter(function(s){
    return s.status==='reading'&&s.total>0&&s.completed.length<s.total;
  });
  if(!inProgress.length)return;

  const predictions=inProgress.map(function(s){
    const pred=p38PredictFinish(s);
    return{series:s,pred:pred};
  }).filter(function(x){return x.pred&&x.pred.type==='ok';})
    .sort(function(a,b){return a.pred.days-b.pred.days;})
    .slice(0,6);

  if(!predictions.length)return;

  const sec=document.createElement('div');
  sec.className='p38-dash-section';
  sec.id='p38-dash-pred';
  sec.innerHTML='<div class="p38-dash-title">⏱ Finalizaciones estimadas</div>';

  predictions.forEach(function(x){
    const s=x.series;const pred=x.pred;
    const row=document.createElement('div');
    row.className='p38-dash-row';
    const isAnime=s._t==='A';
    row.innerHTML=`
      ${s.cover?`<img class="p38-dash-cover" src="${s.cover}" onerror="this.style.display='none'">`:`<div class="p38-dash-cover-ph">${isAnime?'🎬':'📚'}</div>`}
      <div class="p38-dash-info">
        <div class="p38-dash-name">${s.title}</div>
        <div class="p38-dash-sub">${s.completed.length}/${s.total} ${isAnime?'eps':'caps'} · ~${pred.capsPerDay} ${isAnime?'eps':'caps'}/día</div>
      </div>
      <div class="p38-dash-est${isAnime?' anime':''}">${pred.days<7?pred.days+'d':pred.date}</div>
    `;
    sec.appendChild(row);
  });

  // Insertar al inicio del .dash, antes del primer hijo
  const firstChild=root.firstChild;
  if(firstChild)root.insertBefore(sec,firstChild);
  else root.appendChild(sec);
}

// FIX: Observar cambios en #app y detectar .dash (no .dash-wrap)
const _dashObserver=new MutationObserver(function(){
  // Solo actuar cuando estamos en tab dashboard
  if(typeof tab==='undefined'||tab!=='dashboard')return;
  // FIX: clase real es "dash"
  const dashWrap=document.querySelector('.dash');
  if(!dashWrap)return;
  if(dashWrap.querySelector('#p38-dash-pred'))return; // ya inyectado
  p38RenderDashPredictor(dashWrap);
});
const _appEl=document.getElementById('app')||document.body;
_dashObserver.observe(_appEl,{childList:true,subtree:false});


// ═══════════════════════════════════════════
// 2. RECOMENDACIONES CRUZADAS CON AMIGOS
// ═══════════════════════════════════════════

let _p38CrossCache=null;
let _p38CrossLoading=false;

async function p38LoadCrossReco(){
  if(!fbUser||!fbDb)return[];
  if(_p38CrossCache)return _p38CrossCache;
  if(_p38CrossLoading)return[];
  _p38CrossLoading=true;

  try{
    const fSnap=await withTimeout(fbDb.collection('users').doc(fbUser.uid).collection('friends_accepted').get());
    const friends=fSnap.docs.map(function(d){return{id:d.id,...d.data()};});
    if(!friends.length){_p38CrossLoading=false;return[];}

    const myTitles=new Set([
      ...data.manga.map(function(s){return s.title.toLowerCase().trim();}),
      ...data.anime.map(function(s){return s.title.toLowerCase().trim();})
    ]);

    const crossMap=new Map();

    for(const f of friends){
      try{
        const fp=await withTimeout(fbDb.collection('public_profiles').doc(f.uid).get());
        if(!fp.exists)continue;
        const fpd=fp.data();
        const friendUser=fpd.username||f.username||'?';
        const allFriend=[
          ...(fpd.allManga||fpd.topManga||[]).map(function(s){return{...s,_t:'M'};}),
          ...(fpd.allAnime||fpd.topAnime||[]).map(function(s){return{...s,_t:'A'};})
        ];
        allFriend.forEach(function(s){
          if(!s.title)return;
          const key=s.title.toLowerCase().trim();
          if(myTitles.has(key))return;
          if(s.status==='dropped')return;
          if(!crossMap.has(key)){
            crossMap.set(key,{series:s,friends:[],count:0,type:s._t});
          }
          const entry=crossMap.get(key);
          if(!entry.friends.includes(friendUser)){
            entry.friends.push(friendUser);
            entry.count++;
          }
        });
      }catch(e){}
    }

    const result=[...crossMap.values()]
      .sort(function(a,b){
        if(b.count!==a.count)return b.count-a.count;
        const statusScore=function(s){return s.series.status==='reading'?2:s.series.status==='completed'?1:0;};
        return statusScore(b)-statusScore(a);
      })
      .slice(0,8);

    _p38CrossCache=result;
    _p38CrossLoading=false;
    return result;
  }catch(e){
    _p38CrossLoading=false;
    return[];
  }
}

async function p38RenderCrossReco(container){
  if(!container)return;
  if(container.querySelector('#p38-cross-sec'))return; // ya existe

  const sec=document.createElement('div');
  sec.className='p38-cross-section';
  sec.id='p38-cross-sec';

  const titleDiv=document.createElement('div');
  titleDiv.className='p38-cross-title';
  titleDiv.textContent='Lo que leen tus amigos';
  sec.appendChild(titleDiv);

  if(!fbUser){
    const nl=document.createElement('div');
    nl.className='p38-cross-nologin';
    nl.textContent='Inicia sesión para ver qué leen tus amigos';
    sec.appendChild(nl);
    container.appendChild(sec);
    return;
  }

  const loadingDiv=document.createElement('div');
  loadingDiv.className='p38-cross-loading';
  loadingDiv.textContent='Cargando...';
  sec.appendChild(loadingDiv);
  container.appendChild(sec);

  const results=await p38LoadCrossReco();
  loadingDiv.remove();

  if(!results.length){
    const empty=document.createElement('div');
    empty.className='p38-cross-empty';
    empty.textContent='Tus amigos y tú tienen las mismas series, o aún no tienes amigos conectados';
    sec.appendChild(empty);
    return;
  }

  const grid=document.createElement('div');
  grid.className='p38-cross-grid';

  results.forEach(function(item){
    const s=item.series;
    const isAnime=item.type==='A';
    const card=document.createElement('div');
    card.className='p38-cross-card';
    const whoStr=item.friends.slice(0,2).map(function(u){return'@'+u;}).join(', ')+(item.friends.length>2?' y '+(item.friends.length-2)+' más':'');
    card.innerHTML=`
      ${s.cover&&s.cover.startsWith('http')?`<img class="p38-cross-cover" src="${s.cover}" onerror="this.style.display='none'">`:`<div class="p38-cross-cover-ph">${isAnime?'🎬':'📚'}</div>`}
      <div class="p38-cross-info">
        <div class="p38-cross-name">${s.title}</div>
        <div class="p38-cross-meta">${s.status==='reading'?(isAnime?'Viendo':'Leyendo'):s.status==='completed'?'Completado':s.status} · ${s.completed||0}/${s.total||'?'} ${isAnime?'eps':'caps'}</div>
        <div class="p38-cross-who${isAnime?' anime':''}">${whoStr}</div>
      </div>
      <button class="p38-cross-add${isAnime?' anime':''}" data-title="${s.title.replace(/"/g,'&quot;')}" data-type="${isAnime?'anime':'manga'}">+ Agregar</button>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener('click',function(e){
    const btn=e.target.closest('.p38-cross-add');
    if(!btn)return;
    const title=btn.getAttribute('data-title');
    const type=btn.getAttribute('data-type');
    if(!title)return;
    tab=type;
    newTitle=title;
    render();
    showToast('Busca "'+title+'" en MAL para importar automáticamente');
    setTimeout(function(){
      const addEl=document.querySelector('.mng-add-shell');
      if(addEl)addEl.scrollIntoView({behavior:'smooth',block:'start'});
      const inp=document.getElementById('add-title');
      if(inp){inp.value=title;inp.dispatchEvent(new Event('input'));}
    },300);
  });

  sec.appendChild(grid);
}

// FIX: Hook sobre p28RenderRecoSection para inyectar cross-reco en el tab Descubrir.
// discRoot es el div pasado como argumento a p28RenderRecoSection — sin clase propia.
// No usamos MutationObserver buscando .reco-wrap porque ese selector no existe.
const _origP28Reco=window.p28RenderRecoSection;
window.p28RenderRecoSection=async function(root){
  if(_origP28Reco)await _origP28Reco.apply(this,arguments);
  // root es el discRoot creado en ui.js — inyectar cross-reco al final
  if(root&&!root.querySelector('#p38-cross-sec')){
    p38RenderCrossReco(root);
  }
};


// ═══════════════════════════════════════════
// 3. DESAFÍOS ENTRE AMIGOS
// ═══════════════════════════════════════════

let _p38Challenges=[];
let _p38ChFormOpen=false;

async function p38LoadChallenges(){
  if(!fbUser||!fbDb)return[];
  try{
    const snap=await withTimeout(
      fbDb.collection('challenges')
        .where('participants','array-contains',fbUser.uid)
        .orderBy('createdAt','desc')
        .limit(10)
        .get()
    );
    _p38Challenges=snap.docs.map(function(d){return{id:d.id,...d.data()};});
    return _p38Challenges;
  }catch(e){
    console.warn('p38 challenges:',e.code||e.message);
    return[];
  }
}

async function p38CreateChallenge(seriesTitle,type,targetCaps,deadline,friendUids){
  if(!fbUser||!fbDb)return{ok:false,msg:'No autenticado'};
  if(!seriesTitle.trim())return{ok:false,msg:'Ingresa el título de la serie'};
  if(!friendUids.length)return{ok:false,msg:'Selecciona al menos un amigo'};

  const myList=type==='anime'?data.anime:data.manga;
  const mySeries=myList.find(function(s){return s.title.toLowerCase().includes(seriesTitle.toLowerCase());});
  const myBaseline=mySeries?mySeries.completed.length:0;

  const participants=[fbUser.uid,...friendUids];
  const baselines={};
  baselines[fbUser.uid]=myBaseline;
  friendUids.forEach(function(uid){baselines[uid]=0;});

  try{
    await fbDb.collection('challenges').add({
      seriesTitle:seriesTitle.trim(),
      type:type,
      targetCaps:parseInt(targetCaps)||0,
      deadline:deadline||null,
      createdBy:fbUser.uid,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      participants:participants,
      baselines:baselines,
      status:'active'
    });
    _p38Challenges=null;
    showToast('⚔ Desafío creado');
    return{ok:true};
  }catch(e){
    return{ok:false,msg:e.message};
  }
}

function p38RenderChallengeSection(container,friends,friendProfiles){
  if(!container)return;
  if(container.querySelector('.p38-ch-section'))return; // ya inyectado

  const sec=document.createElement('div');
  sec.className='p38-ch-section';

  const titleDiv=document.createElement('div');
  titleDiv.className='p38-ch-title';
  titleDiv.textContent='⚔ Desafíos';
  sec.appendChild(titleDiv);

  if(!fbUser){
    const nl=document.createElement('div');
    nl.className='p38-ch-nologin';
    nl.textContent='Inicia sesión para crear desafíos';
    sec.appendChild(nl);
    container.appendChild(sec);
    return;
  }

  if(!friends||!friends.length){
    const empty=document.createElement('div');
    empty.className='p38-ch-empty';
    empty.textContent='Agrega amigos para crear desafíos con ellos';
    sec.appendChild(empty);
    container.appendChild(sec);
    return;
  }

  const createBtn=document.createElement('button');
  createBtn.className='p38-ch-btn sec';
  createBtn.textContent='+ Nuevo desafío';
  createBtn.style.cssText='width:100%;margin-bottom:10px';

  const formWrap=document.createElement('div');
  formWrap.id='p38-ch-form-wrap';
  formWrap.style.display=_p38ChFormOpen?'block':'none';

  formWrap.innerHTML=`
    <div class="p38-ch-create">
      <div class="p38-ch-create-hdr">⚔ Crear desafío</div>
      <div class="p38-ch-form">
        <input class="p38-ch-inp" id="p38-ch-series" placeholder="Título de la serie (ej: Berserk)">
        <div class="p38-ch-row">
          <select class="p38-ch-sel" id="p38-ch-type">
            <option value="manga">Manga</option>
            <option value="anime">Anime</option>
          </select>
          <input class="p38-ch-inp" id="p38-ch-caps" placeholder="Meta de caps (0 = completar)" type="number" min="0" style="width:140px">
        </div>
        <input class="p38-ch-inp" id="p38-ch-deadline" type="date" style="color:#e8f0f8">
        <div style="font-size:10px;color:#1e3045;margin:-4px 0 4px">Amigos a invitar:</div>
        <div id="p38-ch-friends-list" style="display:flex;flex-direction:column;gap:6px">
          ${friends.map(function(f){
            const un=f.username||f.uid||f.id||'?';
            return`<label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#a8c0d0;cursor:pointer">
              <input type="checkbox" data-uid="${f.uid||f.id}" style="width:14px;height:14px;accent-color:#00e5a0">
              @${un}
            </label>`;
          }).join('')}
        </div>
        <div class="p38-ch-row" style="margin-top:4px">
          <button class="p38-ch-btn sec" id="p38-ch-cancel">Cancelar</button>
          <button class="p38-ch-btn" id="p38-ch-submit" style="flex:1">Crear desafío</button>
        </div>
      </div>
    </div>
  `;

  createBtn.onclick=function(){
    _p38ChFormOpen=!_p38ChFormOpen;
    formWrap.style.display=_p38ChFormOpen?'block':'none';
    createBtn.textContent=_p38ChFormOpen?'✕ Cancelar':'+ Nuevo desafío';
  };

  formWrap.querySelector('#p38-ch-cancel').onclick=function(){
    _p38ChFormOpen=false;
    formWrap.style.display='none';
    createBtn.textContent='+ Nuevo desafío';
  };

  formWrap.querySelector('#p38-ch-submit').onclick=async function(){
    const title=document.getElementById('p38-ch-series').value;
    const type=document.getElementById('p38-ch-type').value;
    const caps=document.getElementById('p38-ch-caps').value;
    const deadline=document.getElementById('p38-ch-deadline').value;
    const checkedUids=[...formWrap.querySelectorAll('#p38-ch-friends-list input:checked')].map(function(cb){return cb.getAttribute('data-uid');});
    const result=await p38CreateChallenge(title,type,caps,deadline,checkedUids);
    if(result.ok){
      _p38ChFormOpen=false;
      formWrap.style.display='none';
      createBtn.textContent='+ Nuevo desafío';
      _p38Challenges=null;
      p38RenderActiveChallenges(sec,friends);
    }else{
      showToast('⚠ '+result.msg);
    }
  };

  sec.appendChild(createBtn);
  sec.appendChild(formWrap);

  p38RenderActiveChallenges(sec,friends);
  container.appendChild(sec);
}

function p38RenderActiveChallenges(sec,friends){
  sec.querySelectorAll('.p38-ch-card').forEach(function(el){el.remove();});
  const existing=sec.querySelector('.p38-ch-empty-active');
  if(existing)existing.remove();

  p38LoadChallenges().then(function(challenges){
    if(!challenges.length){
      const empty=document.createElement('div');
      empty.className='p38-ch-empty p38-ch-empty-active';
      empty.textContent='No hay desafíos activos — crea uno con tus amigos';
      sec.appendChild(empty);
      return;
    }

    challenges.forEach(function(ch){
      const card=document.createElement('div');
      card.className='p38-ch-card';

      const now=Date.now();
      const deadlineMs=ch.deadline?new Date(ch.deadline).getTime():null;
      const isExpired=deadlineMs&&deadlineMs<now;
      const badgeClass=isExpired?'expired':ch.status==='active'?'':'done';
      const badgeTxt=isExpired?'Expirado':ch.status==='active'?'Activo':'Completado';

      const myList=(ch.type==='anime'?data.anime:data.manga);
      const mySeries=myList.find(function(s){return s.title.toLowerCase().includes((ch.seriesTitle||'').toLowerCase());});
      const myProgress=mySeries?(mySeries.completed.length-(ch.baselines&&ch.baselines[fbUser.uid]?ch.baselines[fbUser.uid]:0)):0;
      const myUsername=friendsState.cachedUsername||'Tú';
      const target=ch.targetCaps>0?ch.targetCaps:(mySeries?mySeries.total:100);

      const lbData=[{uid:fbUser.uid,username:myUsername,progress:Math.max(0,myProgress)}];

      ch.participants.forEach(function(uid){
        if(uid===fbUser.uid)return;
        const f=friends&&friends.find(function(x){return (x.uid||x.id)===uid;});
        const un=f?(f.username||f.uid||f.id):'?';
        lbData.push({uid:uid,username:un,progress:null});
      });

      lbData.sort(function(a,b){
        if(a.progress===null)return 1;
        if(b.progress===null)return-1;
        return b.progress-a.progress;
      });

      const maxProg=Math.max(1,...lbData.map(function(x){return x.progress||0;}),target);

      card.innerHTML=`
        <div class="p38-ch-card-hdr">
          <div class="p38-ch-card-title">⚔ ${ch.seriesTitle}</div>
          <span class="p38-ch-card-badge ${badgeClass}">${badgeTxt}</span>
        </div>
        ${ch.deadline?`<div class="p38-ch-deadline">📅 Límite: ${new Date(ch.deadline).toLocaleDateString('es-CL')} · Meta: ${ch.targetCaps>0?ch.targetCaps+' caps':'Completar la serie'}</div>`:''}
        <div class="p38-ch-lb">
          ${lbData.map(function(p,i){
            const barW=p.progress!==null?Math.min(100,Math.round((p.progress/maxProg)*100)):0;
            return`<div class="p38-ch-lb-row">
              <div class="p38-ch-lb-rank${i===0?' gold':''}">${i===0?'👑':i+1}</div>
              <div class="p38-ch-lb-name">@${p.username}</div>
              <div class="p38-ch-lb-bar-wrap"><div class="p38-ch-lb-bar" style="width:${barW}%"></div></div>
              <div class="p38-ch-lb-val">${p.progress!==null?p.progress:'—'}</div>
            </div>`;
          }).join('')}
        </div>
      `;
      sec.appendChild(card);
    });
  });
}

// FIX: Chip desafío activo — insertar DESPUÉS de .mgsr-bot (racha+meta), no en .daily-goal-bar
function p38RenderActiveChip(){
  if(!fbUser)return;
  const existingChip=document.getElementById('p38-active-ch-chip');
  if(existingChip)existingChip.remove();

  p38LoadChallenges().then(function(challenges){
    const active=challenges.filter(function(ch){return ch.status==='active';});
    if(!active.length)return;
    const ch=active[0];
    const myList=(ch.type==='anime'?data.anime:data.manga);
    const mySeries=myList.find(function(s){return s.title.toLowerCase().includes((ch.seriesTitle||'').toLowerCase());});
    const myProgress=mySeries?(mySeries.completed.length-(ch.baselines&&ch.baselines[fbUser.uid]||0)):0;

    // FIX: el contenedor real es .mgsr-bot (racha + meta diaria)
    const srBot=document.querySelector('.mgsr-bot');
    if(!srBot)return;
    const chip=document.createElement('div');
    chip.className='p38-active-ch';
    chip.id='p38-active-ch-chip';
    chip.innerHTML=`
      <span class="p38-active-ch-ico">⚔</span>
      <span class="p38-active-ch-txt">Desafío activo · <b>${ch.seriesTitle}</b> · ${myProgress} caps avanzados</span>
      <span class="p38-active-ch-arr">›</span>
    `;
    chip.onclick=function(){
      // Abrir panel de comunidad
      const comBtn=document.querySelector('.com-btn');
      if(comBtn)comBtn.click();
    };
    // Insertar DESPUÉS del .mgsr-bot
    srBot.parentNode.insertBefore(chip,srBot.nextSibling||null);
  });
}

// FIX: Hook en renderFriendsPanel.
// El panel de amigos se renderiza en #friends-panel-container (no ".com-panel").
// Leer amigos de friendsState._lastFriendsList inyectado por community.js.
const _origRenderFriends=window.renderFriendsPanel;
window.renderFriendsPanel=async function(){
  if(_origRenderFriends)await _origRenderFriends.apply(this,arguments);

  setTimeout(async function(){
    // FIX: id real del contenedor del panel de amigos
    const fpContainer=document.getElementById('friends-panel-container');
    if(!fpContainer)return;

    // No duplicar secciones
    if(fpContainer.querySelector('.p38-ch-section')&&fpContainer.querySelector('#p38-cross-sec'))return;

    // Obtener lista de amigos desde friendsState._lastFriendsList (si community.js lo expone)
    // o leerlos directamente desde Firestore como fallback
    let friendsList=[];
    if(friendsState&&friendsState._lastFriendsList&&friendsState._lastFriendsList.length){
      friendsList=friendsState._lastFriendsList;
    } else if(fbUser&&fbDb){
      try{
        const fSnap=await withTimeout(fbDb.collection('users').doc(fbUser.uid).collection('friends_accepted').get());
        friendsList=fSnap.docs.map(function(d){
          const dd=d.data();
          return{uid:d.id,username:dd.username||d.id,...dd};
        });
        // Guardar para uso posterior
        if(friendsState)friendsState._lastFriendsList=friendsList;
      }catch(e){}
    }

    if(!fpContainer.querySelector('.p38-ch-section')){
      p38RenderChallengeSection(fpContainer,friendsList,null);
    }
    if(!fpContainer.querySelector('#p38-cross-sec')){
      p38RenderCrossReco(fpContainer);
    }
  },250);
};


// ═══════════════════════════════════════════
// 4. PERFIL PÚBLICO CON URL (?user=username)
// ═══════════════════════════════════════════

// Bandera global anti race-condition: si estamos mostrando un perfil público,
// render() en ui.js/firebase.js no debe sobreescribir la página.
window._p38PublicMode=false;

async function p38HandlePublicProfile(){
  const params=new URLSearchParams(window.location.search);
  const userParam=params.get('user');
  if(!userParam)return false;

  window._p38PublicMode=true;

  const app=document.getElementById('app');
  if(!app)return false;

  app.innerHTML=`<div class="p38-pub-shell"><div class="p38-pub-loading">Cargando perfil @${userParam}...</div></div>`;

  try{
    if(!fbDb){
      await new Promise(function(resolve){
        let attempts=0;
        const check=setInterval(function(){
          attempts++;
          if(fbDb||attempts>50){clearInterval(check);resolve();}
        },100);
      });
    }

    if(!fbDb){
      app.innerHTML=`<div class="p38-pub-shell"><div class="p38-pub-error">Error de conexión. <a href="?" style="color:#00e5a0">Volver a MANGU</a></div></div>`;
      return true;
    }

    const unDoc=await fbDb.collection('usernames').doc(userParam.toLowerCase()).get();
    if(!unDoc.exists){
      app.innerHTML=`<div class="p38-pub-shell"><div class="p38-pub-error">Usuario @${userParam} no encontrado. <a href="?" style="color:#00e5a0">Volver a MANGU</a></div></div>`;
      return true;
    }

    const uid=unDoc.data().uid;
    const profileDoc=await fbDb.collection('public_profiles').doc(uid).get();
    if(!profileDoc.exists){
      app.innerHTML=`<div class="p38-pub-shell"><div class="p38-pub-error">Perfil no disponible. <a href="?" style="color:#00e5a0">Volver a MANGU</a></div></div>`;
      return true;
    }

    const pd=profileDoc.data();
    p38RenderPublicProfilePage(app,pd,userParam);
    return true;

  }catch(e){
    app.innerHTML=`<div class="p38-pub-shell"><div class="p38-pub-error">Error al cargar el perfil. <a href="?" style="color:#00e5a0">Volver a MANGU</a></div></div>`;
    return true;
  }
}

function p38RenderPublicProfilePage(app,pd,username){
  const allSeries=[
    ...(pd.allManga||pd.topManga||[]).map(function(s){return{...s,_t:'M'};}),
    ...(pd.allAnime||pd.topAnime||[]).map(function(s){return{...s,_t:'A'};}),
  ];
  const reading=allSeries.filter(function(s){return s.status==='reading';}).sort(function(a,b){return(b.lastUpdated||0)-(a.lastUpdated||0);});
  const completed=allSeries.filter(function(s){return s.status==='completed';}).sort(function(a,b){return(b.lastUpdated||0)-(a.lastUpdated||0);}).slice(0,8);

  const mangaCount=pd.mangaCount||0;
  const animeCount=pd.animeCount||0;
  const totalCaps=allSeries.reduce(function(s,x){return s+(x.completed||0);},0);

  app.innerHTML=`
    <div class="p38-pub-shell">
      <div class="p38-pub-back" onclick="window.location.href='?'">← Volver a MANGU</div>

      <div style="background:#080c14;border:1px solid #141e30;border-radius:16px;overflow:hidden;margin-bottom:16px">
        <div style="height:80px;background:linear-gradient(135deg,#0a1a10 0%,#0d1520 50%,#100a1a 100%);position:relative">
          <div style="position:absolute;bottom:-28px;left:16px;width:56px;height:56px;border-radius:50%;background:#141e30;border:3px solid #080c14;display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden">
            ${pd.avatarUrl?`<img src="${pd.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none'">`:'👤'}
          </div>
        </div>
        <div style="padding:36px 16px 16px">
          <div style="font-size:18px;font-weight:700;color:#e2e8f0">@${username}</div>
          <div style="font-size:11px;color:#2d4460;margin-top:2px">mangu · @${username}</div>
          <div style="display:flex;gap:16px;margin-top:12px">
            <div style="text-align:center"><div style="font-size:16px;font-weight:700;color:#00e5a0">${mangaCount}</div><div style="font-size:10px;color:#2d4460">manga</div></div>
            <div style="text-align:center"><div style="font-size:16px;font-weight:700;color:#c084fc">${animeCount}</div><div style="font-size:10px;color:#2d4460">anime</div></div>
            <div style="text-align:center"><div style="font-size:16px;font-weight:700;color:#fbbf24">${totalCaps}</div><div style="font-size:10px;color:#2d4460">caps leídos</div></div>
          </div>
        </div>
      </div>

      ${reading.length?`
      <div style="background:#080c14;border:1px solid #141e30;border-radius:14px;padding:14px 16px;margin-bottom:12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1a2a3a;text-transform:uppercase;margin-bottom:12px">En progreso (${reading.length})</div>
        ${reading.slice(0,6).map(function(s){
          const pct=s.total>0?Math.min(100,Math.round((s.completed/s.total)*100)):0;
          const isAnime=s._t==='A';
          return`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #0f1826">
            ${s.cover&&s.cover.startsWith('http')?`<img src="${s.cover}" style="width:32px;height:44px;border-radius:5px;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`:`<div style="width:32px;height:44px;border-radius:5px;background:#141e30;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">${isAnime?'🎬':'📚'}</div>`}
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:600;color:#c8dae8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</div>
              <div style="font-size:10px;color:#2d4460;margin-top:2px">${s.completed}/${s.total||'?'} ${isAnime?'eps':'caps'} · ${pct}%</div>
              <div style="height:3px;background:#0f1826;border-radius:2px;margin-top:4px"><div style="height:100%;border-radius:2px;background:${isAnime?'#c084fc':'#00e5a0'};width:${pct}%"></div></div>
            </div>
          </div>`;
        }).join('')}
      </div>`:''}

      ${completed.length?`
      <div style="background:#080c14;border:1px solid #141e30;border-radius:14px;padding:14px 16px;margin-bottom:12px">
        <div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#1a2a3a;text-transform:uppercase;margin-bottom:12px">Completados recientes</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${completed.map(function(s){
            const isAnime=s._t==='A';
            return`<div style="font-size:11px;padding:4px 10px;border-radius:6px;background:${isAnime?'rgba(192,132,252,.08)':'rgba(0,229,160,.08)'};color:${isAnime?'#c084fc':'#00e5a0'};border:1px solid ${isAnime?'rgba(192,132,252,.15)':'rgba(0,229,160,.15)'}">${s.title}</div>`;
          }).join('')}
        </div>
      </div>`:''}

      <div style="text-align:center;padding:20px 0">
        <a href="?" style="font-size:12px;color:#00e5a0;text-decoration:none;font-weight:600">Abrir MANGU →</a>
      </div>
    </div>
  `;
}


// ═══════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════

(async function(){
  const params=new URLSearchParams(window.location.search);
  if(params.get('user')){
    await new Promise(function(resolve){
      if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',resolve,{once:true});
      }else{resolve();}
    });

    const handled=await p38HandlePublicProfile();
    if(handled){
      // FIX: interceptar render() DESPUÉS de que p38HandlePublicProfile tomó control
      // Esto cubre el race condition donde Firebase ya tenía sesión activa y
      // onAuthStateChanged disparó render() antes de que el parche cargara.
      const _safeRender=function(){
        if(window._p38PublicMode)return; // no sobreescribir perfil público
        if(typeof _origRender==='function')_origRender.apply(this,arguments);
      };
      window.render=_safeRender;
      // Restaurar el wrapper de render que ya pusimos arriba para que también tenga la guardia
      return;
    }
  }

  // Hook de render para chip de desafío activo (solo si NO estamos en modo perfil público)
  const _r=window.render;
  window.render=function(){
    if(window._p38PublicMode)return;
    _r.apply(this,arguments);
    setTimeout(p38RenderActiveChip,150);
  };
})();

// Limpiar cache al hacer sign-in
const _origSignIn=window.signIn;
if(_origSignIn){
  window.signIn=async function(){
    _p38CrossCache=null;
    _p38Challenges=[];
    return _origSignIn.apply(this,arguments);
  };
}

})();
