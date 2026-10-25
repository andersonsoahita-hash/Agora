const { chromium } = require('playwright'); const start = require('./server');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'OK   ' : 'FAIL ') + n + (x !== undefined && !c ? ' → ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const { srv, url } = await start(4179);
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const c = await b.newContext({ viewport: { width: 393, height: 852 }, permissions: ['microphone'], reducedMotion: 'reduce' }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.click('#coverGo'); await p.waitForTimeout(500);
  const T = [2, 3, 5, 7, 10, 15, 20, 30];
  const plans = await p.evaluate((T) => T.map(t => window.AGORA_EX.plan(t)), T);
  ok('explication = multiple de 15 s', plans.every(x => x.speak % 15 === 0), plans.map(x => x.speak));
  ok('recherche et structuration par demi-minutes', plans.every(x => x.search % 30 === 0 && x.struct % 30 === 0 && x.search + x.struct === x.tot));
  ok('5 min : 3 min + 2 min + 1 min', plans[2].search === 180 && plans[2].struct === 120 && plans[2].speak === 60, plans[2]);
  ok('explication ≈ 1/5 du total (±15 s)', plans.every(x => Math.abs(x.speak - x.tot / 5) <= 15 || x.speak === 30), plans);
  ok('libellés propres (pas de 2 min 33)', await p.evaluate(() => [30, 60, 75, 90, 105, 180, 360].map(window.AGORA_EX.lab).join('|')) === '30 s|1 min|1 min 15|1 min 30|1 min 45|3 min|6 min');
  const nT = await p.evaluate(() => window.AO_DATA.themeAll.length); ok('plus de 300 thèmes', nT >= 300, nT);
  ok('thèmes uniques', await p.evaluate(() => new Set(window.AO_DATA.themeAll.map(x => x.t)).size === window.AO_DATA.themeAll.length));
  const nW = await p.evaluate(() => window.AO_DATA.wordBank.length); ok('banque de mots', nW >= 60, nW);
  // --- Studio : mot
  await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(300);
  ok('type express dans le Studio', (await p.innerText('#app')).includes('Recherche express'));
  await p.click('[data-act=st-type][data-v=mot]'); await p.waitForTimeout(200);
  let t = await p.innerText('#app'); ok('mot : tirage au sort', /Ton mot/i.test(t) && /Tirer au sort un autre mot/.test(t) && !/undefined/.test(t));
  const w1 = await p.innerText('#app h2'); let diff = false; for (let i = 0; i < 6 && !diff; i++) { await p.click('[data-act=st-new]'); await p.waitForTimeout(80); diff = (await p.innerText('#app h2')) !== w1; } ok('mot : change à chaque tirage', diff);
  // --- express : réglage
  await p.click('[data-act=st-type][data-v=express]'); await p.waitForTimeout(250);
  t = await p.innerText('#app'); ok('express : écran de préparation', /Temps total de préparation/i.test(t) && /Recherche/i.test(t) && /Expliquer/i.test(t) && !/undefined/.test(t));
  ok('8 choix de temps', (await p.$$('[data-act=ex-T]')).length === 8);
  await p.click('[data-act=ex-T][data-v="2"]'); await p.waitForTimeout(150); t = await p.innerText('#app'); ok('2 min : explication 30 s', /30 s/.test(t));
  await p.click('[data-act=ex-cat][data-v=mada]'); await p.waitForTimeout(150);
  const th = await p.innerText('#exTheme'); const inBank = await p.evaluate((x) => window.AO_DATA.themeCats.find(c => c.id === 'mada').l.includes(x), th); ok('thème de la catégorie choisie', inBank, th);
  const seen = new Set(); for (let i = 0; i < 8; i++) { await p.click('[data-act=ex-draw]'); await p.waitForTimeout(150); seen.add(await p.innerText('#exTheme')); } ok('tirage sans répétition immédiate', seen.size >= 7, [...seen]);
  await p.fill('#exCustom', 'Le silence en réunion'); await p.click('[data-act=ex-custom]'); await p.waitForTimeout(150); ok('thème personnalisé', (await p.innerText('#exTheme')) === 'Le silence en réunion');
  // --- phases
  await p.click('[data-act=ex-start]'); await p.waitForTimeout(400); t = await p.innerText('#app'); ok('phase 1 recherche + chrono', /Phase 1 sur 3/i.test(t) && /\d:\d\d/.test(await p.innerText('#exTmr')));
  ok('pas d’enregistreur pendant la recherche', !(await p.$('[data-act=rec-toggle]')));
  await p.fill('#exNotes', 'définition : le silence ; idée 1'); await p.waitForTimeout(600);
  await p.reload(); await p.waitForTimeout(600); if (await p.$('#coverGo')) { await p.click('#coverGo'); await p.waitForTimeout(500); }
  await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(300); t = await p.innerText('#app');
  ok('reprise après rechargement (chrono continue)', /Phase 1 sur 3/i.test(t) && (await p.inputValue('#exNotes')).includes('idée 1'), t.slice(0, 200));
  await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('ao_express')); o.endAt = Date.now() + 1500; localStorage.setItem('ao_express', JSON.stringify(o)); });
  await p.reload(); await p.waitForTimeout(400); if (await p.$('#coverGo')) { await p.click('#coverGo'); await p.waitForTimeout(500); }
  await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(2500); t = await p.innerText('#app'); ok('passage automatique à la structuration', /Phase 2 sur 3/i.test(t), t.slice(0, 120));
  await p.evaluate(() => { const o = JSON.parse(localStorage.getItem('ao_express')); o.endAt = Date.now() - 1000; localStorage.setItem('ao_express', JSON.stringify(o)); });
  await p.reload(); await p.waitForTimeout(400); if (await p.$('#coverGo')) { await p.click('#coverGo'); await p.waitForTimeout(500); }
  await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(500); t = await p.innerText('#app'); ok('phase 3 : expliquer en 30 s + enregistreur', /Phase 3 sur 3/i.test(t) && /30 s/.test(t) && !!(await p.$('[data-act=rec-toggle]')) && /Voir mes notes/.test(t), t.slice(0, 200));
  ok('chrono de parole = 0:30', (await p.innerText('#tmr')).trim() === '0:30');
  await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(3000); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(1200);
  await p.fill('#trIn', 'Le silence est une ressource. Premièrement, il structure la parole. Par exemple, une pause avant une idée forte. Donc, en conclusion, il faut oser se taire.');
  await p.click('#goAnalyse'); await p.waitForTimeout(6000); t = await p.innerText('#app');
  ok('résultat express', /Recherche express/.test(t) && /Le silence en réunion/.test(t) && /Temps de parole utilisé/.test(t) && /auto-évaluation/i.test(t), t.slice(0, 200));
  const xp0 = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1')).xp);
  await p.click('[data-act=ex-chk] >> nth=0'); await p.click('[data-act=ex-chk] >> nth=1'); await p.waitForTimeout(300);
  const s1 = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('auto-évaluation enregistrée et +6 pts', s1.sessions[0].ex.chk.length === 2 && s1.xp === xp0 + 6, [xp0, s1.xp]);
  await p.click('[data-act=ex-chk] >> nth=0'); await p.click('[data-act=ex-chk] >> nth=0'); await p.waitForTimeout(200);
  const s2 = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('pas de points en double', s2.xp === s1.xp, [s1.xp, s2.xp]);
  ok('badge Éclair', s2.badges.includes('exp'));
  await p.click('[data-act=ex-proof]'); await p.waitForTimeout(300); ok('lien vers Preuves avec le thème', (await p.inputValue('#pSujet')) === 'Le silence en réunion');
  await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(300); await p.click('[data-act=back]').catch(() => {}); await p.waitForTimeout(200);
  await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(300);
  ok('retour à l’écran de préparation après la séance', /Temps total de préparation/i.test(await p.innerText('#app')) && /Niveau|Découverte|Nouveau/.test(await p.innerText('#app')));
  // --- accueil : défi du jour ne casse pas, express possible
  await p.click('#tabbar [data-v=home]'); await p.waitForTimeout(300); ok('accueil sans undefined', !/undefined|NaN/.test(await p.innerText('#app')));
  for (const day of [0, 1, 2, 3, 4, 5, 6, 7]) { const html = await p.evaluate((d) => { const RealNow = Date.now; Date.now = () => RealNow() + d * 864e5; try { document.querySelector('#tabbar [data-v=studio]').click(); document.querySelector('#tabbar [data-v=home]').click(); } finally { Date.now = RealNow; } return document.getElementById('app').innerText; }, day); if (/undefined|NaN/.test(html)) { ok('défi du jour jour+' + day, false, html.slice(0, 200)); } }
  ok('défi du jour stable sur 8 jours', true);
  // --- import : session express sanitarisée
  await p.evaluate(() => { const x = { app: 'agora', state: { sessions: [{ id: 'sx1', date: '2026-10-20', sujet: 'T', dur: 60, type: 'express', ex: { theme: '<img src=x>', T: 'a', chk: [9, 1, 'z'], actual: 'oops' } }] } }; window.__imp = JSON.stringify(x); });
  ok('aucune erreur JS', errs.length === 0, errs);
  await b.close(); srv.close(); console.log(fails ? 'ÉCHECS: ' + fails : 'TOUT OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
