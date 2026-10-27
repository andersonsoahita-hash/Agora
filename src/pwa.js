/* ============================================================
   PWA : données locales, enregistrements, corbeille, réglages,
   mise à jour, couverture. Aucun appel réseau vers un service tiers.
   ============================================================ */
var VERSION = '1.0.0', BUILD = window.AGORA_BUILD || 'dev';
var DAY = 86400000;
var pwa = { prefill: '', swReg: null, updateReady: false, wantReload: false, offlineReady: false, installEvt: null, imp: null, proofEdit: null, proofFilter: '', msg: '', persisted: null, dismissed: {} };
var WHY_DEFAULT = [
  'Dans la Grèce antique, l’agora, c’était la place publique. On y vendait, on y croisait ses voisins et, surtout, on y parlait. Quelqu’un se levait, les autres écoutaient, et la meilleure idée avait sa chance.',
  'Donc l’agora n’appartenait à personne. Elle appartenait à celui qui osait prendre la parole.',
  'C’est ce que je veux ici. Un endroit où l’on s’entraîne sans juge et sans scène. Un endroit où l’on apprend à structurer, à prouver, à convaincre. Un endroit où chaque voix compte, parce qu’elle a travaillé.',
  'Parler en public, ce n’est pas un don réservé à quelques-uns. C’est un métier qui s’apprend, comme on construit une maison : pierre après pierre, étape après étape.',
  '**Voilà pourquoi Agora. Parce que chacun mérite sa place sur la place.**'
];
var errLog = [];
window.addEventListener('error', function (e) { errLog.push(String(e.message || e)); });
window.addEventListener('unhandledrejection', function (e) { errLog.push('promesse: ' + String(e.reason && e.reason.message || e.reason)); });
window.AGORA_ERRORS = errLog;

