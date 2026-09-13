/* ═══════════════════════════════════════════════════════
   CAP 2030 — noyau : état, temps, rituels, score, semaine
   ═══════════════════════════════════════════════════════ */
"use strict";

/* ─────────── ÉTAT ─────────── */
var KEY = "cap2030.v1";
var S = (function () {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

S.days = S.days || {}; S.cap = S.cap || {}; S.mois = S.mois || {}; S.rev = S.rev || {};
S.vision = S.vision || "";
S.cfg = S.cfg || {};
if (S.cfg.scrTarget == null) S.cfg.scrTarget = 120;   // minutes d'écran visées
if (S.cfg.curfew == null) S.cfg.curfew = "22:00";     // couvre-feu numérique
if (S.cfg.focusDur == null) S.cfg.focusDur = 50;      // durée de session par défaut

var DEF_J = [
  { n: "Mettre la PWA en ligne sur son propre dépôt", d: 0 },
  { n: "Rédiger la page de présentation Medoq (1 page)", d: 0 },
  { n: "10 premiers utilisateurs testeurs", d: 0 },
  { n: "Chiffrer le business plan à jour", d: 0 },
  { n: "Premier euro encaissé", d: 0 }
];
if (!S.jalons) S.jalons = DEF_J.slice();
if (!S.relances) S.relances = [];
if (!S.actions) S.actions = [];

/* ─────────── OUTILS ─────────── */
function $(id) { return document.getElementById(id); }
function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
function hapt(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }

var toastT;
function toast(msg) {
  var t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 2600);
}

function autoGrow(e) { e.style.height = "auto"; e.style.height = e.scrollHeight + "px"; }

function fmtMin(m) {
  m = Math.round(m || 0);
  if (!m) return "0";
  var h = Math.floor(m / 60), r = m % 60;
  return (h ? h + " h" : "") + (r ? (h ? " " : "") + r + " min" : (h ? "" : r + " min"));
}
function fmtShort(m) {
  m = Math.round(m || 0); if (!m) return "0";
  var h = Math.floor(m / 60), r = m % 60;
  return (h ? h + "h" : "") + (r ? r + "m" : "");
}

/* ─────────── TEMPS ─────────── */
var NOW = new Date();
function ymd(d) {
  return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
}
var TODAY = ymd(NOW);
function isoWeek(d) {
  var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var dy = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dy);
  var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { w: Math.ceil((((t - y0) / 864e5) + 1) / 7), y: t.getUTCFullYear() };
}
var WK = isoWeek(NOW), WKID = WK.y + "-W" + WK.w;
var ECOLE = WK.w % 2 === 0;
function mondayOf(d) {
  var x = new Date(d); var g = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - g); x.setHours(0, 0, 0, 0); return x;
}
var MON = mondayOf(NOW);
function D(k) { if (!S.days[k]) S.days[k] = {}; return S.days[k]; }
var T = D(TODAY);

/* ─────────── FAJR (Clermont-Ferrand) ─────────── */
var LAT = 45.7772, LNG = 3.0870, ANG = 12;
function ds(x) { return Math.sin(x * Math.PI / 180); }
function dc(x) { return Math.cos(x * Math.PI / 180); }
function das(x) { return Math.asin(x) * 180 / Math.PI; }
function dac(x) { return Math.acos(x) * 180 / Math.PI; }
function dat2(y, x) { return Math.atan2(y, x) * 180 / Math.PI; }
function fa(a) { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; }
function fh(a) { a = a - 24 * Math.floor(a / 24); return a < 0 ? a + 24 : a; }
function jul(y, m, d) {
  if (m <= 2) { y -= 1; m += 12; }
  var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}
