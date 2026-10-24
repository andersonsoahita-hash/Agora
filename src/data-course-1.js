/* Cours — Tome I (chapitres 1 à 10). Texte repris et condensé du Tome I d'Anderson, complété par des analyses et des cas.
   Les rubriques « Pour aller plus loin » et « Cas réel » sont rédigées par l'appli. */
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.modules = [
  { id: 'p1', tome: 'Tome I · Comprendre et construire', titre: 'I. Les fondements', sous: 'La tête de l’orateur : comprendre avant de parler' },
  { id: 'p2', tome: 'Tome I · Comprendre et construire', titre: 'II. La structure', sous: 'L’architecture du discours' },
  { id: 'p3', tome: 'Tome I · Comprendre et construire', titre: 'III. Le langage', sous: 'Les mots qui frappent' },
  { id: 'pa', tome: 'Argumenter', titre: 'Argumenter', sous: 'Trouver, construire, réfuter' },
  { id: 'p4', tome: 'Tome II · Incarner', titre: 'IV. La voix', sous: 'Un instrument à apprivoiser' },
  { id: 'p5', tome: 'Tome II · Incarner', titre: 'V. Le corps', sous: 'Poser, regarder, bouger' },
  { id: 'p6', tome: 'Tome II · Incarner', titre: 'VI. La mémoire', sous: 'Parler sans réciter' },
  { id: 'p7', tome: 'Tome II · Incarner', titre: 'VII. L’adaptation', sous: 'Parler à quelqu’un' },
  { id: 'p8', tome: 'Tome II · Incarner', titre: 'VIII. La psychologie', sous: 'Trac, confiance, sincérité' },
  { id: 'p9', tome: 'Tome II · Incarner', titre: 'IX. L’entraînement', sous: 'Progresser pour de bon' },
  { id: 'p10', tome: 'Tome III · Au-delà du discours', titre: 'X. Les autres terrains', sous: 'Négocier, écrire, parler aux médias' },
  { id: 'p11', tome: 'Tome III · Au-delà du discours', titre: 'XI. Débattre, improviser, répondre', sous: 'Quand on ne peut pas tout préparer' }
];
window.AO_DATA.lessons = window.AO_DATA.lessons || [];
window.AO_DATA.lessons.push(

{ id: 'c1', m: 'p1', n: 1, titre: 'Qu’est-ce que l’art oratoire ?', min: 8, src: 'livre',
  accroche: 'Depuis que l’homme vit en groupe, il parle pour obtenir ce qu’il ne peut pas prendre par la force : l’accord des autres.',
  sections: [
    { h: 'Parler n’est pas convaincre', p: [
      'On peut parler beaucoup sans convaincre personne, et dire trois phrases qui changent une décision. La différence ne tient pas au volume, mais à l’intention. Parler, c’est émettre. Convaincre, c’est provoquer un mouvement chez l’autre : une idée qui bascule, une émotion qui naît, une action qui se déclenche.',
      'Cette distinction change tout dans la préparation. Celui qui veut seulement parler se demande : « qu’est-ce que je veux dire ? ». Celui qui veut convaincre se demande d’abord : « qu’est-ce que je veux que l’autre pense, ressente ou fasse en sortant ? ». La deuxième question est plus difficile, mais c’est la seule qui compte. Elle place l’auditoire, et non l’orateur, au centre du discours.' ] },
    { h: 'Trois mots à ne plus confondre', p: [
      'La rhétorique est l’art de bien construire un discours pour persuader : c’est la technique. L’éloquence est le talent de bien dire, la grâce d’une parole qui touche : c’est l’effet. La dialectique est l’art de raisonner et de débattre pour approcher le vrai : c’est la rigueur.',
      'On peut être éloquent sans rigueur (un beau parleur), rigoureux sans éloquence (un expert qu’on n’écoute pas). Un grand orateur réunit les trois : il raisonne juste, il construit bien, et il le dit avec force.' ] },
    { h: 'Trois maîtres, trois héritages', p: [
      'Aristote, au IVᵉ siècle avant notre ère, écrit la Rhétorique et fonde la discipline sur des piliers que nous utilisons encore. Cicéron, avocat et homme politique romain, en fait un art complet en cinq étapes, du premier brouillon jusqu’à la scène. Quintilien en fait une véritable pédagogie : pour lui, l’orateur idéal est d’abord « un homme de bien qui sait parler ». La technique sans droiture n’est, à ses yeux, qu’un danger.',
      'Retenir ces trois noms n’est pas de l’érudition pour l’érudition : presque tout ce qu’on « découvre » aujourd’hui en prise de parole a déjà été pensé, testé et transmis. Nous héritons de vingt-quatre siècles d’expérience.' ] },
    { h: 'Pour aller plus loin : pourquoi la parole s’apprend', p: [
      'Pourquoi insister sur « l’art » et non sur « le don » ? Parce que la croyance au don est paralysante : si l’on pense que bien parler est inné, on cesse de s’entraîner dès le premier échec. Démosthène, selon la tradition, était un orateur médiocre à ses débuts et a travaillé sa diction avant de devenir une référence. Que cette anecdote soit exacte dans tous ses détails ou non, elle porte la même idée que Bertrand Périer dans son enseignement : la parole se travaille comme on fait ses gammes.',
      'Objection à examiner : certains ont plus d’aisance naturelle. C’est vrai, et c’est sans importance pour toi : l’aisance naturelle sans méthode plafonne vite, alors que la méthode donne un plancher que personne ne t’enlève.' ] }
  ],
  retenir: ['Parler = émettre. Convaincre = faire bouger l’autre. Tout se joue dans cette bascule.', 'Rhétorique (la technique) + Éloquence (l’effet) + Dialectique (la rigueur) = l’orateur complet.', 'Aristote a fondé, Cicéron a structuré, Quintilien a enseigné.'],
  erreur: 'Croire que « bien parler », c’est parler beaucoup ou avec des mots compliqués. C’est presque toujours l’inverse : la clarté et la justesse convainquent plus que l’abondance. Le jargon impressionne rarement ; le plus souvent, il éloigne.',
  exercice: 'Repense à la dernière fois où quelqu’un t’a fait changer d’avis. Qu’a-t-il fait exactement : un argument, une histoire, un ton, un silence, un exemple ? Écris-le en trois lignes. Tu viens d’identifier ta première technique, et tu peux la réutiliser.',
  quiz: [
    { q: 'Quelle différence entre « parler » et « convaincre » ?', o: ['Le volume de la voix', 'Convaincre provoque un mouvement chez l’autre', 'Convaincre demande des mots savants'], a: 1, e: 'Convaincre, c’est faire bouger l’autre : une idée, une émotion, une action.' },
    { q: 'La dialectique est…', o: ['La technique de construction', 'Le talent de bien dire', 'L’art de raisonner pour approcher le vrai'], a: 2, e: 'Rhétorique = technique, éloquence = effet, dialectique = rigueur.' },
    { q: 'Qui définit l’orateur idéal comme « un homme de bien qui sait parler » ?', o: ['Quintilien', 'Aristote', 'Démosthène'], a: 0, e: 'C’est la formule de Quintilien, pour qui la technique sans droiture est un danger.' }
  ],
  sources: [{ t: 'Stanford Encyclopedia of Philosophy : Aristotle’s Rhetoric', u: 'https://plato.stanford.edu/entries/aristotle-rhetoric/' }] },

{ id: 'c2', m: 'p1', n: 2, titre: 'Ethos, Pathos, Logos, Kairos', min: 9, src: 'livre',
  accroche: 'Aristote a résumé toute la persuasion en trois forces. Une quatrième, le kairos, décide du moment où ces forces frappent.',
  sections: [
    { h: 'Trois questions silencieuses', p: [
      'Devant n’importe quel public, trois questions silencieuses se posent dans les têtes. « Pourquoi devrais-je t’écouter, toi ? » « Pourquoi cela devrait-il me toucher, moi ? » « Pourquoi devrais-je te croire ? » À chacune répond l’un des trois piliers. Un discours qui néglige l’une de ces questions laisse une porte ouverte par laquelle le public s’échappe.' ] },
    { h: 'Ethos : qui parle ?', p: [
      'C’est ta crédibilité, l’autorité que le public te reconnaît. Elle vient de ton expérience, de ta posture, de ta sincérité perçue, parfois d’un simple regard calme balayé sur la salle avant le premier mot. L’ethos se construit aussi par l’aveu d’une faiblesse maîtrisée, par une preuve d’honnêteté, par le fait de citer ce qui dérange son propre camp. Sans ethos, les meilleurs arguments tombent à plat : on n’écoute pas vraiment quelqu’un en qui on n’a pas confiance.' ] },
    { h: 'Pathos : à qui parle-t-on ?', p: [
      'C’est l’émotion que tu déclenches : la fierté, la peur, l’espoir, l’indignation, le rire. C’est le pathos qu’on retient longtemps après avoir oublié les chiffres. Mais seul, il manipule et s’épuise vite. L’émotion doit servir un propos, l’éclairer, jamais le remplacer. On émeut pour faire comprendre, pas pour faire oublier de réfléchir.' ] },
    { h: 'Logos : de quoi parle-t-on ?', p: [
      'C’est la logique : les faits, les preuves, la structure du raisonnement, les exemples, les chiffres. Le logos donne au public de bonnes raisons de te suivre et de quoi se justifier ensuite auprès des autres. Seul, pourtant, il est juste mais froid, et l’auditoire décroche avant la conclusion. Le logos convainc la raison ; il ne suffit pas à mettre les gens en mouvement.' ] },
    { h: 'Kairos : quand parle-t-on ?', p: [
      'Le kairos est un concept grec plus large que le triangle : c’est le sens du moment opportun. Un argument parfait lancé trop tôt, avant que l’autre soit prêt à l’entendre, ou trop tard, après qu’il a déjà décidé, ne sert à rien. Le kairos, c’est sentir quand la salle est mûre pour une idée, quand un silence vaut mieux qu’une phrase, quand il faut lancer sa conclusion.' ] },
    { h: 'Pour aller plus loin : un cas pour chaque pilier', p: [
      'Ethos : Cicéron est un « homme nouveau », sans nom patricien, quand il accuse Catilina devant le Sénat. Il ne peut pas s’appuyer sur sa famille : il s’appuie sur sa fonction de consul et sur ce qu’il a fait.',
      'Logos : Badinter, en 1981, démontre en trois appuis (le mandat des urnes, l’histoire de l’abolition, un principe moral) pourquoi les députés peuvent et doivent voter.',
      'Pathos : Martin Luther King répète « I have a dream » et fait voir un avenir, pas seulement un programme.',
      'Kairos : Démosthène pousse Athènes à agir avant que Philippe II soit trop fort. Chaque Philippique parie sur l’urgence.' ,
      'Note sur la classification : selon les auteurs, le kairos est présenté comme un quatrième élément, ou comme une dimension qui traverse les trois preuves. Ton livre le place autour du triangle, comme un cercle : cette lecture est cohérente et c’est celle que l’appli adopte.' ] }
  ],
  retenir: ['ETHOS = qui parle (crédibilité). PATHOS = à qui l’on parle (émotion). LOGOS = de quoi (logique). KAIROS = quand (le moment).', 'Image-mémoire : un triangle (les trois piliers) entouré d’un cercle (le kairos, qui choisit l’instant).', 'Dosage courant : ethos pour ouvrir et s’imposer, logos au cœur pour prouver, pathos pour clore et marquer.'],
  erreur: 'Ne miser que sur le logos. Un discours tout en faits, sans crédibilité ni émotion, a raison sur le papier et perd la salle. Avoir raison n’a jamais suffi à convaincre : c’est même l’illusion la plus tenace des gens intelligents.',
  exercice: 'Prends une idée que tu veux défendre. Écris trois phrases : une d’ethos (pourquoi tu es légitime pour en parler), une de logos (ta meilleure preuve), une de pathos (une image qui touche). Mets-les bout à bout : tu tiens le squelette d’un mini-discours déjà équilibré.',
  quiz: [
    { q: 'Une anecdote qui fait ressentir une situation relève surtout du…', o: ['Logos', 'Pathos', 'Kairos'], a: 1, e: 'Le pathos, c’est l’émotion que l’on déclenche.' },
    { q: 'Un argument parfait, dit trop tôt ou trop tard, illustre…', o: ['L’ethos', 'Le logos', 'Le kairos'], a: 2, e: 'Le kairos est le sens du moment opportun.' },
    { q: 'Quelle est « l’illusion la plus tenace des gens intelligents » ?', o: ['Avoir raison suffit à convaincre', 'Parler vite est plus clair', 'Les émotions sont inutiles à convaincre'], a: 0, e: 'Avoir raison ne suffit pas : sans ethos ni pathos, on perd la salle.' }
  ],
  sources: [{ t: 'Stanford Encyclopedia of Philosophy : Aristotle’s Rhetoric', u: 'https://plato.stanford.edu/entries/aristotle-rhetoric/' }] },

{ id: 'c3', m: 'p1', n: 3, titre: 'Les cinq canons de la rhétorique', min: 8, src: 'livre',
  accroche: 'Comment fabrique-t-on un discours, de l’idée jusqu’à la scène ? Les Romains ont répondu par cinq étapes, dans un ordre précis.',
  sections: [
    { h: 'I-D-E-M-A', p: [
      'Retiens-les par leurs cinq initiales : Inventio, Dispositio, Elocutio, Memoria, Actio. Trouver, organiser, formuler, mémoriser, incarner. Ce sont toujours notre chaîne de montage : connaître l’étape où l’on se trouve évite bien des blocages.' ] },
    { h: '1. Inventio : trouver quoi dire', p: [
      'Avant les mots, les idées. On rassemble ses arguments, ses preuves, ses exemples, ses histoires, ses angles possibles. C’est l’étape qu’on saute le plus souvent, par impatience, et c’est pourquoi tant de discours sont bien dits mais creux. Un bon orateur passe beaucoup plus de temps à chercher quoi dire qu’à peaufiner comment le dire.' ] },
    { h: '2. Dispositio : organiser', p: [
      'On met de l’ordre. Quelle idée d’abord, laquelle ensuite, laquelle garder pour la fin ? Un bon plan n’est pas un luxe de scolaire : c’est ce qui permet au public de suivre sans se perdre, et à l’orateur de ne pas s’égarer.' ] },
    { h: '3. Elocutio : formuler', p: [
      'On habille les idées : le choix des mots, le rythme des phrases, les figures de style. Deux personnes peuvent avoir la même idée ; celle qui la formule avec une image forte sera écoutée et citée. L’elocutio vient après l’inventio et la dispositio : on ne cisèle pas des phrases sur un fond qui n’existe pas encore.' ] },
    { h: '4. Memoria : mémoriser', p: [
      'On s’approprie le discours pour le livrer sans le lire. On ne mémorise pas des phrases mot à mot, c’est fragile : une seule oubliée fait tout s’effondrer. On mémorise une structure et des images. La structure tient, même si les mots exacts varient.' ] },
    { h: '5. Actio : incarner', p: [
      'La scène : la voix, le corps, le regard, le silence, le souffle. C’est la seule étape que le public voit vraiment, et c’est pour cela qu’il juge d’abord là-dessus, alors que tout le travail décisif s’est fait avant, invisible. L’actio ne compense jamais un discours vide ; mais elle peut faire vivre un discours solide, ou le tuer.' ] },
    { h: 'Pour aller plus loin : un outil de diagnostic', p: [
      'Les cinq canons servent aussi à comprendre un échec. Un discours confus a raté la dispositio. Un discours plat a raté l’elocutio. Un trou de mémoire vient de la memoria. Une voix qui s’éteint est un problème d’actio. Un discours bien dit mais creux est un échec d’inventio.',
      'Après chaque enregistrement dans le Studio, pose-toi la question : à quel canon appartient mon principal défaut ? Tu sauras où travailler.' ] }
  ],
  retenir: ['I-D-E-M-A : Inventio (trouver) → Dispositio (organiser) → Elocutio (formuler) → Memoria (mémoriser) → Actio (incarner).', 'On construit dans cet ordre. Le public, lui, juge dans l’ordre inverse : d’abord l’Actio, ce qu’il voit et entend.', 'On mémorise une structure et des images, jamais des phrases mot à mot.'],
  erreur: 'Passer directement à l’Elocutio ou à l’Actio, soigner ses phrases et sa voix, sans avoir fait l’Inventio ni la Dispositio. On obtient un beau discours qui ne dit rien et ne mène nulle part. Le vernis avant le bois.',
  exercice: 'Pour ton prochain sujet, fais UNIQUEMENT l’Inventio : note en vrac, sans ordre et sans te censurer, tout ce que tu pourrais dire. Dix minutes chrono. Ne cherche ni le plan ni les belles phrases : seulement la matière. L’ordre viendra après, et il viendra plus facilement.',
  quiz: [
    { q: 'Dans quel ordre construit-on un discours ?', o: ['Actio, Memoria, Elocutio, Dispositio, Inventio', 'Inventio, Dispositio, Elocutio, Memoria, Actio', 'Elocutio, Inventio, Actio, Dispositio, Memoria'], a: 1, e: 'I-D-E-M-A : trouver, organiser, formuler, mémoriser, incarner.' },
    { q: 'Que mémorise-t-on, selon le chapitre ?', o: ['Chaque phrase mot à mot', 'Une structure et des images', 'Seulement l’introduction'], a: 1, e: 'La structure tient même si les mots exacts varient.' },
    { q: 'Quel canon le public juge-t-il en premier ?', o: ['Inventio', 'Dispositio', 'Actio'], a: 2, e: 'Il voit et entend d’abord l’actio, alors que le travail décisif est invisible.' }
  ],
  sources: [{ t: 'Silva Rhetoricae : The Five Canons', u: 'https://rhetoric.byu.edu/Canons/Canons.htm' }] },

{ id: 'c4', m: 'p1', n: 4, titre: 'Les genres oratoires', min: 7, src: 'livre',
  accroche: 'Tout discours vise l’un de trois buts, selon qu’il regarde vers l’avenir, le passé ou le présent. Savoir dans quel genre on parle évite de se tromper d’arme.',
  sections: [
    { h: 'Le délibératif : conseiller, décider', p: ['Il regarde vers l’avenir. C’est le discours de celui qui conseille une action : voter une loi, choisir une stratégie, lancer un projet, investir. Sa question centrale est « que devons-nous faire ? ». Il s’appuie sur l’utile et le possible : montrer qu’une voie est meilleure qu’une autre. Terrain naturel aujourd’hui : la réunion, le pitch, le conseil d’administration, le débat de société.'] },
    { h: 'Le judiciaire : accuser, défendre', p: ['Il regarde vers le passé. C’est le discours du tribunal : établir ce qui s’est passé, qui est responsable, ce qui est juste. Sa question est « qu’est-il arrivé, et est-ce juste ? ». On le retrouve bien au-delà des prétoires : chaque fois qu’on doit se justifier, défendre une décision passée, répondre d’un échec. C’est le genre de l’argumentation serrée et de la preuve.'] },
    { h: 'L’épidictique : célébrer, blâmer', p: ['Il regarde vers le présent. C’est le discours qui loue ou qui condamne : l’éloge funèbre, le discours de mariage, le toast, l’hommage, la remise de prix, la tribune indignée. Sa question est « qu’est-ce qui mérite d’être admiré ou rejeté ? ». Il travaille moins la preuve que l’émotion et les valeurs partagées. C’est le genre où le style, le rythme et l’image comptent le plus.'] },
    { h: 'Les hybrides d’aujourd’hui', p: ['Un pitch entrepreneurial est surtout délibératif (« misez sur ce projet »), mais s’ouvre souvent sur de l’épidictique (une vision qui fait rêver) et se défend en judiciaire (« voici nos preuves »). Un keynote ou une conférence TED combine les trois. Le slam et la poésie orale sont un épidictique moderne : ils célèbrent, dénoncent, font ressentir, sur un rythme scandé.'] },
    { h: 'Pour aller plus loin : reconnaître le genre dans les grands discours', p: [
      'Délibératif : Simone Veil (1974) et Badinter (1981) demandent à une assemblée de voter une loi. Judiciaire : la déclaration de Mandela au procès de Rivonia (1964) est prononcée dans un tribunal, mais il retourne l’accusation contre le système. Épidictique : le discours de Jobs à Stanford (2005) est une cérémonie de remise de diplômes.',
      'Un même discours change de genre selon l’endroit où l’on regarde : l’appel du 18 juin 1940 regarde l’avenir (délibératif) mais commence par juger le passé immédiat (la défaite). Le genre dominant, c’est celui de la question à laquelle le public doit répondre à la fin.' ] }
  ],
  retenir: ['Délibératif = l’avenir (que faire ?). Judiciaire = le passé (qu’est-il arrivé, est-ce juste ?). Épidictique = le présent (qu’admirer ou blâmer ?).', 'Pitch, keynote, TED, slam : des mélanges des trois. Trouve le genre dominant, tu trouves ton angle et ton ton.'],
  erreur: 'Plaider le passé quand le public attend une décision : on passe vingt minutes à chercher des coupables alors que la salle voulait savoir quoi faire. C’est se tromper de genre.',
  methode: 'Avant d’écrire quoi que ce soit, pose-toi une seule question : mon discours regarde-t-il surtout vers l’avenir, le passé ou le présent ? La réponse fixe déjà ton objectif, ton registre et le pilier à mettre en avant.',
  quiz: [
    { q: 'Un pitch pour obtenir un financement est surtout…', o: ['Judiciaire', 'Délibératif', 'Épidictique'], a: 1, e: 'Il pousse à décider de l’avenir : miser ou non.' },
    { q: 'Un éloge funèbre est…', o: ['Épidictique', 'Judiciaire', 'Délibératif'], a: 0, e: 'Il célèbre : il regarde le présent et les valeurs partagées.' },
    { q: 'Quelle question guide le genre judiciaire ?', o: ['Que devons-nous faire ?', 'Qu’est-il arrivé, et est-ce juste ?', 'Qu’est-ce qui mérite d’être admiré ?'], a: 1, e: 'Le judiciaire regarde le passé et le juste.' }
  ],
  sources: [{ t: 'Silva Rhetoricae : Genres of rhetoric', u: 'https://rhetoric.byu.edu/Pedagogy/Pedagogy.htm' }] },

{ id: 'c5', m: 'p2', n: 5, titre: 'Le plan classique en cinq temps', min: 9, src: 'livre',
  accroche: 'Les Anciens avaient compris comment l’attention d’un public monte, retombe et remonte. Leur plan épouse cette courbe.',
  sections: [
    { h: '1. L’exorde : capter', p: ['Les premières secondes. On ne cherche pas à informer mais à ouvrir l’attention : une anecdote, une question, un chiffre qui surprend, un silence tenu. On ne commence jamais par « Bonjour, aujourd’hui je vais vous parler de… » : c’est la formule qui éteint une salle en une phrase. L’exorde a aussi une seconde fonction, plus discrète : y poser son ethos, montrer d’un mot ou d’une posture pourquoi on est légitime.'] },
    { h: '2. La narration : planter le décor', p: ['On pose le contexte, les faits, la situation. Le public doit comprendre où il est avant qu’on lui demande de réfléchir ou de trancher. Une narration claire évite la moitié des malentendus : beaucoup de désaccords ne sont que des gens qui n’ont pas la même image de la situation de départ.'] },
    { h: '3. La confirmation : prouver', p: ['Le cœur du discours. On avance ses arguments, ses preuves, ses exemples : c’est la partie logos. Règle d’or : deux ou trois arguments solides et développés valent mieux que huit survolés. Mieux vaut renoncer à un argument moyen que diluer les bons.'] },
    { h: '4. La réfutation : désarmer l’objection', p: ['On anticipe ce que le public pense tout bas. En nommant l’objection avant qu’elle soit posée (« On me dira que… ») puis en y répondant, on désamorce la résistance et on gagne en crédibilité : on montre qu’on a vu le problème. C’est une étape que les débutants oublient presque toujours, et que les grands orateurs ne manquent jamais.'] },
    { h: '5. La péroraison : frapper fort', p: ['La fin. On resserre l’essentiel en une phrase, on laisse une image forte, on lance un appel à l’action. C’est le pic émotionnel du discours, et c’est ce que le public gardera en partant. La péroraison se prépare et s’apprend par cœur, mot pour mot : c’est le seul passage où l’on peut se le permettre, et celui où l’on doit le faire.'] },
    { h: 'Pour aller plus loin : le plan dans la vie réelle', p: [
      'Le discours de Badinter pour l’abolition suit cette logique : il situe la question (narration : l’histoire abolitionniste depuis 1791), prouve (légitimité du mandat, principe moral) et répond aux objections (réfutation : le retard français, la crainte de l’opinion).',
      'Pourquoi ce plan survit-il ? Parce qu’il répond à des besoins d’auditeur : être captivé, comprendre, être convaincu, être rassuré sur les risques, savoir quoi faire. Un plan qui ignore l’un de ces besoins laisse une question sans réponse.',
      'Adapte la durée : en 2 minutes, l’exorde et la narration tiennent en deux phrases chacun. Le plan est un squelette, pas un moule.' ] }
  ],
  retenir: ['Exorde (capter) → Narration (situer) → Confirmation (prouver) → Réfutation (désarmer) → Péroraison (frapper).', 'La courbe d’attention retombe au milieu et doit remonter à la fin : garde ton coup le plus fort pour la péroraison.', 'Deux ou trois arguments plantés valent mieux que huit survolés.'],
  erreur: 'Mettre son meilleur argument au début et finir en pente douce, à bout de souffle. Le public retient surtout la fin : une conclusion faible efface un bon discours. On ne s’excuse pas d’avoir été long, on ne dit pas « voilà, c’est tout » : on atterrit sur sa phrase la plus forte.',
  exercice: 'Prends un discours court que tu admires (deux ou trois minutes suffisent). Découpe-le au stylo en cinq blocs et nomme chacun. Tu verras presque toujours apparaître ces cinq temps, même chez des orateurs qui n’y ont jamais pensé consciemment. La structure est là, sous le naturel.',
  quiz: [
    { q: 'Quelle étape désamorce les objections avant qu’elles soient posées ?', o: ['La narration', 'La réfutation', 'L’exorde'], a: 1, e: 'Nommer l’objection puis y répondre montre qu’on a vu le problème.' },
    { q: 'Combien d’arguments développer, au mieux ?', o: ['Deux ou trois', 'Huit', 'Autant que possible'], a: 0, e: 'Deux ou trois arguments plantés valent mieux que huit survolés.' },
    { q: 'Quelle partie s’apprend par cœur, mot pour mot ?', o: ['Toute la confirmation', 'La péroraison', 'La narration'], a: 1, e: 'La fin ne s’improvise jamais.' }
  ],
  sources: [{ t: 'Silva Rhetoricae : Arrangement', u: 'https://rhetoric.byu.edu/Canons/Arrangement/Arrangement.htm' }] },

{ id: 'c6', m: 'p2', n: 6, titre: 'Cinq autres structures efficaces', min: 8, src: 'livre',
  accroche: 'Le plan classique n’est pas le seul. La bonne structure est celle qui sert ton but, pas celle qui impressionne.',
  sections: [
    { h: 'Problème → Solution', p: ['On expose un problème que le public ressent, on le fait bien sentir, puis on apporte la solution. Imparable pour convaincre, vendre, proposer un changement. Toute sa force vient de l’ordre : on ne propose la solution qu’une fois que le public a éprouvé la douleur du problème. Inverser l’ordre et personne n’écoute, car personne n’a encore compris pourquoi il en aurait besoin.'] },
    { h: 'Passé → Présent → Futur', p: ['« Voilà d’où nous venons, voilà où nous sommes, voilà où nous allons. » Cette structure raconte une trajectoire. Elle rassure, donne un cap et un sens : parfaite pour un discours de vision, un bilan, un lancement, un vœu. Elle transforme une série d’événements en récit, et un récit se suit mieux qu’une analyse.'] },
    { h: 'Thèse → Antithèse → Synthèse', p: ['On pose une idée, on lui oppose franchement son contraire, puis on dépasse les deux par une troisième voie. C’est la structure du débat et de la pensée nuancée. Elle montre qu’on a pensé contre soi-même, ce qui inspire une confiance immédiate.'] },
    { h: 'Question → Réponse', p: ['On ouvre sur une vraie question, sincère, et tout le discours devient une enquête pour y répondre. Le public avance avec nous, tenu par la curiosité, parce qu’une question ouverte crée une tension que l’esprit veut résoudre. Très efficace pour un exposé, une conférence, une vidéo.'] },
    { h: 'La règle de trois', p: ['Trois points, ni plus ni moins. L’esprit humain retient les triades : « Liberté, Égalité, Fraternité » ; « Veni, vidi, vici ». Trois idées claires marquent plus que sept idées floues. Quand tu hésites sur le nombre de parties, choisis trois.'] },
    { h: 'Pour aller plus loin : choisir selon le but', p: [
      'Convaincre de changer : Problème → Solution. Donner un cap : Passé → Présent → Futur. Faire réfléchir un public partagé : Thèse → Antithèse → Synthèse. Éveiller la curiosité : Question → Réponse. Faciliter la mémoire : règle de trois.',
      'Cas réel : Steve Jobs à Stanford annonce « trois histoires » : règle de trois, annoncée dès l’ouverture. Le public sait où il va et quand cela finit.',
      'Objection : trois, est-ce un dogme ? Non. C’est un réflexe de mémoire. Si ton sujet exige quatre points, regroupe-les en deux paires ou annonce clairement « quatre points ». Ce qui compte, c’est que le public sache combien il en reste.' ] }
  ],
  retenir: ['Cinq plans de secours : Problème→Solution · Passé→Présent→Futur · Thèse→Antithèse→Synthèse · Question→Réponse · la Règle de trois.', 'Le chiffre trois est ton allié : trois parties, trois arguments, trois mots.'],
  methode: 'Bloqué sur ton plan ? Essaie « Problème → Solution ». Il fonctionne pour la grande majorité des prises de parole professionnelles, il tient en deux mouvements, et personne ne s’y perd.',
  exercice: 'Prends une même idée et construis-la deux fois : en Problème → Solution, puis en Passé → Présent → Futur. Dis chaque version en 1 minute dans le Studio et compare ce que chacune fait ressentir.',
  quiz: [
    { q: 'Pourquoi l’ordre problème → solution est-il crucial ?', o: ['Il est plus court', 'Le public doit d’abord ressentir le problème', 'Il évite les chiffres'], a: 1, e: 'Sans avoir éprouvé le problème, personne n’écoute la solution.' },
    { q: 'Quelle structure raconte une trajectoire ?', o: ['Thèse → Antithèse → Synthèse', 'Passé → Présent → Futur', 'Question → Réponse'], a: 1, e: 'D’où nous venons, où nous sommes, où nous allons.' }
  ],
  sources: [{ t: 'Wikipedia : Rule of three (writing)', u: 'https://en.wikipedia.org/wiki/Rule_of_three_(writing)' }] },

{ id: 'c7', m: 'p2', n: 7, titre: 'Les méthodes rapides de création', min: 7, src: 'livre',
  accroche: 'Quand le temps manque, quelques méthodes éprouvées permettent de bâtir un message clair en quelques minutes.',
  sections: [
    { h: 'SCQA : poser un problème avec finesse', p: ['Née dans le conseil en stratégie (la « pyramide » de Barbara Minto), la méthode enchaîne quatre temps : Situation (le contexte que tout le monde partage), Complication (ce qui vient bousculer ce contexte), Question (celle que la complication fait naître), Answer (ta réponse, qui devient le cœur du propos). Parfaite pour ouvrir une présentation professionnelle : on part d’un terrain connu et rassurant, on crée la tension, puis on livre la solution comme une évidence attendue.'] },
    { h: 'AIDA : pousser à l’action', p: ['Venue de la publicité et de la vente : Attention (on capte), Intérêt (on accroche par ce qui concerne le public), Désir (on fait vouloir), Action (on demande un pas concret). Idéale pour un discours persuasif, un appel aux dons, un pitch qui doit finir par un « oui ». Sa clé : ne jamais oublier le dernier A. Beaucoup de bons discours meurent faute d’appel à l’action clair.'] },
    { h: 'Problème → Impacts → Solution → Preuves', p: ['Pour un discours de décision, cette matrice force la rigueur. On nomme le problème ; on en chiffre les conséquences, ce qui crée l’urgence ; on propose la solution ; on l’appuie de preuves concrètes. C’est le format qui emporte une décision en réunion, parce qu’il répond dans l’ordre aux questions du décideur : est-ce grave ? combien coûte l’inaction ? que proposes-tu ? qu’est-ce qui me le prouve ?'] },
    { h: 'Une mise en garde honnête', p: ['On croise parfois une « méthode CREA » (Contexte, Résultat, Émotion, Appel). Après vérification, aucune source sérieuse ne l’établit comme une méthode reconnue de rhétorique. Sa logique reste utilisable, mais ne la présente pas comme un standard : ce n’en est pas un. Ce livre préfère te le dire plutôt que de te faire réciter une méthode qui n’existe pas vraiment.'] },
    { h: 'Pour aller plus loin : une autre formule éprouvée', p: [
      'Dale Carnegie, dans « Comment parler en public », enseigne pour les interventions courtes une formule en trois temps : un événement vécu (une histoire précise), l’action demandée (brève, concrète, facile à faire), le bienfait (un seul, relié à l’histoire). Il recommande de consacrer environ les trois quarts du temps à l’événement.',
      'Exemple d’action mal et bien formulée selon lui : « Aidez les enfants de notre orphelinat » est trop vague ; « Inscrivez-vous ce soir et nous emmènerons vingt-cinq enfants en pique-nique » est précis. Le public ne fait que ce qu’il a bien compris.',
      'Choisir : SCQA pour faire réfléchir, AIDA pour déclencher, Problème-Impacts-Solution-Preuves pour décider, Événement-Action-Bienfait pour mobiliser en deux minutes.' ] }
  ],
  retenir: ['SCQA : pour poser un problème avec élégance.', 'AIDA : pour finir sur un appel à l’action.', 'Problème → Impacts → Solution → Preuves : pour emporter une décision en réunion.', 'Événement → Action → Bienfait (Carnegie) : pour mobiliser en peu de temps.'],
  exercice: 'Prends une idée à défendre au travail ou en cours. Écris-la deux fois : une version en SCQA, une version en AIDA. Compare-les à voix haute. Tu sentiras immédiatement laquelle colle à ton objectif réel : poser un problème pour faire réfléchir, ou déclencher une action.',
  quiz: [
    { q: 'Que signifie le « C » de SCQA ?', o: ['Conclusion', 'Complication', 'Contexte'], a: 1, e: 'Situation, Complication, Question, Answer.' },
    { q: 'Quel est le dernier temps d’AIDA, à ne jamais oublier ?', o: ['Attention', 'Action', 'Argument'], a: 1, e: 'Sans appel à l’action, beaucoup de bons discours meurent.' },
    { q: 'La « méthode CREA » est…', o: ['Un standard de rhétorique', 'Non établie par des sources sérieuses', 'Inventée par Aristote'], a: 1, e: 'Elle reste utilisable, mais n’est pas une méthode reconnue.' }
  ],
  sources: [{ t: 'Dale Carnegie, Comment parler en public (éd. fournie)', u: '' }] },

{ id: 'c8', m: 'p2', n: 8, titre: 'L’introduction parfaite', min: 8, src: 'livre',
  accroche: 'Un public décide dans les toutes premières secondes s’il va t’écouter vraiment ou faire poliment semblant.',
  sections: [
    { h: 'La règle des dix secondes', p: ['Avant même ton premier mot, quatre choses parlent déjà pour toi. La voix : pose-la, ne la lance pas essoufflée. Un silence, une respiration lente, puis la première phrase. Le regard : déjà sur la salle avant de parler, balayé lentement, jamais rivé sur tes notes ni sur le sol. La posture : pieds ancrés, corps immobile, mains calmes. La promesse : dis vite au public ce qu’il va gagner à t’écouter.'] },
    { h: 'Les sept accroches qui marchent toujours', p: ['L’anecdote, qui plante une scène et un visage ; le chiffre inattendu, qui surprend et intrigue ; la question provocante, qui implique tout de suite ; le silence tenu trois secondes, qui capte par contraste avec le brouhaha ; le geste visuel, qui fait lever les yeux ; l’image concrète, qui fait voir avant de faire comprendre ; la citation détournée, qui fait sourire par le décalage. Une seule suffit. La choisir consciemment, c’est déjà avoir gagné la moitié de l’attention.'] },
    { h: 'Le micro-engagement', p: ['Dans les trente premières secondes, demande au public une toute petite action : lever la main, répondre à voix haute par oui ou non, fermer les yeux et imaginer une scène. L’implication physique précède l’implication mentale : un public qui a bougé, même à peine, cesse d’être spectateur et devient participant.'] },
    { h: 'Pour aller plus loin : ce qu’il faut éviter', p: [
      'Carnegie déconseille de commencer par une excuse (« je n’ai pas eu le temps de me préparer ») ou par l’histoire drôle plaquée : le public ne s’intéresse pas aux justifications, il veut entrer dans le vif du sujet. Il recommande au contraire de démarrer par un événement, d’éveiller la curiosité, d’énoncer un fait frappant, ou d’utiliser un objet.',
      'Cas réel : Cicéron ouvre la première Catilinaire en interpellant Catilina devant le Sénat : une apostrophe, une accroche par la confrontation directe. À l’inverse, Jobs ouvre à Stanford par l’autodérision (« je n’ai jamais fini mes études ») : l’accroche construit la confiance.',
      'Les deux fonctionnent parce qu’elles font la même chose : elles répondent dès les premières secondes à la question « pourquoi écouter cette personne ? ».' ] }
  ],
  retenir: ['Checklist des 10 secondes : Voix posée · Regard sur la salle · Posture ancrée · Promesse claire.', 'Sept accroches : anecdote, chiffre, question, silence, geste, image, citation détournée. Une seule suffit.', 'Un micro-engagement dans les 30 premières secondes transforme le spectateur en participant.'],
  erreur: 'Commencer par se présenter et remercier : « Bonjour, je m’appelle…, je suis très heureux d’être là, merci de m’accueillir… ». On brûle ses meilleures secondes en formalités que personne n’écoute. La présentation peut très bien venir après l’accroche.',
  exercice: 'Prends un sujet et écris-lui CINQ accroches différentes, une par type. Lis-les à voix haute, garde la meilleure. Répété régulièrement, c’est l’exercice le plus rentable de tout ce livre : il muscle ton entrée en scène, le moment où tout se gagne ou se perd.',
  quiz: [
    { q: 'Que faire dans les 30 premières secondes pour impliquer le public ?', o: ['Se présenter longuement', 'Un micro-engagement', 'Lire ses notes'], a: 1, e: 'Lever la main, répondre oui/non : l’implication physique précède l’implication mentale.' },
    { q: 'Combien d’accroches faut-il utiliser ?', o: ['Les sept', 'Une seule suffit', 'Au moins trois'], a: 1, e: 'Une seule, choisie consciemment.' }
  ],
  sources: [{ t: 'Dale Carnegie, Comment parler en public (éd. fournie)', u: '' }] },

{ id: 'c9', m: 'p2', n: 9, titre: 'La conclusion inoubliable', min: 7, src: 'livre',
  accroche: 'Le public se souvient surtout de deux moments : le début et la fin. Une fin faible efface presque tout ce qui précède.',
  sections: [
    { h: 'Ce qu’une conclusion doit faire', p: ['Une bonne conclusion ne résume pas platement le discours, ce serait le réciter une seconde fois. Elle resserre l’essentiel en une seule phrase mémorable, laisse une image forte qui reste après la salle vidée, et, si le discours vise l’action, lance un appel clair et concret : quoi faire, dès demain. Ni « voilà, j’ai terminé, merci de votre attention », ni un récapitulatif fatigué : une chute préparée, tenue, assumée.'] },
    { h: 'La boucle', p: ['La technique la plus puissante consiste à revenir à l’image ou à la phrase de l’ouverture. Le public ressent alors une impression de boucle bouclée, de trajet accompli, de porte refermée. C’est extrêmement satisfaisant pour l’esprit et cela donne au discours une unité que rien d’autre ne donne.'] },
    { h: 'Le dernier silence', p: ['Après le dernier mot, ne t’excuse pas, ne t’agite pas, ne recule pas vers ta chaise en marmonnant. Laisse le silence porter la phrase, deux ou trois secondes. Ce silence final fait partie de la conclusion : il dit au public que ce que tu viens de dire méritait d’être laissé résonner.'] },
    { h: 'Pour aller plus loin : trois fins célèbres', p: [
      'Mandela, 1964 : il termine sa déclaration en proclamant un idéal « pour lequel je suis prêt à mourir », en ajoutant « si nécessaire ». La fin engage sa personne, et la nuance rend la phrase plus crédible.',
      'Churchill, 1940 : la péroraison enchaîne les « nous nous battrons » jusqu’à « nous ne nous rendrons jamais » : une anaphore qui monte jusqu’à une phrase courte et définitive.',
      'De Gaulle, 18 juin : il termine en affirmant que la flamme de la résistance ne doit pas s’éteindre : une image, pas un résumé.',
      'Point commun : aucun ne résume. Tous finissent sur un engagement, une montée, ou une image.' ] }
  ],
  retenir: ['Une conclusion = une phrase qui resserre + une image forte + (si besoin) un appel à l’action clair.', 'La boucle, revenir à l’image de l’ouverture, est l’effet le plus puissant et le plus élégant.', 'Apprends ta conclusion par cœur, tiens le silence final. La fin ne s’improvise jamais.'],
  methode: 'Écris ta toute dernière phrase AVANT d’écrire le reste du discours. Si tu sais précisément où tu vas atterrir, tout le discours s’oriente vers ce point d’arrivée, et tu ne te perds plus en route.',
  exercice: 'Écris trois conclusions pour le même discours : une avec boucle, une avec appel à l’action, une avec image. Dis-les dans le Studio et regarde laquelle ne s’éteint pas (l’analyse signale les fins qui retombent).',
  quiz: [
    { q: 'La technique la plus puissante de conclusion est…', o: ['Résumer point par point', 'La boucle', 'S’excuser d’avoir été long'], a: 1, e: 'Revenir à l’image de l’ouverture ferme le trajet.' },
    { q: 'Que faire après le dernier mot ?', o: ['Dire « voilà, c’est tout »', 'Tenir un silence de deux ou trois secondes', 'Reculer vers sa chaise'], a: 1, e: 'Le silence final fait partie de la conclusion.' }
  ],
  sources: [{ t: 'Wikipedia : I Am Prepared to Die', u: 'https://en.wikipedia.org/wiki/I_Am_Prepared_to_Die' }, { t: 'Wikipedia : We shall fight on the beaches', u: 'https://en.wikipedia.org/wiki/We_shall_fight_on_the_beaches' }] },

{ id: 'c10', m: 'p2', n: 10, titre: 'Les transitions fluides', min: 6, src: 'livre',
  accroche: 'Un discours, ce n’est pas des idées posées côte à côte : c’est un fil continu. Les transitions sont les nœuds invisibles qui relient les idées.',
  sections: [
    { h: 'Annoncer et rappeler', p: ['Deux gestes suffisent à guider le public. Annoncer ce qui vient : « Maintenant que nous avons vu le problème, regardons la solution. » Et rappeler ce qui précède : « Nous venons de voir que… ; il reste une question. » Ces phrases-panneaux disent en permanence à l’auditoire où il en est du trajet. Elles paraissent presque trop simples pour être utiles ; pourtant, ce sont elles qui donnent l’impression qu’un discours « se tient ».'] },
    { h: 'Les connecteurs invisibles', p: ['Entre deux idées, un petit mot de liaison suffit souvent à tenir la logique debout : « d’ailleurs », « pourtant », « c’est pourquoi », « à l’inverse », « or ». Ils sont presque invisibles à l’oreille, mais ce sont eux qui transforment une suite de phrases en raisonnement. Un discours sans connecteurs juxtapose ; avec eux, il démontre. Choisis-les avec soin : « pourtant » n’annonce pas la même chose que « c’est pourquoi ».'] },
    { h: 'La transition par le corps', p: ['Sur scène, on peut marquer une transition sans un seul mot : un pas de côté, un déplacement lent vers un autre point de la salle, une pause plus longue. Le corps signale « on change d’idée » aussi clairement qu’une phrase, parfois mieux.'] },
    { h: 'Pour aller plus loin : les connecteurs et l’analyse de l’appli', p: [
      'Dans les résultats du Studio, l’appli compte tes connecteurs logiques pour 100 mots. C’est un indice de logos : un faible nombre signale souvent un discours qui juxtapose.',
      'Famille de connecteurs : addition (de plus, d’ailleurs), opposition (pourtant, en revanche), cause (parce que, car), conséquence (c’est pourquoi, donc), temps (d’abord, ensuite, enfin), conclusion (en somme).',
      'Carnegie conseille aussi d’énumérer ses idées au fur et à mesure (« premièrement… deuxièmement… ») dans un exposé pour informer : le public sait où il est et combien il en reste.' ] }
  ],
  retenir: ['Deux gestes suffisent : annoncer ce qui vient, rappeler ce qui précède. Ce sont les panneaux du trajet.', 'Les petits connecteurs (pourtant, or, c’est pourquoi, à l’inverse) transforment une suite de phrases en raisonnement.', 'Sur scène, un déplacement ou un silence peut faire la transition à la place des mots.'],
  erreur: 'Enchaîner les idées sans aucune transition, en comptant sur le public pour deviner le lien. C’est la cause numéro un du sentiment « c’était intéressant mais je me suis perdu ». Le lien qui te paraît évident, à toi qui as préparé, ne l’est jamais pour qui découvre.',
  exercice: 'Reprends un de tes enregistrements et écris à la main la transition entre chaque partie. Redis-le en prononçant ces transitions : le discours doit se tenir sans que tu aies besoin d’expliquer.',
  quiz: [
    { q: 'Quelle est la cause numéro un du « je me suis perdu » ?', o: ['Trop de chiffres', 'L’absence de transitions', 'Une voix trop grave'], a: 1, e: 'Sans transitions, le public doit deviner le lien.' },
    { q: 'Que transforment les connecteurs ?', o: ['Une suite de phrases en raisonnement', 'Un discours long en court', 'Une histoire en chiffre'], a: 0, e: 'Sans connecteurs, on juxtapose ; avec, on démontre.' }
  ],
  sources: [] }

);
