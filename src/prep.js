/* ---------- Préparer : discours et débat ---------- */
var prepUI = { mode: 'debat', topic: '', side: 'pour', dur: 120, min: 2, busy: false, prog: '', err: '', cur: null, tab: 'mine' };
var TOPOI = [
  ['Efficacité', 'Est-ce que cela marche en pratique ?', 'évaluations publiées et retours d’expérience', 'Cour des comptes, OCDE, études évaluées par des pairs'],
  ['Coût et économie', 'Qui paie, combien, pour quel gain ?', 'budgets, coûts et gains chiffrés', 'INSEE, Eurostat, Banque mondiale'],
  ['Justice et droits', 'Est-ce juste ? Qui y gagne, qui y perd ?', 'textes de loi et décisions de justice', 'Légifrance, Conseil constitutionnel, Défenseur des droits'],
  ['Effets sur les personnes', 'Que devient la santé, l’éducation, le bien-être ?', 'études et statistiques sur la population concernée', 'OMS, Santé publique France, revues scientifiques'],
  ['Long terme', 'Que se passe-t-il dans dix ans ?', 'projections et scénarios', 'INSEE, ONU, organismes spécialisés du sujet'],
  ['Comparaison', 'Que font les autres pays, avec quels résultats ?', 'comparaisons internationales', 'Eurostat, OCDE, Banque mondiale']
];

function arr(x) { return Array.isArray(x) ? x : []; }
function plain(s) { return String(s == null ? '' : s); }

/* ----- trames sans IA ----- */
function trameDebat(topic, side) {
  var pour = side === 'pour';
  function args(forSide) {
    return TOPOI.slice(0, 4).map(function (t) {
      return {
        titre: (forSide ? 'Pour' : 'Contre') + ' · ' + t[0],
        raisonnement: 'Montrer que, sur ce plan (« ' + t[1] + ' »), ' + (forSide ? 'la proposition apporte un bénéfice net' : 'la proposition crée plus de problèmes qu’elle n’en résout') + '. À toi de rédiger l’argument en une phrase, puis de le prouver.',
        preuve: { type: t[2], indicateur: 'à choisir selon le sujet', organisme: t[3], requete: topic + ' ' + t[2] },
        exemple: null
      };
    });
  }
  function plan(forSide) {
    return [
      { partie: 'Ouverture', contenu: 'Une accroche concrète, puis la définition des mots clés de « ' + topic + ' ».' },
      { partie: 'Thèse', contenu: 'Une phrase : ' + (forSide ? 'je suis pour' : 'je suis contre') + ', parce que…' },
      { partie: 'Argument 1', contenu: 'Affirmation, preuve chiffrée vérifiée, exemple réel.' },
      { partie: 'Argument 2', contenu: 'Même structure.' },
      { partie: 'Argument 3', contenu: 'Même structure.' },
      { partie: 'Réfutation', contenu: 'Reformuler fidèlement l’objection la plus forte, puis répondre.' },
      { partie: 'Conclusion', contenu: 'Reprendre la thèse en une phrase et finir par un appel précis.' }
    ];
  }
  return {
    question: topic,
    definitions: [],
    criteres: 'Trame sans IA : choisis, pour chaque angle, la preuve que tu peux vraiment vérifier.',
    mine: { camp: pour ? 'pour' : 'contre', these: '', plan: plan(pour), arguments: args(pour), objections_adverses_prevues: [] },
    adv: { camp: pour ? 'contre' : 'pour', these: '', plan: plan(!pour), arguments: args(!pour), points_faibles: [] },
    points_de_friction: TOPOI.slice(0, 4).map(function (t) { return { theme: t[0], ma_ligne: '', sa_ligne: '' }; }),
    a_verifier: ['Tous les chiffres : cette trame n’en contient aucun.']
  };
}
function nParts(dur) { var m = dur / 60; return Math.max(3, Math.min(8, Math.round(m / 2.5))); }
function trameSpeech(topic, dur) {
  var m = dur / 60, parts;
  if (m <= 1) parts = [['Accroche', 'Une phrase ou une image qui rend « ' + topic + ' » concret.'], ['Idée centrale', 'Une seule idée, dite simplement.'], ['Exemple', 'Un cas réel, avec un détail.'], ['Appel', 'Ce que tu demandes à l’auditoire.']];
  else if (m <= 2) parts = [['Accroche', 'Une phrase ou une image qui rend « ' + topic + ' » concret.'], ['Problème', 'Ce qui ne va pas, en une minute de réalité.'], ['Thèse', 'Ta position en une phrase.'], ['Argument 1', 'Affirmation, preuve, exemple.'], ['Argument 2', 'Affirmation, preuve, exemple.'], ['Appel', 'Une demande précise.']];
  else {
    var k = nParts(dur), per = Math.max(1, Math.round(m * 0.7 / k));
    parts = [['Ouverture', 'Accroche concrète sur « ' + topic + ' » (environ 1 min).'], ['Annonce du plan', 'Les parties, nommées.'], ['Problème', 'Pourquoi le sujet compte, maintenant.']];
    for (var n = 1; n <= k; n++) parts.push(['Partie ' + n, 'Argument, preuve, exemple (environ ' + per + ' min).']);
    parts.push(['Objection', 'La plus forte, reformulée fidèlement, puis ta réponse.'], ['Appel', 'Une demande précise, puis une dernière phrase marquante.']);
  }
  return {
    titre: topic, mots: Math.round(m * 130), accroche: '',
    plan: parts.map(function (x) { return x[0]; }),
    parties: parts.map(function (x) { return { partie: x[0], texte: '[À écrire] ' + x[1] }; }),
    a_verifier: ['Tout chiffre ou fait que tu ajoutes.'],
    conseils_oraux: ['Une idée par phrase.', 'Marque un silence avant chaque partie.']
  };
}