function sunPos(jd) {
  var Dd = jd - 2451545, g = fa(357.529 + .98560028 * Dd), q = fa(280.459 + .98564736 * Dd);
  var L = fa(q + 1.915 * ds(g) + .020 * ds(2 * g)), e = 23.439 - 3.6e-7 * Dd;
  var RA = fh(dat2(dc(e) * ds(L), dc(L)) / 15);
  return { d: das(ds(e) * ds(L)), eq: q / 15 - RA };
}
function solar(date, ang) {
  var jd = jul(date.getFullYear(), date.getMonth() + 1, date.getDate()) - LNG / 360;
  var sp = sunPos(jd), tz = -date.getTimezoneOffset() / 60;
  var dh = 12 + tz - LNG / 15 - sp.eq;
  var r = (-ds(ang) - ds(sp.d) * ds(LAT)) / (dc(sp.d) * dc(LAT));
  if (r < -1 || r > 1) return null;
  return dh - dac(r) / 15;
}
function hm(h) {
  if (h === null) return "—";
  h = fh(h); var m = Math.round(h * 60);
  return ("0" + Math.floor(m / 60)).slice(-2) + "h" + ("0" + (m % 60)).slice(-2);
}
function renderDawn() {
  $("fajrT").textContent = hm(solar(NOW, ANG));
  var lev = hm(solar(NOW, 0.833));
  $("fajrR").innerHTML = "lever du soleil<br><b>" + lev + "</b>";
}

/* ─────────── RITUELS & POINTS ─────────── */
var GYM = [1, 3, 5, 6];                       // lun mer ven sam
var isGym = GYM.indexOf(NOW.getDay()) > -1;
var RIT = [
  { k: "fajr",  i: "🕌", n: "Prière du Fajr",       s: "la journée se gagne avant le jour", p: 25 },
  { k: "prop",  i: "🧹", n: "Propreté",             s: "lit fait, douche, espace rangé",    p: 10 },
  { k: "lect",  i: "📖", n: "Lecture — 30 minutes", s: "livre, pas écran",                  p: 25 },
  { k: "sport", i: "🏋️", n: "Salle",                s: "l'abonnement est déjà payé",        p: 15, gym: 1 },
  { k: "rlz",   i: "📨", n: "Une relance envoyée",  s: "un message part, même court",       p: 15 }
];
var DW_TARGET = 60;   // minutes de travail de fond visées
var DW_PTS = 25;
var SCR_PTS = 20;     // points liés au temps d'écran

/* Le plafond retenu est celui en vigueur le jour du relevé : baisser son
   objectif aujourd'hui ne doit pas casser une série déjà acquise. */
function scrTargetOf(d) {
  return (d && d.scrT != null) ? d.scrT : (S.cfg.scrTarget || 120);
}
function scrHeld(d) { return d && d.scr != null && d.scr <= scrTargetOf(d); }

function scrPts(d) {
  if (d.scr == null) return 0;                       // non renseigné : pas de points
  var tgt = scrTargetOf(d);
  if (d.scr <= tgt) return SCR_PTS;
  var over = (d.scr - tgt) / tgt;                    // 0 → 1 sur le double de l'objectif
  return Math.max(0, Math.round(SCR_PTS * (1 - over)));
}
function dayPts(d, dow) {
  var g = GYM.indexOf(dow) > -1, p = 0;
  RIT.forEach(function (r) { if (r.gym && !g) return; if (d[r.k]) p += r.p; });
  p += Math.round(DW_PTS * Math.min(1, (d.dw || 0) / DW_TARGET));
  p += scrPts(d);
  return p;
}
function dayMax(dow) {
  var g = GYM.indexOf(dow) > -1, m = DW_PTS + SCR_PTS;
  RIT.forEach(function (r) { if (r.gym && !g) return; m += r.p; });
  return m;
}

