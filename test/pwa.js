const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const start = require('./server');
const SHOT = '/tmp/claude-0/-home-claude/adb16bb4-f64b-5c56-930e-024fea637c82/scratchpad/';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'OK   ' : 'FAIL ') + n + (x !== undefined && !c ? ' → ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const { srv, url } = await start(4174);
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const mk = async (opts) => { const c = await b.newContext(Object.assign({ viewport: { width: 393, height: 852 }, acceptDownloads: true, permissions: ['microphone'] }, opts || {})); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); p.ext = []; p.on('request', r => { const u = r.url(); if (!u.startsWith('http://localhost:4174') && !u.startsWith('data:') && !u.startsWith('blob:')) p.ext.push(u); }); await p.goto(url); await p.click('#coverGo'); await p.waitForTimeout(650); return { c, p }; };
  const txt = p => p.innerText('#app');
  const tab = async (p, t) => { await p.click('#tabbar [data-v=' + t + ']'); await p.waitForTimeout(250); };
  let { c: c1, p } = await mk();
  // --- onglets
  for (const t of ['studio', 'course', 'orators', 'prep', 'proofs', 'home']) { await tab(p, t); ok('onglet ' + t, (await txt(p)).length > 40); }
  // --- Cours : 66 leçons accessibles, leçon et quiz
  await tab(p, 'course'); const nLes = await p.evaluate(() => window.AO_DATA.lessons.length); ok('66 leçons conservées', nLes >= 66, nLes);
  ok('éristique présent', await p.evaluate(() => window.AO_DATA.lessons.some(l => l.src === 'schop')));
  // --- enregistrement simulé
  await tab(p, 'studio'); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(3500); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(1500);
  let lib = await p.innerText('#recLib'); ok('enregistrement gardé dans la liste', /Écouter/.test(lib), lib);
  ok('transcription auto OFF par défaut', !(await p.evaluate(() => !!(window.__sr))));
  await p.click('[data-act=rec-play]'); await p.waitForTimeout(400); ok('lecteur audio', !!(await p.$('.rplay audio')));
  await p.click('[data-act=rec-ren]'); await p.fill('.rname input', 'Ma première prise'); await p.click('[data-act=rec-ren-ok]'); await p.waitForTimeout(500);
  ok('renommer', (await p.innerText('#recLib')).includes('Ma première prise'));
  await p.fill('#trIn', 'Je pense que la parole est un art. Donc, premièrement, il faut structurer. Parce que, par exemple, un plan clair aide.'); 
  await p.click('#goAnalyse'); await p.waitForTimeout(6000);
  const res = await txt(p); ok('résultat analyse', /Résultat/.test(res), res.slice(0, 80)); ok('lecteur dans le résultat', !!(await p.$('#resAudio audio')));
  ok('boîte coach manuelle, pas de bouton IA', /Retour de coach/.test(res) && !/Demander un retour/.test(res));
  await p.fill('#coachNote', 'Bon rythme'); await p.click('[data-act=coach-save]');
  await p.click('[data-act=coach-copy]'); await p.waitForTimeout(300);
  const nbSess = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1')).sessions.length); ok('séance enregistrée', nbSess === 1, nbSess);
  // corbeille : enregistrement
  await p.click('[data-act=back]'); await tab(p, 'studio'); await p.waitForTimeout(500);
  await p.click('[data-act=rec-del]'); await p.waitForTimeout(500); ok('enregistrement vers corbeille', /Aucun enregistrement/.test(await p.innerText('#recLib')));
  await p.click('#tabbar [data-v=home]'); await p.click('[data-act=settings]'); await p.waitForTimeout(800);
  ok('corbeille liste', /Enregistrement · Ma première prise/.test(await txt(p)));
  await p.click('[data-act=trash-restore-rec]'); await p.waitForTimeout(700); ok('restauration enregistrement', !/Enregistrement · Ma première prise/.test(await p.innerText('#trashList')));
  // --- preuves
  await p.click('#tabbar [data-v=proofs]');
  await p.fill('#pSujet', 'Luxe durable'); await p.fill('#pFait', 'Le marché mondial du luxe pèse environ 1500 Md€'); await p.fill('#pUrl', 'https://example.org/etude'); await p.fill('#pTags', 'luxe, marché'); await p.click('[data-act=proof-add]'); await p.waitForTimeout(300);
  await p.fill('#pSujet', '<img src=x onerror="window.__xss=1">'); await p.fill('#pFait', 'test <b>gras</b> "guillemets"'); await p.click('[data-act=proof-add]'); await p.waitForTimeout(300);
  ok('2 preuves', (await p.$$('#pList .metric')).length === 2);
  ok('XSS neutralisé', !(await p.evaluate(() => window.__xss)) && !(await p.$('#pList img')));
  await p.fill('#pSearch', 'MARCHÉ luxe'); await p.waitForTimeout(200); ok('recherche locale sans accents/casse', (await p.$$('#pList .metric')).length === 1);
  await p.fill('#pSearch', ''); await p.waitForTimeout(150);
  await p.click('[data-act=proof-edit] >> nth=1'); await p.waitForTimeout(300); await p.fill('#pFait', 'Chiffre modifié 42'); await p.click('[data-act=proof-add]'); await p.waitForTimeout(300);
  ok('modification', /Chiffre modifié 42/.test(await p.innerText('#pList')) || /Chiffre modifié 42/.test(await txt(p)));
  fs.writeFileSync('/tmp/imp.txt', 'Sujet A | Fait A | https://a.fr\nSujet B | Fait B | \nUne ligne seule sans séparateur\n');
  await p.setInputFiles('#proofFile', '/tmp/imp.txt'); await p.waitForTimeout(500);
  ok('import txt de preuves', (await p.$$('#pList .metric')).length === 5, (await p.$$('#pList .metric')).length);
  await p.click('[data-act=proof-del] >> nth=0'); await p.waitForTimeout(300); ok('suppression preuve', (await p.$$('#pList .metric')).length === 4);
  // --- leçon terminée + quiz pour avoir de la progression
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ao_state_v1')); s.done.c1 = true; s.quiz.c1 = 3; s.xp = 120; localStorage.setItem('ao_state_v1', JSON.stringify(s)); });
  // --- export
  await p.reload(); await p.waitForTimeout(500); if (await p.$('#coverGo')) { await p.click('#coverGo'); await p.waitForTimeout(600); }
  await p.click('[data-act=settings]'); await p.waitForTimeout(500);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export-data]')]); const expPath = '/tmp/agora-exp.json'; await dl.saveAs(expPath);
  const exp = JSON.parse(fs.readFileSync(expPath, 'utf8')); ok('export format', exp.app === 'agora' && exp.state.sessions.length === 1 && exp.state.proofs.length === 4 && exp.state.done.c1, Object.keys(exp));
  const [dl2] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=export-recs]')]); await dl2.saveAs('/tmp/agora-recs.json');
  const er = JSON.parse(fs.readFileSync('/tmp/agora-recs.json', 'utf8')); ok('export enregistrements séparé', er.kind === 'recordings' && er.recordings.length === 1 && er.recordings[0].data.startsWith('data:'));
  ok('dernière sauvegarde mise à jour', /Dernière sauvegarde : (?!jamais)/.test(await txt(p)));
  await p.screenshot({ path: SHOT + 'settings2.png', fullPage: true });
  // --- import dans un contexte vierge (nouveau téléphone)
  const { c: c2, p: q } = await mk(); await q.click('[data-act=settings]'); await q.waitForTimeout(400);
  await q.setInputFiles('#impFile', expPath); await q.waitForTimeout(400); ok('aperçu import', /1 séance\(s\), 4 preuve\(s\)/.test(await txt(q)), (await txt(q)).slice(0, 300));
  await q.click('[data-act=imp-merge]'); await q.waitForTimeout(800);
  let st2 = await q.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('import fusion', st2.sessions.length === 1 && st2.proofs.length === 4 && st2.done.c1 && st2.xp === 120, [st2.sessions.length, st2.proofs.length, st2.xp]);
  await q.setInputFiles('#impFile', expPath); await q.waitForTimeout(300); await q.click('[data-act=imp-merge]'); await q.waitForTimeout(800);
  st2 = await q.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('2e import sans doublons', st2.sessions.length === 1 && st2.proofs.length === 4, [st2.sessions.length, st2.proofs.length]);
  await q.setInputFiles('#impFile', '/tmp/agora-recs.json'); await q.waitForTimeout(300); await q.click('[data-act=imp-merge]'); await q.waitForTimeout(1200);
  await q.click('#tabbar [data-v=studio]'); await q.waitForTimeout(800); ok('enregistrement importé', /Écouter/.test(await q.innerText('#recLib')));
  // ancien format artifact
  fs.writeFileSync('/tmp/old.json', JSON.stringify({ goals: [{ id: 'g1', t: 'Zéro blanc', done: false }], sessions: [], done: { c2: true }, quiz: { c2: 2 }, type: null, proofs: [], prep: [], erist: { best: 5 }, xp: 300, days: ['2026-10-01'], badges: [] }));
  await q.click('#tabbar [data-v=home]'); await q.click('[data-act=settings]'); await q.setInputFiles('#impFile', '/tmp/old.json'); await q.waitForTimeout(300); await q.click('[data-act=imp-merge]'); await q.waitForTimeout(800);
  st2 = await q.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('ancien export accepté', st2.xp === 300 && st2.done.c2 && st2.done.c1 && st2.goals.length === 1 && st2.erist.best === 5, st2.xp);
  // fichiers invalides
  for (const [n, body] of [['{pas du json', 'invalide'], ['[1,2,3]', 'tableau'], ['{"foo":1}', 'objet inconnu']]) { fs.writeFileSync('/tmp/bad.json', n); await q.setInputFiles('#impFile', '/tmp/bad.json'); await q.waitForTimeout(300); ok('refus fichier ' + body, /Import refusé/.test(await txt(q)) && !(await q.$('[data-act=imp-merge]'))); }
  const before = JSON.stringify(await q.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))));
  fs.writeFileSync('/tmp/hostile.json', JSON.stringify({ app: 'agora', state: { sessions: [{ id: '../x', date: 1, sujet: 2 }], proofs: [{ id: 'p<>', fait: 'x' }], xp: 'abc', done: { '__proto__': true, 'ok1': true }, prep: [{ id: 'z', kind: 'x' }] } }));
  await q.setInputFiles('#impFile', '/tmp/hostile.json'); await q.waitForTimeout(300); await q.click('[data-act=imp-merge]').catch(() => {}); await q.waitForTimeout(500);
  const after = await q.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('import hostile : rien d’injecté', after.sessions.length === 1 && after.proofs.length === 4 && ({}).polluted === undefined && !Object.keys(after.done).includes('__proto__') && !after.done.ok1, [after.sessions.length, after.proofs.length, Object.keys(after.done), String(({}).polluted)]);
  await q.click('[data-act=imp-rollback]'); await q.waitForTimeout(800); ok('retour copie de sécurité', /Retour à la copie|Aucune copie/.test(await txt(q)));
  // --- rappel 14 jours
  await q.evaluate(() => { const s = JSON.parse(localStorage.getItem('ao_state_v1')); s.lastExport = Date.now() - 15 * 864e5; localStorage.setItem('ao_state_v1', JSON.stringify(s)); localStorage.removeItem('ao_bk_dismiss'); });
  await q.reload(); await q.waitForTimeout(400); if (await q.$('#coverGo')) { await q.click('#coverGo'); await q.waitForTimeout(600); }
  ok('rappel de sauvegarde à 14 jours', /Pense à sauvegarder/.test(await txt(q)));
  await q.screenshot({ path: SHOT + 'home-reminder.png' });
  // --- hors ligne
  await q.waitForTimeout(1000); await c2.setOffline(true); await q.reload(); await q.waitForTimeout(800);
  ok('hors ligne : l’appli s’ouvre', /Agora/.test(await q.innerText('body')) && !!(await q.$('#tabbar button')));
  await q.click('#tabbar [data-v=course]'); await q.waitForTimeout(300); ok('hors ligne : cours lisible', /Chapitre|Éristique|Atelier|Cours/.test(await txt(q)));
  await c2.setOffline(false);
  // --- clair / sombre
  await p.click('#tabbar [data-v=home]'); await p.waitForTimeout(200);
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await p.waitForTimeout(200); await p.screenshot({ path: SHOT + 'home-dark.png' });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light')); await p.waitForTimeout(200); await p.screenshot({ path: SHOT + 'home-light.png' });
  // --- pas d'appels externes, pas d'erreurs
  ok('aucune requête externe', p.ext.length === 0 && q.ext.length === 0, p.ext.concat(q.ext));
  ok('aucune erreur JS (page 1)', p.errs.length === 0, p.errs); ok('aucune erreur JS (page 2)', q.errs.length === 0, q.errs);
  await b.close(); srv.close(); console.log(fails ? 'ÉCHECS: ' + fails : 'TOUT OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
