/* Module « Trouver son style à l’oral » : carnet de mots, jeux de mots, virelangues, exercices, discours modèle. Veille sur des formateurs et auteurs contemporains, reformulée : aucune phrase d’orateur n’est reprise. Rédigé par l'appli. */
(function () {
  var D = window.AO_DATA;
  if (!D || !D.modules || !D.lessons) return;
  D.modules.push({"id": "st", "tome": "Atelier Agora · Style", "titre": "Trouver son style à l’oral", "sous": "Carnet de mots, jeux de mots, virelangues, exercices et un discours modèle : le style se travaille"});
  D.lessons.push.apply(D.lessons, [
 {
  "id": "st1",
  "m": "st",
  "n": "S1",
  "titre": "Le carnet de mots",
  "min": 6,
  "src": "app",
  "accroche": "Un orateur ne trouve pas ses meilleures phrases sur scène : il les attrape ailleurs et les range. Le carnet de mots sert à ça.",
  "sections": [
   {
    "h": "Un outil, trois colonnes",
    "p": [
     "Phrases utiles : ouvertures, transitions, chutes, phrases de prix qui sonnent juste à ta voix. Exemple : « Avant de commencer, une confidence. »",
     "Mots à jouer : homophones, mots à double sens, proverbes à retourner, expressions détournées. Exemple : « sens / sans », « prendre la parole / la perdre ».",
     "Lieux et publics : un mot, un lieu, une anecdote liés à un public précis (ville du jour, nom de la salle, événement)."
    ]
   },
   {
    "h": "Règles de tenue",
    "p": [
     "Une note = une ligne. Si elle dépasse deux lignes, coupe-la.",
     "Note toujours la date et le contexte : où l’idée est venue.",
     "Relis le carnet chaque semaine, garde trois entrées, supprime le reste.",
     "Chaque entrée gardée doit être dite à voix haute au moins une fois avant la semaine suivante."
    ]
   },
   {
    "h": "D’où vient l’idée",
    "p": [
     "La banque de phrases et l’auto-feedback viennent de l’observation d’un formateur en vente ; la méthode d’écriture et le goût des mots, de celle d’un auteur contemporain. Tout est réécrit avec les mots de l’appli : on enseigne le mécanisme, jamais la phrase d’un orateur à recopier."
    ]
   }
  ],
  "retenir": [
   "Une note = une ligne, avec date et contexte.",
   "Trois entrées gardées par semaine, le reste est supprimé.",
   "Une entrée n’existe que si tu l’as dite à voix haute."
  ],
  "exercice": "Pendant sept jours, note chaque soir cinq lignes dans ton téléphone : une phrase utile, deux mots à jouer, un lieu, un public. Dimanche, garde trois lignes et dis-les à voix haute à quelqu’un ou enregistre-les. Réussi = 35 lignes notées, 3 gardées, chacune dite au moins une fois.",
  "quiz": [
   {
    "q": "Combien d’entrées gardes-tu chaque semaine ?",
    "o": [
     "Trois",
     "Toutes",
     "Une seule"
    ],
    "a": 0,
    "e": "Trois : le tri est la méthode."
   },
   {
    "q": "Que note-t-on avec chaque entrée ?",
    "o": [
     "Seulement le mot",
     "La date et le contexte",
     "Le nom de l’orateur copié"
    ],
    "a": 1,
    "e": "La date et le contexte permettent de retrouver l’idée et son usage."
   }
  ]
 },
 {
  "id": "st2",
  "m": "st",
  "n": "S2",
  "titre": "Dix techniques de jeux de mots",
  "min": 10,
  "src": "app",
  "accroche": "Un jeu de mots n’est pas un talent, c’est un mécanisme. Voici dix mécanismes, avec un exemple écrit pour l’appli et le piège à éviter.",
  "sections": [
   {
    "h": "Homophonie",
    "p": [
     "Deux mots qui sonnent pareil. Exemple : « Le maire promet la mer : ses promesses sont des vagues. » Piège : ne marche qu’à l’oral, vérifie à voix haute."
    ]
   },
   {
    "h": "Paronomase",
    "p": [
     "Deux mots presque identiques. Exemple : « En pleine conjoncture, tout le monde fait des conjectures. » Piège : confondre le sens des deux mots."
    ]
   },
   {
    "h": "Double sens",
    "p": [
     "Un mot, deux sens. Exemple : « Dans cette équipe, on compte sur toi, mais on ne compte pas ses heures. » Piège : choisir un sens qui ne sert pas le propos."
    ]
   },
   {
    "h": "Proverbe retourné",
    "p": [
     "On garde la forme, on change la fin. Exemple : « Qui se ressemble s’assemble » devient « Qui se ressemble s’ennuie ensemble. » Piège : un proverbe trop connu fait attendre la chute."
    ]
   },
   {
    "h": "Chiasme",
    "p": [
     "Deux groupes de mots inversés. Exemple : « Ce n’est pas la fin des mots, c’est le mot de la fin. » Piège : en faire une formule creuse."
    ]
   },
   {
    "h": "Zeugme",
    "p": [
     "Un verbe sert deux compléments de nature différente. Exemple : « Il a pris son café, son courage et la parole. » Conseil : mets le plus surprenant en dernier."
    ]
   },
   {
    "h": "Mot-valise",
    "p": [
     "Deux mots fusionnés. Existant : « franglais ». À inventer : une « réu-nuit » pour une réunion sans fin. Piège : inventer un mot que personne ne comprend."
    ]
   },
   {
    "h": "Jeu avec un lieu",
    "p": [
     "Un nom de lieu qui sonne comme un autre mot. Exemple : « Une ex à Aix » : à l’oral, les deux se confondent. Piège : ne marche que si c’est vrai ou clairement joué. Cet exemple est une proposition de l’appli, pas une technique relevée chez un orateur."
    ]
   },
   {
    "h": "Détournement de citation",
    "p": [
     "On garde une citation connue et on change un mot. Exemple : « Je parle, donc je suis écouté. » Piège : citer faux sans que le public le sache."
    ]
   },
   {
    "h": "Anaphore « peut-être que… »",
    "p": [
     "Une liste de possibilités, puis un retournement. Exemple : trois « peut-être que tu as peur », puis « ou peut-être que c’est le signe que ça compte ». Piège : une liste trop longue fait décrocher le public."
    ]
   },
   {
    "h": "Dosage et test",
    "p": [
     "Un jeu de mots toutes les deux minutes environ suffit. Test de validation : dis-le à quelqu’un sans l’expliquer. S’il faut l’expliquer, il n’est pas prêt."
    ]
   }
  ],
  "retenir": [
   "Un jeu de mots est un mécanisme qu’on apprend.",
   "Environ un jeu de mots toutes les deux minutes.",
   "S’il faut l’expliquer, il n’est pas prêt."
  ],
  "exercice": "Choisis trois techniques parmi les dix. Pour chacune, écris une phrase sur un sujet que tu connais, puis dis-la à une personne sans l’expliquer. Réussi = au moins une des trois comprend le jeu de mots seule ; réécris celles qu’elle n’a pas comprises.",
  "quiz": [
   {
    "q": "Que fait un proverbe retourné ?",
    "o": [
     "Il garde la forme et change la fin",
     "Il remplace tout le proverbe",
     "Il explique le proverbe"
    ],
    "a": 0,
    "e": "La forme reste reconnaissable, la fin surprend."
   },
   {
    "q": "Quel est le test de validation d’un jeu de mots ?",
    "o": [
     "Le dire sans l’expliquer",
     "Le chercher sur internet",
     "Le chanter"
    ],
    "a": 0,
    "e": "S’il faut l’expliquer, il n’est pas prêt."
   },
   {
    "q": "Combien de jeux de mots dans un discours ?",
    "o": [
     "Un toutes les deux minutes environ",
     "Un par phrase",
     "Aucun"
    ],
    "a": 0,
    "e": "Trop de jeux de mots affaiblissent le propos."
   }
  ]
 },
 {
  "id": "st3",
  "m": "st",
  "n": "S3",
  "titre": "Virelangues : échauffer sa bouche",
  "min": 9,
  "src": "app",
  "accroche": "Avant de jouer avec les mots, il faut que la bouche suive. Quarante-six virelangues, en quatre niveaux, pour travailler un son à la fois.",
  "sections": [
   {
    "h": "Protocole d’entraînement (5 minutes)",
    "p": [
     "Lis lentement en exagérant chaque syllabe.",
     "Répète trois fois sans erreur à vitesse normale.",
     "Accélère d’un cran, sans sacrifier la clarté.",
     "Finis par une lecture expressive : une fois joyeuse, une fois sérieuse.",
     "Note dans le carnet de mots le virelangue le plus raté pour le reprendre le lendemain."
    ]
   },
   {
    "h": "Niveau 1",
    "p": [
     "Cinq chiens chassent six chats.  (traditionnel, son : ch / s)",
     "Ton thé t’a-t-il ôté ta toux ?  (traditionnel, son : t)",
     "Pauline plie ses pulls puis peint.  (original, son : p / pl)",
     "Le roi rit, la reine râle.  (original, son : r)",
     "Papa prépare patiemment des pâtes pour Paul.  (original, son : p / b)",
     "Nina n’amène ni mari ni mot.  (original, son : m / n)"
    ]
   },
   {
    "h": "Niveau 2",
    "p": [
     "Un chasseur sachant chasser doit savoir chasser sans son chien.  (traditionnel, son : ch / s)",
     "Didon dîna, dit-on, du dos d’un dodu dindon.  (traditionnel, son : d)",
     "Les poules du couvent couvent.  (traditionnel, son : c / v)",
     "Le brave Bruno brise brièvement le brouhaha.  (original, son : b / br)",
     "Un chef chic cherche chaque jour ses chaussures chez Jules.  (original, son : ch / j)",
     "Jeanne jongle joyeusement, jamais jalouse du jongleur.  (original, son : ch / j)",
     "Zoé s’amuse, Rose s’excuse, Rosa refuse.  (original, son : s / z)",
     "Ce sont six saucissons secs.  (traditionnel, son : s)",
     "Le roi rit, la reine rage, le rat rend le riz rare.  (original, son : r)",
     "Léa lit lentement la lettre que Lou lui a laissée.  (original, son : l)",
     "La belle boule bien bleue brille.  (traditionnel, son : l / b)",
     "Bébé boit beaucoup de bon bouillon bien bouillant.  (original, son : p / b)",
     "Panier, piano, panier, piano.  (traditionnel, son : p / n)",
     "Tom tape tout doucement ton dos de tambour.  (original, son : t / d)",
     "Quand Coco croque cinq carottes, Gaston garde ses gâteaux.  (original, son : k / g)",
     "Vincent va voir Fanny, fatigué mais vif.  (original, son : f / v)",
     "Fruits frais, fruits cuits, fruits frits.  (traditionnel, son : f)",
     "Tu as vu la rue où roule la roue ?  (original, son : ou / u)",
     "Une parole posée pèse plus qu’une phrase pressée.  (original, son : Thème parole)",
     "Le silence sert, le souffle soutient, la voix suit.  (original, son : Thème parole)"
    ]
   },
   {
    "h": "Niveau 3",
    "p": [
     "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès.  (traditionnel, son : s / c)",
     "Les chaussettes de l’archiduchesse sont-elles sèches, archi-sèches ?  (traditionnel, son : ch / s)",
     "Sept sages sceptiques scandent six sentences sensées.  (original, son : s / sc)",
     "Un orateur au ton sûr tourne trois tours de tribune.  (original, son : t / tr / r)",
     "Natacha n’attacha pas son chat Pacha qui s’échappa.  (traditionnel, son : ch / t)",
     "Ces cinq sages sont sûrs : seule la sagesse sauve.  (original, son : s / z)",
     "Rose rarement rougit, rien ne la retient.  (original, son : r)",
     "Le ver vert va vers le verre vert.  (traditionnel, son : r / v)",
     "Dix dindons dodus dînent dans un dôme doré.  (original, son : t / d)",
     "Trois tortues trottaient sur un trottoir très étroit.  (traditionnel, son : t / r)",
     "Gaëlle gagne gaiement ses gros gants gris.  (original, son : k / g)",
     "Gros gras grand grain d’orge.  (traditionnel, son : g / r)",
     "Je veux et j’exige d’exquises excuses.  (traditionnel, son : ks)",
     "Lou lit, Louis lit, lui lit aussi.  (original, son : ou / u / i)",
     "Parler pour persuader, persuader pour plaire.  (original, son : Thème parole)",
     "Sa voix vive vibre, sa voix vraie convainc.  (original, son : Thème parole)"
    ]
   },
   {
    "h": "Niveau 4",
    "p": [
     "Paul prend la parole, la parole prend Paul, et personne n’ose rompre la pause.  (original, son : p / r)",
     "Treize tristes trompettes trompent trois très traîtres tritons.  (original, son : t / tr)",
     "Prendre la parole sans perdre le fil, perdre le fil sans perdre la face.  (original, son : Thème parole)",
     "Pas de pause pour Paul, pourtant la pause porte la parole.  (original, son : Thème parole)"
    ]
   },
   {
    "h": "À savoir",
    "p": [
     "Les traditionnels sont de tradition orale populaire ; les autres sont écrits pour l’appli. Plusieurs versions circulent, la forme exacte peut varier. Ajoute les tiens, construits sur le son que tu rates le plus."
    ]
   }
  ],
  "retenir": [
   "Un son à la fois.",
   "Lent, puis normal, puis rapide, puis expressif.",
   "Garde le virelangue raté pour demain."
  ],
  "exercice": "Choisis un virelangue de niveau 2. Trois passages lents, trois passages à vitesse normale sans erreur, un passage rapide. Enregistre le rapide puis enchaîne trente secondes de parole libre. Réussi = trois passages normaux sans erreur d’affilée en moins de cinq minutes ; note ton temps pour le battre demain.",
  "quiz": [
   {
    "q": "Dans quel ordre travailler un virelangue ?",
    "o": [
     "Lent, normal, plus rapide, expressif",
     "Rapide d’abord",
     "Une seule fois sans s’arrêter"
    ],
    "a": 0,
    "e": "On installe la clarté avant la vitesse."
   },
   {
    "q": "Que fait-on du virelangue le plus raté ?",
    "o": [
     "On l’oublie",
     "On le note pour le reprendre le lendemain",
     "On le supprime de la banque"
    ],
    "a": 1,
    "e": "Ce que tu rates le plus est ce qu’il faut travailler."
   }
  ]
 },
 {
  "id": "st4",
  "m": "st",
  "n": "S4",
  "titre": "De l’exercice à ta phrase : le Studio et la grille",
  "min": 9,
  "src": "app",
  "accroche": "Huit exercices du plus court au plus long, une grille pour te noter, et quatre semaines pour progresser. Chacun finit par une version dite à voix haute.",
  "sections": [
   {
    "h": "Les huit exercices",
    "p": [
     "Virelangue du jour (5 min) : trois lectures sans erreur à vitesse normale.",
     "Famille de mots (10 min) : choisis un mot, écris dix mots voisins par le sens ou le son, puis une phrase qui en utilise trois. Elle doit se comprendre à l’oral du premier coup.",
     "Proverbe retourné (10 min) : change la fin pour dire quelque chose de vrai sur ton sujet.",
     "Ma phrase d’arrivée (15 min) : note le lieu et le public, cherche un mot du lieu qui en rappelle un autre, écris une phrase courte qui tient en une respiration.",
     "Liste « peut-être que… » (15 min) : dix possibilités, puis un retournement qui change le sens de la liste.",
     "Bascule drôle puis sincère (20 min) : une minute drôle, une minute sincère, sur le même sujet. Annonce le changement par un silence ou un mot de transition.",
     "Clôture en boucle (10 min) : réécris la dernière phrase pour qu’elle reprenne l’ouverture.",
     "Carnet quotidien (3 min par jour) : une entrée par jour, relue le dimanche."
    ]
   },
   {
    "h": "Version simple d’abord",
    "p": [
     "Écris une idée en phrases simples, sans jeu de mots (15 min), puis ajoute un seul jeu de mots là où il sert l’idée. Réussite : la version avec jeu de mots est plus claire ou plus mémorable, pas seulement plus brillante."
    ]
   },
   {
    "h": "Règle pour les confidences",
    "p": [
     "Dans les exercices qui demandent un aveu (phrase d’arrivée, bascule), choisis une anecdote légère, vraie mais sans gravité, ou une situation imaginée annoncée comme telle (« imaginons que… »). Aucun exercice ne demande de révéler quelque chose de douloureux."
    ]
   },
   {
    "h": "Grille d’auto-évaluation",
    "p": [
     "Note-toi de 1 à 3 après t’être réécouté. Un total de 12 ou plus sur 15 valide l’exercice.",
     "Diction : 1 syllabes avalées, 2 clair avec quelques accrocs, 3 net à vitesse normale.",
     "Clarté du jeu de mots : 1 il faut l’expliquer, 2 compris par la plupart, 3 compris du premier coup.",
     "Dosage : 1 trop ou aucun, 2 bien placés mais un peu nombreux, 3 un seul, au bon moment.",
     "Naturel : 1 phrase récitée, 2 quelques moments naturels, 3 parole qui sonne comme toi.",
     "Silence et rythme : 1 aucun silence, 2 un silence utile, 3 silence avant la chute."
    ]
   },
   {
    "h": "Progression sur quatre semaines",
    "p": [
     "Semaine 1 : virelangues niveaux 1 et 2, carnet quotidien.",
     "Semaine 2 : famille de mots et proverbe retourné.",
     "Semaine 3 : phrase d’arrivée et liste « peut-être que… ».",
     "Semaine 4 : bascule drôle puis sincère et clôture en boucle, sur un discours complet de trois minutes."
    ]
   }
  ],
  "retenir": [
   "Dis toujours la version à voix haute.",
   "Version simple d’abord, jeu de mots ensuite.",
   "Douze sur quinze valide l’exercice."
  ],
  "exercice": "Dans le Studio, lance « Version simple, puis un seul jeu de mots » sur deux minutes. Note-toi sur chaque critère de la grille de la leçon. Refais le lendemain sur le même sujet. Réussi = au moins un critère s’est amélioré entre les deux prises.",
  "quiz": [
   {
    "q": "Quel total valide un exercice avec la grille ?",
    "o": [
     "12 sur 15 ou plus",
     "5 sur 15",
     "15 sur 15 seulement"
    ],
    "a": 0,
    "e": "Douze ou plus sur quinze valide."
   },
   {
    "q": "Que demande-t-on pour les confidences ?",
    "o": [
     "Une anecdote légère ou imaginée et annoncée",
     "Un secret douloureux",
     "Rien du tout"
    ],
    "a": 0,
    "e": "Aucun exercice n’exige de révéler quelque chose de douloureux."
   }
  ]
 },
 {
  "id": "st5",
  "m": "st",
  "n": "S5",
  "titre": "Le style se trouve par l’essai",
  "min": 8,
  "src": "app",
  "accroche": "Un auteur contemporain raconte comment son propre style est né. Quelques consignes utiles, reformulées, et deux points sur lesquels les créateurs ne sont pas d’accord.",
  "sections": [
   {
    "h": "Ce qu’un auteur dit de son style",
    "p": [
     "Le jeu de mots est une étape, pas un but : il a d’abord enchaîné les jeux de mots en imitant les gagnants de concours, puis évolué vers un style plus lyrique, où le trait d’esprit surprend et fait réfléchir.",
     "Le style se trouve par l’essai : il a testé une éloquence théâtrale qui ne lui ressemblait pas et a échoué. Il conseille de se demander d’abord qui l’on est, puis d’écrire.",
     "Le public peut trop analyser : ses jeux de mots poussent à décoder, donc à sortir de l’émotion ; il cherche à revenir à quelque chose de plus simple.",
     "La simplicité d’abord : le vocabulaire sert à préciser une pensée, pas à impressionner. En public, la parole doit être comprise par n’importe qui.",
     "La pratique avant la théorie : lire ou regarder ne suffit pas, il faut parler, le plus souvent possible.",
     "Trois piliers, une métaphore : l’argument (logos), l’émotion (pathos) et l’image que l’on renvoie (éthos), avec le contexte. Il compare cela à entrer dans la chambre de quelqu’un : on demande le consentement, forcer la porte est un échec de la parole."
    ]
   },
   {
    "h": "Là où deux approches divergent",
    "p": [
     "Les 30 premières secondes : un formateur les juge décisives, un auteur les juge peu importantes. Aucun des deux ne cite d’étude : l’appli présente les deux points de vue.",
     "Imiter le non-verbal de l’autre : les deux le conseillent, avec des preuves faibles hors négociation. À essayer sans en faire une règle."
    ]
   },
   {
    "h": "Ce qu’on garde",
    "p": [
     "On ne reprend aucune phrase d’un orateur. On garde les mécanismes : ancrage local, aveu léger, retournement. Et on vérifie ce qu’on cite : une phrase attribuée à une autrice dans un podcast était mal captée et doit être retrouvée avant tout usage."
    ]
   }
  ],
  "retenir": [
   "Le jeu de mots est une étape, pas un but.",
   "Le style se trouve en essayant, pas en imitant.",
   "Les créateurs divergent : teste par toi-même."
  ],
  "exercice": "Choisis une idée en une phrase. Écris-la en trois versions : simple, avec un jeu de mots, plus lyrique. Enregistre les trois et fais voter deux personnes sans leur dire ta préférence. Réussi = tu expliques en une phrase pourquoi la version retenue sonne comme toi.",
  "quiz": [
   {
    "q": "Selon Pierre, que vaut le jeu de mots ?",
    "o": [
     "Une étape, pas un but",
     "Le cœur de l’éloquence",
     "Une erreur à éviter"
    ],
    "a": 0,
    "e": "Il a évolué vers un style plus simple et plus lyrique."
   },
   {
    "q": "Que garde-t-on d’un orateur ?",
    "o": [
     "Ses phrases",
     "Ses mécanismes",
     "Son nom"
    ],
    "a": 1,
    "e": "On enseigne le mécanisme, jamais la phrase à recopier."
   }
  ]
 },
 {
  "id": "st6",
  "m": "st",
  "n": "S6",
  "titre": "Un discours modèle : « Ce que vaut une parole »",
  "min": 9,
  "src": "app",
  "accroche": "Un discours de trois minutes écrit pour l’appli. Il assemble huit mécanismes ; tu le lis à voix haute, puis tu écris le tien sur le même plan.",
  "sections": [
   {
    "h": "Le plan",
    "p": [
     "1. Accroche : ancrage dans le lieu et le temps (les dix minutes données).",
     "2. Proverbe retourné : « les paroles s’envolent, mais certaines atterrissent ».",
     "3. Famille de mots : compte / conte / comte.",
     "4. Double sens : prix / pris.",
     "5. Liste « peut-être » : anaphore et retournement.",
     "6. Métaphore filée : la parole comme monnaie.",
     "7. Bascule : du drôle au sincère, avec une anecdote vraie et légère choisie par toi.",
     "8. Clôture en boucle : reprise de l’ouverture et « tenir parole »."
    ]
   },
   {
    "h": "Le texte modèle (les crochets sont à remplacer ; « silence » = une vraie pause)",
    "p": [
     "Ce soir, à [LIEU], on m’a donné dix minutes. Dix minutes, c’est peu pour dire ce que vaut une parole. C’est beaucoup, si on compte bien.",
     "(silence)",
     "On dit que les paroles s’envolent. Peut-être. Mais certaines atterrissent. Celles-là, on les retrouve des années plus tard, à l’endroit exact où quelqu’un les a laissées tomber : dans une poche, dans une tête, dans le cœur de celui qui les a reçues.",
     "Alors, qu’est-ce que ça vaut, une parole ?",
     "On peut compter sur quelqu’un. On peut lui conter quelque chose. Les chiffres comptent, les histoires restent. Quant au comte, il ne fait ni l’un ni l’autre : il signe, et il passe.",
     "Chaque parole a un prix. Et celui qui la dit est déjà pris : pris par son public, pris par ses mots, pris au piège de ce qu’il vient de promettre.",
     "Peut-être que tu as peur de parler. Peut-être que personne ne t’écoutera. Peut-être que tu perdras ton fil, ta phrase, ta place sur la page. Peut-être que tu rougiras, que tu bafouilleras, que ta voix partira dans les aigus. Peut-être. Ou peut-être que ce prix-là, le risque, est exactement ce qui donne sa valeur à ce que tu dis.",
     "Car une parole, c’est une monnaie. Tenue, elle garde sa valeur. Jetée en l’air, elle fait de l’inflation : on en dit plus, on en croit moins. Et le jour où l’on dévalue ses promesses, plus personne n’accepte de payer.",
     "(silence)",
     "Je vais être sérieux une minute. [ANECDOTE : une fois, une phrase simple, dite au bon moment, qui a changé quelque chose pour toi ou pour quelqu’un.] Ce jour-là, j’ai compris que les mots les plus chers ne sont pas les plus rares. Ce sont les plus vrais. Ils coûtent un peu de courage, et ils rapportent un peu de confiance.",
     "Alors, qu’est-ce que ça vaut, une parole ?",
     "Dix minutes, c’est ce qu’on m’a donné. J’ai compté. Pas pour conter moins : pour que ça compte. Une parole vaut exactement ce que vaut celui qui la tient."
    ]
   },
   {
    "h": "À préparer",
    "p": [
     "À changer à chaque fois : le lieu, la durée annoncée, l’anecdote. L’anecdote doit être vraie et légère, ou clairement annoncée comme imaginée.",
     "Objection à préparer : « une parole qui ne risque rien ne vaut rien » est une thèse, pas un fait : une information exacte peut avoir de la valeur sans risque pour celui qui la donne. Sache la défendre ou la nuancer."
    ]
   },
   {
    "h": "Banque de mots par idée",
    "p": [
     "Parole : voix / voie / voit ; mot / maux ; chaire / chair / cher / chère. Expressions : prendre la parole, tenir parole, couper la parole. Image : la parole comme monnaie, comme pont, comme graine.",
     "Voix : voix / voie ; sens / sans / cent / sang. Expressions : avoir voix au chapitre, élever la voix. Image : la voix comme chemin.",
     "Silence : taire / terre ; pause / pose. Expressions : garder le silence, tourner sept fois sa langue dans sa bouche. Image : le silence comme respiration.",
     "Peur et courage : cœur / chœur ; peur / peu. Expressions : avoir le trac, avoir la boule au ventre, se jeter à l’eau. Image : la peur comme signe qu’il y a un enjeu.",
     "Vente et valeur : vent / vend ; prix / pris / prie ; compte / conte / comte. Expressions : se vendre, valoir son pesant d’or, le prix à payer.",
     "Image de soi : sur / sûr ; sceptique / septique ; éminent / imminent. Expressions : faire bonne impression, avoir de la présence. Image : le miroir, le portrait.",
     "Écoute : attention / intention ; allocution / allocation. Expressions : tendre l’oreille, être tout ouïe.",
     "Confiance et vérité : foi / foie / fois ; justesse / justice ; conjecture / conjoncture ; sensé / censé. Expressions : donner sa parole, avoir la foi.",
     "Temps : temps / tant / t’en. Expressions : prendre son temps, tuer le temps. Image : le sablier.",
     "Rencontre : collision / collusion ; exalter / exulter ; infusion / effusion. Expressions : briser la glace, rompre le silence.",
     "Comment l’utiliser : choisis une idée, prends une ligne, puis écris une phrase qui modèle un mot de la deuxième colonne et une expression de la troisième. Un jeu de mots qui ne dit rien affaiblit le propos."
    ]
   }
  ],
  "retenir": [
   "Huit mécanismes, un plan.",
   "Change le lieu, la durée et l’anecdote à chaque fois.",
   "Un jeu de mots doit servir l’idée."
  ],
  "exercice": "Lis le texte modèle à voix haute en marquant les silences au crayon. Écris ensuite ta version sur le même plan : ton lieu, une anecdote vraie, trois idées, un appel, environ 350 mots. Dis-la en trois minutes chronométrées. Réussi = durée entre 2 min 40 et 3 min 20, un seul jeu de mots, anecdote vraie.",
  "quiz": [
   {
    "q": "Que doit-on changer à chaque fois ?",
    "o": [
     "Le lieu, la durée annoncée, l’anecdote",
     "Tout le plan",
     "Rien"
    ],
    "a": 0,
    "e": "Le plan reste, les éléments personnels changent."
   },
   {
    "q": "Quelle est l’objection à préparer ?",
    "o": [
     "« Une parole qui ne risque rien ne vaut rien » est une thèse",
     "Le texte est trop court",
     "Il faut un micro"
    ],
    "a": 0,
    "e": "C’est une thèse : une information exacte peut valoir sans risque."
   }
  ]
 }
]);
})();