function renderRit() {
  var box = $("rituels"); box.innerHTML = ""; var done = 0, tot = 0;
  RIT.forEach(function (r) {
    if (r.gym && !isGym) return;
    tot++; var on = !!T[r.k]; if (on) done++;
    var b = el("button", "r" + (on ? " on" : ""));
    b.innerHTML = '<span class="ic">' + r.i + '</span>' +
      '<span class="tx"><b></b><span></span></span>' +
      '<span class="pts">+' + r.p + '</span><span class="chk">✓</span>';
    b.querySelector("b").textContent = r.n;
    b.querySelector(".tx span").textContent = r.s;
    b.onclick = function () { T[r.k] = !T[r.k]; hapt(); save(); renderDay(); };
    box.appendChild(b);
  });

  /* travail de fond Medoq */
  tot++; var dw = T.dw || 0; if (dw >= DW_TARGET) done++;
  var s = el("div", "r step" + (dw >= DW_TARGET ? " on" : ""));
  s.innerHTML = '<span class="ic">🚀</span>' +
    '<span class="tx"><b>Medoq — travail de fond</b><span>objectif 1 h par jour</span></span>' +
    '<span class="stp"><button data-d="-15">−</button>' +
    '<span class="v num">' + fmtShort(dw) + '</span>' +
    '<button data-d="15">＋</button></span>';
  s.querySelectorAll("button").forEach(function (b) {
    b.onclick = function () {
      T.dw = Math.max(0, (T.dw || 0) + parseInt(b.dataset.d, 10));
      hapt(); save(); renderDay();
    };
  });
  box.appendChild(s);
  $("ritMeta").textContent = done + "/" + tot;
}

/* ─────────── SCORE, XP, NIVEAU ─────────── */
var LEVELS = [[0, "Apprenti"], [600, "Discipliné"], [1800, "Bâtisseur"], [4000, "Stratège"],
              [8000, "Opérateur"], [14000, "Fondateur"], [24000, "Souverain"]];
function totalXp() {
  var x = 0;
  for (var k in S.days) {
    var d = new Date(k + "T12:00:00");
    x += dayPts(S.days[k], d.getDay());
    if (S.days[k].note) x += 10;
    if (S.days[k].nophone) x += 15;
  }
  for (var w in S.rev) if (S.rev[w] && S.rev[w].a) x += 50;
  return x;
}
function renderScore() {
  var p = dayPts(T, NOW.getDay()), m = dayMax(NOW.getDay());
  var pct = Math.round(p / m * 100);
  $("scoreVal").textContent = pct;
  var arc = $("arc"), C = 157;
  arc.style.strokeDashoffset = C - C * Math.min(100, pct) / 100;
  arc.setAttribute("stroke", pct >= 85 ? "#00d9b2" : pct >= 50 ? "#f7bb45" : "#ff6b6b");

  var w = $("win");
  if (pct >= 100) { w.textContent = "★ Journée pleine. C'est comme ça qu'on construit."; w.classList.add("show"); }
  else w.classList.remove("show");

  var xp = totalXp(), li = 0;
  for (var i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i][0]) li = i;
  $("lvlTitle").textContent = LEVELS[li][1];

  var jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var j = jours[NOW.getDay()];
  $("hTitle").textContent = j.charAt(0).toUpperCase() + j.slice(1) + " " + NOW.getDate();
  $("hSub").textContent = "S" + WK.w + " · " + (ECOLE ? "semaine école" : "semaine entreprise") +
    " · " + xp.toLocaleString("fr-FR") + " XP";
}

/* ─────────── SÉRIES ─────────── */
function streak(test) {
  var n = 0, d = new Date(NOW);
  for (var i = 0; i < 500; i++) {
    var v = S.days[ymd(d)] || {};
    if (test(v)) n++;
    else if (i > 0) break;              // le jour même ne casse pas la série
    d.setDate(d.getDate() - 1);
  }
  return n;
}
var stFajr    = function () { return streak(function (v) { return !!v.fajr; }); };
var stLect    = function () { return streak(function (v) { return !!v.lect; }); };
var stScreen  = function () { return streak(scrHeld); };
var stNoPhone = function () { return streak(function (v) { return !!v.nophone; }); };

