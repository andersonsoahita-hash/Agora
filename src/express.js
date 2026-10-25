/* ---------- Recherche express : chercher, structurer, expliquer (sans IA) ---------- */
var EX_T = [2, 3, 5, 7, 10, 15, 20, 30];
var ex = { phase: 'setup', T: 5, cat: 'tous', theme: null, themeCat: '', endAt: 0, notes: '', seen: [], crossed: false };
var EX_CHK = ['J’ai défini le thème en une phrase.', 'J’ai donné trois idées claires, pas plus.', 'J’ai donné un exemple concret.', 'J’ai terminé par une conclusion.'];
/* Plan : explication = 1/5 du temps total, arrondie au quart de minute (30 s, 1 min, 1 min 15…) ; recherche ≈ 60 %, structuration le reste, par demi-minutes */
function exPlan(T) {
  var tot = T * 60, speak = Math.max(30, Math.round(tot / 5 / 15) * 15), search = Math.round(tot * 0.6 / 30) * 30;
  return { tot: tot, search: search, struct: tot - search, speak: speak };
}
function exLab(sec) { sec = Math.round(sec); if (sec < 60) return sec + ' s'; var m = Math.floor(sec / 60), s = sec % 60; return m + ' min' + (s ? ' ' + s : ''); }
function exPool() { return ex.cat === 'tous' ? D.themeAll : D.themeAll.filter(function (x) { return x.c === ex.cat; }); }
function exDraw() {
  var pool = exPool(), fresh = pool.filter(function (x) { return ex.seen.indexOf(x.t) < 0; });
  if (!fresh.length) { ex.seen = []; fresh = pool; }
  var p = pick(fresh); ex.theme = p.t; ex.themeCat = p.c; ex.seen.push(p.t); ex.seen = ex.seen.slice(-150);
  exSave();
}
function exSave() { lsSet('ao_express', JSON.stringify(ex)); }
function exLoad() {
  try {
    var o = JSON.parse(lsGet('ao_express') || 'null');
    if (o && typeof o === 'object') {
      if (['setup', 'search', 'struct', 'speak'].indexOf(o.phase) >= 0) ex.phase = o.phase;
      if (EX_T.indexOf(o.T) >= 0) ex.T = o.T;
      if (o.cat === 'tous' || D.themeCats.some(function (c) { return c.id === o.cat; })) ex.cat = o.cat;
      if (typeof o.theme === 'string' && o.theme.length < 120) { ex.theme = o.theme; ex.themeCat = typeof o.themeCat === 'string' ? o.themeCat.slice(0, 20) : ''; }
      if (isFinite(+o.endAt)) ex.endAt = +o.endAt;
      if (typeof o.notes === 'string') ex.notes = o.notes.slice(0, 4000);
      if (Array.isArray(o.seen)) ex.seen = o.seen.filter(function (x) { return typeof x === 'string'; }).slice(-150);
    }
  } catch (e) {}
  if (!ex.theme) exDraw();
  if (ex.phase === 'search' || ex.phase === 'struct') exSync();
  if (ex.phase === 'speak') exEnterSpeak();
  if (ex.phase !== 'setup') st.type = 'express';
  window.AGORA_EX = { plan: exPlan, lab: exLab };
}
function exEnterSpeak() { var p = exPlan(ex.T); ex.phase = 'speak'; st.dur = p.speak; st.sujet = ex.theme; st.ended = false; st.recSec = 0; st.timerOn = false; }
function exSync() {
  var changed = false, p = exPlan(ex.T), now = Date.now();
  while ((ex.phase === 'search' || ex.phase === 'struct') && now >= ex.endAt) {
    ex.crossed = now - ex.endAt < 3000;
    if (ex.phase === 'search') { ex.phase = 'struct'; ex.endAt += p.struct * 1000; } else exEnterSpeak();
    changed = true;
  }
  return changed;
}
function exReset() { ex.phase = 'setup'; ex.notes = ''; exDraw(); }
function exTick() {
  if (ex.phase !== 'search' && ex.phase !== 'struct') return;
  if (exSync()) {
    exSave();
    if (ex.crossed) { beep(); try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {} }
    if (view.tab === 'studio' && st.type === 'express' && !view.sub && !st.rec) render();
    return;
  }
  var p = exPlan(ex.T), rem = Math.max(0, (ex.endAt - Date.now()) / 1000), tot = ex.phase === 'search' ? p.search : p.struct;
  var t = document.getElementById('exTmr'); if (t) t.textContent = fmt(Math.ceil(rem));
  var b = document.getElementById('exBar'); if (b) b.style.width = Math.min(100, Math.round(100 * (1 - rem / tot))) + '%';
}
setInterval(exTick, 500);
function exPhaseHtml() {
  var p = exPlan(ex.T), h = '';
  if (ex.phase === 'setup') {
    h += '<div class="card stack"><div class="eyebrow">Temps total de préparation</div><div class="row">' + EX_T.map(function (t) { return '<button class="chip' + (t === ex.T ? ' on' : '') + '" data-act="ex-T" data-v="' + t + '">' + t + ' min</button>'; }).join('') + '</div>';
    h += '<div class="pillars exp"><div class="pil"><b>' + exLab(p.search) + '</b><span class="small muted">Recherche</span></div><div class="pil"><b>' + exLab(p.struct) + '</b><span class="small muted">Structurer</span></div><div class="pil"><b>' + exLab(p.speak) + '</b><span class="small muted">Expliquer</span></div></div>';
    h += '<p class="muted small" style="margin:0">L’explication dure un cinquième du temps total, arrondi au quart de minute.</p></div>';
    h += '<div class="card stack"><div class="eyebrow">Thème</div><div class="hscroll"><button class="chip' + (ex.cat === 'tous' ? ' on' : '') + '" data-act="ex-cat" data-v="tous">Tous</button>' + D.themeCats.map(function (c) { return '<button class="chip' + (ex.cat === c.id ? ' on' : '') + '" data-act="ex-cat" data-v="' + c.id + '">' + esc(c.nom) + '</button>'; }).join('') + '</div>';
    h += '<h2 id="exTheme" class="exth">' + esc(ex.theme) + '</h2><div class="row"><button class="btn small ghost" data-act="ex-draw">Tirer au sort</button></div>';
    h += '<div class="row" style="flex-wrap:nowrap"><input type="text" id="exCustom" placeholder="Ou écris ton propre thème" maxlength="80"><button class="btn small ghost" data-act="ex-custom">Utiliser</button></div></div>';
    h += '<div class="callout small"><b>La règle.</b> Cherche dans des livres, des articles, Wikipédia ou tes cours. Pas d’assistant IA ni de résumé automatique : c’est ton tri qui t’entraîne. Quand le temps tombe, tu dois expliquer clairement en <b>' + exLab(p.speak) + '</b>.</div>';
    h += '<button class="btn" data-act="ex-start">Lancer la recherche · ' + exLab(p.search) + '</button>';
  } else if (ex.phase === 'search' || ex.phase === 'struct') {
    var S1 = ex.phase === 'search', rem = Math.max(0, (ex.endAt - Date.now()) / 1000), tot = S1 ? p.search : p.struct;
    h += '<div class="card stack"><div class="eyebrow">' + (S1 ? 'Phase 1 sur 3 · Recherche' : 'Phase 2 sur 3 · Structurer') + '</div><h2>' + esc(ex.theme) + '</h2>';
    h += '<div class="timer" id="exTmr" aria-live="off">' + fmt(Math.ceil(rem)) + '</div><div class="bar"><i id="exBar" style="width:' + Math.min(100, Math.round(100 * (1 - rem / tot))) + '%"></i></div>';
    h += '<div class="callout small">' + (S1
      ? 'Va à l’essentiel : une définition, deux ou trois chiffres ou faits clés, un exemple qui parle. Ne lis pas tout, trie. Pas d’IA.'
      : 'Ferme les onglets. Garde : <b>1 définition en une phrase</b>, <b>3 idées au maximum</b>, <b>1 exemple</b>, <b>1 conclusion</b>. Tout doit tenir en ' + exLab(p.speak) + ' : barre le reste.') + '</div>';
    h += '<textarea id="exNotes" placeholder="' + (S1 ? 'Note l’essentiel : mots-clés seulement.' : 'Ton plan : définition, 3 idées, exemple, conclusion.') + '" maxlength="4000" style="min-height:110px">' + esc(ex.notes) + '</textarea>';
    h += '<div class="row"><button class="btn small" data-act="ex-skip">' + (S1 ? 'Passer à la structuration' : 'Je suis prêt à expliquer') + '</button><button class="btn small ghost" data-act="ex-abort">Abandonner</button></div></div>';
  } else {
    h += '<div class="card stack"><div class="eyebrow">Phase 3 sur 3 · Expliquer en ' + exLab(p.speak) + '</div><h2>' + esc(ex.theme) + '</h2><p class="muted small" style="margin:0">Explique comme à quelqu’un qui ne connaît pas le sujet. Appuie sur REC quand tu es prêt : le chrono s’arrête tout seul.</p>';
    if (ex.notes.trim()) h += '<details><summary class="small">Voir mes notes</summary><pre class="brief">' + esc(ex.notes) + '</pre></details>';
    if (!st.rec && !st.timerOn) h += '<div class="row"><button class="btn small ghost" data-act="ex-abort">Recommencer avec un autre thème</button></div>';
    h += '</div>';
  }
  return h;
}
function exAfterRender() {
  var on = document.querySelector('#app .hscroll .chip.on'); if (on && on.parentNode && on.parentNode.scrollWidth > on.parentNode.clientWidth) on.parentNode.scrollLeft = Math.max(0, on.offsetLeft - on.parentNode.clientWidth / 2 + on.offsetWidth / 2);
  var n = document.getElementById('exNotes'); if (n) n.oninput = function () { ex.notes = n.value; clearTimeout(exAfterRender.t); exAfterRender.t = setTimeout(exSave, 400); };
}
function exSessionData(sig) {
  var p = exPlan(ex.T), actual = sig && sig.ok ? Math.round(sig.spanSec || sig.durationSec || 0) : Math.round(st.recSec || 0);
  return { theme: ex.theme, cat: ex.themeCat || '', T: ex.T, search: p.search, struct: p.struct, speak: p.speak, actual: actual, notes: ex.notes.slice(0, 4000), chk: [], xpd: [] };
}
function exBonus(rec) { return rec.ex ? 5 + (rec.ex.speak && rec.ex.actual >= rec.ex.speak * 0.8 ? 10 : 0) : 0; }
function exResultHtml(s) {
  var e = s.ex; if (!e) return '';
  var pct = e.speak ? Math.round(100 * e.actual / e.speak) : 0;
  var h = '<div class="card stack"><h3>Recherche express</h3>';
  h += m('Thème', esc(e.theme)) + m('Préparation', exLab(e.search) + ' de recherche · ' + exLab(e.struct) + ' pour structurer') + m('Explication visée', exLab(e.speak));
  h += m('Temps de parole utilisé', e.actual + ' s (' + pct + ' %)', pct >= 80 ? 'tag-ok' : 'tag-warn');
  h += '<p class="small muted" style="margin:0">' + (pct >= 80 ? 'Tu as bien rempli ton temps.' : pct >= 60 ? 'Il te restait un peu de temps : un exemple de plus aurait aidé.' : 'Tu as laissé beaucoup de temps : tu as peut-être trop résumé. Ajoute un exemple et une conclusion.') + '</p>';
  h += '<div class="eyebrow" style="margin-top:6px">Ton auto-évaluation</div>' + EX_CHK.map(function (t, i) { return '<label class="metric" style="align-items:center"><span><input type="checkbox" data-act="ex-chk" data-v="' + esc(s.id) + '|' + i + '"' + ((e.chk || []).indexOf(i) >= 0 ? ' checked' : '') + '> ' + esc(t) + '</span></label>'; }).join('');
  if (e.notes && e.notes.trim()) h += '<details><summary class="small">Mes notes de préparation</summary><pre class="brief">' + esc(e.notes) + '</pre></details>';
  h += '<button class="btn small ghost" style="align-self:flex-start" data-act="ex-proof" data-v="' + esc(e.theme) + '">Garder un fait avec sa source dans Preuves</button></div>';
  return h;
}
function exAct(act, v, el) {
  switch (act) {
    case 'ex-T': if (ex.phase === 'setup' && EX_T.indexOf(+v) >= 0) { ex.T = +v; exSave(); render(); } return true;
    case 'ex-cat': ex.cat = v; exDraw(); render(); return true;
    case 'ex-draw':
      var pool = exPool(), steps = 0, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { exDraw(); render(); return true; }
      (function spin() { var t = document.getElementById('exTheme'); if (!t) return; if (steps++ < 12) { t.textContent = pick(pool).t; setTimeout(spin, 55 + steps * 14); } else { exDraw(); render(); } })();
      return true;
    case 'ex-custom': var cv = (document.getElementById('exCustom').value || '').trim().slice(0, 80); if (cv.length < 2) { toast('Écris un thème d’au moins 2 lettres.'); return true; } ex.theme = cv; ex.themeCat = 'perso'; exSave(); render(); return true;
    case 'ex-start': var p = exPlan(ex.T); ex.phase = 'search'; ex.endAt = Date.now() + p.search * 1000; ex.notes = ''; exSave(); beep0(); render(); return true;
    case 'ex-skip':
      if (ex.phase === 'search') { ex.phase = 'struct'; ex.endAt = Date.now() + exPlan(ex.T).struct * 1000; } else if (ex.phase === 'struct') exEnterSpeak();
      exSave(); render(); return true;
    case 'ex-abort': exReset(); render(); return true;
    case 'ex-chk':
      var q = v.split('|'), s = byId(S.sessions, q[0]), i = +q[1]; if (!s || !s.ex || !(i >= 0 && i < EX_CHK.length)) return true;
      s.ex.chk = s.ex.chk || []; s.ex.xpd = s.ex.xpd || [];
      var at = s.ex.chk.indexOf(i);
      if (el.checked && at < 0) { s.ex.chk.push(i); if (s.ex.xpd.indexOf(i) < 0) { s.ex.xpd.push(i); addXp(3); } } else if (!el.checked && at >= 0) s.ex.chk.splice(at, 1);
      persist(); return true;
    case 'ex-resume': st.type = 'express'; if (ex.phase === 'speak') exEnterSpeak(); go('studio'); return true;
    case 'ex-proof': pwa.prefill = v; go('proofs'); return true;
  }
  return false;
}
