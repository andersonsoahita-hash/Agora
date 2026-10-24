const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const c=await b.newContext({permissions:['microphone'],viewport:{width:390,height:800}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:8765/standalone.html');await p.click('[data-act="tab"][data-v="studio"]');
 console.log('REC button',await p.locator('[data-act="rec-toggle"]').count());
 await p.click('[data-act="rec-toggle"]');await p.waitForTimeout(6000);await p.click('[data-act="rec-toggle"]');
 await p.waitForSelector('text=Audio prêt',{timeout:8000});
 await p.click('#goAnalyse');await p.waitForSelector('text=Résultat',{timeout:10000}).catch(()=>{});
 console.log((await p.locator('#app').innerText()).slice(0,600));console.log('errs',errs);
 await b.close();})();
