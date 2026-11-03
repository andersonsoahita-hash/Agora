/* Objections : banque de relances pour s'entraîner à répondre. Aucune IA : tirage au sort et repérage de mots. */
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.objections = {
  generic: [
    'Un exemple concret, s’il te plaît ?', 'Et si on te répondait exactement l’inverse ?', 'Qui te dit que tu as raison ?', 'Pourquoi devrait-on te croire ?',
    'Tu as une preuve, un chiffre, une source ?', 'Et si ce n’était qu’une exception ?', 'Quel est le plus gros risque de ce que tu proposes ?', 'Qui y perd, dans ton raisonnement ?',
    'Résume-moi ça en une phrase. Maintenant.', 'Tu tournes autour : quelle est ta thèse, exactement ?', 'Et dans dix ans, est-ce que ça tient encore ?', 'Si tu avais tort, ce serait sur quel point ?',
    'Quel argument ton adversaire utiliserait-il contre toi ?', 'Tu parles pour qui ? Pour tout le monde, vraiment ?', 'Et concrètement, qui paie ?', 'Ça marche peut-être ailleurs. Pourquoi ici ?',
    'Belle idée. Comment la met-on en œuvre lundi matin ?', 'Tu confonds peut-être cause et conséquence. Démontre-moi le contraire.', 'Admettons. Et alors ?', 'On dirait que tu te contredis. Lequel des deux tient ?',
    'Donne-moi un contre-exemple à ton propre argument.', 'Qu’est-ce que tu ne dis pas, et qui pourrait changer la conclusion ?', 'On t’a déjà répondu ça mille fois. Qu’est-ce que tu ajoutes ?', 'Qu’est-ce qui me ferait changer d’avis ?',
    'Trop abstrait. Un visage, une histoire, un lieu.', 'Comment saurait-on que tu as raison ? Quelle mesure ?', 'Tu as dix secondes : pourquoi est-ce important pour moi ?', 'Et si on t’interdisait cet argument, que te resterait-il ?'
  ],
  noExample: ['Tu n’as pas encore donné d’exemple. Un cas précis, maintenant.', 'Je n’ai entendu aucun exemple. Raconte-moi une situation réelle.'],
  noNumber: ['Je n’ai entendu aucun chiffre. Donne-moi un ordre de grandeur.', 'Rien de chiffré jusqu’ici. Quelle donnée soutient ton propos ?'],
  /* re : mots repérés dans ta transcription ; {m} = le mot que tu as dit */
  kw: [
    { id: 'gen', re: '\\b(toujours|jamais|tout le monde|tous les|personne ne|aucun|systématiquement|forcément|partout)\\b', lines: ['Tu as dit « {m} ». Un seul contre-exemple suffit à te contredire. Tu en as un en tête ?', '« {m} » : c’est un mot fort. Tu es sûr qu’il n’y a aucune exception ?'] },
    { id: 'avis', re: '\\b(je pense que|je crois que|à mon avis|je trouve que|pour moi|j’ai l’impression)\\b', lines: ['Tu as dit « {m} ». C’est ton avis. Qu’est-ce qui te permet de l’affirmer ?', '« {m} »… et les faits, qu’est-ce qu’ils disent ?'] },
    { id: 'evid', re: '\\b(évidemment|bien sûr|c’est évident|clairement|il est clair|naturellement|tout le monde sait)\\b', lines: ['Tu as dit « {m} ». Si c’est si évident, démontre-le.', '« {m} » : ce qui est évident pour toi ne l’est pas pour moi. Explique.'] },
    { id: 'quant', re: '\\b(beaucoup|énormément|de plus en plus|la plupart|une majorité|souvent|de nombreux)\\b', lines: ['Tu as dit « {m} ». Combien exactement ? Cite un chiffre ou une source.', '« {m} », c’est vague. Quel ordre de grandeur ?'] },
    { id: 'hes', re: '\\b(un peu|peut-être|on va dire|en quelque sorte|disons|plus ou moins)\\b', lines: ['Tu as dit « {m} ». Tu hésites. Quelle est ta position, sans détour ?', '« {m} » : on ne te suit pas si tu n’es pas sûr. Affirme.'] },
    { id: 'auto', re: '\\b(les experts|des études|une étude|les spécialistes|il paraît|on dit que|les scientifiques)\\b', lines: ['Tu as dit « {m} ». Lesquels ? Nomme-les.', '« {m} » : cite la source précise, sinon ça ne compte pas.'] },
    { id: 'caus', re: '\\b(donc|par conséquent|c’est pour ça que|c’est pourquoi|à cause de|grâce à)\\b', lines: ['Tu as dit « {m} ». Qu’est-ce qui prouve que l’un cause l’autre, et que ce n’est pas une coïncidence ?', '« {m} » : ton raisonnement saute une étape. Laquelle ?'] },
    { id: 'arg', re: '\\b(gratuit|gratuitement|moins cher|économies?|coûte|rentable|rentabilité|investir)\\b', lines: ['Tu as dit « {m} ». Qui paie, au final ? Chiffre-moi ça.', '« {m} » : sur quelle durée, et avec quel retour ?'] },
    { id: 'devoir', re: '\\b(il faut|on doit|il faudrait|on devrait|on devra|il faudra)\\b', lines: ['Tu as dit « {m} ». Qui décide de ce qu’il faut ? Et si on refuse ?', '« {m} » : pourquoi ce serait un devoir ?'] },
    { id: 'sup', re: '\\b(le meilleur|la meilleure|le pire|le plus grand|la seule|le seul|unique|incontournable)\\b', lines: ['Tu as dit « {m} ». Par rapport à quoi ? Compare.', '« {m} » : selon quel critère ?'] },
    { id: 'tics', re: '\\b(du coup|en fait|voilà|genre|bref|enfin)\\b', lines: ['Tu as dit « {m} ». Va droit au but : la phrase suivante, sans remplissage.'], rep: 3 }
  ]
};
