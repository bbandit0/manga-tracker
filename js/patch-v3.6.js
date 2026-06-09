// ══════════════════════════════════════════════════════════════════
// MANGU  —  Parche v3.6  (Racha + Meta: sync cloud, timezone fix)
// Carga DESPUÉS de ui.js en index.html
// ══════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // ── 1. TODAY() CON TIMEZONE LOCAL (reemplaza la de tracker.js que usa UTC) ──
  // La función global today() usa toISOString() = UTC, lo que en Santiago
  // (UTC-3/UTC-4) puede cambiar de día a las 21:00-22:00 local.
  // Sobreescribimos con fecha local para que la racha sea coherente.
  window.today = function () {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`; // YYYY-MM-DD en hora local
  };

  // ── 2. CLAVE FIRESTORE PARA META (sub-documento aparte de los items) ──
  //    Usamos la colección "users/{uid}" con merge:true, mismo doc que saveToCloud.
  //    No rompemos la estructura de datos existente.

  const STREAK_FIELD = "streakData";
  const GOAL_FIELD   = "goalData";

  // ── 3. GUARDAR RACHA EN FIRESTORE ──
  function _cloudSaveStreak(d) {
    if (!window.fbDb || !window.fbUser) return;
    try {
      window.fbDb
        .collection("users")
        .doc(window.fbUser.uid)
        .set({ [STREAK_FIELD]: d }, { merge: true })
        .catch(() => {}); // silenciar errores de red
    } catch (e) {}
  }

  // ── 4. GUARDAR META EN FIRESTORE ──
  function _cloudSaveGoal(d) {
    if (!window.fbDb || !window.fbUser) return;
    try {
      window.fbDb
        .collection("users")
        .doc(window.fbUser.uid)
        .set({ [GOAL_FIELD]: d }, { merge: true })
        .catch(() => {});
    } catch (e) {}
  }

  // ── 5. CARGAR RACHA DESDE FIRESTORE Y RESOLVER CONFLICTO ──
  //    Política de merge: gana el count más alto.
  //    Si el cloud tiene un lastDate más reciente → ese gana.
  async function _cloudLoadStreak() {
    if (!window.fbDb || !window.fbUser) return;
    try {
      const snap = await window.fbDb
        .collection("users")
        .doc(window.fbUser.uid)
        .get();
      if (!snap.exists) return;
      const remote = snap.data()[STREAK_FIELD];
      if (!remote) return;

      const local = window.p28GetStreakData
        ? window.p28GetStreakData()
        : { count: 0, lastDate: "" };

      // Estrategia merge: elegir el estado "más avanzado" (mayor count, o
      // lastDate más reciente en caso de empate de count)
      let winner = local;
      if (remote.count > local.count) {
        winner = remote;
      } else if (remote.count === local.count && remote.lastDate > local.lastDate) {
        winner = remote;
      }

      // Solo sobreescribir localStorage si el cloud ganó
      if (winner !== local) {
        window.p28SaveStreakData(winner);
      }

      // Si el local era mejor, subir al cloud para que el otro device se actualice
      if (winner === local && local.count > 0) {
        _cloudSaveStreak(local);
      }
    } catch (e) {}
  }

  // ── 6. CARGAR META DESDE FIRESTORE Y RESOLVER CONFLICTO ──
  //    Para la meta: el número configurado (goal) se sincroniza,
  //    el todayCount se suma (win-by-max) para no perder caps marcados
  //    en otro device el mismo día.
  async function _cloudLoadGoal() {
    if (!window.fbDb || !window.fbUser) return;
    try {
      const snap = await window.fbDb
        .collection("users")
        .doc(window.fbUser.uid)
        .get();
      if (!snap.exists) return;
      const remote = snap.data()[GOAL_FIELD];
      if (!remote) return;

      const local = window.p29GetGoalData
        ? window.p29GetGoalData()
        : { goal: 5, todayCount: 0, lastDate: "" };

      const td = window.today();
      let merged = { ...local };

      // Si el remote es del mismo día, tomar el todayCount más alto
      if (remote.lastDate === td && local.lastDate === td) {
        merged.todayCount = Math.max(local.todayCount, remote.todayCount);
      } else if (remote.lastDate === td && local.lastDate !== td) {
        // El remote tiene datos de hoy, el local no → usar remote
        merged = remote;
      }
      // Si ambos son de días distintos al actual, ninguno tiene datos de hoy → no mezclar

      // Siempre sincronizar el valor de goal configurado (el más reciente es el intencional)
      // Usamos el del remote si su lastDate es >= local (fue configurado en otro device)
      if (remote.lastDate >= local.lastDate && remote.goal !== local.goal) {
        merged.goal = remote.goal;
      }

      window.p29SaveGoalData(merged);
    } catch (e) {}
  }

  // ── 7. MONKEY-PATCH p28SaveStreakData ──
  //    Interceptamos la función existente para añadir el write a cloud
  const _origSaveStreak = window.p28SaveStreakData;
  window.p28SaveStreakData = function (d) {
    if (_origSaveStreak) _origSaveStreak(d);
    _cloudSaveStreak(d);
  };

  // ── 8. MONKEY-PATCH p29SaveGoalData ──
  const _origSaveGoal = window.p29SaveGoalData;
  window.p29SaveGoalData = function (d) {
    if (_origSaveGoal) _origSaveGoal(d);
    _cloudSaveGoal(d);
  };

  // ── 9. HOOK EN onAuthStateChanged: sincronizar al loguearse ──
  //    Cuando el usuario se autentica (o cambia de dispositivo), tiramos un
  //    pull del cloud antes de que render() muestre la racha.
  const _origOnAuthChanged = window.onAuthStateChangedCallback;

  // Si firebase.js expone un callback hookeable, lo usamos.
  // Si no, observamos directamente.
  if (window.firebase && window.firebase.auth) {
    window.firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        // Dar tiempo a que fbUser se establezca en firebase.js
        await new Promise((r) => setTimeout(r, 400));
        await Promise.all([_cloudLoadStreak(), _cloudLoadGoal()]);
        // Re-render para mostrar la racha actualizada
        if (typeof window.render === "function") window.render();
      }
    });
  }

  // ── 10. PULL MANUAL AL HACER SYNC BUTTON ──
  //    El botón "↻ Sync" llama a loadFromCloud(). Hookeamos para incluir
  //    streak y goal en ese pull.
  const _origLoadFromCloud = window.loadFromCloud;
  window.loadFromCloud = async function () {
    const result = _origLoadFromCloud ? await _origLoadFromCloud() : undefined;
    await Promise.all([_cloudLoadStreak(), _cloudLoadGoal()]);
    return result;
  };

  // ── 11. FIX p28TouchStreak: limpiar rama redundante y respetar today() local ──
  //    Reemplazamos la función completa con la corrección de timezone
  //    (ya corregida arriba con window.today) + limpieza lógica.
  window.p28TouchStreak = function () {
    const td = window.today();
    const d = window.p28GetStreakData();

    if (d.lastDate === td) return; // ya marcó hoy en este device

    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yd = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, "0")}-${String(yDate.getDate()).padStart(2, "0")}`;

    if (d.lastDate === yd) {
      d.count = (d.count || 0) + 1; // racha continúa
    } else {
      d.count = 1; // racha nueva o rota
    }

    d.lastDate = td;
    window.p28SaveStreakData(d); // ya hookeado → también sube al cloud
  };

  // ── 12. FIX p28GetStreak: usar today() local ──
  window.p28GetStreak = function () {
    const d = window.p28GetStreakData();
    const td = window.today();

    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yd = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, "0")}-${String(yDate.getDate()).padStart(2, "0")}`;

    if (d.lastDate !== td && d.lastDate !== yd) {
      if (d.count > 0) {
        d.count = 0;
        window.p28SaveStreakData(d);
      }
      return 0;
    }
    return d.count || 0;
  };

  // ── 13. FIX p29BumpGoal: usar today() local ──
  const _origBumpGoal = window.p29BumpGoal;
  window.p29BumpGoal = function () {
    const td = window.today();
    const d = window.p29GetGoalData();
    // Resetear si cambió el día (usando hora local ahora)
    if (d.lastDate !== td) {
      d.todayCount = 0;
      d.lastDate = td;
    }
    d.todayCount = (d.todayCount || 0) + 1;
    window.p29SaveGoalData(d); // ya hookeado → también sube al cloud

    // Actualizar DOM (misma lógica que el original)
    const goalFill = document.querySelector(".daily-goal-fill");
    const goalCount = document.querySelector(".daily-goal-count");
    const goal = d.goal || 5;
    if (goalFill) {
      const pct = Math.round(Math.min(d.todayCount, goal) / goal * 100);
      goalFill.style.width = pct + "%";
    }
    if (goalCount) {
      goalCount.textContent = Math.min(d.todayCount, goal) + " / " + goal + " hoy";
    }
    if (d.todayCount === goal) {
      const mc = (window.theme && window.theme.accentManga) || "#22c55e";
      if (typeof window.p29ShowConfetti === "function") {
        window.p29ShowConfetti(mc, "goal");
      }
    }
    return d;
  };

  console.log("[MANGU v3.6] Streak+Goal sync patch loaded ✓");
})();