/* ----- prompts ----- */
var RULES_J = ' Réponds en français, uniquement en JSON valide.', RULES_T = ' Réponds uniquement par le texte à dire, sans titre ni commentaire.';
var RULES = 'RÈGLES STRICTES. N’invente AUCUN chiffre, AUCUNE date précise, AUCUNE citation et AUCUN titre de rapport. Quand un chiffre serait utile, écris « [CHIFFRE À VÉRIFIER] » et indique le type d’indicateur et l’organisme qui le publie habituellement (par exemple INSEE, Eurostat, OMS, Banque mondiale, OCDE, Cour des comptes, Légifrance), sans citer de valeur. Ne cite un cas réel que s’il est célèbre et que tu en es certain ; sinon mets null. Réponds en français.';
function promptDebat(topic, side) {
  return 'DEBAT. Je dois préparer un débat sur : « ' + topic + ' ». Mon camp : ' + (side === 'pour' ? 'POUR' : 'CONTRE') + '.\n' + RULES + RULES_J + '\n' +
    'Donne ce JSON exact : {"question":"la proposition reformulée en question tranchable","definitions":["mot : définition neutre"],"criteres":"le vrai point de clivage du débat","mine":{"camp":"' + side + '","these":"…","plan":[{"partie":"Ouverture","contenu":"…"},{"partie":"Thèse","contenu":"…"},{"partie":"Argument 1","contenu":"…"},{"partie":"Argument 2","contenu":"…"},{"partie":"Argument 3","contenu":"…"},{"partie":"Réfutation","contenu":"…"},{"partie":"Conclusion","contenu":"…"}],"arguments":[{"titre":"…","raisonnement":"2 à 3 phrases","preuve":{"type":"…","indicateur":"…","organisme":"…","requete":"requête de recherche précise"},"exemple":"cas réel célèbre ou null"}],"objections_adverses_prevues":[{"objection":"…","reponse":"…"}]},"adv":{"camp":"' + (side === 'pour' ? 'contre' : 'pour') + '","these":"…","plan":[…même forme…],"arguments":[…même forme, avec preuve…],"points_faibles":["…"]},"points_de_friction":[{"theme":"…","ma_ligne":"…","sa_ligne":"…"}],"a_verifier":["ce que je dois vérifier avant de parler"]}. 3 arguments par camp, 3 objections prévues, 3 points de friction. Les arguments de l’adversaire doivent être les MEILLEURS possibles, pas une caricature.';
}
function promptSpeech(topic, dur) {
  var words = Math.round(dur / 60 * 130);
  return 'DISCOURS. Écris un discours à dire à voix haute sur : « ' + topic + ' ». Durée : ' + (dur / 60) + ' minute(s), soit environ ' + words + ' mots au total.\n' + RULES + RULES_J + '\n' +
    'Style oral : phrases courtes, connecteurs naturels (donc, car, c’est-à-dire), un exemple concret, une chute. Donne ce JSON : {"titre":"…","mots":' + words + ',"accroche":"première phrase","plan":["…"],"parties":[{"partie":"Accroche","texte":"texte à dire"},{"partie":"…","texte":"…"}],"a_verifier":["faits ou chiffres à vérifier avant de parler"],"conseils_oraux":["2 ou 3 conseils de diction, pauses et gestes pour CE discours"]}.';
}
function promptOutline(topic, dur, k) {
  var w = Math.round(dur / 60 * 130);
  return 'PLAN. Prépare le plan d’un discours à dire à voix haute sur : « ' + topic + ' ». Durée : ' + (dur / 60) + ' minutes, soit environ ' + w + ' mots, en exactement ' + k + ' parties (l’ouverture et l’appel sont plus courts).\n' + RULES + RULES_J + '\nJSON : {"titre":"…","accroche":"première phrase","plan":[{"partie":"nom","mots":300,"idee":"l’idée de la partie en une phrase"}],"a_verifier":["faits ou chiffres à vérifier"],"conseils_oraux":["2 ou 3 conseils pour CE discours"]}. Le total des mots doit être proche de ' + w + '.';
}
function promptPart(topic, o, i) {
  var pl = o.plan, q = pl[i];
  return 'PARTIE. Discours oral sur : « ' + topic + ' ». Plan : ' + pl.map(function (x, n) { return (n + 1) + '. ' + plain(x.partie) + ' (' + plain(x.idee) + ')'; }).join(' ; ') + '.\n' + RULES + RULES_T + '\nÉcris le texte à dire de la partie ' + (i + 1) + ' « ' + plain(q.partie) + ' », environ ' + (+q.mots || 200) + ' mots. Style oral : phrases courtes, connecteurs naturels, un exemple concret. ' + (i > 0 ? 'Enchaîne avec la partie précédente sans la répéter ni résumer.' : 'Commence par l’accroche.') + (i < pl.length - 1 ? '' : ' Termine par une dernière phrase marquante et un appel précis.');
}
function dossierPrompt(it) {
  var d = it.data, camp = d.mine ? d.mine.camp : it.side;
  return 'Je prépare un débat : « ' + it.topic + ' ». Mon camp : ' + camp + '.\nFais une recherche web et donne-moi un dossier de preuves vérifiées :\n1. Pour chacun de mes arguments (' + arr(d.mine && d.mine.arguments).map(function (a) { return '« ' + plain(a.titre) + ' »'; }).join(', ') + ') : 1 ou 2 chiffres récents, avec date, source exacte et lien.\n2. Pour les arguments les plus forts de l’adversaire : le chiffre ou le fait qu’il utilisera, avec sa source.\n3. Ce qui est contesté ou incertain.\nN’invente rien : indique clairement ce que tu n’as pas pu vérifier.';
}

