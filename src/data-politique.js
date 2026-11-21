/* Module « Face aux objections » : veille sur des orateurs politiques (2024-2026). Seule la technique est enseignée : aucune opinion, aucune phrase à recopier.
   Les faits et chiffres cités par les orateurs sont les leurs et restent à vérifier. Rédigé par l'appli. */
(function () {
  var D = window.AO_DATA;
  if (!D || !D.modules || !D.lessons) return;
  D.modules.push({ id: 'po', tome: 'Veille Agora · Orateurs politiques', titre: 'Face aux objections', sous: 'Répondre quand on te contredit, écouter une voix, reconnaître les pièges : la technique de deux orateurs, jamais leur opinion' });
  var SRC = [
    { t: 'Business Club TV : déjeuner avec Nicolas Sarkozy, 12 septembre 2024 (partie 2)', u: 'https://www.youtube.com/watch?v=-INOP-DRj-s' },
    { t: 'franceinfo : « Nos services publics », interview de Jean-Luc Mélenchon, 12 novembre 2026', u: 'https://www.youtube.com/watch?v=8n6OJd3kzXM' },
    { t: 'LCI : Grand Débat de la présidentielle, novembre 2026', u: 'https://www.youtube.com/watch?v=omQ6RQwV_vo' }
  ];

  D.lessons.push(

  { id: 'po1', m: 'po', n: 'P1', titre: 'Répondre à une objection : sept gestes', min: 9, src: 'app',
    accroche: 'Un orateur politique est contredit chaque semaine, en direct, devant des gens qui attendent une faille. C’est un bon laboratoire : on y voit des gestes précis qu’on peut apprendre, quel que soit le camp.',
    sections: [
      { h: 'La règle de cette leçon', p: [
        'On étudie la technique, pas l’opinion. Le même geste sert à tous les camps, et ce qu’un orateur affirme (chiffre, fait, accusation) lui appartient : à vérifier avant de le reprendre. Les sous-titres automatiques ne montrent ni la voix ni les gestes ; la leçon suivante te propose de les écouter toi-même.' ] },
      { h: '1. Concéder, puis recadrer', p: [
        'Face à un constat que tu ne peux pas nier, reconnais d’abord ce qui est juste : « oui, c’est vrai que… ». Puis déplace le sujet : « mais la vraie question est… ». Dans une interview étudiée de novembre 2026, l’invité admet qu’un service public s’est dégradé avant de contester l’explication qu’on lui propose. La concession désarme ; elle doit être sincère, sinon elle sonne comme une ruse.' ] },
      { h: '2. Contester la comparaison', p: [
        'Quand la question repose sur un chiffre ou une comparaison, demande de quoi on parle : « qu’est-ce qu’on compare, exactement ? ». C’est légitime si tu réponds ensuite. Si tu t’arrêtes à la question, on dira que tu esquives.' ] },
      { h: '3. Un précédent, avec un vrai chiffre', p: [
        'Appuie ta réponse sur un cas réel plutôt que sur une affirmation. Nomme la source avant le chiffre (« selon… »). Danger : les chiffres cités de mémoire sont souvent faux ou datés. Si tu n’es pas sûr, dis-le et donne un ordre de grandeur.' ] },
      { h: '4. Reprendre la parole sans s’énerver', p: [
        'Si on te coupe, ne hausse pas la voix. Une phrase-pont suffit : « je voudrais terminer mon raisonnement ». Puis numérote : « premièrement… deuxièmement… ». Les numéros annoncent combien de temps tu demandes et rendent l’interruption suivante plus difficile.' ] },
      { h: '5. Désamorcer par l’humour', p: [
        'Une nouvelle hostile ou une question piquante peut se prendre avec légèreté : une phrase brève, un sourire, puis tu passes au fond. L’humour ne remplace pas la réponse ; il baisse la tension le temps de la donner. À éviter : le sarcasme envers la personne qui interroge.' ] },
      { h: '6. Dire que le chiffre viendra', p: [
        'Quand on te demande un coût ou un chiffre que tu n’as pas, dis-le honnêtement (« le chiffrage sera présenté plus tard ») mais donne un ordre de grandeur et une façon de le trouver. L’aveu rend crédible ; refuser sans rien donner paraît évasif.' ] },
      { h: '7. L’histoire fétiche et le dialogue rejoué', p: [
        'Beaucoup d’orateurs ont une anecdote personnelle qu’ils racontent en version courte, moyenne ou longue selon le temps. Elle sert de preuve vécue et de pause. Le dialogue rejoué (raconter une scène en faisant parler les personnages) permet de retourner un argument en le mettant dans la bouche de quelqu’un d’autre. Entraîne-toi à une seule histoire, en trois durées.' ] }
    ],
    retenir: ['Concède ce qui est juste, puis recadre.', 'Demande de quoi on parle, puis réponds quand même.', 'Source avant le chiffre ; si tu doutes, ordre de grandeur.', 'Reprends la parole par une phrase-pont et des numéros.'],
    exercice: 'Studio, exercice « Répondre à une objection » : tire une objection, réponds en 45 secondes (concéder, recadrer, preuve, conclure), enregistre, puis note quel geste tu as utilisé. Refais-le avec un autre geste.',
    quiz: [
      { q: 'Que fait-on d’abord quand un constat est juste ?', o: ['On le nie pour gagner du temps', 'On le reconnaît, puis on recadre', 'On change de sujet sans rien dire'], a: 1, e: 'Concéder ce qui est juste désarme l’objection ; on déplace ensuite la question.' },
      { q: 'Contester une comparaison est légitime à quelle condition ?', o: ['On répond ensuite à la question', 'On refuse de répondre', 'On attaque la personne qui interroge'], a: 0, e: 'Demander de quoi on parle clarifie ; s’arrêter là passe pour de l’esquive.' },
      { q: 'Tu n’as pas le chiffre demandé. Que fais-tu ?', o: ['J’invente un chiffre plausible', 'Je dis qu’il viendra plus tard et je donne un ordre de grandeur', 'Je réponds « sans commentaire »'], a: 1, e: 'L’aveu honnête avec un ordre de grandeur garde ta crédibilité.' }
    ], sources: SRC },

  { id: 'po2', m: 'po', n: 'P2', titre: 'Écouter une voix : rythme, silences, volume', min: 8, src: 'app',
    accroche: 'Un texte ne dit presque rien de la voix. Pour apprendre d’un orateur, il faut l’écouter, avec une grille simple et un minutage précis.',
    sections: [
      { h: 'Ce que le texte ne montre pas', p: [
        'La même phrase peut être tendre, ironique ou menaçante selon la vitesse, le volume et les silences. L’appli lit les sous-titres des vidéos, jamais le son : l’écoute est ton travail, et c’est un bon exercice.' ] },
      { h: 'Un indice : le débit', p: [
        'En comptant les mots des sous-titres sur des passages où l’orateur parle presque seul, on obtient un débit approximatif. Dans les deux vidéos étudiées, l’un tourne autour de 100 à 120 mots par minute, avec de longs silences, rires ou applaudissements ; l’autre autour de 160 à 220 mots par minute, plus dense. Ce sont deux stratégies, pas un classement : la lenteur donne du poids, la densité donne de l’élan. Les sous-titres étant automatiques et incomplets, ces valeurs servent à comparer des tendances, pas à mesurer.' ] },
      { h: 'La grille d’écoute', p: [
        'Pour chaque passage, note trois choses : la vitesse (lent, moyen, rapide), le volume (il monte, il baisse, il reste égal) et les silences (avant ou après la phrase clé, et leur durée). Écoute deux fois : une fois pour le sens, une fois pour la voix seule.' ] },
      { h: 'Parcours d’écoute 1 : Business Club TV (2024)', p: [
        '2:16 à 3:03 : l’histoire de la petite rivière. Écoute le calme et les pauses avant la conclusion.',
        '5:09 à 5:25 : l’image de la deux-chevaux et de la Ferrari. Où la voix s’appuie-t-elle ?',
        '19:44 à 20:44 : échec et succès. Silence avant la phrase clé, baisse de voix.',
        '22:22 à 22:57 : la scène avec Chirac. Ton de confidence, dialogue rejoué.',
        '34:00 à 37:04 : la décision de 2008. Montée progressive, « 100 % » martelé.',
        '49:00 à 51:04 : le dialogue avec Obama. Changements de voix entre les personnages.' ] },
      { h: 'Parcours d’écoute 2 : franceinfo (novembre 2026)', p: [
        '1:00 à 1:25 : réaction à une nouvelle hostile. Ton léger, ironie.',
        '9:28 à 10:03 : « préjugé de classe ». Accélération et insistance.',
        '12:22 : phrase de reprise de parole. Quel ton prend la voix ?',
        '19:12 à 19:34 : un début d’agacement. Le changement de couleur de voix.',
        '26:13 à 26:33 : bascule vers un registre émotionnel.' ] }
    ],
    retenir: ['Le texte ne montre pas la voix : écoute.', 'Note vitesse, volume, silences.', 'Lent et dense sont deux stratégies, pas deux niveaux.', 'Écoute deux fois : le sens, puis la voix seule.'],
    exercice: 'Choisis trois passages du parcours. Pour chacun, note vitesse, volume et silences. Puis lis un texte de ton choix en imitant seulement un de ces trois paramètres (par exemple les silences), enregistre-toi dans le Studio et compare.',
    quiz: [
      { q: 'Que mesure-t-on avec les sous-titres d’une vidéo ?', o: ['Un débit approximatif', 'L’émotion exacte', 'Le volume de la voix'], a: 0, e: 'On compte des mots par minute ; les sous-titres automatiques sont incomplets.' },
      { q: 'Un orateur lent et un orateur dense : lequel est meilleur ?', o: ['Le lent', 'Le dense', 'Aucun : ce sont deux stratégies'], a: 2, e: 'La lenteur donne du poids, la densité de l’élan. Tout dépend du message.' },
      { q: 'Quelles trois choses noter pour chaque passage ?', o: ['Vitesse, volume, silences', 'Gestes, décor, public', 'Mots, durée, titre'], a: 0, e: 'La grille d’écoute tient sur ces trois paramètres.' }
    ], sources: SRC },

  { id: 'po3', m: 'po', n: 'P3', titre: 'Reconnaître les pièges, sans les copier', min: 7, src: 'app',
    accroche: 'Certains gestes marchent sur le moment mais coûtent cher : ils ferment la discussion, froissent l’interlocuteur ou sonnent faux. Apprends à les repérer, pas à les reproduire.',
    sections: [
      { h: 'L’immunisation', p: [
        'Dire « si tout le monde est d’accord avec vous, c’est suspect » rend toute critique irrecevable : si on t’approuve, tu as raison ; si on te contredit, tu es sur la bonne voie. Cet argument ne se discute pas. Repère-le quand tu l’entends, et ne l’utilise pas pour te protéger.' ] },
      { h: 'La question « absurde »', p: [
        'Qualifier la question d’absurde, avant d’y répondre, peut gagner du temps. Mais si on ne répond pas ensuite, le public retient l’esquive. Dans un débat, une réponse brève suivie d’un recadrage vaut mieux qu’un jugement sur la question.' ] },
      { h: 'La familiarité méprisante', p: [
        'Un ton condescendant envers la personne qui interroge fait rire un public acquis, mais coûte la sympathie des autres. Le geste fort, c’est d’être exigeant sur l’argument et courtois avec la personne.' ] },
      { h: 'Couper la parole, attaquer la personne', p: [
        'Couper la parole, attaquer le caractère de l’adversaire (ad hominem), faire un faux dilemme ou renvoyer « et toi alors ? » (tu quoque) : ce sont des ruses de l’éristique. Tu les trouveras dans le module Schopenhauer. Les reconnaître te protège ; les utiliser te rend plus faible si on les repère.' ] },
      { h: 'Le cadre change tout', p: [
        'Ce qui marche dans une interview amicale (esquiver par son rôle, rester vague) devient fragile dans un débat à plusieurs. Avant de t’inspirer d’un geste, demande-toi dans quel cadre il a été produit.' ] }
    ],
    retenir: ['Repère l’immunisation, ne l’utilise pas.', 'Réponds avant de juger la question.', 'Exigeant sur l’argument, courtois avec la personne.', 'Le cadre change la valeur d’un geste.'],
    exercice: 'Regarde un passage d’un débat de ton choix. Note trois gestes que tu as repérés, dis pour chacun s’il aide ou nuit, et pourquoi. Puis reformule l’un des gestes risqués en version propre.',
    quiz: [
      { q: 'Pourquoi l’immunisation est-elle un piège ?', o: ['Elle rend toute critique irrecevable', 'Elle est trop longue', 'Elle fait rire le public'], a: 0, e: 'Si l’approbation prouve que tu as raison et la critique aussi, plus rien ne se discute.' },
      { q: 'Que vaut mieux face à une question dérangeante ?', o: ['La juger absurde et se taire', 'Répondre brièvement puis recadrer', 'Attaquer celui qui la pose'], a: 1, e: 'La réponse brève évite l’esquive ; le recadrage garde l’initiative.' },
      { q: 'Un geste efficace dans une interview amicale l’est-il toujours en débat ?', o: ['Oui, toujours', 'Non, le cadre change sa valeur', 'Seulement avec un chronomètre'], a: 1, e: 'Esquiver par son rôle passe en cadre amical mais s’expose en débat contradictoire.' }
    ], sources: SRC }

  );
})();
