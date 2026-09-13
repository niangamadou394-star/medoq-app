/* ═══════════════════════════════════════════════════════
   CAP 2030 — Focus, temps d'écran, couvre-feu
   ═══════════════════════════════════════════════════════ */
"use strict";

/* ─────────── TEMPS D'ÉCRAN ─────────── */
var SCR_STEPS = [30, 60, 90, 120, 180, 240, 300];

function setScreen(min) {
  T.scr = (T.scr === min) ? null : min;
  if (T.scr === null) delete T.scr;
  hapt(); save(); renderScreen(); renderDay();
}

function renderScreen() {
  var tgt = S.cfg.scrTarget || 120;
  var v = T.scr;
  var box = $("scrCard");

  $("scrBig").textContent = v == null ? "—" : fmtMin(v);
  $("scrOf").textContent = "objectif : moins de " + fmtMin(tgt) + " par jour";
  box.className = "screen" + (v == null ? "" : v <= tgt ? " under" : " over");

  var vd = $("scrVerdict");
  if (v == null) {
    vd.textContent = "Ouvre les réglages de ton téléphone, relève ton temps d'écran d'hier, "
      + "et note-le ici. Ce qui n'est pas mesuré ne se réduit pas.";
  } else if (v <= tgt * 0.6) {
    vd.innerHTML = "<b>" + fmtMin(tgt - v) + " sous ton objectif.</b> "
      + "C'est autant de temps rendu à Medoq, aux livres, au sommeil.";
  } else if (v <= tgt) {
    vd.innerHTML = "Dans l'objectif, avec <b>" + fmtMin(tgt - v) + "</b> de marge. Tiens la ligne.";
  } else {
    var over = v - tgt;
    vd.innerHTML = "<b>" + fmtMin(over) + " au-dessus.</b> Sur un an, c'est "
      + Math.round(over * 365 / 60) + " heures — "
      + Math.round(over * 365 / 60 / 24) + " jours pleins passés sur un écran.";
  }

  /* boutons rapides */
  var q = $("scrQuick"); q.innerHTML = "";
  SCR_STEPS.forEach(function (m) {
    var b = el("button", v === m ? "on" : "", fmtShort(m));
    b.onclick = function () { setScreen(m); };
    q.appendChild(b);
  });

  /* histogramme 7 jours */
  var sp = $("scrSpark"); sp.innerHTML = "";
  var L = ["L", "M", "M", "J", "V", "S", "D"];
  var maxV = tgt * 2;
  for (var i = 0; i < 7; i++) {
    var d = new Date(MON); d.setDate(MON.getDate() + i);
    var k = ymd(d), dv = (S.days[k] || {}).scr;
    var cls = dv == null ? "none" : dv <= tgt ? "good" : "over";
    var c = el("div", "c " + cls + (k === TODAY ? " today" : ""));
    var bar = el("i");
    bar.style.height = dv == null ? "3px" : Math.max(4, Math.min(100, dv / maxV * 100)) + "%";
    c.appendChild(bar); c.appendChild(el("em", "", L[i]));
    sp.appendChild(c);
  }
}

/* objectif d'écran réglable */
function bindScrTarget() {
  var e = $("scrTarget");
  e.value = S.cfg.scrTarget;
  e.oninput = function () {
    var v = parseInt(e.value, 10);
    S.cfg.scrTarget = (isNaN(v) || v < 15) ? 15 : Math.min(720, v);
    save(); renderScreen(); renderDay();
  };
}