/* ----- génération ----- */
function prepFinish(data, ai, kind, topic) {
  var it = { id: uid(), date: today(), kind: kind, topic: topic, side: prepUI.side, dur: prepUI.dur, ai: ai, data: data, proofs: {} };
  S.prep.unshift(it); S.prep = S.prep.slice(0, 25); persist();
  prepUI.cur = it.id; prepUI.tab = 'mine'; prepUI.busy = false; render(); window.scrollTo(0, 0);
}
function prepGo() {
  var topic = (prepUI.topic || '').trim(); if (topic.length < 4 || prepUI.busy) return;
  var kind = prepUI.mode, side = prepUI.side, dur = prepUI.dur;
  var long = kind === 'discours' && dur > 300;
  var tr = function () { return kind === 'debat' ? trameDebat(topic, side) : trameSpeech(topic, dur); };
  if (!cap.sample) { prepFinish(tr(), false, kind, topic); return; }
  prepUI.busy = true; prepUI.err = ''; prepUI.prog = ''; render();
  if (long) { prepLong(topic, dur, tr); return; }
  var p = kind === 'debat' ? promptDebat(topic, side) : promptSpeech(topic, dur);
  cap.sample.json(p, { modelTier: 'default', cache: false }).then(function (r) {
    var ok = kind === 'debat' ? (r && r.mine && r.adv && Array.isArray(r.mine.arguments) && Array.isArray(r.adv.arguments)) : (r && Array.isArray(r.parties) && r.parties.length);
    if (!ok) throw new Error('forme');
    prepFinish(r, true, kind, topic);
  }).catch(function () {
    prepUI.err = 'L’IA n’a pas répondu correctement. Voici une trame sans IA à la place ; tu peux réessayer.';
    prepFinish(tr(), false, kind, topic);
  });
}

