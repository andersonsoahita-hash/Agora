const { chromium } = require('playwright');
const fs = require('fs');
const art = fs.readFileSync(__dirname + '/_legacy/artifact.html', 'utf8');
let bad = 0; const ck = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) bad++; };
const TXT = "Je voudrais dire une chose simple : le bonheur, c'est d'abord se sentir utile. Attention, je ne dis pas qu'il faut tout sacrifier aux autres. Certes, on peut être heureux seul un dimanche ; mais ce n'est pas ce qui tient dans la durée. Prenons le cas d'une personne qui s'occupe d'un proche : elle est fatiguée, et pourtant elle tient. Autrement dit : on supporte presque tout quand cela sert à quelqu'un.";
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body><script>window.claude={use:async()=>null}<\/script>' + art + '</body></html>');
  await p.waitForTimeout(300);
  let t = await p.innerText('body');
  ck(/ton rang/i.test(t) && /passant/i.test(t), 'accueil : rang Passant');
  ck(/Récompenses/.test(t) && /0 \/ 12/.test(t), 'accueil : 0 / 12 récompenses');
  // cours : module
  await p.click('[data-act=tab][data-v=course]');
  t = await p.innerText('body');
  ck(/Construire et relier ses idées/.test(t) && /X5\./.test(t), 'cours : module visible avec X1..X5');
  // Studio : exercice
  await p.click('[data-act=tab][data-v=studio]');
  await p.click('[data-act=st-type][data-v=connecteurs]');
  t = await p.innerText('body');
  ck(/Niveau 0 · Nouveau/.test(t), 'studio : niveau 0 au départ');
  await p.fill('#trIn', TXT);
  await p.click('#goAnalyse');
  await p.waitForSelector('text=Les 5 étapes dans ton texte', { timeout: 8000 });
  t = await p.innerText('body');
  ck(/: 5 \/ 5/.test(t), 'résultat : 5 / 5 étapes détectées');
  await p.click('[data-act=back]'); await p.click('[data-act=tab][data-v=home]'); const ev = parseInt((await p.innerText('.rank .pill')).replace(/\D/g,''),10); await p.click('[data-act=tab][data-v=studio]');
  ck(ev >= 10 + 5 + 15, 'xp : bonus des étapes (' + ev + ')');
  // retour accueil
  await p.click('[data-act=tab][data-v=home]');
  t = await p.innerText('body');
  ck(/auditeur|passant/i.test(t) && /première parole/i.test(t), 'accueil : rang et badge Première parole');
  ck(/cinq sur cinq/i.test(t), 'badge Cinq sur cinq présent');
  await p.screenshot({ path: '/tmp/l_home.png' });
  // niveau 1
  await p.click('[data-act=tab][data-v=studio]');
  await p.click('[data-act=st-type][data-v=connecteurs]');
  t = await p.innerText('body');
  ck(/Niveau 1 · Découverte/.test(t), 'studio : niveau 1 après 1 séance');
  // leçon x1 : quiz parfait
  await p.click('[data-act=tab][data-v=course]');
  await p.click('[data-act=lesson][data-v=x1]');
  t = await p.innerText('body');
  ck(/atelier x1/i.test(t), 'leçon : Atelier X1');
  await p.screenshot({ path: '/tmp/l_lesson.png' });
  console.log('erreurs JS', errs);
  ck(errs.length === 0, 'aucune erreur JS');
  await b.close();
  console.log(bad ? 'LEVELS FAIL' : 'LEVELS OK'); process.exit(bad ? 1 : 0);
})();