/* ---------- petits outils ---------- */
function byIdEl(id) { return document.getElementById(id); }
function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function fmtDay(t) { try { return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
function fmtBytes(n) { n = +n || 0; if (n < 1024) return n + ' o'; if (n < 1048576) return Math.round(n / 1024) + ' Ko'; return (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' Mo'; }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function mdLite(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function copyText(t, btn) {
  function done() { if (btn) { var o = btn.getAttribute('data-l') || btn.textContent; btn.setAttribute('data-l', o); btn.textContent = 'Copié'; setTimeout(function () { btn.textContent = o; }, 1600); } }
  function fb() {
    var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Copie impossible : sélectionne le texte à la main.'); }
    document.body.removeChild(ta);
  }
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fb); else fb(); } catch (e) { fb(); }
}
function saveFile(name, blob) {
  var a = document.createElement('a'); var u = URL.createObjectURL(blob);
  a.href = u; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
}
function extFor(mime) { mime = String(mime || ''); if (/mp4|m4a|aac/.test(mime)) return 'm4a'; if (/webm/.test(mime)) return 'webm'; if (/ogg/.test(mime)) return 'ogg'; if (/wav/.test(mime)) return 'wav'; if (/mpeg|mp3/.test(mime)) return 'mp3'; return 'audio'; }
function safeName(s) { return String(s || 'agora').replace(/[^\wÀ-ſ -]+/g, '').trim().replace(/\s+/g, '-').slice(0, 50) || 'agora'; }

/* ---------- IndexedDB : enregistrements, sauvegardes, corbeille ---------- */
var idbP = null;
function idb() {
  if (idbP) return idbP;
  idbP = new Promise(function (res, rej) {
    try {
      var r = indexedDB.open('agora_db', 1);
      r.onupgradeneeded = function () { var d = r.result; ['rec', 'bak', 'trash'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.onblocked = function () { rej(new Error('blocked')); };
    } catch (e) { rej(e); }
  });
  return idbP;
}
function idbDo(store, mode, fn) {
  return idb().then(function (d) {
    return new Promise(function (res, rej) {
      var t = d.transaction(store, mode), out = fn(t.objectStore(store));
      t.oncomplete = function () { res(out && typeof out === 'object' && 'result' in out ? out.result : out); };
      t.onerror = t.onabort = function () { rej(t.error); };
    });
  });
}
function idbAll(store) { return idbDo(store, 'readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }); }
function idbGet(store, id) { return idbDo(store, 'readonly', function (s) { return s.get(id); }); }
function idbPut(store, v) { return idbDo(store, 'readwrite', function (s) { return s.put(v); }); }
function idbDel(store, id) { return idbDo(store, 'readwrite', function (s) { return s.delete(id); }); }

/* ---------- enregistreur ---------- */
var wake = null;
function pwaWake(on) {
  try {
    if (on && navigator.wakeLock && !wake) navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }, function () {});
    else if (!on && wake) { wake.release(); wake = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  if (st.rec && mr && mr.state === 'inactive') { stopRec(); toast('Enregistrement interrompu : l’appli a été quittée. Ce qui a été capté est gardé.', true); }
  else if (st.rec) pwaWake(true);
});
function pwaRecorder(stream) {
  pwaWake(true);
  var types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  try { for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) return new MediaRecorder(stream, { mimeType: types[i] }); } catch (e) {}
  return new MediaRecorder(stream);
}
function pwaSaveRec(blob, dur) {
  pwaWake(false);
  var id = uid(); st.audioId = id;
  var rec = { id: id, name: String(st.sujet || 'Enregistrement').slice(0, 60), date: Date.now(), dur: Math.round(dur || st.recSec || st.audioLen || 0), type: st.type, sujet: st.sujet, mime: blob.type || '', size: blob.size, blob: blob, del: 0 };
  return idbPut('rec', rec).then(function () { persistAsk(true); refreshLib(); }).catch(function () { st.audioId = null; toast('Enregistrement non gardé : stockage indisponible sur ce navigateur.', true); });
}
function persistAsk(quiet) {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (ok) { pwa.persisted = ok; lsSet('ao_persist', ok ? '1' : '0'); if (!quiet) toast(ok ? 'Stockage protégé' : 'Le navigateur n’a pas accordé la protection'); if (view.tab === 'settings') render(); });
  } catch (e) {}
}
function libItemHtml(r) {
  return '<div class="ritem" data-id="' + esc(r.id) + '"><div class="rname"><b>' + esc(r.name) + '</b><span class="small muted">' + esc(fmtDay(r.date)) + ' · ' + fmt(r.dur || 0) + ' · ' + fmtBytes(r.size) + ' · ' + extFor(r.mime) + '</span></div>' +
    '<div class="row"><button class="chip" data-act="rec-play" data-v="' + esc(r.id) + '">Écouter</button><button class="chip" data-act="rec-ren" data-v="' + esc(r.id) + '">Renommer</button><button class="chip" data-act="rec-dl" data-v="' + esc(r.id) + '">Télécharger</button><button class="chip" data-act="rec-del" data-v="' + esc(r.id) + '">Supprimer</button></div><div class="rplay"></div></div>';
}
function refreshLib() {
  var box = byIdEl('recLib'); if (!box) return;
  idbAll('rec').then(function (list) {
    list = list.filter(function (r) { return !r.del; }).sort(function (a, b) { return b.date - a.date; });
    var h = '<div class="eyebrow">Mes enregistrements</div><p class="muted small" style="margin:0">Gardés uniquement sur ce téléphone. Garde l’appli ouverte et l’écran allumé pendant l’enregistrement : un appel ou un changement d’appli peut l’interrompre.</p>';
    if (st.blob && !st.audioId) h += '<button class="btn small ghost" data-act="rec-keep">Garder l’audio prêt dans l’appli</button>';
    h += list.length ? list.slice(0, 40).map(libItemHtml).join('') : '<p class="muted small" style="margin:0">Aucun enregistrement gardé. Ceux que tu fais ici apparaissent dans cette liste.</p>';
    box.innerHTML = h;
  }).catch(function () { box.innerHTML = '<div class="eyebrow">Mes enregistrements</div><p class="muted small" style="margin:0">Le stockage local est indisponible (navigation privée ?). L’analyse fonctionne, mais l’audio n’est pas gardé.</p>'; });
}
function playInto(holder, id) {
  idbGet('rec', id).then(function (r) {
    if (!r || !holder) return;
    holder.innerHTML = '';
    var a = document.createElement('audio'); a.controls = true; a.preload = 'metadata'; a.src = URL.createObjectURL(r.blob); a.style.width = '100%';
    holder.appendChild(a);
  }).catch(function () { toast('Lecture impossible.'); });
}

/* ---------- corbeille 24 h ---------- */
function trashPut(kind, label, payload) { return idbPut('trash', { id: uid(), kind: kind, label: String(label || '').slice(0, 80), at: Date.now(), payload: payload }); }
function trashPurge() {
  var lim = Date.now() - DAY;
  idbAll('trash').then(function (l) { l.filter(function (t) { return t.at < lim; }).forEach(function (t) { idbDel('trash', t.id); }); }).catch(function () {});
  idbAll('rec').then(function (l) { l.filter(function (r) { return r.del && r.del < lim; }).forEach(function (r) { idbDel('rec', r.id); }); }).catch(function () {});
}
function trashRestore(id) {
  idbGet('trash', id).then(function (t) {
    if (!t) return;
    var p = t.payload;
    if (t.kind === 'proof') S.proofs.unshift(p);
    else if (t.kind === 'session') { S.sessions.push(p); S.sessions.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
    else if (t.kind === 'lesson') { if (p.done) S.done[p.id] = true; if (p.quiz != null) S.quiz[p.id] = p.quiz; }
    persist(); return idbDel('trash', id);
  }).then(function () { toast('Élément restauré'); render(); }).catch(function () {});
}
function trashRestoreRec(id) {
  idbGet('rec', id).then(function (r) { if (!r) return; r.del = 0; return idbPut('rec', r); }).then(function () { toast('Enregistrement restauré'); render(); }).catch(function () {});
}

/* ---------- validation / import / export ---------- */
function str(x, n) { return typeof x === 'string' ? x.slice(0, n || 400) : ''; }
function isId(x) { return typeof x === 'string' && /^[\w.-]{1,40}$/.test(x); }
function cleanState(o) {
  if (!o || typeof o !== 'object') throw new Error('Données illisibles');
  var c = {}, a = function (x) { return Array.isArray(x) ? x : []; };
  c.goals = a(o.goals).filter(function (g) { return g && isId(g.id) && typeof g.t === 'string'; }).slice(0, 100).map(function (g) { return { id: g.id, t: str(g.t, 80), done: !!g.done }; });
  c.sessions = a(o.sessions).filter(function (s) { return s && isId(s.id) && typeof s.date === 'string' && typeof s.sujet === 'string'; }).slice(0, 300).map(function (s) {
    if (s.ex && typeof s.ex === 'object') { var e = s.ex; s.ex = { theme: str(e.theme, 120), cat: str(e.cat, 20), T: +e.T || 5, search: +e.search || 0, struct: +e.struct || 0, speak: +e.speak || 0, actual: +e.actual || 0, notes: str(e.notes, 4000), chk: Array.isArray(e.chk) ? e.chk.filter(function (i) { return i >= 0 && i < 4; }).slice(0, 4) : [], xpd: Array.isArray(e.xpd) ? e.xpd.filter(function (i) { return i >= 0 && i < 4; }).slice(0, 4) : [] }; } else delete s.ex;
    s.date = str(s.date, 10); s.sujet = str(s.sujet, 300); if (s.transcript != null) s.transcript = str(s.transcript, 30000); if (s.note != null) s.note = str(s.note, 4000);
    if (s.audioId != null && !isId(s.audioId)) s.audioId = null; return s;
  });
  c.proofs = a(o.proofs).filter(function (p) { return p && isId(p.id) && typeof p.fait === 'string'; }).slice(0, 1000).map(function (p) {
    return { id: p.id, sujet: str(p.sujet, 120), fait: str(p.fait, 1200), url: str(p.url, 400), tags: str(p.tags, 120), date: str(p.date, 10) || today() };
  });
  c.prep = a(o.prep).filter(function (p) { return p && isId(p.id) && (p.kind === 'debat' || p.kind === 'discours') && p.data && typeof p.data === 'object' && typeof p.topic === 'string'; }).slice(0, 25);
  c.done = {}; if (o.done && typeof o.done === 'object') Object.keys(o.done).slice(0, 500).forEach(function (k) { if (isId(k) && byId(D.lessons, k) && o.done[k]) c.done[k] = true; });
  c.quiz = {}; if (o.quiz && typeof o.quiz === 'object') Object.keys(o.quiz).slice(0, 500).forEach(function (k) { var n = +o.quiz[k]; if (isId(k) && byId(D.lessons, k) && isFinite(n) && n >= 0 && n <= 100) c.quiz[k] = n; });
  c.type = typeof o.type === 'string' && o.type.length < 40 ? o.type : null;
  c.erist = { best: o.erist && isFinite(+o.erist.best) ? Math.max(0, Math.min(99, +o.erist.best)) : 0 };
  c.xp = isFinite(+o.xp) ? Math.max(0, Math.min(1e6, Math.round(+o.xp))) : 0;
  c.days = a(o.days).filter(function (d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); }).slice(-400);
  c.badges = a(o.badges).filter(function (b) { return typeof b === 'string' && b.length < 60; }).slice(0, 100);
  c.why = typeof o.why === 'string' && o.why.trim() ? o.why.slice(0, 6000) : null;
  c.angles = typeof o.angles === 'string' ? o.angles.slice(0, 6000) : '';
  c.set = { sr: !!(o.set && o.set.sr) };
  c.since = isFinite(+o.since) ? +o.since : 0; c.lastExport = 0;
  return c;
}
function cleanRec(r) {
  if (!r || !isId(r.id) || typeof r.data !== 'string' || r.data.indexOf('data:') !== 0) return null;
  return { id: r.id, name: str(r.name, 60) || 'Enregistrement', date: +r.date || Date.now(), dur: +r.dur || 0, type: str(r.type, 30), sujet: str(r.sujet, 300), mime: str(r.mime, 60), size: +r.size || 0, data: r.data, del: 0 };
}
function parseImport(o) {
  if (!o || typeof o !== 'object') throw new Error('Fichier non reconnu');
  var res = { state: null, recs: [] };
  if (o.app === 'agora' && o.state) res.state = cleanState(o.state);
  else if (o.sessions || o.done || o.proofs || o.goals || o.xp != null || o.prep) res.state = cleanState(o); /* ancien export de l’artifact */
  if (Array.isArray(o.recordings)) res.recs = o.recordings.map(cleanRec).filter(Boolean);
  if (!res.state && !res.recs.length) throw new Error('Ce fichier ne contient ni données Agora ni enregistrements');
  return res;
}
function sig(s) { return [s.date, s.sujet, s.dur, s.type].join('|'); }
function mergeState(inc) {
  var added = { sessions: 0, proofs: 0, goals: 0, lessons: 0, prep: 0 };
  var ids = {}; S.sessions.forEach(function (s) { ids[s.id] = 1; ids[sig(s)] = 1; });
  inc.sessions.forEach(function (s) { if (!ids[s.id] && !ids[sig(s)]) { S.sessions.push(s); added.sessions++; } });
  S.sessions.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); S.sessions = S.sessions.slice(0, 300);
  var pk = {}; S.proofs.forEach(function (p) { pk[p.id] = 1; pk[norm(p.sujet + p.fait + p.url)] = 1; });
  inc.proofs.forEach(function (p) { var k = norm(p.sujet + p.fait + p.url); if (!pk[p.id] && !pk[k]) { S.proofs.push(p); pk[p.id] = 1; pk[k] = 1; added.proofs++; } });
  var gk = {}; S.goals.forEach(function (g) { gk[g.id] = 1; gk[norm(g.t)] = 1; });
  inc.goals.forEach(function (g) { if (!gk[g.id] && !gk[norm(g.t)]) { S.goals.push(g); added.goals++; } });
  var pi = {}; S.prep.forEach(function (p) { pi[p.id] = 1; });
  inc.prep.forEach(function (p) { if (!pi[p.id]) { S.prep.push(p); added.prep++; } }); S.prep = S.prep.slice(0, 25);
  Object.keys(inc.done).forEach(function (k) { if (!S.done[k]) { S.done[k] = true; added.lessons++; } });
  Object.keys(inc.quiz).forEach(function (k) { if (S.quiz[k] == null || inc.quiz[k] > S.quiz[k]) S.quiz[k] = inc.quiz[k]; });
  S.xp = Math.max(S.xp, inc.xp); S.erist.best = Math.max(S.erist.best || 0, inc.erist.best);
  var dd = {}; S.days.concat(inc.days).forEach(function (d) { dd[d] = 1; }); S.days = Object.keys(dd).sort().slice(-120);
  var bb = {}; (S.badges || []).concat(inc.badges).forEach(function (b) { bb[b] = 1; }); S.badges = Object.keys(bb);
  if (!S.type && inc.type) S.type = inc.type;
  if (!S.why && inc.why) S.why = inc.why;
  if (!S.angles && inc.angles) S.angles = inc.angles;
  if (inc.since && (!S.since || inc.since < S.since)) S.since = inc.since;
  return added;
}
function backupNow(reason) {
  var snap = JSON.stringify(S); lsSet('ao_backup_prev', snap);
  return idbPut('bak', { id: 'b' + Date.now(), at: Date.now(), reason: reason, json: snap }).then(function () {
    return idbAll('bak').then(function (l) { l.sort(function (a, b) { return b.at - a.at; }); l.slice(5).forEach(function (b) { idbDel('bak', b.id); }); });
  }).catch(function () {});
}
function importRecs(recs) {
  var n = 0;
  return Promise.all(recs.map(function (r) {
    return idbGet('rec', r.id).then(function (ex) {
      if (ex) return;
      return fetch(r.data).then(function (x) { return x.blob(); }).then(function (b) { var o = { id: r.id, name: r.name, date: r.date, dur: r.dur, type: r.type, sujet: r.sujet, mime: r.mime || b.type, size: b.size, blob: b, del: 0 }; n++; return idbPut('rec', o); });
    });
  })).then(function () { return n; });
}
function exportState() {
  var o = { app: 'agora', format: 2, version: VERSION, exportedAt: new Date().toISOString(), state: S };
  saveFile('agora-donnees-' + today() + '.json', new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' }));
  S.lastExport = Date.now(); persist(); toast('Sauvegarde créée (sans enregistrements audio)');
}
function exportRecs() {
  idbAll('rec').then(function (l) {
    l = l.filter(function (r) { return !r.del; });
    if (!l.length) { toast('Aucun enregistrement à exporter.'); return; }
    var parts = ['{"app":"agora","format":2,"kind":"recordings","exportedAt":"' + new Date().toISOString() + '","recordings":['];
    return Promise.all(l.map(function (r) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res({ id: r.id, name: r.name, date: r.date, dur: r.dur, type: r.type, sujet: r.sujet, mime: r.mime, size: r.size, data: fr.result }); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(r.blob); });
    })).then(function (all) {
      all = all.filter(Boolean); parts.push(all.map(function (x) { return JSON.stringify(x); }).join(',')); parts.push(']}');
      saveFile('agora-enregistrements-' + today() + '.json', new Blob(parts, { type: 'application/json' })); toast('Fichier des enregistrements créé');
    });
  }).catch(function () { toast('Export des enregistrements impossible.'); });
}
function onImportFile(f) {
  if (!f) return;
  if (f.size > 120 * 1048576) { pwa.msg = 'Fichier trop gros (plus de 120 Mo).'; render(); return; }
  var fr = new FileReader();
  fr.onload = function () {
    try { pwa.imp = { name: f.name, p: parseImport(JSON.parse(fr.result)) }; pwa.msg = ''; }
    catch (e) { pwa.imp = null; pwa.msg = 'Import refusé : ' + (e && e.message || 'fichier invalide') + '. Rien n’a été modifié.'; }
    render();
  };
  fr.onerror = function () { pwa.msg = 'Fichier illisible.'; render(); };
  fr.readAsText(f);
}
function doMerge() {
  var p = pwa.imp && pwa.imp.p; if (!p) return;
  backupNow('avant import').then(function () {
    var added = p.state ? mergeState(p.state) : null;
    if (added) persist();
    return (p.recs.length ? importRecs(p.recs) : Promise.resolve(0)).then(function (n) {
      pwa.imp = null;
      pwa.msg = 'Import terminé' + (added ? ' : ' + added.sessions + ' séance(s), ' + added.proofs + ' preuve(s), ' + added.lessons + ' leçon(s) ajoutée(s)' : '') + (n ? ', ' + n + ' enregistrement(s)' : '') + '. Une copie de sécurité a été faite avant.';
      render();
    });
  }).catch(function () { pwa.msg = 'Import interrompu. Tes données n’ont pas été modifiées.'; render(); });
}
function rollbackImport() {
  idbAll('bak').then(function (l) {
    l.sort(function (a, b) { return b.at - a.at; });
    var raw = l.length ? l[0].json : lsGet('ao_backup_prev');
    if (!raw) { pwa.msg = 'Aucune copie de sécurité disponible.'; render(); return; }
    var cur = JSON.stringify(S);
    var c = cleanState(JSON.parse(raw)); c.lastExport = S.lastExport;
    Object.keys(c).forEach(function (k) { S[k] = c[k]; });
    lsSet('ao_backup_prev', cur); persist(); pwa.msg = 'Retour à la copie de sécurité effectué.'; render();
  }).catch(function () { pwa.msg = 'Retour impossible.'; render(); });
}