function prepLong(topic, dur, tr) {
  var k = nParts(dur) + 2; prepUI.prog = 'Plan du discours…'; render();
  var fail = function () { prepUI.err = 'L’IA n’a pas répondu correctement. Voici une trame sans IA à la place ; tu peux réessayer.'; prepUI.prog = ''; prepFinish(tr(), false, 'discours', topic); };
  cap.sample.json(promptOutline(topic, dur, k), { modelTier: 'default', cache: false }).then(function (o) {
    if (!o || !Array.isArray(o.plan) || o.plan.length < 2) throw new Error('plan');
    var parts = [], n = o.plan.length, missing = 0;
    function next(i) {
      if (i >= n) return Promise.resolve();
      prepUI.prog = 'Partie ' + (i + 1) + ' sur ' + n + ' : ' + plain(o.plan[i].partie); render();
      return cap.sample(promptPart(topic, o, i), { modelTier: 'default', cache: false }).then(function (r) {
        parts.push({ partie: plain(o.plan[i].partie), texte: plain(r && r.text).trim() || '[Partie non générée : relance.]' });
      }, function () { missing++; parts.push({ partie: plain(o.plan[i].partie), texte: '[Cette partie n’a pas pu être générée : relance.]' }); }).then(function () { return next(i + 1); });
    }
    return next(0).then(function () {
      prepUI.prog = ''; if (missing) prepUI.err = missing + ' partie(s) n’ont pas pu être générées : elles sont marquées dans le texte.';
      prepFinish({ titre: o.titre || topic, mots: Math.round(dur / 60 * 130), accroche: o.accroche || '', plan: o.plan.map(function (x) { return plain(x.partie); }), parties: parts, a_verifier: arr(o.a_verifier), conseils_oraux: arr(o.conseils_oraux) }, true, 'discours', topic);
    });
  }).catch(fail);
}

