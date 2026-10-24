/* Module de cours « Éristique » : généré à partir de AO_DATA.erist (Schopenhauer, trad. Saunders 1896). Reformulé par l'appli. */
(function () {
  var D = window.AO_DATA, E = D.erist;
  D.modules.push({ id: 'er', tome: 'Schopenhauer · L’art d’avoir toujours raison', titre: 'L’éristique', sous: 'Les 38 stratagèmes d’une dispute : reconnaître, contrer, ne pas tomber dedans' });
  var natL = { loyal: 'technique loyale', limite: 'zone grise', deloyal: 'déloyal' };
  var META = {
    sens: { r: ['Beaucoup de ruses consistent à changer ce que tu as dit : élargir ta thèse, déplacer un mot, te faire dire autre chose.', 'Ta meilleure défense : reformuler ta phrase exacte et fixer le sens des mots clés.', 'Reformule toujours la thèse adverse fidèlement avant d’y répondre : c’est ta protection contre la première ruse.'], e: 'Te défendre en élargissant à ton tour ta propre thèse (« oui, et en plus… »). Tu offres toi-même la prise.', m: 'Phrase de secours : « Ce que j’ai dit, c’est exactement ceci : … ».', x: 'Prends un échange récent où tu as été mal compris. Réécris ta phrase en une version précise, avec ses limites, puis dis-la en 30 secondes au Studio.' },
    quest: { r: ['Ces ruses avancent par petites concessions que tu ne vois pas s’additionner.', 'Avant de dire oui, demande où l’on veut en venir.', 'Un « oui » à un cas particulier n’est pas un « oui » à une règle.'], e: 'Répondre vite, par politesse, à chaque question d’une série.', m: 'Compteur mental : « Qu’ai-je accordé jusqu’ici ? »', x: 'Fais-toi poser 5 petites questions d’accord en rafale sur un sujet, par quelqu’un ou en te les posant à voix haute. Entraîne-toi à demander le but avant la troisième réponse.' },
    emo: { r: ['Ces ruses visent ton état intérieur, pas ton argument : colère, honte, peur de passer pour incompétent.', 'Nommer la manœuvre la désamorce.', 'Le silence et une reformulation simple sont tes meilleurs outils.'], e: 'Répondre sur le même terrain émotionnel : tu confirmes la manœuvre.', m: 'Respire, laisse 3 secondes de silence, réponds par une phrase factuelle.', x: 'Choisis une remarque qui t’énerve. Au Studio, réponds-y en 30 secondes avec une voix plus lente et plus basse que d’habitude.' },
    esq: { r: ['Ces ruses n’attaquent pas ton argument : elles l’évitent.', 'Ramène poliment, autant de fois que nécessaire, à la question posée.', 'Une distinction qui ne change rien est une esquive.'], e: 'Suivre l’autre sur le nouveau terrain par politesse.', m: 'Formule : « Je note ton point, et je reviens à ma question : … ».', x: 'Prépare une question précise. Au Studio, joue deux fois un échange où l’on dévie, et ramène la question à chaque fois en une phrase.' },
    perso: { r: ['Trois ruses (ad hominem, autorité, attaque personnelle) déplacent la discussion de l’argument vers la personne ou vers un nom prestigieux.', 'Le contre-exemple et la retorsion sont des outils loyaux : tu peux les utiliser devant n’importe quel public.', 'Face à l’attaque personnelle, reste calme et reviens au fond.'], e: 'Répondre à l’insulte par une insulte : tu perds ton éthos.', m: 'Pour toute autorité citée : « Quel est son argument ? »', x: 'Trouve un contre-exemple à une phrase en « tous » ou « toujours » entendue cette semaine, puis formule-le en 20 secondes, sans ironie.' }
  };
  var QX = [
    { q: '« Tu défends la liberté d’expression : tu ne peux donc pas demander l’interdiction de ce livre. »', n: 5, o: [5, 6, 11, 14], e: 'On te renvoie à tes propres principes : argumenter à partir des concessions de l’autre. C’est loyal si c’est assumé. Réponse : dis si tu maintiens ce principe, ou distingue-le.' },
    { q: '« Voilà, c’est démontré ! », alors qu’une étape du raisonnement manque.', n: 14, o: [14, 4, 22, 5], e: 'La victoire est proclamée sans preuve. Réponse : calmement, « Non, il manque cette étape ».' },
    { q: '« Si tu défends cela, tu vas te mettre la direction à dos. »', n: 35, o: [35, 8, 31, 28], e: 'On parle de ton intérêt, pas de ce qui est vrai. Réponse : « Est-ce vrai ? » et « Est-ce avantageux ? » sont deux questions.' },
    { q: '« On manque de temps, passons au point suivant », au moment précis où ton argument porte.', n: 18, o: [18, 29, 17, 19], e: 'Le débat est interrompu quand il tourne à ton avantage. Réponse : « Avant de changer de sujet, finissons celui-ci. »' }
  ];
  function strat(n) { for (var i = 0; i < E.strats.length; i++) if (E.strats[i].n === n) return E.strats[i]; return null; }
  function toQuiz(items) {
    return items.map(function (q, i) {
      var o = q.o.slice(), rot = (i * 3 + 1) % o.length; o = o.slice(rot).concat(o.slice(0, rot));
      return { q: q.q, o: o.map(function (n) { return strat(n).t; }), a: o.indexOf(q.n), e: q.e };
    });
  }
  var L = [];
  L.push({
    id: 'e0', m: 'er', n: 'É0', titre: 'Pourquoi une dialectique éristique ?', min: 6, src: 'schop',
    accroche: 'Schopenhauer a écrit un manuel pour gagner une dispute, même quand on a tort. Étrange, mais très utile : surtout pour ne pas se faire avoir.',
    sections: E.idees.map(function (x) { return { h: x.t, p: [x.x] }; }).concat([{ h: 'Comment l’utiliser, honnêtement', p: ['Ce cours a deux usages : reconnaître la ruse chez l’autre, et savoir ce que tu fais toi-même quand tu t’en sers. Les ruses « déloyales » marchent parfois, mais elles abîment ta crédibilité dès que l’auditoire les repère. Les techniques loyales (le contre-exemple, la retorsion, l’argument à partir des concessions) se défendent devant n’importe qui.', E.note] }]),
    retenir: ['Avoir raison et gagner la dispute sont deux choses différentes.', 'On défend souvent sa thèse par vanité, pas par conviction.', 'Connaître les ruses sert d’abord à s’en défendre.'],
    erreur: 'Croire qu’il suffit d’avoir raison pour que les autres s’en rendent compte.',
    methode: 'Avant de répondre dans une discussion tendue : « Est-ce que l’autre discute de ce que j’ai dit, ou d’autre chose ? »',
    exercice: 'Repense à une dispute récente. Dis au Studio, en 1 minute, ce qui s’est passé : qui a élargi, détourné, esquivé ? Ne cherche pas à avoir raison, cherche à décrire.',
    quiz: [
      { q: 'Selon Schopenhauer, quel est le but de la dialectique éristique ?', o: ['Tenir bon dans une dispute, que l’on ait raison ou tort', 'Découvrir la vérité objective', 'Former de bons logiciens', 'Enseigner la politesse'], a: 0, e: 'Il la définit comme l’art de disputer pour tenir bon : elle vise la victoire, pas la vérité.' },
      { q: 'Peut-on avoir raison et pourtant sembler avoir perdu une dispute ?', o: ['Oui : avoir raison et paraître gagner sont deux choses différentes', 'Non : la meilleure thèse finit toujours par gagner', 'Seulement devant des experts', 'Seulement à l’écrit'], a: 0, e: 'C’est tout le point de départ du texte.' },
      { q: 'Pourquoi, selon lui, défend-on souvent une thèse même fausse ?', o: ['Par vanité et obstination : on préfère défendre sa thèse plutôt que d’admettre une erreur', 'Parce que la logique l’exige', 'Par manque de vocabulaire', 'Parce que le public l’attend'], a: 0, e: 'Il décrit l’homme comme naturellement obstiné.' },
      { q: 'Quelle voie de réfutation attaque les conséquences de la thèse ?', o: ['La voie indirecte', 'La voie directe', 'L’argument ad hominem', 'L’homonymie'], a: 0, e: 'La voie directe attaque les raisons de la thèse ; l’indirecte, ses conséquences.' }
    ],
    sources: [{ t: 'The Art of Controversy, trad. T. Bailey Saunders (1896), Project Gutenberg', u: 'https://www.gutenberg.org/ebooks/10731' }]
  });
  var keys = Object.keys(E.familles), all = E.quiz.concat(QX);
  keys.forEach(function (k, idx) {
    var ss = E.strats.filter(function (s) { return s.f === k; }), M = META[k];
    L.push({
      id: 'e' + (idx + 1), m: 'er', n: 'É' + (idx + 1), titre: E.familles[k] + ' (' + ss.length + ' stratagèmes)', min: Math.max(6, Math.ceil(ss.length * 1.3)), src: 'schop',
      accroche: 'Pour chaque stratagème : le principe, un exemple, comment le reconnaître, comment y répondre.',
      sections: ss.map(function (s) {
        return { h: 'N° ' + s.n + ' · ' + s.t + ' (' + natL[s.nat] + ')', p: [
          'Le principe. ' + s.p,
          'Exemple (' + (s.exS ? 'de Schopenhauer' : 'de l’appli') + '). ' + s.ex,
          'Pour le reconnaître. ' + s.r,
          'Pour y répondre (' + (s.cS ? 'selon Schopenhauer' : 'conseil de l’appli') + '). ' + s.c
        ].concat(s.faux ? ['Nom moderne rapproché : ' + s.faux + '.'] : []) };
      }),
      retenir: M.r, erreur: M.e, methode: M.m, exercice: M.x,
      quiz: toQuiz(all.filter(function (q) { var s = strat(q.n); return s && s.f === k; })),
      sources: [{ t: 'The Art of Controversy, trad. T. Bailey Saunders (1896), Project Gutenberg', u: 'https://www.gutenberg.org/ebooks/10731' }]
    });
  });
  Array.prototype.push.apply(D.lessons, L);
})();
