#!/usr/bin/env python3
"""Génère src/gest-ui.js (la Gestuelle intégrée dans Agora, en Shadow DOM) à partir de src/gestuelle.src.html.
Usage : python3 tools/make-gest.py   (puis node build.js)"""
import re,os,json
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(D+'/src/gestuelle.src.html',encoding='utf8').read()
css=re.search(r'<style>([\s\S]*?)</style>',s).group(1)
body=re.search(r'<body[^>]*>([\s\S]*?)<script',s).group(1)
js=re.search(r'<script type="module">([\s\S]*?)</script>',s).group(1)
def rep(t,a,b,n=1):
    assert a in t,('introuvable',a[:80]);return t.replace(a,b,n)
# ---- CSS : l'hôte remplace :root / html,body ; tout le reste est isolé par le Shadow DOM
css=rep(css,':root{',':host{position:fixed;inset:0;z-index:2000;display:block;')
css=re.sub(r'html,body\{[^}]*\}','',css)
css+='\n.scr{z-index:1}\n:host{background:var(--deep);color:var(--txt);font:16px/1.45 "Avenir Next",Avenir,system-ui,sans-serif}\n'
# ---- HTML : plus d'écran d'accueil propre, les réglages sont la première page
body=re.sub(r'<section class="scr on" id="s-home">[\s\S]*?</section>','',body,count=1)
body=rep(body,'<section class="scr" id="s-set">','<section class="scr on" id="s-set">')
body=rep(body,'<button class="btn sec" id="back1" style="padding:9px 14px">Retour</button>','<span style="display:flex;gap:6px"><button class="btn sec" id="histBtn" style="padding:9px 14px">Mes essais</button><button class="btn sec" id="back1" style="padding:9px 14px">Fermer</button></span>')
# ---- JS : le document devient la racine du Shadow DOM
js=rep(js,"const $=s=>document.querySelector(s);","const $=s=>root.querySelector(s);")
js=js.replace("document.querySelectorAll(","root.querySelectorAll(")
js=rep(js,'let pb=null;','')
js=rep(js,"const $=s=>root.querySelector(s);","let pb=null;const $=s=>root.querySelector(s);")
# paramètres venant de l'appli (plus de lecture de l'adresse)
a=js.index("const APP_VERSION=");b=js.index("const DEMO=")
js=js[:a]+"const APP_VERSION='int';let EXO=opts.exo||null;const NS=opts.ns||'/';\n"+js[b:]
js=rep(js,"const DEMO=/[?&]demo=1/.test(location.search);","const DEMO=!!opts.demo;")
# retour / fermeture
a=js.index("/* ---- version ---- */");b=js.index("/* ---- réglages")
js=js[:a]+js[b:]
js+="\nif(opts.open){(async()=>{try{const it=await idb.get(+opts.open);if(it)openReport(it);else opts.close();}catch(e){console.error(e);opts.close();}})();}\n"
js=rep(js,"$('#enter').onclick=()=>show('s-set');$('#back1').onclick=()=>show('s-home');$('#back2').onclick=()=>show('s-home');$('#back3').onclick=()=>show('s-home');","$('#back1').onclick=()=>opts.close();$('#back2').onclick=()=>opts.close();$('#back3').onclick=()=>show('s-set');")
js=rep(js,"if(EXO){const sj=","if(EXO){const sj=")  # présent
js=rep(js,"location.href='../?gres='+it.id;","opts.done(it);")
# modèles et moteur : chemins depuis la page Agora
js=rep(js,"await import('./vendor/vision_bundle.mjs')","await import(new URL(opts.vendor+'vision_bundle.mjs',document.baseURI).href)")
js=rep(js,"forVisionTasks('./vendor/wasm')","forVisionTasks(new URL(opts.vendor+'wasm',document.baseURI).href)")
# écouteurs globaux : sans danger après fermeture
js=rep(js,"addEventListener('resize',()=>{if($('#s-run').classList.contains('on'))resize();});","const onWinResize=()=>{const g=$('#s-run');if(g&&g.classList.contains('on'))resize();};addEventListener('resize',onWinResize);")
js=rep(js,"addEventListener('pagehide',()=>cleanup());","addEventListener('pagehide',()=>cleanup());\n__reg(()=>{cleanup();removeEventListener('resize',onWinResize);});")