/* ---------- rappel de sauvegarde, installation, mise à jour ---------- */
function hasData() { return S.sessions.length || S.proofs.length || S.goals.length || S.xp > 0 || Object.keys(S.done).length; }
function needBackup() {
  if (!hasData()) return false;
  var base = S.lastExport || S.since || 0; if (!base) return false;
  if (lsGet('ao_bk_dismiss') === today()) return false;
  return Date.now() - base > 14 * DAY;
}
function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent); }
function homeBanners() {
  var h = '';
  if (ex.phase === 'search' || ex.phase === 'struct' || ex.phase === 'speak') {
    var xr = Math.max(0, Math.ceil((ex.endAt - Date.now()) / 1000));
    h += '<button class="card tap banner" data-act="ex-resume"><div class="eyebrow">Recherche express en cours</div><h3>' + esc(ex.theme) + '</h3><p class="muted small" style="margin:4px 0 0">' + (ex.phase === 'search' ? 'Phase 1 · recherche · reste ' + fmt(xr) : ex.phase === 'struct' ? 'Phase 2 · structurer · reste ' + fmt(xr) : 'Phase 3 · à toi d’expliquer') + '. Touche pour reprendre.</p></button>';
  }
  if (pwa.updateReady) h += '<div class="card banner"><b>Nouvelle version prête</b><p class="muted small" style="margin:4px 0 8px">Ton travail est conservé.</p><button class="btn small" data-act="update-now">Mettre à jour</button></div>';
  if (needBackup()) h += '<div class="card banner"><b>Pense à sauvegarder</b><p class="muted small" style="margin:4px 0 8px">Ta dernière sauvegarde date de plus de 14 jours' + (S.lastExport ? ' (' + esc(fmtDay(S.lastExport)) + ')' : ' ou n’a jamais été faite') + '.</p><div class="row"><button class="btn small" data-act="export-data">Sauvegarder maintenant</button><button class="btn small ghost" data-act="bk-later">Plus tard</button></div></div>';
  if (!isStandalone() && lsGet('ao_inst_dismiss') !== '1') {
    if (pwa.installEvt) h += '<div class="card banner"><b>Installer Agora</b><p class="muted small" style="margin:4px 0 8px">Pour l’ouvrir comme une application, même hors ligne.</p><div class="row"><button class="btn small" data-act="install">Installer</button><button class="btn small ghost" data-act="inst-hide">Masquer</button></div></div>';
    else if (isIOS()) h += '<div class="card banner"><b>Installer Agora sur l’iPhone</b><p class="muted small" style="margin:4px 0 8px">Dans Safari : bouton Partager, puis « Sur l’écran d’accueil ».</p><button class="btn small ghost" data-act="inst-hide">Masquer</button></div>';
  }
  return h;
}
function homeDaily() {
  var n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / DAY), exT = D.exerciseTypes[n % D.exerciseTypes.length], isEx = exT.id === 'express';
  var sj = isEx ? D.themeAll[(n * 7) % D.themeAll.length].t : exT.sujets[n % exT.sujets.length];
  var o = D.orators[n % D.orators.length], wk = Date.now() - 7 * DAY;
  var wkN = S.sessions.filter(function (s) { return new Date(s.date).getTime() > wk; }).length;
  var h = '<div class="card dayc"><div class="eyebrow">Défi du jour</div><h3>' + esc(exT.nom) + '</h3><p style="margin:6px 0 10px">' + esc(sj) + '</p><button class="btn small" data-act="daily-go" data-v="' + esc(exT.id) + '|' + (isEx ? (n * 7) % D.themeAll.length : n % exT.sujets.length) + '">Relever le défi</button></div>';
  h += '<button class="card tap" data-act="orator" data-v="' + esc(o.id) + '"><div class="eyebrow">Orateur du jour</div><h3>' + esc(o.nom) + '</h3><p class="muted small" style="margin:4px 0 0">' + esc(o.discours.titre) + ' · ' + esc(o.epoque) + '</p></button>';
  h += '<div class="card"><div class="eyebrow">Cette semaine</div><div class="row" style="justify-content:space-around;margin-top:8px"><div class="pil"><b>' + wkN + '</b><span class="small muted">séance' + (wkN > 1 ? 's' : '') + '</span></div><div class="pil"><b>' + streak() + '</b><span class="small muted">jour' + (streak() > 1 ? 's' : '') + ' de suite</span></div><div class="pil"><b>' + S.xp + '</b><span class="small muted">points</span></div></div></div>';
  return h;
}
function whyHtml() {
  var paras = S.why ? S.why.split(/\n{2,}/).filter(function (x) { return x.trim(); }) : WHY_DEFAULT;
  return '<div class="card prose"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><h3>Pourquoi Agora ?</h3><button class="chip" data-act="why-edit">Modifier</button></div>' + paras.map(function (p, i) { return '<p' + (i === paras.length - 1 ? ' style="margin:0"' : '') + '>' + mdLite(p.trim()) + '</p>'; }).join('') + '</div>';
}

