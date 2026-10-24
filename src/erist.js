/* ---------- Éristique de Schopenhauer ---------- */
var eFam = 'tous';
var eq = { i: 0, sc: 0, ans: null, done: false };
var NAT = { loyal: ['Technique loyale', 'tag-ok'], limite: ['Zone grise', 'tag-warn'], deloyal: ['Déloyal', 'tag-bad'] };
function strat(n) { var L = D.erist.strats; for (var i = 0; i < L.length; i++) if (L[i].n === n) return L[i]; return null; }
function stratCard(s) {
  var nat = NAT[s.nat];
  return '<details class="card"><summary style="cursor:pointer"><span class="muted small">N° ' + s.n + ' · ' + esc(D.erist.familles[s.f]) + '</span><br><b>' + esc(s.t) + '</b> <span class="small ' + nat[1] + '">· ' + nat[0] + '</span></summary>' +
    '<div class="prose" style="margin-top:10px">' +
    '<p><b>Le principe.</b> ' + esc(s.p) + '</p>' +
    '<p><b>Exemple</b> <span class="muted small">(' + (s.exS ? 'de Schopenhauer' : 'de l’appli') + ')</span><br>' + esc(s.ex) + '</p>' +
    '<p><b>Comment le reconnaître.</b> ' + esc(s.r) + '</p>' +
    '<p><b>Comment y répondre</b> <span class="muted small">(' + (s.cS ? 'selon Schopenhauer' : 'conseil de l’appli') + ')</span><br>' + esc(s.c) + '</p>' +
    (s.faux ? '<p class="muted small" style="margin:0">Nom moderne rapproché : ' + esc(s.faux) + '</p>' : '') +
    '</div></details>';
}
function vErist() {
  var E = D.erist, h = '<div class="top"><button class="btn small ghost" data-act="course-back">← Cours</button><span class="pill">' + (S.erist && S.erist.best ? 'Meilleur quiz : ' + S.erist.best + ' / ' + E.quiz.length : '38 stratagèmes') + '</span></div><div class="stack">';
  h += '<div><div class="eyebrow">Arthur Schopenhauer</div><h1>L’art d’avoir toujours raison</h1></div>';
  h += '<div class="callout info small">' + esc(E.note) + '</div>';
  h += '<details class="card"><summary style="cursor:pointer"><b>Les idées de base du texte</b></summary><div class="prose" style="margin-top:10px">' + E.idees.map(function (x) { return '<h3>' + esc(x.t) + '</h3><p>' + esc(x.x) + '</p>'; }).join('') + '</div></details>';
  h += '<div class="box b-ret"><b>Comment s’en servir</b>Chaque fiche te donne le principe (comment la ruse fonctionne), de quoi la reconnaître chez l’autre, et la parade. Avant d’en utiliser une toi-même, pose-toi une question : si l’auditoire la repère, qu’est-ce que ça te coûte ? Les ruses « déloyales » abîment ta crédibilité (l’éthos) dès qu’elles sont vues ; les techniques « loyales » (le contre-exemple, la retorsion) se défendent devant n’importe quel public.</div>';
  h += '<button class="btn" data-act="erist-quiz">S’entraîner : reconnais la ruse (' + E.quiz.length + ' questions)</button>';
  var fams = ['tous'].concat(Object.keys(E.familles));
  h += '<div class="hscroll">' + fams.map(function (k) { return '<button class="chip' + (eFam === k ? ' on' : '') + '" data-act="erist-fam" data-v="' + k + '">' + esc(k === 'tous' ? 'Les 38' : E.familles[k]) + '</button>'; }).join('') + '</div>';
  E.strats.filter(function (s) { return eFam === 'tous' || s.f === eFam; }).forEach(function (s) { h += stratCard(s); });
  h += '<div class="small muted">Classement loyal / zone grise / déloyal : lecture de l’appli, à discuter. Les ruses sont décrites pour être reconnues et contrées ; Schopenhauer écrit lui-même qu’il faut savoir s’en défendre.</div></div>';
  return h;
}
function vEristQuiz() {
  var E = D.erist, Q = E.quiz;
  var h = '<div class="top"><button class="btn small ghost" data-act="erist-open">← Les 38 fiches</button><span class="pill">' + Math.min(eq.i + 1, Q.length) + ' / ' + Q.length + '</span></div><div class="stack">';
  if (eq.done) {
    var best = S.erist && S.erist.best || 0;
    h += '<div class="eyebrow">Résultat</div><h1>' + eq.sc + ' / ' + Q.length + '</h1><p class="muted">' + (eq.sc >= 10 ? 'Tu repères les ruses très bien.' : eq.sc >= 7 ? 'Bon réflexe. Revois les fiches que tu as ratées.' : 'Relis les fiches, puis réessaie : reconnaître une ruse demande de la pratique.') + ' Meilleur score : ' + best + ' / ' + Q.length + '.</p><button class="btn" data-act="erist-quiz">Recommencer</button>';
    return h + '</div>';
  }
  var q = Q[eq.i];
  h += '<h2 style="font-size:1.1rem">« ' + esc(q.q) + ' »</h2><p class="muted small">Quelle ruse est utilisée ?</p>';
  var oo = q.o.slice(), rot = (eq.i * 3 + 1) % oo.length; oo = oo.slice(rot).concat(oo.slice(0, rot));
  oo.forEach(function (n) {
    var s = strat(n), cls = '';
    if (eq.ans != null) cls = n === q.n ? ' good' : (n === eq.ans ? ' badc' : '');
    h += '<button class="opt' + cls + '" data-act="erist-ans" data-v="' + n + '"' + (eq.ans != null ? ' disabled' : '') + '>' + esc(s.t) + '</button>';
  });
  if (eq.ans != null) {
    var s2 = strat(q.n);
    h += '<div class="box ' + (eq.ans === q.n ? 'b-ret' : 'b-err') + '" style="margin-top:12px"><b>' + (eq.ans === q.n ? 'Exact' : 'Pas tout à fait') + ' · n° ' + s2.n + ' ' + esc(s2.t) + '</b>' + esc(q.e) + '</div><button class="btn" data-act="erist-next">' + (eq.i + 1 >= Q.length ? 'Voir le résultat' : 'Suivant') + '</button>';
  }
  return h + '</div>';
}
function eristAct(act, v) {
  switch (act) {
    case 'erist-open': eFam = 'tous'; go('course', 'erist'); return true;
    case 'erist-fam': eFam = v; render(); return true;
    case 'erist-quiz': eq = { i: 0, sc: 0, ans: null, done: false }; go('course', 'erist-quiz'); return true;
    case 'erist-ans':
      if (eq.ans != null) return true;
      eq.ans = +v; if (eq.ans === D.erist.quiz[eq.i].n) eq.sc++;
      render(); return true;
    case 'erist-next':
      eq.i++; eq.ans = null;
      if (eq.i >= D.erist.quiz.length) {
        eq.done = true; S.erist = S.erist || { best: 0 };
        if (eq.sc > S.erist.best) S.erist.best = eq.sc;
        addXp(5 + eq.sc); touchDay(); persist();
      }
      render(); window.scrollTo(0, 0); return true;
  }
  return false;
}