/* ─────────── COUVRE-FEU ─────────── */
function curfewMinutes() {
  var p = (S.cfg.curfew || "22:00").split(":");
  return (+p[0]) * 60 + (+p[1]);
}
function renderCurfew() {
  var now = new Date();
  var mins = now.getHours() * 60 + now.getMinutes();
  var c = curfewMinutes();
  var past = mins >= c || mins < 240;             // après le couvre-feu, ou avant 4 h
  var box = $("curfewBox");
  box.className = "curfew" + (past ? " night" : "");
  var n = $("curfewN"), d = $("curfewD");
  if (past) {
    n.textContent = "Couvre-feu passé";
    d.textContent = "Le téléphone n'a plus rien à t'apprendre ce soir. Branche-le loin du lit.";
    $("curfewIc").textContent = "🌙";
  } else {
    var left = c - mins;
    n.textContent = "Écrans jusqu'à " + (S.cfg.curfew || "22:00").replace(":", "h");
    d.textContent = fmtMin(left) + " avant de couper. Prépare demain avant, pas après.";
    $("curfewIc").textContent = "⏳";
  }
  $("curfewTime").value = S.cfg.curfew || "22:00";
}
function bindCurfew() {
  $("curfewTime").onchange = function (e) {
    S.cfg.curfew = e.target.value || "22:00"; save(); renderCurfew();
  };
  var b = $("noPhone");
  b.onclick = function () {
    T.nophone = !T.nophone; hapt(); save(); renderNoPhone(); renderDay();
    if (T.nophone) toast("Soirée sans téléphone — +15 XP");
  };
}
function renderNoPhone() {
  var b = $("noPhone");
  b.className = "r" + (T.nophone ? " on" : "");
  b.querySelector(".chk").textContent = "✓";
}

/* ─────────── SÉRIES ─────────── */
function renderStreaks() {
  var data = [
    { id: "stkScr",  ic: "📵", v: stScreen(),  l: "jours sous l'objectif d'écran" },
    { id: "stkPh",   ic: "🌙", v: stNoPhone(), l: "soirées sans téléphone" },
    { id: "stkFajr", ic: "🕌", v: stFajr(),    l: "jours Fajr d'affilée" },
    { id: "stkLect", ic: "📖", v: stLect(),    l: "jours de lecture" }
  ];
  var box = $("streaks"); box.innerHTML = "";
  data.forEach(function (s) {
    var d = el("div", "strk" + (s.v > 0 ? " live" : ""));
    d.innerHTML = '<span class="ic">' + s.ic + '</span>' +
      '<span class="b"><span class="v num"></span><span class="l"></span></span>';
    d.querySelector(".v").textContent = s.v;
    d.querySelector(".l").textContent = s.l;
    box.appendChild(d);
  });
}

/* ─────────── MINUTEUR DE FOCUS ─────────── */
var DURS = [25, 50, 90];
var tk = null;                 // handle d'intervalle
S.timer = S.timer || null;     // { end, dur, task, paused, left }

function timerLeft() {
  var t = S.timer; if (!t) return 0;
  if (t.paused) return t.left;
  return Math.max(0, Math.round((t.end - Date.now()) / 1000));
}
function mmss(sec) {
  var m = Math.floor(sec / 60), s = sec % 60;
  return ("0" + m).slice(-2) + ":" + ("0" + s).slice(-2);
}

function renderTimer() {
  var t = S.timer;
  var dur = (t ? t.dur : S.cfg.focusDur) * 60;
  var left = t ? timerLeft() : dur;
  var run = !!t && !t.paused;

  $("tTime").textContent = mmss(left);
  $("zTime").textContent = mmss(left);
  $("tLab").textContent = !t ? "prêt" : t.paused ? "en pause" : "en cours";
  $("tring").className = "tring" + (run ? " run" : "");

  var C = 2 * Math.PI * 104;
  var frac = dur ? left / dur : 0;
  $("tArc").style.strokeDasharray = C;
  $("tArc").style.strokeDashoffset = C * (1 - frac);

  /* durées */
  var db = $("durs"); db.innerHTML = "";
  DURS.forEach(function (m) {
    var b = el("button", (t ? t.dur : S.cfg.focusDur) === m ? "on" : "", m + " min");
    b.disabled = !!t;
    b.onclick = function () { S.cfg.focusDur = m; hapt(); save(); renderTimer(); };
    db.appendChild(b);
  });

  /* boutons */
  $("tStart").classList.toggle("hide", !!t);
  $("tPause").classList.toggle("hide", !t);
  $("tStop").classList.toggle("hide", !t);
  $("tPause").textContent = t && t.paused ? "Reprendre" : "Pause";
  $("tTask").disabled = !!t;
  $("zTask").textContent = (t && t.task) ? t.task : "Session de travail de fond";
}