/* ---------- retour de coach manuel (aucune IA branchée) ---------- */
function coachPrompt(s) {
  var meas = {
    exercice: s.type, sujet: s.sujet, duree_visee_s: s.dur,
    voix: s.sig ? { variation_hauteur_demi_tons: s.sig.pitch && s.sig.pitch.sdSemitones, pauses: s.sig.pauses.count, blancs: s.sig.pauses.blank, fins_montantes_pct: Math.round(s.sig.endings.risingShare * 100), syll_par_s: s.sig.rhythm.syllPerSec } : null,
    texte: s.txt ? { mots: s.txt.words, mots_par_min: s.txt.wpm, tics: s.txt.fillers.total, plan_annonce: s.txt.planAnnounced } : null
  };
  return 'Tu es coach en art oratoire, exigeant et bienveillant. Voici la transcription d’un exercice de prise de parole (en français) et des mesures automatiques. Ne suppose rien sur la voix au-delà des mesures et n’invente aucun chiffre. Réponds en trois parties courtes : un point fort précis, la priorité n°1 à corriger, un exercice de 5 minutes.\n\nMesures : ' + JSON.stringify(meas) + '\n\nTranscription :\n' + (s.transcript || '(aucune)');
}
function coachBox(s) {
  var h = '';
  if (s.audioId) h += '<div class="card stack" id="resAudio" data-aid="' + esc(s.audioId) + '"><h3>Ton enregistrement</h3><div class="rplay"></div></div>';
  h += '<div class="card stack" id="aiBox"><h3>Retour de coach (facultatif)</h3><p class="muted small" style="margin:0">Cette appli n’envoie rien à une IA et ne consomme rien. Si tu veux un avis extérieur, copie le message ci-dessous, colle-le dans l’assistant de ton choix, puis note ici ce que tu en retiens.</p>';
  if (s.ai) h += aiHtml(s.ai);
  h += '<button class="btn ghost small" data-act="coach-copy" data-v="' + esc(s.id) + '">Copier le message pour un coach</button><textarea id="coachNote" placeholder="Ton retour, tes notes de coach…" maxlength="4000">' + esc(s.note || '') + '</textarea><button class="btn small" data-act="coach-save" data-v="' + esc(s.id) + '">Enregistrer la note</button></div>';
  return h;
}

