/* Objections pendant l'enregistrement : niveau 1 (au hasard, texte + voix optionnelle) et niveau 2 (selon ce que tu dis ou ne dis pas,
   par repérage de mots dans la transcription). Aucun envoi de données, aucune IA. */
var obj = { on: true, mode: 'rand', voice: false, fast: false };
var oRun = null;
function objLoad() { try { var o = JSON.parse(lsGet('ao_obj') || 'null'); if (o && typeof o === 'object') { obj.on = o.on !== false; obj.mode = o.mode === 'kw' ? 'kw' : 'rand'; obj.voice = !!o.voice; obj.fast = !!o.fast; } } catch (e) {} }
function objSave() { lsSet('ao_obj', JSON.stringify(obj)); }
function objKwOk() { return !!(SR_API && S.set && S.set.sr); }
function objPanelHtml() {
  var h = '<div class="card stack" id="objCard"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div><div class="eyebrow">Objections</div><h3 style="margin:0">Quelqu’un te coupe la parole</h3></div>';
  h += '<label class="sw"><input type="checkbox" data-act="obj-toggle"' + (obj.on ? ' checked' : '') + ' aria-label="Activer les objections"><span></span></label></div>';
  if (obj.on) {
    h += '<p class="muted small" style="margin:0">Pendant que tu parles, une objection apparaît. Réponds-y sans t’arrêter.</p>';
    h += '<div class="row"><button class="chip' + (obj.mode === 'rand' ? ' on' : '') + '" data-act="obj-mode" data-v="rand">Au hasard</button><button class="chip' + (obj.mode === 'kw' ? ' on' : '') + '" data-act="obj-mode" data-v="kw"' + (SR_API ? '' : ' disabled') + '>Selon ce que je dis</button></div>';
    if (obj.mode === 'kw') h += '<p class="muted small" style="margin:0">' + (objKwOk() ? 'L’objection réagit à tes mots (« toujours », « je pense que »…) et à ce qui manque (exemple, chiffre). Elle repère des mots, elle ne comprend pas le sens de ton argument.' : 'Demande la transcription automatique (Réglages).') + '</p>';
    if (window.speechSynthesis) h += '<label class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:10px"><input type="checkbox" data-act="obj-voice"' + (obj.voice ? ' checked' : '') + ' style="margin-top:4px"><span class="small"><b>Lire l’objection à voix haute</b><br><span class="muted">Voix de ton téléphone. L’enregistrement se met en pause pendant qu’elle parle, pour ne pas fausser l’analyse de ta voix.</span></span></label>';
  }
  return h + '</div>';
}
function objAct(a, v, el) {
  switch (a) {
    case 'obj-toggle': obj.on = !!el.checked; objSave(); render(); return true;
    case 'obj-mode':
      if (v === 'kw' && !SR_API) return true;
      if (v === 'kw' && !objKwOk()) { S.set = S.set || {}; S.set.sr = true; persist(); toast('Transcription automatique activée : le son est envoyé au service de reconnaissance de ton navigateur. Tu peux la couper dans Réglages.', true); }
      obj.mode = v === 'kw' ? 'kw' : 'rand'; objSave(); render(); return true;
    case 'obj-voice': obj.voice = !!el.checked; objSave(); if (obj.voice) objPrime(); return true;
  }
  return false;
}
function objVoice() {
  try { var vs = speechSynthesis.getVoices() || [], f = vs.filter(function (x) { return /^fr/i.test(x.lang); }); return f.filter(function (x) { return x.localService && /fr[-_]FR/i.test(x.lang); })[0] || f.filter(function (x) { return x.localService; })[0] || f[0] || null; } catch (e) { return null; }
}
function objPrime() { try { if (obj.voice && window.speechSynthesis) { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {} }
function objMute() { return !!(oRun && (oRun.speaking || Date.now() < oRun.muteUntil)); }
function objBox() {
  var b = byIdEl('objLive'); if (!b) { b = document.createElement('div'); b.id = 'objLive'; b.className = 'objlive'; b.setAttribute('role', 'status'); b.setAttribute('aria-live', 'assertive'); document.body.appendChild(b); }
  return b;
}
function objHide() { var b = byIdEl('objLive'); if (b && b.parentNode) b.parentNode.removeChild(b); }
function objScale(s) { return obj.fast ? s / 10 : s; }
function objMax() { var d = st.dur; return d <= 30 ? 1 : d <= 60 ? 2 : d <= 120 ? 3 : 5; }
function objStart() {
  if (!obj.on) { oRun = null; return; }
  oRun = { t0: Date.now(), n: 0, last: 0, timer: 0, hide: 0, speaking: false, muteUntil: 0, used: {}, log: [], fired: false, reps: {}, paused: false };
  var d = st.dur, first = Math.min(Math.max(10, d * (0.28 + Math.random() * 0.12)), Math.max(10, d - 10));
  oRun.timer = setTimeout(objDue, objScale(first) * 1000);
}
function objSec() { return oRun ? (Date.now() - oRun.t0) / 1000 : 0; }
function objDue() {
  if (!oRun || !st.rec || oRun.n >= objMax()) return;
  var q = obj.mode === 'kw' && objKwOk() ? objAbsence() : null;
  if (q) objFire(q.text, 'absent', ''); else objFire(pick(D.objections.generic), 'rand', '');
}
function objAbsence() {
  var tx = (st.transcript || '').toLowerCase(), O = D.objections;
  if (tx.length > 80 && !oRun.used.noex && !/\b(par exemple|prenons|exemple|imaginez|ainsi|quand j’|quand j'|un jour|hier)\b/.test(tx)) { oRun.used.noex = 1; return { text: pick(O.noExample) }; }
  if (tx.length > 140 && !oRun.used.nonum && !/\d|\b(pour cent|pourcent|million|milliard|millier)\b/.test(tx)) { oRun.used.nonum = 1; return { text: pick(O.noNumber) }; }
  return null;
}
function objSchedule() {
  if (!oRun || oRun.n >= objMax()) return;
  var left = st.dur - objSec(), wait = 22 + Math.random() * 14;
  if (left - wait < 8) return;
  clearTimeout(oRun.timer); oRun.timer = setTimeout(objDue, objScale(wait) * 1000);
}
function objOnText(chunk) {
  if (!oRun || obj.mode !== 'kw' || !st.rec || oRun.n >= objMax() || oRun.speaking) return;
  var now = objSec(); if (now < objScale(8) || (oRun.n && now - oRun.last < objScale(18))) return;
  var low = String(chunk || '').toLowerCase(), K = D.objections.kw;
  for (var i = 0; i < K.length; i++) {
    var r = K[i], m = low.match(new RegExp(r.re)); if (!m || oRun.used[r.id]) continue;
    if (r.rep) { oRun.reps[r.id] = (oRun.reps[r.id] || 0) + (low.match(new RegExp(r.re, 'g')) || []).length; if (oRun.reps[r.id] < r.rep) continue; }
    oRun.used[r.id] = 1; objFire(pick(r.lines).replace('{m}', m[1] || m[0]), 'kw', m[1] || m[0]); return;
  }
}
function objFire(text, kind, snip) {
  if (!oRun) return;
  clearTimeout(oRun.timer); clearTimeout(oRun.hide);
  oRun.n++; oRun.last = objSec(); oRun.log.push({ t: Math.round(objSec()), text: text, kind: kind, m: snip || '' });
  var b = objBox(); b.innerHTML = '<div class="eyebrow">Objection' + (kind === 'kw' ? ' · tirée de tes mots' : kind === 'absent' ? ' · ce que tu n’as pas dit' : '') + '</div><div class="otxt">' + esc(text) + '</div><div class="small" style="opacity:.8">Réponds sans t’arrêter.</div>';
  try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  var done = function () { if (!oRun) return; oRun.hide = setTimeout(objHide, objScale(5) * 1000); objSchedule(); };
  objSay(text, done);
}
function objSay(text, done) {
  if (!obj.voice || !window.speechSynthesis) { done(); return; }
  var fin = false, wasRec = !!(mr && mr.state === 'recording'), w = 0;
  var finish = function () { if (fin) return; fin = true; clearTimeout(w); if (wasRec) { try { if (mr && mr.state === 'paused') mr.resume(); } catch (e) {} } if (oRun) { oRun.speaking = false; oRun.muteUntil = Date.now() + 900; } done(); };
  try {
    if (wasRec) { try { mr.pause(); } catch (e) { wasRec = false; } }
    oRun.speaking = true;
    var u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; var v = objVoice(); if (v) u.voice = v; u.rate = 1;
    u.onend = finish; u.onerror = function () { toast('La voix est bloquée par le navigateur : l’objection reste affichée.', true); finish(); };
    w = setTimeout(finish, 14000);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { finish(); }
}
function objStop() {
  var log = oRun ? oRun.log : [];
  if (oRun) { clearTimeout(oRun.timer); clearTimeout(oRun.hide); }
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  try { if (oRun && mr && mr.state === 'paused') mr.resume(); } catch (e) {}
  oRun = null; objHide(); return log;
}
function objResultHtml(s) {
  if (!s.objs || !s.objs.length) return '';
  var h = '<div class="card stack"><h3>Objections reçues</h3>';
  s.objs.forEach(function (o) { h += '<div class="metric"><span><span class="muted small">' + esc(fmt(o.t || 0)) + '</span> · ' + esc(o.text) + '</span></div>'; });
  return h + '<p class="muted small" style="margin:0">Réécoute ton enregistrement : as-tu vraiment répondu à chaque objection ?</p></div>';
}
objLoad();
