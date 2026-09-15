/* ═══════════════════════════════════════════════════════
   CAP 2030 — cap financier, défis, listes, navigation
   ═══════════════════════════════════════════════════════ */
"use strict";

/* ─────────── CAP FINANCIER ─────────── */
function renderCap() {
  var pat = +$("cPat").value || 0, epa = +$("cEpa").value || 0;
  var part = +$("cPart").value || 0, val = +$("cVal").value || 0;
  S.cap = { pat: pat, epa: epa, part: part, val: val }; save();

  var patrimoine = pat + val * part / 100;
  $("capNow").textContent = Math.round(patrimoine).toLocaleString("fr-FR") + " €";
  $("capBar").style.width = Math.max(Math.min(100, patrimoine / 1e6 * 100), .6) + "%";

  var mois = Math.max(1, Math.round((new Date(2030, 11, 31) - NOW) / (864e5 * 30.44)));
  $("capMonths").textContent = mois + " mois restants";

  var proj = pat, r = 0.04 / 12;
  for (var i = 0; i < mois; i++) proj = proj * (1 + r) + epa;
  var gap = 1e6 - proj;

  var t;
  if (epa <= 0 && pat <= 0) {
    t = "Renseigne ton patrimoine et ton épargne mensuelle. Sans chiffre, il n'y a pas de cap — juste une intention.";
  } else if (gap <= 0) {
    t = "Ton épargne seule t'y emmène. C'est rare. Vérifie tes chiffres.";
  } else {
    t = "À " + epa.toLocaleString("fr-FR") + " € épargnés par mois, tu arrives à <b>"
      + Math.round(proj).toLocaleString("fr-FR") + " €</b> fin 2030. Il manque <b>"
      + Math.round(gap).toLocaleString("fr-FR") + " €</b>.";
    if (part > 0) {
      var need = gap / (part / 100);
      t += " Avec " + part + " % de Medoq, l'entreprise doit valoir <b>"
        + (need >= 1e6 ? (need / 1e6).toFixed(1).replace(".", ",") + " M€"
                       : Math.round(need).toLocaleString("fr-FR") + " €") + "</b>.";
    } else {
      t += " Renseigne ta part dans Medoq pour savoir ce que l'entreprise doit valoir.";
    }
  }
  $("capVerdict").innerHTML = t;
}

function renderMois() {
  var i = +$("mIn").value || 0, o = +$("mOut").value || 0;
  S.mois = { in: i, out: o }; save();
  var solde = i - o;

  var d20 = new Date(NOW.getFullYear(), NOW.getMonth(), 20);
  if (d20 < NOW) d20 = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 20);
  var j = Math.max(1, Math.ceil((d20 - NOW) / 864e5));
  var perJ = Math.round(solde / j);

  $("moisMeta").textContent = (solde >= 0 ? "+" : "") + solde.toLocaleString("fr-FR") + " €";
  $("cashBar").style.width = Math.max(2, Math.min(100, perJ / 25 * 100)) + "%";
  $("cashBarWrap").className = "bar" + (perJ < 10 ? " coral" : perJ < 18 ? " gold" : "");
  $("cashNote").textContent = j + " jours avant le 20 · " + perJ + " €/jour disponibles. "
    + (perJ < 10 ? "Sous 10 €/jour : aucune dépense non prévue jusqu'au salaire."
     : perJ < 18 ? "Marge étroite. Rien d'imprévu cette quinzaine."
     : "Marge correcte. Le surplus va à l'épargne, pas au confort.");
}