/* ---------- PREUVES (bibliothèque locale) ---------- */
function vProofs() {
  var pe = pwa.proofEdit ? byId(S.proofs, pwa.proofEdit) : null;
  var h = '<div class="top"><h1>Preuves</h1></div><div class="stack">';
  h += '<div class="callout info">Cette appli ne cherche pas sur internet. Tu gardes ici tes faits, chiffres et citations, avec leur source et la date de vérification. Ajoute-les à la main ou importe un fichier.</div>';
  h += '<div class="card stack"><h3>Ma bibliothèque <span class="muted small">(' + S.proofs.length + ')</span></h3><input type="search" id="pSearch" placeholder="Chercher un mot, un sujet, une source…" value="' + esc(pwa.proofFilter) + '" autocomplete="off"><div id="pList" class="stack"></div></div>';
  h += '<div class="card stack"><h3>' + (pe ? 'Modifier la preuve' : 'Ajouter une preuve') + '</h3>';
  h += '<input type="text" id="pSujet" placeholder="Sujet (ex. luxe durable)" maxlength="120" value="' + esc(pe ? pe.sujet : (pwa.prefill || '')) + '"><textarea id="pFait" placeholder="Fait, chiffre ou citation" style="min-height:80px" maxlength="1200">' + esc(pe ? pe.fait : '') + '</textarea><input type="text" id="pUrl" placeholder="Source (lien ou référence)" maxlength="400" value="' + esc(pe ? pe.url : '') + '"><input type="text" id="pTags" placeholder="Mots-clés, séparés par des virgules" maxlength="120" value="' + esc(pe ? pe.tags || '' : '') + '"><label class="small muted">Vérifié le<input type="date" id="pDate" value="' + esc(pe ? pe.date : today()) + '"></label>';
  h += '<div class="row"><button class="btn small" data-act="proof-add">' + (pe ? 'Enregistrer les changements' : 'Enregistrer') + '</button>' + (pe ? '<button class="btn small ghost" data-act="proof-cancel">Annuler</button>' : '') + '</div></div>';
  h += '<div class="card stack"><h3>Importer des preuves</h3><p class="muted small" style="margin:0">Fichier .txt, .md, .csv ou .json. Une preuve par ligne, au format <code>Sujet | Fait | Source</code>. Les PDF ne sont pas lus : copie le texte utile dans un .txt.</p><label class="btn ghost small" style="cursor:pointer;align-self:flex-start">Choisir un fichier<input type="file" id="proofFile" accept=".txt,.md,.csv,.json,text/plain,application/json" hidden></label><div class="small" id="proofMsg">' + esc(pwa.msg && view.tab === 'proofs' ? pwa.msg : '') + '</div></div>';
  h += '<div class="card stack"><h3>Brief de recherche</h3><p class="muted small" style="margin:0">Génère un message à coller dans l’assistant de ton choix (avec recherche web), puis rapporte ici les références vérifiées.</p><input type="text" id="topicIn" placeholder="Ex. : le luxe durable en Europe" value="' + esc(proofTopic) + '" maxlength="120"><div class="row"><button class="btn" data-act="brief">Générer le brief</button><button class="btn ghost" data-act="angles-copy">Copier : pistes d’arguments</button></div><div id="briefOut"></div></div>';
  h += '<div class="card stack"><h3>Pistes d’arguments (notes)</h3><textarea id="anglesNote" placeholder="Colle ou écris ici les angles à creuser…" maxlength="6000">' + esc(S.angles || '') + '</textarea><button class="btn small" data-act="angles-save">Enregistrer les notes</button></div>';
  return h + '</div>';
}
function proofItemHtml(p) {
  var link = /^https?:\/\//i.test(p.url) ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.url) + '</a>' : esc(p.url || 'sans source');
  return '<div class="metric" style="align-items:flex-start"><span style="min-width:0;overflow-wrap:anywhere"><b>' + esc(p.sujet || 'Sans sujet') + '</b><br>' + esc(p.fait) + '<br><span class="small muted">' + link + ' · vérifié le ' + esc(p.date) + '</span>' + (p.tags ? '<br>' + p.tags.split(',').map(function (t) { return t.trim() ? '<span class="pill">' + esc(t.trim()) + '</span>' : ''; }).join(' ') : '') + '</span><span class="col"><button class="chip" data-act="proof-edit" data-v="' + esc(p.id) + '">Modifier</button><button class="chip" data-act="proof-del" data-v="' + esc(p.id) + '" aria-label="Supprimer">Supprimer</button></span></div>';
}
function fillProofList() {
  var box = byIdEl('pList'); if (!box) return;
  var words = norm(pwa.proofFilter).split(/\s+/).filter(Boolean);
  var l = S.proofs.filter(function (p) { var t = norm([p.sujet, p.fait, p.url, p.tags].join(' ')); return words.every(function (w) { return t.indexOf(w) >= 0; }); });
  box.innerHTML = l.length ? l.map(proofItemHtml).join('') : '<p class="muted small" style="margin:0">' + (S.proofs.length ? 'Aucun résultat pour cette recherche.' : 'Aucune preuve pour l’instant. Ajoute un fait, sa source et la date où tu l’as vérifié.') + '</p>';
}
function importProofsText(name, text) {
  var out = [];
  if (/\.json$/i.test(name)) {
    var j = JSON.parse(text);
    if (j && j.app === 'agora' && j.state) j = j.state.proofs; else if (j && j.proofs) j = j.proofs;
    if (!Array.isArray(j)) throw new Error('JSON sans liste de preuves');
    j.forEach(function (p) { if (p && typeof p.fait === 'string') out.push({ sujet: str(p.sujet, 120), fait: str(p.fait, 1200), url: str(p.url || p.source, 400), tags: str(p.tags, 120), date: str(p.date, 10) }); });
  } else {
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line || line.length < 4) return;
      var sep = line.indexOf('|') >= 0 ? '|' : line.indexOf('\t') >= 0 ? '\t' : line.indexOf(';') >= 0 ? ';' : null;
      var p = sep ? line.split(sep).map(function (x) { return x.trim(); }) : [name.replace(/\.\w+$/, ''), line, ''];
      if (p.length === 2) p = [p[0], p[1], ''];
      if (p[1]) out.push({ sujet: str(p[0], 120), fait: str(p[1], 1200), url: str(p[2], 400), tags: str(p[3], 120), date: '' });
    });
  }
  return out.slice(0, 500);
}