/* ─────────── SEMAINE ─────────── */
function renderWeek() {
  var g = $("wgrid"); g.innerHTML = "";
  var L = ["L", "M", "M", "J", "V", "S", "D"];
  g.appendChild(el("div", "hdd", ""));
  for (var i = 0; i < 7; i++) {
    var d = new Date(MON); d.setDate(MON.getDate() + i);
    g.appendChild(el("div", "hdd" + (ymd(d) === TODAY ? " today" : ""), L[i]));
  }
  var rows = RIT.concat([
    { k: "dw",  i: "🚀", n: "Medoq" },
    { k: "scr", i: "📵", n: "Écran tenu" }
  ]);
  rows.forEach(function (r) {
    g.appendChild(el("div", "nm", r.i + " " + r.n.split("—")[0].trim()));
    for (var i = 0; i < 7; i++) {
      var d = new Date(MON); d.setDate(MON.getDate() + i);
      var k = ymd(d), v = S.days[k] || {};
      var fut = d > NOW && k !== TODAY;
      var on = r.k === "dw"  ? (v.dw || 0) >= DW_TARGET
             : r.k === "scr" ? scrHeld(v)
             : !!v[r.k];
      var skip = r.gym && GYM.indexOf(d.getDay()) === -1;
      var c = skip ? "dot fut"
        : "dot" + (on ? " on" : "") + (fut ? " fut" : "") + (!on && !fut ? " miss" : "");
      g.appendChild(el("div", c, on ? "✓" : ""));
    }
  });

  var p = 0, m = 0, dw = 0, scr = 0, scrN = 0, n = 0;
  for (var i = 0; i < 7; i++) {
    var d = new Date(MON); d.setDate(MON.getDate() + i);
    if (d > NOW && ymd(d) !== TODAY) continue;
    var v = S.days[ymd(d)] || {};
    p += dayPts(v, d.getDay()); m += dayMax(d.getDay());
    dw += v.dw || 0;
    if (v.scr != null) { scr += v.scr; scrN++; }
    n++;
  }
  $("sWeek").textContent = (m ? Math.round(p / m * 100) : 0) + "%";
  $("sDw").textContent = (dw / 60).toFixed(dw % 60 ? 1 : 0) + "h";
  $("sScr").textContent = scrN ? fmtShort(Math.round(scr / scrN)) : "—";
  $("wkMeta").textContent = n + " jour" + (n > 1 ? "s" : "") + " écoulé" + (n > 1 ? "s" : "");
  $("wkType").textContent = (ECOLE ? "école" : "entreprise") + " · S" + WK.w;
}

/* ─────────── PLANNING ─────────── */
var PLANS = {
  ent: [
    ["7h",    [["teal", "Salle 7h — lun·mer·ven"], ["free", "mar jeu — repos"]]],
    ["9h",    [["blue", "Entreprise — lun à jeu"], ["teal", "Medoq — ven + sam matin"]]],
    ["14h",   [["blue", "Entreprise — lun à jeu"], ["gold", "Conduite / élèves — ven"], ["teal", "Salle — sam"]]],
    ["17h30", [["gold", "Cours 18h — lun"], ["teal", "Business — mar"], ["violet", "Relances — jeu"]]],
    ["20h",   [["teal", "Build Medoq — mer"], ["violet", "Revue 21h — ven"], ["gold", "Prépa semaine 18h — dim"]]]
  ],
  eco: [
    ["7h",    [["teal", "Salle 7h — lun·mer·ven"]]],
    ["9h",    [["blue", "Entreprise — lun mar"], ["violet", "École — mer jeu ven"]]],
    ["14h",   [["blue", "Entreprise — lun mar"], ["violet", "École — mer jeu ven"], ["teal", "Salle — sam"]]],
    ["17h30", [["gold", "Cours 18h — lun"], ["teal", "Business — mar"], ["violet", "Relances — jeu"]]],
    ["20h",   [["teal", "Build Medoq — mer"], ["violet", "Revue 21h — ven"], ["gold", "Prépa semaine 18h — dim"]]]
  ]
};
function renderPlan(which) {
  var b = $("planBox"); b.innerHTML = "";
  PLANS[which].forEach(function (row) {
    var sl = el("div", "sl");
    sl.appendChild(el("div", "h num", row[0]));
    var c = el("div", "d");
    row[1].forEach(function (ch) { c.appendChild(el("span", "chip " + ch[0], ch[1])); });
    sl.appendChild(c); b.appendChild(sl);
  });
  $("tabEnt").className = which === "ent" ? "on" : "";
  $("tabEco").className = which === "eco" ? "on" : "";
}
