const { chromium } = require('playwright');
const fs = require('fs');
const art = fs.readFileSync(__dirname + '/../dist/artifact.html', 'utf8');
const mock = `<script>
const store={};
window.claude={use:async(n)=>{
 if(n==='user')return{id:async()=>'u1',isOwner:()=>true};
 if(n==='db')return{collection:(p)=>({doc:(k)=>({get:async()=>({exists:!!store[p+k],data:()=>store[p+k]}),set:async(d)=>{store[p+k]=d}})})};
 if(n==='sample'){const f=async()=>({text:''});f.json=async()=>({fort:'Ton ouverture est nette.',priorite:'Réduis les "du coup".',exercice:'Redis ton texte sans tics.'});return f;}
 if(n==='downloads')return{save:async()=>({})};
 return null;}};
<\/script>`;
const page_html = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>' + mock + art + '</body></html>';
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  let bad = 0; const ck = (c, l) => { console.log((c ? 'OK   ' : 'FAIL ') + l); if (!c) bad++; };
  for (const [name, vp, scheme] of [['phone-light', { width: 390, height: 800 }, 'light'], ['desktop-dark', { width: 1200, height: 800 }, 'dark']]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errs.push(m.text()); });
    await p.setContent(page_html); await p.waitForTimeout(500);
    for (const t of ['home', 'studio', 'course', 'orators', 'proofs']) {
      await p.click(`[data-act=tab][data-v="${t}"]`);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      ck(ov <= 0, `${name} ${t} pas de scroll horizontal (${ov})`);
    }
    if (name === 'phone-light') {
      await p.click('[data-act=tab][data-v="studio"]');
      await p.setInputFiles('#fileIn', __dirname + '/synthetic.wav'); await p.waitForTimeout(800);
      await p.fill('#trIn', "Alors euh, du coup, je voulais vous dire trois raisons de agir. D'abord, 40 % de plus selon l'INSTAT. Voilà quoi.");
      await p.click('#goAnalyse'); await p.waitForSelector('text=Résultat', { timeout: 8000 });
      console.log((await p.locator('#app').innerText()).slice(0,1500)); console.log('HM', await p.locator('text=Hauteur médiane').count()); ck(await p.locator('text=Hauteur médiane').count() >= 1, 'résultat voix affiché');
      ck(await p.locator('mark.tic').count() > 0, 'tics surlignés');
      await p.click('[data-act=ai]'); await p.waitForSelector('text=Point fort', { timeout: 5000 }); ck(true, 'retour IA (mock)');
      await p.screenshot({ path: __dirname + '/shot-result.png', fullPage: true });
      await p.click('[data-act=tab][data-v="home"]'); console.log('HOME', (await p.locator('#app').innerText()).slice(0,500)); ck(await p.locator('text=Dernière séance').count() >= 1, 'historique');
      await p.click('[data-act=tab][data-v="course"]'); await p.click('[data-act=lesson][data-v="c1"]');
      const ov2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ck(ov2 <= 0, 'leçon sans scroll horizontal');
      await p.screenshot({ path: __dirname + '/shot-lesson.png', fullPage: false });
      await p.click('[data-act=quiz-ans][data-v="1"]'); await p.click('[data-act=quiz-next]'); await p.click('[data-act=quiz-ans][data-v="2"]'); await p.click('[data-act=quiz-next]'); await p.click('[data-act=quiz-ans][data-v="0"]'); await p.click('[data-act=quiz-next]');
      ck(await p.locator('text=Quiz terminé').count() === 1, 'quiz leçon');
      await p.click('[data-act=tab][data-v="orators"]'); await p.click('[data-act=type-open]');
      for (let i = 0; i < 8; i++) await p.click('[data-act=type-ans][data-v="0"]');
      ck(await p.locator('text=Ton type').count() === 1, 'test de type terminé');
      await p.click('[data-act=tab][data-v="orators"]'); await p.click('[data-act=orator][data-v="churchill"]'); ck(await p.locator('text=We shall fight').count() >= 1, 'fiche orateur');
      await p.click('[data-act=tab][data-v="proofs"]'); await p.fill('#topicIn', 'le luxe durable'); await p.click('[data-act=brief]'); ck(await p.locator('#briefPre').count() === 1, 'brief généré');
    } else { await p.screenshot({ path: __dirname + '/shot-dark.png' }); }
    ck(errs.length === 0, `${name} aucune erreur console ${errs.join('|')}`);
    await ctx.close();
  }
  // standalone avec faux micro
  const ctx = await b.newContext({ permissions: ['microphone'] }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/../dist/standalone.html'); 
  await p.route('**/*', r => r.continue());
  await p.click('[data-act=tab][data-v="studio"]');
  const hasRec = await p.locator('[data-act=rec-toggle]').count();
  console.log('bouton REC (file://) :', hasRec, '(attendu 0 hors http/https)');
  await ctx.close();
  console.log(bad ? bad + ' ÉCHEC(S)' : 'E2E OK'); await b.close(); process.exit(bad ? 1 : 0);
})();
