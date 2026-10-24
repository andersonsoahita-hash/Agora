const { chromium } = require('playwright');const fs=require('fs');
(async()=>{
 const b=await chromium.launch({args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 const c=await b.newContext({permissions:['microphone'],viewport:{width:390,height:800}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:8765/standalone.html');await p.click('[data-act="tab"][data-v="studio"]');
 await p.click('[data-act="st-dur"][data-v="30"]');
 console.log('début',await p.locator('#tmr').innerText());
 await p.click('[data-act="rec-toggle"]');await p.waitForTimeout(3000);
 console.log('à 3 s',await p.locator('#tmr').innerText());
 await p.waitForSelector('text=Audio prêt',{timeout:35000});
 console.log('auto-stop OK; msg:',await p.locator('#tmrMsg').innerText(),'| timer',await p.locator('#tmr').innerText());
 console.log('errs',errs);await c.close();
 // artifact mode chrono
 const art=fs.readFileSync(__dirname+'/../dist/artifact.html','utf8');
 const p2=await b.newPage({viewport:{width:390,height:800}});const e2=[];p2.on('pageerror',e=>e2.push(e.message));
 await p2.setContent('<!doctype html><html><head><meta charset=utf8></head><body><script>window.claude={use:async()=>null}<\/script>'+art+'</body></html>');
 await p2.click('[data-act="tab"][data-v="studio"]');await p2.click('[data-act="st-dur"][data-v="30"]');
 await p2.click('[data-act="chrono-toggle"]');await p2.waitForTimeout(2500);
 console.log('chrono artefact à 2,5 s:',await p2.locator('#tmr').innerText(),'bouton:',await p2.locator('[data-act="chrono-toggle"]').innerText(),'errs',e2);
 await b.close();})();
