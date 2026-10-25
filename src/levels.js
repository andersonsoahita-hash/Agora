/* ---------- Rangs, niveaux d'exercice et récompenses ---------- */
var RANKS = [
  { n: 'Passant', min: 0, d: 'Tu arrives sur la place.' },
  { n: 'Auditeur', min: 40, d: 'Tu écoutes et tu t’exerces.' },
  { n: 'Disciple', min: 120, d: 'Tu as pris l’habitude de parler.' },
  { n: 'Orateur', min: 260, d: 'Tu tiens la parole devant les autres.' },
  { n: 'Rhéteur', min: 480, d: 'Tu construis et tu prouves.' },
  { n: 'Tribun', min: 800, d: 'Tu sais convaincre et te défendre.' },
  { n: 'Maître de l’agora', min: 1300, d: 'La place t’écoute.' }
];
function rankInfo() {
  var xp = S.xp || 0, i = 0;
  for (var k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].min) i = k;
  var nx = RANKS[i + 1] || null;
  return { i: i, r: RANKS[i], next: nx, left: nx ? nx.min - xp : 0, pct: nx ? Math.round(100 * (xp - RANKS[i].min) / (nx.min - RANKS[i].min)) : 100 };
}
var TIERS = [1, 3, 6, 10], TIER_NAMES = ['Nouveau', 'Découverte', 'Pratique', 'Aisance', 'Maîtrise'];
function exLevel(typeId) {
  var n = S.sessions.filter(function (s) { return s.type === typeId; }).length, lvl = 0;
  for (var i = 0; i < TIERS.length; i++) if (n >= TIERS[i]) lvl = i + 1;
  return { n: n, lvl: lvl, name: TIER_NAMES[lvl], next: lvl < TIERS.length ? TIERS[lvl] : null, left: lvl < TIERS.length ? TIERS[lvl] - n : 0 };
}
function modulesDone() {
  return D.modules.filter(function (mo) {
    var ls = D.lessons.filter(function (l) { return l.m === mo.id; });
    return ls.length && ls.every(function (l) { return S.done[l.id]; });
  });
}
function lessonsDoneN() { return D.lessons.filter(function (l) { return S.done[l.id]; }).length; }
var BADGES = [
  { id: 'voix', t: 'Première parole', d: 'Fais une première séance dans le Studio.', ok: function () { return S.sessions.length >= 1; } },
  { id: 'reg3', t: 'Régulier', d: 'Viens trois jours de suite.', ok: function () { return streak() >= 3; } },
  { id: 'reg7', t: 'Assidu', d: 'Viens sept jours de suite.', ok: function () { return streak() >= 7; } },
  { id: 'etud', t: 'Studieux', d: 'Termine 5 leçons.', ok: function () { return lessonsDoneN() >= 5; } },
  { id: 'erud', t: 'Érudit', d: 'Termine 30 leçons.', ok: function () { return lessonsDoneN() >= 30; } },
  { id: 'mod', t: 'Module validé', d: 'Termine toutes les leçons d’un module.', ok: function () { return modulesDone().length >= 1; } },
  { id: 'sf', t: 'Sans faute', d: 'Réussis un quiz de leçon à 100 %.', ok: function () { return D.lessons.some(function (l) { return l.quiz && S.quiz[l.id] === l.quiz.length; }); } },
  { id: 'poly', t: 'Polyvalent', d: 'Essaie 4 types d’exercices différents.', ok: function () { var t = {}; S.sessions.forEach(function (s) { if (s.type) t[s.type] = 1; }); return Object.keys(t).length >= 4; } },
  { id: 'c5', t: 'Cinq sur cinq', d: 'Dans « Relier ses idées », fais détecter les 5 étapes dans ton texte.', ok: function () { return S.sessions.some(function (s) { return s.type === 'connecteurs' && s.txt && s.txt.steps && s.txt.steps.count === 5; }); } },
  { id: 'exp', t: 'Éclair', d: 'Termine une « Recherche express » dans le Studio.', ok: function () { return S.sessions.some(function (s) { return s.type === 'express'; }); } },
  { id: 'prep', t: 'Préparateur', d: 'Prépare un débat ou un discours dans « Préparer ».', ok: function () { return (S.prep || []).length >= 1; } },
  { id: 'eri', t: 'Éristicien', d: 'Obtiens 12 sur 12 au quiz global des 38 stratagèmes.', ok: function () { return S.erist && S.erist.best >= 12; } }
];
function badgesOk() { return BADGES.filter(function (b) { return b.ok(); }); }
var toastBox = null;
function toast(msg, big) {
  try {
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; document.body.appendChild(toastBox); }
    var el = document.createElement('div'); el.className = 'toast' + (big ? ' big' : ''); el.textContent = msg;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, big ? 4800 : 3000);
  } catch (e) {}
}
function addXp(n) {
  var before = rankInfo().i;
  S.xp += n;
  var after = rankInfo();
  var seen = S.badges || [], fresh = badgesOk().filter(function (b) { return seen.indexOf(b.id) < 0; });
  if (fresh.length) S.badges = seen.concat(fresh.map(function (b) { return b.id; }));
  if (after.i > before) toast('Nouveau rang : ' + after.r.n + ' · +' + n + ' pts', true);
  else toast('+' + n + ' pts');
  if (fresh.length > 2) toast(fresh.length + ' récompenses débloquées', true);
  else fresh.forEach(function (b) { toast('Récompense : ' + b.t, true); });
}
function vRank() {
  var ri = rankInfo();
  var h = '<div class="card rank"><div class="row" style="justify-content:space-between;align-items:baseline"><div><div class="eyebrow">Ton rang</div><h2 style="margin:0">' + esc(ri.r.n) + '</h2></div><span class="pill">' + S.xp + ' pts</span></div>';
  h += '<p class="muted small" style="margin:4px 0 8px">' + esc(ri.r.d) + '</p><div class="bar"><i style="width:' + ri.pct + '%"></i></div>';
  h += '<p class="muted small" style="margin:6px 0 0">' + (ri.next ? 'Encore ' + ri.left + ' pts pour devenir ' + esc(ri.next.n) + '.' : 'Rang maximum atteint.') + '</p></div>';
  return h;
}
function vBadges() {
  var ok = badgesOk(), okIds = ok.map(function (b) { return b.id; });
  var h = '<div class="card"><div class="row" style="justify-content:space-between"><h3>Récompenses</h3><span class="muted small">' + ok.length + ' / ' + BADGES.length + '</span></div><div class="badges">';
  h += BADGES.map(function (b) { var on = okIds.indexOf(b.id) >= 0; return '<div class="badge' + (on ? ' on' : '') + '"><b>' + (on ? '★ ' : '☆ ') + esc(b.t) + '</b><span>' + esc(b.d) + '</span></div>'; }).join('');
  h += '</div><p class="muted small" style="margin:10px 0 0">Points : séance +10 à +25, leçon terminée +15, module validé +30, objectif +20.</p></div>';
  return h;
}
function exLevelHtml(typeId) {
  var e = exLevel(typeId);
  var pct = e.next ? Math.round(100 * (e.n - (e.lvl ? TIERS[e.lvl - 1] : 0)) / (e.next - (e.lvl ? TIERS[e.lvl - 1] : 0))) : 100;
  return '<div class="lvl"><div class="row" style="justify-content:space-between"><span class="small"><b>Niveau ' + e.lvl + ' · ' + esc(e.name) + '</b></span><span class="muted small">' + e.n + ' séance' + (e.n > 1 ? 's' : '') + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>' +
    '<p class="muted small" style="margin:4px 0 0">' + (e.next ? 'Encore ' + e.left + ' séance' + (e.left > 1 ? 's' : '') + ' pour « ' + TIER_NAMES[e.lvl + 1] + ' ».' : 'Niveau maximum : continue pour garder le rythme.') + '</p></div>';
}
var STEP_LABELS = { annonce: 'J’annonce', prolepse: 'Je préviens le malentendu', concession: 'Je concède', exemple: 'J’illustre', reformulation: 'Je reformule' };
function stepsHtml(t) {
  if (!t || !t.steps) return '';
  var h = '<div class="card"><h3>Les 5 étapes dans ton texte : ' + t.steps.count + ' / 5</h3>';
  Object.keys(STEP_LABELS).forEach(function (k) { var f = t.steps.found[k]; h += m(STEP_LABELS[k], f ? '✓ « ' + esc(f) + ' »' : 'non repéré', f ? 'tag-ok' : 'tag-warn'); });
  h += '<p class="muted small" style="margin:8px 0 0">Repérage de mots précis dans ta transcription. Une étape bien faite avec d’autres mots n’est pas vue : c’est un guide, pas un juge.</p></div>';
  return h;
}
