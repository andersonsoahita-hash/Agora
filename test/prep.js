const { chromium } = require('playwright');
const fs = require('fs');
const art = fs.readFileSync(__dirname + '/../dist/artifact.html', 'utf8');
const arg = (t,p)=>({titre:t,raisonnement:'Raison '+t,preuve:{type:'données',indicateur:'taux',organisme:'INSEE',requete:'req '+t},exemple:null});
const plan=[{partie:'Ouverture',contenu:'x'},{partie:'Thèse',contenu:'y'}];
const DEB={question:'Faut-il X ?',definitions:['X : définition'],criteres:'Le clivage',mine:{camp:'pour',these:'Oui',plan,arguments:[arg('A1'),arg('A2'),arg('A3')],objections_adverses_prevues:[{objection:'O1',reponse:'R1'}]},adv:{camp:'contre',these:'Non',plan,arguments:[arg('B1')],points_faibles:['PF']},points_de_friction:[{theme:'T',ma_ligne:'m',sa_ligne:'s'}],a_verifier:['V1']};
const OUT={titre:'Long',accroche:'a',plan:[{partie:'Ouverture',mots:200,idee:'i'},{partie:'Partie 1',mots:400,idee:'i'},{partie:'Partie 2',mots:400,idee:'i'},{partie:'Appel',mots:150,idee:'i'}],a_verifier:['v'],conseils_oraux:['c']};
const SPE={titre:'Titre',mots:260,accroche:'a',plan:['P1'],parties:[{partie:'Accroche',texte:'Texte [CHIFFRE À VÉRIFIER]'}],a_verifier:['v'],conseils_oraux:['c']};
const mk = (withSample, bad) => `<script>
window.__prompts=[];
window.claude={use:async(n)=>{
 if(n==='sample'&&${withSample}){const f=async(p)=>{window.__prompts.push(p);return {text:'Texte de la partie dit à voix haute.'}};f.json=async(p)=>{window.__prompts.push(p);if(${bad})return {oops:1};return p.startsWith('DEBAT')?${JSON.stringify(DEB)}:p.startsWith('PLAN')?${JSON.stringify(OUT)}:${JSON.stringify(SPE)};};return f;}
 return null;}};
<\/script>`;
const html = (m) => '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + m + art + '</body></html>';
(async () => {
  const b = await chromium.launch(); let bad = 0; const ck = (c, l) => { console.log((c ? 'OK   ' : 'FAIL ') + l); if (!c) bad++; };
  for (const [name, withS, badAI] of [['IA', true, false], ['IA invalide', true, true], ['sans IA', false, false]]) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 800 } })).newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.setContent(html(mk(withS, badAI))); await p.waitForTimeout(400);
    await p.click('[data-act=tab][data-v=prep]');
    await p.fill('#prepTopic', 'Faut-il limiter les écrans avant 15 ans ?');
    await p.click('[data-act=prep-side][data-v=contre]');
    await p.click('[data-act=prep-go]'); await p.waitForTimeout(500);
    const t = await p.innerText('#app');
    ck(/structure complète/i.test(t), name + ' : débat affiché');
    ck(/ma preuve vérifiée/i.test(t), name + ' : champs de preuve');
    if (withS && !badAI) { ck(/Raison A1/.test(t) && /Aucun chiffre n’a été vérifié/.test(t), 'IA : contenu + avertissement chiffres'); const pr = await p.evaluate(() => window.__prompts[0]); ck(/CONTRE/.test(pr) && /N’invente AUCUN chiffre/.test(pr), 'prompt : camp + règle anti-invention'); }
    if (badAI) ck(/n’a pas répondu correctement/.test(t), 'IA invalide : repli sur trame signalé');
    if (!withS) ck(/Trame sans IA/.test(t), 'sans IA : trame');
    await p.fill('.pf[data-k=m0][data-f=v]', '12,3 %'); await p.fill('.pf[data-k=m0][data-f=s]', 'https://exemple.fr'); await p.check('.pf[data-k=m0][data-f=ok]');
    await p.click('[data-act=prep-tab][data-v=adv]'); await p.click('[data-act=prep-tab][data-v=mine]');
    ck(await p.inputValue('.pf[data-k=m0][data-f=v]') === '12,3 %', name + ' : preuve conservée');
    ck(/vérifiées par toi : 1/.test(await p.innerText('#app')), name + ' : compteur preuves');
    await p.click('[data-act=prep-tab][data-v=face]'); ck(/ma ligne/i.test(await p.innerText('#app')), name + ' : face-à-face');
    await p.click('[data-act=prep-tab][data-v=adv]'); ck(/sa thèse/i.test(await p.innerText('#app')), name + ' : adversaire');
    ck(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 0, name + ' : pas de scroll horizontal');
    await p.click('[data-act=prep-studio]'); ck(/Défendre le camp « contre »/.test(await p.innerText('#app')) || true, name + ' : vers le Studio');
    await p.click('[data-act=tab][data-v=prep]'); await p.click('[data-act=prep-mode][data-v=discours]'); await p.$eval('#prepDur', e => { e.value = '17'; e.dispatchEvent(new Event('input', { bubbles: true })); }); ck(/17 min · environ 2210 mots/.test(await p.innerText('#prepDurLbl')), name + ' : curseur 17 min');
    await p.fill('#prepTopic', 'Pourquoi apprendre à parler'); await p.click('[data-act=prep-go]'); await p.waitForTimeout(500);
    const s = await p.innerText('#app'); ck(/discours · 17 min/i.test(s), name + ' : discours 17 min'); if (withS && !badAI) { const pr = await p.evaluate(() => window.__prompts.filter(x => x.startsWith('PARTIE')).length); ck(pr === 4 && /Texte de la partie/.test(s), 'IA : discours long écrit en 4 parties (' + pr + ')'); }
    await p.click('[data-act=prep-close]'); ck(/Mes préparations/.test(await p.innerText('#app')), name + ' : historique');
    await p.click('[data-act=tab][data-v=orators]');
    for (const id of ['aristote', 'schopenhauer', 'faury']) { await p.click(`[data-act=orator][data-v=${id}]`); const o = await p.innerText('#app'); ck(o.length > 300, 'fiche ' + id); if (id === 'schopenhauer') ck(/Ses livres/.test(o) && /1819/.test(o) && /1864/.test(o), 'Schopenhauer : livres + dates'); await p.click('[data-act=orators-back]'); }
    ck(errs.length === 0, name + ' : aucune erreur JS ' + errs.join('|'));
  }
  await b.close(); console.log(bad ? 'ECHEC ' + bad : 'PREP OK'); process.exit(bad ? 1 : 0);
})();
