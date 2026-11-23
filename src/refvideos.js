/* Vidéos d'exemple affichées dans le rapport d'analyse (lues dans l'appli, en ligne seulement).
   Pour en ajouter : colle le lien YouTube (avec le moment de départ, ex. ?t=95 ou &t=1m35s), un titre,
   et la durée voulue en secondes (d). Une même difficulté peut avoir plusieurs exemples.
   Clés = type de moment relevé par l'analyse :
   cachees (mains cachées) · basses (bras ballants) · croises (bras croisés) · regard-bas (tête baissée)
   regard-cote (tête de côté) · balancement · deplacement · contact (main sur le visage/corps) · contradiction
   Exemple : cachees:[{u:'https://youtu.be/XXXXXXXXXXX?t=95',t:'Des mains qui accompagnent le propos',d:30}] */
/* Vidéos en français (TEDx, lecteur officiel TED), choisies d'après leur titre : à vérifier en les regardant. */
window.AGREF={
  'cachees':[{u:'https://www.youtube.com/watch?v=bCcyt7Ky8mQ',t:'Samuel Savarel · Réveillez l’orateur qui sommeille en vous (TEDx)',d:0},{u:'https://www.youtube.com/watch?v=_C0LcvY5wtM',t:'Pascal Haumont · Devenez un meilleur orateur : imitez les autres (TEDx)',d:0}],
  'basses':[{u:'https://www.youtube.com/watch?v=bCcyt7Ky8mQ',t:'Samuel Savarel · Réveillez l’orateur qui sommeille en vous (TEDx)',d:0},{u:'https://www.youtube.com/watch?v=_C0LcvY5wtM',t:'Pascal Haumont · Devenez un meilleur orateur : imitez les autres (TEDx)',d:0}],
  'croises':[{u:'https://www.youtube.com/watch?v=bCcyt7Ky8mQ',t:'Samuel Savarel · Réveillez l’orateur qui sommeille en vous (TEDx)',d:0},{u:'https://www.youtube.com/watch?v=_C0LcvY5wtM',t:'Pascal Haumont · Devenez un meilleur orateur : imitez les autres (TEDx)',d:0}],
  'regard-bas':[{u:'https://www.youtube.com/watch?v=bCcyt7Ky8mQ',t:'Samuel Savarel · Réveillez l’orateur qui sommeille en vous (TEDx)',d:0}],
  'regard-cote':[{u:'https://www.youtube.com/watch?v=bCcyt7Ky8mQ',t:'Samuel Savarel · Réveillez l’orateur qui sommeille en vous (TEDx)',d:0}],
  'balancement':[],
  'deplacement':[],
  'contact':[{u:'https://www.youtube.com/watch?v=bCcyt7Ky8mQ',t:'Samuel Savarel · Réveillez l’orateur qui sommeille en vous (TEDx)',d:0},{u:'https://www.youtube.com/watch?v=_C0LcvY5wtM',t:'Pascal Haumont · Devenez un meilleur orateur : imitez les autres (TEDx)',d:0}],
  'contradiction':[{u:'https://www.youtube.com/watch?v=sNwX_WZvvU0',t:'Olivier Courbier · Donnez de l’impact à vos discours (TEDx)',d:0}]
};
window.AGREF_play=function(x){if(x&&/^https:\/\/embed\.ted\.com\//.test(x.u||''))return x.u;
  var m=String(x.u||'').match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/);if(!m)return '';
  var t=String(x.u).match(/[?&#](?:t|start)=([0-9hms]+)/),s=0;
  if(t){var q=t[1],h=q.match(/(\d+)h/),mi=q.match(/(\d+)m/),se=q.match(/(\d+)s/);s=(h||mi||se)?((h?+h[1]*3600:0)+(mi?+mi[1]*60:0)+(se?+se[1]:0)):(+q||0)}
  return 'https://www.youtube-nocookie.com/embed/'+m[1]+'?rel=0&modestbranding=1&playsinline=1&autoplay=1&start='+s+(x.d?'&end='+(s+(+x.d)):'');
};

/* Vidéos « comment faire » : par type d'exercice, en français, lues dans l'appli (en ligne). */
window.AGREF_EX={
  argumenter:[{u:'https://www.youtube.com/watch?v=aBIVTRkP1UQ',t:'Jérôme Lavillat · Peut-on convaincre les autres ? (TEDx)',d:0},{u:'https://www.youtube.com/watch?v=X6JkUfn2dRg',t:'Elina Creveau · La rhétorique, une arme dangereuse mais persuasive (TEDx)',d:0}],
  debat:[{u:'https://www.youtube.com/watch?v=X6JkUfn2dRg',t:'Elina Creveau · La rhétorique, une arme dangereuse mais persuasive (TEDx)',d:0}],
  recit:[{u:'https://www.youtube.com/watch?v=KgStMtYx9IU',t:'Sylvie Mombo · Le conte, les mots pour guérir nos maux (TEDx)',d:0},{u:'https://www.youtube.com/watch?v=nFY55X7aMyM',t:'Joane Ukeiwe · La force du conte kanak (TEDx)',d:0}],
  fetiche:[{u:'https://www.youtube.com/watch?v=nFY55X7aMyM',t:'Joane Ukeiwe · La force du conte kanak (TEDx)',d:0}],
  discours:[{u:'https://www.youtube.com/watch?v=sNwX_WZvvU0',t:'Olivier Courbier · Donnez de l’impact à vos discours (TEDx)',d:0}],
  aveu:[{u:'https://www.youtube.com/watch?v=wbyCMj4Uz-Q',t:'Vanessa Millet · La vulnérabilité, mon héroïne (TEDx)',d:0}]
};
window.AGREF_howBtn=function(type){return (window.AGREF_EX&&(AGREF_EX[type]||[]).length)?'<button type="button" class="btn ghost" data-howto="'+type+'" style="margin:8px 0">▶ Voir comment faire cet exercice</button>':''};
(function(){
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  document.addEventListener('click',function(e){var b=(e.composedPath?e.composedPath():[]).filter(function(n){return n.hasAttribute&&n.hasAttribute('data-howto')})[0]||(e.target.closest&&e.target.closest('[data-howto]'));if(!b)return;e.preventDefault();e.stopPropagation();
    var L=(window.AGREF_EX&&AGREF_EX[b.getAttribute('data-howto')])||[];if(!L.length)return;var n=0,m=document.getElementById('howm');if(m)m.remove();
    m=document.createElement('div');m.id='howm';m.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(10,6,5,.88);display:flex;align-items:center;justify-content:center;padding:16px';document.body.appendChild(m);
    function draw(){var x=L[n];m.innerHTML='<div style="width:min(760px,100%);background:#1b1210;border:1px solid rgba(199,151,70,.4);border-radius:16px;padding:14px;color:#fff;font-family:inherit"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px"><b>'+esc(x.t)+'</b><button type="button" id="howx" aria-label="Fermer" style="border:1px solid rgba(255,255,255,.3);background:none;color:#fff;border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer">✕</button></div>'+(navigator.onLine?'<div style="position:relative;aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:#000"><iframe src="'+AGREF_play(x)+'" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div><p style="margin:8px 0 0;font-size:13px;text-align:center"><a href="'+AGREF_link(x)+'" target="_blank" rel="noopener" style="color:#F3D082">La vidéo ne s’affiche pas ? L’ouvrir sur YouTube</a></p>':'<p>Connecte-toi à internet pour voir cette vidéo.</p>')+(L.length>1?'<button type="button" id="hown" style="margin-top:10px;border:1px solid rgba(255,255,255,.3);background:none;color:#fff;border-radius:10px;padding:10px 14px;font:inherit;cursor:pointer">Autre vidéo ('+(n+1)+'/'+L.length+')</button>':'')+'</div>';
      m.querySelector('#howx').onclick=function(){m.remove()};var nb=m.querySelector('#hown');if(nb)nb.onclick=function(){n=(n+1)%L.length;draw()}}
    draw();m.onclick=function(ev){if(ev.target===m)m.remove()}},true);
})();

window.AGREF_link=function(x){if(/youtube\.com\/watch|youtu\.be\//.test((x&&x.u)||''))return x.u;return 'https://www.youtube.com/results?search_query='+encodeURIComponent(String((x&&x.t)||'').replace(/\s*\(TEDx\)/,'')+' TEDx');};