/* ─────────── DÉFIS ─────────── */
function agg() {
  var a = { dw: 0, lect: 0, sport: 0, rlz: 0, scrOk: 0, noph: 0 };
  for (var k in S.days) {
    var d = S.days[k];
    a.dw += d.dw || 0;
    if (d.lect) a.lect++;
    if (d.sport) a.sport++;
    if (d.rlz) a.rlz++;
    if (scrHeld(d)) a.scrOk++;
    if (d.nophone) a.noph++;
  }
  return a;
}
function weeksAt(t) {
  var n = 0, m = new Date(MON);
  for (var i = 0; i < 60; i++) {
    var p = 0, mx = 0, any = 0;
    for (var j = 0; j < 7; j++) {
      var d = new Date(m); d.setDate(m.getDate() + j);
      if (d > NOW) continue;
      var v = S.days[ymd(d)]; if (v) any = 1;
      p += dayPts(v || {}, d.getDay()); mx += dayMax(d.getDay());
    }
    if (!any || !mx) break;
    if (p / mx * 100 >= t) n++; else break;
    m.setDate(m.getDate() - 7);
  }
  return n;
}
function renderChals() {
  var a = agg();
  var C = [
    { i: "🕌", n: "Fajr — 30 jours d'affilée",    v: stFajr(),               t: 30 },
    { i: "🚀", n: "Medoq — 100 heures de fond",   v: Math.round(a.dw / 60),  t: 100, u: "h" },
    { i: "📵", n: "Écran tenu — 30 jours",        v: a.scrOk,                t: 30 },
    { i: "🌙", n: "20 soirées sans téléphone",    v: a.noph,                 t: 20 },
    { i: "📖", n: "Lecture — 100 jours",          v: a.lect,                 t: 100 },
    { i: "📨", n: "Réseau — 50 relances",         v: a.rlz,                  t: 50 },
    { i: "🏋️", n: "Corps — 100 séances",          v: a.sport,                t: 100 },
    { i: "🔥", n: "Fer — 12 semaines à 80 %",     v: weeksAt(80),            t: 12 }
  ];
  var box = $("chals"); box.innerHTML = ""; var won = 0;
  C.forEach(function (c) {
    var done = c.v >= c.t; if (done) won++;
    var d = el("div", "chal" + (done ? " done" : ""));
    d.innerHTML = '<span class="ic">' + c.i + '</span><span class="b">' +
      '<span class="n"><span class="t"></span><em></em></span>' +
      '<span class="bar thin' + (done ? " gold" : "") + '"><i></i></span></span>';
    d.querySelector(".t").textContent = c.n;
    d.querySelector("em").textContent = done ? "✦ remporté"
      : c.v + (c.u || "") + " / " + c.t + (c.u || "");
    d.querySelector(".bar i").style.width = Math.min(100, c.v / c.t * 100) + "%";
    box.appendChild(d);
  });
  $("chalMeta").textContent = won + " remporté" + (won > 1 ? "s" : "");
}

/* ─────────── LISTES ─────────── */
function renderJalons() {
  var b = $("jalons"); b.innerHTML = ""; var n = 0;
  S.jalons.forEach(function (x, i) {
    if (x.d) n++;
    var d = el("div", "li" + (x.d ? " on" : ""));
    d.innerHTML = '<span class="box">✓</span><span class="b"><span class="n"></span></span>' +
      '<button class="del" aria-label="Supprimer">×</button>';
    d.querySelector(".n").textContent = x.n;
    function flip() { x.d = x.d ? 0 : 1; hapt(); save(); renderJalons(); }
    d.querySelector(".box").onclick = flip;
    d.querySelector(".b").onclick = flip;
    d.querySelector(".del").onclick = function () { S.jalons.splice(i, 1); save(); renderJalons(); };
    b.appendChild(d);
  });
  if (!S.jalons.length) b.innerHTML = '<div class="empty">Aucun jalon. Ajoute la prochaine étape concrète.</div>';
  $("jMeta").textContent = S.jalons.length ? n + "/" + S.jalons.length : "—";
}

function renderRelances() {
  var b = $("relances"); b.innerHTML = ""; var stale = 0;
  S.relances.forEach(function (x, i) {
    var old = !x.last || ((NOW - new Date(x.last)) / 864e5 > 14);
    if (old) stale++;
    var d = el("div", "li");
    d.innerHTML = '<span class="b"><span class="n"></span><span class="d"></span></span>' +
      '<button class="rlz' + (old ? "" : " done") + '"></button>' +
      '<button class="del" aria-label="Supprimer">×</button>';
    d.querySelector(".n").textContent = x.n;
    d.querySelector(".d").textContent = x.d || "";
    d.querySelector(".rlz").textContent = x.last
      ? new Date(x.last).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
      : "relancer";
    d.querySelector(".rlz").onclick = function () {
      x.last = TODAY; T.rlz = true; hapt(); save();
      renderRelances(); renderDay(); toast("Relance notée — +15 pts");
    };
    d.querySelector(".del").onclick = function () { S.relances.splice(i, 1); save(); renderRelances(); };
    b.appendChild(d);
  });
  if (!S.relances.length) b.innerHTML = '<div class="empty">Ajoute les personnes que tu dois relancer.<br>' +
    'Un contact sans nouvelle depuis 14 jours repasse en signal.</div>';
  $("rMeta").textContent = S.relances.length ? (stale ? stale + " à relancer" : "à jour") : "—";
}