/* ---------- RÉGLAGES ---------- */
function themePref() { return lsGet('ao_theme') || 'auto'; }
function applyTheme(p) { var r = document.documentElement; if (p === 'light' || p === 'dark') r.setAttribute('data-theme', p); else r.removeAttribute('data-theme'); try { var m = document.querySelector('meta[name=theme-color]'); } catch (e) {} }
function vSettings() {
  var tp = themePref();
  var h = '<div class="top"><div><div class="eyebrow">Agora · by Stephen</div><h1>Réglages</h1></div><button class="btn small ghost" data-act="back">Fermer</button></div><div class="stack">';
  if (pwa.msg && view.tab === 'settings') h += '<div class="callout" role="status">' + esc(pwa.msg) + '</div>';
  h += '<div class="card stack"><h3>Tes données</h3><p class="muted small" style="margin:0">Tout est gardé sur ton appareil, rien n’est envoyé sur internet. Dernière sauvegarde : <b>' + (S.lastExport ? esc(fmtDay(S.lastExport)) : 'jamais') + '</b>.</p>';
  h += '<div class="row"><button class="btn small" data-act="export-data">Sauvegarder mes données</button><button class="btn small ghost" data-act="export-recs">Sauvegarder les enregistrements</button></div>';
  h += '<p class="muted small" style="margin:0">La sauvegarde des données est légère (sans audio). Les enregistrements ont leur propre fichier, plus lourd.</p><hr class="hr">';
  h += '<label class="btn ghost small" style="cursor:pointer;align-self:flex-start">Ajouter depuis un fichier<input type="file" id="impFile" accept=".json,application/json" hidden></label>';
  h += '<p class="muted small" style="margin:0">Fusionne un fichier de sauvegarde (ou l’ancien export de l’artifact) avec ce que tu as déjà, sans doublons. Rien n’est supprimé.</p>';
  if (pwa.imp) {
    var p = pwa.imp.p, s = p.state;
    h += '<div class="callout info"><b>' + esc(pwa.imp.name) + '</b><br>' + (s ? s.sessions.length + ' séance(s), ' + s.proofs.length + ' preuve(s), ' + Object.keys(s.done).length + ' leçon(s) terminée(s), ' + s.xp + ' pts' : 'aucune donnée de progression') + (p.recs.length ? '<br>' + p.recs.length + ' enregistrement(s)' : '') + '<div class="row" style="margin-top:8px"><button class="btn small" data-act="imp-merge">Fusionner</button><button class="btn small ghost" data-act="imp-cancel">Annuler</button></div></div>';
  }
  h += '<button class="btn small ghost" style="align-self:flex-start" data-act="imp-rollback">Revenir à la copie de sécurité d’avant import</button>';
  h += '<hr class="hr"><div class="small" id="stoInfo">Calcul de l’espace utilisé…</div><div class="row"><button class="btn small ghost" data-act="persist-ask">Protéger le stockage</button></div><p class="muted small" style="margin:0">Sur iPhone, installe l’appli sur l’écran d’accueil : Safari peut effacer les données d’un site rarement ouvert, pas celles d’une appli installée.</p></div>';
  h += '<div class="card stack"><h3>Corbeille (24 h)</h3><p class="muted small" style="margin:0">Ce que tu supprimes (enregistrement, preuve, séance, progression d’une leçon) reste ici 24 h avant d’être effacé pour de bon.</p><div id="trashList" class="stack"></div></div>';
  h += '<div class="card stack"><h3>Apparence</h3><div class="row">' + [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(function (x) { return '<button class="chip' + (tp === x[0] ? ' on' : '') + '" data-act="theme-set" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
  h += '<div class="card stack"><h3>Voix et transcription</h3><p class="muted small" style="margin:0">L’analyse de ta voix (hauteur, volume, pauses, rythme) est faite <b>sur ton téléphone</b> : l’audio ne quitte pas l’appareil. Pour analyser tes mots, tu écris ou colles la transcription.</p><label class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:10px"><input type="checkbox" data-act="sr-toggle"' + (S.set && S.set.sr ? ' checked' : '') + (SR_API ? '' : ' disabled') + ' style="margin-top:4px"><span class="small"><b>Transcription automatique (en ligne)</b><br><span class="muted">Optionnelle. Elle utilise le service de reconnaissance vocale de ton navigateur, qui envoie le son à des serveurs distants. ' + (SR_API ? 'Désactivée par défaut.' : 'Non disponible sur ce navigateur.') + '</span></span></label></div>';
  h += '<div class="card stack" id="whyEdit"><h3>Page « Pourquoi Agora ? »</h3><textarea id="whyText" style="min-height:160px" maxlength="6000">' + esc(S.why || WHY_DEFAULT.join('\n\n').replace(/\*\*/g, '')) + '</textarea><p class="muted small" style="margin:0">Sépare les paragraphes par une ligne vide. <b>**gras**</b> est accepté.</p><div class="row"><button class="btn small" data-act="why-save">Enregistrer</button><button class="btn small ghost" data-act="why-reset">Rétablir le texte d’origine</button></div></div>';
  h += '<div class="card stack"><h3>Application</h3>';
  h += m('Version', 'v' + VERSION + ' · ' + esc(BUILD)) + m('Hors ligne', pwa.offlineReady ? 'prêt' : (('serviceWorker' in navigator) ? 'préparation…' : 'non disponible'), pwa.offlineReady ? 'tag-ok' : '') + m('Installée', isStandalone() ? 'oui' : 'non');
  h += '<div class="row">' + (pwa.updateReady ? '<button class="btn small" data-act="update-now">Mettre à jour maintenant</button>' : '<button class="btn small ghost" data-act="update-check">Rechercher une mise à jour</button>') + (pwa.installEvt && !isStandalone() ? '<button class="btn small" data-act="install">Installer</button>' : '') + '</div>';
  h += '<p class="muted small" style="margin:0">Mes données ne sont jamais touchées par une mise à jour.</p></div>';
  h += '<div class="card stack"><h3>À propos</h3><p class="small" style="margin:0">Agora, l’art oratoire · <i>by Stephen</i>. Usage personnel : pas de compte, pas de paiement, aucune clé, aucun suivi. Polices : Dancing Script, DM Sans et Fraunces (licence OFL), hébergées dans l’appli.</p></div>';
  return h + '</div>';
}
function fillSettings() {
  var s = byIdEl('stoInfo');
  if (s) {
    var txt = function (u, q, rs, rc) { s.innerHTML = 'Espace utilisé : <b>' + fmtBytes(u) + '</b>' + (q ? ' sur ' + fmtBytes(q) + ' disponibles' : '') + ' · enregistrements : <b>' + rc + '</b> (' + fmtBytes(rs) + ') · protection : <b>' + (pwa.persisted === true || lsGet('ao_persist') === '1' ? 'oui' : pwa.persisted === false ? 'non accordée' : 'inconnue') + '</b>'; };
    idbAll('rec').then(function (l) { l = l.filter(function (r) { return !r.del; }); var rs = l.reduce(function (a, r) { return a + (r.size || 0); }, 0); if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate().then(function (e) { txt(e.usage, e.quota, rs, l.length); }); txt(rs, 0, rs, l.length); }).catch(function () { s.textContent = 'Espace utilisé : indisponible sur ce navigateur.'; });
  }
  var t = byIdEl('trashList');
  if (t) Promise.all([idbAll('trash'), idbAll('rec')]).then(function (r) {
    var items = r[0].map(function (x) { return { id: x.id, at: x.at, label: ({ proof: 'Preuve', session: 'Séance', lesson: 'Leçon' }[x.kind] || 'Élément') + ' · ' + x.label, act: 'trash-restore' }; })
      .concat(r[1].filter(function (x) { return x.del; }).map(function (x) { return { id: x.id, at: x.del, label: 'Enregistrement · ' + x.name, act: 'trash-restore-rec' }; }));
    items.sort(function (a, b) { return b.at - a.at; });
    t.innerHTML = items.length ? items.map(function (x) { var left = Math.max(0, Math.ceil((x.at + DAY - Date.now()) / 3600000)); return '<div class="metric"><span style="min-width:0;overflow-wrap:anywhere">' + esc(x.label) + '<br><span class="small muted">encore ' + left + ' h</span></span><button class="chip" data-act="' + x.act + '" data-v="' + esc(x.id) + '">Restaurer</button></div>'; }).join('') : '<p class="muted small" style="margin:0">La corbeille est vide.</p>';
  }).catch(function () { t.innerHTML = '<p class="muted small" style="margin:0">Corbeille indisponible.</p>'; });
}

/* ---------- après chaque affichage ---------- */
function pwaAfterRender() {
  try {
    if (view.tab === 'studio') { if (!view.sub) refreshLib(); else { var ra = byIdEl('resAudio'); if (ra) playInto(ra.querySelector('.rplay'), ra.getAttribute('data-aid')); } }
    if (view.tab === 'proofs') {
      fillProofList();
      var ps = byIdEl('pSearch'); if (ps) ps.oninput = function () { pwa.proofFilter = ps.value; fillProofList(); };
      var pf = byIdEl('proofFile'); if (pf) pf.onchange = function () {
        var f = pf.files && pf.files[0]; if (!f) return; var fr = new FileReader();
        fr.onload = function () {
          try {
            var list = importProofsText(f.name, String(fr.result)), pk = {}; S.proofs.forEach(function (p) { pk[norm(p.sujet + p.fait + p.url)] = 1; });
            var n = 0; list.forEach(function (p) { var k = norm(p.sujet + p.fait + p.url); if (!pk[k]) { pk[k] = 1; S.proofs.push({ id: uid() + n, sujet: p.sujet, fait: p.fait, url: p.url, tags: p.tags, date: p.date || today() }); n++; } });
            persist(); pwa.msg = n + ' preuve(s) importée(s)' + (list.length - n ? ', ' + (list.length - n) + ' déjà présente(s)' : '') + '.'; render();
          } catch (e) { var pm = byIdEl('proofMsg'); if (pm) pm.textContent = 'Import refusé : ' + (e && e.message || 'fichier invalide'); }
        };
        fr.readAsText(f);
      };
    }
    if (view.tab === 'settings') {
      fillSettings();
      var imf = byIdEl('impFile'); if (imf) imf.onchange = function () { onImportFile(imf.files && imf.files[0]); };
    }
  } catch (e) { errLog.push('afterRender: ' + (e && e.message)); }
}

/* ---------- actions ---------- */
function pwaAct(act, v, el, ev) {
  switch (act) {
    case 'settings': pwa.msg = ''; go('settings'); return true;
    case 'theme-set': lsSet('ao_theme', v); applyTheme(v); render(); return true;
    case 'sr-toggle': S.set = S.set || {}; S.set.sr = !!el.checked; persist(); return true;
    case 'install': if (pwa.installEvt) { pwa.installEvt.prompt(); pwa.installEvt.userChoice.then(function () { pwa.installEvt = null; render(); }); } return true;
    case 'inst-hide': lsSet('ao_inst_dismiss', '1'); render(); return true;
    case 'bk-later': lsSet('ao_bk_dismiss', today()); render(); return true;
    case 'update-check': swCheck(); return true;
    case 'update-now': swApply(); return true;
    case 'export-data': exportState(); if (view.tab === 'home' || view.tab === 'settings') setTimeout(render, 50); return true;
    case 'export-recs': exportRecs(); return true;
    case 'imp-merge': doMerge(); return true;
    case 'imp-cancel': pwa.imp = null; render(); return true;
    case 'imp-rollback': rollbackImport(); return true;
    case 'persist-ask': persistAsk(false); return true;
    case 'why-edit': pwa.msg = ''; go('settings'); setTimeout(function () { var w = byIdEl('whyEdit'); if (w) { w.scrollIntoView(); var t = byIdEl('whyText'); if (t) t.focus(); } }, 30); return true;
    case 'why-save': var wt = byIdEl('whyText'); S.why = wt && wt.value.trim() ? wt.value.trim().slice(0, 6000) : null; persist(); pwa.msg = 'Texte enregistré.'; render(); return true;
    case 'why-reset': S.why = null; persist(); pwa.msg = 'Texte d’origine rétabli.'; render(); return true;
    case 'rec-play': playInto(el.closest('.ritem').querySelector('.rplay'), v); return true;
    case 'rec-ren':
      var nm = el.closest('.ritem').querySelector('.rname'); var cur = nm.querySelector('b').textContent;
      nm.textContent = ''; var inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 60; inp.value = cur; inp.className = 'rn';
      var ok = document.createElement('button'); ok.className = 'chip'; ok.textContent = 'OK'; ok.setAttribute('data-act', 'rec-ren-ok'); ok.setAttribute('data-v', v);
      nm.appendChild(inp); nm.appendChild(ok); inp.focus(); return true;
    case 'rec-ren-ok':
      var ni = el.closest('.rname').querySelector('input').value.trim().slice(0, 60);
      idbGet('rec', v).then(function (r) { if (!r || !ni) return; r.name = ni; return idbPut('rec', r); }).then(refreshLib); return true;
    case 'rec-dl': idbGet('rec', v).then(function (r) { if (r) saveFile(safeName(r.name) + '.' + extFor(r.mime), r.blob); }); return true;
    case 'rec-del': idbGet('rec', v).then(function (r) { if (!r) return; r.del = Date.now(); return idbPut('rec', r); }).then(function () { toast('Placé dans la corbeille (24 h)'); refreshLib(); }); return true;
    case 'rec-keep': if (st.blob) pwaSaveRec(st.blob, st.audioLen); return true;
    case 'trash-restore': trashRestore(v); return true;
    case 'trash-restore-rec': trashRestoreRec(v); return true;
    case 'proof-add':
      var su = byIdEl('pSujet').value.trim(), fa = byIdEl('pFait').value.trim(), ur = byIdEl('pUrl').value.trim(), tg = byIdEl('pTags').value.trim(), dt = byIdEl('pDate').value || today();
      if (!fa) { toast('Écris le fait ou le chiffre à garder.'); return true; }
      if (pwa.proofEdit) { var pe = byId(S.proofs, pwa.proofEdit); if (pe) { pe.sujet = su; pe.fait = fa; pe.url = ur; pe.tags = tg; pe.date = dt; } pwa.proofEdit = null; }
      else S.proofs.unshift({ id: uid(), sujet: su, fait: fa, url: ur, tags: tg, date: dt });
      pwa.prefill = ''; persist(); toast('Preuve enregistrée'); render(); return true;
    case 'proof-edit': pwa.proofEdit = v; render(); window.scrollTo(0, document.body.scrollHeight); return true;
    case 'proof-cancel': pwa.proofEdit = null; render(); return true;
    case 'proof-del':
      var pd = byId(S.proofs, v); if (pd) { trashPut('proof', pd.sujet || pd.fait.slice(0, 40), pd); S.proofs = S.proofs.filter(function (x) { return x.id !== v; }); persist(); toast('Placée dans la corbeille (24 h)'); render(); } return true;
    case 'sess-del':
      var sd = byId(S.sessions, v); if (sd) { trashPut('session', sd.date + ' · ' + sd.sujet, sd); S.sessions = S.sessions.filter(function (x) { return x.id !== v; }); persist(); toast('Séance placée dans la corbeille (24 h)'); view = { tab: 'home', sub: null }; render(); } return true;
    case 'lesson-reset': trashPut('lesson', v, { id: v, done: !!S.done[v], quiz: S.quiz[v] != null ? S.quiz[v] : null }); delete S.done[v]; delete S.quiz[v]; quizState = null; persist(); toast('Progression de la leçon mise de côté (24 h)'); render(); return true;
    case 'coach-copy': var cs = byId(S.sessions, v); if (cs) copyText(coachPrompt(cs), el); return true;
    case 'coach-save': var cs2 = byId(S.sessions, v); if (cs2) { cs2.note = byIdEl('coachNote').value.slice(0, 4000); persist(); toast('Note enregistrée'); } return true;
    case 'angles-copy':
      var ti = byIdEl('topicIn'); proofTopic = ti ? ti.value.trim() : ''; if (!proofTopic) { toast('Écris d’abord un sujet.'); return true; }
      copyText('Sujet de discours : « ' + proofTopic + ' ». Propose 4 angles d’argumentation en français. Pour chacun : l’angle, et le type de preuve à aller chercher avec l’endroit où la trouver. N’invente aucun chiffre ni aucune source.', el); return true;
    case 'angles-save': S.angles = byIdEl('anglesNote').value.slice(0, 6000); persist(); toast('Notes enregistrées'); return true;
    case 'daily-go': var dv = v.split('|'), dt2 = byId(D.exerciseTypes, dv[0]); if (dt2 && dt2.id === 'express') { if (ex.phase === 'setup') { var th = D.themeAll[+dv[1] % D.themeAll.length]; ex.theme = th.t; ex.themeCat = th.c; exSave(); } st.type = 'express'; st.sujet = ex.theme; if (ex.phase === 'speak') exEnterSpeak(); go('studio'); } else if (dt2) { st.type = dt2.id; if (D.durations.indexOf(st.dur) < 0) st.dur = 60; st.sujet = dt2.sujets[+dv[1] % dt2.sujets.length]; go('studio'); } return true;
  }
  return false;
}

/* ---------- service worker, installation, accès ---------- */
function swInit() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    pwa.swReg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) pwa.updateReady = true;
    reg.addEventListener('updatefound', function () {
      var w = reg.installing; if (!w) return;
      w.addEventListener('statechange', function () {
        if (w.state === 'installed' && navigator.serviceWorker.controller) { pwa.updateReady = true; toast('Mise à jour prête : Réglages', true); if (view.tab === 'home' || view.tab === 'settings') render(); }
      });
    });
  }).catch(function () {});
  navigator.serviceWorker.ready.then(function () { pwa.offlineReady = true; if (view.tab === 'settings') render(); });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (pwa.wantReload) { pwa.wantReload = false; location.reload(); } });
}
function swCheck() {
  if (!pwa.swReg) { pwa.msg = 'Mises à jour non disponibles sur ce navigateur.'; render(); return; }
  pwa.swReg.update().then(function () {
    setTimeout(function () { pwa.msg = pwa.updateReady || pwa.swReg.waiting ? 'Une nouvelle version est prête.' : 'Tu as déjà la dernière version.'; if (pwa.swReg.waiting) pwa.updateReady = true; render(); }, 1200);
  }).catch(function () { pwa.msg = 'Vérification impossible (hors ligne ?).'; render(); });
}
function swApply() {
  var w = pwa.swReg && pwa.swReg.waiting; if (!w) { location.reload(); return; }
  pwa.wantReload = true; w.postMessage({ type: 'SKIP_WAITING' });
}
function showLock(msg) {
  var d = document.createElement('div'); d.className = 'lock'; d.setAttribute('role', 'alertdialog');
  var b = document.createElement('div'); b.className = 'lockbox';
  var h = document.createElement('h2'); h.textContent = 'Accès suspendu'; var p = document.createElement('p'); p.textContent = msg || 'Cette appli est momentanément désactivée.';
  var q = document.createElement('p'); q.className = 'small'; q.textContent = 'Tes données restent sur ton téléphone et ne sont pas supprimées.';
  b.appendChild(h); b.appendChild(p); b.appendChild(q); d.appendChild(b); document.body.appendChild(d);
}
function pwaBoot() {
  applyTheme(themePref());
  if (!S.since) { S.since = Date.now(); persist(); }
  try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(function (p) { pwa.persisted = p; }); } catch (e) {}
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pwa.installEvt = e; if (view.tab === 'home' || view.tab === 'settings') render(); });
  window.addEventListener('appinstalled', function () { pwa.installEvt = null; render(); });
  trashPurge(); setInterval(trashPurge, 3600000);
  swInit();
  var cv = byIdEl('cover');
  if (cv) {
    var seen = false; try { seen = sessionStorage.getItem('ao_cover') === '1'; } catch (e) {}
    var closeCover = function () { try { sessionStorage.setItem('ao_cover', '1'); } catch (e) {} cv.classList.add('out'); setTimeout(function () { gate.stop(); if (cv.parentNode) cv.parentNode.removeChild(cv); }, 520); };
    if (seen) cv.parentNode.removeChild(cv);
    else {
      var rain = byIdEl('rain'); if (rain) { try { gate.start(rain); } catch (e) {} }
      var go1 = byIdEl('coverGo'), st = byIdEl('cstat'), busy = false;
      if (go1) go1.onclick = function () {
        if (busy) return; busy = true; go1.disabled = true; go1.textContent = 'Vérification…';
        var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, gap = calm ? 60 : 340;
        var L = ['Identité · Stephen ✓', 'Signature · by Stephen ✓', 'Accès · validé ✓'];
        L.forEach(function (t, i) { setTimeout(function () { if (!st) return; var d = document.createElement('div'); d.textContent = t; st.appendChild(d); if (i === L.length - 1) { go1.textContent = 'Bienvenue, Stephen'; setTimeout(closeCover, calm ? 80 : 450); } }, gap * (i + 1)); });
      };
    }
  }
  try {
    if (navigator.onLine !== false) fetch('acces.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.actif === false) showLock(j.message); }).catch(function () {});
  } catch (e) {}
}
