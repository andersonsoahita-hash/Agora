/* ============================================================
   Analyse de la voix (signal) et du texte (transcription)
   Tout se calcule dans la page. Aucun audio n'est envoyé nulle part.
   ============================================================ */
(function (root) {
  'use strict';

  var SR = 16000;          // fréquence d'analyse
  var ENV_HOP = 160;       // 10 ms : enveloppe d'énergie
  var PITCH_HOP = 320;     // 20 ms : hauteur
  var YIN_W = 480;         // fenêtre d'intégration (30 ms)
  var MIN_F = 70, MAX_F = 400;
  var MIN_LAG = Math.floor(SR / MAX_F);   // 40
  var MAX_LAG = Math.floor(SR / MIN_F);   // 228
  var FRAME = YIN_W + MAX_LAG;            // 708

  function tick() { return new Promise(function (r) { setTimeout(r, 0); }); }

  function percentile(sorted, p) {
    if (!sorted.length) return NaN;
    var i = (sorted.length - 1) * p;
    var lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }
  function sortedCopy(a) { return Array.prototype.slice.call(a).sort(function (x, y) { return x - y; }); }
  function mean(a) { if (!a.length) return NaN; var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function sd(a) {
    if (a.length < 2) return 0;
    var m = mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / (a.length - 1));
  }
  function median(a) { return percentile(sortedCopy(a), 0.5); }
  function round(x, n) { var k = Math.pow(10, n || 0); return Math.round(x * k) / k; }

  /* ---------- Hauteur : YIN simplifié ---------- */
  function yin(buf, start) {
    var d = new Float32Array(MAX_LAG + 1);
    var tau, j, diff, s;
    for (tau = 1; tau <= MAX_LAG; tau++) {
      s = 0;
      for (j = 0; j < YIN_W; j++) { diff = buf[start + j] - buf[start + j + tau]; s += diff * diff; }
      d[tau] = s;
    }
    var c = new Float32Array(MAX_LAG + 1);
    c[0] = 1;
    var run = 0;
    for (tau = 1; tau <= MAX_LAG; tau++) {
      run += d[tau];
      c[tau] = run > 0 ? d[tau] * tau / run : 1;
    }
    var best = -1;
    for (tau = MIN_LAG; tau <= MAX_LAG; tau++) {
      if (c[tau] < 0.2) {
        while (tau + 1 <= MAX_LAG && c[tau + 1] < c[tau]) tau++;
        best = tau; break;
      }
    }
    if (best < 0) return null;
    var t0 = best, x0 = c[best - 1], x1 = c[best], x2 = c[Math.min(best + 1, MAX_LAG)];
    var denom = (x0 + x2 - 2 * x1);
    var shift = denom !== 0 ? 0.5 * (x0 - x2) / denom : 0;
    if (Math.abs(shift) > 1) shift = 0;
    var f0 = SR / (t0 + shift);
    if (f0 < MIN_F || f0 > MAX_F) return null;
    return { f0: f0, clarity: 1 - c[best] };
  }

  /* ---------- Analyse du signal ---------- */
  async function analyzeSignal(samples, opts) {
    opts = opts || {};
    var onProgress = opts.onProgress || function () {};
    var N = samples.length;
    var dur = N / SR;
    if (dur < 2) return { ok: false, reason: 'trop_court', durationSec: dur };

    // 1. Enveloppe d'énergie en dB (pas de 10 ms, fenêtre de 20 ms)
    var nEnv = Math.floor((N - 2 * ENV_HOP) / ENV_HOP);
    var env = new Float32Array(nEnv);
    var i, j, s, v;
    for (i = 0; i < nEnv; i++) {
      s = 0;
      var a = i * ENV_HOP;
      for (j = 0; j < 2 * ENV_HOP; j++) { v = samples[a + j]; s += v * v; }
      env[i] = 20 * Math.log10(Math.sqrt(s / (2 * ENV_HOP)) + 1e-9);
    }
    var sorted = sortedCopy(env);
    var p10 = percentile(sorted, 0.10), p95 = percentile(sorted, 0.95);
    if (p95 < -60) return { ok: false, reason: 'silence', durationSec: dur };
    var thr = Math.max(p10 + 9, p95 - 32);

    // 2. Masque de parole : on comble les trous < 120 ms, on retire les bruits < 80 ms
    var mask = new Uint8Array(nEnv);
    for (i = 0; i < nEnv; i++) mask[i] = env[i] > thr ? 1 : 0;
    var runs = runsOf(mask);
    runs = mergeRuns(runs, 12);
    runs = runs.filter(function (r) { return r[1] - r[0] >= 8; });
    if (!runs.length) return { ok: false, reason: 'silence', durationSec: dur };
    var speechMask = new Uint8Array(nEnv);
    runs.forEach(function (r) { for (var k = r[0]; k < r[1]; k++) speechMask[k] = 1; });

    var first = runs[0][0], last = runs[runs.length - 1][1];
    var spanSec = (last - first) * ENV_HOP / SR;
    var speechSec = 0;
    runs.forEach(function (r) { speechSec += (r[1] - r[0]) * ENV_HOP / SR; });

    // 3. Pauses (écarts entre deux plages de parole)
    var pauses = [];
    for (i = 1; i < runs.length; i++) {
      var gap = (runs[i][0] - runs[i - 1][1]) * ENV_HOP / SR;
      if (gap >= 0.35) pauses.push({ t: runs[i - 1][1] * ENV_HOP / SR, d: round(gap, 2) });
    }
    var pauseShort = pauses.filter(function (p) { return p.d < 0.9; }).length;
    var pauseLong = pauses.filter(function (p) { return p.d >= 0.9 && p.d < 2; }).length;
    var pauseBlank = pauses.filter(function (p) { return p.d >= 2; }).length;
    var pauseTotal = 0;
    pauses.forEach(function (p) { pauseTotal += p.d; });

    // 4. Hauteur (uniquement sur les trames de parole)
    var nP = Math.floor((N - FRAME) / PITCH_HOP);
    var f0s = new Float32Array(nP);
    for (i = 0; i < nP; i++) {
      var centerEnv = Math.min(nEnv - 1, Math.floor((i * PITCH_HOP + FRAME / 2) / ENV_HOP));
      if (!speechMask[centerEnv]) { f0s[i] = 0; continue; }
      var r = yin(samples, i * PITCH_HOP);
      f0s[i] = r ? r.f0 : 0;
      if (i % 60 === 0) {
        onProgress(0.1 + 0.8 * i / nP);
        await tick();
      }
    }
    // filtre médian (5 trames) pour éliminer les erreurs d'octave
    var f0f = new Float32Array(nP);
    for (i = 0; i < nP; i++) {
      if (!f0s[i]) continue;
      var win = [];
      for (j = Math.max(0, i - 2); j <= Math.min(nP - 1, i + 2); j++) if (f0s[j]) win.push(f0s[j]);
      if (win.length < 3) continue;
      var m5 = median(win);
      if (Math.abs(12 * Math.log2(f0s[i] / m5)) <= 4) f0f[i] = f0s[i];
    }
    var voiced = [];
    for (i = 0; i < nP; i++) if (f0f[i]) voiced.push(f0f[i]);
    var pitch = null;
    if (voiced.length >= 40) {
      var med = median(voiced);
      var st = voiced.map(function (f) { return 12 * Math.log2(f / med); });
      var ss = sortedCopy(st);
      pitch = {
        medianHz: round(med, 0),
        sdSemitones: round(sd(st), 2),
        rangeSemitones: round(percentile(ss, 0.9) - percentile(ss, 0.1), 1),
        voicedRatio: round(voiced.length / Math.max(1, Math.round(speechSec / (PITCH_HOP / SR))), 2)
      };
    }

    // 5. Volume : dynamique et fins de phrase qui s'éteignent
    var spDb = [];
    for (i = 0; i < nEnv; i++) if (speechMask[i]) spDb.push(env[i]);
    var dsorted = sortedCopy(spDb);
    var volume = {
      sdDb: round(sd(spDb), 1),
      rangeDb: round(percentile(dsorted, 0.9) - percentile(dsorted, 0.1), 1)
    };
    var longRuns = 0, fading = 0, rising = 0, falling = 0, pitchRuns = 0;
    runs.forEach(function (rr) {
      var len = rr[1] - rr[0];
      if (len < 120) return; // 1,2 s minimum
      longRuns++;
      var cut = rr[0] + Math.floor(len * 0.75);
      var body = [], tail = [];
      for (var k = rr[0]; k < rr[1]; k++) (k < cut ? body : tail).push(env[k]);
      if (mean(body) - mean(tail) > 6) fading++;
      // pente de hauteur sur les 300 derniers ms vs. milieu de phrase
      var p0 = Math.floor(rr[0] * ENV_HOP / PITCH_HOP), p1 = Math.floor(rr[1] * ENV_HOP / PITCH_HOP);
      var mid = [], end = [];
      for (var q = p0; q < Math.min(p1, nP); q++) {
        if (!f0f[q]) continue;
        if (q >= p1 - 15) end.push(f0f[q]);
        else if (q >= p0 + Math.floor((p1 - p0) * 0.3) && q < p0 + Math.floor((p1 - p0) * 0.7)) mid.push(f0f[q]);
      }
      if (end.length >= 4 && mid.length >= 4) {
        pitchRuns++;
        var diffSt = 12 * Math.log2(median(end) / median(mid));
        if (diffSt > 1.5) rising++;
        else if (diffSt < -1.5) falling++;
      }
    });

    // 6. Rythme : pics d'énergie ≈ syllabes
    var smooth = new Float32Array(nEnv);
    for (i = 0; i < nEnv; i++) {
      var sm = 0, cnt = 0;
      for (j = Math.max(0, i - 1); j <= Math.min(nEnv - 1, i + 1); j++) { sm += env[j]; cnt++; }
      smooth[i] = sm / cnt;
    }
    var peaks = [];
    var lastPeak = -100;
    for (i = 4; i < nEnv - 4; i++) {
      if (!speechMask[i] || smooth[i] < thr + 6) continue;
      var isMax = true;
      for (j = i - 4; j <= i + 4; j++) if (smooth[j] > smooth[i]) { isMax = false; break; }
      if (!isMax) continue;
      var lmin = Infinity, rmin = Infinity;
      for (j = Math.max(0, i - 10); j <= i; j++) lmin = Math.min(lmin, smooth[j]);
      for (j = i; j <= Math.min(nEnv - 1, i + 10); j++) rmin = Math.min(rmin, smooth[j]);
      var prom = smooth[i] - Math.max(lmin, rmin);
      if (prom >= 3 && i - lastPeak >= 8) { peaks.push(i); lastPeak = i; }
    }
    var syllRate = speechSec > 0 ? peaks.length / speechSec : 0;
    // variation du rythme par fenêtres de 8 s
    var win8 = 800, rates = [];
    for (var w0 = first; w0 + win8 <= last; w0 += win8) {
      var c8 = 0, sp8 = 0;
      for (j = w0; j < w0 + win8; j++) if (speechMask[j]) sp8++;
      for (var pi = 0; pi < peaks.length; pi++) if (peaks[pi] >= w0 && peaks[pi] < w0 + win8) c8++;
      if (sp8 > 200) rates.push(c8 / (sp8 / 100));
    }
    var rateVar = rates.length >= 2 && mean(rates) > 0 ? sd(rates) / mean(rates) : 0;

    // 7. Séries pour le graphique
    var binSec = Math.max(0.2, Math.ceil(dur / 240 * 10) / 10);
    var nBins = Math.ceil(dur / binSec);
    var pitchSeries = new Array(nBins).fill(null);
    var envSeries = new Array(nBins).fill(0);
    var med0 = pitch ? pitch.medianHz : 0;
    var binP = [];
    for (i = 0; i < nBins; i++) binP.push([]);
    for (i = 0; i < nP; i++) {
      if (!f0f[i] || !med0) continue;
      var tb = Math.floor((i * PITCH_HOP / SR) / binSec);
      if (tb < nBins) binP[tb].push(12 * Math.log2(f0f[i] / med0));
    }
    for (i = 0; i < nBins; i++) if (binP[i].length) pitchSeries[i] = round(mean(binP[i]), 2);
    var lo = percentile(dsorted, 0.05), hi = percentile(dsorted, 0.98);
    for (i = 0; i < nEnv; i++) {
      if (!speechMask[i]) continue;
      var tb2 = Math.floor((i * ENV_HOP / SR) / binSec);
      if (tb2 >= nBins) continue;
      var nv = Math.max(0, Math.min(1, (env[i] - lo) / Math.max(1, hi - lo)));
      if (nv > envSeries[tb2]) envSeries[tb2] = round(nv, 2);
    }

    onProgress(1);
    return {
      ok: true,
      durationSec: round(dur, 1),
      spanSec: round(spanSec, 1),
      speechSec: round(speechSec, 1),
      startOffsetSec: round(first * ENV_HOP / SR, 1),
      pauses: { count: pauses.length, short: pauseShort, long: pauseLong, blank: pauseBlank,
                totalSec: round(pauseTotal, 1), ratio: spanSec > 0 ? round(pauseTotal / spanSec, 2) : 0,
                longest: pauses.length ? Math.max.apply(null, pauses.map(function (p) { return p.d; })) : 0,
                list: pauses.slice(0, 40) },
      pitch: pitch,
      volume: volume,
      endings: { phrases: longRuns, fading: fading, fadingShare: longRuns ? round(fading / longRuns, 2) : 0,
                 pitchPhrases: pitchRuns, rising: rising, falling: falling,
                 risingShare: pitchRuns ? round(rising / pitchRuns, 2) : 0,
                 fallingShare: pitchRuns ? round(falling / pitchRuns, 2) : 0 },
      rhythm: { syllables: peaks.length, syllPerSec: round(syllRate, 1), variation: round(rateVar, 2) },
      series: { binSec: binSec, pitch: pitchSeries, env: envSeries }
    };
  }

  function runsOf(mask) {
    var out = [], start = -1;
    for (var i = 0; i < mask.length; i++) {
      if (mask[i] && start < 0) start = i;
      if (!mask[i] && start >= 0) { out.push([start, i]); start = -1; }
    }
    if (start >= 0) out.push([start, mask.length]);
    return out;
  }
  function mergeRuns(runs, maxGap) {
    if (!runs.length) return runs;
    var out = [runs[0].slice()];
    for (var i = 1; i < runs.length; i++) {
      var prev = out[out.length - 1];
      if (runs[i][0] - prev[1] <= maxGap) prev[1] = runs[i][1];
      else out.push(runs[i].slice());
    }
    return out;
  }

  /* ============================================================
     Analyse du texte
     ============================================================ */
  var L = '\\p{L}';
  function re(phrase) {
    var p = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[\\s\\u00a0]+').replace(/'/g, "['’]");
    return new RegExp('(?<![' + L + '\\d])' + p + '(?![' + L + '\\d])', 'giu');
  }
  function countList(text, list) {
    var found = {}, total = 0;
    list.forEach(function (w) {
      var m = text.match(re(w));
      if (m && m.length) { found[w] = m.length; total += m.length; }
    });
    return { total: total, found: found };
  }
  function top(found, n) {
    return Object.keys(found).map(function (k) { return [k, found[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, n);
  }

  var FILLERS = ['euh', 'heu', 'hum', 'hmm', 'ben', 'bah', 'du coup', 'en fait', 'voilà', 'genre', 'quoi',
    'tu vois', 'vous voyez', 'en gros', 'on va dire', 'comment dire', 'disons', 'bref'];
  var HEDGES = ['peut-être', 'je pense que', 'je crois que', 'il me semble', 'un peu', 'juste', 'désolé', 'désolée',
    'je ne sais pas', 'je sais pas', 'à mon avis', 'plutôt', 'assez', 'en quelque sorte', 'pas vraiment',
    'si je puis dire', 'si vous voulez', 'je dirais'];
  var VAGUE = ['chose', 'choses', 'truc', 'trucs', 'machin', 'bidule', 'etc', 'tout ça', 'ce genre de'];
  var CONNECTORS = ['parce que', 'car', 'donc', 'mais', 'pourtant', 'cependant', 'en effet', 'ainsi', "c'est pourquoi",
    'par conséquent', 'toutefois', 'néanmoins', 'en revanche', "d'abord", 'premièrement', 'deuxièmement',
    'troisièmement', 'ensuite', 'en conclusion', 'pour conclure', 'en résumé', 'par exemple', 'notamment',
    'autrement dit', "c'est-à-dire", 'de plus', 'd’un côté', 'de l’autre'];
  var EVIDENCE = ['par exemple', 'selon', "d'après", 'étude', 'statistique', 'pour cent', 'pourcent', 'chiffre', 'preuve', 'exemple'];
  var STORY = ['il y a', 'un jour', 'quand j', 'je me souviens', 'imaginez', 'imagine', 'ce jour-là', 'à ce moment', 'soudain', 'alors que'];
  var CLOSERS = ['voilà', 'quoi', 'bref', 'je sais pas', 'tout ça', 'enfin voilà', 'voilà quoi'];
  var STOP = 'le la les un une des de du d l et en à au aux a je tu il elle on nous vous ils elles ce cet cette ces se sa son ses mon ma mes ton ta tes notre nos votre vos leur leurs que qui quoi dont où ne pas plus pour par sur sous dans avec sans est sont été être avoir ai as avons avez ont c est y m t s n qu j très mais ou donc car si comme aussi cela ça ceci'.split(' ');

  var STEPS = {
    annonce: ['je voudrais dire', 'je vais vous dire', 'je vais défendre', 'je défends', 'voici ce que', 'ce que je dis', 'je dis ceci', 'trois points', 'deux points', 'trois choses', 'deux choses', 'premièrement', "d'abord"],
    prolepse: ['attention', 'je ne dis pas que', 'je ne suis pas en train de dire', 'ne me faites pas dire', 'ne comprenez pas', 'soyons clairs', "il ne s'agit pas de", 'on va me dire', 'vous me direz'],
    concession: ['certes', 'il est vrai que', "c'est vrai que", 'je vous accorde', "je vous l'accorde", 'bien sûr', "j'en conviens", 'on pourrait objecter'],
    exemple: ['par exemple', 'prenons', 'prenez le cas', 'le cas de', 'pensez à', 'imaginez', 'ainsi'],
    reformulation: ['autrement dit', "en d'autres termes", 'ce que je veux dire', 'en somme', 'en résumé', 'pour résumer', 'voilà pourquoi', "c'est pourquoi", 'en un mot']
  };
  function stepsOf(text) {
    var out = { found: {}, count: 0, total: 5 };
    Object.keys(STEPS).forEach(function (k) {
      var hit = null;
      for (var i = 0; i < STEPS[k].length; i++) if (re(STEPS[k][i]).test(text)) { hit = STEPS[k][i]; break; }
      out.found[k] = hit;
      if (hit) out.count++;
    });
    return out;
  }
  function analyzeText(raw, durationSec) {
    var text = (raw || '').replace(/\s+/g, ' ').trim();
    var words = text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) || [];
    var n = words.length;
    if (n < 8) return { ok: false, words: n };
    var per100 = function (k) { return round(k * 100 / n, 1); };
    var f = countList(text, FILLERS);
    var h = countList(text, HEDGES);
    var v = countList(text, VAGUE);
    var c = countList(text, CONNECTORS);
    var e = countList(text, EVIDENCE);
    var st = countList(text, STORY);
    var digits = (text.match(/\d+/g) || []).length;
    var sentences = text.split(/(?<=[.!?…])\s+|\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    var hasPunct = /[.!?…]/.test(text);
    var sentLens = sentences.map(function (s) { return (s.match(/[\p{L}\p{N}]+/gu) || []).length; });
    var longSent = sentLens.filter(function (x) { return x > 35; }).length;
    var closers = 0;
    if (hasPunct) {
      sentences.forEach(function (s) {
        var tail = s.toLowerCase().replace(/[.!?…"»)]+$/g, '').split(/\s+/).slice(-3).join(' ');
        for (var i = 0; i < CLOSERS.length; i++) if (re(CLOSERS[i]).test(tail)) { closers++; break; }
      });
    }
    var plan = /(?:deux|trois|quatre|cinq)[\s\u00a0]+(?:points|raisons|idées|arguments|choses|étapes|axes)/i.test(text) ||
      (re("d'abord").test(text) && re('ensuite').test(text));
    var je = (text.match(/(?<![\p{L}])(?:je|j['’])/giu) || []).length;
    var vous = (text.match(/(?<![\p{L}])(?:vous|nous|votre|notre)(?![\p{L}])/giu) || []).length;
    var questions = (text.match(/\?/g) || []).length;
    // mots de contenu répétés
    var freq = {};
    words.forEach(function (w) {
      var k = w.toLowerCase();
      if (k.length < 5 || STOP.indexOf(k) >= 0) return;
      freq[k] = (freq[k] || 0) + 1;
    });
    var repeats = Object.keys(freq).filter(function (k) { return freq[k] >= 4; })
      .map(function (k) { return [k, freq[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);
    var wpm = durationSec && durationSec > 5 ? round(n / (durationSec / 60), 0) : null;
    return {
      ok: true,
      words: n,
      wpm: wpm,
      fillers: { total: f.total, per100: per100(f.total), top: top(f.found, 6) },
      hedges: { total: h.total, per100: per100(h.total), top: top(h.found, 5) },
      vague: { total: v.total, per100: per100(v.total), top: top(v.found, 4) },
      connectors: { total: c.total, per100: per100(c.total), top: top(c.found, 5) },
      evidence: { total: e.total + digits, per100: per100(e.total + digits), digits: digits },
      story: { total: st.total, per100: per100(st.total) },
      closers: closers,
      planAnnounced: plan,
      steps: stepsOf(text),
      address: { je: je, vous: vous, vousPer100: per100(vous), jePer100: per100(je) },
      questions: questions,
      sentences: hasPunct ? { count: sentences.length, avgWords: round(mean(sentLens), 1), long: longSent } : null,
      repeats: repeats,
      hasPunct: hasPunct
    };
  }

  /* ---------- Marquage des tics dans le texte (pour l'affichage) ---------- */
  function markTics(raw) {
    var spans = [];
    FILLERS.forEach(function (w) {
      var r = re(w), m;
      while ((m = r.exec(raw)) !== null) spans.push({ s: m.index, e: m.index + m[0].length, k: 'tic' });
    });
    HEDGES.forEach(function (w) {
      var r = re(w), m;
      while ((m = r.exec(raw)) !== null) spans.push({ s: m.index, e: m.index + m[0].length, k: 'att' });
    });
    VAGUE.forEach(function (w) {
      var r = re(w), m;
      while ((m = r.exec(raw)) !== null) spans.push({ s: m.index, e: m.index + m[0].length, k: 'vag' });
    });
    spans.sort(function (a, b) { return a.s - b.s || b.e - a.e; });
    var out = [], pos = 0;
    spans.forEach(function (sp) {
      if (sp.s < pos) return;
      if (sp.s > pos) out.push({ t: raw.slice(pos, sp.s) });
      out.push({ t: raw.slice(sp.s, sp.e), k: sp.k });
      pos = sp.e;
    });
    if (pos < raw.length) out.push({ t: raw.slice(pos) });
    return out;
  }

  /* ============================================================
     Indices Logos / Ethos / Pathos
     Formules volontairement simples et affichées dans l'appli.
     Ce sont des indices de travail, pas la mesure d'un effet réel.
     ============================================================ */
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function pillars(sig, txt) {
    var out = { logos: null, ethos: null, pathos: null, partial: [] };
    if (txt && txt.ok) {
      var lg = 40 * clamp01(txt.connectors.per100 / 5) +
        20 * (txt.planAnnounced ? 1 : 0) +
        25 * clamp01(txt.evidence.per100 / 2) +
        15 * (1 - clamp01(txt.vague.per100 / 2));
      out.logos = Math.round(lg);
    } else out.partial.push('logos');
    var eth = 100, any = false;
    if (txt && txt.ok) {
      eth -= Math.min(30, txt.fillers.per100 * 6);
      eth -= Math.min(20, txt.hedges.per100 * 3);
      any = true;
    }
    if (sig && sig.ok) {
      eth -= Math.min(15, sig.pauses.blank * 5 + sig.pauses.long * 2);
      eth -= 15 * (sig.endings.risingShare || 0);
      eth -= 10 * (sig.endings.fadingShare || 0);
      any = true;
    }
    if (any) out.ethos = Math.round(Math.max(0, eth)); else out.partial.push('ethos');
    var parts = [], wts = [];
    if (sig && sig.ok && sig.pitch) {
      parts.push(clamp01((sig.pitch.sdSemitones - 1) / 3)); wts.push(0.45);
      parts.push(clamp01((sig.volume.sdDb - 3) / 5)); wts.push(0.20);
    }
    if (txt && txt.ok) {
      parts.push(clamp01(txt.story.per100 / 1.5)); wts.push(0.20);
      parts.push(clamp01(txt.address.vousPer100 / 4)); wts.push(0.15);
    }
    if (parts.length) {
      var tw = 0, sc = 0;
      for (var i = 0; i < parts.length; i++) { sc += parts[i] * wts[i]; tw += wts[i]; }
      out.pathos = Math.round(100 * sc / tw);
    } else out.partial.push('pathos');
    return out;
  }

  var api = {
    SR: SR, analyzeSignal: analyzeSignal, analyzeText: analyzeText, markTics: markTics, pillars: pillars,
    _internals: { yin: yin, percentile: percentile }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AO_ANALYSIS = api;
})(typeof window !== 'undefined' ? window : globalThis);