function renderActions() {
  var b = $("actions"); b.innerHTML = ""; var open = 0;
  var TAG = ["", "🔴 avant lundi", "🟠 cette semaine", "⚪ ce mois-ci"];
  S.actions.slice()
    .sort(function (a, c) { return (a.done - c.done) || ((a.p || 3) - (c.p || 3)); })
    .forEach(function (x) {
      if (!x.done) open++;
      var i = S.actions.indexOf(x);
      var d = el("div", "li" + (x.done ? " on" : ""));
      d.innerHTML = '<span class="box">✓</span><span class="b"><span class="n"></span></span>' +
        '<button class="del" aria-label="Supprimer">×</button>';
      d.querySelector(".n").textContent = x.n;
      if (!x.done) {
        var tag = el("span", "tag t" + (x.p || 3), TAG[x.p || 3]);
        d.querySelector(".b").appendChild(tag);
        tag.onclick = function (ev) {
          ev.stopPropagation();
          x.p = (x.p || 3) % 3 + 1; hapt(); save(); renderActions(); renderFocusHint();
        };
      }
      d.querySelector(".box").onclick = function () {
        x.done = x.done ? 0 : 1; hapt(); save(); renderActions(); renderFocusHint();
      };
      d.querySelector(".del").onclick = function () {
        S.actions.splice(i, 1); save(); renderActions(); renderFocusHint();
      };
      b.appendChild(d);
    });
  if (!S.actions.length) b.innerHTML = '<div class="empty">Rien d\'ouvert. Ajoute ce que tu repousses.</div>';
  $("aMeta").textContent = S.actions.length ? open + " ouverte" + (open > 1 ? "s" : "") : "—";
}

function renderFocusHint() {
  var urg = S.actions.filter(function (x) { return !x.done && (x.p || 3) === 1; });
  var h = $("focusHint");
  if (urg.length) {
    h.className = "hint";
    h.innerHTML = "<b>" + urg.length + " action" + (urg.length > 1 ? "s" : "") + " à faire avant lundi.</b> "
      + "Tant qu'elles sont là, elles coûtent plus d'énergie à porter qu'à faire.";
  } else {
    h.className = "hint calm";
    h.textContent = "Rien d'urgent. C'est le meilleur moment pour avancer sur Medoq, pas pour se reposer.";
  }
}

/* ajout dans les listes */
function bindAdders() {
  document.querySelectorAll("[data-add]").forEach(function (btn) {
    var w = btn.dataset.add;
    var inp = $(w === "jalons" ? "jNew" : w === "relances" ? "rNew" : "aNew");
    function add() {
      var v = inp.value.trim(); if (!v) return;
      if (w === "jalons") S.jalons.push({ n: v, d: 0 });
      else if (w === "relances") S.relances.push({ n: v, d: "", last: "" });
      else S.actions.push({ n: v, d: "", p: 2, done: 0 });
      inp.value = ""; hapt(); save();
      renderJalons(); renderRelances(); renderActions(); renderFocusHint();
    }
    btn.onclick = add;
    inp.onkeydown = function (e) { if (e.key === "Enter") add(); };
  });
}

/* ─────────── ÉNERGIE & TEXTES ─────────── */
var PROMPTS = [
  "Qu'est-ce que j'ai appris aujourd'hui ?",
  "Quelle erreur ne dois-je pas refaire ?",
  "Qu'est-ce qui m'a fait perdre du temps ?",
  "De quoi suis-je fier aujourd'hui ?",
  "Qu'est-ce que je repousse depuis trop longtemps ?",
  "Qui dois-je contacter et que j'évite ?",
  "Est-ce que la journée a servi Medoq ?"
];
function renderEnergy() {
  var b = $("energy"); b.innerHTML = "";
  for (var i = 1; i <= 10; i++) {
    (function (i) {
      var x = el("button", T.en === i ? "on" : "", String(i));
      x.onclick = function () { T.en = (T.en === i ? 0 : i); hapt(); save(); renderEnergy(); };
      b.appendChild(x);
    })(i);
  }
  $("enMeta").textContent = T.en ? T.en + "/10" : "—";
}
function bindText(id, get, set) {
  var e = $(id); e.value = get() || "";
  if (e.tagName === "TEXTAREA") { autoGrow(e); e.addEventListener("input", function () { autoGrow(e); }); }
  e.addEventListener("input", function () { set(e.value); save(); });
}

