var LOGO='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100.0" cy="22.0" r="11" fill="#C9A24B"/><circle cx="142.2" cy="34.4" r="11" fill="#C2391F"/><circle cx="171.0" cy="67.6" r="11" fill="#C2391F"/><circle cx="177.2" cy="111.1" r="11" fill="#C2391F"/><circle cx="158.9" cy="151.1" r="11" fill="#C2391F"/><circle cx="122.0" cy="174.8" r="11" fill="#C2391F"/><circle cx="78.0" cy="174.8" r="11" fill="#C2391F"/><circle cx="41.1" cy="151.1" r="11" fill="#C2391F"/><circle cx="22.8" cy="111.1" r="11" fill="#C2391F"/><circle cx="29.0" cy="67.6" r="11" fill="#C2391F"/><circle cx="57.8" cy="34.4" r="11" fill="#C2391F"/><circle cx="100" cy="100" r="27" fill="#C2391F"/></svg>';
(function () {
'use strict';
var D = window.AO_DATA, A = window.AO_ANALYSIS;
var root = document.getElementById('app');
var tabbar = document.getElementById('tabbar');
var LS = 'ao_state_v1';
var STANDALONE = !(window.claude && typeof window.claude.use === 'function');
var CAN_MIC = STANDALONE && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) && (location.protocol === 'https:' || location.hostname === 'localhost' || location.protocol === 'http:' && location.hostname === '127.0.0.1');
var SR_API = window.SpeechRecognition || window.webkitSpeechRecognition;

/* ---------- utilitaires ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function fmt(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
function durLabel(s) { return s < 60 ? s + ' s' : (s / 60) + ' min'; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
function today() { return new Date().toISOString().slice(0, 10); }

/* ---------- état + stockage ---------- */
var S = { goals: [], sessions: [], done: {}, quiz: {}, type: null, proofs: [], prep: [], erist: { best: 0 }, xp: 0, days: [], badges: [], why: null, angles: '', set: { sr: false }, since: 0, lastExport: 0 };
var cap = { db: null, sample: null, downloads: null, uid: null }; /* PWA : aucune IA, aucun service distant */
Object.freeze(cap); /* verrouillé : aucun appel IA possible depuis l’appli */
var saveTimer = null;
function loadLocal() { try { var r = localStorage.getItem(LS); if (r) merge(JSON.parse(r)); } catch (e) {} }
function merge(o) { for (var k in S) if (o && o[k] != null && typeof o[k] === typeof S[k]) S[k] = o[k]; }
function persist() {
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {}
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
  }, 800);
}
function touchDay() { var t = today(); if (S.days.indexOf(t) < 0) { S.days.push(t); S.days = S.days.slice(-120); } }
function streak() {
  var n = 0, d = new Date();
  for (;;) { var k = d.toISOString().slice(0, 10); if (S.days.indexOf(k) >= 0) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === today()) { d.setDate(d.getDate() - 1); } else break; }
  return n;
}
/*@@LEVELS@@*/
/*@@EXPRESS@@*/
/*@@GATE@@*/
/*@@PWA@@*/

