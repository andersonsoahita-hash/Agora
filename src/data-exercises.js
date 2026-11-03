window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.durations = [30, 60, 120, 300];

window.AO_DATA.exerciseTypes = [
  { id: 'argumenter', nom: 'Argumenter une idée', modele: 'PREP', aide: 'Point → Raison → Exemple → Point',
    sujets: ['Tout le monde devrait apprendre à parler en public', 'Le téléphone devrait être interdit en réunion', 'Le luxe est un art avant d’être un commerce', 'Madagascar a un atout sous-estimé', 'Travailler à distance rend meilleur', 'Il faut échouer pour apprendre', 'Un bon leader sait écouter avant de parler', 'Les études ne suffisent plus'] },
  { id: 'mot', nom: 'Parler à partir d’un mot', modele: 'Définir → Exemple → Lien avec ta vie', aide: 'Improvisation pure, sans recherche : tire un mot, prends dix secondes de silence, puis définis-le, donne un exemple et relie-le à ta vie.',
    sujets: ['Confiance', 'Héritage', 'Rareté', 'Patience', 'Frontière', 'Lenteur', 'Élégance', 'Risque', 'Mémoire', 'Silence'] },
  { id: 'recit', nom: 'Raconter une histoire', modele: 'Situation → Obstacle → Action → Leçon', aide: 'Une scène, un détail concret, une leçon.',
    sujets: ['Une fois où j’ai eu peur de parler', 'Un échec qui m’a appris quelque chose', 'La rencontre qui a changé mon parcours', 'Un voyage qui m’a marqué', 'Mon premier jour dans un lieu inconnu'] },
  { id: 'debat', nom: 'Défendre un camp', modele: 'Thèse → 2 arguments → Réfutation → Conclusion', aide: 'Un camp t’est imposé (POUR ou CONTRE), même s’il n’est pas le tien. Anticipe l’objection la plus forte.',
    sujets: ['Les émissions de télé-réalité devraient être diffusées après 22 h', 'L’intelligence artificielle devrait être autorisée dans la création artistique', 'La semaine de travail devrait durer quatre jours', 'Le luxe peut être durable', 'La prise de parole en public devrait être obligatoire à l’école', 'Les réseaux sociaux devraient être interdits avant 15 ans', 'Le télétravail devrait être un droit', 'Les marques de luxe devraient publier leurs prix de fabrication', 'Il faut rendre le vote obligatoire', 'L’uniforme devrait être obligatoire à l’école', 'La publicité devrait être interdite dans l’espace public', 'Les stages non rémunérés devraient être interdits', 'Il faut limiter le tourisme de masse', 'Les études supérieures devraient être gratuites', 'Les influenceurs devraient être soumis aux mêmes règles que les médias', 'Les cryptomonnaies sont l’avenir de l’argent', 'Il faut apprendre à coder dès le primaire', 'La seconde main devrait remplacer le neuf dans la mode', 'Les entreprises devraient imposer des quotas de diversité', 'Le salaire de chacun devrait être public', 'Le téléphone devrait être interdit en réunion', 'Les notes à l’école devraient être supprimées', 'Il faut taxer davantage les produits de luxe', 'La contrefaçon fait du bien aux grandes marques', 'Madagascar devrait miser d’abord sur le tourisme', 'Les jeunes diplômés devraient d’abord travailler à l’étranger', 'Le service civique devrait être obligatoire', 'Les voitures devraient être interdites en centre-ville', 'On devrait pouvoir noter son employeur publiquement', 'L’expérience compte plus que le diplôme', 'Les musées devraient être gratuits', 'Le bénévolat devrait compter dans les études', 'Il faut limiter les écrans à la maison', 'Le client n’a pas toujours raison', 'La concurrence est plus utile que la coopération'] },
  { id: 'qr', nom: 'Répondre à une question', modele: 'Reformuler → Répondre → Conclure', aide: 'Une idée centrale, pas plus.',
    sujets: ['Pourquoi devrions-nous vous écouter ?', 'Quelle est votre plus grande faiblesse ?', 'Qu’est-ce qui vous différencie ?', 'Pourquoi ce projet maintenant ?', 'Et si vous vous trompiez ?'] },
  { id: 'connecteurs', nom: 'Relier ses idées (5 étapes)', modele: 'Annoncer → Prévenir → Concéder → Illustrer → Reformuler', aide: 'Un connecteur par étape : « je voudrais dire… », « attention, je ne dis pas que… », « certes… mais », « prenons le cas de… », « autrement dit… ».',
    sujets: ['Qu’est-ce que le bonheur ?', 'Faut-il toujours dire la vérité ?', 'La réussite se mérite-t-elle ?', 'Parler en public est-il un don ?', 'Faut-il apprendre à perdre ?', 'Le luxe est-il utile ?', 'Que vaut une promesse ?'] },
  { id: 'discours', nom: 'Discours complet', modele: 'Ouverture → Plan → 3 parties → Appel', aide: 'Annonce ton plan, finis par une demande.',
    sujets: ['Pourquoi j’ai écrit ce livre', 'Ce que je veux transmettre à ma génération', 'Présenter un projet à un jury', 'Un discours de remerciement'] },
  { id: 'express', nom: 'Recherche express', modele: 'Chercher → Structurer → Expliquer', aide: 'Tire un thème, cherche l’essentiel sans IA, structure, puis explique en un cinquième du temps de préparation.', sujets: [] }
];

window.AO_DATA.speechSteps = [
  { nom: 'Ouverture', objectif: 'Capter, situer, annoncer', tip: 'Question, chiffre, récit ou apostrophe.' },
  { nom: 'Annonce du plan', objectif: 'Donner la carte', tip: '« Trois points : … »' },
  { nom: 'Partie 1', objectif: 'Argument + preuve + lien', tip: 'Une idée, un exemple.' },
  { nom: 'Partie 2', objectif: 'Argument + preuve + lien', tip: 'Varie le rythme par un récit.' },
  { nom: 'Partie 3', objectif: 'Argument + objection traitée', tip: 'Réponds à l’objection la plus forte.' },
  { nom: 'Péroraison', objectif: 'Rappeler, appeler, finir court', tip: 'Dernière phrase courte, pause avant.' }
];

window.AO_DATA.recordTips = {
  artifact: 'Dans cette version, enregistre avec le Dictaphone de ton téléphone (ou une autre appli), puis importe le fichier ici.',
  standalone: 'Appuie sur Enregistrer, parle, puis arrête. Autorise le micro quand le navigateur le demande.'
};
