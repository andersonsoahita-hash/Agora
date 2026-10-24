/* Orateurs : faits vérifiés dans les sources citées (consultées le 17 octobre 2026).
   Les « techniques » sont une lecture pédagogique de l'appli, pas des faits historiques. */
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.orators = [
  {
    id: 'demosthene', nom: 'Démosthène', epoque: 'v. 384 – 322 av. J.-C.', lieu: 'Athènes', tags: ['Antiquité'],
    genre: 'Délibératif', archetype: 'tribun',
    discours: { titre: 'Les Philippiques', date: '351, 344 et 341 av. J.-C.', cadre: 'Assemblée d’Athènes' },
    contexte: 'Quatre discours conservés pressent Athènes de résister à Philippe II de Macédoine, qui semble vouloir conquérir la Grèce. Démosthène propose de lever des armées de citoyens et de mercenaires, mais l’assemblée préfère l’attitude plus passive de son rival Eschine. Philippe bat les Grecs à Chéronée en 338 : Athènes perd son indépendance. Démosthène se donne la mort à Calaurie en 322 plutôt que d’être capturé.',
    parcours: 'Élève d’Isée, il travaille comme logographe (rédacteur de discours). À 18 ans, il poursuit ses tuteurs en justice, plaide lui-même et gagne.',
    techniques: [
      { nom: 'L’urgence comme argument', texte: 'Chaque Philippique tient sur une idée : agir maintenant. C’est un exercice de kairos, le sens du moment opportun.' },
      { nom: 'La proposition concrète', texte: 'Il ne se contente pas d’alerter : il propose des moyens précis (armées de citoyens et de mercenaires). Un discours délibératif doit déboucher sur une décision.' }
    ],
    essai: { label: 'Convaincre une assemblée d’agir maintenant', type: 'argumenter', duree: 120, consigne: 'Tu parles devant une assemblée qui hésite. En 2 minutes : (1) nomme le danger de l’attente, (2) propose une mesure précise, (3) termine par une demande de décision.' },
    sources: [{ t: 'World History Encyclopedia : Demosthenes', u: 'https://www.worldhistory.org/Demosthenes/' }]
  },
  {
    id: 'ciceron', nom: 'Cicéron', epoque: '106 – 43 av. J.-C.', lieu: 'Rome', tags: ['Antiquité'],
    genre: 'Accusation devant le Sénat', archetype: 'architecte',
    discours: { titre: 'Première Catilinaire', date: '7 novembre 63 av. J.-C. (selon Hérodote.net ; d’autres sources donnent le 8)', cadre: 'Sénat romain' },
    contexte: 'Cicéron est consul, magistrat suprême de la République, et un « homme nouveau » : issu de l’ordre équestre, sans famille patricienne. Catilina, qui a déjà tenté de renverser les institutions, est assis au premier rang. Cicéron le prend à partie dès le début du discours. Catilina s’enfuit et déclenche une rébellion armée ; il est battu l’année suivante et meurt au combat. Le Sénat décerne à Cicéron le titre de Pater patriae.',
    parcours: 'Orateur, avocat et théoricien : son traité De oratore (55 av. J.-C.) raconte la légende de Simonide, à l’origine de la méthode des loci.',
    techniques: [
      { nom: 'L’apostrophe', texte: 'S’adresser directement à la personne visée, devant tous (l’ouverture est restée célèbre : « Quo usque tandem… »). L’adversaire cesse d’être un sujet abstrait.' },
      { nom: 'L’ethos par l’action', texte: 'Homme nouveau sans nom prestigieux, Cicéron fonde son autorité sur ce qu’il a fait et sur sa fonction.' }
    ],
    essai: { label: 'Apostropher un adversaire en ouverture', type: 'debat', duree: 60, consigne: 'Ouvre ton discours en t’adressant directement à un adversaire imaginaire (une idée, une habitude, un obstacle). 1 minute, commence par une question qui l’interpelle.' },
    sources: [{ t: 'Hérodote.net : 7 novembre 63 av. J.-C.', u: 'https://www.herodote.net/7_novembre_63_av_J_C-evenement--631107.php' }]
  },
  {
    id: 'churchill', nom: 'Winston Churchill', epoque: '1874 – 1965', lieu: 'Royaume-Uni', tags: ['XXe siècle', 'Guerre'],
    genre: 'Délibératif', archetype: 'tribun',
    discours: { titre: '« We shall fight on the beaches »', date: '4 juin 1940', cadre: 'Chambre des communes, Londres' },
    contexte: 'Premier ministre depuis le 10 mai 1940, Churchill parle après la capitulation belge et le repli vers Dunkerque. L’opération Dynamo a évacué l’essentiel du corps expéditionnaire britannique, mais presque tout le matériel lourd est perdu. Il doit annoncer ce désastre, avertir d’une invasion possible et préparer le pays au retrait de la France, sans la dégager de ses engagements.',
    parcours: 'Le discours n’a pas été diffusé en direct : des présentateurs de la BBC en ont lu des extraits aux informations du soir. Aucun enregistrement n’existe d’époque ; Churchill en a fait un en 1949.',
    techniques: [
      { nom: 'L’anaphore', texte: 'La péroraison répète « we shall fight » en tête de propositions successives (en France, sur les mers et les océans, sur les plages…).' },
      { nom: 'La chute', texte: 'La séquence monte jusqu’à « we shall never surrender ». La répétition de « si nécessaire pendant des années, si nécessaire seul » prépare la fin.' }
    ],
    essai: { label: 'Écrire et dire une anaphore', type: 'argumenter', duree: 60, consigne: 'Choisis une conviction. Dis-la en 1 minute avec au moins cinq phrases qui commencent par la même formule, en montant d’intensité jusqu’à une dernière phrase courte.' },
    sources: [{ t: 'Wikipedia : We shall fight on the beaches', u: 'https://en.wikipedia.org/wiki/We_shall_fight_on_the_beaches' }]
  },
  {
    id: 'degaulle', nom: 'Charles de Gaulle', epoque: '1890 – 1970', lieu: 'France', tags: ['XXe siècle', 'Guerre', 'France'],
    genre: 'Appel (délibératif)', archetype: 'rassembleur',
    discours: { titre: 'Appel du 18 juin', date: '18 juin 1940, 22 h (heure britannique)', cadre: 'Radio BBC, enregistré à Broadcasting House, Londres' },
    contexte: 'La France est vaincue dans la bataille de France et le gouvernement du maréchal Pétain prépare un armistice. De Gaulle, sous-secrétaire d’État à la Guerre depuis peu, s’y oppose. Il part pour Londres le 17 juin et parle avec l’accord de Churchill. Il affirme que la défaite n’est pas définitive : la France a son empire, l’Empire britannique et l’industrie américaine ; la guerre est mondiale.',
    parcours: 'Les historiens soulignent que très peu de personnes l’ont entendu, et que beaucoup de souvenirs d’écoute sont faux. La BBC n’a pas conservé d’enregistrement. Le discours du 22 juin a touché un public plus large et est souvent confondu avec celui du 18.',
    techniques: [
      { nom: 'Le renversement', texte: 'Il reprend la défaite pour la retourner : ce sont les chars, les avions et la tactique qui ont vaincu la France, pas le nombre. Donc rien n’est perdu.' },
      { nom: 'L’appel ciblé', texte: 'Il invite des publics précis à le rejoindre : officiers, soldats, ingénieurs, ouvriers spécialistes de l’armement.' }
    ],
    essai: { label: 'Un appel à un public précis', type: 'argumenter', duree: 60, consigne: 'Une situation semble perdue. En 1 minute : (1) explique pourquoi elle n’est pas finale, (2) donne trois ressources qui restent, (3) appelle un public précis à agir.' },
    sources: [{ t: 'Wikipedia : Appeal of 18 June', u: 'https://en.wikipedia.org/wiki/Appeal_of_18_June' }]
  },
  {
    id: 'mlk', nom: 'Martin Luther King Jr.', epoque: '1929 – 1968', lieu: 'États-Unis', tags: ['XXe siècle', 'Droits civiques'],
    genre: 'Délibératif et épidictique', archetype: 'tribun',
    discours: { titre: '« I Have a Dream »', date: '28 août 1963', cadre: 'Marches du Lincoln Memorial, Washington D.C.' },
    contexte: 'Le discours est prononcé lors de la Marche sur Washington, devant environ un quart de million de personnes réunies pour réclamer la justice sociale, des salaires équitables et la fin de la ségrégation raciale.',
    parcours: 'Le lieu compte : parler au Lincoln Memorial relie la demande d’égalité à la proclamation d’émancipation et aux idéaux démocratiques américains.',
    techniques: [
      { nom: 'L’anaphore symbolique', texte: '« I have a dream » revient huit fois ; « 100 years later » est répété pour souligner la lenteur de la liberté promise.' },
      { nom: 'Le contraste', texte: 'Il oppose la Constitution et la Déclaration d’indépendance à la réalité de la discrimination raciale.' },
      { nom: 'Le lieu comme argument', texte: 'Le choix de l’endroit fait déjà partie du message.' }
    ],
    essai: { label: 'Faire du lieu un argument', type: 'argumenter', duree: 90, consigne: 'Imagine que tu parles dans un lieu symbolique de ton sujet. En 1 min 30, utilise ce lieu pour ouvrir, puis répète une formule trois fois pour rythmer ton message.' },
    sources: [{ t: 'Seton Hall : « I Have a Dream » (analyse)', u: 'https://blogs.shu.edu/americanhistory/?p=1877' }]
  },
  {
    id: 'mandela', nom: 'Nelson Mandela', epoque: '1918 – 2013', lieu: 'Afrique du Sud', tags: ['XXe siècle', 'Afrique', 'Droit'],
    genre: 'Plaidoirie / déclaration', archetype: 'garant',
    discours: { titre: '« I Am Prepared to Die »', date: '20 avril 1964', cadre: 'Box des accusés, procès de Rivonia' },
    contexte: 'Mandela choisit de faire une déclaration plutôt que de témoigner, ce qui lui évite le contre-interrogatoire. Il met l’État en accusation en pointant les injustices de la société sud-africaine et de son système judiciaire. Le texte dure environ trois heures. Il le rédige pendant plusieurs semaines, avec l’aide de relecture de Nadine Gordimer et d’Anthony Sampson.',
    parcours: 'La dernière phrase proclame un idéal « pour lequel je suis prêt à mourir », avec l’ajout de « si nécessaire » (if needs be). Il regarde le juge Quartus de Wet dans les yeux en la prononçant. Il est condamné à la prison à vie, pas à mort, et sera libéré après 27 ans.',
    techniques: [
      { nom: 'Le renversement des rôles', texte: 'L’accusé devient accusateur : le procès porte sur le système, pas sur l’homme.' },
      { nom: 'Le travail d’écriture', texte: 'Un texte préparé sur plusieurs semaines et relu par d’autres. La force vient aussi du travail.' },
      { nom: 'La chute mesurée', texte: 'Le qualificatif « si nécessaire » rend la phrase plus crédible qu’une déclaration absolue.' }
    ],
    essai: { label: 'Commencer par la dernière phrase', type: 'argumenter', duree: 120, consigne: 'Écris d’abord la dernière phrase de ton discours (une phrase qui engage). Puis dis 2 minutes de discours qui y mène, et prononce-la en regardant un point fixe.' },
    sources: [{ t: 'Wikipedia : I Am Prepared to Die', u: 'https://en.wikipedia.org/wiki/I_Am_Prepared_to_Die' }]
  },
  {
    id: 'veil', nom: 'Simone Veil', epoque: '1927 – 2017', lieu: 'France', tags: ['XXe siècle', 'France', 'Parlement'],
    genre: 'Délibératif', archetype: 'garant',
    discours: { titre: 'Présentation de la loi sur l’IVG', date: '26 novembre 1974', cadre: 'Assemblée nationale' },
    contexte: 'Ministre de la Santé, Simone Veil présente le projet de loi autorisant l’IVG. Elle doit convaincre 481 députés hommes et 9 députées. Les échanges, houleux, durent trois jours, soit 25 heures. Le vote a lieu dans la nuit du 29 novembre : 284 voix pour, 189 contre.',
    parcours: 'Le texte est adopté par le Parlement le 20 décembre 1974, à titre expérimental.',
    techniques: [
      { nom: 'Tenir devant une salle hostile', texte: 'Le contexte (débats houleux, assemblée presque exclusivement masculine) en fait un cas d’étude pour la gestion d’un public contraire.' }
    ],
    essai: { label: 'Répondre calmement à une objection dure', type: 'qr', duree: 60, consigne: 'Un interlocuteur te lance une objection hostile. En 1 minute : reformule-la sans la déformer, réponds en une idée centrale, et garde le même ton du début à la fin.' },
    sources: [{ t: 'Vie-publique : Les 50 ans de la loi Veil (PDF)', u: 'https://www.vie-publique.fr/files/medias/L_essentiel_Numero_7_Les_50_ans_de_la_loi_Veil.pdf' }]
  },
  {
    id: 'badinter', nom: 'Robert Badinter', epoque: '1928 – 2024', lieu: 'France', tags: ['XXe siècle', 'France', 'Parlement', 'Droit'],
    genre: 'Délibératif', archetype: 'architecte',
    discours: { titre: 'Discours pour l’abolition de la peine de mort', date: '17 septembre 1981', cadre: 'Assemblée nationale' },
    contexte: 'Garde des Sceaux, ministre de la Justice, Badinter parle « au nom du Gouvernement de la République ». Il rappelle la longue histoire abolitionniste depuis la Constituante de 1791, citant notamment Jaurès et Briand, et explique le retard français par des raisons politiques, les temps de guerre et la crainte de l’opinion. Il soutient que l’élection présidentielle de 1981 a donné mandat au président Mitterrand sur ce sujet, ce qui légitime le vote des députés.',
    parcours: 'Il défend un principe moral : la justice humaine est faillible, donc la peine de mort est inacceptable. La loi est définitivement adoptée le 9 octobre 1981.',
    techniques: [
      { nom: 'Trois appuis successifs', texte: 'Légitimité (le mandat des urnes), histoire (les devanciers) et principe moral (la faillibilité de la justice). Chaque étape répond à une objection différente.' },
      { nom: 'L’autorité des prédécesseurs', texte: 'Citer des figures reconnues place le débat dans une tradition plutôt que dans un camp.' }
    ],
    essai: { label: 'Légitimité, histoire, principe', type: 'argumenter', duree: 120, consigne: 'Défends une réforme en 2 minutes avec trois appuis dans cet ordre : pourquoi tu as le droit de la proposer, ce que l’histoire enseigne, quel principe la justifie.' },
    sources: [{ t: 'Amnesty France : 17 septembre 1981, discours de Robert Badinter', u: 'https://www.amnesty.fr/actualites/17-septembre-1981-discours-de-robert-badinter' }]
  },
  {
    id: 'sankara', nom: 'Thomas Sankara', epoque: '1949 – 1987', lieu: 'Burkina Faso', tags: ['XXe siècle', 'Afrique', 'ONU'],
    genre: 'Délibératif', archetype: 'pedagogue',
    discours: { titre: 'Discours à l’Assemblée générale de l’ONU', date: '4 octobre 1984', cadre: '39e session, New York, prononcé en français' },
    contexte: 'Il parle au nom du Burkina Faso, mandaté par le Conseil national de la révolution. Il décrit un pays pauvre, touché par la sécheresse, qui cherche l’autonomie et la dignité. Il critique l’aide extérieure, qui selon lui entretient la dépendance, et appelle à la solidarité entre pays non alignés.',
    parcours: 'Autres thèmes : dépenses militaires comparées au coût de l’éducation, de la santé et de l’alimentation ; condamnation de l’apartheid ; réforme de l’ONU (fin du droit de veto, plus de places pour l’Afrique).',
    techniques: [
      { nom: 'Le contraste de priorités', texte: 'Opposer ce que coûtent les armes à ce que coûteraient l’école, la santé et la nourriture rend le choix visible.' },
      { nom: 'Parler depuis la marge', texte: 'Il s’adresse à une instance où son pays pèse peu, en faisant de cette position une force.' }
    ],
    essai: { label: 'Opposer deux priorités', type: 'argumenter', duree: 90, consigne: 'Choisis deux dépenses ou deux priorités dans ton environnement (en Ariary si le sujet est malgache). En 1 min 30, oppose-les pour montrer ce qui devrait passer en premier.' },
    sources: [{ t: 'Marxists Internet Archive : Sankara, 4 octobre 1984', u: 'https://www.marxists.org/archive/sankara/1984/october/04.htm' }]
  },
  {
    id: 'obama', nom: 'Barack Obama', epoque: 'né en 1961', lieu: 'États-Unis', tags: ['XXIe siècle', 'Conférence politique'],
    genre: 'Épidictique et délibératif', archetype: 'conteur',
    discours: { titre: 'Discours d’ouverture de la Convention démocrate', date: '27 juillet 2004', cadre: 'FleetCenter (aujourd’hui TD Garden), Boston' },
    contexte: 'Il est alors sénateur de l’Illinois et candidat au Sénat fédéral. Le discours dure environ 17 minutes (2 297 mots environ), il est interrompu 33 fois par des applaudissements. Environ 9,1 millions de personnes le suivent. Les trois grands réseaux ne l’ont pas diffusé.',
    parcours: 'Thèmes : son histoire familiale, l’unité contre le clivage entre « États rouges et bleus », l’espoir comme alternative au cynisme. Des critiques l’ont jugé centriste et flou sur certains sujets, dont l’Irak.',
    techniques: [
      { nom: 'Le récit personnel comme pont', texte: 'Il relie son histoire à un récit national plus large : le particulier sert l’argument collectif.' },
      { nom: 'Le motif récurrent', texte: '« The audacity of hope » (formule reprise d’un sermon de Jeremiah Wright) devient le fil conducteur du discours.' }
    ],
    essai: { label: 'Un récit qui mène à une valeur commune', type: 'recit', duree: 90, consigne: 'Raconte en 1 min 30 un moment de ta vie, puis relie-le à une valeur que ton public partage. Termine par une phrase qui reprend un motif de ton ouverture.' },
    sources: [{ t: 'Wikipedia : 2004 DNC keynote address', u: 'https://en.wikipedia.org/wiki/2004_Democratic_National_Convention_keynote_address' }]
  },
  {
    id: 'jobs', nom: 'Steve Jobs', epoque: '1955 – 2011', lieu: 'États-Unis', tags: ['XXIe siècle', 'Entrepreneuriat'],
    genre: 'Épidictique', archetype: 'conteur',
    discours: { titre: 'Discours de remise des diplômes de Stanford', date: '12 juin 2005', cadre: 'Université Stanford, promotion 2005' },
    contexte: 'Il annonce trois histoires personnelles et les présente comme simples et sans prétention. Première : relier les points (de l’abandon de ses études à un cours de calligraphie, puis à la typographie du premier Macintosh). Deuxième : amour et perte (licencié d’Apple à 30 ans, puis NeXT, Pixar et le retour). Troisième : la mort, comme guide des grands choix, et son cancer.',
    parcours: 'Il ouvre sur un ton décontracté et autodérisoire : il n’a jamais obtenu son diplôme et parle de « juste trois histoires ».',
    techniques: [
      { nom: 'L’annonce du plan par les récits', texte: 'Dire d’emblée « trois histoires » donne au public une carte : il sait où il va et quand cela finit.' },
      { nom: 'L’autodérision', texte: 'Commencer par ce qu’on n’a pas fait construit la confiance sans se vanter.' }
    ],
    essai: { label: 'Trois histoires, trois minutes', type: 'recit', duree: 180, consigne: 'Annonce « trois histoires » sur un seul thème. Raconte chacune en une demi-minute, en finissant chaque fois par une phrase de leçon.' },
    sources: [{ t: 'Rev : transcription du discours de Stanford', u: 'https://www.rev.com/blog/transcripts/steve-jobs-stanford-commencement-speech-transcript-2005' }]
  },
  {
    id: 'malala', nom: 'Malala Yousafzai', epoque: 'née en 1997', lieu: 'Pakistan', tags: ['XXIe siècle', 'ONU', 'Éducation'],
    genre: 'Épidictique et délibératif', archetype: 'rassembleur',
    discours: { titre: 'Discours à l’Assemblée de la jeunesse de l’ONU', date: '12 juillet 2013', cadre: 'Siège de l’ONU, New York' },
    contexte: 'Elle parle le jour de ses 16 ans, une date que le secrétaire général Ban Ki-moon a nommée « Malala Day ». Elle a été visée par les talibans pour avoir suivi des cours. Elle exhorte les jeunes à utiliser l’éducation contre l’extrémisme.',
    parcours: 'La force du discours tient d’abord à la personne qui le prononce et à ce qu’elle a vécu.',
    techniques: [
      { nom: 'La légitimité vécue', texte: 'Parler d’éducation après avoir été visée pour avoir été à l’école donne un ethos que personne ne peut contester.' },
      { nom: 'Le message simple', texte: 'Un seul message, l’éducation, répété sous plusieurs formes.' }
    ],
    essai: { label: 'Parler de ce que tu as vécu', type: 'argumenter', duree: 60, consigne: 'Choisis un sujet dont tu as une expérience directe. En 1 minute : (1) ce que tu as vécu, (2) ce que tu en conclus, (3) ce que le public peut faire.' },
    sources: [{ t: 'ONU : Malala Yousafzai à l’Assemblée de la jeunesse (UN Media)', u: 'https://media.un.org/unifeed/en/asset/u130/u130712b' }]
  },
  {
    id: 'aristote', nom: 'Aristote', epoque: '384 – 322 av. J.-C.', lieu: 'Stagire, Athènes', tags: ['Antiquité', 'Théorie'],
    genre: 'Traité de rhétorique', archetype: 'architecte',
    discours: { titre: 'Rhétorique', date: 'probablement entre 329 et 323 av. J.-C.', cadre: 'Traité en trois livres, Athènes' },
    contexte: 'La Rhétorique n’est pas un discours, mais le texte fondateur de la théorie de la persuasion. Le premier livre traite de la définition et du fonctionnement de la rhétorique, le deuxième de la psychologie des locuteurs, le troisième des effets de style. Aristote y distingue trois moyens de persuasion, l’éthos, le pathos et le logos, et trois genres de discours.',
    parcours: 'Né à Stagire, il fut l’élève de Platon, le précepteur d’Alexandre le Grand, puis fonda le Lycée à Athènes. Il meurt à Chalcis en 322 av. J.-C.',
    techniques: [
      { nom: 'Les trois preuves', texte: 'L’éthos est le caractère de l’orateur, qui doit inspirer confiance. Le pathos est la disposition d’esprit des auditeurs. Le logos est la force démonstrative du discours lui-même. Ce sont les trois piliers que l’appli mesure, de façon indicative, dans chaque séance.' },
      { nom: 'Trois genres, trois buts', texte: 'Le genre délibératif parle du futur et cherche le bien (décider quoi faire). Le judiciaire parle du passé (accuser ou défendre). L’épidictique parle surtout du présent (louer ou blâmer). Savoir dans quel genre on parle évite de se tromper de registre.' },
      { nom: 'L’enthymème', texte: 'C’est un syllogisme rhétorique : on part de ce que l’auditoire accepte déjà pour aller vers sa conclusion, sans tout expliciter. L’art est de choisir une prémisse que le public tient vraiment pour acquise.' }
    ],
    essai: { label: 'Les trois preuves en 2 minutes', type: 'argumenter', duree: 120, consigne: 'Choisis une idée. En 2 minutes : environ 30 secondes pour dire pourquoi on peut te croire (éthos), 30 secondes pour toucher ton auditoire (pathos), 1 minute de raisonnement clair (logos).' },
    sources: [{ t: 'Wikipedia : Rhétorique (Aristote)', u: 'https://fr.wikipedia.org/wiki/Rh%C3%A9torique_(Aristote)' }, { t: 'Wikipedia : Aristote', u: 'https://fr.wikipedia.org/wiki/Aristote' }]
  },
  {
    id: 'schopenhauer', nom: 'Arthur Schopenhauer', epoque: '1788 – 1860', lieu: 'Dantzig, Francfort', tags: ['XIXe siècle', 'Allemagne', 'Théorie'],
    genre: 'Dialectique (traité)', archetype: 'architecte',
    discours: { titre: 'L’Art d’avoir toujours raison', date: 'écrit vers 1830-1831, publié en 1864', cadre: 'Texte posthume (Die Kunst, Recht zu behalten)' },
    contexte: 'Schopenhauer n’est pas un orateur : c’est un philosophe qui a décrit les ruses d’une dispute. Dans ce texte, il recense une trentaine de stratagèmes pour prendre le dessus dans une discussion, que l’on ait raison ou non. Le premier consiste à étendre l’affirmation de l’adversaire au-delà de ses limites pour la rendre attaquable. Le dernier, quand on est battu, consiste à devenir personnel et blessant. Le texte est publié en 1864, après sa mort. À utiliser pour reconnaître ces ruses chez l’autre, et pour se les interdire.',
    parcours: 'Né à Dantzig (aujourd’hui Gdańsk) en 1788, mort à Francfort-sur-le-Main en septembre 1860.',
    oeuvres: [
      { titre: 'De la quadruple racine du principe de raison suffisante', date: '1813', note: 'Sa thèse.' },
      { titre: 'Le Monde comme volonté et comme représentation', date: '1819', note: 'Son œuvre majeure ; deuxième édition en 1844, troisième en 1859.' },
      { titre: 'De la volonté dans la nature', date: '1836', note: '' },
      { titre: 'Les Deux Problèmes fondamentaux de l’éthique', date: '1841', note: 'Réunit un texte sur la liberté de la volonté humaine et un sur le fondement de la morale.' },
      { titre: 'Parerga et Paralipomena', date: '1851', note: 'Recueil d’essais.' },
      { titre: 'L’Art d’avoir toujours raison', date: 'écrit vers 1830-1831, publié en 1864', note: 'Le texte le plus utile à un orateur ou à un débatteur.' }
    ],
    techniques: [
      { nom: 'Reconnaître la ruse', texte: 'Savoir nommer ce que fait l’autre (déformer, élargir, attaquer la personne) permet de répondre au lieu de subir.' },
      { nom: 'Ne pas étendre la thèse adverse', texte: 'Reformuler fidèlement avant de répondre protège contre la première ruse, et rend ta réponse plus crédible.' },
      { nom: 'Ne pas devenir personnel', texte: 'Attaquer la personne est, selon lui, le dernier recours de celui qui a perdu sur le fond. Un bon orateur s’en tient aux arguments.' }
    ],
    essai: { label: 'Répondre sans caricaturer', type: 'debat', duree: 120, consigne: 'Prends une opinion qui t’énerve. Résume-la fidèlement en 30 secondes, sans l’étendre ni la caricaturer. Puis réponds en 1 minute 30 sans attaquer la personne.' },
    sources: [{ t: 'Wikipedia : L’Art d’avoir toujours raison', u: 'https://fr.wikipedia.org/wiki/L%27Art_d%27avoir_toujours_raison' }, { t: 'Wikipedia : Arthur Schopenhauer', u: 'https://fr.wikipedia.org/wiki/Arthur_Schopenhauer' }]
  },
  {
    id: 'faury', nom: 'Pierre Faury', epoque: 'XXIe siècle', lieu: 'France', tags: ['Contemporain', 'France', 'Poésie'],
    genre: 'Poésie dite, éloquence', archetype: 'conteur',
    discours: { titre: 'La théorie des cordes (recueil)', date: '5 mars 2025', cadre: 'Premier recueil, éditions J’ai lu' },
    contexte: 'Ancien étudiant de HEC, il y remporte son premier concours d’éloquence. Il est finaliste du concours national d’éloquence en 2022 et en 2023, et crée le prix Cyrano, un concours d’éloquence ouvert au plus grand nombre. Connu pour ses poèmes diffusés sur les réseaux sociaux, il compte plus de 300 000 abonnés sur Instagram (chiffre de janvier 2025).',
    parcours: 'Source principale : un article de Livres Hebdo du 31 janvier 2025, publié en contenu sponsorisé par son éditeur : à lire avec ce recul. L’article ne donne aucun chiffre de ventes.',
    techniques: [
      { nom: 'Du concours à la vidéo courte', texte: 'Son parcours relie deux mondes : la compétition d’éloquence (parole préparée, jugée) et la vidéo courte des réseaux (une image, une idée, une chute). Les deux demandent de tenir un auditoire en peu de temps.' }
    ],
    essai: { label: 'Un poème-minute', type: 'mot', duree: 60, consigne: 'Choisis un mot. En 1 minute : une image concrète, une idée, puis une chute qui retourne le sens du mot. Dis-le comme si tu le lisais à quelqu’un en face.' },
    sources: [{ t: 'Livres Hebdo : Pierre Faury (contenu sponsorisé)', u: 'https://www.livreshebdo.fr/article/pierre-faury-le-petit-prince-de-leloquence-francaise' }, { t: 'Goodreads : La théorie des cordes', u: 'https://www.goodreads.com/book/show/222533465-la-th-orie-des-cordes' }]
  },
  {
    id: 'perier', nom: 'Bertrand Périer', epoque: 'XXIe siècle', lieu: 'France', tags: ['Contemporain', 'France', 'Pédagogie', 'Droit'],
    genre: 'Art oratoire, formation', archetype: 'pedagogue',
    discours: { titre: 'La parole est un sport de combat', date: '2017', cadre: 'Livre, éditions Jean-Claude Lattès' },
    contexte: 'Avocat au barreau de Paris (serment en 1999), puis avocat au Conseil d’État et à la Cour de cassation depuis 2016. Il enseigne l’art oratoire à Sciences Po, à HEC Paris et au Collège de Droit de l’Université Paris-I Panthéon Sorbonne. Depuis 2013, il est formateur dans Eloquentia, programme de formation et concours d’art oratoire organisé par Stéphane de Freitas à l’Université Paris-VIII, en Seine-Saint-Denis. Il apparaît dans le documentaire « À voix haute : La Force de la parole » (2016).',
    parcours: 'Formation : Sciences Po (1993), DEA de droit à Paris-II Panthéon-Assas (1995), diplôme de HEC Paris (1997). Il a été membre du jury du « Grand Oral » sur France 2 en 2019 et 2020. Selon le manuel de l’appli, il se décrit comme « un grand timide » longtemps, réconcilié avec la parole en saisissant toutes les occasions de s’exercer.',
    oeuvres: [
      { titre: 'La parole est un sport de combat', date: '2017', note: 'Jean-Claude Lattès.' },
      { titre: 'Sur le bout de la langue', date: '2019', note: 'Jean-Claude Lattès.' },
      { titre: 'Sauve qui parle : quand la parole change la vie', date: '2021', note: 'Jean-Claude Lattès.' },
      { titre: 'Débattre : Comment nous reparler ?', date: '2022', note: 'Avec Guillaume Prigent, Flammarion.' },
      { titre: 'La parole, pour le meilleur et pour le pire', date: '2023', note: 'Jean-Claude Lattès.' },
      { titre: 'Prendre la parole, pas de panique', date: '2024', note: 'Magenta.' },
      { titre: 'Sur parole !', date: '2024', note: 'Avec Éric de Moulins-Beaufort, Salvator.' }
    ],
    techniques: [
      { nom: 'L’éloquence se travaille', texte: 'Même les grands orateurs « font leurs gammes comme des pianistes » : le don inné est un mythe qui paralyse. Chaque occasion de parler est un entraînement.' },
      { nom: 'Apprivoiser le trac', texte: 'Le trac est la tension entre l’envie de bien faire et le risque de se décevoir. On ne le supprime pas : visualisation, respiration, et premiers et derniers mots connus par cœur.' },
      { nom: 'L’improvisation préparée (le slalom)', texte: 'Premiers mots, idées-clés et derniers mots sont préparés ; entre les « portes », la parole naît dans l’instant. Une demi-feuille suffit.' },
      { nom: 'La voix comme instrument', texte: 'Toutes les voix sont belles à condition d’être variées : fuir la voix monochrome, annoter son texte comme une partition (silences, accélérations, accents).' },
      { nom: 'Chasser les mots parasites', texte: 'Le « buzzer à mots interdits » : imaginer un son insupportable à chaque « euh », « genre », « du coup », et le remplacer par un silence.' }
    ],
    essai: { label: 'Le chroniqueur radio', type: 'debat', duree: 120, consigne: 'Choisis un fait d’actualité qui t’a marqué. Raconte-le factuellement (30 s), analyse ce qu’il révèle (45 s), puis donne ton opinion argumentée (45 s), sans texte écrit. Enregistre-toi.' },
    sources: [{ t: 'Wikipedia : Bertrand Périer', u: 'https://fr.wikipedia.org/wiki/Bertrand_P%C3%A9rier' }]
  }

];