/* ─────────── RENDU GLOBAL ─────────── */
function renderDay() { renderRit(); renderScore(); renderWeek(); renderChals(); renderEnergy(); }

/* ─────────── NAVIGATION ─────────── */
function goTo(p) {
  document.querySelectorAll("nav button").forEach(function (x) {
    x.classList.toggle("on", x.dataset.p === p);
  });
  document.querySelectorAll(".page").forEach(function (s) {
    s.classList.toggle("on", s.id === "p-" + p);
  });
  if (p === "focus") renderFocus();
  window.scrollTo(0, 0);
}
var PAGES = ["jour", "focus", "semaine", "cap", "projets"];
function bindNav() {
  document.querySelectorAll("nav button").forEach(function (b) {
    b.onclick = function () { hapt(); goTo(b.dataset.p); };
  });
  /* raccourcis du manifeste : index.html#focus */
  var h = (location.hash || "").replace("#", "");
  if (PAGES.indexOf(h) > -1) goTo(h);
}

/* ─────────── DONNÉES ─────────── */
function bindData() {
  $("exp").onclick = function () {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" }));
    a.download = "cap2030-" + TODAY + ".json"; a.click();
    toast("Sauvegarde exportée");
  };
  $("imp").onclick = function () { $("impFile").click(); };
  $("impFile").onchange = function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try { JSON.parse(r.result); localStorage.setItem(KEY, r.result); location.reload(); }
      catch (x) { toast("Fichier illisible"); }
    };
    r.readAsText(f);
  };
  $("rst").onclick = function () {
    if (confirm("Tout effacer ? Cette action est définitive.")) {
      localStorage.removeItem(KEY); location.reload();
    }
  };
}

/* ─────────── DÉMARRAGE ─────────── */
(function boot() {
  renderDawn();

  bindText("bloc", function () { return T.bloc; }, function (v) { T.bloc = v; });
  bindText("note", function () { return T.note; }, function (v) { T.note = v; renderScore(); });
  bindText("vision", function () { return S.vision; }, function (v) { S.vision = v; });

  S.rev[WKID] = S.rev[WKID] || {};
  bindText("rv1", function () { return S.rev[WKID].a; }, function (v) { S.rev[WKID].a = v; });
  bindText("rv2", function () { return S.rev[WKID].b; }, function (v) { S.rev[WKID].b = v; });
  bindText("rv3", function () { return S.rev[WKID].c; }, function (v) { S.rev[WKID].c = v; });
  $("notePrompt").textContent = PROMPTS[NOW.getDate() % PROMPTS.length];

  ["cPat", "cEpa", "cPart", "cVal"].forEach(function (id, i) {
    var k = ["pat", "epa", "part", "val"][i], e = $(id);
    if (S.cap[k]) e.value = S.cap[k];
    e.oninput = renderCap;
  });
  ["mIn", "mOut"].forEach(function (id, i) {
    var k = ["in", "out"][i], e = $(id);
    if (S.mois[k] != null) e.value = S.mois[k];
    e.oninput = renderMois;
  });

  $("tabEnt").onclick = function () { renderPlan("ent"); };
  $("tabEco").onclick = function () { renderPlan("eco"); };

  bindAdders(); bindNav(); bindData();
  bindScrTarget(); bindCurfew(); bindTimer(); bindSetup();

  renderDay(); renderPlan(ECOLE ? "eco" : "ent");
  renderCap(); renderMois();
  renderJalons(); renderRelances(); renderActions(); renderFocusHint();
  renderFocus();

  /* le couvre-feu se rafraîchit, et l'app se recharge au changement de jour */
  setInterval(function () {
    if (ymd(new Date()) !== TODAY) location.reload();
    renderCurfew();
  }, 30000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function () {});
  }
})();
