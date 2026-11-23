/* Vidéos d'exemple affichées dans le rapport d'analyse (lues dans l'appli, en ligne seulement).
   Pour en ajouter : colle le lien YouTube (avec le moment de départ, ex. ?t=95 ou &t=1m35s), un titre,
   et la durée voulue en secondes (d). Une même difficulté peut avoir plusieurs exemples.
   Clés = type de moment relevé par l'analyse :
   cachees (mains cachées) · basses (bras ballants) · croises (bras croisés) · regard-bas (tête baissée)
   regard-cote (tête de côté) · balancement · deplacement · contact (main sur le visage/corps) · contradiction
   Exemple : cachees:[{u:'https://youtu.be/XXXXXXXXXXX?t=95',t:'Des mains qui accompagnent le propos',d:30}] */
/* Une ou deux vidéos en français par difficulté, choisies d'après leur titre. d:0 = jusqu'à la fin ; pour cibler un passage : u:'…watch?v=ID&t=95', d:30. */
window.AGREF={
  'cachees':[{u:'https://www.youtube.com/watch?v=9UXpBZHRI38',t:'Analyse du discours d’Emmanuel Macron : ce que son corps révèle',d:0},{u:'https://www.youtube.com/watch?v=W0bBWW65nqg',t:'Parler en public : savoir quoi faire de ses mains',d:0}],
  'basses':[{u:'https://www.youtube.com/watch?v=P3jc0rd5UqM',t:'Analyse des gestes en politique par un expert en gestuelle',d:0},{u:'https://www.youtube.com/watch?v=Davf0w6CpeA',t:'Que faire de ses bras durant une présentation en public ?',d:0}],
  'croises':[{u:'https://www.youtube.com/watch?v=rM58yKFRypw',t:'Langage corporel : Mathilde Panot, ce que son corps trahit',d:0},{u:'https://www.youtube.com/watch?v=lZlMF_I2mlw',t:'Langage corporel : croisements de bras',d:0}],
  'regard-bas':[{u:'https://www.youtube.com/watch?v=fdgZqfIzbfU',t:'Analyse du langage corporel et du discours d’Elwan',d:0},{u:'https://www.youtube.com/watch?v=5tSm6R99V0k',t:'Prise de parole : 3 astuces pour maintenir le contact visuel',d:0}],
  'regard-cote':[{u:'https://www.youtube.com/watch?v=hk_l6_lb0kI',t:'L’analyse non verbale de la crise avec E. Macron',d:0},{u:'https://www.youtube.com/watch?v=fTwgxjY1oJo',t:'Comment regarder son audience dans les yeux',d:0}],
  'balancement':[{u:'https://www.youtube.com/watch?v=XmM7Ogz7R_g',t:'Analyse de la gestuelle et du discours de Laurent Wauquiez',d:0},{u:'https://www.youtube.com/watch?v=ilO6bwsq-2g',t:'La posture et l’ancrage au sol quand on prend la parole',d:0}],
  'deplacement':[{u:'https://www.youtube.com/watch?v=r--LY9Kh_oI',t:'Emmanuel Macron : son langage corporel pendant ses discours',d:0},{u:'https://www.youtube.com/watch?v=wx6UvvRZw2g',t:'Présence scénique : bouger sur scène sans en faire trop',d:0}],
  'contact':[{u:'https://www.youtube.com/watch?v=fj64p6eO2j8',t:'Les politiques en gestes (Déshabillons-les)',d:0},{u:'https://www.youtube.com/watch?v=tM_AzegwXG8',t:'Capsule éloquence : les gestes parasites',d:0}],
  'contradiction':[{u:'https://www.youtube.com/watch?v=whwniwqJhS8',t:'Les gestes des politiques (Déshabillons-les)',d:0},{u:'https://www.youtube.com/watch?v=5eVSk_YmuyY',t:'3 types de gestes dans les prises de parole',d:0}]
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