window.AO_DATA.archetypes = {
  architecte: {
    nom: 'L’Architecte', formule: 'Logos d’abord, ethos ensuite',
    texte: 'Tu convaincs en construisant : définitions nettes, plan visible, preuves dans le bon ordre. Ton public sait toujours où il en est.',
    force: 'Clarté de la structure, rigueur des preuves.',
    risque: 'Un discours froid ou trop dense. Les émotions et les images viennent en dernier.',
    travail: 'Ajoute un récit court par partie et vérifie que ta voix varie autant que ton plan.'
  },
  pedagogue: {
    nom: 'Le Pédagogue', formule: 'Logos d’abord, pathos ensuite',
    texte: 'Tu expliques, tu compares, tu rends concret. Tes arguments passent par des images et des contrastes qui parlent.',
    force: 'Faire comprendre vite, sans simplifier à l’excès.',
    risque: 'Expliquer sans conclure : le public comprend mais n’agit pas.',
    travail: 'Termine toujours par une demande précise : ce que le public doit faire ou décider.'
  },
  garant: {
    nom: 'Le Garant', formule: 'Ethos d’abord, logos ensuite',
    texte: 'On te fait confiance avant même de t’avoir compris. Ta posture, ton calme et ta cohérence portent le message.',
    force: 'Autorité tranquille, tenue sous pression.',
    risque: 'Compter sur ta réputation et négliger la preuve ou l’émotion.',
    travail: 'Donne un exemple concret et un chiffre par idée : la confiance se confirme par les faits.'
  },
  rassembleur: {
    nom: 'Le Rassembleur', formule: 'Ethos d’abord, pathos ensuite',
    texte: 'Tu parles à un « nous ». Tu fais sentir au public qu’il fait partie de quelque chose et qu’il peut agir.',
    force: 'Mobiliser, donner un cap commun.',
    risque: 'Rester au niveau des valeurs sans moyens précis.',
    travail: 'Ajoute trois actions concrètes et un public ciblé pour chaque appel.'
  },
  tribun: {
    nom: 'Le Tribun', formule: 'Pathos d’abord, ethos ensuite',
    texte: 'Tu portes une énergie qui entraîne : rythme, répétition, images fortes. Tu transformes une salle en foule.',
    force: 'Intensité, mémorabilité, sens du moment.',
    risque: 'L’emphase qui fatigue, ou l’énergie sans preuves.',
    travail: 'Travaille les pauses et les passages calmes : l’intensité n’existe que par contraste.'
  },
  conteur: {
    nom: 'Le Conteur', formule: 'Pathos d’abord, logos ensuite',
    texte: 'Tu passes par les histoires pour faire entendre une idée. Ton public retient les scènes, puis la leçon qui va avec.',
    force: 'Mémorisation, identification, ton humain.',
    risque: 'Une belle histoire qui ne prouve rien, ou qui s’éternise.',
    travail: 'Vérifie que chaque récit sert une seule idée, annoncée avant ou résumée juste après.'
  }
};