/* ---------- navigation ---------- */
var TABS = [
  ['home', 'Accueil', '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
  ['studio', 'Studio', '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>'],
  ['course', 'Cours', '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6M20 4v14h-6"/>'],
  ['orators', 'Orateurs', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
  ['prep', 'Préparer', '<path d="M12 3v18M5 7h14M5 7l-2 7a3 3 0 0 0 6 0zM19 7l-2 7a3 3 0 0 0 6 0z"/>'],
  ['proofs', 'Preuves', '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>']
];
var view = { tab: 'home', sub: null };
function go(tab, sub) { view = { tab: tab, sub: sub || null }; render(); window.scrollTo(0, 0); }
function drawTabs() {
  tabbar.innerHTML = TABS.map(function (t) {
    return '<button data-act="tab" data-v="' + t[0] + '" class="' + (view.tab === t[0] ? 'on' : '') + '" aria-label="' + t[1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + t[2] + '</svg>' + t[1] + '</button>';
  }).join('');
}
function render() {
  drawTabs();
  var f = { home: vHome, studio: vStudio, course: vCourse, orators: vOrators, prep: vPrep, proofs: vProofs, settings: vSettings }[view.tab] || vHome;
  try { root.innerHTML = f(); } catch (e) { errLog.push('render: ' + (e && e.message)); root.innerHTML = '<div class="stack"><div class="card"><h3>Un écran n’a pas pu s’afficher</h3><p class="muted small">Tes données sont intactes.</p><button class="btn" data-act="tab" data-v="home">Retour à l’accueil</button></div></div>'; }
  if (view.tab === 'studio') studioAfterRender();
  pwaAfterRender();
}

/* ---------- conseils ---------- */
function nextLesson() { for (var i = 0; i < D.lessons.length; i++) if (!S.done[D.lessons[i].id]) return D.lessons[i]; return null; }
function recommend() {
  var last = S.sessions[0];
  if (!last) return { t: 'Fais ton premier enregistrement', d: 'Une minute sur une idée de ton choix suffit pour établir ta base.', go: ['studio'] };
  var a = last.sig, t = last.txt;
  if (t && t.fillers && t.fillers.per100 > 3) return { t: 'Réduis les tics', d: 'Dernière séance : ' + t.fillers.total + ' tics (' + t.fillers.per100 + ' pour 100 mots). Refais le même texte en les remplaçant par un silence.', go: ['course', 'c18'] };
  if (a && a.pauses && a.pauses.blank > 0) return { t: 'Travaille tes pauses', d: 'Tu as eu ' + a.pauses.blank + ' blanc(s) de plus de 2 s. Prépare tes transitions.', go: ['course', 'c18'] };
  if (a && a.pitch && a.pitch.sdSemitones < 2) return { t: 'Mets de la musique dans ta voix', d: 'Écart de hauteur : ' + a.pitch.sdSemitones + ' demi-tons (repère de l’appli : 2 à 4).', go: ['course', 'c19'] };
  if (a && a.endings && a.endings.risingShare > 0.4) return { t: 'Stabilise tes fins de phrase', d: 'Beaucoup de fins montantes : tes affirmations sonnent comme des questions.', go: ['course', 'c19'] };
  if (t && !t.planAnnounced) return { t: 'Annonce ton plan', d: 'Ouvre par « trois points : … » pour guider le public.', go: ['course', 'c5'] };
  var nx = nextLesson();
  if (nx) return { t: 'Continue le cours', d: 'Prochaine leçon : ' + nx.titre + '.', go: ['course', nx.id] };
  return { t: 'Passe à un format plus long', d: 'Ta dernière séance est correcte : essaie 2 minutes ou un discours.', go: ['studio'] };
}
function adviceList(sig, txt) {
  var out = [];
  if (txt && txt.ok) {
    if (txt.fillers.per100 > 3) out.push(['Tics', txt.fillers.total + ' tics détectés (' + txt.fillers.top.map(function (x) { return x[0] + ' ×' + x[1]; }).join(', ') + '). Remplace-les par un silence.']);
    if (txt.hedges.per100 > 3) out.push(['Atténuations', txt.hedges.total + ' formules qui adoucissent (« je pense que », « un peu »…). Garde-les pour les nuances utiles.']);
    if (txt.vague.total > 2) out.push(['Mots vagues', 'Remplace « ' + txt.vague.top.map(function (x) { return x[0]; }).join(' », « ') + ' » par un mot précis ou un chiffre.']);
    if (!txt.planAnnounced) out.push(['Plan', 'Aucune annonce de plan repérée. Essaie « trois raisons : … ».']);
    if (txt.evidence.total === 0) out.push(['Preuves', 'Pas de chiffre ni de source repérés. Ajoute un fait vérifiable.']);
    if (txt.closers > 0) out.push(['Conclusion', 'Ta fin s’éteint (« voilà », « c’est tout »…). Termine sur une phrase courte et ferme.']);
    if (txt.wpm && (txt.wpm < 110 || txt.wpm > 160)) out.push(['Débit', txt.wpm + ' mots/min (repère : 110 à 160).']);
  }
  if (sig && sig.ok) {
    if (sig.pauses.blank > 0) out.push(['Blancs', sig.pauses.blank + ' silence(s) de 2 s ou plus. Prépare tes transitions.']);
    if (sig.pitch && sig.pitch.sdSemitones < 2) out.push(['Voix plate', 'Écart de hauteur ' + sig.pitch.sdSemitones + ' demi-tons. Marque les mots clés par la hauteur ou le volume.']);
    if (sig.pitch && sig.pitch.sdSemitones > 4) out.push(['Voix très marquée', 'Écart ' + sig.pitch.sdSemitones + ' demi-tons : veille à garder des passages calmes.']);
    if (sig.endings.risingShare > 0.4) out.push(['Fins montantes', Math.round(sig.endings.risingShare * 100) + ' % de tes fins de phrase montent : tes affirmations sonnent comme des questions.']);
    if (sig.endings.fadingShare > 0.5) out.push(['Fins qui s’éteignent', 'Le volume baisse en fin de phrase. Soutiens jusqu’au dernier mot.']);
  }
  if (!out.length) out.push(['Bien joué', 'Rien d’alarmant selon les repères de l’appli. Passe à un exercice plus long ou plus difficile.']);
  return out.slice(0, 5);
}

/* ---------- ACCUEIL ---------- */
function vHome() {
  var r = recommend(), last = S.sessions[0];
  var doneN = D.lessons.filter(function (l) { return S.done[l.id]; }).length, total = D.lessons.length;
  var h = '<div class="brand"><span class="logo">'+LOGO+'</span><div><b>Agora</b><span>L’art oratoire · <i>by Stephen</i></span></div><button class="gear" data-act="settings" aria-label="Réglages"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div><div class="top"><div><h1>Bonjour, Stephen</h1></div><div class="pill">' + streak() + ' j · ' + S.xp + ' pts</div></div>';
  h += '<div class="stack">';
  h += homeBanners();
  h += '<button class="card tap" data-act="reco" data-v="' + esc(JSON.stringify(r.go)) + '"><div class="eyebrow">Prochaine étape</div><h3>' + esc(r.t) + '</h3><p class="muted small" style="margin:6px 0 0">' + esc(r.d) + '</p></button>';
  h += vRank();
  h += '<div class="card"><div class="row" style="justify-content:space-between"><h3>Cours</h3><span class="muted small">' + doneN + ' / ' + total + '</span></div><div class="bar" style="margin-top:8px"><i style="width:' + Math.round(100 * doneN / total) + '%"></i></div></div>';
  if (last) {
    h += '<div class="card"><div class="eyebrow">Dernière séance · ' + esc(last.date) + '</div><h3>' + esc(last.sujet) + '</h3>' + pillarsHtml(last.pil) + '<div class="row" style="margin-top:10px"><button class="btn small ghost" data-act="open-session" data-v="' + esc(last.id) + '">Revoir</button></div></div>';
  }
  h += homeDaily();
  h += goalsHtml();
  h += vBadges();
  h += '<div class="card"><h3>Historique</h3>' + (S.sessions.length ? S.sessions.slice(0, 8).map(function (s) {
    return '<button class="metric" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer" data-act="open-session" data-v="' + esc(s.id) + '"><span>' + esc(s.date) + ' · ' + esc(s.sujet) + '</span><b class="muted small">' + (s.pil && s.pil.logos != null ? s.pil.logos : '–') + '/' + (s.pil && s.pil.ethos != null ? s.pil.ethos : '–') + '/' + (s.pil && s.pil.pathos != null ? s.pil.pathos : '–') + '</b></button>';
  }).join('') + '<p class="muted small" style="margin:8px 0 0">Colonnes : Logos / Ethos / Pathos.</p>' : '<p class="muted">Aucune séance pour l’instant.</p>') + '</div>';
  h += whyHtml();
  h += '</div>';
  return h;
}
function goalsHtml() {
  var h = '<div class="card"><h3>Objectifs</h3>';
  h += S.goals.length ? S.goals.map(function (g) {
    return '<label class="metric" style="align-items:center"><span><input type="checkbox" data-act="goal-toggle" data-v="' + g.id + '"' + (g.done ? ' checked' : '') + '> ' + (g.done ? '<s>' + esc(g.t) + '</s>' : esc(g.t)) + '</span><button class="chip" data-act="goal-del" data-v="' + g.id + '" aria-label="Supprimer">×</button></label>';
  }).join('') : '<p class="muted small">Ex. : « Zéro blanc de plus de 2 s » ou « 5 séances cette semaine ».</p>';
  h += '<div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" id="goalIn" placeholder="Nouvel objectif" maxlength="80"><button class="btn small" data-act="goal-add">Ajouter</button></div></div>';
  return h;
}
function pillarsHtml(p) {
  if (!p) return '';
  function c(l, v, col) { return '<div class="pil"><b style="color:' + col + '">' + (v == null ? '–' : v) + '</b><span class="small muted">' + l + '</span></div>'; }
  return '<div class="pillars" style="margin-top:8px">' + c('Logos', p.logos, 'var(--logos)') + c('Ethos', p.ethos, 'var(--ethos)') + c('Pathos', p.pathos, 'var(--pathos)') + '</div>';
}

/* ---------- STUDIO ---------- */
var st = { type: 'argumenter', dur: 60, sujet: null, rec: null, blob: null, audio: null, transcript: '', status: '', busy: false, result: null, recSec: 0, recMs: 0, recog: null, lastSpan: null, steps: false };
function newSubject() {
  if (st.type === 'express') { st.sujet = ex.theme; return; }
  if (st.type === 'mot') { st.sujet = pick(D.wordBank); return; }
  var t = byId(D.exerciseTypes, st.type); st.sujet = pick(t.sujets);
}
function vStudio() {
  if (view.sub && view.sub.result) return vResult(view.sub.result);
  if (!st.sujet) newSubject();
  var t = byId(D.exerciseTypes, st.type);
  var h = '<div class="top"><h1>Studio</h1></div><div class="stack">';
  h += exHero();
  h += '<div class="card stack"><div class="eyebrow">Exercice</div><div class="hscroll">' + exOrdered().map(function (x) { return '<button class="chip' + (x.id === st.type ? ' on' : '') + (x.id === 'express' ? ' hot' : '') + '" data-act="st-type" data-v="' + x.id + '">' + esc(x.nom) + '</button>'; }).join('') + '</div>';
  if (st.type !== 'express') h += '<div class="row">' + D.durations.map(function (d) { return '<button class="chip' + (d === st.dur ? ' on' : '') + '" data-act="st-dur" data-v="' + d + '">' + durLabel(d) + '</button>'; }).join('') + '</div>';
  if (st.type !== 'express') h += '<div><div class="eyebrow">' + (st.type === 'mot' ? 'Ton mot' : 'Sujet') + '</div><h2>' + esc(st.sujet) + '</h2><div class="row" style="margin-top:6px"><button class="btn small ghost" data-act="st-new">' + (st.type === 'mot' ? 'Tirer au sort un autre mot' : 'Autre sujet') + '</button></div></div>';
  h += '<div class="callout"><b>' + esc(t.modele) + '</b> — ' + esc(t.aide) + '</div>';
  h += exLevelHtml(st.type);
  if (st.type === 'discours') h += '<div class="small">' + D.speechSteps.map(function (s, i) { return '<div class="metric"><span>' + (i + 1) + '. <b>' + esc(s.nom) + '</b> — ' + esc(s.objectif) + '</span></div>'; }).join('') + '</div>';
  h += '</div>';
  if (st.type === 'express') { h += exPhaseHtml(); if (ex.phase !== 'speak') return h + '</div>'; }
  h += '<div class="card stack" id="recCard">' + recHtml() + '</div>';
  h += '<div class="card stack" id="recLib"></div>';
  h += '<div class="card stack"><div class="eyebrow">Transcription (pour analyser les mots)</div><textarea id="trIn" placeholder="' + (SR_API && CAN_MIC && S.set && S.set.sr ? 'Elle se remplit pendant l’enregistrement (transcription en ligne activée). Tu peux la corriger.' : 'Écris ou colle ici le texte de ce que tu as dit. Sans texte, seule la voix est analysée.') + '">' + esc(st.transcript) + '</textarea></div>';
  h += '<button class="btn" id="goAnalyse" data-act="analyse"' + ((st.blob || st.transcript.trim()) ? '' : ' disabled') + '>Analyser</button><div id="stStatus" class="muted small">' + esc(st.status) + '</div>';
  h += '</div>';
  return h;
}
function remainLabel() { var r = st.timerOn ? Math.max(0, st.dur - st.recSec) : (st.ended ? 0 : st.dur); return fmt(Math.ceil(r)); }
function timerHtml() {
  return '<div class="timer' + (st.ended ? ' ended' : '') + '" id="tmr" aria-live="off">' + remainLabel() + '</div><div class="bar"><i id="tmrBar" style="width:' + Math.min(100, Math.round(100 * (st.recSec || 0) / st.dur)) + '%"></i></div><div class="small muted" id="tmrMsg" style="text-align:center">' + (st.ended ? 'Temps écoulé.' : 'Durée choisie : ' + durLabel(st.dur)) + '</div>';
}
function recHtml() {
  var h = timerHtml();
  if (CAN_MIC) {
    h += '<button class="rec' + (st.rec ? ' live' : '') + '" data-act="rec-toggle" aria-label="' + (st.rec ? 'Arrêter' : 'Enregistrer') + '">' + (st.rec ? 'Stop' : 'REC') + '</button>';
    h += '<p class="muted small" style="text-align:center;margin:0">' + esc(D.recordTips.standalone) + ' L’enregistrement s’arrête tout seul quand le temps est écoulé.</p>';
  } else {
    h += '<button class="btn" data-act="chrono-toggle">' + (st.timerOn ? 'Arrêter le chrono' : 'Démarrer le chrono') + '</button>';
    h += '<p class="muted small" style="margin:0">' + esc(D.recordTips.artifact) + ' Lance le chrono ici, puis le Dictaphone : un bip sonne quand le temps est écoulé.</p>';
  }
  h += '<div class="row"><label class="btn ghost small" style="cursor:pointer">Importer un enregistrement<input type="file" id="fileIn" accept="audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.webm,.caf" hidden></label>';
  if (st.blob) h += '<span class="pill">Audio prêt · ' + (st.audioLen ? fmt(st.audioLen) : '') + '</span>';
  h += '</div>';
  return h;
}
var beepCtx = null;
function beep0() { try { var C = window.AudioContext || window.webkitAudioContext; if (C) { beepCtx = beepCtx || new C(); if (beepCtx.resume) beepCtx.resume(); } } catch (e) {} }
function beep() {
  try {
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return; beepCtx = beepCtx || new C(); if (beepCtx.resume) beepCtx.resume();
    [0, 0.25, 0.5].forEach(function (d, i) {
      var o = beepCtx.createOscillator(), g = beepCtx.createGain(); o.frequency.value = i === 2 ? 880 : 660; o.connect(g); g.connect(beepCtx.destination);
      var t = beepCtx.currentTime + d; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.start(t); o.stop(t + 0.22);
    });
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
}
function startTimer() {
  clearInterval(tick); st.timerOn = true; st.ended = false; st.recSec = 0; st.recMs = Date.now();
  tick = setInterval(function () {
    st.recSec = (Date.now() - st.recMs) / 1000;
    var e = document.getElementById('tmr'); if (e) e.textContent = fmt(Math.ceil(Math.max(0, st.dur - st.recSec)));
    var b = document.getElementById('tmrBar'); if (b) b.style.width = Math.min(100, Math.round(100 * st.recSec / st.dur)) + '%';
    if (st.recSec >= st.dur) { endTimer(true); }
  }, 200);
}
function endTimer(timeUp) {
  clearInterval(tick); tick = null; st.timerOn = false;
  if (timeUp) { st.ended = true; st.recSec = st.dur; beep(); }
  if (st.rec) stopRec(); else refreshRec();
}
function studioAfterRender() {
  exAfterRender();
  var f = document.getElementById('fileIn'); if (f) f.onchange = function () { if (f.files && f.files[0]) setBlob(f.files[0]); };
  var t = document.getElementById('trIn'); if (t) t.oninput = function () { st.transcript = t.value; var b = document.getElementById('goAnalyse'); if (b) b.disabled = !(st.blob || st.transcript.trim()); };
}
function setStatus(s) { st.status = s; var e = document.getElementById('stStatus'); if (e) e.textContent = s; }
function setBlob(b) {
  st.blob = b; st.audioLen = 0; setStatus('Lecture du fichier…');
  var r = new FileReader();
  r.onload = function () {
    decode(r.result).then(function (buf) { st.pcm = buf; st.audioLen = buf.length / 16000; setStatus('Fichier prêt (' + fmt(st.audioLen) + ').'); refreshRec(); })
      .catch(function () { st.blob = null; st.pcm = null; setStatus('Ce format audio n’est pas lisible ici. Exporte en M4A, MP3 ou WAV.'); refreshRec(); });
  };
  r.onerror = function () { setStatus('Fichier illisible.'); };
  r.readAsArrayBuffer(b);
}
function refreshRec() { var c = document.getElementById('recCard'); if (c) { c.innerHTML = recHtml(); studioAfterRender(); } var b = document.getElementById('goAnalyse'); if (b) b.disabled = !(st.blob || st.transcript.trim()); }
function decode(ab) {
  var Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  var ctx = new Ctx(1, 1, 16000);
  return new Promise(function (res, rej) {
    var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej);
  }).then(function (buf) {
    var ch = buf.getChannelData(0);
    if (buf.numberOfChannels > 1) { var o = new Float32Array(ch.length), c2 = buf.getChannelData(1); for (var i = 0; i < ch.length; i++) o[i] = (ch[i] + c2[i]) / 2; return o; }
    return new Float32Array(ch);
  });
}
var mr = null, chunks = [], stream = null, tick = null;
function startRec() {
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
    stream = s; chunks = []; st.transcript = ''; st.blob = null; st.pcm = null; st.audioId = null;
    mr = pwaRecorder(s);
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () { s.getTracks().forEach(function (t) { t.stop(); }); var bb = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); setBlob(bb); pwaSaveRec(bb); };
    mr.start(); st.rec = true; startTimer();
    if (SR_API && S.set && S.set.sr) {
      try {
        var rc = new SR_API(); rc.lang = 'fr-FR'; rc.continuous = true; rc.interimResults = false;
        rc.onresult = function (ev) { var t = ''; for (var i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript + ' '; st.transcript = (st.transcript + ' ' + t).trim(); var ta = document.getElementById('trIn'); if (ta) ta.value = st.transcript; };
        rc.onend = function () { if (st.rec) { try { rc.start(); } catch (e) {} } };
        rc.start(); st.recog = rc;
      } catch (e) { st.recog = null; }
    }
    refreshRec();
  }).catch(function () { setStatus('Micro refusé ou indisponible. Importe un enregistrement à la place.'); });
}
function stopRec() { st.rec = false; clearInterval(tick); tick = null; st.timerOn = false; try { if (st.recog) st.recog.stop(); } catch (e) {} st.recog = null; try { mr.stop(); } catch (e) {} refreshRec(); }

function doAnalyse() {
  if (st.busy) return; st.busy = true;
  var b = document.getElementById('goAnalyse'); if (b) b.disabled = true;
  var txt = st.transcript.trim();
  function finish(sig) {
    var dur = sig && sig.ok ? sig.spanSec || sig.durationSec : (st.recSec || null);
    var t = txt ? A.analyzeText(txt, dur) : null;
    if (t && !t.ok) t = null;
    if (!sig && !t) { setStatus('Il me faut un audio ou un texte.'); st.busy = false; return; }
    if (sig && !sig.ok) {
      setStatus(sig.reason === 'trop_court' ? 'Enregistrement trop court (moins de quelques secondes).' : 'Aucune voix détectée dans le fichier.');
      if (!t) { st.busy = false; if (b) b.disabled = false; return; }
      sig = null;
    }
    var pil = A.pillars(sig, t);
    var exd = st.type === 'express' ? exSessionData(sig) : null;
    var rec = { id: uid(), ex: exd || undefined, audioId: st.audioId || null, date: today(), sujet: st.sujet, type: st.type, dur: st.dur, sig: sig ? slim(sig) : null, txt: t, transcript: txt, pil: pil };
    var lvBefore = exLevel(st.type).lvl;
    S.sessions.unshift(rec); S.sessions = S.sessions.slice(0, 200);
    var lvAfter = exLevel(st.type);
    touchDay(); addXp(10 + exBonus(rec) + (sig ? 10 : 0) + (t ? 5 : 0) + (st.type === 'connecteurs' && t && t.steps ? t.steps.count * 3 : 0)); autoGoals();
    if (lvAfter.lvl > lvBefore) toast('Niveau ' + lvAfter.lvl + ' : ' + lvAfter.name + ' · ' + byId(D.exerciseTypes, st.type).nom, true);
    persist();
    st.busy = false; st.blob = null; st.pcm = null; st.audioId = null; if (rec.ex) exReset(); st.transcript = ''; st.recSec = 0; st.ended = false; st.timerOn = false; st.status = '';
    view = { tab: 'studio', sub: { result: rec.id } }; render(); window.scrollTo(0, 0);
  }
  if (st.pcm) {
    setStatus('Analyse en cours…');
    A.analyzeSignal(st.pcm, { onProgress: function (p) { setStatus('Analyse en cours… ' + Math.round(p * 100) + ' %'); } }).then(finish).catch(function () { setStatus('Analyse impossible sur ce fichier.'); st.busy = false; });
  } else finish(null);
}
function slim(sig) { var s = JSON.parse(JSON.stringify(sig)); s.pauses.list = s.pauses.list.slice(0, 12); return s; }
function autoGoals() { /* les objectifs sont cochés à la main */ }

/* ---------- RÉSULTATS ---------- */
function chart(vals, kind) {
  var n = vals.length; if (n < 2) return '';
  var W = 300, H = 100, min = Infinity, max = -Infinity, i;
  for (i = 0; i < n; i++) if (vals[i] != null) { min = Math.min(min, vals[i]); max = Math.max(max, vals[i]); }
  if (!isFinite(min)) return '';
  if (kind === 'pitch') { min = Math.min(min, -4); max = Math.max(max, 4); } else { min = 0; max = 1; }
  var pts = [], d = '';
  for (i = 0; i < n; i++) {
    if (vals[i] == null || (kind === 'env' && vals[i] === 0)) { pts.push(null); continue; }
    pts.push([i / (n - 1) * W, H - (vals[i] - min) / (max - min || 1) * H]);
  }
  var started = false;
  pts.forEach(function (p) { if (!p) { started = false; return; } d += (started ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); started = true; });
  var zero = kind === 'pitch' ? '<line x1="0" x2="' + W + '" y1="' + (H - (0 - min) / (max - min) * H) + '" y2="' + (H - (0 - min) / (max - min) * H) + '" stroke="var(--line)" stroke-dasharray="3 3"/>' : '';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">' + zero + '<path d="' + d + '" fill="none" stroke="' + (kind === 'pitch' ? 'var(--accent)' : 'var(--logos)') + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
}
function m(label, val, cls) { return '<div class="metric"><span>' + label + '</span><b class="' + (cls || '') + '">' + val + '</b></div>'; }
function vResult(id) {
  var s = byId(S.sessions, id);
  if (!s) return '<p>Séance introuvable.</p><button class="btn" data-act="back">Retour</button>';
  var a = s.sig, t = s.txt, h = '<div class="top"><div><div class="eyebrow">' + esc(s.date) + ' · ' + esc(durLabel(s.dur)) + '</div><h1>Résultat</h1></div><button class="btn small ghost" data-act="back">Fermer</button></div><div class="stack">';
  h += '<div class="card"><h3>' + esc(s.sujet) + '</h3>' + pillarsHtml(s.pil) + '<p class="muted small" style="margin:10px 0 0">Indices de 0 à 100 calculés par l’appli à partir de ta voix et de ton texte. Ils orientent ton travail ; ils ne mesurent pas l’effet réel sur un public.</p>' + ((s.pil.partial || []).length ? '<p class="small tag-warn">Non calculé faute de données : ' + s.pil.partial.join(', ') + '.</p>' : '') + '</div>';
  h += exResultHtml(s);
  h += '<div class="card"><h3>À travailler en premier</h3>' + adviceList(a, t).map(function (x) { return '<div class="metric"><span><b>' + esc(x[0]) + '</b><br><span class="muted small">' + esc(x[1]) + '</span></span></div>'; }).join('') + '</div>';
  if (a) {
    h += '<div class="card"><h3>Voix</h3>';
    h += m('Durée (parole)', fmt(a.spanSec) + ' · ' + a.speechSec + ' s de voix');
    if (a.pitch) h += m('Hauteur médiane', a.pitch.medianHz + ' Hz') + m('Variation de hauteur', a.pitch.sdSemitones + ' demi-tons', a.pitch.sdSemitones < 2 ? 'tag-warn' : 'tag-ok') + m('Étendue (p10–p90)', a.pitch.rangeSemitones + ' demi-tons');
    h += m('Variation de volume', a.volume.sdDb + ' dB');
    h += m('Débit syllabique', a.rhythm.syllPerSec + ' syll/s');
    h += m('Pauses', a.pauses.count + ' (courtes ' + a.pauses.short + ' · longues ' + a.pauses.long + ' · blancs ' + a.pauses.blank + ')', a.pauses.blank ? 'tag-warn' : '') + m('Plus longue pause', a.pauses.longest + ' s');
    h += m('Fins montantes', Math.round(a.endings.risingShare * 100) + ' %') + m('Fins qui s’éteignent', Math.round(a.endings.fadingShare * 100) + ' %');
    h += '<p class="muted small" style="margin:8px 0 0">Repères de l’appli (pas des normes scientifiques) : variation de hauteur &lt; 2 plat, 2–4 vivant, &gt; 4 très marqué.</p></div>';
    h += '<div class="card"><h3>Courbe de hauteur</h3><p class="muted small">Écart à ta hauteur médiane, en demi-tons, sur toute la durée.</p>' + chart(a.series.pitch, 'pitch') + '<h3 style="margin-top:12px">Énergie de la voix</h3>' + chart(a.series.env, 'env') + '</div>';
  }
  if (t) {
    h += '<div class="card"><h3>Mots</h3>';
    h += m('Mots', t.words + (t.wpm ? ' · ' + t.wpm + ' mots/min' : ''), t.wpm && (t.wpm < 110 || t.wpm > 160) ? 'tag-warn' : '');
    h += m('Tics', t.fillers.total + (t.fillers.top.length ? ' (' + t.fillers.top.map(function (x) { return x[0] + ' ×' + x[1]; }).join(', ') + ')' : ''), t.fillers.per100 > 3 ? 'tag-bad' : '');
    h += m('Atténuations', t.hedges.total) + m('Mots vagues', t.vague.total) + m('Connecteurs logiques', t.connectors.total) + m('Preuves (chiffres, sources)', t.evidence.total) + m('Marqueurs de récit', t.story.total);
    h += m('Annonce du plan', t.planAnnounced ? 'oui' : 'non', t.planAnnounced ? 'tag-ok' : 'tag-warn') + m('Questions posées', t.questions) + m('Je / vous-nous', t.address.je + ' / ' + t.address.vous);
    if (t.repeats && t.repeats.length) h += m('Mots répétés', esc(t.repeats.join(', ')));
    h += '</div>';
    if (s.type === 'connecteurs') h += stepsHtml(t);
    h += '<div class="card"><h3>Ta transcription</h3><p class="small"><mark class="tic">tic</mark> <mark class="att">atténuation</mark> <mark class="vag">mot vague</mark></p><p style="line-height:1.8">' + A.markTics(s.transcript).map(function (p) { return p.k ? '<mark class="' + p.k + '">' + esc(p.t) + '</mark>' : esc(p.t); }).join('') + '</p></div>';
  }
  h += coachBox(s);
  h += '<div class="row"><button class="btn" data-act="again">Refaire</button><button class="btn ghost" data-act="back">Terminer</button><button class="btn ghost small" data-act="sess-del" data-v="' + s.id + '">Supprimer la séance</button></div></div>';
  return h;
}
function aiHtml(ai) {
  return '<div class="callout"><p><b>Point fort.</b> ' + esc(ai.fort) + '</p><p><b>À corriger d’abord.</b> ' + esc(ai.priorite) + '</p><p style="margin:0"><b>Exercice.</b> ' + esc(ai.exercice) + '</p></div>';
}
/* ---------- COURS ---------- */
var quizState = null;
function vCourse() {
  if (view.sub === 'erist') return vErist();
  if (view.sub === 'erist-quiz') return vEristQuiz();
  if (view.sub) return vLesson(view.sub);
  var h = '<div class="top"><h1>Cours</h1><span class="pill">' + D.lessons.filter(function (l) { return S.done[l.id]; }).length + ' / ' + D.lessons.length + '</span></div>';
  h += '<div class="callout info" style="margin-bottom:14px">Les chapitres 1 à 15 reprennent ton Tome I. Les chapitres 16 à 48, les leçons « Argumenter » et les bonus suivent le plan de ton livre ; ils sont rédigés par l’appli à partir des sources citées et seront à remplacer par tes Tomes II et III.</div><div class="stack">';
  var lastTome = '';
  D.modules.forEach(function (mo) {
    var ls = D.lessons.filter(function (l) { return l.m === mo.id; }); if (!ls.length) return;
    if (mo.tome !== lastTome) { h += '<div class="eyebrow" style="margin-top:8px">' + esc(mo.tome) + '</div>'; lastTome = mo.tome; }
    var dn = ls.filter(function (l) { return S.done[l.id]; }).length;
    h += '<div class="card"><div class="row" style="justify-content:space-between"><h3>' + esc(mo.titre) + '</h3><span class="muted small">' + dn + ' / ' + ls.length + '</span></div><p class="muted small" style="margin:2px 0 6px">' + esc(mo.sous) + '</p>';
    ls.forEach(function (l) {
      h += '<button class="metric" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer" data-act="lesson" data-v="' + l.id + '"><span>' + (S.done[l.id] ? '✓ ' : '') + '<span class="muted">' + esc(l.n) + '.</span> ' + esc(l.titre) + '</span><span class="muted small">' + l.min + ' min</span></button>';
    });
    if (mo.id === 'er') h += '<div class="row" style="margin-top:10px"><button class="btn small ghost" data-act="erist-open">Les 38 fiches</button><button class="btn small ghost" data-act="erist-quiz">Quiz global</button></div>';
    h += '</div>';
  });
  return h + '</div>';
}
function box(cls, label, body) { return '<div class="box ' + cls + '"><b>' + label + '</b><div>' + body + '</div></div>'; }
function vLesson(id) {
  var l = byId(D.lessons, id); if (!l) return '';
  var idx = D.lessons.indexOf(l), prev = D.lessons[idx - 1], next = D.lessons[idx + 1];
  var h = '<div class="top"><button class="btn small ghost" data-act="course-back">← Cours</button><span class="pill">' + l.min + ' min</span></div><div class="stack">';
  h += '<div><div class="eyebrow">' + (l.src === 'schop' ? 'Éristique ' : l.m === 'cx' ? 'Atelier ' : 'Chapitre ') + esc(l.n) + (l.src === 'livre' ? ' · ton Tome I' : l.src === 'schop' ? ' · d’après Schopenhauer, reformulé par l’appli' : ' · rédigé par l’appli') + '</div><h1>' + esc(l.titre) + '</h1></div>';
  if (l.accroche) h += '<p class="lead">' + esc(l.accroche) + '</p>';
  h += '<div class="card prose">' + l.sections.map(function (sec) { return '<h3>' + esc(sec.h) + '</h3>' + sec.p.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }).join('') + '</div>';
  if (l.retenir) h += box('b-ret', 'À retenir', '<ul>' + l.retenir.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
  if (l.erreur) h += box('b-err', 'Erreur fréquente', esc(l.erreur));
  if (l.methode) h += box('b-met', 'Méthode rapide', esc(l.methode));
  if (l.exercice) h += box('b-exo', 'Exercice', esc(l.exercice) + '<div style="margin-top:8px"><button class="btn small" data-act="go-studio">Aller au Studio</button></div>');
  h += '<div class="card" id="quizBox">' + quizHtml(l) + '</div>';
  if (l.sources && l.sources.length) h += '<div class="small muted">Sources : ' + l.sources.map(function (s) { return s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>' : esc(s.t); }).join(' · ') + '</div>';
  if (S.done[l.id] || S.quiz[l.id] != null) h += '<div class="row"><button class="btn small ghost" data-act="lesson-reset" data-v="' + l.id + '">Refaire cette leçon (progression gardée 24 h dans la corbeille)</button></div>';
  h += '<div class="row" style="justify-content:space-between">' + (prev ? '<button class="btn small ghost" data-act="lesson" data-v="' + prev.id + '">← ' + esc(prev.titre).slice(0, 28) + '</button>' : '<span></span>') + (next ? '<button class="btn small ghost" data-act="lesson" data-v="' + next.id + '">' + esc(next.titre).slice(0, 28) + ' →</button>' : '') + '</div>';
  return h + '</div>';
}
function quizHtml(l) {
  if (!quizState || quizState.id !== l.id) quizState = { id: l.id, i: 0, score: 0, ans: null };
  var q = l.quiz[quizState.i];
  if (!q) {
    return '<h3>Quiz terminé</h3><p>Score : ' + quizState.score + ' / ' + l.quiz.length + '</p><button class="btn small" data-act="quiz-reset">Refaire</button>';
  }
  var h = '<div class="eyebrow">Question ' + (quizState.i + 1) + ' / ' + l.quiz.length + '</div><h3>' + esc(q.q) + '</h3>';
  q.o.forEach(function (o, i) {
    var c = '';
    if (quizState.ans != null) c = i === q.a ? ' good' : (i === quizState.ans ? ' badc' : '');
    h += '<button class="opt' + c + '" data-act="quiz-ans" data-v="' + i + '"' + (quizState.ans != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
  });
  if (quizState.ans != null) h += '<p class="small" style="margin-top:10px">' + esc(q.e) + '</p><button class="btn small" data-act="quiz-next">Suivant</button>';
  return h;
}
function quizAnswer(i) {
  var l = byId(D.lessons, quizState.id), q = l.quiz[quizState.i];
  if (quizState.ans != null) return; quizState.ans = i; if (i === q.a) quizState.score++;
  document.getElementById('quizBox').innerHTML = quizHtml(l);
}
function quizNext() {
  var l = byId(D.lessons, quizState.id); quizState.i++; quizState.ans = null;
  if (quizState.i >= l.quiz.length) {
    if (!S.done[l.id]) { var md0 = modulesDone().length; S.done[l.id] = today(); touchDay(); addXp(15); if (modulesDone().length > md0) { addXp(30); toast('Module validé !', true); } persist(); }
    S.quiz[l.id] = Math.max(S.quiz[l.id] || 0, quizState.score); persist();
  }
  document.getElementById('quizBox').innerHTML = quizHtml(l);
}

/* ---------- ORATEURS ---------- */
var oFilter = 'Tous', typeQ = null;
function vOrators() {
  if (view.sub === 'type') return vType();
  if (view.sub) return vOrator(view.sub);
  var tags = ['Tous'], i;
  D.orators.forEach(function (o) { o.tags.forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
  var h = '<div class="top"><h1>Orateurs</h1></div><div class="stack">';
  var A2 = S.type ? D.archetypes[S.type] : null;
  h += '<button class="card tap" data-act="type-open"><div class="eyebrow">Ton type d’orateur</div><h3>' + (A2 ? esc(A2.nom) : 'Découvrir mon type') + '</h3><p class="muted small" style="margin:6px 0 0">' + (A2 ? esc(A2.formule) + ' · refaire le test' : '8 questions. Modèle propre à l’appli, pas une typologie scientifique.') + '</p></button>';
  h += '<div class="hscroll">' + tags.map(function (t) { return '<button class="chip' + (oFilter === t ? ' on' : '') + '" data-act="o-filter" data-v="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
  D.orators.filter(function (o) { return oFilter === 'Tous' || o.tags.indexOf(oFilter) >= 0; }).forEach(function (o) {
    h += '<button class="card tap" data-act="orator" data-v="' + o.id + '"><div class="eyebrow">' + esc(o.epoque) + ' · ' + esc(o.lieu) + '</div><h3>' + esc(o.nom) + '</h3><p class="muted small" style="margin:4px 0 0">' + esc(o.discours.titre) + ' · ' + esc(D.archetypes[o.archetype].nom) + '</p></button>';
  });
  h += '<div class="small muted">Les « techniques » et l’archétype associé à chaque orateur sont une lecture pédagogique de l’appli.</div></div>';
  return h;
}
function vOrator(id) {
  var o = byId(D.orators, id); if (!o) return '';
  var ar = D.archetypes[o.archetype];
  var h = '<div class="top"><button class="btn small ghost" data-act="orators-back">← Orateurs</button></div><div class="stack">';
  h += '<div><div class="eyebrow">' + esc(o.epoque) + ' · ' + esc(o.lieu) + '</div><h1>' + esc(o.nom) + '</h1></div>';
  h += '<div class="card"><div class="eyebrow">' + esc(o.genre) + '</div><h3>' + esc(o.discours.titre) + '</h3><p class="muted small">' + esc(o.discours.date) + ' · ' + esc(o.discours.cadre) + '</p><p>' + esc(o.contexte) + '</p><p class="muted small" style="margin:0">' + esc(o.parcours) + '</p></div>';
  if (o.oeuvres) h += '<div class="card"><h3>Ses livres</h3>' + o.oeuvres.map(function (w) { return '<p style="margin:0 0 8px"><b>' + esc(w.titre) + '</b> <span class="muted small">(' + esc(w.date) + ')</span>' + (w.note ? '<br><span class="small">' + esc(w.note) + '</span>' : '') + '</p>'; }).join('') + '</div>';
  if (o.id === 'schopenhauer') h += '<button class="btn" data-act="lesson" data-v="e0">Suivre le cours sur ses 38 stratagèmes</button>';
  h += '<div class="card"><h3>Ce qu’on peut en apprendre</h3>' + o.techniques.map(function (t) { return '<p><b>' + esc(t.nom) + '.</b> ' + esc(t.texte) + '</p>'; }).join('') + '<p class="muted small" style="margin:0">Archétype rapproché : ' + esc(ar.nom) + '</p></div>';
  h += '<div class="card"><div class="eyebrow">Essaie</div><h3>' + esc(o.essai.label) + '</h3><p>' + esc(o.essai.consigne) + '</p><button class="btn small" data-act="o-try" data-v="' + o.id + '">Aller au Studio</button></div>';
  h += '<div class="small muted">Sources : ' + o.sources.map(function (s) { return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>'; }).join(' · ') + '</div></div>';
  return h;
}
function vType() {
  if (!typeQ) typeQ = { i: 0, sc: { L: 0, E: 0, P: 0 }, done: false };
  var Q = D.typeQuiz;
  if (typeQ.done) {
    var ar = D.archetypes[S.type];
    var sim = D.orators.filter(function (o) { return o.archetype === S.type; });
    return '<div class="top"><button class="btn small ghost" data-act="orators-back">← Orateurs</button></div><div class="stack"><div class="eyebrow">Ton type</div><h1>' + esc(ar.nom) + '</h1><p class="muted">' + esc(ar.formule) + '</p><div class="card"><p>' + esc(ar.texte) + '</p><p><b>Force.</b> ' + esc(ar.force) + '</p><p><b>Risque.</b> ' + esc(ar.risque) + '</p><p style="margin:0"><b>À travailler.</b> ' + esc(ar.travail) + '</p></div>' + (sim.length ? '<div class="card"><h3>Orateurs proches</h3>' + sim.map(function (o) { return '<button class="metric" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer" data-act="orator" data-v="' + o.id + '"><span>' + esc(o.nom) + '</span><span class="muted small">' + esc(o.discours.titre) + '</span></button>'; }).join('') + '</div>' : '') + '<p class="muted small">Résultat issu d’un modèle propre à l’appli (trois axes : logos, ethos, pathos), pas d’un test validé scientifiquement.</p><button class="btn ghost" data-act="type-open">Refaire le test</button></div>';
  }
  var q = Q[typeQ.i];
  return '<div class="top"><button class="btn small ghost" data-act="orators-back">← Orateurs</button><span class="pill">' + (typeQ.i + 1) + ' / ' + Q.length + '</span></div><div class="stack"><h2>' + esc(q.q) + '</h2>' + q.o.map(function (o, i) { return '<button class="opt" data-act="type-ans" data-v="' + i + '">' + esc(o.t) + '</button>'; }).join('') + '</div>';
}

/* ---------- PREUVES ---------- */
var proofTopic = '';
function briefText(t) {
  return 'Je prépare un discours sur : « ' + t + ' ».\nFais une recherche web et donne-moi :\n1. 5 faits ou chiffres récents, chacun avec date, source exacte et lien.\n2. Les arguments les plus solides POUR et CONTRE, avec la meilleure preuve de chaque côté.\n3. 2 exemples concrets ou études de cas vérifiables.\n4. 1 citation ou 1 orateur qui a traité ce sujet (avec la source).\n5. Ce qui est contesté ou incertain.\nIndique clairement ce que tu n’as pas pu vérifier. Format : liste courte, utilisable à l’oral.';
}

/*@@PREP@@*/
/*@@ERIST@@*/

/* ---------- événements ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]'); if (!el) return;
  var act = el.getAttribute('data-act'), v = el.getAttribute('data-v');
  if (exAct(act, v, el) || pwaAct(act, v, el, ev) || prepAct(act, v, el) || eristAct(act, v)) return;
  switch (act) {
    case 'tab': go(v); break;
    case 'reco': var g = JSON.parse(v); go(g[0], g[1]); break;
    case 'goal-add': var gi = document.getElementById('goalIn'); if (gi && gi.value.trim()) { S.goals.push({ id: uid(), t: gi.value.trim(), done: false }); persist(); render(); } break;
    case 'goal-toggle': S.goals.forEach(function (x) { if (x.id === v) { x.done = !x.done; if (x.done) addXp(20); } }); persist(); render(); break;
    case 'goal-del': S.goals = S.goals.filter(function (x) { return x.id !== v; }); persist(); render(); break;
    case 'open-session': view = { tab: 'studio', sub: { result: v } }; render(); window.scrollTo(0, 0); break;
    case 'st-type': if (st.rec || st.timerOn) break; st.type = v; if (v === 'express') { if (ex.phase === 'speak') exEnterSpeak(); } else if (D.durations.indexOf(st.dur) < 0) st.dur = 60; newSubject(); st.ended = false; st.recSec = 0; render(); break;
    case 'st-dur': if (st.rec || st.timerOn) break; st.dur = +v; st.ended = false; st.recSec = 0; render(); break;
    case 'st-new': newSubject(); render(); break;
    case 'rec-toggle': st.rec ? endTimer(false) : startRec(); break;
    case 'chrono-toggle': if (st.timerOn) endTimer(false); else { beep0(); startTimer(); refreshRec(); } break;
    case 'analyse': doAnalyse(); break;
    case 'back': view = { tab: view.tab === 'studio' || view.tab === 'settings' ? 'home' : view.tab, sub: null }; render(); break;
    case 'again': view = { tab: 'studio', sub: null }; render(); break;
    case 'lesson': quizState = null; go('course', v); break;
    case 'course-back': go('course'); break;
    case 'go-studio': go('studio'); break;
    case 'quiz-ans': quizAnswer(+v); break;
    case 'quiz-next': quizNext(); break;
    case 'quiz-reset': quizState = null; document.getElementById('quizBox').innerHTML = quizHtml(byId(D.lessons, view.sub)); break;
    case 'o-filter': oFilter = v; render(); break;
    case 'orator': go('orators', v); break;
    case 'orators-back': go('orators'); break;
    case 'type-open': typeQ = null; go('orators', 'type'); break;
    case 'type-ans': var qq = D.typeQuiz[typeQ.i], ch = qq.o[+v]; for (var k in ch.s) typeQ.sc[k] += ch.s[k]; typeQ.i++; if (typeQ.i >= D.typeQuiz.length) { typeQ.done = true; S.type = D.archetypeFor(typeQ.sc); addXp(10); persist(); } render(); break;
    case 'o-try': var o = byId(D.orators, v); st.type = o.essai.type; st.dur = o.essai.duree; st.sujet = o.essai.label + ' — ' + o.essai.consigne; go('studio'); break;
    case 'brief': var ti = document.getElementById('topicIn'); proofTopic = ti.value.trim(); if (!proofTopic) break; var bt = briefText(proofTopic); document.getElementById('briefOut').innerHTML = '<pre class="brief" id="briefPre">' + esc(bt) + '</pre><button class="btn small ghost" style="margin-top:8px" data-act="copy">Copier</button>'; break;
    case 'copy': var pre = document.getElementById('briefPre'); try { navigator.clipboard.writeText(pre.textContent).then(function () { el.textContent = 'Copié'; }, function () { selectNode(pre); }); } catch (e) { selectNode(pre); } break;
  }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'goalIn') { var b = document.querySelector('[data-act="goal-add"]'); if (b) b.click(); } });
function selectNode(n) { var r = document.createRange(); r.selectNodeContents(n); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ---------- démarrage ---------- */
loadLocal(); exLoad(); pwaBoot(); render();
})();
