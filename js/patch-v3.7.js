// ── MANGU patch-v3.7 — Streak & Daily Goal cross-device sync ─────────────────
// Problema resuelto: p28 (racha) y p29 (objetivo diario) usaban solo localStorage
// y nunca se guardaban en Firestore, por lo que PC y celular tenían valores independientes.
//
// Solución:
//   • Parchea p28SaveStreakData y p29SaveGoalData para que escriban en Firestore.
//   • Al hacer login (loadFromCloud) baja los datos de la nube y resuelve conflictos.
//   • El onSnapshot existente en firebase.js ya propaga cambios en tiempo real,
//     así que este parche solo necesita enganchar escritura y la carga inicial.
//
// Fix adicional: reemplaza today() por _todayLocal() en las funciones de racha/objetivo,
// evitando el bug de timezone donde toISOString() devuelve UTC y puede ser un día distinto
// al local (ej. Chile UTC-3/-4: antes de las 21:00/20:00 el "hoy UTC" es ayer local).
//
// Orden de carga en index.html:
//   firebase.js → community.js → tracker.js → ui.js → activity.js
//   → patch-v3.4.js → patch-v3.5.js → patch-v3.6.js → patch-v3.7.js  ← al final
// ─────────────────────────────────────────────────────────────────────────────

(function(){

  // ── 0. HELPER: fecha local sin UTC-offset bug ──────────────────────────────
  // today() en tracker.js usa toISOString() = UTC. En Chile (UTC-3/-4) esto puede
  // devolver la fecha de ayer si son las 21:00 o 20:00. Usamos fecha local siempre.
  function _todayLocal(){
    const d = new Date();
    return d.getFullYear() + "-"
      + String(d.getMonth() + 1).padStart(2, "0") + "-"
      + String(d.getDate()).padStart(2, "0");
  }

  function _yesterdayLocal(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + "-"
      + String(d.getMonth() + 1).padStart(2, "0") + "-"
      + String(d.getDate()).padStart(2, "0");
  }

  // ── 1. GUARD: esperar a que Firebase esté listo ────────────────────────────
  if(typeof fbDb === "undefined" || !fbDb){
    // fbDb puede no estar disponible aún si Firebase falló; salir silenciosamente
    console.warn("[v3.7] fbDb no disponible — sync de racha/objetivo desactivado");
    return;
  }

  // ── 2. PATCH p28SaveStreakData → también escribe en Firestore ─────────────
  const _orig_p28Save = window.p28SaveStreakData;
  if(typeof _orig_p28Save === "function"){
    window.p28SaveStreakData = function(d){
      _orig_p28Save(d); // localStorage primero (instantáneo, no bloquea UI)
      if(fbUser && fbDb){
        fbDb.collection("users").doc(fbUser.uid)
          .set({ streakData: d }, { merge: true })
          .catch(function(e){ console.warn("[v3.7] streak save:", e); });
      }
    };
  }

  // ── 3. PATCH p29SaveGoalData → también escribe en Firestore ───────────────
  const _orig_p29Save = window.p29SaveGoalData;
  if(typeof _orig_p29Save === "function"){
    window.p29SaveGoalData = function(d){
      _orig_p29Save(d); // localStorage primero
      if(fbUser && fbDb){
        fbDb.collection("users").doc(fbUser.uid)
          .set({ goalData: d }, { merge: true })
          .catch(function(e){ console.warn("[v3.7] goal save:", e); });
      }
    };
  }

  // ── 4. PATCH p28TouchStreak → usa fecha local en lugar de today() (UTC) ───
  // today() devuelve UTC; _todayLocal() devuelve fecha del sistema del usuario.
  window.p28TouchStreak = function(){
    const td = _todayLocal();
    const yd = _yesterdayLocal();
    const d  = p28GetStreakData();
    if(d.lastDate === td) return; // ya se tocó hoy
    if(d.lastDate === yd){
      d.count = (d.count || 0) + 1;
    } else {
      d.count = 1; // racha rota o primer día
    }
    d.lastDate = td;
    p28SaveStreakData(d); // llama al p28SaveStreakData ya parcheado arriba
  };

  // ── 5. PATCH p28GetStreak → usa fecha local ────────────────────────────────
  window.p28GetStreak = function(){
    const d  = p28GetStreakData();
    const td = _todayLocal();
    const yd = _yesterdayLocal();
    if(d.lastDate !== td && d.lastDate !== yd){
      // Racha rota: resetear
      if(d.count > 0){ d.count = 0; p28SaveStreakData(d); }
      return 0;
    }
    return d.count || 0;
  };

  // ── 6. PATCH p29BumpGoal → usa fecha local para resetear el contador diario ─
  const _orig_p29Bump = window.p29BumpGoal;
  window.p29BumpGoal = function(){
    const td = _todayLocal();
    const d  = p29GetGoalData();
    // Resetear si es un día nuevo (usando fecha local, no UTC)
    if(d.lastDate !== td){ d.todayCount = 0; d.lastDate = td; }
    const prevCount = d.todayCount || 0;
    d.todayCount = prevCount + 1;
    p29SaveGoalData(d); // llama al p29SaveGoalData ya parcheado

    // Actualizar UI en tiempo real (igual que la función original)
    const goalFill  = document.querySelector(".mggoal-fill");
    const goalCount = document.querySelector(".mggoal-frac");
    const goal      = d.goal || 5;
    if(goalFill){
      const pct = Math.round(Math.min(d.todayCount, goal) / goal * 100);
      goalFill.style.width = pct + "%";
    }
    if(goalCount){
      goalCount.textContent = Math.min(d.todayCount, goal) + " / " + goal + " hoy";
    }
    if(d.todayCount === goal){
      if(typeof p29PlayGoalSound === "function") p29PlayGoalSound();
      if(typeof p29ShowConfetti === "function") p29ShowConfetti(window._p29ac || "#f59e0b", "goal");
    }
    return d; // p28ShowPlusAnim necesita goalData.todayCount
  };

  // ── 7. Eliminar barra META pequeña del header ─────────────────────────────
  // La barra "🎯 META" fina ya no se renderiza — el bloque grande .mggoal la reemplaza.
  window.p29RenderGoalBar = function(root){ /* eliminada intencionalmente */ };

  // ── 8. PULL DESDE FIRESTORE AL HACER LOGIN ─────────────────────────────────
  // Se engancha al onAuthStateChanged de firebase.js, que ya llama loadFromCloud.
  // Aquí extendemos loadFromCloud para que también baje streakData y goalData.
  const _orig_loadFromCloud = window.loadFromCloud;
  window.loadFromCloud = async function(){
    // Primero ejecutar el loadFromCloud original (sync manga/anime)
    await _orig_loadFromCloud();

    // Después bajar datos de racha y objetivo
    if(!fbUser || !fbDb) return;
    try{
      const snap = await fbDb.collection("users").doc(fbUser.uid).get();
      if(!snap.exists) return;
      const cloud = snap.data();

      // ── Resolver conflicto de racha ──
      if(cloud.streakData){
        const localKey = "mat-streak-" + fbUser.uid;
        let local;
        try{ local = JSON.parse(localStorage.getItem(localKey) || "null"); }
        catch(e){ local = null; }
        if(!local) local = { count: 0, lastDate: "" };

        const c = cloud.streakData;
        let winner;
        if(c.lastDate > local.lastDate){
          // La nube es más reciente
          winner = c;
        } else if(c.lastDate === local.lastDate){
          // Mismo día: ganar el mayor count (puede pasar si se usó offline en ambos)
          winner = (c.count || 0) >= (local.count || 0) ? c : local;
        } else {
          // Local es más reciente
          winner = local;
        }
        localStorage.setItem(localKey, JSON.stringify(winner));
        // Si la nube tenía datos más viejos, subir el winner
        if(JSON.stringify(winner) !== JSON.stringify(c)){
          fbDb.collection("users").doc(fbUser.uid)
            .set({ streakData: winner }, { merge: true })
            .catch(function(){});
        }
      }

      // ── Resolver conflicto de objetivo diario ──
      if(cloud.goalData){
        const localKey = "mat-goal-" + fbUser.uid;
        let local;
        try{ local = JSON.parse(localStorage.getItem(localKey) || "null"); }
        catch(e){ local = null; }
        if(!local) local = { goal: 5, todayCount: 0, lastDate: "" };

        const c = cloud.goalData;
        let winner;
        if(c.lastDate === local.lastDate){
          // Mismo día: usar el mayor todayCount y la meta configurada más recientemente
          // (si el usuario cambió la meta en un dispositivo, no perderla)
          winner = {
            goal:       c.lastDate === local.lastDate
                          ? Math.max(c.goal || 5, local.goal || 5)
                          : (c.lastDate > local.lastDate ? c.goal : local.goal) || 5,
            todayCount: Math.max(c.todayCount || 0, local.todayCount || 0),
            lastDate:   c.lastDate
          };
        } else if(c.lastDate > local.lastDate){
          winner = c;
        } else {
          winner = local;
        }
        localStorage.setItem(localKey, JSON.stringify(winner));
        // Subir si local ganó
        if(JSON.stringify(winner) !== JSON.stringify(c)){
          fbDb.collection("users").doc(fbUser.uid)
            .set({ goalData: winner }, { merge: true })
            .catch(function(){});
        }
      }

    }catch(e){ console.warn("[v3.7] pull streak/goal:", e); }
  };

  // ── 9. PATCH onSnapshot para recibir cambios en tiempo real ────────────────
  // El onSnapshot de firebase.js ya maneja data (manga/anime). Aquí lo extendemos
  // para que también actualice localStorage cuando llegan cambios de streak/goal
  // desde otro dispositivo.
  const _orig_saveToCloud = window.saveToCloud;
  // Interceptar el momento en que fbUnsub se asigna es complejo sin modificar firebase.js.
  // En su lugar, usamos un listener independiente de menor frecuencia en el mismo documento.
  // Solo se activa si el usuario está logueado.
  let _v37Unsub = null;

  function _v37SubscribeRealtimeMetrics(){
    if(!fbUser || !fbDb) return;
    if(_v37Unsub){ _v37Unsub(); _v37Unsub = null; }

    _v37Unsub = fbDb.collection("users").doc(fbUser.uid)
      .onSnapshot(function(snap){
        if(!snap.exists) return;
        const cloud = snap.data();
        if(!cloud) return;

        // ── Actualizar racha en localStorage si la nube trae algo más nuevo ──
        if(cloud.streakData && fbUser){
          const localKey = "mat-streak-" + fbUser.uid;
          let local;
          try{ local = JSON.parse(localStorage.getItem(localKey) || "null"); }
          catch(e){ local = null; }
          if(!local) local = { count: 0, lastDate: "" };

          const c = cloud.streakData;
          if(c.lastDate > local.lastDate ||
            (c.lastDate === local.lastDate && (c.count || 0) > (local.count || 0))){
            localStorage.setItem(localKey, JSON.stringify(c));
          }
        }

        // ── Actualizar objetivo diario en localStorage ──
        if(cloud.goalData && fbUser){
          const localKey = "mat-goal-" + fbUser.uid;
          let local;
          try{ local = JSON.parse(localStorage.getItem(localKey) || "null"); }
          catch(e){ local = null; }
          if(!local) local = { goal: 5, todayCount: 0, lastDate: "" };

          const c = cloud.goalData;
          const localTd = _todayLocal();

          // Solo actualizar si la nube trae info del mismo día con más progreso,
          // o si trae un día más reciente
          if(c.lastDate > local.lastDate){
            localStorage.setItem(localKey, JSON.stringify(c));
          } else if(c.lastDate === local.lastDate && c.lastDate === localTd){
            if((c.todayCount || 0) > (local.todayCount || 0)){
              local.todayCount = c.todayCount;
              localStorage.setItem(localKey, JSON.stringify(local));
            }
            if((c.goal || 5) !== (local.goal || 5)){
              local.goal = c.goal;
              localStorage.setItem(localKey, JSON.stringify(local));
            }
          }
        }

      }, function(err){ console.warn("[v3.7] realtime metrics:", err.message); });
  }

  // Suscribirse ahora si ya hay sesión activa
  if(fbUser) _v37SubscribeRealtimeMetrics();

  // También suscribirse cuando cambie el estado de auth
  // (firebase.js ya llama loadFromCloud en onAuthStateChanged;
  //  nosotros nos enganchamos 300ms después para que fbUser esté seteado)
  const _orig_signOut = window.signOut;
  window.signOut = async function(){
    if(_v37Unsub){ _v37Unsub(); _v37Unsub = null; }
    if(typeof _orig_signOut === "function") await _orig_signOut();
  };

  // Observar fbUser con polling ligero solo para la suscripción realtime
  // (no usar onAuthStateChanged directo para no interferir con firebase.js)
  let _v37PollUid = fbUser ? fbUser.uid : null;
  setInterval(function(){
    const curUid = fbUser ? fbUser.uid : null;
    if(curUid !== _v37PollUid){
      _v37PollUid = curUid;
      if(curUid){
        _v37SubscribeRealtimeMetrics();
      } else {
        if(_v37Unsub){ _v37Unsub(); _v37Unsub = null; }
      }
    }
  }, 1500);

  // ── 10. CSS del stepper + presets (inyectado una sola vez) ────────────────
  if(!document.getElementById("v37-stepper-css")){
    const st = document.createElement("style");
    st.id = "v37-stepper-css";
    st.textContent = `
.v37-edit-divider{height:1px;background:rgba(29,158,117,.12);margin:8px 0}
.v37-edit-row{display:flex;align-items:center;gap:6px}
.v37-edit-lbl{font-size:8.5px;text-transform:uppercase;letter-spacing:.1em;color:rgba(74,222,128,.35);flex:1}
.v37-stepper{display:flex;align-items:center;background:rgba(0,0,0,.3);border:1px solid rgba(29,158,117,.3);border-radius:7px;overflow:hidden}
.v37-step-btn{width:24px;height:24px;background:rgba(29,158,117,.1);border:none;color:#4ade80;font-size:15px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.v37-step-btn:hover{background:rgba(29,158,117,.22)}
.v37-step-btn:active{background:rgba(29,158,117,.35)}
.v37-step-val{min-width:32px;text-align:center;color:#4ade80;font-family:'Space Mono',monospace;font-size:12px;font-weight:700;background:rgba(29,158,117,.06);height:24px;line-height:24px;border-left:1px solid rgba(29,158,117,.2);border-right:1px solid rgba(29,158,117,.2)}
.v37-preset-row{display:flex;gap:3px;margin-top:6px}
.v37-preset-chip{flex:1;padding:3px 0;background:rgba(29,158,117,.07);border:1px solid rgba(29,158,117,.2);border-radius:5px;color:rgba(74,222,128,.6);font-family:'Space Mono',monospace;font-size:9px;font-weight:700;text-align:center;cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.v37-preset-chip:hover{background:rgba(29,158,117,.18);border-color:rgba(29,158,117,.5);color:#4ade80}
.v37-preset-chip.v37-active{background:rgba(29,158,117,.25);border-color:#1D9E75;color:#4ade80}
    `.trim();
    document.head.appendChild(st);
  }

  // ── 11. Inyectar stepper en .mggoal tras cada render ───────────────────────
  const _origRender = window.render;
  window.render = function(){
    _origRender.apply(this, arguments);
    const mggoal = document.querySelector(".mggoal");
    if(!mggoal || mggoal.querySelector(".v37-edit-divider")) return;

    const d    = (typeof p29GetGoalData === "function") ? p29GetGoalData() : {goal:5};
    const goal = d.goal || 5;

    const div = document.createElement("div");
    div.className = "v37-edit-divider";

    const row = document.createElement("div");
    row.className = "v37-edit-row";

    const lbl = document.createElement("span");
    lbl.className = "v37-edit-lbl";
    lbl.textContent = "Meta";

    const stepper = document.createElement("div");
    stepper.className = "v37-stepper";

    const btnM = document.createElement("button");
    btnM.className = "v37-step-btn"; btnM.textContent = "−"; btnM.setAttribute("aria-label","Reducir meta");

    const valEl = document.createElement("div");
    valEl.className = "v37-step-val"; valEl.textContent = goal;

    const btnP = document.createElement("button");
    btnP.className = "v37-step-btn"; btnP.textContent = "+"; btnP.setAttribute("aria-label","Aumentar meta");

    stepper.append(btnM, valEl, btnP);
    row.append(lbl, stepper);

    const presets = document.createElement("div");
    presets.className = "v37-preset-row";
    [3,5,7,10,15].forEach(function(v){
      const chip = document.createElement("div");
      chip.className = "v37-preset-chip" + (v === goal ? " v37-active" : "");
      chip.textContent = v;
      chip.onclick = function(){ _applyGoal(v, mggoal); };
      presets.appendChild(chip);
    });

    mggoal.appendChild(div);
    mggoal.appendChild(row);
    mggoal.appendChild(presets);

    function _applyGoal(v, card){
      if(v < 1 || v > 99) return;
      const nd = (typeof p29GetGoalData === "function") ? p29GetGoalData() : {goal:5,todayCount:0,lastDate:""};
      nd.goal = v;
      if(typeof p29SaveGoalData === "function") p29SaveGoalData(nd);
      if(typeof render === "function") render();
    }

    btnM.onclick = function(e){ e.stopPropagation(); const nd=p29GetGoalData(); if(nd.goal>1){ nd.goal--; p29SaveGoalData(nd); render(); } };
    btnP.onclick = function(e){ e.stopPropagation(); const nd=p29GetGoalData(); if(nd.goal<99){ nd.goal++; p29SaveGoalData(nd); render(); } };
  };

  console.log("[MANGU v3.7] Streak & Goal cross-device sync activado ✓");

})();
