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

  // ── 7. PATCH p29RenderGoalBar → usa fecha local para el check de "hoy" ─────
  const _orig_p29Render = window.p29RenderGoalBar;
  if(typeof _orig_p29Render === "function"){
    window.p29RenderGoalBar = function(root){
      const td = _todayLocal();
      const d  = p29GetGoalData();
      // Si lastDate es UTC-ayer pero local-hoy, no resetear el contador
      if(d.lastDate !== td) d.todayCount = 0;
      // Llamar al render original (que ya leerá localStorage actualizado)
      _orig_p29Render(root);
    };
  }

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

  // ── 10. CSS VISUAL — Saira Condensed 900 + stats compactas + nav pill ──────
  (function _injectVisualCSS(){
    if(document.getElementById("v37-visual-css")) return;
    const lnk = document.createElement("link");
    lnk.rel = "stylesheet";
    lnk.href = "https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@900&display=swap";
    document.head.appendChild(lnk);

    const st = document.createElement("style");
    st.id = "v37-visual-css";
    st.textContent = `
/* ── Stat cards: Saira 900 + tamaño reducido ── */
.mgstc{min-height:76px!important;padding:10px 10px 9px!important;border-radius:10px!important}
.mgstc-val{font-family:'Saira Condensed',sans-serif!important;font-size:22px!important;font-weight:900!important;letter-spacing:-.01em!important}
.mgstc-ico{font-size:15px!important;margin-bottom:4px!important}
.mgstc-lbl{font-size:7.5px!important}
.mgsr{gap:7px!important;margin-bottom:7px!important}

/* ── Nav pill redesign ── */
.mgnav{background:#111827!important;border:1px solid rgba(255,255,255,.06)!important;border-radius:11px!important;padding:3px!important;margin-bottom:8px!important}
.mgnav-sep{display:none!important}
.mgnav-item{border-radius:8px!important;padding:7px 4px 6px!important;border:1px solid transparent!important;gap:3px!important}
.mgnav-item:hover{background:rgba(255,255,255,.04)!important}
.mgnav-item::after{bottom:3px!important;left:22%!important;right:22%!important;height:2px!important;border-radius:99px!important}
.mgnav-ico{font-size:14px!important}
.mgnav-lbl{font-size:7.5px!important;letter-spacing:.09em!important;color:rgba(255,255,255,.28)!important}
.mgnav-item.on .mgnav-lbl{color:rgba(255,255,255,.88)!important}
/* colores por tab */
.mgnav-item.on.mn{background:rgba(127,119,221,.1)!important;border-color:rgba(127,119,221,.2)!important}
.mgnav-item.on.mn .mgnav-lbl{color:#afa9ec!important}
.mgnav-item.on.mn::after{background:linear-gradient(90deg,#7f77dd,#afa9ec)!important}
.mgnav-item.on.ma{background:rgba(212,83,126,.1)!important;border-color:rgba(212,83,126,.2)!important}
.mgnav-item.on.ma .mgnav-lbl{color:#ed93b1!important}
.mgnav-item.on.ma::after{background:linear-gradient(90deg,#d4537e,#ed93b1)!important}
.mgnav-item.on.mp{background:rgba(55,138,221,.1)!important;border-color:rgba(55,138,221,.2)!important}
.mgnav-item.on.mp .mgnav-lbl{color:#85b7eb!important}
.mgnav-item.on.mp::after{background:linear-gradient(90deg,#378add,#85b7eb)!important}
.mgnav-item.on.md{background:rgba(239,159,39,.1)!important;border-color:rgba(239,159,39,.2)!important}
.mgnav-item.on.md .mgnav-lbl{color:#fac775!important}
.mgnav-item.on.md::after{background:linear-gradient(90deg,#ef9f27,#fac775)!important}
.mgnav-item.on.mh{background:rgba(29,158,117,.1)!important;border-color:rgba(29,158,117,.2)!important}
.mgnav-item.on.mh .mgnav-lbl{color:#5dcaa5!important}
.mgnav-item.on.mh::after{background:linear-gradient(90deg,#1d9e75,#5dcaa5)!important}
/* badge */
.mgnav-cnt{font-family:'Saira Condensed',sans-serif!important;font-weight:900!important}

/* ── Racha + meta: Saira 900 + tamaño reducido ── */
.mgsr-bot{gap:7px!important;margin-bottom:14px!important}
.mgstreak{padding:10px 12px!important;border-radius:10px!important}
.mgstreak-fire{font-size:22px!important}
.mgstreak-num{font-family:'Saira Condensed',sans-serif!important;font-size:24px!important;font-weight:900!important;letter-spacing:-.01em!important}
.mgstreak-dias{font-size:9.5px!important}
.mgstreak-unit{font-size:7px!important;margin-top:2px!important}
.mgstreak-msg{font-size:9px!important;margin-top:1px!important}
.mgstreak-segs{margin-top:5px!important}
.mgstreak-seg{height:2px!important}
.mggoal{padding:10px 12px!important;border-radius:10px!important}
.mggoal-hdr{margin-bottom:5px!important}
.mggoal-ttl{font-size:7.5px!important}
.mggoal-frac{font-family:'Saira Condensed',sans-serif!important;font-size:14px!important;font-weight:900!important;cursor:default!important}
.mggoal-track{height:4px!important;margin-bottom:5px!important}
.mggoal-dot{height:3px!important}
.mggoal-dots{margin-bottom:4px!important}
.mggoal-sub{font-size:9px!important;margin-top:4px!important}

/* ── Stepper edición meta ── */
.v37-edit-divider{height:1px;background:rgba(29,158,117,.12);margin:7px 0}
.v37-edit-row{display:flex;align-items:center;gap:6px}
.v37-edit-lbl{font-size:7.5px;text-transform:uppercase;letter-spacing:.1em;color:rgba(74,222,128,.35);flex:1;font-family:'Space Mono',monospace}
.v37-stepper{display:flex;align-items:center;background:rgba(0,0,0,.3);border:1px solid rgba(29,158,117,.3);border-radius:6px;overflow:hidden}
.v37-step-btn{width:22px;height:22px;background:rgba(29,158,117,.1);border:none;color:#4ade80;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.v37-step-btn:hover{background:rgba(29,158,117,.22)}
.v37-step-btn:active{background:rgba(29,158,117,.35)}
.v37-step-val{min-width:28px;text-align:center;color:#4ade80;font-family:'Saira Condensed',sans-serif;font-size:14px;font-weight:900;background:rgba(29,158,117,.06);height:22px;line-height:22px;border-left:1px solid rgba(29,158,117,.2);border-right:1px solid rgba(29,158,117,.2)}
.v37-preset-row{display:flex;gap:3px;margin-top:5px}
.v37-preset-chip{flex:1;padding:2px 0;background:rgba(29,158,117,.07);border:1px solid rgba(29,158,117,.2);border-radius:4px;color:rgba(74,222,128,.6);font-family:'Saira Condensed',sans-serif;font-size:11px;font-weight:900;text-align:center;cursor:pointer;transition:background .12s,border-color .12s,color .12s}
.v37-preset-chip:hover{background:rgba(29,158,117,.18);border-color:rgba(29,158,117,.5);color:#4ade80}
.v37-preset-chip.v37-on{background:rgba(29,158,117,.25);border-color:#1D9E75;color:#4ade80}
    `.trim();
    document.head.appendChild(st);
  })();

  // ── 11. Override _sc para iconos kanji + colores unificados manga/anime ─────
  // Se engancha al render() para reemplazar los 4 stat cards después de que
  // ui.js los construya, cambiando iconos y colores según tab activo.
  const _origRenderVisual = window.render;
  window.render = function(){
    _origRenderVisual.apply(this, arguments);

    // ── Stat cards: iconos kanji + colores anime = manga ──
    const mgsr = document.querySelector(".mgsr");
    if(mgsr){
      const isManga = (typeof tab !== "undefined") ? tab === "manga" : true;
      const isAnime = (typeof tab !== "undefined") ? tab === "anime" : false;
      const cards = mgsr.querySelectorAll(".mgstc");

      if(isManga || isAnime){
        // Card 0: Series
        const ico0 = cards[0] ? cards[0].querySelector(".mgstc-ico") : null;
        if(ico0) ico0.textContent = isManga ? "巻" : "映";

        // Card 1: Leídos/Vistos — colores unificados (siempre #AFA9EC series, #5DCAA5 leídos)
        if(isAnime && cards[0]){
          cards[0].style.background = "linear-gradient(160deg,#16122b,#120f23)";
          cards[0].style.borderColor = "rgba(127,119,221,.25)";
          const bar0 = cards[0].querySelector(".mgstc-bar");
          const val0 = cards[0].querySelector(".mgstc-val");
          const lbl0 = cards[0].querySelector(".mgstc-lbl");
          if(bar0) bar0.style.background = "#AFA9EC";
          if(val0) val0.style.color = "#AFA9EC";
          if(lbl0) lbl0.style.color = "#AFA9EC88";
        }
        if(isAnime && cards[1]){
          cards[1].style.background = "linear-gradient(160deg,#0d2218,#0a1c14)";
          cards[1].style.borderColor = "rgba(29,158,117,.25)";
          const bar1 = cards[1].querySelector(".mgstc-bar");
          const val1 = cards[1].querySelector(".mgstc-val");
          const lbl1 = cards[1].querySelector(".mgstc-lbl");
          const ico1 = cards[1].querySelector(".mgstc-ico");
          if(bar1) bar1.style.background = "#5DCAA5";
          if(val1) val1.style.color = "#5DCAA5";
          if(lbl1) lbl1.style.color = "#5DCAA588";
          if(ico1) ico1.textContent = "視";
        }
      }
    }

    // ── Nav: iconos kanji para manga/anime ──
    const navItems = document.querySelectorAll(".mgnav-item");
    navItems.forEach(function(item){
      const ico = item.querySelector(".mgnav-ico");
      if(!ico) return;
      if(item.classList.contains("mn")) ico.textContent = "巻";
      else if(item.classList.contains("ma")) ico.textContent = "映";
    });

    // ── Barra META pequeña eliminada ──
    // p29RenderGoalBar ya es no-op desde el bloque 7 de arriba.

    // ── Stepper en .mggoal ──
    const mggoal = document.querySelector(".mggoal");
    if(mggoal && !mggoal.querySelector(".v37-edit-divider")){
      const d = (typeof p29GetGoalData === "function") ? p29GetGoalData() : {goal:5};
      const goal = d.goal || 5;

      const divider = document.createElement("div");
      divider.className = "v37-edit-divider";

      const row = document.createElement("div");
      row.className = "v37-edit-row";

      const lbl = document.createElement("span");
      lbl.className = "v37-edit-lbl";
      lbl.textContent = "Meta";

      const stepper = document.createElement("div");
      stepper.className = "v37-stepper";

      const btnM = document.createElement("button");
      btnM.className = "v37-step-btn";
      btnM.textContent = "−";
      btnM.setAttribute("aria-label","Reducir meta");

      const valEl = document.createElement("div");
      valEl.className = "v37-step-val";
      valEl.textContent = goal;

      const btnP = document.createElement("button");
      btnP.className = "v37-step-btn";
      btnP.textContent = "+";
      btnP.setAttribute("aria-label","Aumentar meta");

      stepper.append(btnM, valEl, btnP);
      row.append(lbl, stepper);

      const presets = document.createElement("div");
      presets.className = "v37-preset-row";
      [3,5,7,10,15].forEach(function(v){
        const chip = document.createElement("div");
        chip.className = "v37-preset-chip" + (v === goal ? " v37-on" : "");
        chip.textContent = v;
        chip.onclick = function(e){
          e.stopPropagation();
          const nd = (typeof p29GetGoalData === "function") ? p29GetGoalData() : {goal:5,todayCount:0,lastDate:""};
          nd.goal = v;
          if(typeof p29SaveGoalData === "function") p29SaveGoalData(nd);
          if(typeof render === "function") render();
        };
        presets.appendChild(chip);
      });

      mggoal.appendChild(divider);
      mggoal.appendChild(row);
      mggoal.appendChild(presets);

      btnM.onclick = function(e){
        e.stopPropagation();
        const nd = (typeof p29GetGoalData === "function") ? p29GetGoalData() : {goal:5,todayCount:0,lastDate:""};
        if(nd.goal > 1){ nd.goal--; if(typeof p29SaveGoalData === "function") p29SaveGoalData(nd); if(typeof render === "function") render(); }
      };
      btnP.onclick = function(e){
        e.stopPropagation();
        const nd = (typeof p29GetGoalData === "function") ? p29GetGoalData() : {goal:5,todayCount:0,lastDate:""};
        if(nd.goal < 99){ nd.goal++; if(typeof p29SaveGoalData === "function") p29SaveGoalData(nd); if(typeof render === "function") render(); }
      };
    }
  };

  console.log("[MANGU v3.7] Streak & Goal cross-device sync activado ✓");
  console.log("[MANGU v3.7] Visual patch: Saira Condensed · kanji icons · unified colors · nav pill ✓");

})();