/* ----- vues ----- */
function vPrep() {
  if (prepUI.cur) { var it = byId(S.prep, prepUI.cur); if (it) return it.kind === 'debat' ? vDebat(it) : vSpeech(it); prepUI.cur = null; }
  var h = '<div class="top"><h1>Préparer</h1></div><div class="stack">';
  h += '<div class="row"><button class="chip' + (prepUI.mode === 'debat' ? ' on' : '') + '" data-act="prep-mode" data-v="debat">Débat</button><button class="chip' + (prepUI.mode === 'discours' ? ' on' : '') + '" data-act="prep-mode" data-v="discours">Discours</button></div>';
  h += '<div class="card"><div class="eyebrow">' + (prepUI.mode === 'debat' ? 'Thème du débat' : 'Thème du discours') + '</div>';
  h += '<textarea id="prepTopic" maxlength="200" placeholder="' + (prepUI.mode === 'debat' ? 'Ex. : Faut-il limiter les réseaux sociaux avant 15 ans ?' : 'Ex. : Pourquoi apprendre à parler en public') + '">' + esc(prepUI.topic) + '</textarea>';
  if (prepUI.mode === 'debat') {
    h += '<div class="eyebrow" style="margin-top:12px">Ton camp</div><div class="row" style="margin-top:6px"><button class="chip' + (prepUI.side === 'pour' ? ' on' : '') + '" data-act="prep-side" data-v="pour">Pour</button><button class="chip' + (prepUI.side === 'contre' ? ' on' : '') + '" data-act="prep-side" data-v="contre">Contre</button></div>';
  } else {
    h += '<div class="eyebrow" style="margin-top:12px">Durée</div><div style="margin-top:6px"><b id="prepDurLbl">' + durText(prepUI.min) + '</b><input type="range" id="prepDur" min="1" max="20" step="1" value="' + prepUI.min + '" aria-label="Durée du discours en minutes" style="width:100%;margin-top:8px;accent-color:var(--accent)"></div>' +
      '<p class="small muted" style="margin:8px 0 0" id="prepDurNote">' + (cap.sample && prepUI.min > 5 ? 'Au-delà de 5 min, le discours est écrit partie par partie (plus fiable, mais plusieurs échanges avec Claude).' : '') + '</p>';
  }
  h += '<div style="margin-top:14px"><button class="btn" data-act="prep-go"' + (prepUI.busy ? ' disabled' : '') + '>' + (prepUI.busy ? (prepUI.prog || 'Claude prépare…') : (prepUI.mode === 'debat' ? 'Préparer mon débat' : 'Écrire le discours')) + '</button></div>';
  if (prepUI.err) h += '<p class="tag-warn small" style="margin:10px 0 0">' + esc(prepUI.err) + '</p>';
  h += '</div>';
  h += '<div class="callout info small">' + (cap.sample
    ? 'Claude rédige la structure et les arguments des deux camps. <b>Il ne peut pas vérifier de chiffres en direct</b> : il n’en invente aucun et indique où chercher. Les chiffres vérifiés, c’est toi qui les saisis avec leur source, ou tu demandes un dossier chiffré dans la conversation avec Claude (bouton fourni dans chaque débat).'
    : 'Hors Claude, l’appli te donne une <b>trame</b> (structure et angles à remplir), sans texte généré. Aucun chiffre n’est inventé : tu saisis les tiens avec leur source.') + '</div>';
  if (S.prep.length) {
    h += '<h2>Mes préparations</h2>';
    S.prep.forEach(function (it) {
      h += '<button class="card tap" data-act="prep-open" data-v="' + it.id + '"><div class="eyebrow">' + (it.kind === 'debat' ? 'Débat · ' + esc(it.side) : 'Discours') + ' · ' + esc(it.date) + (it.ai ? '' : ' · trame') + '</div><h3>' + esc(it.topic) + '</h3></button>';
    });
  }
  return h + '</div>';
}
function durText(m) { return m + ' min · environ ' + (m * 130) + ' mots'; }
function planHtml(plan) {
  return '<ol style="margin:8px 0 0;padding-left:20px">' + arr(plan).map(function (p) { return '<li><b>' + esc(p.partie) + '.</b> ' + esc(p.contenu) + '</li>'; }).join('') + '</ol>';
}
function proofFields(it, key) {
  var p = it.proofs[key] || {};
  function f(name, label, ph) { return '<label class="small muted" style="display:block;margin-top:6px">' + label + '<input type="text" class="pf" data-id="' + it.id + '" data-k="' + key + '" data-f="' + name + '" value="' + esc(p[name] || '') + '" placeholder="' + ph + '"></label>'; }
  return '<div style="margin-top:10px;border-top:1px dashed var(--line);padding-top:8px"><div class="eyebrow">Ma preuve vérifiée</div>' + f('v', 'Chiffre ou fait', 'Ex. : valeur exacte, avec son unité') + f('s', 'Source (lien)', 'https://…') + f('d', 'Date de la donnée', 'Ex. : 2024') +
    '<label class="small" style="display:flex;gap:8px;align-items:center;margin-top:8px"><input type="checkbox" class="pf" data-id="' + it.id + '" data-k="' + key + '" data-f="ok"' + (p.ok ? ' checked' : '') + '> Je l’ai vérifié à la source</label></div>';
}
function argsHtml(it, who, args) {
  return arr(args).map(function (a, i) {
    var pr = a.preuve || {}, key = who + i;
    return '<div class="card"><h3>' + esc(a.titre) + '</h3><p style="margin:6px 0">' + esc(a.raisonnement) + '</p>' +
      '<div class="small muted"><b>Preuve à chercher :</b> ' + esc(pr.type) + (pr.indicateur ? ' (' + esc(pr.indicateur) + ')' : '') + '<br><b>Où :</b> ' + esc(pr.organisme) + (pr.requete ? '<br><b>Requête :</b> ' + esc(pr.requete) : '') + (a.exemple ? '<br><b>Cas réel à vérifier :</b> ' + esc(a.exemple) : '') + '</div>' + proofFields(it, key) + '</div>';
  }).join('');
}
function proofCount(it) { var n = 0, k; for (k in it.proofs) if (it.proofs[k] && it.proofs[k].ok && it.proofs[k].v) n++; return n; }
function vDebat(it) {
  var d = it.data, m = d.mine || {}, a = d.adv || {}, h = '<div class="top"><button class="btn small ghost" data-act="prep-close">← Préparer</button><button class="chip" data-act="prep-del" data-v="' + it.id + '">Supprimer</button></div><div class="stack">';
  h += '<div><div class="eyebrow">Débat · ton camp : ' + esc(m.camp || it.side) + '</div><h1>' + esc(d.question || it.topic) + '</h1></div>';
  h += (prepUI.err ? '<div class="callout small" style="border-color:var(--warn)">' + esc(prepUI.err) + '</div>' : '') + '<div class="callout' + (it.ai ? ' info' : '') + ' small">' + (it.ai ? 'Rédigé par Claude. <b>Aucun chiffre n’a été vérifié</b> : saisis les tiens avec leur source dans chaque argument.' : 'Trame sans IA : à toi de remplir.') + ' Preuves vérifiées par toi : <b>' + proofCount(it) + '</b>.</div>';
  if (arr(d.definitions).length || d.criteres) h += '<div class="card">' + (arr(d.definitions).length ? '<div class="eyebrow">Définitions</div><ul style="margin:6px 0 10px;padding-left:18px">' + arr(d.definitions).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + (d.criteres ? '<div class="eyebrow">Le vrai point de clivage</div><p style="margin:6px 0 0">' + esc(d.criteres) + '</p>' : '') + '</div>';
  h += '<div class="row">' + [['mine', 'Ma partie'], ['adv', 'Adversaire'], ['face', 'Face-à-face']].map(function (t) { return '<button class="chip' + (prepUI.tab === t[0] ? ' on' : '') + '" data-act="prep-tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
  if (prepUI.tab === 'mine') {
    h += '<div class="card"><div class="eyebrow">Ma thèse (' + esc(m.camp) + ')</div><p style="margin:6px 0 0">' + (m.these ? esc(m.these) : '<span class="muted">À formuler en une phrase.</span>') + '</p><div class="eyebrow" style="margin-top:12px">Structure complète</div>' + planHtml(m.plan) + '</div>';
    h += argsHtml(it, 'm', m.arguments);
    if (arr(m.objections_adverses_prevues).length) h += '<div class="card"><h3>Objections prévues et réponses</h3>' + m.objections_adverses_prevues.map(function (o) { return '<p><b>« ' + esc(o.objection) + ' »</b><br>' + esc(o.reponse) + '</p>'; }).join('') + '</div>';
  } else if (prepUI.tab === 'adv') {
    h += '<div class="card"><div class="eyebrow">Sa thèse (' + esc(a.camp) + ')</div><p style="margin:6px 0 0">' + (a.these ? esc(a.these) : '<span class="muted">À formuler.</span>') + '</p><div class="eyebrow" style="margin-top:12px">Sa structure probable</div>' + planHtml(a.plan) + '</div>';
    h += argsHtml(it, 'a', a.arguments);
    if (arr(a.points_faibles).length) h += '<div class="card"><h3>Ses points faibles</h3><ul style="margin:6px 0 0;padding-left:18px">' + a.points_faibles.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  } else {
    h += arr(d.points_de_friction).map(function (f) { return '<div class="card"><h3>' + esc(f.theme) + '</h3><p style="margin:6px 0"><b>Ma ligne.</b> ' + (f.ma_ligne ? esc(f.ma_ligne) : '<span class="muted">À écrire.</span>') + '</p><p style="margin:0"><b>Sa ligne.</b> ' + (f.sa_ligne ? esc(f.sa_ligne) : '<span class="muted">À écrire.</span>') + '</p></div>'; }).join('');
  }
  if (arr(d.a_verifier).length) h += '<div class="card"><h3>À vérifier avant de parler</h3><ul style="margin:6px 0 0;padding-left:18px">' + d.a_verifier.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  h += '<details class="card"><summary><b>Demander un dossier chiffré vérifié à Claude</b></summary><p class="small muted">Copie ce message et envoie-le dans la conversation avec Claude : il pourra chercher sur le web et te donner des chiffres avec leurs sources.</p><pre class="brief" id="briefPre">' + esc(dossierPrompt(it)) + '</pre><button class="btn small ghost" style="margin-top:8px" data-act="copy">Copier</button></details>';
  h += '<button class="btn" data-act="prep-studio" data-v="' + it.id + '">S’entraîner à le dire au Studio</button></div>';
  return h;
}
function vSpeech(it) {
  var d = it.data, h = '<div class="top"><button class="btn small ghost" data-act="prep-close">← Préparer</button><button class="chip" data-act="prep-del" data-v="' + it.id + '">Supprimer</button></div><div class="stack">';
  h += '<div><div class="eyebrow">Discours · ' + durLabel(it.dur) + (d.mots ? ' · environ ' + esc(d.mots) + ' mots' : '') + '</div><h1>' + esc(d.titre || it.topic) + '</h1></div>';
  h += (prepUI.err ? '<div class="callout small" style="border-color:var(--warn)">' + esc(prepUI.err) + '</div>' : '') + '<div class="callout' + (it.ai ? ' info' : '') + ' small">' + (it.ai ? 'Rédigé par Claude. Les « [CHIFFRE À VÉRIFIER] » sont des emplacements : remplace-les par un chiffre que tu as vérifié, ou supprime la phrase.' : 'Trame sans IA : écris chaque partie avec tes mots.') + '</div>';
  if (arr(d.plan).length) h += '<div class="card"><div class="eyebrow">Plan</div><ol style="margin:6px 0 0;padding-left:20px">' + d.plan.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>';
  h += '<div class="card prose">' + arr(d.parties).map(function (p) { return '<h3>' + esc(p.partie) + '</h3><p>' + esc(p.texte) + '</p>'; }).join('') + '</div>';
  if (arr(d.conseils_oraux).length) h += '<div class="box b-exo"><b>Pour le dire</b><ul>' + d.conseils_oraux.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  if (arr(d.a_verifier).length) h += '<div class="card"><h3>À vérifier avant de parler</h3><ul style="margin:6px 0 0;padding-left:18px">' + d.a_verifier.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  h += '<pre class="brief" id="briefPre" style="display:none">' + esc(arr(d.parties).map(function (p) { return p.partie + '\n' + p.texte; }).join('\n\n')) + '</pre>';
  h += '<div class="row"><button class="btn small ghost" data-act="copy">Copier le texte</button></div><button class="btn" data-act="prep-studio" data-v="' + it.id + '">S’entraîner à le dire au Studio</button></div>';
  return h;
}

/* ----- actions ----- */
function prepAct(act, v, el) {
  if (act === 'tab' && v === 'prep') prepUI.cur = null;
  switch (act) {
    case 'prep-mode': prepUI.mode = v; render(); return true;
    case 'prep-side': prepUI.side = v; render(); return true;
    case 'prep-go': var ti = document.getElementById('prepTopic'); if (ti) prepUI.topic = ti.value; prepGo(); return true;
    case 'prep-open': prepUI.cur = v; prepUI.tab = 'mine'; prepUI.err = ''; render(); window.scrollTo(0, 0); return true;
    case 'prep-close': prepUI.cur = null; prepUI.err = ''; render(); return true;
    case 'prep-tab': prepUI.tab = v; render(); return true;
    case 'prep-del': S.prep = S.prep.filter(function (x) { return x.id !== v; }); prepUI.cur = null; persist(); render(); return true;
    case 'prep-studio':
      var it = byId(S.prep, v); if (!it) return true;
      st.type = it.kind === 'debat' ? 'debat' : 'discours'; st.dur = it.kind === 'debat' ? 120 : it.dur;
      st.sujet = it.kind === 'debat' ? 'Défendre le camp « ' + (it.data.mine && it.data.mine.camp || it.side) + ' » : ' + it.topic : 'Dire le discours : ' + it.topic;
      go('studio'); return true;
  }
  return false;
}
document.addEventListener('input', function (ev) {
  var t = ev.target; if (!t) return;
  if (t.id === 'prepTopic') prepUI.topic = t.value;
  if (t.id === 'prepDur') {
    prepUI.min = +t.value; prepUI.dur = prepUI.min * 60;
    var l = document.getElementById('prepDurLbl'); if (l) l.textContent = durText(prepUI.min);
    var n = document.getElementById('prepDurNote'); if (n) n.textContent = cap.sample && prepUI.min > 5 ? 'Au-delà de 5 min, le discours est écrit partie par partie (plus fiable, mais plusieurs échanges avec Claude).' : '';
  }
});
document.addEventListener('change', function (ev) {
  var el = ev.target; if (!el || !el.classList || !el.classList.contains('pf')) return;
  var it = byId(S.prep, el.getAttribute('data-id')); if (!it) return;
  var k = el.getAttribute('data-k'), f = el.getAttribute('data-f');
  it.proofs[k] = it.proofs[k] || {}; it.proofs[k][f] = el.type === 'checkbox' ? el.checked : el.value.trim();
  persist();
});