function tick() {
  if (!S.timer) return;
  if (S.timer.paused) return;
  var left = timerLeft();
  $("tTime").textContent = mmss(left);
  $("zTime").textContent = mmss(left);
  var dur = S.timer.dur * 60, C = 2 * Math.PI * 104;
  $("tArc").style.strokeDashoffset = C * (1 - left / dur);
  if (left <= 0) finishTimer();
}

function startTimer() {
  var dur = S.cfg.focusDur;
  var task = ($("tTask").value || "").trim();
  S.timer = { end: Date.now() + dur * 60000, dur: dur, task: task, paused: false, left: dur * 60 };
  save(); hapt(20);
  $("zen").classList.add("on");
  clearInterval(tk); tk = setInterval(tick, 1000);
  renderTimer();
  try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (e) {}
}
function pauseTimer() {
  var t = S.timer; if (!t) return;
  if (t.paused) { t.end = Date.now() + t.left * 1000; t.paused = false; }
  else { t.left = timerLeft(); t.paused = true; }
  hapt(); save(); renderTimer();
}
function stopTimer(silent) {
  var t = S.timer; if (!t) return;
  var done = Math.round((t.dur * 60 - timerLeft()) / 60);
  S.timer = null; clearInterval(tk); tk = null;
  $("zen").classList.remove("on");
  if (done >= 5) { logSession(t.task, done); if (!silent) toast(fmtMin(done) + " enregistrées"); }
  else if (!silent) toast("Session trop courte — rien enregistré");
  save(); renderTimer(); renderSessions(); renderDay();
}
function finishTimer() {
  var t = S.timer; if (!t) return;
  var dur = t.dur, task = t.task;
  S.timer = null; clearInterval(tk); tk = null;
  logSession(task, dur);
  save(); renderTimer(); renderSessions(); renderDay();
  hapt([30, 60, 30]);
  $("zen").classList.remove("on");
  toast("★ " + dur + " min de fond. " + fmtShort(T.dw || 0) + " aujourd'hui.");
  try {
    if (window.Notification && Notification.permission === "granted")
      new Notification("Session terminée", { body: dur + " min de travail de fond. Note ce que tu as avancé.", icon: "icon-192.png" });
  } catch (e) {}
}
function logSession(task, min) {
  T.sess = T.sess || [];
  var d = new Date();
  T.sess.push({ n: task || "Travail de fond", m: min,
    at: ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) });
  T.dw = (T.dw || 0) + min;
}

function renderSessions() {
  var box = $("sessList"); box.innerHTML = "";
  var list = T.sess || [];
  if (!list.length) {
    box.innerHTML = '<div class="empty">Aucune session aujourd\'hui.<br>' +
      'Lance le minuteur, pose le téléphone, et reviens quand ça sonne.</div>';
    $("sessMeta").textContent = "—";
    return;
  }
  list.slice().reverse().forEach(function (s) {
    var d = el("div", "sess");
    d.innerHTML = '<span class="d"></span><span class="n"></span><span class="m num"></span>';
    d.querySelector(".n").textContent = s.n;
    d.querySelector(".m").textContent = s.at + " · " + fmtShort(s.m);
    box.appendChild(d);
  });
  var tot = list.reduce(function (a, s) { return a + s.m; }, 0);
  $("sessMeta").textContent = list.length + " session" + (list.length > 1 ? "s" : "") + " · " + fmtShort(tot);
}

function bindTimer() {
  $("tStart").onclick = startTimer;
  $("tPause").onclick = pauseTimer;
  $("tStop").onclick = function () { stopTimer(); };
  $("zPause").onclick = function () { pauseTimer(); $("zPause").textContent = S.timer && S.timer.paused ? "Reprendre" : "Pause"; };
  $("zStop").onclick = function () { stopTimer(); };
  $("zMin").onclick = function () { $("zen").classList.remove("on"); };

  /* une session lancée survit au rechargement */
  if (S.timer) {
    if (!S.timer.paused && timerLeft() <= 0) finishTimer();
    else { clearInterval(tk); tk = setInterval(tick, 1000); }
  }
  renderTimer();
}

/* ─────────── RENDU DU MODULE ─────────── */
function renderFocus() {
  renderScreen(); renderCurfew(); renderStreaks(); renderSessions(); renderNoPhone();
}
