/* Module « Construire et relier ses idées » : fondements (affirmation, raison, preuve), connecteurs, balisage, prolepse, concession, exemple, reformulation. Rédigé par l'appli. */
(function () {
  var D = window.AO_DATA;
  D.modules.push({ id: 'cx', tome: 'Atelier Agora · Parler clair', titre: 'Construire et relier ses idées', sous: 'Les fondements d’une idée, les connecteurs, et les cinq étapes qui donnent envie de croire' });
  var SRC = [
    { t: 'Wikipedia : Modèle de Toulmin', u: 'https://en.wikipedia.org/wiki/Toulmin_model' },
    { t: 'Wikipedia : Rhétorique', u: 'https://fr.wikipedia.org/wiki/Rh%C3%A9torique' }
  ];

  D.lessons.push(

  { id: 'x1', m: 'cx', n: 'X1', titre: 'Construire une idée : affirmation, raison, preuve', min: 8, src: 'app',
    accroche: 'Avant de relier des idées, il faut en avoir. Une idée solide tient en trois éléments, et on peut les vérifier un par un.',
    sections: [
      { h: 'Une idée n’est pas une phrase', p: [
        'Dire « le bonheur, c’est important » n’est pas une idée : c’est un sujet. Une idée prend position (« le bonheur, c’est d’abord se sentir utile »), dit pourquoi, et montre quelque chose qu’on peut voir ou vérifier.',
        'Sans raison, ce que tu dis reste une opinion. Sans preuve, c’est une promesse. L’auditeur ne te croit pas parce que tu l’affirmes : il te croit parce qu’il peut suivre le chemin.' ] },
      { h: 'Les trois éléments', p: [
        '1. L’affirmation : ce que tu défends, en une phrase simple.',
        '2. La raison : pourquoi c’est vrai (« parce que… »).',
        '3. La preuve : ce qui le montre, par un exemple, un chiffre, une histoire ou une source.',
        'Exemple de l’appli, sur le bonheur : « Le bonheur, c’est d’abord se sentir utile (affirmation), parce qu’on supporte mieux un effort quand il sert à quelqu’un (raison). Pense à une personne qui s’occupe d’un proche malade : elle est épuisée, et pourtant elle tient (preuve). »',
        'Remarque : cet exemple illustre la forme. La force d’une preuve dépend de ce qu’elle prouve vraiment : un exemple fait comprendre, il ne démontre pas à lui seul.' ] },
      { h: 'Le PREP : le même schéma en quatre temps', p: [
        'Point (j’affirme), Raison (parce que), Exemple (par exemple), Point (je répète l’idée sous une autre forme). Cela tient en 60 à 90 secondes et fonctionne pour répondre à une question, ouvrir un paragraphe ou improviser.',
        'Le dernier Point compte : à l’oral, on ne peut pas relire. Redire l’idée laisse une seconde chance à celui qui s’est distrait.' ] },
      { h: 'Un cran de plus : le modèle de Toulmin', p: [
        'Le philosophe Stephen Toulmin (The Uses of Argument, 1958) décrit un argument avec plus de pièces : une thèse (claim), des données (grounds), une garantie (warrant : le lien qui autorise à passer des données à la thèse), et parfois une réserve (qualifier : « en général », « sauf si ») et une objection prévue (rebuttal).',
        'Ce modèle sert à trouver où un argument est faible. Très souvent, les faits sont exacts, mais la garantie est discutable : « Ce produit se vend beaucoup (donnée), donc il est bon (thèse) » suppose que vendre beaucoup prouve la qualité. C’est le lien qu’il faut tester.' ] },
      { h: 'Cinq principes pour construire', p: [
        'Une idée par bloc : deux idées dans une phrase, et le public n’en retient aucune.',
        'Dire d’abord, expliquer ensuite : l’auditeur sait ce que la raison défend.',
        'Préférer le concret : l’abstrait s’oublie, un exemple reste.',
        'Redire sous une autre forme : à l’oral, la répétition utile est une aide, pas un défaut.',
        'Relier les blocs : c’est le rôle des connecteurs, objet de l’atelier suivant.' ] }
    ],
    retenir: ['Une idée = affirmation + raison + preuve.', 'PREP : Point, Raison, Exemple, Point.', 'Teste la garantie : c’est souvent là que l’argument casse.'],
    erreur: 'Empiler des exemples sans dire quelle idée ils servent. Si l’affirmation manque, le public ne sait pas quoi retenir.',
    methode: 'Prends une phrase que tu viens de dire. Écris-la en une ligne (affirmation), ajoute un « parce que… », puis note une preuve concrète. S’il manque un des trois, ta phrase n’est pas encore une idée.',
    exercice: 'Choisis une opinion que tu défends vraiment. Écris-la en trois lignes : affirmation, raison, preuve. Dis-la à voix haute en 45 secondes en terminant par la reformulation (le dernier Point du PREP).',
    quiz: [
      { q: 'Quels sont les trois éléments d’une idée solide ?', o: ['Affirmation, raison, preuve', 'Introduction, développement, conclusion', 'Ethos, pathos, logos'], a: 0, e: 'Affirmation (ce que tu défends), raison (pourquoi), preuve (ce qui le montre).' },
      { q: 'Que signifie le P final du PREP ?', o: ['Un nouveau problème', 'Je répète l’idée sous une autre forme', 'Je passe à un autre sujet'], a: 1, e: 'Point, Raison, Exemple, Point : on termine en redisant l’idée, car à l’oral l’auditeur ne peut pas relire.' },
      { q: 'Chez Toulmin, que désigne la « garantie » (warrant) ?', o: ['Le chiffre le plus fiable', 'Le lien qui permet de passer des données à la thèse', 'La conclusion du discours'], a: 1, e: 'La garantie est ce qui autorise à passer des données à la thèse. C’est souvent la partie la plus discutable.' },
      { q: 'Un orateur donne un très bel exemple, mais ne dit jamais ce qu’il prouve. Quel élément manque ?', o: ['La preuve', 'L’affirmation', 'La raison'], a: 1, e: 'Sans affirmation claire, l’exemple flotte : le public ne sait pas ce qu’il doit en retenir.' }
    ], sources: SRC },

  { id: 'x2', m: 'cx', n: 'X2', titre: 'Les connecteurs : la colle du discours', min: 8, src: 'app',
    accroche: 'Un connecteur n’a pas de sens par lui-même : il dit au public quel est le rapport entre deux idées. C’est la colle, pas la brique.',
    sections: [
      { h: 'Pourquoi ils comptent à l’oral', p: [
        'À l’écrit, le lecteur peut revenir en arrière. À l’oral, il ne le peut pas. Les connecteurs lui indiquent où il va : « parce que » annonce une raison, « mais » annonce un retournement, « donc » annonce une conséquence. Il suit sans effort.' ] },
      { h: 'Annoncer et ajouter', p: [
        'Annoncer : d’abord, premièrement, voici ce que je défends, je voudrais dire trois choses.',
        'Ajouter : de plus, en outre, par ailleurs, et ce n’est pas tout.' ] },
      { h: 'Expliquer : cause et conséquence', p: [
        'Cause : parce que, car, en effet, puisque, étant donné que.',
        'Conséquence : donc, c’est pourquoi, par conséquent, ce qui signifie que.',
        'Attention au sens : « parce que » donne la raison de ce que l’on vient de dire, « donc » en tire une suite. Les inverser brouille le raisonnement.' ] },
      { h: 'Illustrer et comparer', p: [
        'Exemple : par exemple, prenons le cas de, pensez à, ainsi.',
        'Comparer : de même que, à l’inverse, contrairement à, comme.' ] },
      { h: 'Concéder et s’opposer', p: [
        'Concéder : certes, il est vrai que, je vous l’accorde, bien sûr.',
        'S’opposer : mais, pourtant, cependant, or, en revanche.',
        'Le « mais » est le mot le plus puissant : ce qui précède devient un décor, ce qui suit est le message. « Or » introduit le fait qui retourne l’argument : « On dit que… ; or les chiffres montrent que… ».' ] },
      { h: 'Reformuler et conclure', p: [
        'Reformuler : autrement dit, en d’autres termes, ce que je veux dire, c’est…',
        'Conclure : en somme, voilà pourquoi, pour résumer, c’est pour cela que.' ] },
      { h: 'Trois règles d’usage', p: [
        '1. Un connecteur doit dire vrai. « Donc » annonce une conséquence : si ce n’en est pas une, tu trompes l’auditeur, volontairement ou non.',
        '2. Varier. Dix « donc » dans un discours sonnent comme un tic. Alterne : c’est pourquoi, par conséquent, voilà pourquoi.',
        '3. Les dire avec le corps. Un connecteur est souvent précédé d’une pause et appuyé par la voix. « Mais… » suivi d’un silence pèse beaucoup plus que « mais » dit vite.' ] }
    ],
    retenir: ['Un connecteur dit le rapport entre deux idées.', '« Mais » et « or » orientent tout ce qui suit.', 'Il doit dire vrai : « donc » sans conséquence est trompeur.'],
    erreur: 'Mettre des connecteurs pour faire sérieux. Enlève-les mentalement : si ton raisonnement disparaît avec eux, c’est qu’il n’existait pas.',
    methode: 'Choisis un paragraphe de tes notes. Souligne chaque connecteur et écris à côté son rôle (cause, conséquence, opposition…). Remplace tout connecteur répété par un synonyme dans la bonne famille.',
    exercice: 'Dis une idée en 45 secondes en utilisant au moins un connecteur de cause, un d’opposition et un de reformulation. Dans le Studio, l’exercice « Relier ses idées » te montrera ce que ton texte contient.',
    quiz: [
      { q: 'Quel connecteur annonce une conséquence ?', o: ['Parce que', 'Donc', 'Certes'], a: 1, e: '« Donc » tire une suite de ce qui précède. « Parce que » donne une raison et « certes » concède un point.' },
      { q: 'Dans « Les ventes montent ; or le produit est défectueux », que fait « or » ?', o: ['Il ajoute un argument', 'Il introduit un fait qui retourne l’argument', 'Il conclut'], a: 1, e: '« Or » introduit le fait qui change la conclusion attendue.' },
      { q: 'Pourquoi dire « donc » après quelque chose qui n’en est pas la conséquence est-il problématique ?', o: ['Ce n’est pas poli', 'On fait croire à un raisonnement qui n’existe pas', 'Cela allonge la phrase'], a: 1, e: 'Le connecteur affirme un lien logique. S’il est faux, il induit le public en erreur.' },
      { q: 'Que faire quand on dit dix fois « donc » ?', o: ['Continuer, c’est un connecteur sûr', 'Varier avec « c’est pourquoi », « par conséquent », « voilà pourquoi »', 'Supprimer tous les connecteurs'], a: 1, e: 'La répétition devient un tic. Varier en restant dans la même famille garde le sens et soulage l’oreille.' }
    ], sources: SRC },

  { id: 'x3', m: 'cx', n: 'X3', titre: 'Annoncer et prévenir : le balisage et la prolepse', min: 8, src: 'app',
    accroche: 'Deux gestes très simples font paraître un orateur sûr de lui : dire où il va, et désamorcer l’objection avant qu’elle ne vienne.',
    sections: [
      { h: 'Le balisage : donner la carte', p: [
        '« Je voudrais dire trois choses. » « Voici ce que je défends. » « Premier point. » Ces phrases ne contiennent aucune idée nouvelle, mais elles rendent tout le reste plus facile à suivre.',
        'Pour toi, c’est un guide : tu sais où tu en es. Pour le public, c’est la preuve que tu sais où tu vas. C’est la fonction de l’annonce du plan dans la structure classique.' ] },
      { h: 'La prolepse : répondre avant la question', p: [
        'En rhétorique, la prolepse consiste à anticiper une objection et à y répondre avant qu’elle soit formulée : « Attention, je ne suis pas en train de dire que… », « Ne me faites pas dire que… », « Soyons clairs : il ne s’agit pas de… ».',
        'Pourquoi cela marche : l’auditeur qui allait penser « il oublie que… » constate que tu y as pensé. Tu gagnes en crédibilité, et il devient difficile de te répondre « vous dites que… » quand tu viens de dire que tu ne le dis pas.',
        'Dans la structure classique, c’est la réfutation. La différence est le placement : ici, elle vient tôt, au moment où l’objection est la plus probable.' ] },
      { h: 'Quand c’est honnête, et quand cela ne l’est plus', p: [
        'La prolepse honnête clarifie vraiment ta position : « Je ne dis pas qu’il faut tout interdire ; je dis qu’il faut un cadre. »',
        'Une version trompeuse existe, la paralipse : dire qu’on ne dira pas quelque chose pour le dire quand même. « Je ne dis pas qu’il ment, mais… » insinue ce qu’on n’ose pas affirmer. Le public sent souvent la manœuvre. Teste-toi : si tu supprimais le début de la phrase, dirais-tu la même chose ?' ] },
      { h: 'Le test pratique', p: [
        'Avant de parler, écris l’objection la plus probable de ton auditoire. Puis trouve la phrase qui la désamorce en dix secondes, par exemple « On va me dire que… ; je réponds que… ». Tu auras préparé ta réfutation sans qu’elle ressemble à une défense.' ] }
    ],
    retenir: ['Annoncer le plan rassure l’orateur et le public.', 'Prolepse = répondre avant l’objection.', 'Attention à la paralipse : « je ne dis pas que… mais » peut cacher une insinuation.'],
    erreur: 'Utiliser « je ne dis pas que… » pour glisser une accusation. Une prolepse doit clarifier ta position, pas la déguiser.',
    methode: 'Pour chaque idée forte de ton discours, écris l’objection la plus probable en une phrase, puis ta réponse en une phrase. Place cette paire juste après l’idée.',
    exercice: 'Choisis une opinion qui divise. Prépare une ouverture de 30 secondes : une annonce (« je voudrais dire deux choses ») et une prolepse (« attention, je ne dis pas que… »). Enregistre-toi et vérifie que la prolepse précise vraiment ta position.',
    quiz: [
      { q: 'À quoi sert le balisage (« je voudrais dire trois choses ») ?', o: ['À ajouter un argument', 'À donner la carte au public et à l’orateur', 'À gagner du temps pour trouver une idée'], a: 1, e: 'Il guide l’orateur et montre au public qu’il sait où il va.' },
      { q: 'Qu’est-ce que la prolepse ?', o: ['Répondre à l’objection avant qu’elle soit formulée', 'Conclure en reprenant l’exorde', 'Citer une autorité'], a: 0, e: 'On anticipe l’objection et on y répond d’avance, ce qui renforce la crédibilité.' },
      { q: '« Je ne dis pas qu’il ment, mais… » : de quoi peut-il s’agir ?', o: ['D’une prolepse toujours honnête', 'D’une paralipse : on insinue ce qu’on dit ne pas dire', 'D’une concession'], a: 1, e: 'La paralipse consiste à dire qu’on ne dit pas quelque chose pour le dire quand même.' },
      { q: 'Quel test aide à voir si une prolepse est honnête ?', o: ['Elle contient « attention »', 'Si on retire le début de la phrase, dit-on encore la même chose ?', 'Elle est courte'], a: 1, e: 'Si la phrase sans « je ne dis pas que » dit tout autre chose, c’était une insinuation.' }
    ], sources: SRC },

  { id: 'x4', m: 'cx', n: 'X4', titre: 'Concéder, illustrer, reformuler', min: 9, src: 'app',
    accroche: 'La concession donne l’air honnête, l’exemple rend l’idée visible, la reformulation la fait retenir. Trois gestes, trois effets.',
    sections: [
      { h: 'La concession : « certes… mais »', p: [
        'Tu reconnais un point à l’autre, puis tu reviens à ta thèse : « Certes, c’est plus cher ; mais cela dure dix ans. » La concession te montre honnête et attentif, et elle prépare le « mais », qui porte la phrase.',
        'Règle : concède un point réel, mais pas ton point central. Concéder trop, c’est perdre ta thèse ; ne rien concéder, c’est paraître fermé.' ] },
      { h: 'L’exemple : rendre l’idée visible', p: [
        '« Prenons le cas de… », « pensez à… ». Un exemple remplace une explication abstraite. Périer, dans le manuel de ton parcours, voit trois avantages au récit : il met du concret, il casse la monotonie par un changement de ton, et il assoit l’argument sur un cas tangible.',
        'Un bon exemple est court (quelques phrases), précis (un détail réel), et relié à l’idée par une phrase de retour : « Voilà ce que je veux dire : … ».',
        'Limite : un exemple illustre, il ne démontre pas. Si tu dois prouver, ajoute un chiffre ou une source vérifiable.' ] },
      { h: 'La reformulation : se faire retenir', p: [
        '« Autrement dit… », « en somme… », « ce que je veux dire, c’est… ». Tu redis l’idée plus court et plus simple. C’est la phrase que le public retiendra, donc prépare-la.',
        'Astuce : écris ta phrase finale à l’avance, en moins de quinze mots, sans connecteur de trop. Elle sert aussi de dernière phrase de la péroraison.' ] },
      { h: 'Les enchaîner', p: [
        'Un enchaînement qui fonctionne souvent : j’affirme, je concède, je retourne avec « mais » ou « or », je donne un exemple, je reformule. C’est le cœur de l’atelier suivant.' ] }
    ],
    retenir: ['Concède un point réel, jamais ton point central.', 'Un exemple court, précis, relié à l’idée.', 'La reformulation est la phrase qui sera retenue : prépare-la.'],
    erreur: 'Donner un exemple long et brillant qui fait oublier l’idée. Termine toujours par une phrase de retour qui relie l’exemple à l’affirmation.',
    methode: 'Pour un sujet donné, écris trois « certes… mais » différents. Garde celui où la concession est la plus honnête, puis ajoute un exemple en deux phrases et une reformulation de moins de quinze mots.',
    exercice: 'Dans le Studio, exercice « Relier ses idées » : parle 1 minute en plaçant une concession, un exemple et une reformulation. Regarde lesquels apparaissent dans ton texte.',
    quiz: [
      { q: 'Quelle est la bonne règle pour concéder ?', o: ['Concéder son point central pour paraître ouvert', 'Concéder un point réel mais secondaire, puis revenir à sa thèse', 'Ne jamais concéder'], a: 1, e: 'La concession doit être honnête, mais ne doit pas t’amener à abandonner ta thèse.' },
      { q: 'Que fait le « mais » dans « Certes, c’est plus cher ; mais cela dure dix ans » ?', o: ['Il affaiblit la phrase', 'Il fait de ce qui suit le message principal', 'Il introduit un exemple'], a: 1, e: 'Ce qui précède le « mais » prépare le terrain ; ce qui suit porte l’idée.' },
      { q: 'Quelle limite a un exemple ?', o: ['Il est toujours faux', 'Il illustre mais ne démontre pas à lui seul', 'Il ne doit jamais être concret'], a: 1, e: 'Un cas peut ne pas être représentatif. Pour prouver, il faut un chiffre ou une source vérifiable.' },
      { q: 'Pourquoi préparer sa reformulation finale à l’avance ?', o: ['C’est la phrase que le public retiendra', 'Pour allonger le discours', 'Pour éviter de parler'], a: 0, e: 'La reformulation est ce qui reste dans la mémoire : autant la choisir.' }
    ], sources: SRC },

  { id: 'x5', m: 'cx', n: 'X5', titre: 'Assembler, écouter, vérifier', min: 10, src: 'app',
    accroche: 'On a maintenant les cinq gestes. Reste à les assembler, à les repérer chez les autres, et à ne pas se laisser convaincre par la seule forme.',
    sections: [
      { h: 'Le schéma en cinq étapes', p: [
        '1. J’annonce : « Je voudrais dire deux choses. »',
        '2. Je préviens le malentendu : « Attention, je ne dis pas que… »',
        '3. Je concède : « Certes, … »',
        '4. J’illustre : « Prenons le cas de… »',
        '5. Je reformule : « Autrement dit… »',
        'Ce n’est pas un moule obligatoire. C’est un exercice : en forçant les cinq étapes, tu apprends à les sentir, puis tu les adaptes avec naturel.' ] },
      { h: 'Un exemple assemblé (qu’est-ce que le bonheur ?)', p: [
        '« Je voudrais dire une chose simple : le bonheur, c’est d’abord se sentir utile. Attention, je ne dis pas qu’il faut tout sacrifier aux autres. Certes, on peut être heureux seul un dimanche ; mais ce n’est pas ce qui tient dans la durée. Prenons le cas d’une personne qui s’occupe d’un proche : elle est fatiguée, et pourtant elle tient. Autrement dit : on supporte presque tout quand cela sert à quelqu’un. »',
        'Exemple écrit par l’appli pour montrer la forme. Il ne prétend pas répondre à la question du bonheur : on peut défendre d’autres thèses avec exactement la même construction.' ] },
      { h: 'Écouter un orateur : comment voir la mécanique', p: [
        'Prends un discours ou un débat, par exemple d’un responsable politique, d’un conférencier ou d’un avocat. Écoute en repérant : où annonce-t-il ? où prévient-il l’objection ? où concède-t-il ? quel exemple choisit-il ? quelle phrase répète-t-il à la fin ?',
        'Tu verras que des styles très différents (phrases courtes et fermes, ou longues et littéraires) utilisent les mêmes pièces. La différence vient du rythme, de la voix et du choix des exemples.' ] },
      { h: 'Vérifier : la forme n’est pas la preuve', p: [
        'Des connecteurs bien placés donnent une impression de rigueur, même quand le raisonnement est faible. Trois tests :',
        'Le test du retrait : enlève mentalement les connecteurs. Que reste-t-il comme argument ?',
        'Les faux connecteurs : un « donc » sans conséquence, un « en effet » sans cause, un « or » sans fait.',
        'Le test du fait : si on lui oppose un chiffre ou un fait précis, répond-il à ce fait, ou change-t-il de sujet ? C’est là que les stratagèmes du module « L’éristique » deviennent utiles.',
        'Sur une question de valeurs (« qu’est-ce que le bonheur ? »), il n’y a pas de chiffre à vérifier : « donner envie de croire » est même ce qu’on attend de l’orateur. Dès qu’il y a un chiffre, une cause ou une promesse, vérifie.' ] }
    ],
    retenir: ['Annoncer, prévenir, concéder, illustrer, reformuler.', 'Les styles diffèrent, les pièces sont les mêmes.', 'La forme persuade ; seule la preuve démontre.'],
    erreur: 'Prendre l’aisance de quelqu’un pour la solidité de son argument. Applique toujours le test du retrait.',
    methode: 'Écoute deux minutes d’un orateur de ton choix. Note chaque étape repérée avec l’heure. Puis refais le même exercice sur un de tes enregistrements du Studio.',
    exercice: 'Studio, exercice « Relier ses idées » : sujet « Qu’est-ce que le bonheur ? ». Parle 2 minutes en enchaînant les cinq étapes, enregistre, importe ou colle ta transcription, et regarde combien d’étapes sont détectées. Refais-le jusqu’à cinq sur cinq.',
    quiz: [
      { q: 'Dans quel ordre le schéma propose-t-il de placer les étapes ?', o: ['Annoncer, prévenir, concéder, illustrer, reformuler', 'Concéder, annoncer, reformuler, illustrer, prévenir', 'Illustrer, annoncer, conclure, prévenir, concéder'], a: 0, e: 'J’annonce, je préviens le malentendu, je concède, j’illustre, je reformule.' },
      { q: 'Que révèle le « test du retrait » ?', o: ['Si le discours est trop long', 'Ce qui reste d’un argument quand on enlève les connecteurs', 'Si la voix est monotone'], a: 1, e: 'Si le raisonnement disparaît avec les connecteurs, c’est qu’il reposait sur eux et non sur des idées.' },
      { q: 'Sur « Qu’est-ce que le bonheur ? », pourquoi n’y a-t-il pas de chiffre à vérifier ?', o: ['C’est une question de valeurs, pas de faits', 'Les chiffres ne sont jamais fiables', 'Personne n’a étudié le bonheur'], a: 0, e: 'Les questions de valeurs relèvent de la conviction. Dès qu’un chiffre, une cause ou une promesse apparaît, on vérifie.' },
      { q: 'Quel est un « faux connecteur » ?', o: ['Un « donc » placé sans véritable conséquence', 'Un « mais » après une concession', 'Un « par exemple » suivi d’un exemple'], a: 0, e: 'Le connecteur affirme un lien logique : quand ce lien n’existe pas, il fait croire à un raisonnement.' }
    ], sources: SRC }

  );
})();
