const A = require('../src/analysis.js');
const { synth, toWav } = require('./synth.js');
const fs = require('fs');

let fails = 0;
const ok = (cond, label, info) => { console.log((cond ? 'OK   ' : 'FAIL ') + label + (info !== undefined ? '  → ' + info : '')); if (!cond) fails++; };

(async () => {
  // Signal 1 : 4 phrases, pauses de 0,8 s / 1,5 s / 2,5 s
  const spec = [
    { n: 5, f0a: 140, f0b: 190, pauseAfter: 0.8 },
    { n: 8, f0a: 180, f0b: 120, pauseAfter: 1.5 },
    { n: 6, f0a: 130, f0b: 150, pauseAfter: 2.5 },
    { n: 7, f0a: 150, f0b: 200, pauseAfter: 0 }
  ];
  const sig = synth(spec);
  fs.writeFileSync(__dirname + '/synthetic.wav', toWav(sig));
  const t0 = Date.now();
  const r = await A.analyzeSignal(sig);
  console.log('durée de calcul', Date.now() - t0, 'ms pour', (sig.length / 16000).toFixed(1), 's de signal');
  console.log(JSON.stringify({ ...r, series: undefined, pauses: { ...r.pauses, list: r.pauses.list } }, null, 1));
  ok(r.ok, 'analyse réussie');
  ok(Math.abs(r.durationSec - sig.length / 16000) < 0.1, 'durée', r.durationSec);
  ok(r.pauses.count === 3, '3 pauses détectées', r.pauses.count);
  ok(r.pauses.short === 1 && r.pauses.long === 1 && r.pauses.blank === 1, 'pauses classées courte/longue/blanc', `${r.pauses.short}/${r.pauses.long}/${r.pauses.blank}`);
  ok(Math.abs(r.pauses.longest - 2.5) < 0.2, 'plus longue pause ≈ 2,5 s', r.pauses.longest);
  ok(r.pitch && r.pitch.medianHz > 135 && r.pitch.medianHz < 165, 'hauteur médiane ≈ 150 Hz', r.pitch && r.pitch.medianHz);
  ok(r.pitch && r.pitch.sdSemitones > 1.5 && r.pitch.sdSemitones < 5, 'variation de hauteur plausible', r.pitch && r.pitch.sdSemitones);
  ok(r.rhythm.syllables >= 22 && r.rhythm.syllables <= 30, 'syllabes ≈ 26', r.rhythm.syllables);
  ok(r.endings.rising >= 1, 'au moins une fin de phrase montante détectée', r.endings.rising);
  ok(r.endings.falling >= 1, 'au moins une fin de phrase descendante détectée', r.endings.falling);

  // Signal 2 : voix plate (hauteur constante) → expressivité faible
  const flat = synth([{ n: 12, f0a: 150, f0b: 150, pauseAfter: 0.0, syl: 0.2 }], { seed: 7 });
  const rf = await A.analyzeSignal(flat);
  ok(rf.ok && rf.pitch && rf.pitch.sdSemitones < 0.8, 'voix plate → écart de hauteur faible', rf.pitch && rf.pitch.sdSemitones);

  // Signal 3 : silence → refus propre
  const rs = await A.analyzeSignal(new Float32Array(16000 * 5));
  ok(!rs.ok && rs.reason === 'silence', 'silence refusé proprement', rs.reason);

  // Signal 4 : trop court
  const rt = await A.analyzeSignal(new Float32Array(16000));
  ok(!rt.ok && rt.reason === 'trop_court', 'enregistrement trop court refusé', rt.reason);

  // Signal 5 : voix grave (110 Hz) et aiguë (260 Hz) → hauteur fidèle
  for (const f of [110, 260]) {
    const g = synth([{ n: 10, f0a: f, f0b: f * 1.05, pauseAfter: 0 }], { seed: 3 });
    const rg = await A.analyzeSignal(g);
    ok(rg.ok && rg.pitch && Math.abs(rg.pitch.medianHz / (f * 1.025) - 1) < 0.05, `hauteur ${f} Hz restituée à 5 % près`, rg.pitch && rg.pitch.medianHz);
  }

  // Texte
  const txt = "Alors euh, du coup, je voulais juste vous dire que, en fait, on a trois raisons de agir. D'abord, le coût : 40 % de plus chaque année, selon l'étude de l'INSTAT. Ensuite, un exemple : quand j'étais à Antananarivo, un jour, tout s'est arrêté. Enfin, voilà quoi. Peut-être que c'est une chose à revoir ? Je pense que oui.";
  const t = A.analyzeText(txt, 40);
  console.log(JSON.stringify(t, null, 1));
  ok(t.ok && t.fillers.total >= 5, 'tics détectés', t.fillers.total + ' ' + JSON.stringify(t.fillers.top));
  ok(t.hedges.total >= 3, 'atténuations détectées', t.hedges.total);
  ok(t.vague.total >= 1, 'mots vagues détectés', t.vague.total);
  ok(t.planAnnounced, 'annonce de plan détectée');
  ok(t.evidence.digits >= 1, 'chiffres détectés', t.evidence.digits);
  ok(t.closers >= 1, 'clôture qui s’éteint détectée', t.closers);
  ok(t.questions === 1, 'question détectée', t.questions);
  ok(t.wpm > 50 && t.wpm < 120, 'mots/min cohérent', t.wpm);

  const marks = A.markTics(txt);
  ok(marks.some(m => m.k === 'tic') && marks.map(m => m.t).join('') === txt, 'marquage reconstitue le texte à l’identique');

  const p = A.pillars(r, t);
  console.log('piliers', p);
  ok(p.logos !== null && p.ethos !== null && p.pathos !== null, 'trois piliers calculés');
  const p2 = A.pillars(null, t);
  ok(p2.pathos !== null && p2.partial.length === 0, 'piliers calculables avec le texte seul');
  const p3 = A.pillars(r, null);
  ok(p3.logos === null && p3.partial.includes('logos'), 'logos non calculé sans texte (signalé)');

  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT');
  process.exit(fails ? 1 : 0);
})();
