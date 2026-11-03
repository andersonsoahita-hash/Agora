const { chromium } = require('playwright'); const start = require('./server');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'OK   ' : 'FAIL ') + n + (x !== undefined && !c ? ' → ' + JSON.stringify(x) : '')); if (!c) fails++; };
const INIT = () => {
  window.__spoken = []; window.__pause = 0; window.__resume = 0; window.__sr = null;
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [{ lang: 'fr-FR', localService: true, name: 'Test' }], cancel() {}, speak(u) { if (u.text.trim()) window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 150); } } });
  window.SpeechRecognition = window.webkitSpeechRecognition = function () { window.__sr = this; this.start = () => {}; this.stop = () => {}; };
  const P = MediaRecorder.prototype, p0 = P.pause, r0 = P.resume; P.pause = function () { window.__pause++; return p0.apply(this, arguments); }; P.resume = function () { window.__resume++; return r0.apply(this, arguments); };
};
(async () => {
  const { srv, url } = await start(4185);
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const mk = async (ls) => { const c = await b.newContext({ viewport: { width: 393, height: 852 }, permissions: ['microphone'], reducedMotion: 'reduce' }); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); p.ext = []; p.on('request', r => { const u = r.url(); if (!u.startsWith('http://localhost:4185') && !u.startsWith('data:') && !u.startsWith('blob:')) p.ext.push(u); });
    await p.addInitScript(INIT); await p.addInitScript((v) => { try { if (!localStorage.getItem('ao_obj')) localStorage.setItem('ao_obj', JSON.stringify(v)); } catch (e) {} }, ls);
    await p.goto(url); await p.click('#coverGo'); await p.waitForSelector('#cover', { state: 'detached', timeout: 8000 }); await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(400); return p; };
  const live = (p) => p.waitForSelector('#objLive', { timeout: 6000 }).then(() => p.innerText('#objLive')).catch(() => '');
  // --- debat + camp imposé
  let p = await mk({ on: true, mode: 'rand', voice: false, fast: true });
  await p.click('[data-act=st-type][data-v=debat]'); await p.waitForTimeout(250);
  let t = await p.innerText('#app'); ok('débat : camp imposé POUR/CONTRE', /Tu défends\s*:\s*(POUR|CONTRE)/i.test(t) && /Autre sujet et autre camp/i.test(t) && !/undefined/.test(t));
  const seen = new Set(); for (let i = 0; i < 14; i++) { await p.click('[data-act=st-new]'); await p.waitForTimeout(40); const m = (await p.innerText('#app')).match(/Tu défends\s*:\s*(POUR|CONTRE)/i); if (m) seen.add(m[1].toUpperCase()); } ok('débat : les deux camps sortent', seen.size === 2, [...seen]);
  ok('panneau objections visible', !!(await p.$('#objCard')) && /Quelqu’un te coupe la parole/.test(await p.innerText('#objCard')));
  ok('mode « selon ce que je dis » proposé', !!(await p.$('[data-act=obj-mode][data-v=kw]')));
  // --- niveau 1 : au hasard
  await p.click('[data-act=st-dur][data-v="30"]'); await p.waitForTimeout(100);
  await p.click('[data-act=rec-toggle]'); let box = await live(p);
  const G = await p.evaluate(() => window.AO_DATA.objections.generic);
  ok('niveau 1 : une objection s’affiche', box.length > 10 && G.some(g => box.includes(g)), box);
  await p.waitForTimeout(3200); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(1500);
  ok('l’objection disparaît à l’arrêt', !(await p.$('#objLive')));
  await p.waitForFunction(() => { const b = document.getElementById('goAnalyse'); return b && !b.disabled; }, null, { timeout: 8000 }); await p.click('#goAnalyse'); await p.waitForFunction(() => /Objections reçues|Résultat/i.test(document.getElementById('app').innerText), null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(500); t = await p.innerText('#app');
  ok('résultat : objections reçues', /Objections reçues/.test(t) && !/undefined/.test(t), t.slice(0, 200));
  const st1 = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1')).sessions[0]); ok('séance : objs + camp enregistrés', st1.objs && st1.objs.length >= 1 && /POUR|CONTRE/.test(st1.stance || ''), st1);
  ok('niveau 1 : aucun appel externe', p.ext.length === 0, p.ext); ok('niveau 1 : aucune erreur JS', p.errs.length === 0, p.errs);
  // --- voix + pause de l'enregistreur
  p = await mk({ on: true, mode: 'rand', voice: true, fast: true });
  await p.click('[data-act=st-dur][data-v="30"]'); await p.click('[data-act=rec-toggle]'); box = await live(p); await p.waitForTimeout(900);
  const sp = await p.evaluate(() => ({ s: window.__spoken, pa: window.__pause, re: window.__resume }));
  ok('voix : l’objection est lue', sp.s.length >= 1 && G.some(g => sp.s[0] === g), sp);
  ok('voix : l’enregistrement fait pause puis reprend', sp.pa >= 1 && sp.re >= 1, sp);
  await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(800); ok('voix : aucune erreur JS', p.errs.length === 0, p.errs);
  // --- niveau 2 : selon les mots
  p = await mk({ on: true, mode: 'kw', voice: false, fast: true });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ao_state_v1') || '{}'); s.set = Object.assign({}, s.set, { sr: true }); localStorage.setItem('ao_state_v1', JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(500); if (await p.$('#coverGo')) { await p.click('#coverGo'); await p.waitForSelector('#cover', { state: 'detached' }); } await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(400);
  t = await p.innerText('#app'); ok('niveau 2 : mode actif et expliqué', /Elle repère des mots/.test(t), t.slice(0, 300));
  await p.click('[data-act=st-dur][data-v="120"]'); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(1100);
  await p.evaluate(() => window.__sr && window.__sr.onresult({ resultIndex: 0, results: [[{ transcript: 'je pense que tout le monde est toujours d’accord avec ça' }]] }));
  box = await live(p); ok('niveau 2 : réagit à un mot prononcé', /« (je pense que|tout le monde|toujours) »/.test(box), box);
  await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(800);
  // --- niveau 2 : ce qui manque (exemple)
  p = await mk({ on: true, mode: 'kw', voice: false, fast: true });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ao_state_v1') || '{}'); s.set = Object.assign({}, s.set, { sr: true }); localStorage.setItem('ao_state_v1', JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(500); if (await p.$('#coverGo')) { await p.click('#coverGo'); await p.waitForSelector('#cover', { state: 'detached' }); } await p.click('#tabbar [data-v=studio]'); await p.waitForTimeout(400);
  await p.click('[data-act=st-dur][data-v="60"]'); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(150);
  await p.evaluate(() => window.__sr && window.__sr.onresult({ resultIndex: 0, results: [[{ transcript: 'Le marché évolue vite et les marques doivent s’adapter à leurs clients chaque saison de l’année.' }]] }));
  box = await live(p); const NE = await p.evaluate(() => window.AO_DATA.objections.noExample); ok('niveau 2 : relève l’absence d’exemple', NE.some(x => box.includes(x)), box);
  await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(800);
  // --- désactivé
  p = await mk({ on: false, mode: 'rand', voice: false, fast: true });
  await p.click('[data-act=st-dur][data-v="30"]'); await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(2500); ok('objections coupées : rien ne s’affiche', !(await p.$('#objLive')));
  await p.click('[data-act=rec-toggle]'); await p.waitForTimeout(500);
  await b.close(); srv.close(); console.log(fails ? 'ÉCHECS : ' + fails : 'OBJECTIONS OK'); process.exit(fails ? 1 : 0);
})();
