const { chromium } = require('playwright');const fs=require('fs');
const art=fs.readFileSync(__dirname+'/../dist/artifact.html','utf8');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:800}});const errs=[];
p.on('pageerror',e=>errs.push(e.message));
await p.setContent('<!doctype html><html><head><meta charset=utf8></head><body>'+art+'</body></html>');
const ids=await p.evaluate(()=>window.AO_DATA.lessons.map(l=>l.id));
let bad=0;for(const id of ids){await p.click('[data-act="tab"][data-v="course"]');await p.click(`[data-act="lesson"][data-v="${id}"]`);
const ov=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);const n=await p.locator('.prose p').count();if(ov>0||n<2){bad++;console.log('PB',id,ov,n)}}
console.log(ids.length,'leçons ouvertes, problèmes:',bad,'erreurs:',errs);await b.close();})();
