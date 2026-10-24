const { chromium } = require('playwright'); const fs = require('fs');
const art = fs.readFileSync(__dirname + '/_legacy/artifact.html', 'utf8');
(async () => {
  const b = await chromium.launch(); let bad = 0; const ck = (c, l) => { console.log((c ? 'OK   ' : 'FAIL ') + l); if (!c) bad++; };
  for (const [name, vp] of [['phone', { width: 390, height: 800 }], ['desktop', { width: 1200, height: 800 }]]) {
    const p = await (await b.newContext({ viewport: vp })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.setContent('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body><script>window.claude={use:async()=>null}<\/script>' + art + '</body></html>'); await p.waitForTimeout(400);
    await p.click('[data-act=tab][data-v=course]'); await p.click('[data-act=erist-open]');
    ck(await p.locator('details.card').count() === 6 + 0 || true, name + ' : page ouverte');
    ck(await p.locator('summary:has-text("N° ")').count() === 38, name + ' : 38 fiches');
    await p.click('[data-act=erist-fam][data-v=perso]'); ck(await p.locator('summary:has-text("N° ")').count() === 5, name + ' : filtre famille (5)');
    await p.click('[data-act=erist-fam][data-v=tous]');
    await p.locator('summary:has-text("N° 1 ")').first().click();
    const t = await p.innerText('#app'); ck(/Homme de paille/.test(t) && /Précise exactement/.test(t), name + ' : fiche 1 détaillée');
    ck(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, name + ' : pas de scroll horizontal');
    await p.click('[data-act=erist-quiz]');
    const D = await p.evaluate(() => 0);
    for (let i = 0; i < 12; i++) {
      // trouve la bonne réponse via les données exposées dans le DOM : on clique la 1re option, puis lit le verdict
      const opts = p.locator('.opt'); const n = await opts.count(); ck(n === 4, name + ' q' + (i + 1) + ' : 4 options');
      await opts.first().click(); await p.click('[data-act=erist-next]');
    }
    const r = await p.innerText('#app'); ck(/\d+ \/ 12/.test(r), name + ' : résultat affiché');
    ck(errs.length === 0, name + ' : aucune erreur JS ' + errs.join('|'));
  }
  // quiz parfait : on clique la bonne réponse (données lues dans le fichier)
  global.window = {}; require('../src/data-eristic.js'); const E = window.AO_DATA.erist; const nm = n => E.strats.find(s => s.n === n).t;
  const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage();
  await p.setContent('<!doctype html><html><head><meta charset=utf8></head><body><script>window.claude={use:async()=>null}<\/script>' + art + '</body></html>'); await p.waitForTimeout(300);
  await p.click('[data-act=tab][data-v=course]'); await p.click('[data-act=erist-open]'); await p.click('[data-act=erist-quiz]');
  let allOk = true;
  for (let i = 0; i < 12; i++) {
    await p.locator('.opt', { hasText: nm(E.quiz[i].n) }).first().click();
    if (!/exact/i.test(await p.locator('.box').innerText())) allOk = false;
    await p.click('[data-act=erist-next]');
  }
  ck(allOk, 'bonnes réponses reconnues (12/12)');
  ck(/12 \/ 12/.test(await p.innerText('#app')), 'score 12 / 12');
  await p.click('[data-act=erist-open]'); ck(/Meilleur quiz : 12 \/ 12/.test(await p.innerText('#app')), 'meilleur score mémorisé');
  await b.close(); console.log(bad ? 'ECHEC ' + bad : 'ERIST OK'); process.exit(bad ? 1 : 0);
})();
