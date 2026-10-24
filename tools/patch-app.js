// Applique les adaptations PWA à src/app.js (à exécuter une seule fois sur la copie issue de l'artifact)
const fs=require('fs');let s=fs.readFileSync('src/app.js','utf8');
function rep(a,b){ if(s.indexOf(a)<0) throw new Error('introuvable: '+a.slice(0,70)); s=s.replace(a,function(){return b;}); }
// état
rep("erist: { best: 0 }, xp: 0, days: [], badges: [] };","erist: { best: 0 }, xp: 0, days: [], badges: [], why: null, angles: '', set: { sr: false }, since: 0, lastExport: 0 };");
rep("var cap = { db: null, sample: null, downloads: null, uid: null };","var cap = { db: null, sample: null, downloads: null, uid: null }; /* PWA : aucune IA, aucun service distant */");
rep("function merge(o) { for (var k in S) if (o && o[k] != null) S[k] = o[k]; }","function merge(o) { for (var k in S) if (o && o[k] != null && typeof o[k] === typeof S[k]) S[k] = o[k]; }");
rep("    if (cap.db && cap.uid) {\n      try { cap.db.collection('data/users/' + cap.uid).doc('state').set({ json: JSON.stringify(S), at: Date.now() }).catch(function () {}); } catch (e) {}\n    }\n","");
rep("/*@@LEVELS@@*/","/*@@LEVELS@@*/\n/*@@PWA@@*/");
// navigation
rep("var f = { home: vHome, studio: vStudio, course: vCourse, orators: vOrators, prep: vPrep, proofs: vProofs }[view.tab];\n  root.innerHTML = f();\n  if (view.tab === 'studio') studioAfterRender();","var f = { home: vHome, studio: vStudio, course: vCourse, orators: vOrators, prep: vPrep, proofs: vProofs, settings: vSettings }[view.tab] || vHome;\n  root.innerHTML = f();\n  if (view.tab === 'studio') studioAfterRender();\n  pwaAfterRender();");
// accueil : gear + données déplacées
rep("<span>L’art oratoire · <i>by Stephen</i></span></div></div><div class=\"top\">","<span>L’art oratoire · <i>by Stephen</i></span></div><button class=\"gear\" data-act=\"settings\" aria-label=\"Réglages\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z\"/></svg></button></div><div class=\"top\">");
rep("  h += '<div class=\"stack\">';\n  h += '<button class=\"card tap\" data-act=\"reco\"","  h += '<div class=\"stack\">';\n  h += homeBanners();\n  h += '<button class=\"card tap\" data-act=\"reco\"");
rep("  h += goalsHtml();\n  h += vBadges();","  h += homeDaily();\n  h += goalsHtml();\n  h += vBadges();");
// retirer la carte Tes données
s=s.replace(/  h \+= '<div class="card"><h3>Tes données<\/h3>.*?<\/div><\/div>';\n/,function(){return "";});
if(s.indexOf('<h3>Tes données</h3>')>=0) throw new Error('carte Tes données encore là');
// Pourquoi Agora éditable
s=s.replace(/  h \+= '<div class="card prose"><h3>Pourquoi Agora \?<\/h3>.*?<\/div>';\n/,function(){return "  h += whyHtml();\n";});
if(s.indexOf('whyHtml')<0) throw new Error('why');
// séances : conserver l'id audio
rep("var rec = { id: uid(), date: today(),","var rec = { id: uid(), audioId: st.audioId || null, date: today(),");
rep("S.sessions = S.sessions.slice(0, 60);","S.sessions = S.sessions.slice(0, 200);");
rep("st.busy = false; st.blob = null; st.pcm = null; st.transcript = '';","st.busy = false; st.blob = null; st.pcm = null; st.audioId = null; st.transcript = '';");
// enregistrement : sauvegarde locale + reconnaissance vocale optionnelle
rep("mr = new MediaRecorder(s);","mr = pwaRecorder(s);");
rep("mr.onstop = function () { s.getTracks().forEach(function (t) { t.stop(); }); setBlob(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })); };","mr.onstop = function () { s.getTracks().forEach(function (t) { t.stop(); }); var bb = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); setBlob(bb); pwaSaveRec(bb); };");
rep("if (SR_API) {\n      try {","if (SR_API && S.set && S.set.sr) {\n      try {");
rep("stream = s; chunks = []; st.transcript = ''; st.blob = null; st.pcm = null;","stream = s; chunks = []; st.transcript = ''; st.blob = null; st.pcm = null; st.audioId = null;");
rep("(SR_API && CAN_MIC ? 'Elle se remplit pendant l’enregistrement. Tu peux la corriger.' : 'Colle ici le texte de ce que tu as dit (ou écris-le). Sans texte, seule la voix est analysée.')","(SR_API && CAN_MIC && S.set && S.set.sr ? 'Elle se remplit pendant l’enregistrement (transcription en ligne activée). Tu peux la corriger.' : 'Écris ou colle ici le texte de ce que tu as dit. Sans texte, seule la voix est analysée.')");
rep("h += '<div class=\"card stack\"><div class=\"eyebrow\">Transcription (pour analyser les mots)</div>","h += '<div class=\"card stack\" id=\"recLib\"></div>';\n  h += '<div class=\"card stack\"><div class=\"eyebrow\">Transcription (pour analyser les mots)</div>");
// bloc IA -> retour manuel
s=s.replace(/  h \+= '<div class="card stack" id="aiBox">.*?\n/,function(){return "  h += coachBox(s);\n";});
if(s.indexOf('coachBox')<0) throw new Error('coach');
s=s.replace(/function askAI\(id\) \{.*?\n\}\n\n\/\* ---------- COURS/s,function(){return "/* ---------- COURS";});
if(s.indexOf('function askAI')>=0) throw new Error('askAI');
// preuves
s=s.replace(/var proofTopic = '';\nfunction vProofs\(\) \{.*?\n\}\nfunction briefText/s,function(){return "var proofTopic = '';\nfunction briefText";});
if(s.indexOf('function vProofs')>=0) throw new Error('vProofs');
s=s.replace(/function anglesAI\(\) \{.*?\n\}\nfunction exportData\(\) \{.*?\n\}\n/s,function(){return "";});
if(s.indexOf('function anglesAI')>=0||s.indexOf('function exportData')>=0) throw new Error('angles/export');
rep("    case 'angles': anglesAI(); break;\n","");
rep("    case 'ai': askAI(v); break;\n","");
rep("    case 'export': exportData(); break;\n","");
rep("    case 'theme': var r = document.documentElement, dark = r.getAttribute('data-theme') === 'dark' || (!r.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches); r.setAttribute('data-theme', dark ? 'light' : 'dark'); break;\n","");
s=s.replace(/    case 'proof-add':.*?\n    case 'proof-del':.*?\n/s,function(){return "";});
rep("  if (prepAct(act, v, el) || eristAct(act, v)) return;","  if (pwaAct(act, v, el, ev) || prepAct(act, v, el) || eristAct(act, v)) return;");
rep("case 'back': view = { tab: view.tab === 'studio' ? 'home' : view.tab, sub: null };","case 'back': view = { tab: view.tab === 'studio' || view.tab === 'settings' ? 'home' : view.tab, sub: null };");
// démarrage
s=s.replace(/loadLocal\(\); render\(\);\nif \(window\.claude && window\.claude\.use\) \{.*?\n\}\n\}\)\(\);/s,function(){return "loadLocal(); pwaBoot(); render();\n})();";});
if(s.indexOf('pwaBoot')<0) throw new Error('boot');
// leçon : remettre à zéro (corbeille 24 h)
rep("  h += '<div class=\"row\" style=\"justify-content:space-between\">' + (prev ?","  if (S.done[l.id] || S.quiz[l.id] != null) h += '<div class=\"row\"><button class=\"btn small ghost\" data-act=\"lesson-reset\" data-v=\"' + l.id + '\">Refaire cette leçon (progression gardée 24 h dans la corbeille)</button></div>';\n  h += '<div class=\"row\" style=\"justify-content:space-between\">' + (prev ?");
// suppression d'une séance
rep("<div class=\"row\"><button class=\"btn\" data-act=\"again\">Refaire</button><button class=\"btn ghost\" data-act=\"back\">Terminer</button></div>","<div class=\"row\"><button class=\"btn\" data-act=\"again\">Refaire</button><button class=\"btn ghost\" data-act=\"back\">Terminer</button><button class=\"btn ghost small\" data-act=\"sess-del\" data-v=\"' + s.id + '\">Supprimer la séance</button></div>");
fs.writeFileSync('src/app.js',s);console.log('app.js adapté', s.length);