# ---- choix de l'exercice depuis la Gestuelle
body=rep(body,'<div class="card" id="exoBanner" hidden>','<div class="card" id="exoPick" style="display:grid;gap:8px"><h3>Exercice</h3><select id="exoSel"><option value="">Libre : je parle de ce que je veux</option></select><select id="discSel" hidden><option value="">Choisis un discours à lire</option></select><div id="exoSubj" class="note" hidden></div><div><button class="btn sec" id="exoNew" style="padding:9px 14px" hidden>Autre sujet</button></div></div>\n  <div class="card" id="exoBanner" hidden>')
a=js.index("if(EXO){const sj=");b=js.index("show('s-set');}",a)+len("show('s-set');}")
js=js[:a]+"""const exoSel=$('#exoSel');
(opts.exos||[]).forEach(x=>{const o=document.createElement('option');o.value=x.id;o.textContent=x.nom;exoSel.appendChild(o);});
if(EXO&&![...exoSel.options].some(o=>o.value===EXO.type)){const o=document.createElement('option');o.value=EXO.type;o.textContent=EXO.nom||EXO.type;exoSel.appendChild(o);}
exoSel.value=EXO?EXO.type:'';
const refreshExo=()=>{
  if(EXO)EXO.dur=S.dur||0;
  const sj=EXO?((EXO.sujet?'Sujet : '+EXO.sujet:'')+(EXO.stance?' · tu défends : '+EXO.stance:'')):'';
  $('#exoBanner').hidden=!EXO;
  if(EXO){$('#exoT').textContent='Exercice : '+(EXO.nom||EXO.type)+(EXO.dur?' · '+(EXO.dur<60?EXO.dur+' s':Math.round(EXO.dur/6)/10+' min'):'');$('#exoS').textContent=(sj||'Parle librement.')+' Tu seras filmé en entier : gestes, posture, voix et mots sont analysés.';}
  $('#exoSubj').hidden=!sj;$('#exoSubj').textContent=sj;
  $('#exoNew').hidden=!(EXO&&opts.subject&&EXO.type!=='lecture');
  $('#subj').textContent=EXO?(sj||EXO.nom||''):'';$('#subj').hidden=!sj;
};
exoSel.onchange=()=>{const v=exoSel.value;if(!v){EXO=null;}else{const s=(opts.subject&&opts.subject(v))||{};EXO={type:v,nom:exoSel.options[exoSel.selectedIndex].textContent,sujet:s.sujet||'',stance:s.stance||'',dur:S.dur||0};}refreshExo();};
$('#exoNew').onclick=()=>{if(!EXO||!opts.subject)return;const s=opts.subject(EXO.type)||{};EXO.sujet=s.sujet||'';EXO.stance=s.stance||'';refreshExo();};
$('#g-dur').addEventListener('click',()=>setTimeout(refreshExo,0));
const D_=window.AGDISC&&window.AGDISC.data;
if(D_){const o=document.createElement('option');o.value='lecture';o.textContent='Discours à jouer (texte prêt, au prompteur)';exoSel.appendChild(o);
  D_.sections.forEach(sec=>{const g=document.createElement('optgroup');g.label=sec.t;D_.discours.filter(d=>d.s===sec.id).forEach(d=>{const op=document.createElement('option');op.value=d.id;op.textContent=d.t;g.appendChild(op);});$('#discSel').appendChild(g);});
  if(EXO&&EXO.type==='lecture')exoSel.value='lecture';}
const setScript=(d)=>{S.script=d.l.join('\\n');S.tpOn=true;S.dur=0;save();$('#script').value=S.script;$('#tpOn').checked=true;sync();$('#g-dur').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==='0'));};
const exoSel2=exoSel.onchange;
exoSel.onchange=()=>{const lec=exoSel.value==='lecture';$('#discSel').hidden=!lec;if(lec){EXO={type:'lecture',nom:'Discours à jouer',sujet:'',stance:'',dur:0};$('#discSel').value='';refreshExo();}else exoSel2();};
$('#discSel').onchange=()=>{const d=D_&&D_.discours.find(x=>x.id===$('#discSel').value);if(!d||!EXO)return;EXO.sujet=d.t;setScript(d);refreshExo();};
$('#discSel').hidden=!(EXO&&EXO.type==='lecture');
refreshExo();show('s-set');"""+js[b:]
js=rep(js,"const EXO=opts.exo||null","let EXO=opts.exo||null") if "const EXO=opts.exo||null" in js else js

# l'écran de départ : une seule consigne (le rappel de l'exercice)
out='''/* Agora — Gestuelle intégrée (généré par tools/make-gest.py : ne pas éditer à la main). Isolée dans un Shadow DOM : ni styles ni identifiants partagés avec l'appli. */
(function(){
var CSS=%s, HTML=%s, cur=null;
window.AGGEST={
  open:function(o){
    if(cur)return; o=o||{};
    var host=document.createElement('div'); host.id='gest-host';
    var root=host.attachShadow({mode:'open'}); root.innerHTML='<style>'+CSS+'</style>'+HTML;
    document.body.appendChild(host); var clean=null;
    var close=function(){ if(!cur)return; try{clean&&clean();}catch(e){} host.remove(); cur=null; try{o.onClose&&o.onClose();}catch(e){} };
    cur={close:close};
    var opts={exos:o.exos||null,subject:o.subject||null,vendor:o.vendor||'gestuelle/vendor/',exo:o.exo||null,ns:o.ns||'/',demo:!!o.demo,open:o.open||null,close:close,done:function(it){ var h={id:it.id,date:it.date,score:it.r.score.total,duree:it.r.duree,exo:it.exo}; try{o.onDone&&o.onDone(h);}catch(e){} close(); }};
    var __reg=function(f){clean=f;};
    (async function(){
%s
    })().catch(function(e){console.error(e);});
  },
  isOpen:function(){return !!cur;}
};
})();
''' % (json.dumps(css,ensure_ascii=False),json.dumps(body,ensure_ascii=False),js)
open(D+'/src/gest-ui.js','w',encoding='utf8').write(out)
print('gest-ui.js',len(out)//1024,'Ko')
