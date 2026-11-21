/* Agora Test — rapport de voix et de discours (by Stephen).
   Réutilise le moteur d'analyse d'Agora (analysis.js) : mêmes mesures, mêmes repères que dans les autres exercices. */
(function(root){
'use strict';
const V={};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');

/* rééchantillonne le son capté (ex. 48 kHz) en 16 kHz mono, comme l'attend analysis.js */
V.resample16=function(chunks,sr){
  let n=0;chunks.forEach(c=>n+=c.length);if(!n)return new Float32Array(0);
  const all=new Float32Array(n);let o=0;chunks.forEach(c=>{all.set(c,o);o+=c.length;});
  const r=sr/16000,m=Math.floor(n/r),out=new Float32Array(m);
  for(let i=0;i<m;i++){const a=Math.floor(i*r),b=Math.max(a+1,Math.floor((i+1)*r));let s=0;for(let k=a;k<b&&k<n;k++)s+=all[k];out[i]=s/(b-a);}
  return out;};

/* conseils : mêmes règles et mêmes repères que dans l'appli principale */
V.advice=function(sig,txt){
  const out=[];
  if(txt&&txt.ok){
    if(txt.fillers.per100>3)out.push(['Tics',txt.fillers.total+' tics détectés ('+txt.fillers.top.map(x=>x[0]+' ×'+x[1]).join(', ')+'). Remplace-les par un silence.']);
    if(txt.hedges.per100>3)out.push(['Atténuations',txt.hedges.total+' formules qui adoucissent (« je pense que », « un peu »…). Garde-les pour les nuances utiles.']);
    if(txt.vague.total>2)out.push(['Mots vagues','Remplace « '+txt.vague.top.map(x=>x[0]).join(' », « ')+' » par un mot précis ou un chiffre.']);
    if(!txt.planAnnounced)out.push(['Plan','Aucune annonce de plan repérée. Essaie « trois raisons : … ».']);
    if(txt.evidence.total===0)out.push(['Preuves','Pas de chiffre ni de source repérés. Ajoute un fait vérifiable.']);
    if(txt.closers>0)out.push(['Conclusion','Ta fin s’éteint (« voilà », « c’est tout »…). Termine sur une phrase courte et ferme.']);
    if(txt.wpm&&(txt.wpm<110||txt.wpm>160))out.push(['Débit',txt.wpm+' mots/min (repère : 110 à 160).']);
  }
  if(sig&&sig.ok){
    if(sig.pauses.blank>0)out.push(['Blancs',sig.pauses.blank+' silence(s) de 2 s ou plus. Prépare tes transitions.']);
    if(sig.pitch&&sig.pitch.sdSemitones<2)out.push(['Voix plate','Écart de hauteur '+sig.pitch.sdSemitones+' demi-tons. Marque les mots clés par la hauteur ou le volume.']);
    if(sig.pitch&&sig.pitch.sdSemitones>4)out.push(['Voix très marquée','Écart '+sig.pitch.sdSemitones+' demi-tons : veille à garder des passages calmes.']);
    if(sig.endings.risingShare>0.4)out.push(['Fins montantes',Math.round(sig.endings.risingShare*100)+' % de tes fins de phrase montent : tes affirmations sonnent comme des questions.']);
    if(sig.endings.fadingShare>0.5)out.push(['Fins qui s’éteignent','Le volume baisse en fin de phrase. Soutiens jusqu’au dernier mot.']);
  }
  return out.slice(0,6);
};

const m=(label,val,cls)=>`<div class="metric"><span>${label}</span><b class="${cls||''}">${val}</b></div>`;
function chart(vals,kind,dur,binSec){
  const n=vals.length;if(n<2)return '';const W=300,H=90;let min=Infinity,max=-Infinity;
  vals.forEach(v=>{if(v!=null){min=Math.min(min,v);max=Math.max(max,v);}});if(!isFinite(min))return '';
  if(kind==='pitch'){min=Math.min(min,-4);max=Math.max(max,4);}else{min=0;max=1;}
  let d='',st=false;vals.forEach((v,i)=>{if(v==null||(kind==='env'&&v===0)){st=false;return;}const x=i/(n-1)*W,y=H-(v-min)/(max-min||1)*H;d+=(st?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);st=true;});
  const z=kind==='pitch'?`<line x1="0" x2="${W}" y1="${H-(0-min)/(max-min)*H}" y2="${H-(0-min)/(max-min)*H}" stroke="rgba(255,255,255,.2)" stroke-dasharray="3 3"/>`:'';
  return `<svg class="chart" data-dur="${n*binSec}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><rect width="${W}" height="${H}" fill="transparent"/>${z}<path d="${d}" fill="none" stroke="${kind==='pitch'?'#F3D082':'#7fb0e0'}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ---- onglet Voix : tonalité, musicalité, volume, rythme, pauses ---- */
V.voiceHtml=function(sig,txt,advice){
  if(!sig)return '<div class="card"><p class="note">Pas d’analyse de voix pour cet essai (son non enregistré, trop court ou sans voix).</p></div>';
  if(!sig.ok)return '<div class="card"><p class="note">'+(sig.reason==='trop_court'?'Enregistrement trop court : il faut au moins quelques secondes.':'Aucune voix détectée dans l’enregistrement.')+'</p></div>';
  const p=sig.pitch,e=sig.endings;let h='';
  const advHtml=advice&&advice.length?advice.map(x=>`<div class="metric"><span><b>${esc(x[0])}</b><br><span class="muted small">${esc(x[1])}</span></span></div>`).join(''):'<p class="note">Rien d’alarmant selon les repères de l’appli.</p>';
  h+=`<div class="card"><h3>À travailler en premier</h3>${advHtml}</div>`;
  h+='<div class="card"><h3>Tonalité</h3>';
  if(p)h+=m('Hauteur médiane',p.medianHz+' Hz')+m('Étendue de ta voix (p10–p90)',p.rangeSemitones+' demi-tons');else h+='<p class="note">Hauteur non mesurable (voix chuchotée ou trop bruitée).</p>';
  h+='<p class="note">Une voix plus grave ou plus aiguë n’est ni meilleure ni moins bonne : ce qui compte est la variation autour de ta hauteur habituelle.</p></div>';
  h+='<div class="card"><h3>Musicalité</h3>';
  if(p)h+=m('Variation de hauteur',p.sdSemitones+' demi-tons',p.sdSemitones<2?'tag-warn':'tag-ok')+'<p class="note" style="margin:2px 0 8px">Repères de l’appli : moins de 2 plat, 2 à 4 vivant, plus de 4 très marqué.</p>';
  h+=m('Fins de phrase qui montent',Math.round(e.risingShare*100)+' %',e.risingShare>0.4?'tag-warn':'')+m('Fins de phrase qui descendent',Math.round(e.fallingShare*100)+' %')+'</div>';
  h+='<div class="card"><h3>Volume</h3>'+m('Variation de volume',sig.volume.sdDb+' dB')+m('Écart entre passages forts et faibles',sig.volume.rangeDb+' dB')+m('Fins qui s’éteignent',Math.round(e.fadingShare*100)+' %',e.fadingShare>0.5?'tag-warn':'')+'<p class="note">Le niveau absolu dépend du téléphone et de la distance : seuls les écarts sont comparés.</p></div>';
  h+='<div class="card"><h3>Rythme et silences</h3>'+m('Débit',sig.rhythm.syllPerSec+' syllabes/s'+(txt&&txt.ok&&txt.wpm?' · '+txt.wpm+' mots/min':''),txt&&txt.wpm&&(txt.wpm<110||txt.wpm>160)?'tag-warn':'')+m('Régularité du débit',sig.rhythm.variation+' (plus c’est haut, plus le rythme varie)')+m('Pauses',sig.pauses.count+' (courtes '+sig.pauses.short+' · longues '+sig.pauses.long+' · blancs '+sig.pauses.blank+')',sig.pauses.blank?'tag-warn':'')+m('Plus longue pause',sig.pauses.longest+' s')+m('Part de silence',Math.round(sig.pauses.ratio*100)+' %')+'<p class="note">Débit : repère de l’appli de 110 à 160 mots/min.</p></div>';
  h+='<div class="card"><h3>Courbes dans le temps</h3><p class="note">Touche la courbe pour revoir ce moment sur la vidéo.</p><div class="note">Hauteur (écart à ta médiane, en demi-tons)</div>'+chart(sig.series.pitch,'pitch',sig.durationSec,sig.series.binSec)+'<div class="note" style="margin-top:10px">Énergie de la voix</div>'+chart(sig.series.env,'env',sig.durationSec,sig.series.binSec)+'</div>';
  return h;
};

/* ---- onglet Discours : logos, ethos, pathos, mots ---- */
V.speechHtml=function(txt,pil,transcript,A){
  let h='';
  if(!txt||!txt.ok){
    h+='<div class="card"><h3>Logos · Ethos · Pathos</h3><p class="note">Pas assez de mots transcrits pour juger (il en faut au moins 8, et 40 pour les trois indices). Active la transcription, ou colle ton texte ci-dessous.</p></div>';
  }else{
    const ev=A.evidenceLines(txt),c=(l,v,col)=>`<div class="pil"><b style="color:${col}">${v==null?'<span class="small">Non observé</span>':v}</b><span class="small muted">${l}</span></div>`;
    h+=`<div class="card"><h3>Logos · Ethos · Pathos</h3><div class="pillars">${c('Logos',pil.logos,'#7fb0e0')}${c('Ethos',pil.ethos,'#d9795f')}${c('Pathos',pil.pathos,'#d8ab55')}</div>`;
    if(ev)h+=`<div class="small" style="margin-top:10px"><div><b style="color:#7fb0e0">Logos</b> · ${esc(ev.logos)}</div><div><b style="color:#d9795f">Ethos</b> · ${esc(ev.ethos)}</div><div><b style="color:#d8ab55">Pathos</b> · ${esc(ev.pathos)}</div></div>`;
    h+='<p class="note" style="margin-top:10px">Ces indices comptent ce que tu as réellement dit d’après le texte transcrit : raisonnement (connecteurs, exemples, chiffres), crédibilité (expérience, sources), émotion (mots d’émotion, récit, questions). « Non observé » veut dire que rien n’a été trouvé. Une transcription incomplète donne un résultat incomplet, et ces indices ne mesurent pas l’effet sur un public.</p>';
    if((pil.partial||[]).length)h+=`<p class="small tag-warn">Pas de jugement : ${esc(pil.partial.join(', '))}.</p>`;
    h+='</div>';
    h+='<div class="card"><h3>Mots</h3>'+m('Mots',txt.words+(txt.wpm?' · '+txt.wpm+' mots/min':''),txt.wpm&&(txt.wpm<110||txt.wpm>160)?'tag-warn':'')
      +m('Tics',txt.fillers.total+(txt.fillers.top.length?' ('+txt.fillers.top.map(x=>x[0]+' ×'+x[1]).join(', ')+')':''),txt.fillers.per100>3?'tag-bad':'')
      +m('Atténuations',txt.hedges.total)+m('Mots vagues',txt.vague.total)+m('Connecteurs logiques',txt.connectors.total)+m('Preuves (chiffres, sources)',txt.evidence.total)+m('Marqueurs de récit',txt.story.total)
      +m('Annonce du plan',txt.planAnnounced?'oui':'non',txt.planAnnounced?'tag-ok':'tag-warn')+m('Questions posées',txt.questions)+m('Je / vous-nous',txt.address.je+' / '+txt.address.vous)
      +(txt.repeats&&txt.repeats.length?m('Mots répétés',esc(txt.repeats.map(x=>x[0]+' ×'+x[1]).join(', '))):'')+'</div>';
  }
  h+='<div class="card"><h3>Ta transcription</h3><p class="small"><mark class="tic">tic</mark> <mark class="att">atténuation</mark> <mark class="vag">mot vague</mark></p><div class="trs" id="trs2"></div>'
    +'<details><summary>Corriger ou coller la transcription</summary><textarea id="trEdit" style="width:100%;max-width:100%">'+esc(transcript||'')+'</textarea><button class="btn sec" id="reAn" style="margin-top:8px">Relancer l’analyse du discours</button></details></div>';
  return h;
};
if(typeof module!=='undefined'&&module.exports)module.exports=V;else root.AgoraVoice=V;
})(typeof self!=='undefined'?self:this);
