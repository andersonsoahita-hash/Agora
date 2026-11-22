/* Diaporama de leçon : une idée par écran (by Stephen) */
(function(){
var CSS='#slO{position:fixed;inset:0;z-index:100001;display:flex;flex-direction:column;color:#fff;background:radial-gradient(1200px 700px at 20% 0%,#7a2418 0%,#2a0b0a 55%,#120607 100%);font-family:"DM Sans",Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overscroll-behavior:contain;touch-action:pan-y}#slO *{box-sizing:border-box}'+
'#slO .sl-top{display:flex;align-items:center;gap:12px;padding:max(14px,env(safe-area-inset-top)) 18px 6px}#slO .sl-brand{font:600 11px system-ui;letter-spacing:.16em;text-transform:uppercase;color:#e8c25a;flex:1}#slO .sl-x{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:20px;cursor:pointer}'+
'#slO .sl-bar{height:3px;background:rgba(255,255,255,.15);margin:0 18px}#slO .sl-bar i{display:block;height:100%;background:#e8c25a;transition:width .25s}'+
'#slO .sl-st{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px;padding:18px clamp(22px,7vw,120px);max-width:980px;width:100%;margin:0 auto;overflow:auto}'+
'#slO .sl-k{font:700 12px system-ui;letter-spacing:.18em;text-transform:uppercase;color:#e8c25a}#slO h2{font-family:Georgia,"Times New Roman",serif;font-weight:700;font-size:clamp(28px,6vw,54px);line-height:1.08;margin:0}'+
'#slO .sl-p{font-size:clamp(18px,3.6vw,26px);line-height:1.5;margin:0;color:rgba(255,255,255,.92)}#slO ol,#slO ul{margin:0;padding:0;list-style:none;display:grid;gap:14px}#slO li{display:flex;gap:14px;align-items:flex-start;font-size:clamp(18px,3.4vw,24px);line-height:1.4}#slO li b{flex:none;width:34px;height:34px;border-radius:50%;background:#e8c25a;color:#2a0b0a;display:grid;place-items:center;font-size:16px}'+
'#slO .sl-box{border:1px solid rgba(232,194,90,.5);border-radius:16px;padding:18px 20px;background:rgba(255,255,255,.06)}'+
'#slO .sl-nav{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 18px max(18px,env(safe-area-inset-bottom))}#slO .sl-b{min-width:112px;height:48px;border-radius:99px;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font:600 15px system-ui;cursor:pointer}#slO .sl-b.pri{background:#e8c25a;color:#2a0b0a;border-color:#e8c25a}#slO .sl-b[disabled]{opacity:.3;cursor:default}#slO .sl-n{font:600 13px system-ui;opacity:.7}'+
'.sl-open{display:inline-flex;align-items:center;gap:8px;border:1px solid currentColor;background:transparent;color:inherit;border-radius:99px;padding:9px 16px;font:600 14px system-ui;cursor:pointer}';
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function txt(p){return Array.isArray(p)?p.join(' '):String(p||'')}
function chunks(t){var s=t.match(/[^.!?…]+[.!?…]+["»”]?\s*|[^.!?…]+$/g)||[t],out=[],cur='';s.forEach(function(x){if((cur+x).length>330&&cur){out.push(cur.trim());cur=x}else cur+=x});if(cur.trim())out.push(cur.trim());return out}
function build(L){
  var S=[{t:'cover'}];
  (L.sections||[]).forEach(function(s){var arr=Array.isArray(s.p)?s.p:[s.p];arr.forEach(function(par,k){var m=/^(Exemple[^:]{0,30}|Preuve)\s*:\s*/.exec(par),kind=m?(/^Preuve/.test(m[1])?'Preuve':'Exemple'):'',body=m?par.slice(m[0].length):par;if(m)body=body.charAt(0).toUpperCase()+body.slice(1);var ps=chunks(String(body||''));ps.forEach(function(p,i){S.push({t:'sec',h:s.h,p:p,kind:kind,part:ps.length>1?(i+1)+' / '+ps.length:''})})})});
  if(L.retenir&&L.retenir.length)S.push({t:'ret',l:L.retenir});
  if(L.exercice)S.push({t:'exo',p:txt(L.exercice)});
  S.push({t:'end'});return S}
var cur=null,idx=0,S=[],L=null;
function slideHtml(s){
  if(s.t==='cover')return '<div class="sl-k">'+esc(L.n||'')+' · '+(L.min||'')+' min</div><h2>'+esc(L.titre)+'</h2>'+(L.accroche?'<p class="sl-p">'+esc(L.accroche)+'</p>':'');
  if(s.t==='sec')return '<div class="sl-k">'+esc((s.kind||'Idée')+(s.part?' · '+s.part:''))+'</div><h2>'+esc(s.h||'')+'</h2>'+(s.kind?'<div class="sl-box">':'')+'<p class="sl-p">'+esc(s.p)+'</p>'+(s.kind?'</div>':'');
  if(s.t==='ret')return '<div class="sl-k">À retenir</div><h2>L’essentiel</h2><ol>'+s.l.map(function(x,i){return '<li><b>'+(i+1)+'</b><span>'+esc(x)+'</span></li>'}).join('')+'</ol>';
  if(s.t==='exo')return '<div class="sl-k">Exercice</div><h2>À toi de jouer</h2><div class="sl-box"><p class="sl-p">'+esc(s.p)+'</p></div>';
  return '<div class="sl-k">Terminé</div><h2>Bien joué.</h2><p class="sl-p">Tu peux maintenant faire le quiz de la leçon, puis t’entraîner dans le Studio.</p>'}
function draw(){
  var el=document.getElementById('slO');if(!el)return;
  el.querySelector('.sl-st').innerHTML=slideHtml(S[idx]);el.querySelector('.sl-st').scrollTop=0;
  el.querySelector('.sl-bar i').style.width=Math.round(100*(idx+1)/S.length)+'%';
  el.querySelector('.sl-n').textContent=(idx+1)+' / '+S.length;
  el.querySelector('[data-sl="prev"]').disabled=idx===0;
  var nx=el.querySelector('[data-sl="next"]');nx.textContent=idx===S.length-1?'Fermer':'Suivant ›'}
function close(){var el=document.getElementById('slO');if(el)el.remove();document.removeEventListener('keydown',key);document.body.style.overflow=''}
function go(d){if(d>0&&idx===S.length-1){close();return}idx=Math.max(0,Math.min(S.length-1,idx+d));draw()}
function key(e){if(e.key==='ArrowRight'||e.key===' ')go(1);else if(e.key==='ArrowLeft')go(-1);else if(e.key==='Escape')close()}
function open(lesson){
  if(!lesson)return;L=lesson;S=build(L);idx=0;close();
  if(!document.getElementById('slCss')){var st=document.createElement('style');st.id='slCss';st.textContent=CSS;document.head.appendChild(st)}
  var el=document.createElement('div');el.id='slO';el.setAttribute('role','dialog');el.setAttribute('aria-label','Diaporama');
  el.innerHTML='<div class="sl-top"><span class="sl-brand">Agora · by Stephen</span><button class="sl-x" data-sl="x" aria-label="Fermer">✕</button></div><div class="sl-bar"><i></i></div><div class="sl-st"></div><div class="sl-nav"><button class="sl-b" data-sl="prev">‹ Précédent</button><span class="sl-n"></span><button class="sl-b pri" data-sl="next">Suivant ›</button></div>';
  document.body.appendChild(el);document.body.style.overflow='hidden';
  el.addEventListener('click',function(e){var b=e.target.closest('[data-sl]');if(!b)return;var a=b.getAttribute('data-sl');if(a==='x')close();else if(a==='prev')go(-1);else if(a==='next')go(1)});
  var x0=null;el.addEventListener('touchstart',function(e){x0=e.touches[0].clientX},{passive:true});el.addEventListener('touchend',function(e){if(x0==null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60)go(dx<0?1:-1)},{passive:true});
  document.addEventListener('keydown',key);draw()}
window.AGSL={open:open,close:close};
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-slopen]');if(!b)return;e.preventDefault();e.stopPropagation();var id=b.getAttribute('data-slopen'),D=window.AO_DATA||window.AGD;var l=D&&D.lessons.filter(function(x){return x.id===id})[0];open(l)},true);
})();
