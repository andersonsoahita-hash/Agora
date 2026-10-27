const { chromium } = require('playwright'); const start = require('./server');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'OK   ' : 'FAIL ') + n + (x !== undefined && !c ? ' → ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const { srv, ctl, url } = await start(4176);
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 393, height: 852 }, reducedMotion: 'reduce' }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(500);
  ok('couverture présente au lancement', await p.isVisible('#cover'));
  const anim = await p.evaluate(() => getComputedStyle(document.querySelector('.cname')).animationName); ok('animations coupées si « réduire les animations »', anim === 'none', anim);
  await p.click('#coverGo'); await p.waitForTimeout(300);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('ao_state_v1')); s.xp = 55; s.goals = [{ id: 'g9', t: 'garde-moi', done: false }]; localStorage.setItem('ao_state_v1', JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(1500);
  ok('couverture non réaffichée dans la même session', !(await p.$('#cover')));
  await p.click('[data-act=settings]'); await p.waitForTimeout(300);
  const v1 = await p.evaluate(async () => { const ks = await caches.keys(); return ks; }); ok('cache versionné', v1.length === 1 && /^agora-[0-9a-f]{10}$/.test(v1[0]), v1);
  ctl.swExtra = '\n// nouvelle version';
  await p.click('[data-act=update-check]'); await p.waitForTimeout(3500);
  const t = await p.innerText('#app'); ok('mise à jour détectée', /Mettre à jour maintenant/.test(t), t.slice(0, 120));
  await p.click('[data-act=update-now]'); await p.waitForTimeout(2500);
  const st = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('données intactes après mise à jour', st.xp === 55 && st.goals[0].t === 'garde-moi', st);
  ok('app fonctionnelle après mise à jour', !!(await p.$('#tabbar button')) && /Agora/.test(await p.innerText('body')));
  // coupe-circuit
  ctl.acces = '{"actif":false,"message":"Pause de test"}'; await p.reload(); await p.waitForTimeout(1200);
  ok('coupe-circuit : message affiché', await p.isVisible('.lock') && /Pause de test/.test(await p.innerText('.lock')));
  const st2 = await p.evaluate(() => JSON.parse(localStorage.getItem('ao_state_v1'))); ok('coupe-circuit : données non supprimées', st2.xp === 55);
  ctl.acces = '{"actif":true}'; await p.reload(); await p.waitForTimeout(1000); ok('coupe-circuit levé', !(await p.$('.lock')));
  // manifeste
  const m = await (await fetch(url + 'manifest.webmanifest')).json(); ok('manifeste', m.display === 'standalone' && m.icons.length === 3 && m.lang === 'fr' && m.start_url === './', m);
  for (const i of m.icons) { const r = await fetch(url + i.src); ok('icône ' + i.src, r.ok && /png/.test(r.headers.get('content-type'))); }
  ok('aucune erreur JS', errs.length === 0, errs);
  await b.close(); srv.close(); console.log(fails ? 'ÉCHECS: ' + fails : 'TOUT OK'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
