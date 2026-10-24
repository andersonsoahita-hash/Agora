window.AGORA_BUILD='1d1d4a9ec3';
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

;
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

;
/* Dialectique éristique (Schopenhauer).
   Source du contenu : T. Bailey Saunders, « The Art of Controversy » (1896, domaine public), numérotation et ordre de cette traduction.
   Les « principes » sont reformulés par l'appli. Quand l'exemple ou la réponse vient de Schopenhauer : S. Sinon : exemple ou réponse de l'appli (app).
   Le classement loyal / limite / déloyal et le nom du sophisme sont une lecture de l'appli, pas de Schopenhauer. */
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.erist = {
  note: 'Texte écrit vers 1830-1831, publié en 1864. Titres et numéros suivent la traduction anglaise de T. Bailey Saunders (1896, domaine public) : d’autres éditions ordonnent et nomment parfois autrement. Les « principes » sont reformulés par l’appli. Le classement loyal / limite / déloyal et le nom du sophisme sont une lecture de l’appli, pas de Schopenhauer.',
  idees: [
    { t: 'Logique et dialectique', x: 'La logique étudie la forme des raisonnements. La dialectique éristique, elle, étudie la dispute entre deux personnes qui ne sont pas d’accord. Schopenhauer la définit comme l’art de disputer pour tenir bon, que l’on ait raison ou tort : elle vise la victoire, pas la vérité.' },
    { t: 'Avoir raison n’est pas gagner', x: 'On peut avoir objectivement raison et paraître avoir perdu, et l’inverse. C’est tout le sens du texte : la vérité est difficile à établir (il cite Démocrite : elle est « au fond du puits »), alors que l’impression de victoire se fabrique avec des procédés.' },
    { t: 'Pourquoi on dispute ainsi', x: 'Il l’explique par la nature humaine : vanité, bavardage, malhonnêteté. On parle avant de réfléchir, puis on préfère défendre sa thèse plutôt que d’admettre l’erreur. « L’homme est naturellement obstiné », écrit-il en substance, et il suppose presque toujours que l’erreur vient de l’autre.' },
    { t: 'Deux modes, deux voies', x: 'On peut réfuter ad rem (la thèse ne correspond pas à la réalité) ou ad hominem / ex concessis (elle contredit ce que l’adversaire a lui-même admis, ce qui ne prouve qu’une conviction relative). La voie directe attaque les raisons de la thèse, la voie indirecte attaque ses conséquences.' },
    { t: 'À quoi ça sert', x: 'D’abord à reconnaître les ruses quand on les subit et à les contrer. Schopenhauer ajoute qu’il faut aussi savoir s’en servir, car on peut les retourner contre l’adversaire. Le texte est présenté comme un premier essai, fondé sur l’observation des disputes ordinaires.' }
  ],
  familles: {
    sens: 'Déformer le sens',
    quest: 'Piéger par les questions',
    emo: 'Émotion, public et bluff',
    esq: 'Esquiver et changer de terrain',
    perso: 'Autorité, personne, contre-attaque'
  },
  strats: [
    { n: 1, t: 'L’extension', f: 'sens', nat: 'deloyal', faux: 'Homme de paille',
      p: 'Tu étends l’affirmation de l’adversaire au-delà de ses limites naturelles, puis tu réfutes cette version élargie. Tu fais l’inverse pour la tienne : tu la restreins autant que possible.',
      ex: '« Les Anglais excellent au théâtre » : on objecte l’opéra, où ils sont faibles. Réponse : la musique n’est pas de l’art dramatique.', exS: 1,
      r: 'L’autre te prête des mots plus larges que les tiens (« tout », « toujours », « jamais »).',
      c: 'Précise exactement le point en litige et reformule ta thèse avec ses limites.', cS: 1 },
    { n: 2, t: 'L’homonymie', f: 'sens', nat: 'deloyal', faux: 'Équivoque',
      p: 'Tu profites d’un mot qui a deux sens : tu réfutes la thèse avec l’autre sens, puis tu prétends avoir réfuté la thèse d’origine.',
      ex: 'Le mot « honneur » pris d’abord au sens civique, puis au sens chevaleresque.', exS: 1,
      r: 'Un mot clé change discrètement de sens en cours de discussion.',
      c: 'Demande : « Tu prends ce mot au sens de… ? » et fixe la définition avant d’avancer.' },
    { n: 3, t: 'Réfuter autre chose', f: 'sens', nat: 'deloyal', faux: 'Hors-sujet (ignoratio elenchi)',
      p: 'Tu attaques ce qui n’a pas été affirmé : tu prends une proposition relative pour absolue, ou tu la comprends autrement, puis tu triomphes.',
      ex: 'Tu dis : « C’est un bon film, pour un film de genre. » On réfute : « Faux, ce n’est pas un chef-d’œuvre. » Ta phrase était relative ; on l’a prise pour absolue.',
      r: 'La réponse porte sur autre chose que ta phrase exacte : une nuance a disparu.',
      c: 'Refuse la conclusion qu’on en tire : une prémisse vraie ne rend pas ta thèse fausse. Reviens à ta phrase exacte.', cS: 1 },
    { n: 4, t: 'Cacher la conclusion', f: 'quest', nat: 'limite', faux: '',
      p: 'Tu fais admettre tes prémisses une à une, de façon dispersée, sans annoncer où tu vas. La conclusion n’apparaît qu’à la fin.',
      ex: 'Un vendeur : « Vous voulez de la qualité ? Que ça dure ? Alors vous ne voulez pas le modèle le moins cher. »',
      r: 'Une série de petites questions auxquelles on te demande de dire oui, sans en voir le but.',
      c: 'Demande où cela mène avant de répondre, et garde en tête les accords que tu donnes.' },
    { n: 5, t: 'Argumenter à partir de ses concessions', f: 'quest', nat: 'loyal', faux: '',
      p: 'Tu pars de prémisses que l’adversaire admet (ses principes, sa doctrine), même si elles sont fausses en soi, pour le prendre à son propre jeu.',
      ex: '« Tu défends la liberté d’expression : tu ne peux donc pas demander l’interdiction de ce livre. »',
      r: 'On te renvoie à tes propres principes.',
      c: 'Dis si tu maintiens ce principe ou distingue-le. Une contradiction avec toi-même ne prouve pas que ta thèse est fausse.' },
    { n: 6, t: 'Pétition de principe déguisée', f: 'quest', nat: 'deloyal', faux: 'Pétition de principe',
      p: 'Tu postules ce qu’il faut prouver, sous un autre nom ou sous une affirmation plus générale.',
      ex: 'Dire « bonne réputation » à la place d’« honneur » pour faire admettre ce qui était à démontrer.', exS: 1,
      r: 'La preuve repose sur ce qu’elle devait démontrer, avec d’autres mots.',
      c: 'Dis : « Tu supposes cela, tu ne le prouves pas », et demande la preuve de la prémisse.' },
    { n: 7, t: 'Les questions en rafale', f: 'quest', nat: 'limite', faux: '',
      p: 'Tu poses beaucoup de questions larges à la fois pour cacher ton but, puis tu présentes vite les accords obtenus comme une preuve.',
      ex: 'Un questionnaire orienté dont les réponses sont citées ensuite pour appuyer une thèse.',
      r: 'On t’enchaîne plus de questions que tu ne peux en traiter.',
      c: 'Ralentis : une question à la fois, ou demande à voir le but.' },
    { n: 8, t: 'Mettre en colère', f: 'emo', nat: 'deloyal', faux: 'Provocation',
      p: 'Un adversaire en colère juge mal et oublie son intérêt. Tu le provoques jusqu’à ce qu’il perde son calme.',
      ex: '« Tu n’as jamais rien compris à ce dossier », lancé en réunion.',
      r: 'Tu sens la chaleur monter ; la remarque porte sur toi, pas sur l’argument.',
      c: 'Respire, nomme-le (« Tu cherches à me faire réagir »), puis reviens à l’argument. Trois secondes de silence sont une arme.' },
    { n: 9, t: 'Brouiller l’ordre des questions', f: 'quest', nat: 'deloyal', faux: '',
      p: 'Tu poses tes questions dans le désordre pour cacher le but, puis tu recomposes les réponses pour en tirer d’autres conclusions.',
      ex: 'Un interlocuteur cite deux de tes réponses côte à côte, prises à des moments différents, pour te contredire.',
      r: 'Des questions sans fil conducteur, puis un « donc tu admets que… ».',
      c: 'Demande le lien entre les questions et reviens sur ce que tu as réellement dit.' },
    { n: 10, t: 'Demander la proposition inverse', f: 'quest', nat: 'limite', faux: '',
      p: 'Si l’adversaire répond « non » à tout, tu lui demandes l’inverse de ce que tu veux prouver, ou tu lui laisses choisir entre les deux.',
      ex: 'Quelqu’un qui dit non par réflexe : « Alors tu préfères ne rien faire ? »',
      r: 'On te propose le contraire de ce qu’on veut, pour que ton refus serve la thèse.',
      c: 'Réponds sur le fond, pas par réflexe. Dire non à tout est aussi une faiblesse.' },
    { n: 11, t: 'Induction non admise', f: 'quest', nat: 'limite', faux: 'Généralisation hâtive',
      p: 'Tu obtiens l’accord sur des cas particuliers, puis tu présentes la règle générale comme déjà admise.',
      ex: '« Tu as admis A, B et C : tu admets donc la règle. »',
      r: 'On te fait dire oui cas par cas, puis on conclut pour toi.',
      c: 'Accepte les cas, mais refuse la généralisation : des exemples ne font pas une règle.' },
    { n: 12, t: 'Choisir ses mots', f: 'sens', nat: 'limite', faux: 'Cadrage',
      p: 'Tu choisis le mot ou l’image qui sert ta thèse, et une étiquette chargée pour celle de l’adversaire.',
      ex: '« Innovation » contre « altération » ; « piété » contre « fanatisme ».', exS: 1,
      r: 'Deux personnes décrivent la même chose avec des mots opposés.',
      c: 'Remplace l’étiquette par un terme neutre ou par la description des faits.' },
    { n: 13, t: 'La contre-proposition en contraste', f: 'quest', nat: 'limite', faux: 'Effet de contraste',
      p: 'Tu présentes d’abord la contre-proposition, pour que ta propre proposition paraisse acceptable par contraste.',
      ex: 'Pour faire admettre qu’un enfant doit obéir en tout : « Faut-il obéir ou désobéir à son père en tout ? »', exS: 1,
      r: 'On t’offre deux options alors qu’il en existe d’autres.',
      c: 'Refuse le cadre : « Il y a plus de deux possibilités. »' },
    { n: 14, t: 'Proclamer la victoire', f: 'quest', nat: 'deloyal', faux: 'Bluff',
      p: 'Après des réponses qui ne t’arrangent pas, tu énonces la conclusion voulue comme si elle était prouvée.',
      ex: '« Voilà, c’est démontré ! » alors qu’une étape manque.',
      r: 'Une conclusion annoncée avec aplomb, sans que le raisonnement l’ait établie.',
      c: 'Dis calmement : « Non, ce n’est pas démontré, il manque cette étape. »' },
    { n: 15, t: 'La vérité voisine', f: 'esq', nat: 'limite', faux: '',
      p: 'Pour défendre un paradoxe, tu proposes une vérité voisine, peu évidente. Si elle est refusée, tu ridiculises l’adversaire ; si elle est acceptée, tu t’en sers.',
      ex: '« Tu admets que tout le monde peut se tromper ? Alors toi aussi : tu ne peux rien affirmer. »',
      r: 'On te demande d’admettre une généralité inoffensive pour en tirer un paradoxe.',
      c: 'Accepte la vérité en précisant ce qu’elle ne permet pas de conclure.' },
    { n: 16, t: 'L’argument ad hominem', f: 'perso', nat: 'limite', faux: 'Ad hominem (tu quoque)',
      p: 'Tu cherches une contradiction entre la thèse de l’adversaire et ce qu’il dit ou fait par ailleurs. Cela ne prouve rien sur le fond, mais embarrasse.',
      ex: '« Tu prônes la sobriété et tu as pris l’avion trois fois cette année. »',
      r: 'On parle de ta conduite, plus de ton argument.',
      c: 'Reconnais la contradiction si elle existe, puis rappelle que l’argument est vrai ou faux indépendamment de toi.' },
    { n: 17, t: 'La distinction subtile', f: 'esq', nat: 'limite', faux: '',
      p: 'Face à une preuve contraire, tu invoques une distinction : si le mot recouvre deux notions, tu t’en sers pour t’échapper.',
      ex: '« Je n’ai pas menti, j’ai omis. »',
      r: 'Une distinction apparaît pile quand l’argument devient gênant.',
      c: 'Demande ce que la distinction change concrètement. Si elle ne change rien, c’est une esquive.' },
    { n: 18, t: 'Interrompre le débat', f: 'esq', nat: 'deloyal', faux: '',
      p: 'Si l’adversaire est sur le point de gagner, tu interromps, tu romps le fil ou tu changes de sujet.',
      ex: '« On manque de temps, passons au point suivant », au moment où l’argument porte.',
      r: 'La discussion s’arrête juste quand elle tourne à ton avantage.',
      c: 'Reviens poliment : « Avant de changer de sujet, finissons celui-ci. »' },
    { n: 19, t: 'Généraliser l’objection', f: 'esq', nat: 'limite', faux: '',
      p: 'Si tu n’as pas d’objection précise, tu parles en général pour mettre en doute sans rien démontrer.',
      ex: 'Évoquer la faillibilité de la connaissance humaine pour écarter une thèse précise.', exS: 1,
      r: 'Un doute vague, valable pour n’importe quel sujet.',
      c: 'Demande l’objection précise : « Et sur ce point-là, qu’est-ce qui est faux ? »' },
    { n: 20, t: 'Tirer la conclusion à sa place', f: 'quest', nat: 'limite', faux: 'Non sequitur',
      p: 'Tu tires la conclusion sans la demander à l’adversaire, même s’il manque une prémisse, comme si elle était acquise.',
      ex: '« Donc nous sommes d’accord : on supprime le poste. »',
      r: 'Quelqu’un conclut à ta place, plus vite que le raisonnement.',
      c: 'Demande chaque étape : « Je n’ai pas dit cela. »' },
    { n: 21, t: 'Un argument superficiel contre un autre', f: 'esq', nat: 'limite', faux: '',
      p: 'Quand l’adversaire avance un argument qui a l’air bon mais qui est superficiel, tu réponds par un contre-argument tout aussi superficiel, au lieu d’expliquer ce qui cloche. Schopenhauer le conseille : c’est la victoire qui compte.',
      ex: 'À un slogan, on oppose un autre slogan.',
      r: 'La discussion reste au niveau des formules.',
      c: 'Prends le temps d’expliquer pourquoi l’argument est superficiel, même si c’est moins spectaculaire.' },
    { n: 22, t: 'Refuser une prémisse trop proche', f: 'quest', nat: 'deloyal', faux: 'Fausse accusation de pétition de principe',
      p: 'Si l’adversaire te demande d’admettre une prémisse presque identique à la question, tu la refuses en la qualifiant de pétition de principe.',
      ex: '« Tu supposes ce que tu veux prouver », dit à propos d’une prémisse qui est pourtant légitime.',
      r: 'On refuse une prémisse raisonnable en l’accusant de tourner en rond.',
      c: 'Demande à établir la prémisse à part, par d’autres arguments.' },
    { n: 23, t: 'Faire exagérer', f: 'sens', nat: 'limite', faux: '',
      p: 'La contradiction pousse à durcir sa thèse. Tu contredis donc l’adversaire pour qu’il exagère, puis tu le ramènes aux limites de ce qu’il disait.',
      ex: '« C’est ce que j’ai dit, et rien de plus. »', exS: 1,
      r: 'Tu te surprends à dire « toujours » ou « jamais » sous la contradiction.',
      c: 'Ne te laisse pas pousser : « C’est ce que j’ai dit, et rien de plus. »', cS: 1 },
    { n: 24, t: 'Le faux syllogisme', f: 'sens', nat: 'deloyal', faux: 'Non sequitur',
      p: 'Tu tires de la thèse adverse des conclusions qu’elle ne contient pas et que son auteur ne voulait pas dire.',
      ex: '« Tu dis qu’il faut aider les plus fragiles : tu veux donc que plus personne ne travaille. »',
      r: 'On te fait dire ce que tu n’as pas dit, par une « conséquence ».',
      c: 'Montre l’étape fausse : « De A à B, la conséquence n’est pas valable. »' },
    { n: 25, t: 'Le contre-exemple', f: 'perso', nat: 'loyal', faux: '',
      p: 'Un seul cas qui ne correspond pas à la règle générale suffit à la renverser.',
      ex: '« Tous les ruminants ont des cornes », contredit par le chameau.', exS: 1,
      r: 'Quand tu dis « tous » ou « jamais », on cherche l’exception.',
      c: 'Vérifie que l’exemple est vrai, qu’il relève bien de la notion et que la contradiction est réelle.', cS: 1 },
    { n: 26, t: 'Retourner l’argument', f: 'perso', nat: 'loyal', faux: 'Retorsio',
      p: 'Tu retournes l’argument de l’adversaire contre lui.',
      ex: '« C’est un enfant, il faut l’excuser. » : « Justement, c’est parce que c’est un enfant qu’il faut le corriger. »', exS: 1,
      r: 'Ton argument se retourne : il prouve le contraire de ce que tu veux.',
      c: 'Avant de parler, demande-toi : « Et si on disait exactement l’inverse avec ma phrase ? »' },
    { n: 27, t: 'Insister sur ce qui fâche', f: 'emo', nat: 'limite', faux: '',
      p: 'Si l’adversaire s’emporte contre un argument, tu insistes : c’est probablement son point faible.',
      ex: 'Un collègue qui se crispe sur un chiffre : tu y reviens trois fois.',
      r: 'L’autre revient sans cesse sur le point qui t’énerve.',
      c: 'Si c’est toi : ta réaction signale que le point mérite d’être travaillé. Réponds avec calme et précision.' },
    { n: 28, t: 'S’adresser au public', f: 'emo', nat: 'deloyal', faux: 'Appel à la galerie',
      p: 'Tu avances une objection invalide, que seul un spécialiste verrait comme telle, pour faire rire ou convaincre le public.',
      ex: 'À un expert qui explique une statistique, on répond « Les chiffres, on leur fait dire ce qu’on veut », sous les rires.',
      r: 'La salle réagit, mais l’argument ne répond à rien.',
      c: 'Explique avec une image simple pourquoi l’objection ne tient pas, même si cela prend du temps.', cS: 1 },
    { n: 29, t: 'La diversion', f: 'esq', nat: 'deloyal', faux: 'Faux-fuyant (red herring)',
      p: 'Quand tu perds, tu changes brusquement de sujet comme si le nouveau sujet éclairait la question.',
      ex: 'Sur un retard de livraison, on se met à parler de la qualité du produit.',
      r: 'Le sujet change sans lien avec ce qui vient d’être dit.',
      c: 'Ne suis pas la digression : ramène à la question.', cS: 1 },
    { n: 30, t: 'L’appel à l’autorité', f: 'perso', nat: 'limite', faux: 'Argument d’autorité',
      p: 'Tu t’appuies sur une autorité plutôt que sur la raison, choisie selon ce que l’adversaire respecte.',
      ex: '« Un professeur de Harvard l’a dit. »',
      r: 'Un nom remplace un raisonnement.',
      c: 'Demande la source, le contexte et l’argument qui se cache derrière l’autorité.' },
    { n: 31, t: 'Feindre l’incompréhension', f: 'emo', nat: 'deloyal', faux: '',
      p: 'Tu déclares ne pas comprendre l’argument, pour laisser entendre qu’il est absurde ou confus.',
      ex: '« Désolé, je ne vois pas du tout où tu veux en venir. »',
      r: 'On déclare ne pas comprendre, sans dire quel point est flou.',
      c: 'Reformule plus simplement, une fois. Si l’autre refuse toujours, constate-le calmement.' },
    { n: 32, t: 'La catégorie odieuse', f: 'sens', nat: 'deloyal', faux: 'Association (étiquetage)',
      p: 'Tu ranges la thèse adverse dans une catégorie discréditée, même si le lien est mince.',
      ex: '« C’est du spinozisme », « c’est de l’athéisme » (exemples de Schopenhauer). Aujourd’hui : « C’est du complotisme. »', exS: 1,
      r: 'Une étiquette remplace la discussion sur le fond.',
      c: 'Demande en quoi l’étiquette s’applique, puis défends l’argument pour lui-même.' },
    { n: 33, t: 'Vrai en théorie, faux en pratique', f: 'esq', nat: 'deloyal', faux: '',
      p: 'Tu admets les prémisses mais tu nies la conclusion, en disant que cela ne marche pas en pratique.',
      ex: '« Dans les livres, c’est très beau, mais sur le terrain… »',
      r: 'On accepte tes raisons mais on refuse leurs conséquences, sans dire pourquoi.',
      c: 'Ce qui est juste en théorie doit l’être en pratique ; sinon, la théorie contient une erreur. Demande laquelle.', cS: 1 },
    { n: 34, t: 'Insister devant le silence', f: 'emo', nat: 'limite', faux: '',
      p: 'Quand l’adversaire répond de façon évasive ou ne répond pas, tu insistes : c’est un point faible.',
      ex: 'Une question répétée trois fois dès que tu hésites.',
      r: 'Tu hésites sur un point et on s’y accroche.',
      c: 'Réponds, même brièvement, ou dis ouvertement que tu y reviendras.' },
    { n: 35, t: 'Agir sur la volonté', f: 'emo', nat: 'deloyal', faux: 'Appel à l’intérêt',
      p: 'Tu ne cherches pas à convaincre l’esprit : tu montres à l’adversaire que sa thèse contrarie ses intérêts.',
      ex: '« Si tu défends cela, tu vas te mettre la direction à dos. »',
      r: 'On parle de ce que ça te coûterait, pas de ce qui est vrai.',
      c: 'Sépare : « Est-ce vrai ? » et « Est-ce avantageux ? » sont deux questions.' },
    { n: 36, t: 'Le jargon', f: 'emo', nat: 'deloyal', faux: 'Charabia',
      p: 'Tu déverses un discours savant et confus. L’auditeur n’ose pas avouer qu’il ne comprend pas, et croit à la profondeur.',
      ex: 'Un exposé plein de termes techniques, sans un seul exemple concret.',
      r: 'Beaucoup de mots, aucune image, personne n’ose demander.',
      c: 'Demande une définition ou un exemple : « Peux-tu me donner un cas concret ? »' },
    { n: 37, t: 'Réfuter la mauvaise preuve', f: 'sens', nat: 'deloyal', faux: 'Sophisme du sophisme',
      p: 'Si l’adversaire a raison mais donne une mauvaise preuve, tu réfutes la preuve et tu prétends avoir réfuté sa thèse.',
      ex: 'La preuve ontologique de l’existence de Dieu : l’échec de cette preuve n’établit pas la fausseté de la thèse (exemple de Schopenhauer).', exS: 1,
      r: 'On démolit ton exemple ou ta preuve, puis on déclare ta thèse fausse.',
      c: 'Distingue : une preuve fautive ne rend pas la thèse fausse. Propose une meilleure preuve.' },
    { n: 38, t: 'Devenir personnel', f: 'perso', nat: 'deloyal', faux: 'Attaque personnelle (ad personam)',
      p: 'Quand tu sens que tu perds, tu attaques la personne plutôt que le sujet : insulte, mépris, grossièreté.',
      ex: '« De toute façon, quelqu’un de ton niveau ne peut pas comprendre. »',
      r: 'Le ton devient personnel et le sujet disparaît.',
      c: 'Réponds calmement que cela n’a rien à voir, reviens au fond, sans relever les insultes.', cS: 1 }
  ],
  quiz: [
    { q: 'Tu dis : « Il faut limiter les écrans des enfants. » On te répond : « Donc tu veux interdire Internet ! »', n: 1, o: [1, 2, 29, 30], e: 'Ta thèse est étendue au-delà de ce que tu as dit, puis réfutée. Réponse : préciser exactement le point en litige.' },
    { q: 'Dans un débat sur « la liberté », l’un parle de liberté politique, l’autre répond sur la liberté de conscience et conclut qu’il a tort.', n: 2, o: [2, 12, 17, 36], e: 'Le mot change de sens en route. Réponse : fixer la définition avant d’avancer.' },
    { q: '« Tu n’as jamais rien compris à ce dossier », lancé en réunion pour te faire réagir.', n: 8, o: [8, 31, 35, 38], e: 'On cherche à te faire sortir de tes gonds. Réponse : nommer la manœuvre et revenir à l’argument.' },
    { q: 'Une réforme est présentée comme une « modernisation » par les uns, une « casse » par les autres.', n: 12, o: [12, 32, 6, 22], e: 'Chacun choisit l’étiquette qui sert sa thèse. Réponse : décrire les faits en termes neutres.' },
    { q: '« Tu défends l’écologie, mais tu as pris l’avion trois fois cette année. »', n: 16, o: [16, 30, 32, 28], e: 'On t’oppose ta conduite, pas ton argument. Réponse : reconnaître la contradiction si elle existe, mais rappeler que l’argument se juge seul.' },
    { q: 'Tu affirmes : « Tous les débats en ligne dégénèrent. » Quelqu’un en cite un qui s’est très bien passé.', n: 25, o: [25, 11, 19, 26], e: 'Un seul contre-exemple suffit à renverser une règle générale. C’est une technique loyale. Parade : ne pas dire « tous ».' },
    { q: 'En perdant le fil, l’autre se met à parler d’un tout autre sujet comme s’il éclairait la question.', n: 29, o: [29, 18, 33, 15], e: 'C’est la diversion. Réponse : ne pas suivre et ramener à la question.' },
    { q: '« Un professeur de Harvard l’a dit. », sans plus de détail.', n: 30, o: [30, 28, 35, 5], e: 'Un nom remplace un raisonnement. Réponse : demander la source et l’argument.' },
    { q: 'N’ayant plus d’argument, l’autre te lance : « De toute façon, quelqu’un de ton niveau ne peut pas comprendre. »', n: 38, o: [38, 31, 8, 16], e: 'C’est le dernier recours, selon Schopenhauer. Réponse : dire calmement que cela n’a rien à voir, puis revenir au fond.' },
    { q: 'Un exposé truffé de termes techniques, sans un seul exemple. Personne n’ose demander une explication.', n: 36, o: [36, 31, 19, 14], e: 'Le jargon impressionne et décourage la question. Réponse : demander un cas concret.' },
    { q: '« Dans les livres c’est très beau, mais sur le terrain ça ne marche pas. »', n: 33, o: [33, 19, 21, 34], e: 'On accepte les raisons mais pas leurs conséquences. Selon l’auteur, ce qui est juste en théorie doit l’être en pratique ; sinon la théorie est fautive.' },
    { q: 'Un vendeur te fait dire oui à trois petites questions, puis conclut : « Donc vous voulez le modèle premium. »', n: 4, o: [4, 13, 23, 7], e: 'On avance par accords successifs sans annoncer le but. Réponse : demander où cela mène avant de répondre.' }
  ]
};

;
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

;
/* Cours — Tome I (chapitres 11 à 15) et module Argumenter. */
window.AO_DATA.lessons.push(

{ id: 'c11', m: 'p3', n: 11, titre: 'Le vocabulaire de l’orateur', min: 7, src: 'livre',
  accroche: 'Les mots ne sont pas égaux. Certains font voir, entendre, ressentir ; d’autres endorment. Le premier travail sur le langage est un travail de choix.',
  sections: [
    { h: 'Simple, fort, concret', p: ['À l’oral, le public n’a pas le temps de relire, ni de revenir en arrière. Un mot simple, compris immédiatement, vaut toujours mieux qu’un mot savant qui fait décrocher une partie de la salle. Un mot concret (« une porte qui claque ») frappe plus qu’un mot abstrait (« une manifestation de désaccord »). La règle tient en trois adjectifs : préfère le simple au compliqué, le fort au tiède, le concret à l’abstrait.'] },
    { h: 'Le pouvoir des verbes d’action', p: ['Les verbes portent l’énergie d’une phrase. « Nous devons procéder à une amélioration de nos résultats » est mou, administratif, oubliable ; « Améliorons nos résultats » claque et avance. Chaque fois que tu peux remplacer un nom abstrait par un verbe d’action, ta phrase gagne en force et en clarté. Traque les tournures en « -tion » et en « -ment » : elles alourdissent presque toujours une idée qui pourrait être dite avec un verbe.'] },
    { h: 'Les mots sensoriels', p: ['Le cerveau retient ce qu’il peut se représenter. Les mots qui font voir, entendre, toucher, sentir ou goûter ancrent une idée dans le corps du public, pas seulement dans sa tête. « La salle était silencieuse » informe ; « on entendait le tic-tac de l’horloge » fait ressentir le silence. C’est la différence entre dire une idée et la faire vivre.'] },
    { h: 'Pour aller plus loin : les briques de Périer', p: [
      'Bertrand Périer résume l’enjeu en une image : plus on a de briques, plus on construit une belle maison ; plus on a de mots, plus la parole est précise, juste et claire. La richesse du vocabulaire nourrit aussi la confiance : savoir qu’on dispose du mot exact supprime l’hésitation.',
      'Nuance utile : un vocabulaire riche n’est pas un vocabulaire rare. L’objectif est la précision, pas l’ornement. Un mot exact peut être simple.',
      'Carnegie va dans le même sens : employer des mots concrets, usuels, imagés, et remplacer une idée générale par un détail précis (un nom propre, un chiffre, un dialogue).' ] }
  ],
  retenir: ['Trois qualités d’un bon mot à l’oral : simple, fort, concret.', 'Un verbe d’action bat un nom abstrait. « Améliorons » l’emporte sur « procéder à une amélioration ».', 'Les mots sensoriels gravent l’idée dans la mémoire du public.'],
  exercice: 'Prends un paragraphe que tu as écrit. Souligne chaque nom abstrait en « -tion » ou « -ment ». Essaie d’en transformer trois en verbes d’action, quitte à refaire la phrase. Relis à voix haute : elle respire mieux, elle avance, elle sonne comme quelqu’un qui parle et non comme un rapport. Carnet à mots nouveaux (Périer) : chaque jour, ouvre le dictionnaire au hasard, note un mot, et réutilise-le dans la journée.',
  quiz: [
    { q: 'Quel mot frappe le plus à l’oral ?', o: ['Une manifestation de désaccord', 'Une porte qui claque', 'Une situation conflictuelle'], a: 1, e: 'Le concret frappe plus que l’abstrait.' },
    { q: 'Que faire des noms en « -tion » et « -ment » ?', o: ['Les multiplier', 'Les transformer en verbes d’action quand c’est possible', 'Les réserver à la conclusion'], a: 1, e: 'Ils alourdissent ; un verbe d’action est plus net.' },
    { q: 'Le vocabulaire riche sert surtout à…', o: ['Impressionner', 'Être précis, juste et clair', 'Parler plus longtemps'], a: 1, e: 'Il vise la précision et nourrit la confiance.' }
  ],
  sources: [] },

{ id: 'c12', m: 'p3', n: 12, titre: 'Les figures de style essentielles', min: 8, src: 'livre',
  accroche: 'Les figures de style ne sont pas des ornements pour poètes : ce sont des machines à graver une idée dans la mémoire.',
  sections: [
    { h: 'La métaphore et l’analogie', p: ['La métaphore compare sans le dire : « un océan de doutes », « la colonne vertébrale du projet ». L’analogie explique le complexe par le simple : « l’entreprise est un organisme vivant : coupez une fonction, et tout le corps souffre ». Toutes deux rendent visible et familier ce qui était abstrait et nouveau. On ne définit pas, on montre par le connu.'] },
    { h: 'L’anaphore et la gradation', p: ['L’anaphore répète un même segment en tête de phrases successives. Elle martèle, elle rythme, elle soulève une salle : le « I have a dream » de Martin Luther King, répété inlassablement, est resté dans l’Histoire grâce à cette répétition. La gradation fait monter l’intensité d’un cran à chaque mot (« il a hésité, puis douté, puis renoncé ») et crée un crescendo qui entraîne le public vers un sommet.'] },
    { h: 'L’antithèse et la question rhétorique', p: ['L’antithèse oppose deux idées dans une même phrase pour les rendre plus frappantes : « un petit pas pour l’homme, un grand pas pour l’humanité » (Armstrong). Le contraste imprime la phrase dans la mémoire. La question rhétorique pose une question sans en attendre la réponse : « Et si, pour une fois, on osait vraiment ? » Le public répond dans sa tête et se sent partie prenante du raisonnement.'] },
    { h: 'Pour aller plus loin : le coût d’une figure', p: [
      'Une figure est un contrat avec l’auditeur : tu lui demandes un effort d’interprétation, il attend un gain d’image ou de rythme. Si le gain est faible, la figure devient du bruit.',
      'Exemples de dosage : Churchill utilise une anaphore longue en péroraison seulement. King place « I have a dream » à un moment précis du discours, pas partout. La rareté fait la force.',
      'Test de la bonne métaphore : un proche la répète sans que tu le lui demandes. Si elle se retient toute seule, elle est juste.' ] }
  ],
  retenir: ['Six figures suffisent : métaphore, analogie, anaphore, gradation, antithèse, question rhétorique.', 'Elles ont un seul but : rendre une idée visible, rythmée et mémorable.', 'Deux à quatre figures fortes par discours. Au-delà, l’effet s’use et le procédé se voit.'],
  erreur: 'Truffer un discours de figures pour « faire orateur ». Utilisée une fois, au bon endroit, une figure marque durablement. Répétée sans cesse, elle devient un tic, et le public finit par voir le procédé au lieu de l’idée.',
  exercice: 'Prends ton idée centrale et trouve-lui UNE métaphore : une seule image juste, qui la rende visible. Teste-la à voix haute sur un proche. S’il hoche la tête ou répète l’image, tu tiens une phrase de discours. Sinon, cherche-en une autre.',
  quiz: [
    { q: '« Il a hésité, puis douté, puis renoncé » est…', o: ['Une gradation', 'Une antithèse', 'Une analogie'], a: 0, e: 'L’intensité monte d’un cran à chaque mot.' },
    { q: '« Un petit pas pour l’homme, un grand pas pour l’humanité » est…', o: ['Une anaphore', 'Une antithèse', 'Une métaphore'], a: 1, e: 'Deux idées opposées dans la même phrase.' },
    { q: 'Combien de figures fortes par discours ?', o: ['Deux à quatre', 'Dix', 'Une par phrase'], a: 0, e: 'Au-delà, l’effet s’use.' }
  ],
  sources: [] },

{ id: 'c13', m: 'p3', n: 13, titre: 'Le rythme et la musicalité', min: 7, src: 'livre',
  accroche: 'Un discours a une musique, même sur le papier. Cette musique naît d’un principe unique : le contraste.',
  sections: [
    { h: 'Phrases courtes, phrases longues', p: ['Une phrase longue développe, nuance, enveloppe, installe une idée dans sa complexité. Une phrase courte frappe. Le secret n’est pas de choisir l’une ou l’autre, mais de les alterner sciemment. Après une longue phrase qui déroule un raisonnement, une phrase de trois mots claque comme un coup de poing. C’est le contraste qui crée l’impact, jamais l’uniformité.'] },
    { h: 'Le silence, ponctuation de l’oral', p: ['À l’oral, le silence est une ponctuation à part entière : une virgule, un point, parfois un point d’exclamation. Une pause juste avant une idée forte crée l’attente et braque tous les regards ; une pause juste après lui laisse le temps de résonner. La peur du silence pousse à parler trop vite et à tout aplatir sur le même plan. Ce qui te paraît interminable, de l’intérieur, semble parfaitement naturel au public.'] },
    { h: 'Le rythme ternaire et les sonorités', p: ['Le groupe de trois possède un pouvoir rythmique presque musical : « Liberté, Égalité, Fraternité » ; « Veni, vidi, vici ». De même, une allitération discrète donne une texture à la phrase, à condition de rester légère. Trop appuyée, elle vire au jeu de mots et distrait.'] },
    { h: 'Pour aller plus loin : mesurer sa musicalité', p: [
      'Dans le Studio, l’appli mesure l’écart de hauteur de ta voix en demi-tons et le débit syllabique. Ce sont des repères de l’appli, pas des normes : sous 2 demi-tons, la voix paraît plate ; entre 2 et 4, vivante ; au-delà de 4, très marquée.',
      'Rythme écrit et rythme dit sont deux choses : lis ton texte à voix haute, souligne où tu respires, et coupe les phrases qui t’essoufflent. Si tu es à bout de souffle, ton public l’est aussi.',
      'Cas réel : la péroraison de Churchill du 4 juin 1940 alterne propositions parallèles et finit sur une formule brève. Le rythme est sa preuve.' ] }
  ],
  retenir: ['Le rythme naît du CONTRASTE : alterne phrases longues (profondeur) et phrases courtes (impact).', 'Le silence est la ponctuation de l’oral : avant une idée forte pour l’attente, après pour la laisser résonner.', 'Le groupe de trois sonne juste et se retient.'],
  exercice: 'Lis un de tes textes à voix haute et marque « / » à chaque endroit où tu respires naturellement. Puis ajoute volontairement deux silences avant tes deux idées les plus fortes. Relis à voix haute : le texte a pris du relief, il respire, il n’est plus une masse mais un parcours avec des sommets.',
  quiz: [
    { q: 'D’où naît le rythme ?', o: ['De la vitesse', 'Du contraste', 'De la répétition seule'], a: 1, e: 'Le contraste crée l’impact, jamais l’uniformité.' },
    { q: 'Pourquoi une pause avant une idée forte ?', o: ['Pour reprendre son souffle seulement', 'Elle crée l’attente', 'Elle remplace l’idée'], a: 1, e: 'Elle braque les regards sur ce qui vient.' }
  ],
  sources: [] },

{ id: 'c14', m: 'p3', n: 14, titre: 'Raconter des histoires', min: 8, src: 'livre',
  accroche: 'On oublie les chiffres, on retient les histoires. Le storytelling n’est pas un gadget de communicant : c’est le plus vieux véhicule d’idées du monde.',
  sections: [
    { h: 'Pourquoi l’histoire bat le fait', p: ['Un fait s’adresse à la raison seule ; une histoire s’adresse à la raison et à l’émotion en même temps. Elle donne un visage à une idée abstraite, elle crée de l’attente (« et ensuite ? ») qui tient l’auditoire, et elle se retient presque sans effort parce qu’elle a une forme, un début, une fin. Un bon exemple vécu convainc souvent mieux qu’une statistique impeccable : la statistique prouve, mais l’histoire fait ressentir, et c’est le ressenti qui décide.'] },
    { h: 'La structure universelle', p: ['Presque toutes les histoires qui marchent suivent le même trajet : un héros, un obstacle, une transformation. Quelqu’un veut quelque chose ; un obstacle se dresse ; il le franchit et en ressort changé. Dès que tu racontes, cherche ces trois éléments : sans obstacle, il n’y a pas d’histoire, seulement une liste d’événements.'] },
    { h: 'Personnelle et universelle à la fois', p: ['Les meilleures histoires d’orateur sont personnelles dans les détails et universelles dans le sens. Une anecdote précise et vécue (un lieu, une heure, une odeur, une phrase entendue) donne de la vérité ; mais elle doit porter une leçon que chacun peut faire sienne. Le détail rend crédible ; le sens rend utile.'] },
    { h: 'Pour aller plus loin : un récit, une idée', p: [
      'Une objection sérieuse : une histoire n’est pas une preuve. Un cas isolé ne démontre pas une règle. Le bon usage : l’histoire éclaire et fait retenir, la preuve établit. Combine-les : un récit pour ouvrir, un chiffre pour établir.',
      'Carnegie, dans sa formule pour les interventions courtes, recommande de consacrer l’essentiel du temps à un seul événement vécu, de le commencer par un détail précis et de le revivre en le racontant. Un récit, une idée.',
      'Cas réel : Steve Jobs à Stanford raconte trois histoires (un cours de calligraphie, un licenciement, la maladie) et chacune porte une leçon explicite. Obama, en 2004, relie son histoire familiale à un récit national.',
      'Pour toi : tu as un matériau rare (Madagascar, Paris, l’alternance, le luxe). Un détail précis de ton parcours est plus fort qu’un concept.' ] }
  ],
  retenir: ['Une histoire parle à la raison ET à l’émotion. Elle se retient sans effort, là où le fait s’oublie.', 'Structure universelle : un héros, un obstacle, une transformation. Sans obstacle, pas d’histoire.', 'Détails précis (pour la vérité) + sens universel (pour l’utilité) = l’histoire qui touche et qui reste.'],
  methode: 'Pour illustrer n’importe quelle idée abstraite : cherche un moment précis de ta propre vie où tu l’as vécue, et raconte-le. « Un jour… » est l’un des débuts les plus puissants qu’un orateur puisse prononcer : la salle se tait d’elle-même.',
  exercice: 'Choisis une idée abstraite (la confiance, la patience…). Raconte en 1 minute une scène où tu l’as vécue : lieu, obstacle, action, leçon en une phrase. Enregistre-toi dans le Studio avec l’exercice « Raconter une histoire ».',
  quiz: [
    { q: 'Quels sont les trois éléments d’une histoire qui marche ?', o: ['Un héros, un obstacle, une transformation', 'Un chiffre, une preuve, une conclusion', 'Un début, un milieu, une pause'], a: 0, e: 'Sans obstacle, il n’y a qu’une liste d’événements.' },
    { q: 'Une histoire est-elle une preuve ?', o: ['Oui, toujours', 'Non : elle éclaire et fait retenir', 'Seulement si elle est drôle'], a: 1, e: 'Un cas isolé ne démontre pas une règle ; combine récit et preuve.' }
  ],
  sources: [{ t: 'Rev : transcription du discours de Stanford (Jobs, 2005)', u: 'https://www.rev.com/blog/transcripts/steve-jobs-stanford-commencement-speech-transcript-2005' }] },

{ id: 'c15', m: 'p3', n: 15, titre: 'Citations et formules mémorables', min: 6, src: 'livre',
  accroche: 'Une bonne citation éclaire ; une mauvaise alourdit. Et la formule la plus puissante n’est pas toujours celle d’un autre : c’est parfois la tienne.',
  sections: [
    { h: 'Quand citer, et quand se taire', p: ['On cite pour deux raisons seulement : pour appuyer une idée sur une autorité que le public respecte, ou pour dire mieux, en une phrase parfaite, ce qu’on développerait maladroitement en dix. En dehors de ces deux cas, une citation plaquée, décorative, un peu hors sujet, affaiblit le propos : elle donne l’impression qu’on se cache derrière les mots d’un autre faute d’en avoir à soi.'] },
    { h: 'Introduire une citation avec fluidité', p: ['On la prépare d’un mot (« comme le disait un tel », « il y a une phrase qui résume cela »), on la livre nettement, puis on la relie aussitôt à son propre propos. L’erreur classique est de citer, puis d’enchaîner sur autre chose sans commentaire : la citation reste un corps étranger. Bien reliée, elle devient une marche de plus dans ton raisonnement.'] },
    { h: 'Créer ses propres formules', p: ['Les phrases qu’on retient d’un discours sont presque toujours courtes, rythmées, un peu inattendues. Elles jouent sur le contraste d’une antithèse, sur la triade, ou sur une image forte. On peut les fabriquer volontairement : prends ton idée centrale et cherche à la dire en moins de huit mots, avec une image ou une opposition. Réécris-la dix fois s’il le faut. Cette phrase, préparée et polie, deviendra ce que le public répétera à ta place en sortant.'] },
    { h: 'Pour aller plus loin : vérifier avant de citer', p: [
      'Beaucoup de citations circulent attribuées à de grands noms sans source. En citer une fausse, devant un public averti, ruine l’ethos d’un coup. Règle : si tu ne peux pas retrouver la phrase dans une source (livre, discours enregistré), ne l’attribue pas, ou dis « on attribue à… ».',
      'Dans l’onglet Preuves de l’appli, note la source et la date de vérification de chaque citation que tu comptes utiliser.' ] }
  ],
  retenir: ['Cite peu, cite juste : seulement si la phrase dit mieux que toi, et seulement pour servir ton propos.', 'Introduis toujours une citation, puis relie-la à ton idée ; ne la laisse jamais orpheline.', 'Ta meilleure formule est souvent la tienne : courte, rythmée, imagée, sous huit mots.'],
  exercice: 'Résume l’idée principale de ton prochain discours en une phrase de moins de huit mots. Réécris-la cinq fois, en cherchant à chaque tentative une image ou une opposition. Garde la meilleure : c’est ta phrase-signature, celle que tu placeras à la fin et que la salle emportera.',
  quiz: [
    { q: 'Quand citer ?', o: ['Pour décorer', 'Quand la citation dit mieux que toi ou appuie sur une autorité', 'À chaque partie'], a: 1, e: 'Seulement dans ces deux cas.' },
    { q: 'Que faire après une citation ?', o: ['Enchaîner sans commentaire', 'La relier à ton propos', 'La répéter'], a: 1, e: 'Sinon elle reste un corps étranger.' }
  ],
  sources: [] },

/* ---------- ARGUMENTER ---------- */
{ id: 'a1', m: 'pa', n: 'A1', titre: 'Trouver des arguments : les deux grilles', min: 8, src: 'app',
  accroche: 'Face à un sujet, on manque rarement de convictions ; on manque d’arguments. Deux grilles permettent d’en trouver sur presque tout.',
  sections: [
    { h: 'La grille du journaliste', p: ['Parcours un sujet comme les rubriques d’un journal. Ai-je un argument politique ? Économique ? Géopolitique ? Culturel ? Social ? Environnemental ? Technologique ? Chaque rubrique est un angle d’attaque. Sur un même sujet, un public d’entrepreneurs sera sensible à l’économique, un public d’élus au politique, un public de parents au social.'] },
    { h: 'La grille scolaire', p: ['Replonge dans les matières apprises à l’école. Ai-je un argument mathématique (statistiques, chiffres) ? Philosophique (valeurs, principes) ? Juridique (lois, règlements) ? Historique (précédents, leçons) ? Cette grille, proposée par Bertrand Périer, force à sortir de l’opinion pour chercher une preuve dans un champ de savoir.'] },
    { h: 'Exemple appliqué', p: [
      'Sujet : « Faut-il apprendre l’art oratoire à l’école ? » Politique : une démocratie vit de la parole. Économique : la prise de parole est un levier de carrière. Social : la parole est un marqueur social (c’est la thèse de Périer en Seine-Saint-Denis). Philosophique : bien parler, c’est penser clairement. Historique : l’éducation antique faisait de la rhétorique une base.',
      'Tu obtiens cinq arguments en deux minutes. Reste à choisir les deux ou trois qui parlent à ton public.' ] },
    { h: 'Choisir et hiérarchiser', p: [
      'Trouver n’est pas décider. Trois critères de tri : la solidité (peut-on la vérifier ?), la pertinence (répond-elle à la question du public ?), la force (frappe-t-elle ?). Garde un argument de chaque type si possible : un de raison (chiffre), un d’émotion (cas vécu), un de valeur (principe).',
      'Et garde ton plus fort pour la fin, comme l’indique le plan classique.' ] }
  ],
  retenir: ['Grille du journaliste : politique, économique, géopolitique, culturel, social…', 'Grille scolaire : maths, philosophie, droit, histoire…', 'Trouver, puis trier : solidité, pertinence, force.'],
  exercice: 'Prends un sujet d’actualité. Applique les deux grilles et note un argument par rubrique. Garde-en trois et classe-les du plus faible au plus fort.',
  quiz: [
    { q: 'La grille du journaliste explore un sujet par…', o: ['Les rubriques d’un journal', 'Les matières scolaires', 'Les cinq canons'], a: 0, e: 'Politique, économique, culturel, social, etc.' },
    { q: 'Une statistique relève de la grille…', o: ['Scolaire (mathématique)', 'Du journaliste uniquement', 'Aucune'], a: 0, e: 'Argument mathématique : chiffres et statistiques.' }
  ],
  sources: [] },

{ id: 'a2', m: 'pa', n: 'A2', titre: 'Les types d’arguments et leur bon usage', min: 9, src: 'app',
  accroche: 'Un argument n’est pas un fait posé : c’est un raisonnement qui part d’une raison pour appuyer une conclusion.',
  sections: [
    { h: 'Les quatre pièces d’un argument', p: ['Une affirmation (ce que tu soutiens), une preuve (fait, exemple, source), un lien (pourquoi cette preuve soutient l’affirmation), et l’anticipation de l’objection. Sans lien, la preuve reste posée là. Le philosophe Stephen Toulmin a proposé, à la fin des années 1950, un modèle qui ajoute le fondement, le qualificatif (« probablement ») et la réserve (les cas où l’argument ne tient pas).'] },
    { h: 'Les grands types', p: [
      'Argument d’autorité : s’appuyer sur une source perçue comme fiable (« les études du GIEC »). Il vaut ce que vaut la source : vérifie-la, et choisis une autorité que ton public reconnaît.',
      'Argument par l’exemple : un cas précis qui illustre une règle. Fort pour faire comprendre, faible pour prouver une généralité.',
      'Argument par analogie : comparer deux situations pour en tirer une conclusion (« même travail, même augmentation »). Il vaut ce que vaut la ressemblance : si les différences comptent, l’analogie casse.',
      'Argument de cause à effet : montrer qu’une cause produit un effet. Attention à ne pas confondre corrélation et causalité.',
      'Syllogisme : prémisse majeure (règle), prémisse mineure (fait), conclusion. « Le vol est puni par la loi ; M. X a volé ; donc M. X doit être puni. » Il est valide si la forme est correcte ; il est vrai si les prémisses le sont.' ] },
    { h: 'Pour aller plus loin : l’argument qui n’en est pas un', p: [
      'Le manuel Périer cite l’argument « ad personam » (attaquer la personne plutôt que l’idée) et un « argument du tiers exclu ». Attention au vocabulaire : l’exemple donné (« soit j’ai raison, soit vous êtes un idiot ») est ce que la logique appelle un faux dilemme. Le « tiers exclu » est un autre principe de logique. L’idée à retenir est juste, l’étiquette est discutable.',
      'Ces deux procédés marchent parfois, mais à un prix : un public averti repère le sophisme et retire sa confiance. Ton ethos vaut plus qu’un point marqué.' ] }
  ],
  retenir: ['Un argument = affirmation + preuve + lien. Sans lien, pas de démonstration.', 'Chaque type a un point faible : autorité (source), exemple (généralisation), analogie (ressemblance), causalité (corrélation).', 'Mieux vaut un argument honnête qu’un sophisme efficace : l’ethos est en jeu.'],
  erreur: 'Empiler les preuves sans dire pourquoi elles soutiennent la thèse. L’auditeur doit reconstituer le raisonnement seul, et s’il n’y arrive pas, il conclut que tu n’as pas prouvé.',
  exercice: 'Choisis une thèse. Écris trois arguments de types différents (autorité, exemple, analogie) et, pour chacun, la phrase de lien « donc… ». Dis-les en 1 minute.',
  quiz: [
    { q: 'Qu’est-ce que le « lien » dans un argument ?', o: ['Une citation', 'L’explication de pourquoi la preuve soutient l’affirmation', 'Un connecteur'], a: 1, e: 'Sans lien, la preuve reste posée là sans démontrer.' },
    { q: '« Soit j’ai raison, soit vous êtes un idiot » est…', o: ['Un syllogisme', 'Un faux dilemme', 'Un argument d’autorité'], a: 1, e: 'Deux options seulement, dont l’une est disqualifiée d’avance.' },
    { q: 'Point faible de l’analogie ?', o: ['Elle est toujours fausse', 'Elle vaut ce que vaut la ressemblance', 'Elle est trop courte'], a: 1, e: 'Si les différences comptent, l’analogie casse.' }
  ],
  sources: [{ t: 'Stanford Encyclopedia of Philosophy : Argument and Argumentation', u: 'https://plato.stanford.edu/entries/argument/' }] },

{ id: 'a3', m: 'pa', n: 'A3', titre: 'Les sophismes à reconnaître (et à éviter)', min: 8, src: 'app',
  accroche: 'Un sophisme est un raisonnement qui a l’air valide et ne l’est pas. Savoir les reconnaître protège de la manipulation, et protège ton ethos.',
  sections: [
    { h: 'Les plus courants', p: [
      'L’attaque contre la personne (ad hominem) : on discrédite celui qui parle au lieu de répondre à son idée.',
      'L’homme de paille : on déforme la position de l’adversaire en une version caricaturale, plus facile à abattre.',
      'Le faux dilemme : on présente deux options alors qu’il y en a d’autres.',
      'La pente glissante : on prétend qu’un premier pas mènera inévitablement à une catastrophe, sans le démontrer.',
      'L’appel à la foule : « tout le monde le fait » ne prouve pas que c’est juste.',
      'La généralisation hâtive : un ou deux cas suffisent à fonder une règle.',
      'Post hoc : « B suit A, donc A a causé B ».' ] },
    { h: 'Pourquoi ils marchent, et pourquoi tu les évites', p: [
      'Ils marchent parce qu’ils sont rapides et émotionnellement satisfaisants. Dans un débat chronométré, ils font gagner des secondes.',
      'Tu les évites pour une raison d’intérêt, pas seulement de morale : un public qui repère un sophisme baisse sa confiance sur tout le reste. Quintilien le disait à sa manière : la technique sans droiture est un danger.' ] },
    { h: 'Les reconnaître chez l’autre, et répondre', p: [
      'Nomme calmement le procédé, sans accuser : « Vous répondez à une idée que je n’ai pas exprimée ; ce que je dis, c’est… » (homme de paille). « Vous présentez deux options ; je vois une troisième… » (faux dilemme).',
      'Ne réponds jamais à un ad hominem par un autre : reviens à l’idée, calmement. Le public juge aussi le ton.' ] }
  ],
  retenir: ['Sophisme = raisonnement apparemment valide qui ne l’est pas.', 'Les plus fréquents : ad hominem, homme de paille, faux dilemme, pente glissante, appel à la foule.', 'Les éviter protège ton ethos ; les nommer calmement désarme l’adversaire.'],
  exercice: 'Regarde un débat télévisé ou lis un fil de commentaires. Relève trois sophismes et reformule chacun en version honnête de la même idée.',
  quiz: [
    { q: 'Déformer la position adverse pour la réfuter facilement, c’est…', o: ['Un homme de paille', 'Un syllogisme', 'Une analogie'], a: 0, e: 'On attaque une caricature.' },
    { q: 'Pourquoi éviter les sophismes ?', o: ['Ils sont interdits', 'Un public qui les repère retire sa confiance', 'Ils sont trop longs'], a: 1, e: 'Ton ethos vaut plus qu’un point marqué.' }
  ],
  sources: [{ t: 'Stanford Encyclopedia of Philosophy : Fallacies', u: 'https://plato.stanford.edu/entries/fallacies/' }] },

{ id: 'a4', m: 'pa', n: 'A4', titre: 'Réfuter sans écraser', min: 7, src: 'app',
  accroche: 'Réfuter ne veut pas dire détruire. Bien faite, la réfutation est la partie qui construit le plus de confiance.',
  sections: [
    { h: 'Les quatre gestes de la réfutation', p: [
      '1. Reformuler l’objection de façon juste, voire plus forte que l’adversaire. Cela prouve que tu l’as comprise.',
      '2. Reconnaître ce qu’elle a de valable. Une concession mesurée gagne de la crédibilité.',
      '3. Répondre : montrer où l’objection est fausse, incomplète ou hors sujet.',
      '4. Revenir à ta thèse, avec une phrase de transition (« c’est pourquoi… »).' ] },
    { h: 'Trois manières de répondre', p: [
      'Contester le fait : « ce chiffre est faux ou dépassé » (avec une source).',
      'Contester le lien : « le fait est vrai, mais il n’en découle pas cette conclusion ».',
      'Déplacer le cadre : « l’objection est exacte dans un cas, mais notre sujet est un autre cas ».' ] },
    { h: 'Cas réel : les objections de Simone Veil et de Badinter', p: [
      'Devant une assemblée hostile (481 députés hommes et 9 députées en 1974), Simone Veil tient un ton stable. Robert Badinter, en 1981, explique le retard français par des raisons politiques et la crainte de l’opinion plutôt que d’ignorer l’objection de l’opinion publique. Les deux montrent qu’on peut défendre une position difficile en nommant ce qui la rend difficile.' ,
      'Règle d’or : ne réponds jamais à l’objection que tu aurais voulu entendre.' ] }
  ],
  retenir: ['Reformuler → reconnaître → répondre → revenir.', 'Trois cibles : le fait, le lien, le cadre.', 'Nommer l’objection avant l’adversaire est un coup d’ethos.'],
  exercice: 'Écris l’objection la plus forte contre ta propre thèse. Réponds-y en 30 secondes en suivant les quatre gestes, puis enregistre-toi avec l’exercice « Répondre à une question ».',
  quiz: [
    { q: 'Premier geste de la réfutation ?', o: ['Contre-attaquer', 'Reformuler l’objection', 'Changer de sujet'], a: 1, e: 'Reformuler prouve que tu as compris.' },
    { q: 'Contester le lien, c’est dire…', o: ['Que le fait est faux', 'Que le fait est vrai mais ne mène pas à cette conclusion', 'Que l’adversaire a tort personnellement'], a: 1, e: 'On accepte le fait, on conteste ce qu’on en déduit.' }
  ],
  sources: [{ t: 'Vie-publique : Les 50 ans de la loi Veil (PDF)', u: 'https://www.vie-publique.fr/files/medias/L_essentiel_Numero_7_Les_50_ans_de_la_loi_Veil.pdf' }, { t: 'Amnesty France : discours de Robert Badinter', u: 'https://www.amnesty.fr/actualites/17-septembre-1981-discours-de-robert-badinter' }] }

);

;
/* Cours — Tome II, parties IV à VI (voix, corps, mémoire). Rédigé par l'appli d'après le plan du livre. */
window.AO_DATA.lessons.push(

{ id: 'c16', m: 'p4', n: 16, titre: 'Comprendre sa voix', min: 8, src: 'app',
  accroche: 'Il n’existe pas de « bonne » ou de « mauvaise » voix. Un violoncelle est beau, un hautbois est beau. Le vrai enjeu n’est pas ton timbre, mais ta capacité à le moduler.',
  sections: [
    { h: 'Les quatre paramètres', p: [
      'Ta voix se règle comme un instrument sur quatre curseurs : la hauteur (grave ou aiguë), l’intensité (le volume), le débit (la vitesse) et le timbre (la couleur). Un orateur qui ne joue que sur un seul curseur paraît monotone ; un orateur qui en varie plusieurs paraît vivant.',
      'Dans le Studio, l’appli mesure la hauteur médiane de ta voix, sa variation en demi-tons, la variation de volume et le débit syllabique. Ce sont des mesures, pas des jugements : elles te disent ce que tu fais, pas si c’est bien.' ] },
    { h: 'Voix du quotidien, voix d’implication', p: [
      'Bertrand Périer distingue deux exigences. La voix d’implication est plus modulée que celle du quotidien : elle montre l’enthousiasme et l’engagement. L’intelligibilité exige une articulation soignée et une puissance adaptée à la salle. Pour y arriver, il propose d’annoter son texte comme une partition : silences, pauses, accélérations, mots à accentuer.' ] },
    { h: 'S’écouter sans se juger', p: [
      'Presque tout le monde déteste sa voix enregistrée. L’explication courante est que, quand on parle, on l’entend en partie par les os du crâne, ce qui change la perception. Retiens surtout ceci : ce que tu entends enregistré, c’est ce que les autres entendent. C’est donc la seule version qui compte.',
      'Méthode : écoute trois fois le même enregistrement. La première pour supporter, la deuxième pour noter ce qui est bien, la troisième pour noter une seule chose à corriger.' ] }
  ],
  retenir: ['Quatre curseurs : hauteur, intensité, débit, timbre.', 'Toutes les voix sont belles à condition d’être variées.', 'Ta voix enregistrée est celle que les autres entendent : c’est la bonne référence.'],
  exercice: 'Enregistre 1 minute dans le Studio. Écoute trois fois : une fois pour supporter, une fois pour noter ce qui est bien, une fois pour choisir UN curseur à travailler.',
  quiz: [
    { q: 'Quels sont les quatre curseurs de la voix ?', o: ['Hauteur, intensité, débit, timbre', 'Souffle, regard, geste, pause', 'Voix, corps, mémoire, plan'], a: 0, e: 'Hauteur, intensité, débit et timbre.' },
    { q: 'Quelle est la version de ta voix qui compte ?', o: ['Celle que tu entends en parlant', 'Celle de l’enregistrement', 'Celle de ton imagination'], a: 1, e: 'C’est ce que les autres entendent.' }
  ],
  sources: [] },

{ id: 'c17', m: 'p4', n: 17, titre: 'Volume et projection', min: 7, src: 'app',
  accroche: 'Projeter, ce n’est pas crier. C’est faire arriver sa voix jusqu’au dernier rang sans forcer la gorge.',
  sections: [
    { h: 'Le souffle, carburant de la voix', p: [
      'Périer parle de l’air comme du « carburant de l’orateur ». Une voix qui porte s’appuie sur une respiration ample, basse (ventrale), et un souffle régulier. Quand le souffle est court, la voix monte dans la gorge, s’aiguise et se fatigue.',
      'Posture et souffle sont liés : une cage thoracique ouverte et un dos droit libèrent le diaphragme. C’est l’un des bénéfices de la posture décrite au chapitre 22.' ] },
    { h: 'Viser le fond de la salle', p: [
      'Deux images utiles : parler au mur du fond de la salle, ou envoyer sa voix par-dessus une colline. Tu adaptes ta puissance à la distance, pas à ton envie de montrer de l’énergie.',
      'Un micro n’est pas une excuse pour parler mou : il amplifie l’intention. Parle à la salle, pas au micro.' ] },
    { h: 'Intensité et sens', p: [
      'Le volume porte du sens : monter souligne, baisser attire. Une phrase dite plus bas, après plusieurs passages forts, force le public à se pencher. L’analyse de l’appli mesure la variation de volume : un volume très constant est un signe de monotonie.',
      'Attention aux fins de phrase qui s’éteignent : l’appli signale la part de tes phrases dont le volume baisse à la fin. Soutiens jusqu’au dernier mot.' ] }
  ],
  retenir: ['Projeter = souffle ample + articulation, pas crier.', 'Vise le fond de la salle, pas ton micro.', 'Varier le volume porte du sens ; soutiens tes fins de phrase.'],
  exercice: 'Lis un paragraphe à trois distances imaginaires : à un voisin, à la moitié de la salle, au mur du fond. Enregistre les trois et compare la clarté de la fin de chaque phrase.',
  quiz: [
    { q: 'Projeter, c’est…', o: ['Crier', 'Faire arriver la voix au fond sans forcer', 'Parler vite'], a: 1, e: 'Souffle ample et articulation.' },
    { q: 'Une fin de phrase qui s’éteint…', o: ['Donne du poids', 'Enlève du poids', 'Est sans effet'], a: 1, e: 'Soutiens jusqu’au dernier mot.' }
  ],
  sources: [] },

{ id: 'c18', m: 'p4', n: 18, titre: 'Débit et pauses', min: 9, src: 'app',
  accroche: 'La vitesse à laquelle tu parles est l’un des réglages les plus visibles. Les pauses sont la moitié de la musique.',
  sections: [
    { h: 'Un débit qui convient', p: [
      'Repère de l’appli : entre 110 et 160 mots par minute. En dessous, tu risques de traîner ; au-dessus, de perdre le public. C’est un guide, pas une loi : une conférence solennelle, une vidéo explicative et une conversation animée n’ont pas la même vitesse.',
      'Ce qui compte, c’est la variation : accélérer sur les passages connus, ralentir sur les idées clés.' ] },
    { h: 'Les trois pauses', p: [
      'Pause courte (moins de 0,9 s) : respirer, séparer des idées. Pause longue (0,9 à 2 s) : souligner, annoncer. Blanc (2 s et plus) : à éviter, sauf effet voulu ; sinon le public pense que tu cherches tes mots.',
      'L’appli classe tes pauses ainsi. Un blanc isolé n’est pas grave ; plusieurs blancs signalent souvent un défaut de préparation ou de transition.' ] },
    { h: 'Remplacer les tics par le silence', p: [
      'Les tics (euh, du coup, voilà, en fait, genre…) occupent la place d’un silence que tu as peur de tenir. Périer propose l’image d’un buzzer au son insupportable qui se déclenche chaque fois qu’un de ces mots s’apprête à sortir : tu le repousses et tu le remplaces par un silence ou une reformulation.',
      'Dans l’analyse du texte, l’appli compte tes tics pour 100 mots. Quelques-uns passent ; au-delà de 3 pour 100 mots environ, ils fatiguent. Ce seuil est un repère de l’appli.' ] },
    { h: 'Ne pas parler vite par peur', p: [
      'La peur accélère. Tu parles vite pour que ça finisse. Contre-mesure : ralentis volontairement sur les dix premières secondes, tiens une première pause avant de commencer, et respire sur chaque point final.' ] }
  ],
  retenir: ['110 à 160 mots/minute : repère, pas loi.', 'Pauses : courte (respirer), longue (souligner), blanc (à éviter sauf effet).', 'Un silence remplace un tic.'],
  exercice: 'Dis 1 minute en plaçant volontairement trois pauses longues avant tes mots clés. Puis refais-la en supprimant tous les tics. Compare les deux résultats dans l’historique.',
  quiz: [
    { q: 'Que faire à la place d’un « euh » ?', o: ['Parler plus vite', 'Un silence', 'Répéter le mot'], a: 1, e: 'Le silence remplace le tic.' },
    { q: 'La peur a généralement pour effet de…', o: ['Ralentir le débit', 'Accélérer le débit', 'Ne rien changer'], a: 1, e: 'Tu parles vite pour que ça finisse.' },
    { q: 'Un blanc, selon l’appli, dure…', o: ['Moins de 0,9 s', 'De 0,9 à 2 s', '2 s ou plus'], a: 2, e: 'Au-delà de 2 s, c’est un blanc.' }
  ],
  sources: [] },

{ id: 'c19', m: 'p4', n: 19, titre: 'Intonation et émotion', min: 8, src: 'app',
  accroche: 'Une même phrase peut vouloir dire dix choses selon la mélodie qui la porte.',
  sections: [
    { h: 'La mélodie fait le sens', p: [
      'Périer propose le « défi Fernandel » : prendre une phrase neutre (« Tout condamné à mort aura la tête tranchée ») et la dire de manière interrogative, dubitative, colérique, joyeuse, triste. Le sens littéral ne change pas ; la mélodie change tout. Cet exercice montre que l’intention passe par la voix.' ] },
    { h: 'Repères de l’appli', p: [
      'L’écart de hauteur de ta voix est mesuré en demi-tons (écart-type autour de ta médiane). Repères de l’appli, pas normes scientifiques : sous 2, la voix est plate ; entre 2 et 4, vivante ; au-delà de 4, très marquée.',
      'Une voix très marquée n’est pas un défaut en soi : une narration d’histoire en demande plus qu’un exposé technique. L’important est que la variation suive le sens.' ] },
    { h: 'Le piège de la montée finale', p: [
      'Une affirmation dont la voix monte à la fin sonne comme une question et suggère le doute. L’appli compte la part de fins montantes. Pour une affirmation, laisse retomber légèrement la hauteur sur le dernier mot ; réserve la montée aux vraies questions.' ] },
    { h: 'Annoter son texte comme une partition', p: [
      'Sur ton texte : souligne les mots à accentuer, marque « / » les respirations, « // » les pauses longues, ↗ une montée, ↘ une descente. Dis-le en suivant ta partition. Au bout de trois lectures, tu n’as plus besoin du papier, et la mélodie est installée.' ] }
  ],
  retenir: ['La mélodie porte l’intention, pas seulement les mots.', 'Voix plate sous 2 demi-tons, vivante de 2 à 4 (repères de l’appli).', 'Une affirmation redescend ; une question monte.'],
  exercice: 'Défi Fernandel : prends une phrase neutre et dis-la en cinq intentions (question, doute, colère, joie, tristesse). Enregistre et compare l’écart de hauteur entre la plus plate et la plus marquée.',
  quiz: [
    { q: 'Que mesure l’écart de hauteur de l’appli ?', o: ['La puissance', 'La variation de la mélodie en demi-tons', 'La vitesse'], a: 1, e: 'C’est l’écart-type de la hauteur autour de ta médiane.' },
    { q: 'Une affirmation dont la voix monte à la fin sonne comme…', o: ['Une certitude', 'Une question', 'Un ordre'], a: 1, e: 'La montée finale suggère le doute.' }
  ],
  sources: [] },

{ id: 'c20', m: 'p4', n: 20, titre: 'Articulation et diction', min: 7, src: 'app',
  accroche: 'Si on ne te comprend pas, rien d’autre ne compte. L’articulation est la politesse de l’orateur.',
  sections: [
    { h: 'Ouvrir la bouche', p: [
      'Beaucoup de mauvaise diction vient d’une mâchoire trop fermée et de lèvres paresseuses. Ouvrir davantage la bouche, surtout sur les voyelles, donne plus de clarté avec moins d’effort.' ] },
    { h: 'Les consonnes de fin', p: [
      'Une phrase est souvent perdue sur ses dernières syllabes : on baisse le volume et on avale la fin des mots. Entraîne-toi à finir chaque mot nettement, surtout en fin de phrase.' ] },
    { h: 'Les virelangues', p: [
      'Les virelangues sont des gammes pour la bouche. Commence lentement, articule exagérément, puis accélère en gardant la netteté. Exemples classiques : « Les chaussettes de l’archiduchesse sont-elles sèches, archi-sèches ? » ; « Un chasseur sachant chasser doit savoir chasser sans son chien. »',
      'Règle : la netteté avant la vitesse. Un virelangue rapide mais flou n’apprend rien.' ] },
    { h: 'Le crayon', p: [
      'Exercice classique de diction : lis un texte en tenant un crayon horizontalement entre les dents, puis relis-le sans crayon. La différence de netteté est souvent perceptible immédiatement. Arrête si tu ressens une douleur à la mâchoire.' ] }
  ],
  retenir: ['Ouvrir la bouche, surtout sur les voyelles.', 'Finir les mots et les phrases nettement.', 'Netteté avant vitesse, toujours.'],
  exercice: 'Dis lentement les deux virelangues du cours cinq fois chacun, en exagérant l’articulation. Puis lis un paragraphe de ton choix et enregistre-toi : les fins de phrase sont-elles nettes ?',
  quiz: [
    { q: 'Dans un virelangue, la priorité est…', o: ['La vitesse', 'La netteté', 'Le volume'], a: 1, e: 'On accélère seulement quand c’est net.' },
    { q: 'Où se perdent souvent les phrases ?', o: ['Au début', 'Sur les dernières syllabes', 'Au milieu'], a: 1, e: 'Le volume baisse et la fin des mots est avalée.' }
  ],
  sources: [] },

{ id: 'c21', m: 'p4', n: 21, titre: 'L’échauffement vocal', min: 5, src: 'app',
  accroche: 'Les plus grands orateurs, comme les pianistes, font leurs gammes. Cinq minutes avant de parler changent la voix.',
  sections: [
    { h: 'Une routine de cinq minutes', p: [
      '1. Détendre : roule les épaules, relâche la mâchoire, bâille largement.',
      '2. Respirer : inspire par le nez en gonflant le ventre (4 temps), expire lentement sur un « sss » ou un « fff » (8 temps). Répète cinq fois.',
      '3. Chauffer : fredonne un « mmm » en montant et descendant doucement. Roule les lèvres (le « brrr » des enfants), ce qui détend sans forcer.',
      '4. Articuler : deux virelangues, lentement.',
      '5. Poser : dis ta première phrase à voix haute, au volume prévu.' ] },
    { h: 'Les précautions', p: [
      'Bois de l’eau à température ambiante. Évite de te râcler la gorge (préfère avaler ou tousser doucement). Ne force jamais sur une voix enrouée. Si tu as des douleurs ou une extinction de voix prolongée, consulte un professionnel de santé.' ] }
  ],
  retenir: ['Cinq minutes : détendre, respirer, chauffer, articuler, poser.', 'Eau ambiante, pas de forçage.', 'Ta première phrase se dit à voix haute avant d’entrer.'],
  exercice: 'Fais la routine complète avant ton prochain enregistrement. Compare l’écart de hauteur et la clarté avec un enregistrement sans échauffement.',
  quiz: [
    { q: 'Que faire en cas de voix enrouée ?', o: ['Forcer pour la réchauffer', 'Ne pas forcer', 'Crier'], a: 1, e: 'Ne force jamais ; si cela dure, consulte un professionnel.' }
  ],
  sources: [] },

/* ---------- LE CORPS ---------- */
{ id: 'c22', m: 'p5', n: 22, titre: 'La posture', min: 7, src: 'app',
  accroche: 'Ton corps parle avant ta bouche. Il met en scène ta parole et conditionne la façon dont elle est reçue.',
  sections: [
    { h: 'Les deux réflexes de Périer', p: [
      'Pour éviter la posture avachie, signe de passivité : imagine un fil invisible qui relie le sommet de ta tête au plafond, tu te grandis. Puis ouvre la cage thoracique en tirant les épaules vers l’arrière, comme si les omoplates allaient se toucher. Cette posture libère aussi le diaphragme et améliore la respiration.' ] },
    { h: 'Ancrage', p: [
      'Pieds à largeur du bassin, poids réparti, genoux non verrouillés. Éviter de se balancer d’un pied sur l’autre : le balancement traduit la nervosité et distrait. Ton livre l’exprime ainsi : le corps calme annonce l’esprit calme.' ] },
    { h: 'Une précision sur les chiffres célèbres', p: [
      'Tu croiseras souvent l’affirmation selon laquelle 55 % de la persuasion vient du non-verbal, 38 % de la voix et 7 % des mots. C’est une généralisation abusive. Ces chiffres viennent d’études d’Albert Mehrabian dans les années 1960, portant sur la perception de sentiments ou d’attitudes à partir de mots isolés, en situation ambiguë, quand le message verbal et le ton se contredisent. Mehrabian lui-même a rappelé que cela ne s’applique pas à la communication en général.',
      'Ce qu’on peut dire honnêtement : le corps et la voix pèsent lourd sur la crédibilité perçue, surtout quand ils contredisent le texte. Mais le contenu compte, et les grands orateurs de ce cours l’ont prouvé. Mieux vaut ne pas citer ces pourcentages devant un public averti.' ] }
  ],
  retenir: ['Fil invisible vers le plafond + épaules ouvertes.', 'Ancrage : pieds posés, pas de balancement.', 'Ne cite pas le « 55-38-7 » : il est mal généralisé.'],
  exercice: 'Filme-toi 1 minute debout. Note : où sont tes pieds, tes épaules, tes mains ? Combien de fois te balances-tu ? Refais avec les deux réflexes et compare.',
  quiz: [
    { q: 'Que dit-on honnêtement du « 55 % / 38 % / 7 % » ?', o: ['C’est une loi de la persuasion', 'C’est une généralisation abusive d’une étude sur des situations ambiguës', 'C’est faux de bout en bout'], a: 1, e: 'Il s’applique à la perception d’attitudes quand mots et ton se contredisent.' },
    { q: 'Le balancement d’un pied sur l’autre traduit…', o: ['De la nervosité et distrait', 'De l’assurance', 'Rien'], a: 0, e: 'Il vaut mieux s’ancrer.' }
  ],
  sources: [{ t: 'Wikipedia : Albert Mehrabian (sur la règle 7-38-55)', u: 'https://en.wikipedia.org/wiki/Albert_Mehrabian' }] },

{ id: 'c23', m: 'p5', n: 23, titre: 'Le regard', min: 6, src: 'app',
  accroche: 'Le regard crée le lien. Un orateur qui ne regarde personne ne parle à personne.',
  sections: [
    { h: 'Face à un public', p: [
      'Ne fixe personne en particulier, mais ne regarde pas non plus au-dessus des têtes : adresse-toi à une personne à la fois, le temps d’une idée complète, puis change. Balaye la salle, y compris les côtés et le fond, pour que chacun se sente inclus.' ] },
    { h: 'Face à une personne qui intimide', p: [
      'Si le contact visuel direct te gêne, Périer conseille de fixer le point entre les sourcils : l’effet est le même, sans la confrontation. Son exercice du smiley hiérarchique va dans le même sens : visualise un smiley souriant sur le visage d’un supérieur pour désamorcer les projections d’angoisse.' ] },
    { h: 'Le regard et les notes', p: [
      'Regarder ses notes est normal ; y rester collé ne l’est pas. Lève les yeux au moins à chaque fin de phrase, et lis une phrase à la fois avant de la dire en regardant quelqu’un.',
      'Face caméra, regarde l’objectif pour les idées clés : c’est l’équivalent du contact visuel.' ] }
  ],
  retenir: ['Une personne, une idée, puis on change.', 'Point entre les sourcils si le regard direct intimide.', 'Lève les yeux à la fin de chaque phrase.'],
  exercice: 'Dans une pièce, adresse ton discours de 1 minute à trois objets placés à des endroits différents, un par idée. Filme-toi : les changements de regard sont-ils nets ?',
  quiz: [
    { q: 'Combien de temps regarder la même personne ?', o: ['1 seconde', 'Le temps d’une idée', 'Tout le discours'], a: 1, e: 'Une idée entière, puis on change.' }
  ],
  sources: [] },

{ id: 'c24', m: 'p5', n: 24, titre: 'Les gestes', min: 6, src: 'app',
  accroche: 'La règle d’or de Périer : « ni sémaphore, ni statue ».',
  sections: [
    { h: 'Des gestes qui servent l’idée', p: [
      'Vos gestes doivent être présents mais maîtrisés, simples, et cohérents avec le propos (on parle de congruence). Ils peuvent exprimer le rassemblement (mains ouvertes), la précision (pouce et index), la force d’une idée (poing doux), l’énumération (compter sur les doigts).' ] },
    { h: 'Les gestes parasites', p: [
      'Mains dans les poches, bras croisés, mains jointes devant ou derrière, stylo qu’on tourne, cheveux qu’on touche : ils trahissent la gêne et détournent l’attention. Pour calmer les mains, laisse-les au repos le long du corps ou légèrement jointes à hauteur du ventre, et gesticule seulement avec une intention.' ] },
    { h: 'L’exercice du discours muet', p: [
      'Choisis un discours de 1 à 2 minutes, coupe le son, observe la gestuelle, la posture et le regard. Puis invente un autre texte (une recette de cuisine, par exemple) en te laissant guider par le langage corporel de l’orateur. Le non-verbal impose un cadre au sens.' ] }
  ],
  retenir: ['Ni sémaphore, ni statue.', 'Un geste = une intention.', 'Les gestes parasites trahissent la gêne.'],
  exercice: 'Exercice du discours muet (Périer) : regarde un discours sans le son, invente un texte guidé par le corps de l’orateur. Note trois gestes à copier.',
  quiz: [
    { q: 'Que signifie « ni sémaphore, ni statue » ?', o: ['Gestes ni excessifs ni absents', 'Pas de gestes du tout', 'Gestes rapides'], a: 0, e: 'Présents mais maîtrisés.' }
  ],
  sources: [] },

{ id: 'c25', m: 'p5', n: 25, titre: 'Les déplacements', min: 5, src: 'app',
  accroche: 'Bouger est un outil, pas un tic. Un déplacement peut faire la transition à la place des mots.',
  sections: [
    { h: 'Bouger avec une raison', p: [
      'Un pas de côté marque un changement d’idée. Un pas vers le public souligne une confidence. Rester immobile sur une idée forte lui donne du poids. Évite les va-et-vient incessants, qui fatiguent le regard.' ] },
    { h: 'Utiliser l’espace', p: [
      'Une idée à gauche, une idée à droite : le public relie mentalement chaque zone à un point du discours. C’est aussi une aide-mémoire pour toi (voir le palais de mémoire).' ] },
    { h: 'Derrière un pupitre ou face caméra', p: [
      'Derrière un pupitre, bouge le haut du corps et les mains plutôt que de te figer. Face caméra, le « déplacement » devient un changement de plan, de cadrage ou de ton.' ] }
  ],
  retenir: ['Chaque déplacement a une raison.', 'Une zone de l’espace par idée.', 'Pas de va-et-vient permanent.'],
  exercice: 'Prépare un discours en trois parties avec trois zones. Répète-le à voix haute en changeant de zone aux transitions, puis filme-toi.',
  quiz: [
    { q: 'À quoi sert un pas de côté entre deux idées ?', o: ['À échapper au public', 'À marquer la transition', 'À se reposer'], a: 1, e: 'Le mouvement ponctue le sens.' }
  ],
  sources: [] },

{ id: 'c26', m: 'p5', n: 26, titre: 'L’expression du visage', min: 5, src: 'app',
  accroche: 'Un visage qui contredit les mots fait croire le visage, pas les mots.',
  sections: [
    { h: 'Congruence', p: [
      'Quand le visage exprime autre chose que ce que tu dis (un sourire crispé pendant une annonce grave), le public ressent l’incohérence. Laisse ton visage suivre ton intention, sans le surjouer.' ] },
    { h: 'Le sourire', p: [
      'Un sourire sincère au début détend la salle et toi-même. Un sourire plaqué tout le long fatigue et sonne faux. Souris quand c’est vrai, et laisse le visage s’adapter aux passages graves.' ] },
    { h: 'Se voir pour se corriger', p: [
      'Beaucoup ont un visage fermé quand ils se concentrent, sans le savoir. Filme-toi de près : la concentration ne doit pas devenir une grimace.' ] }
  ],
  retenir: ['Visage et mots doivent dire la même chose.', 'Souris quand c’est vrai.', 'Filme-toi pour voir ton visage de concentration.'],
  exercice: 'Dis la même phrase avec trois visages différents (neutre, souriant, sérieux). Filme-toi : lequel sert le mieux le sens ?',
  quiz: [
    { q: 'Si le visage contredit les mots, le public croit…', o: ['Les mots', 'Le visage', 'Aucun des deux'], a: 1, e: 'L’incohérence est ressentie et profite au visage.' }
  ],
  sources: [] },

/* ---------- LA MÉMOIRE ---------- */
{ id: 'c27', m: 'p6', n: 27, titre: 'Les techniques de mémorisation', min: 9, src: 'app',
  accroche: 'Notre mémoire des lieux est bien plus forte que notre mémoire des mots. Le palais de mémoire en exploite la puissance.',
  sections: [
    { h: 'Le palais de mémoire en détail', p: [
      'La tradition rapporte que le poète Simonide de Céos, seul survivant d’un banquet dont la salle s’était effondrée, put identifier chaque victime grâce à la place où chacune était assise. Cicéron raconte cette histoire dans le De oratore, et Quintilien enseigne la méthode des lieux. Le principe : choisir un lieu qu’on connaît par cœur et y déposer chaque idée sous forme d’image.',
      'Étape 1 : choisis un trajet fixe (entrée, couloir, salon, cuisine, chambre). Étape 2 : à chaque lieu, une idée transformée en image frappante, colorée, exagérée, en mouvement. Étape 3 : parcours le trajet trois fois à voix haute. Étape 4 : le jour J, tu ne récites pas, tu te promènes.' ] },
    { h: 'Rendre l’image mémorable', p: [
      'Plus l’image est étrange, concrète et chargée de sensations, mieux elle tient. Pour l’idée « les coûts augmentent de 40 % » : imagine ton canapé qui gonfle jusqu’au plafond en faisant éclater la fenêtre. Un nombre peut devenir un objet (40 = quarante pièces qui tombent en cascade).' ] },
    { h: 'Autres outils', p: [
      'Les initiales : un mot formé des premières lettres de tes idées (comme I-D-E-M-A). Les mots-clés : un seul mot par idée, pas une phrase. La règle de trois : trois parties, trois idées par partie. Le découpage (chunking) : regrouper en blocs plutôt que retenir une liste plate.' ] },
    { h: 'Une honnêteté sur l’efficacité', p: [
      'La méthode des lieux est documentée depuis l’Antiquité et utilisée par des compétiteurs de mémoire, mais elle demande de l’entraînement. Pour un discours de dix minutes, un trajet de cinq à sept lieux suffit largement.' ] }
  ],
  retenir: ['Un lieu connu + une image frappante par idée.', 'Parcours à voix haute trois fois.', 'Mots-clés, initiales, découpage : trois autres outils.'],
  exercice: 'Prépare un discours de trois idées. Place chaque idée dans une pièce de chez toi avec une image absurde. Parcours-le trois fois, puis dis le discours en t’appuyant seulement sur le trajet.',
  quiz: [
    { q: 'Qui est à l’origine de l’histoire du palais de mémoire ?', o: ['Simonide de Céos', 'Churchill', 'Périer'], a: 0, e: 'Cicéron rapporte l’histoire dans le De oratore.' },
    { q: 'Une bonne image mnémonique est…', o: ['Neutre et discrète', 'Étrange, concrète et sensorielle', 'Abstraite'], a: 1, e: 'Plus elle est frappante, mieux elle tient.' }
  ],
  sources: [] },

{ id: 'c28', m: 'p6', n: 28, titre: 'Parler sans notes', min: 7, src: 'app',
  accroche: 'Parler sans notes ne veut pas dire tout réciter par cœur. C’est tenir une structure et laisser les mots naître.',
  sections: [
    { h: 'Le parcours de slalom (Périer)', p: [
      'Imagine ton discours comme un slalom. Le portillon de départ : tes premiers mots, préparés. La ligne d’arrivée : tes derniers mots, préparés. Les portes : tes idées clés et mots-clés, passages obligés. L’espace entre les portes : ta zone de liberté, où tu formules spontanément.',
      'Conseil pratique : une demi-feuille avec les premiers mots, la liste des mots-clés et les derniers mots.' ] },
    { h: 'Pourquoi apprendre par cœur est risqué', p: [
      'Mémoriser mot à mot est fragile : un mot oublié fait tomber la chaîne. Carnegie conseille aussi de ne jamais apprendre son texte par cœur, mais d’assembler et classer ses idées et d’en parler à des amis. Exceptions : l’ouverture et la fin se savent mot pour mot.' ] },
    { h: 'Quand utiliser des notes', p: [
      'Des notes sont légitimes pour des chiffres, des citations, des textes juridiques. Écris gros, peu de mots, sur des fiches numérotées. Ne lis jamais une phrase entière : un regard sur la note, puis tu lèves les yeux et tu dis.' ] }
  ],
  retenir: ['Savoir : début, fin, mots-clés. Improviser : le reste.', 'Ne pas réciter mot à mot (sauf début et fin).', 'Notes : peu de mots, gros, numérotées.'],
  exercice: 'Prépare un discours de 2 minutes avec une demi-feuille : premiers mots, quatre mots-clés, derniers mots. Dis-le trois fois : les phrases doivent varier, la structure non.',
  quiz: [
    { q: 'Que prépare-t-on mot à mot dans la méthode du slalom ?', o: ['Tout', 'Les premiers et les derniers mots', 'Rien'], a: 1, e: 'Départ et arrivée sont préparés, le milieu est libre entre les portes.' }
  ],
  sources: [] },

{ id: 'c29', m: 'p6', n: 29, titre: 'Répéter efficacement', min: 7, src: 'app',
  accroche: 'Relire ne suffit pas. On répète à voix haute, dans les conditions du jour J.',
  sections: [
    { h: 'À voix haute, debout', p: [
      'Une répétition mentale ne révèle pas les passages qui bloquent. Répète à voix haute, debout, au volume prévu. Churchill disait que ses meilleures improvisations étaient celles qu’il avait le mieux préparées.' ] },
    { h: 'Répartir dans le temps', p: [
      'Plusieurs courtes séances espacées sur plusieurs jours valent mieux qu’une longue séance la veille. Le sommeil aide la consolidation en mémoire. Répète une première fois tôt, puis aux J-3, J-1 et le jour même.' ] },
    { h: 'Répéter par morceaux, puis en entier', p: [
      'Travaille d’abord l’ouverture et la fin, puis les transitions, puis le tout. Chronomètre : un discours dit à voix haute est en général plus long que prévu. Enregistre-toi et utilise l’analyse de l’appli pour repérer un point à corriger à chaque passage.' ] },
    { h: 'Se confronter à un public', p: [
      'Répète devant un ami, une caméra, une chaise : tout ce qui crée une présence. L’essentiel est de s’habituer à parler avec quelqu’un qui regarde.' ] }
  ],
  retenir: ['À voix haute, debout, chronométré.', 'Sessions courtes et espacées.', 'Un point à corriger par passage.'],
  exercice: 'Planifie ta prochaine prise de parole : J-7, J-3, J-1, J. Pour chaque date, une consigne précise (ouverture, transitions, tout, chrono).',
  quiz: [
    { q: 'Quelle répétition est la plus efficace ?', o: ['Relire en silence', 'À voix haute, debout, chronométrée', 'La veille seulement'], a: 1, e: 'On repère ce qui bloque en conditions réelles.' }
  ],
  sources: [] }

);

;
/* Cours — Tome II, parties VII à IX (adaptation, psychologie, entraînement). */
window.AO_DATA.lessons.push(

{ id: 'c30', m: 'p7', n: 30, titre: 'Connaître son auditoire', min: 8, src: 'app',
  accroche: 'Le public, et non l’orateur, est l’arbitre du succès. On ne parle jamais « à tout le monde » : on parle à quelqu’un.',
  sections: [
    { h: 'Cinq questions avant de préparer', p: [
      'Qui sont-ils (âge, métier, culture) ? Que savent-ils déjà du sujet ? Qu’attendent-ils ? Qu’est-ce qui peut les freiner ou les agacer ? Dans quel état seront-ils (fatigue, heure, enjeu) ? Les réponses orientent le niveau de langage, les exemples, la durée et le genre dominant.' ] },
    { h: 'Parler de ce qui les intéresse', p: [
      'Carnegie le répète : les gens s’intéressent d’abord à eux-mêmes, à leurs problèmes, à leurs envies. Relie ton sujet à ce que ton public vit. L’exercice de Périer le montre : convaincre des amis de partir en vacances en trouvant, pour chacun, l’argument (culturel, culinaire, économique, festif) qui lui parle.' ] },
    { h: 'Parler « avec » eux', p: [
      'Utilise « vous » et « nous » plus que « je » (l’appli compte ces pronoms dans ton texte). Pose des questions. Fais de vrais compliments, sincères et précis, jamais de flatterie. Identifie-toi à eux : « comme vous, j’ai déjà… » Reste modeste sur ce que tu sais.' ] },
    { h: 'Cas réel : Sankara à l’ONU', p: [
      'En 1984, Thomas Sankara parle depuis la marge : un petit pays à une tribune où il pèse peu. Il compare les dépenses militaires au coût de l’éducation, de la santé et de l’alimentation : un argument que son public (délégués du monde entier) peut mesurer. Il connaît son auditoire : il lui parle de choix de priorités.' ] }
  ],
  retenir: ['Cinq questions : qui, ce qu’ils savent, ce qu’ils attendent, ce qui les freine, leur état.', 'Relie ton sujet à ce que le public vit.', 'Plus de « vous / nous », moins de « je ».'],
  exercice: 'Choisis un message. Écris-le pour trois publics différents (un jury, des amis, des élèves) en changeant l’accroche et l’exemple. Dis la version la plus éloignée de ton style habituel dans le Studio.',
  quiz: [
    { q: 'Qui est l’arbitre du succès d’un discours ?', o: ['L’orateur', 'L’auditoire', 'Le sujet'], a: 1, e: 'On parle toujours à quelqu’un.' }
  ],
  sources: [{ t: 'Marxists Internet Archive : Sankara, 4 octobre 1984', u: 'https://www.marxists.org/archive/sankara/1984/october/04.htm' }] },

{ id: 'c31', m: 'p7', n: 31, titre: 'Lire les réactions en direct', min: 6, src: 'app',
  accroche: 'Un orateur qui ne regarde pas sa salle parle dans le vide. Le public répond sans cesse, avec le corps.',
  sections: [
    { h: 'Les signaux à observer', p: [
      'Signaux d’attention : regards levés, têtes qui hochent, corps penchés en avant. Signaux de décrochage : regards sur le téléphone, soupirs, corps qui s’affaissent, bavardages. Signaux de désaccord : sourcils froncés, bras croisés (attention, ils peuvent aussi vouloir dire qu’on a froid). Un signal isolé ne dit rien ; une tendance dit quelque chose.' ] },
    { h: 'Ajuster', p: [
      'Salle qui décroche : raccourcis, passe à un exemple, pose une question, change de rythme ou de position. Salle perplexe : reformule avec une image. Salle conquise : ne rallonge pas, avance vers la conclusion. C’est le kairos en action : sentir quand la salle est mûre pour une idée.' ] },
    { h: 'Au micro, en visio', p: [
      'En visioconférence, les signaux sont réduits. Demande des retours (« je m’arrête une minute : des questions ? »), utilise le chat, regarde la caméra pour les idées clés et soigne l’articulation, car les problèmes techniques ajoutent du flou.' ] }
  ],
  retenir: ['Une tendance, pas un signal isolé.', 'Ajuste : raccourcir, illustrer, questionner.', 'En visio, demande des retours explicites.'],
  exercice: 'Dans une réunion ou un cours, observe les signaux d’attention et de décrochage pendant dix minutes. Note ce qui a fait décrocher.',
  quiz: [
    { q: 'Que faire quand la salle décroche ?', o: ['Parler plus fort', 'Raccourcir ou changer de rythme', 'Ignorer'], a: 1, e: 'Exemple, question, rythme : on ajuste.' }
  ],
  sources: [] },

{ id: 'c32', m: 'p7', n: 32, titre: 'Gérer questions et interruptions', min: 7, src: 'app',
  accroche: 'Les questions sont l’occasion de prouver que tu maîtrises ton sujet, pas une menace.',
  sections: [
    { h: 'Les cinq temps d’une réponse', p: [
      'Écouter jusqu’au bout sans préparer sa réponse. Reformuler (« si je comprends bien, vous demandez… »). Répondre en une idée centrale, d’abord la réponse, puis l’explication. Vérifier (« est-ce que cela répond à votre question ? »). S’arrêter.' ] },
    { h: 'Si tu ne sais pas', p: [
      'Dis-le : « je n’ai pas cette information ; je vous la fais parvenir ». Un « je ne sais pas » franc coûte moins cher en ethos qu’une réponse inventée qu’on découvre fausse.' ] },
    { h: 'Les interruptions', p: [
      'Quelqu’un coupe la parole : accueille (« bonne remarque »), réponds brièvement, ou repousse (« je termine ce point et j’y reviens »). Reste calme : le public juge ta manière de réagir.' ] }
  ],
  retenir: ['Écouter, reformuler, répondre, vérifier, s’arrêter.', 'Ne jamais inventer.', 'Accueillir ou repousser une interruption, calmement.'],
  exercice: 'Demande à un proche de te poser cinq questions sur ton sujet. Réponds en 30 secondes en suivant les cinq temps.',
  quiz: [
    { q: 'Si tu ne connais pas la réponse…', o: ['Tu inventes', 'Tu le dis et proposes de revenir avec la réponse', 'Tu changes de sujet'], a: 1, e: 'Une réponse inventée découverte fausse coûte plus cher.' }
  ],
  sources: [] },

{ id: 'c33', m: 'p7', n: 33, titre: 'Les situations difficiles', min: 8, src: 'app',
  accroche: 'Salle hostile, micro en panne, trou de mémoire, timing réduit : les situations difficiles se préparent.',
  sections: [
    { h: 'Une salle hostile', p: [
      'Reconnais le désaccord, ne cherche pas à plaire à tous, reste constant dans ton ton. Simone Veil, en 1974, devant une assemblée presque exclusivement masculine et des débats houleux de plusieurs jours, a tenu sa ligne et expliqué sa position. Garde ton calme, réponds aux arguments et pas aux provocations.' ] },
    { h: 'Le trou de mémoire', p: [
      'Respire, tiens un silence (le public le perçoit beaucoup moins long que toi), reprends la dernière idée ou ton mot-clé suivant. Si tu as ton palais de mémoire, reviens à la pièce suivante.' ] },
    { h: 'Panne technique, temps réduit', p: [
      'Panne de support : continue sans, ton discours doit tenir debout. Temps réduit : coupe dans le milieu, garde l’ouverture, ta meilleure preuve et la conclusion. Préparer une version courte à l’avance (30 secondes, 2 minutes) est la meilleure assurance.' ] }
  ],
  retenir: ['Salle hostile : calme, constance, réponds aux arguments.', 'Trou de mémoire : silence, mot-clé suivant.', 'Prépare une version courte.'],
  exercice: 'Prépare ton discours en trois versions : 30 secondes, 2 minutes, 5 minutes. Entraîne-toi dans le Studio avec les durées correspondantes.',
  quiz: [
    { q: 'Face à un trou de mémoire, la première chose à faire est…', o: ['S’excuser', 'Respirer et tenir un silence', 'Recommencer depuis le début'], a: 1, e: 'Le silence est perçu comme beaucoup moins long par le public.' }
  ],
  sources: [{ t: 'Vie-publique : Les 50 ans de la loi Veil (PDF)', u: 'https://www.vie-publique.fr/files/medias/L_essentiel_Numero_7_Les_50_ans_de_la_loi_Veil.pdf' }] },

/* ---------- PSYCHOLOGIE ---------- */
{ id: 'c34', m: 'p8', n: 34, titre: 'Gérer le trac', min: 9, src: 'app',
  accroche: 'Selon Périer, le trac est « la tension qui existe entre l’envie que l’on a de bien faire et le risque que l’on a de se décevoir ». Ce n’est pas un ennemi.',
  sections: [
    { h: 'Dédramatiser', p: [
      'On raconte que Sarah Bernhardt répondit à une jeune actrice qui se vantait de ne pas avoir le trac : « Vous verrez mon petit, ça viendra avec le talent. » Le trac est lié à l’engagement. Il donne de l’énergie. Le but n’est pas de l’éliminer, mais de l’apprivoiser.' ] },
    { h: 'Les quatre techniques de Périer', p: [
      '1. Relativiser : « ce ne sont que des mots », ta vie n’est pas en jeu ; le public n’est pas malveillant.',
      '2. Visualiser : imagine-toi parler avec succès. Tu auras l’impression de l’avoir déjà fait une première fois.',
      '3. Respirer : l’air est le carburant de l’orateur. Respire profondément et ralentis ton souffle.',
      '4. Préparer : le trac est maximal au début et à la fin ; connais par cœur tes premiers et derniers mots.' ] },
    { h: 'Ce que dit Carnegie', p: [
      'Carnegie recommande de chercher les raisons de sa crainte, de bien se préparer (sans apprendre par cœur), de saisir toutes les occasions de pratiquer, et d’agir avec confiance même quand on ne la ressent pas encore. La pratique régulière est le meilleur remède.' ] },
    { h: 'Les limites de ce cours', p: [
      'Cette leçon propose des techniques d’entraînement. Si ton trac est paralysant, qu’il t’empêche de vivre normalement ou s’accompagne d’une anxiété importante, parle-en à un professionnel de santé : c’est un sujet de santé, pas seulement de technique.' ] }
  ],
  retenir: ['Le trac vient de l’envie de bien faire.', 'Relativiser, visualiser, respirer, préparer.', 'Savoir par cœur le début et la fin.'],
  exercice: 'Avant ta prochaine prise de parole : visualise-la deux minutes, respire cinq fois lentement (expiration plus longue que l’inspiration), et dis ta première phrase à voix haute. Note le niveau de trac avant et après, de 0 à 10.',
  quiz: [
    { q: 'Quand le trac est-il maximal, selon Périer ?', o: ['Au milieu', 'Au début et à la fin', 'Après'], a: 1, e: 'D’où l’intérêt de connaître par cœur le début et la fin.' },
    { q: 'Quelle est la quatrième technique ?', o: ['Préparer', 'S’excuser', 'Improviser'], a: 0, e: 'Relativiser, visualiser, respirer, préparer.' }
  ],
  sources: [] },

{ id: 'c35', m: 'p8', n: 35, titre: 'Construire sa confiance', min: 7, src: 'app',
  accroche: 'La confiance n’est pas une humeur : elle se construit par des preuves que l’on s’apporte à soi-même.',
  sections: [
    { h: 'Se donner des preuves', p: [
      'Chaque prise de parole réussie, même petite, est une preuve. Tiens un journal de réussites : ce qui a marché, une phrase d’un auditeur, un progrès mesuré dans l’historique. Quand le doute vient, relis-le.' ] },
    { h: 'Choisir un sujet qu’on connaît', p: [
      'Carnegie conseille de traiter un sujet qu’on connaît par expérience ou qui tient à cœur. La confiance vient de la maîtrise du fond. Cherche des sujets dans ton passé : ce que ta vie t’a appris, tu ne peux pas l’oublier.' ] },
    { h: 'Agir avec confiance', p: [
      'Agir « comme si » : se tenir droit, regarder, parler plus lentement. Le corps rassure l’esprit. Cela ne remplace pas la préparation, mais ça débloque le départ.' ] },
    { h: 'Les occasions de pratiquer', p: [
      'Prends la parole en réunion, pose une question, présente-toi, réponds à une question : le défi de Périer est de ne plus jamais sortir d’une réunion sans avoir parlé. L’avantage cumulatif est énorme : dix petites prises de parole valent mieux qu’un grand discours annuel.' ] }
  ],
  retenir: ['La confiance se construit par des preuves.', 'Sujet connu = base solide.', 'Une petite prise de parole par réunion.'],
  exercice: 'Cette semaine : prends la parole dans chaque réunion ou cours. Note le soir une réussite et une chose à améliorer.',
  quiz: [
    { q: 'Quel est le défi proposé par Périer ?', o: ['Ne jamais sortir d’une réunion sans avoir parlé', 'Parler 10 minutes par jour', 'Apprendre un discours par semaine'], a: 0, e: 'Parler à chaque réunion construit la confiance.' }
  ],
  sources: [] },

{ id: 'c36', m: 'p8', n: 36, titre: 'L’intention et l’alignement', min: 7, src: 'app',
  accroche: 'La technique n’est rien sans l’intention. La parole la plus efficace est celle qui est habitée par une conviction.',
  sections: [
    { h: 'Savoir pourquoi on parle', p: [
      'Avant de préparer : pourquoi suis-je là ? Que veux-je que l’autre pense, ressente, fasse ? Une intention claire guide chaque choix (plan, ton, preuves). Périer résume la philosophie ultime de la parole : changer le monde, grâce à la sincérité des causes que l’on défend.' ] },
    { h: 'L’alignement', p: [
      'Les mots, la voix et le corps doivent dire la même chose. Un discours sur la confiance dit d’une voix tremblante, les bras croisés, se contredit. Plus tu es aligné, plus ton ethos est solide. Carnegie parle de « mettre son cœur dans ses paroles » et de rester soi-même plutôt que d’imiter les autres.' ] },
    { h: 'Sincérité et éthique', p: [
      'Quintilien : « un homme de bien qui sait parler ». La persuasion sans droiture est un danger. Ne défends pas ce que tu ne crois pas par pure technique. Cela ne t’interdit pas de plaider une cause qui t’a été confiée (un avocat plaide), mais ne mens pas et ne manipule pas.' ] }
  ],
  retenir: ['Une intention claire guide tous les choix.', 'Mots, voix, corps : même message.', 'Pas de mensonge ni de manipulation.'],
  exercice: 'Écris en une phrase : « Je parle pour que… ». Dis ensuite ton discours en veillant à ce que ton ton exprime cette intention. Réécoute : y croirais-tu ?',
  quiz: [
    { q: 'Que signifie l’alignement ?', o: ['Parler vite', 'Mots, voix et corps disent la même chose', 'Suivre un plan'], a: 1, e: 'La cohérence entre ce qu’on dit et comment on le dit.' }
  ],
  sources: [] },

{ id: 'c37', m: 'p8', n: 37, titre: 'L’humilité et l’écoute', min: 6, src: 'app',
  accroche: 'Un bon orateur écoute plus qu’il ne parle. Sans écoute, la parole devient un monologue.',
  sections: [
    { h: 'Écouter pour mieux parler', p: [
      'Écouter révèle ce que le public attend, les objections, le vocabulaire qu’il utilise. Reprends ses mots dans ta réponse : l’auditeur se sent compris.' ] },
    { h: 'La modestie sincère', p: [
      'Carnegie recommande d’être modeste : reconnaître ce qu’on ne sait pas, admettre ses erreurs, remercier. Cela crée de l’ethos. Une faiblesse maîtrisée avouée à bon escient renforce la crédibilité (voir chapitre 2).' ] },
    { h: 'Débattre n’est pas se battre', p: [
      'Périer rappelle que débattre est en quelque sorte le contraire de se battre : on cherche à comprendre et à convaincre, pas à écraser. La parole qui écoute fait reculer la violence.' ] }
  ],
  retenir: ['Écouter révèle les attentes et les objections.', 'Reprends les mots de l’autre.', 'Débattre, c’est le contraire de se battre.'],
  exercice: 'Dans une conversation, reformule les propos de l’autre avant de répondre, trois fois dans la journée. Note l’effet sur son attitude.',
  quiz: [
    { q: 'Reprendre les mots de l’interlocuteur permet…', o: ['De gagner du temps', 'Qu’il se sente compris', 'D’éviter de répondre'], a: 1, e: 'L’écoute construit la confiance.' }
  ],
  sources: [] },

/* ---------- ENTRAÎNEMENT ---------- */
{ id: 'c38', m: 'p9', n: 38, titre: 'Construire sa routine', min: 7, src: 'app',
  accroche: 'Cinq à dix minutes par jour valent mieux qu’une longue séance par mois.',
  sections: [
    { h: 'La boucle d’entraînement', p: [
      'Fixer un objectif précis, s’enregistrer, analyser, corriger UN seul point, refaire. L’attention est limitée : corriger tout à la fois n’améliore rien.' ] },
    { h: 'Une semaine type', p: [
      'Lundi : vocabulaire (carnet de mots, 5 minutes). Mardi : exercice de 1 minute dans le Studio. Mercredi : lecture d’une leçon et exercice associé. Jeudi : exercice de 2 minutes. Vendredi : analyse d’un orateur. Samedi : prise de parole réelle (réunion, appel, conversation). Dimanche : repos ou relecture de l’historique.' ] },
    { h: 'Suivre sa progression', p: [
      'L’historique de l’appli te permet de comparer tes séances : tics, pauses, écart de hauteur. Compare à toi-même, pas aux autres. Fixe des objectifs mesurables (« moins de trois tics pour 100 mots », « zéro blanc »).' ] },
    { h: 'Éviter l’abandon', p: [
      'Réduis la barre quand tu es fatigué : une minute suffit. L’essentiel est la régularité. Le téléphone qui enregistre est un « juge de paix terrible » selon Périer : il ne ment pas.' ] }
  ],
  retenir: ['Un point à corriger à la fois.', 'Courte et régulière bat longue et rare.', 'Compare-toi à toi-même.'],
  exercice: 'Remplis ta semaine type dans l’onglet Objectifs de l’accueil et tiens-la sept jours.',
  quiz: [
    { q: 'Combien de points corriger à la fois ?', o: ['Tous', 'Un seul', 'Cinq'], a: 1, e: 'L’attention est limitée.' }
  ],
  sources: [] },

{ id: 'c39', m: 'p9', n: 39, titre: 'Analyser un grand orateur', min: 8, src: 'app',
  accroche: 'Regarder un grand discours sans méthode, c’est admirer. Le regarder avec une grille, c’est apprendre.',
  sections: [
    { h: 'Une grille en neuf questions', p: [
      '1. Quel genre ? 2. Quel contexte (qui, où, quand) ? 3. Quelle intention ? 4. Quel plan ? 5. Quelle ouverture ? 6. Quels arguments et quelles preuves ? 7. Quelles figures et quel rythme ? 8. Quelle conclusion ? 9. Quelle voix, quel corps, quel silence ?' ] },
    { h: 'Méthode : trois passages', p: [
      'Premier passage : écoute simplement, note l’effet. Deuxième : découpe en cinq blocs (plan classique). Troisième : sans le son, observe le corps ; ou avec le son seul, écoute la voix. Termine par une phrase : « ce que je vole à cet orateur ».' ] },
    { h: 'Voler sans copier', p: [
      'Imiter un orateur pour apprendre est utile ; copier son style entier t’éloigne du tien. Prends une technique, adapte-la à ta voix.' ] },
    { h: 'Utiliser la bibliothèque de l’appli', p: [
      'L’onglet Orateurs propose douze fiches avec contexte et techniques. Chaque fiche se termine par un exercice dans le Studio. Fais-en une par semaine.' ] }
  ],
  retenir: ['Une grille de neuf questions.', 'Trois passages : effet, structure, voix/corps.', 'Voler une technique, pas un style.'],
  exercice: 'Choisis un discours de 2 minutes. Applique la grille et écris « ce que je lui vole ». Réutilise cette technique dans ton prochain enregistrement.',
  quiz: [
    { q: 'Que fait-on au deuxième passage ?', o: ['On écoute simplement', 'On découpe en cinq blocs', 'On apprend par cœur'], a: 1, e: 'On repère la structure du plan classique.' }
  ],
  sources: [] },

{ id: 'c40', m: 'p9', n: 40, titre: 'Créer son style propre', min: 7, src: 'app',
  accroche: 'Le but n’est pas de devenir quelqu’un d’autre, mais une version plus nette de toi-même.',
  sections: [
    { h: 'Ce qui te distingue', p: [
      'Ton parcours, ton humour, ton accent, ta manière de raconter : ce sont tes matériaux. Quels sont tes thèmes (la parole, l’entrepreneuriat, Madagascar, le luxe) ? Quelles images te viennent naturellement ?' ] },
    { h: 'Ton type d’orateur', p: [
      'Le test de l’onglet Orateurs te donne un type provisoire, selon un modèle propre à l’appli : appuie-toi sur ta force dominante et travaille ta faiblesse. L’Architecte ajoute du récit ; le Tribun travaille ses pauses ; le Conteur vérifie ses preuves.' ] },
    { h: 'Se fixer une signature', p: [
      'Une phrase-signature (moins de huit mots), un type d’ouverture, une manière de conclure. La cohérence crée de la reconnaissance. Reste flexible : le style évolue.' ] },
    { h: 'Sincérité', p: [
      'Carnegie le dit : ne pas imiter les autres, être soi-même. Le public sent l’imitation.' ] }
  ],
  retenir: ['Ton parcours est ta matière première.', 'Appuie-toi sur ta force dominante.', 'Une signature : phrase, ouverture, chute.'],
  exercice: 'Écris ta phrase-signature en moins de huit mots, trois ouvertures et trois chutes. Garde ce qui sonne le plus « toi » et teste-le dans le Studio.',
  quiz: [
    { q: 'Que faire de son type d’orateur ?', o: ['S’y limiter', 'S’appuyer sur sa force et travailler sa faiblesse', 'L’ignorer'], a: 1, e: 'Un type est un point de départ.' }
  ],
  sources: [] }

);

;
/* Cours — Tome III (parties X et XI) + situations professionnelles. */
window.AO_DATA.lessons.push(

{ id: 'c41', m: 'p10', n: 41, titre: 'Négocier, convaincre un individu', min: 9, src: 'app',
  accroche: 'Face à une personne, on ne « fait pas un discours » : on cherche un accord qui tient.',
  sections: [
    { h: 'Intérêts, pas positions', p: [
      'Dans « Getting to Yes » (Fisher et Ury, 1981), la négociation raisonnée distingue la position (ce que l’autre dit vouloir) de l’intérêt (ce qui le motive). Deux personnes qui s’opposent sur une position peuvent avoir des intérêts compatibles. Pose des questions pour les découvrir : « qu’est-ce qui est le plus important pour vous là-dedans ? »' ] },
    { h: 'Préparer sa base', p: [
      'Avant de négocier : ce que je veux (objectif), ce que j’accepte (minimum), ce que je fais si ça échoue (alternative). Périer conseille, pour une demande d’augmentation, de choisir le bon moment (après une réussite), de mettre en avant les résultats et de définir à l’avance sa base de négociation.' ] },
    { h: 'La parole en face à face', p: [
      'Écoute plus que tu ne parles. Reformule. Utilise des questions ouvertes. Parle de l’intérêt commun. Ne gagne pas un point en perdant la relation. Un accord arraché est souvent un accord qui ne tient pas.' ] },
    { h: 'Les pièges', p: [
      'Parler trop tôt de chiffres, se justifier à l’excès, accepter sous la pression, ou durcir son ton quand l’autre durcit. Un silence bien placé est souvent l’outil le plus efficace.' ] }
  ],
  retenir: ['Intérêts, pas positions.', 'Prépare objectif, minimum, alternative.', 'Écoute, reformule, questions ouvertes.'],
  exercice: 'Prépare une négociation réelle (horaire, tarif, délai). Écris : objectif, minimum, alternative, trois questions pour découvrir les intérêts de l’autre. Joue-la avec un proche.',
  quiz: [
    { q: 'Différence entre position et intérêt ?', o: ['Aucune', 'La position est ce qu’on dit vouloir, l’intérêt ce qui motive', 'L’intérêt est une exigence'], a: 1, e: 'Les intérêts peuvent être compatibles malgré des positions opposées.' }
  ],
  sources: [{ t: 'Harvard PON : Getting to Yes (présentation)', u: 'https://www.pon.harvard.edu/daily/negotiation-skills-daily/principled-negotiation-focus-interests-pin/' }] },

{ id: 'c42', m: 'p10', n: 42, titre: 'La rhétorique de combat', min: 7, src: 'app',
  accroche: 'Certains contextes sont adverses : tribunal, campagne, débat contradictoire. La parole y est une arme, et une arme demande une éthique.',
  sections: [
    { h: 'Ce qu’est un contexte de combat', p: [
      'Un public qui se divise, un adversaire qui cherche à te faire perdre, un temps compté. L’objectif est de convaincre les indécis, pas d’écraser l’autre. Le tribun grec ou romain parlait pour une assemblée qui devait trancher ; Démosthène contre Philippe, Cicéron contre Catilina.' ] },
    { h: 'Les outils', p: [
      'Cadrer : imposer le sujet et le vocabulaire. Ancrer : quelques idées simples, répétées. Retourner : reprendre l’argument de l’adversaire pour le renverser (Mandela, accusé, accuse le système). Rester constant : un ton stable inspire plus confiance qu’une colère.' ] },
    { h: 'Les limites', p: [
      'Sophismes, attaques personnelles et déformations donnent des victoires rapides et des défaites durables, car le public se souvient de qui a été honnête. Ta crédibilité dure plus que le débat. Quintilien en fait une règle de fond : l’orateur est d’abord un homme de bien.' ] }
  ],
  retenir: ['On parle pour les indécis, pas pour l’adversaire.', 'Cadrer, ancrer, retourner, rester constant.', 'La victoire malhonnête coûte plus cher que la défaite honnête.'],
  exercice: 'Prends une thèse opposée à la tienne. Écris-la dans sa meilleure version, puis ton retournement en 1 minute.',
  quiz: [
    { q: 'Pour qui parle-t-on dans un débat ?', o: ['L’adversaire', 'Les indécis', 'Soi-même'], a: 1, e: 'On cherche à convaincre ceux qui peuvent encore changer d’avis.' }
  ],
  sources: [] },

{ id: 'c43', m: 'p10', n: 43, titre: 'Le registre de la discrétion', min: 6, src: 'app',
  accroche: 'Parler fort n’est pas la seule manière de peser. Certaines situations demandent une parole discrète, basse, précise.',
  sections: [
    { h: 'Quand la discrétion convainc', p: [
      'Un aveu, une condoléance, une critique en tête-à-tête, un conseil à un supérieur : la forme doit être basse, lente, sobre. Un ton triomphant ou solennel serait déplacé.' ] },
    { h: 'Les moyens', p: [
      'Une voix plus basse et plus lente. Peu de figures. Des phrases courtes. Des silences. Des mots simples. L’émotion est suggérée, pas jouée. Un regard calme.' ] },
    { h: 'Le pouvoir du moins', p: [
      'Une voix qui baisse oblige à écouter. Une phrase simple dite sans emphase peut toucher plus qu’une envolée. Le silence est ici un outil de respect. Ce registre demande de la maîtrise : il ne s’improvise pas.' ] }
  ],
  retenir: ['Voix basse, lente, sobre.', 'Peu de figures, des mots simples.', 'Le moins peut peser plus que le trop.'],
  exercice: 'Prépare un message délicat (retard, refus, remerciement). Dis-le deux fois dans le Studio : une version solennelle, une version discrète. Laquelle sonne juste ?',
  quiz: [
    { q: 'Quels moyens porte la discrétion ?', o: ['Voix forte et figures', 'Voix basse, simplicité, silences', 'Débit rapide'], a: 1, e: 'Le registre est sobre.' }
  ],
  sources: [] },

{ id: 'c44', m: 'p10', n: 44, titre: 'L’écrit et le différé', min: 8, src: 'app',
  accroche: 'À l’écrit, le public ne peut ni t’interrompre ni te regarder. Tout ce que fait la voix doit être fait par la structure.',
  sections: [
    { h: 'Ce qui change', p: [
      'Pas de ton, pas de silences, pas de regard : le lecteur est seul avec la page. Il lit en diagonale. Tout repose sur la structure, la clarté et le choix des mots.' ] },
    { h: 'Les règles de l’écrit efficace', p: [
      'Annonce la conclusion tôt (le lecteur n’attend pas la chute). Un paragraphe = une idée. Phrases courtes et verbes d’action. Un message clair à la première ligne. Un appel à l’action précis à la fin.' ] },
    { h: 'Lettres, e-mails, posts', p: [
      'L’e-mail : objet clair, trois lignes, une demande. Le post LinkedIn : une accroche en première ligne (c’est elle qu’on voit), un récit court, une leçon. Le texte de présentation : la méthode de l’exorde s’applique encore.' ] },
    { h: 'Vidéo, podcast, différé', p: [
      'Sans public en direct, l’énergie doit venir de la voix et du rythme. Les 5 premières secondes décident. Coupe les silences morts, resserre. Parle à une seule personne.' ] }
  ],
  retenir: ['Tout repose sur la structure.', 'Conclusion tôt, un paragraphe = une idée.', 'En vidéo : 5 premières secondes.'],
  exercice: 'Écris un post de 100 mots sur une idée de ton livre : accroche, récit court, leçon. Puis lis-le à voix haute : y a-t-il des phrases à raccourcir ?',
  quiz: [
    { q: 'Que fait la structure à l’écrit ?', o: ['Remplace la voix et les silences', 'Rien', 'Allonge le texte'], a: 0, e: 'Elle porte ce que la voix porte à l’oral.' }
  ],
  sources: [] },

{ id: 'c45', m: 'p11', n: 45, titre: 'L’art du débat', min: 9, src: 'app',
  accroche: 'Débattre, c’est défendre une position face à une autre devant un public qui juge. Périer le dit : débattre est le contraire de se battre.',
  sections: [
    { h: 'Avant le débat', p: [
      'Prépare ta thèse en une phrase, trois arguments, l’objection la plus forte contre toi et ta réponse. Prépare aussi les arguments de l’autre camp : si tu sais les défendre mieux que lui, tu es prêt.' ] },
    { h: 'Pendant', p: [
      'Écoute, note, réponds aux arguments et pas aux personnes. Reformule avant de contester. Une idée à la fois. Garde ton ton stable. Évite de couper la parole ; si on te coupe, ne hausse pas la voix, rappelle calmement que tu n’as pas fini.' ] },
    { h: 'Le tour de parole court', p: [
      'Dans un tour de 1 minute : une phrase de réponse directe, un argument, un exemple, une phrase de retour à ta thèse. Entraîne-toi avec l’exercice « Défendre un camp » du Studio.' ] },
    { h: 'Comment gagne-t-on ?', p: [
      'Un débat se gagne rarement sur le fond seul : les indécis jugent la clarté, la tenue, la capacité à répondre. Celui qui reste calme et précis gagne souvent, même sans écraser.' ] }
  ],
  retenir: ['Thèse, trois arguments, objection forte.', 'Réponds aux arguments, pas aux personnes.', 'Un tour court : réponse, argument, exemple, retour à la thèse.'],
  exercice: 'Choisis un sujet de société. Prépare deux minutes pour chaque camp, enregistre-les dans le Studio. Écoute-toi : lequel défends-tu le mieux ? Pourquoi ?',
  quiz: [
    { q: 'Que prépare-t-on en plus de sa thèse ?', o: ['Les arguments de l’autre camp', 'Un discours plus long', 'Des blagues'], a: 0, e: 'Savoir défendre l’autre position mieux que lui prépare à y répondre.' }
  ],
  sources: [] },

{ id: 'c46', m: 'p11', n: 46, titre: 'Improviser et rebondir', min: 9, src: 'app',
  accroche: 'Comme le disait Churchill : « Mes meilleures improvisations sont celles que j’ai le mieux préparées. »',
  sections: [
    { h: 'Improviser n’est pas dire n’importe quoi', p: [
      'Périer : l’improvisation est une technique qui permet d’être dans l’instant, en communication directe. Carnegie distingue la vraie improvisation, sans aucune préparation, de l’intervention impromptue : on ne se prépare pas à un texte précis, mais on est mentalement prêt.' ] },
    { h: 'Les outils', p: [
      'Une structure de secours : PREP (point, raison, exemple, point), ou passé-présent-futur, ou problème-solution. Le principe « ici et maintenant » de Carnegie : rebondis sur ce qui vient de se passer, ce que tu vois. Un exemple immédiat : une histoire vécue sort toujours plus vite qu’un argument abstrait.' ] },
    { h: 'L’exercice du chroniqueur radio (Périer)', p: [
      'Chaque jour : raconter un fait d’actualité, analyser ce qu’il révèle, donner un avis argumenté. Sans texte écrit, enregistré. Le téléphone est un juge de paix terrible.' ] },
    { h: 'Rebondir', p: [
      'Gagner du temps : reformuler la question, dire « excellente question » (sans en abuser), respirer. Revenir à ta structure. Si tu bloques, prends un exemple vécu.' ] }
  ],
  retenir: ['Préparer des structures, pas des phrases.', 'Ici et maintenant ; un exemple immédiat.', 'Le chroniqueur radio : raconter, analyser, argumenter.'],
  exercice: 'Chaque jour pendant une semaine : exercice du chroniqueur radio, 1 minute, dans le Studio (exercice « Argumenter une idée »). Note l’évolution des tics.',
  quiz: [
    { q: 'Que prépare-t-on pour improviser ?', o: ['Un texte mot à mot', 'Des structures de secours', 'Rien'], a: 1, e: 'PREP, passé-présent-futur…' }
  ],
  sources: [] },

{ id: 'c47', m: 'p11', n: 47, titre: 'Répondre aux questions : PREP et STAR', min: 8, src: 'app',
  accroche: 'Une réponse claire en 30 secondes est un art. Deux structures simples suffisent.',
  sections: [
    { h: 'PREP : point, raison, exemple, point', p: [
      'Point : ta réponse en une phrase. Raison : pourquoi. Exemple : un cas précis. Point : tu reprends la réponse. Idéal pour toute question d’opinion ou de décision.' ] },
    { h: 'STAR : situation, tâche, action, résultat', p: [
      'Utilisée en entretien d’embauche pour répondre à « parlez-moi d’une fois où… » : la situation (contexte), la tâche (ton objectif), l’action (ce que tu as fait, toi), le résultat (chiffré si possible). Cette structure est répandue dans le recrutement, mais elle n’est pas une norme universelle.' ] },
    { h: 'Questions difficiles', p: [
      'Faiblesse : cite une vraie faiblesse, montre ce que tu fais pour la corriger. Pourquoi nous ? : relie tes forces à leur besoin. « Avez-vous une question ? » : prépare-en deux à l’avance (Périer).' ] },
    { h: 'Les médias', p: [
      'Face à un journaliste, tu as de 30 secondes à 1 minute. Prépare deux ou trois messages clés. Une réponse de 40 secondes peut suivre : thèse, exemple, conclusion. Le principe de Périer : « c’est vous qui maîtrisez le message ».' ] }
  ],
  retenir: ['PREP pour les questions d’opinion.', 'STAR pour « parlez-moi d’une fois où… ».', 'Prépare deux questions à poser.'],
  exercice: 'Prépare trois réponses STAR (réussite, échec, conflit). Dis-les à 1 minute dans le Studio avec l’exercice « Répondre à une question ».',
  quiz: [
    { q: 'Que signifie le R de STAR ?', o: ['Réponse', 'Résultat', 'Raison'], a: 1, e: 'Situation, Tâche, Action, Résultat.' }
  ],
  sources: [] },

{ id: 'c48', m: 'p11', n: 48, titre: 'Ateliers, fiches et scénarios pratiques', min: 10, src: 'app',
  accroche: 'Tout se joue dans la pratique. Voici des scénarios complets à jouer dans le Studio.',
  sections: [
    { h: 'Scénario 1 : l’ascenseur (30 s)', p: ['Présente ton projet à un inconnu en 30 secondes : problème, solution, demande. Utilise PREP.'] },
    { h: 'Scénario 2 : la tribune de l’ONU (3 min)', p: ['Le défi final de Périer : tu as 3 minutes pour convaincre les chefs d’État de la planète de soutenir une cause, une loi ou une réforme qui peut changer le monde. Utilise le plan classique, une anaphore, une histoire, un appel précis.'] },
    { h: 'Scénario 3 : le discours de remise de prix', p: ['Présenter quelqu’un ou le remercier : une anecdote vraie, une qualité précise, une phrase sincère. Carnegie conseille de bien préparer ces moments et d’être sincère.'] },
    { h: 'Scénario 4 : la réponse à la crise', p: ['Une erreur a été commise. Tu as 1 minute : ce que tu sais, ce que tu as déjà fait, ce que tu vas faire, un mot d’empathie. Jamais de mensonge.'] },
    { h: 'Scénario 5 : le pitch POST-IT', p: ['Problème, Opportunité, Solution, Team, Investissement, Timeline : 2 minutes pour un investisseur.'] },
    { h: 'Fiche de relecture', p: ['Après chaque enregistrement : un point fort, un point à corriger, une action pour la prochaine fois. Compare avec l’historique.'] }
  ],
  retenir: ['Un scénario par semaine.', 'Fiche de relecture : fort, à corriger, action.', 'La pratique remplace la lecture.'],
  exercice: 'Choisis un scénario cette semaine. Enregistre-le trois fois et note les progrès.',
  quiz: [
    { q: 'Quelle durée pour le défi de la tribune de l’ONU ?', o: ['1 minute', '3 minutes', '10 minutes'], a: 1, e: 'Trois minutes pour convaincre les chefs d’État de la planète.' }
  ],
  sources: [] },

/* ---------- SITUATIONS PROFESSIONNELLES ---------- */
{ id: 'b1', m: 'p10', n: 'B1', titre: 'Réunion, entretien, pitch', min: 9, src: 'app',
  accroche: 'Dans l’entreprise, la parole est un levier de carrière. Réunions, entretiens et pitchs sont des moments de vérité.',
  sections: [
    { h: 'La réunion', p: ['Prépare : qui participe, quel ordre du jour, quelle durée. Défi de Périer : ne plus jamais sortir d’une réunion sans avoir pris la parole. En visio : environnement professionnel, tenue adaptée, articulation plus nette.'] },
    { h: 'L’entretien d’embauche', p: ['Tiens-toi droit (Périer propose d’imaginer des picots sur la chaise), regarde ton interlocuteur, fais de l’oral un dialogue. Prépare les questions classiques : forces et faiblesses, « avez-vous une question ? ». Prépare deux versions de ta présentation : une d’une minute, une de dix.'] },
    { h: 'Le pitch : méthode POST-IT', p: ['Problème (que résous-tu ?), Opportunité (quel marché ?), Solution (ta proposition unique), Team (qui porte le projet), Investissement (ce dont tu as besoin : temps, argent, locaux), Timeline (où en es-tu). Le terme vient de « elevator pitch » : convaincre un investisseur le temps d’un trajet en ascenseur.'] },
    { h: 'Une précision', p: ['POST-IT est une méthode présentée dans le manuel Périer ; ce n’est pas un standard universel du pitch. Elle sert de check-list : l’important est de répondre à ces six questions.'] }
  ],
  retenir: ['Parler à chaque réunion.', 'Deux versions de ta présentation : 1 minute et 10 minutes.', 'POST-IT : Problème, Opportunité, Solution, Team, Investissement, Timeline.'],
  exercice: 'Prépare ton pitch POST-IT en 2 minutes. Enregistre-le et vérifie que les six questions reçoivent une réponse.',
  quiz: [
    { q: 'Que signifie le T de POST-IT ?', o: ['Temps', 'Team', 'Test'], a: 1, e: 'Problème, Opportunité, Solution, Team, Investissement, Timeline.' }
  ],
  sources: [] },

{ id: 'b2', m: 'p10', n: 'B2', titre: 'Médias et communication de crise', min: 9, src: 'app',
  accroche: 'Médias et crise exigent une discipline sans faille : le temps est compté et chaque mot pèse.',
  sections: [
    { h: 'Face aux médias', p: ['Tu as en général 30 secondes à 1 minute. Prépare deux ou trois messages clés et tiens-t’y. La question du journaliste est un prétexte pour délivrer ton message. Structure d’une réponse de 40 secondes : thèse, exemple, conclusion.'] },
    { h: 'En situation de crise', p: ['Timing : parle quand tu as quelque chose de concret à dire. Trois piliers : réactivité (ce que tu sais, ce que tu as fait, ce que tu vas faire), objectivité (ne mens jamais : un mensonge découvert pollue tout), empathie (si des personnes ont souffert). Ajoute l’action : ce qui sera mis en place pour que cela ne se reproduise pas.'] },
    { h: 'Les erreurs', p: ['Minimiser, se justifier longuement, se contredire, dire « pas de commentaire » sans rien d’autre. Prépare des phrases courtes, vraies, vérifiables.'] }
  ],
  retenir: ['Deux ou trois messages clés.', 'Réactivité, objectivité, empathie, action.', 'Jamais de mensonge.'],
  exercice: 'Écris trois messages clés sur ton projet. Réponds à trois questions pièges en 40 secondes (thèse, exemple, conclusion).',
  quiz: [
    { q: 'Premier pilier de la communication de crise ?', o: ['Réactivité', 'Silence', 'Justification'], a: 0, e: 'Communiquer vite sur ce que l’on sait et ce que l’on fait.' }
  ],
  sources: [] },

{ id: 'b3', m: 'p10', n: 'B3', titre: 'Présenter un orateur, remercier, féliciter', min: 6, src: 'app',
  accroche: 'Prendre la parole pour quelqu’un d’autre est un art à part entière, et on le néglige.',
  sections: [
    { h: 'Présenter un orateur', p: ['Carnegie propose la formule T.A.I. : Titre (le sujet exact), Attrait (pourquoi il intéresse l’auditoire), Intervenant (ses qualifications utiles, puis son nom dit clairement). L’introduction n’est ni trop courte ni trop sèche, et se termine par le nom.'] },
    { h: 'Remettre ou recevoir un prix', p: ['Prépare soigneusement. Raconte une anecdote vraie. Cite une qualité précise. Pour remercier : sois sincère, nomme ceux qui ont aidé, reste bref.'] },
    { h: 'Le toast et l’éloge', p: ['Épidictique par excellence : un détail précis, une émotion, une chute, de la brièveté. Trente secondes bien tenues valent mieux que cinq minutes qui s’étirent.'] }
  ],
  retenir: ['T.A.I. : Titre, Attrait, Intervenant.', 'Une anecdote vraie, une qualité précise.', 'Bref et sincère.'],
  exercice: 'Prépare la présentation T.A.I. d’un intervenant imaginaire. Dis-la dans le Studio en moins de 1 minute.',
  quiz: [
    { q: 'Que signifie T.A.I. ?', o: ['Titre, Attrait, Intervenant', 'Thème, Argument, Illustration', 'Temps, Action, Intérêt'], a: 0, e: 'Formule de Carnegie pour présenter un orateur.' }
  ],
  sources: [{ t: 'Dale Carnegie, Comment parler en public (éd. fournie)', u: '' }] }

);

;
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

;
/* Module de cours « Éristique » : généré à partir de AO_DATA.erist (Schopenhauer, trad. Saunders 1896). Reformulé par l'appli. */
(function () {
  var D = window.AO_DATA, E = D.erist;
  D.modules.push({ id: 'er', tome: 'Schopenhauer · L’art d’avoir toujours raison', titre: 'L’éristique', sous: 'Les 38 stratagèmes d’une dispute : reconnaître, contrer, ne pas tomber dedans' });
  var natL = { loyal: 'technique loyale', limite: 'zone grise', deloyal: 'déloyal' };
  var META = {
    sens: { r: ['Beaucoup de ruses consistent à changer ce que tu as dit : élargir ta thèse, déplacer un mot, te faire dire autre chose.', 'Ta meilleure défense : reformuler ta phrase exacte et fixer le sens des mots clés.', 'Reformule toujours la thèse adverse fidèlement avant d’y répondre : c’est ta protection contre la première ruse.'], e: 'Te défendre en élargissant à ton tour ta propre thèse (« oui, et en plus… »). Tu offres toi-même la prise.', m: 'Phrase de secours : « Ce que j’ai dit, c’est exactement ceci : … ».', x: 'Prends un échange récent où tu as été mal compris. Réécris ta phrase en une version précise, avec ses limites, puis dis-la en 30 secondes au Studio.' },
    quest: { r: ['Ces ruses avancent par petites concessions que tu ne vois pas s’additionner.', 'Avant de dire oui, demande où l’on veut en venir.', 'Un « oui » à un cas particulier n’est pas un « oui » à une règle.'], e: 'Répondre vite, par politesse, à chaque question d’une série.', m: 'Compteur mental : « Qu’ai-je accordé jusqu’ici ? »', x: 'Fais-toi poser 5 petites questions d’accord en rafale sur un sujet, par quelqu’un ou en te les posant à voix haute. Entraîne-toi à demander le but avant la troisième réponse.' },
    emo: { r: ['Ces ruses visent ton état intérieur, pas ton argument : colère, honte, peur de passer pour incompétent.', 'Nommer la manœuvre la désamorce.', 'Le silence et une reformulation simple sont tes meilleurs outils.'], e: 'Répondre sur le même terrain émotionnel : tu confirmes la manœuvre.', m: 'Respire, laisse 3 secondes de silence, réponds par une phrase factuelle.', x: 'Choisis une remarque qui t’énerve. Au Studio, réponds-y en 30 secondes avec une voix plus lente et plus basse que d’habitude.' },
    esq: { r: ['Ces ruses n’attaquent pas ton argument : elles l’évitent.', 'Ramène poliment, autant de fois que nécessaire, à la question posée.', 'Une distinction qui ne change rien est une esquive.'], e: 'Suivre l’autre sur le nouveau terrain par politesse.', m: 'Formule : « Je note ton point, et je reviens à ma question : … ».', x: 'Prépare une question précise. Au Studio, joue deux fois un échange où l’on dévie, et ramène la question à chaque fois en une phrase.' },
    perso: { r: ['Trois ruses (ad hominem, autorité, attaque personnelle) déplacent la discussion de l’argument vers la personne ou vers un nom prestigieux.', 'Le contre-exemple et la retorsion sont des outils loyaux : tu peux les utiliser devant n’importe quel public.', 'Face à l’attaque personnelle, reste calme et reviens au fond.'], e: 'Répondre à l’insulte par une insulte : tu perds ton éthos.', m: 'Pour toute autorité citée : « Quel est son argument ? »', x: 'Trouve un contre-exemple à une phrase en « tous » ou « toujours » entendue cette semaine, puis formule-le en 20 secondes, sans ironie.' }
  };
  var QX = [
    { q: '« Tu défends la liberté d’expression : tu ne peux donc pas demander l’interdiction de ce livre. »', n: 5, o: [5, 6, 11, 14], e: 'On te renvoie à tes propres principes : argumenter à partir des concessions de l’autre. C’est loyal si c’est assumé. Réponse : dis si tu maintiens ce principe, ou distingue-le.' },
    { q: '« Voilà, c’est démontré ! », alors qu’une étape du raisonnement manque.', n: 14, o: [14, 4, 22, 5], e: 'La victoire est proclamée sans preuve. Réponse : calmement, « Non, il manque cette étape ».' },
    { q: '« Si tu défends cela, tu vas te mettre la direction à dos. »', n: 35, o: [35, 8, 31, 28], e: 'On parle de ton intérêt, pas de ce qui est vrai. Réponse : « Est-ce vrai ? » et « Est-ce avantageux ? » sont deux questions.' },
    { q: '« On manque de temps, passons au point suivant », au moment précis où ton argument porte.', n: 18, o: [18, 29, 17, 19], e: 'Le débat est interrompu quand il tourne à ton avantage. Réponse : « Avant de changer de sujet, finissons celui-ci. »' }
  ];
  function strat(n) { for (var i = 0; i < E.strats.length; i++) if (E.strats[i].n === n) return E.strats[i]; return null; }
  function toQuiz(items) {
    return items.map(function (q, i) {
      var o = q.o.slice(), rot = (i * 3 + 1) % o.length; o = o.slice(rot).concat(o.slice(0, rot));
      return { q: q.q, o: o.map(function (n) { return strat(n).t; }), a: o.indexOf(q.n), e: q.e };
    });
  }
  var L = [];
  L.push({
    id: 'e0', m: 'er', n: 'É0', titre: 'Pourquoi une dialectique éristique ?', min: 6, src: 'schop',
    accroche: 'Schopenhauer a écrit un manuel pour gagner une dispute, même quand on a tort. Étrange, mais très utile : surtout pour ne pas se faire avoir.',
    sections: E.idees.map(function (x) { return { h: x.t, p: [x.x] }; }).concat([{ h: 'Comment l’utiliser, honnêtement', p: ['Ce cours a deux usages : reconnaître la ruse chez l’autre, et savoir ce que tu fais toi-même quand tu t’en sers. Les ruses « déloyales » marchent parfois, mais elles abîment ta crédibilité dès que l’auditoire les repère. Les techniques loyales (le contre-exemple, la retorsion, l’argument à partir des concessions) se défendent devant n’importe qui.', E.note] }]),
    retenir: ['Avoir raison et gagner la dispute sont deux choses différentes.', 'On défend souvent sa thèse par vanité, pas par conviction.', 'Connaître les ruses sert d’abord à s’en défendre.'],
    erreur: 'Croire qu’il suffit d’avoir raison pour que les autres s’en rendent compte.',
    methode: 'Avant de répondre dans une discussion tendue : « Est-ce que l’autre discute de ce que j’ai dit, ou d’autre chose ? »',
    exercice: 'Repense à une dispute récente. Dis au Studio, en 1 minute, ce qui s’est passé : qui a élargi, détourné, esquivé ? Ne cherche pas à avoir raison, cherche à décrire.',
    quiz: [
      { q: 'Selon Schopenhauer, quel est le but de la dialectique éristique ?', o: ['Tenir bon dans une dispute, que l’on ait raison ou tort', 'Découvrir la vérité objective', 'Former de bons logiciens', 'Enseigner la politesse'], a: 0, e: 'Il la définit comme l’art de disputer pour tenir bon : elle vise la victoire, pas la vérité.' },
      { q: 'Peut-on avoir raison et pourtant sembler avoir perdu une dispute ?', o: ['Oui : avoir raison et paraître gagner sont deux choses différentes', 'Non : la meilleure thèse finit toujours par gagner', 'Seulement devant des experts', 'Seulement à l’écrit'], a: 0, e: 'C’est tout le point de départ du texte.' },
      { q: 'Pourquoi, selon lui, défend-on souvent une thèse même fausse ?', o: ['Par vanité et obstination : on préfère défendre sa thèse plutôt que d’admettre une erreur', 'Parce que la logique l’exige', 'Par manque de vocabulaire', 'Parce que le public l’attend'], a: 0, e: 'Il décrit l’homme comme naturellement obstiné.' },
      { q: 'Quelle voie de réfutation attaque les conséquences de la thèse ?', o: ['La voie indirecte', 'La voie directe', 'L’argument ad hominem', 'L’homonymie'], a: 0, e: 'La voie directe attaque les raisons de la thèse ; l’indirecte, ses conséquences.' }
    ],
    sources: [{ t: 'The Art of Controversy, trad. T. Bailey Saunders (1896), Project Gutenberg', u: 'https://www.gutenberg.org/ebooks/10731' }]
  });
  var keys = Object.keys(E.familles), all = E.quiz.concat(QX);
  keys.forEach(function (k, idx) {
    var ss = E.strats.filter(function (s) { return s.f === k; }), M = META[k];
    L.push({
      id: 'e' + (idx + 1), m: 'er', n: 'É' + (idx + 1), titre: E.familles[k] + ' (' + ss.length + ' stratagèmes)', min: Math.max(6, Math.ceil(ss.length * 1.3)), src: 'schop',
      accroche: 'Pour chaque stratagème : le principe, un exemple, comment le reconnaître, comment y répondre.',
      sections: ss.map(function (s) {
        return { h: 'N° ' + s.n + ' · ' + s.t + ' (' + natL[s.nat] + ')', p: [
          'Le principe. ' + s.p,
          'Exemple (' + (s.exS ? 'de Schopenhauer' : 'de l’appli') + '). ' + s.ex,
          'Pour le reconnaître. ' + s.r,
          'Pour y répondre (' + (s.cS ? 'selon Schopenhauer' : 'conseil de l’appli') + '). ' + s.c
        ].concat(s.faux ? ['Nom moderne rapproché : ' + s.faux + '.'] : []) };
      }),
      retenir: M.r, erreur: M.e, methode: M.m, exercice: M.x,
      quiz: toQuiz(all.filter(function (q) { var s = strat(q.n); return s && s.f === k; })),
      sources: [{ t: 'The Art of Controversy, trad. T. Bailey Saunders (1896), Project Gutenberg', u: 'https://www.gutenberg.org/ebooks/10731' }]
    });
  });
  Array.prototype.push.apply(D.lessons, L);
})();

;
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.durations = [30, 60, 120, 300];

window.AO_DATA.exerciseTypes = [
  { id: 'argumenter', nom: 'Argumenter une idée', modele: 'PREP', aide: 'Point → Raison → Exemple → Point',
    sujets: ['Tout le monde devrait apprendre à parler en public', 'Le téléphone devrait être interdit en réunion', 'Le luxe est un art avant d’être un commerce', 'Madagascar a un atout sous-estimé', 'Travailler à distance rend meilleur', 'Il faut échouer pour apprendre', 'Un bon leader sait écouter avant de parler', 'Les études ne suffisent plus'] },
  { id: 'mot', nom: 'Parler à partir d’un mot', modele: 'Libre', aide: 'Définis le mot, donne un exemple, relie-le à ta vie.',
    sujets: ['Confiance', 'Héritage', 'Rareté', 'Patience', 'Frontière', 'Lenteur', 'Élégance', 'Risque', 'Mémoire', 'Silence'] },
  { id: 'recit', nom: 'Raconter une histoire', modele: 'Situation → Obstacle → Action → Leçon', aide: 'Une scène, un détail concret, une leçon.',
    sujets: ['Une fois où j’ai eu peur de parler', 'Un échec qui m’a appris quelque chose', 'La rencontre qui a changé mon parcours', 'Un voyage qui m’a marqué', 'Mon premier jour dans un lieu inconnu'] },
  { id: 'debat', nom: 'Défendre un camp', modele: 'Thèse → 2 arguments → Réfutation → Conclusion', aide: 'Anticipe l’objection la plus forte.',
    sujets: ['Pour ou contre l’IA dans la création artistique', 'Pour ou contre la semaine de quatre jours', 'Pour ou contre le luxe durable', 'Pour ou contre l’obligation de parler en public à l’école'] },
  { id: 'qr', nom: 'Répondre à une question', modele: 'Reformuler → Répondre → Conclure', aide: 'Une idée centrale, pas plus.',
    sujets: ['Pourquoi devrions-nous vous écouter ?', 'Quelle est votre plus grande faiblesse ?', 'Qu’est-ce qui vous différencie ?', 'Pourquoi ce projet maintenant ?', 'Et si vous vous trompiez ?'] },
  { id: 'connecteurs', nom: 'Relier ses idées (5 étapes)', modele: 'Annoncer → Prévenir → Concéder → Illustrer → Reformuler', aide: 'Un connecteur par étape : « je voudrais dire… », « attention, je ne dis pas que… », « certes… mais », « prenons le cas de… », « autrement dit… ».',
    sujets: ['Qu’est-ce que le bonheur ?', 'Faut-il toujours dire la vérité ?', 'La réussite se mérite-t-elle ?', 'Parler en public est-il un don ?', 'Faut-il apprendre à perdre ?', 'Le luxe est-il utile ?', 'Que vaut une promesse ?'] },
  { id: 'discours', nom: 'Discours complet', modele: 'Ouverture → Plan → 3 parties → Appel', aide: 'Annonce ton plan, finis par une demande.',
    sujets: ['Pourquoi j’ai écrit ce livre', 'Ce que je veux transmettre à ma génération', 'Présenter un projet à un jury', 'Un discours de remerciement'] }
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

;
/* Test de type d'orateur : modèle propre à l'appli, non scientifique.
   Chaque réponse ajoute des points à 3 axes : L (logos), E (ethos), P (pathos). */
window.AO_DATA = window.AO_DATA || {};
window.AO_DATA.typeQuiz = [
  { q: 'Avant un discours, tu commences par…', o: [
    { t: 'Écrire un plan avec les arguments', s: { L: 3 } },
    { t: 'Penser à ce qui me rend légitime sur ce sujet', s: { E: 3 } },
    { t: 'Chercher une histoire ou une image forte', s: { P: 3 } }] },
  { q: 'Face à une salle hostile, tu…', o: [
    { t: 'Réponds point par point avec des faits', s: { L: 3 } },
    { t: 'Restes calme et tiens ta ligne', s: { E: 3 } },
    { t: 'Cherche à toucher ce qu’ils ressentent', s: { P: 3 } }] },
  { q: 'Ce qu’on te dit le plus souvent après avoir parlé :', o: [
    { t: '« C’était clair et bien construit »', s: { L: 3 } },
    { t: '« On te sent sincère et sûr »', s: { E: 3 } },
    { t: '« Ça m’a touché / j’ai retenu ton histoire »', s: { P: 3 } }] },
  { q: 'Ta plus grande tentation à l’oral :', o: [
    { t: 'Trop d’informations', s: { L: 2, P: -1 } },
    { t: 'Compter sur ma réputation, négliger les preuves', s: { E: 2, L: -1 } },
    { t: 'Trop d’émotion, pas assez de preuves', s: { P: 2, L: -1 } }] },
  { q: 'Tu préfères conclure par…', o: [
    { t: 'Un récapitulatif net des trois points', s: { L: 3 } },
    { t: 'Un engagement personnel', s: { E: 3 } },
    { t: 'Une image ou une phrase qui reste', s: { P: 3 } }] },
  { q: 'Pour convaincre quelqu’un d’hésitant, tu…', o: [
    { t: 'Montre les chiffres', s: { L: 3 } },
    { t: 'Montre que tu as déjà fait ce que tu proposes', s: { E: 3 } },
    { t: 'Fais-lui imaginer ce que ça changera', s: { P: 3 } }] },
  { q: 'Ton point fort naturel à l’oral :', o: [
    { t: 'L’ordre et la précision', s: { L: 3 } },
    { t: 'L’aplomb et le calme', s: { E: 3 } },
    { t: 'L’énergie et le rythme', s: { P: 3 } }] },
  { q: 'Quand tu écoutes un grand orateur, tu remarques d’abord…', o: [
    { t: 'La structure et les preuves', s: { L: 3 } },
    { t: 'Sa présence et son autorité', s: { E: 3 } },
    { t: 'L’émotion et la musicalité', s: { P: 3 } }] }
];

/* Détermine l'archétype à partir des scores (premier axe, deuxième axe). */
window.AO_DATA.archetypeFor = function (sc) {
  const order = ['L', 'E', 'P'].sort((a, b) => sc[b] - sc[a]);
  const key = order[0] + order[1];
  const map = { LE: 'architecte', LP: 'pedagogue', EL: 'garant', EP: 'rassembleur', PE: 'tribun', PL: 'conteur' };
  return map[key];
};

;
var LOGO='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100.0" cy="22.0" r="11" fill="#C9A24B"/><circle cx="142.2" cy="34.4" r="11" fill="#C2391F"/><circle cx="171.0" cy="67.6" r="11" fill="#C2391F"/><circle cx="177.2" cy="111.1" r="11" fill="#C2391F"/><circle cx="158.9" cy="151.1" r="11" fill="#C2391F"/><circle cx="122.0" cy="174.8" r="11" fill="#C2391F"/><circle cx="78.0" cy="174.8" r="11" fill="#C2391F"/><circle cx="41.1" cy="151.1" r="11" fill="#C2391F"/><circle cx="22.8" cy="111.1" r="11" fill="#C2391F"/><circle cx="29.0" cy="67.6" r="11" fill="#C2391F"/><circle cx="57.8" cy="34.4" r="11" fill="#C2391F"/><circle cx="100" cy="100" r="27" fill="#C2391F"/></svg>';
(function () {
'use strict';
var D = window.AO_DATA, A = window.AO_ANALYSIS;
var root = document.getElementById('app');
var tabbar = document.getElementById('tabbar');
var LS = 'ao_state_v1';
var STANDALONE = !(window.claude && typeof window.claude.use === 'function');
var CAN_MIC = STANDALONE && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) && (location.protocol === 'https:' || location.hostname === 'localhost' || location.protocol === 'http:' && location.hostname === '127.0.0.1');
var SR_API = window.SpeechRecognition || window.webkitSpeechRecognition;

/* ---------- utilitaires ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function fmt(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
function durLabel(s) { return s < 60 ? s + ' s' : (s / 60) + ' min'; }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function byId(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; }
function today() { return new Date().toISOString().slice(0, 10); }

/* ---------- état + stockage ---------- */
var S = { goals: [], sessions: [], done: {}, quiz: {}, type: null, proofs: [], prep: [], erist: { best: 0 }, xp: 0, days: [], badges: [], why: null, angles: '', set: { sr: false }, since: 0, lastExport: 0 };
var cap = { db: null, sample: null, downloads: null, uid: null }; /* PWA : aucune IA, aucun service distant */
Object.freeze(cap); /* verrouillé : aucun appel IA possible depuis l’appli */
var saveTimer = null;
function loadLocal() { try { var r = localStorage.getItem(LS); if (r) merge(JSON.parse(r)); } catch (e) {} }
function merge(o) { for (var k in S) if (o && o[k] != null && typeof o[k] === typeof S[k]) S[k] = o[k]; }
function persist() {
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {}
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
  }, 800);
}
function touchDay() { var t = today(); if (S.days.indexOf(t) < 0) { S.days.push(t); S.days = S.days.slice(-120); } }
function streak() {
  var n = 0, d = new Date();
  for (;;) { var k = d.toISOString().slice(0, 10); if (S.days.indexOf(k) >= 0) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === today()) { d.setDate(d.getDate() - 1); } else break; }
  return n;
}
/* ---------- Rangs, niveaux d'exercice et récompenses ---------- */
var RANKS = [
  { n: 'Passant', min: 0, d: 'Tu arrives sur la place.' },
  { n: 'Auditeur', min: 40, d: 'Tu écoutes et tu t’exerces.' },
  { n: 'Disciple', min: 120, d: 'Tu as pris l’habitude de parler.' },
  { n: 'Orateur', min: 260, d: 'Tu tiens la parole devant les autres.' },
  { n: 'Rhéteur', min: 480, d: 'Tu construis et tu prouves.' },
  { n: 'Tribun', min: 800, d: 'Tu sais convaincre et te défendre.' },
  { n: 'Maître de l’agora', min: 1300, d: 'La place t’écoute.' }
];
function rankInfo() {
  var xp = S.xp || 0, i = 0;
  for (var k = 0; k < RANKS.length; k++) if (xp >= RANKS[k].min) i = k;
  var nx = RANKS[i + 1] || null;
  return { i: i, r: RANKS[i], next: nx, left: nx ? nx.min - xp : 0, pct: nx ? Math.round(100 * (xp - RANKS[i].min) / (nx.min - RANKS[i].min)) : 100 };
}
var TIERS = [1, 3, 6, 10], TIER_NAMES = ['Nouveau', 'Découverte', 'Pratique', 'Aisance', 'Maîtrise'];
function exLevel(typeId) {
  var n = S.sessions.filter(function (s) { return s.type === typeId; }).length, lvl = 0;
  for (var i = 0; i < TIERS.length; i++) if (n >= TIERS[i]) lvl = i + 1;
  return { n: n, lvl: lvl, name: TIER_NAMES[lvl], next: lvl < TIERS.length ? TIERS[lvl] : null, left: lvl < TIERS.length ? TIERS[lvl] - n : 0 };
}
function modulesDone() {
  return D.modules.filter(function (mo) {
    var ls = D.lessons.filter(function (l) { return l.m === mo.id; });
    return ls.length && ls.every(function (l) { return S.done[l.id]; });
  });
}
function lessonsDoneN() { return D.lessons.filter(function (l) { return S.done[l.id]; }).length; }
var BADGES = [
  { id: 'voix', t: 'Première parole', d: 'Fais une première séance dans le Studio.', ok: function () { return S.sessions.length >= 1; } },
  { id: 'reg3', t: 'Régulier', d: 'Viens trois jours de suite.', ok: function () { return streak() >= 3; } },
  { id: 'reg7', t: 'Assidu', d: 'Viens sept jours de suite.', ok: function () { return streak() >= 7; } },
  { id: 'etud', t: 'Studieux', d: 'Termine 5 leçons.', ok: function () { return lessonsDoneN() >= 5; } },
  { id: 'erud', t: 'Érudit', d: 'Termine 30 leçons.', ok: function () { return lessonsDoneN() >= 30; } },
  { id: 'mod', t: 'Module validé', d: 'Termine toutes les leçons d’un module.', ok: function () { return modulesDone().length >= 1; } },
  { id: 'sf', t: 'Sans faute', d: 'Réussis un quiz de leçon à 100 %.', ok: function () { return D.lessons.some(function (l) { return l.quiz && S.quiz[l.id] === l.quiz.length; }); } },
  { id: 'poly', t: 'Polyvalent', d: 'Essaie 4 types d’exercices différents.', ok: function () { var t = {}; S.sessions.forEach(function (s) { if (s.type) t[s.type] = 1; }); return Object.keys(t).length >= 4; } },
  { id: 'c5', t: 'Cinq sur cinq', d: 'Dans « Relier ses idées », fais détecter les 5 étapes dans ton texte.', ok: function () { return S.sessions.some(function (s) { return s.type === 'connecteurs' && s.txt && s.txt.steps && s.txt.steps.count === 5; }); } },
  { id: 'prep', t: 'Préparateur', d: 'Prépare un débat ou un discours dans « Préparer ».', ok: function () { return (S.prep || []).length >= 1; } },
  { id: 'eri', t: 'Éristicien', d: 'Obtiens 12 sur 12 au quiz global des 38 stratagèmes.', ok: function () { return S.erist && S.erist.best >= 12; } }
];
function badgesOk() { return BADGES.filter(function (b) { return b.ok(); }); }
var toastBox = null;
function toast(msg, big) {
  try {
    if (!toastBox) { toastBox = document.createElement('div'); toastBox.className = 'toasts'; document.body.appendChild(toastBox); }
    var el = document.createElement('div'); el.className = 'toast' + (big ? ' big' : ''); el.textContent = msg;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.removeChild(toastBox.firstChild);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, big ? 4800 : 3000);
  } catch (e) {}
}
function addXp(n) {
  var before = rankInfo().i;
  S.xp += n;
  var after = rankInfo();
  var seen = S.badges || [], fresh = badgesOk().filter(function (b) { return seen.indexOf(b.id) < 0; });
  if (fresh.length) S.badges = seen.concat(fresh.map(function (b) { return b.id; }));
  if (after.i > before) toast('Nouveau rang : ' + after.r.n + ' · +' + n + ' pts', true);
  else toast('+' + n + ' pts');
  if (fresh.length > 2) toast(fresh.length + ' récompenses débloquées', true);
  else fresh.forEach(function (b) { toast('Récompense : ' + b.t, true); });
}
function vRank() {
  var ri = rankInfo();
  var h = '<div class="card rank"><div class="row" style="justify-content:space-between;align-items:baseline"><div><div class="eyebrow">Ton rang</div><h2 style="margin:0">' + esc(ri.r.n) + '</h2></div><span class="pill">' + S.xp + ' pts</span></div>';
  h += '<p class="muted small" style="margin:4px 0 8px">' + esc(ri.r.d) + '</p><div class="bar"><i style="width:' + ri.pct + '%"></i></div>';
  h += '<p class="muted small" style="margin:6px 0 0">' + (ri.next ? 'Encore ' + ri.left + ' pts pour devenir ' + esc(ri.next.n) + '.' : 'Rang maximum atteint.') + '</p></div>';
  return h;
}
function vBadges() {
  var ok = badgesOk(), okIds = ok.map(function (b) { return b.id; });
  var h = '<div class="card"><div class="row" style="justify-content:space-between"><h3>Récompenses</h3><span class="muted small">' + ok.length + ' / ' + BADGES.length + '</span></div><div class="badges">';
  h += BADGES.map(function (b) { var on = okIds.indexOf(b.id) >= 0; return '<div class="badge' + (on ? ' on' : '') + '"><b>' + (on ? '★ ' : '☆ ') + esc(b.t) + '</b><span>' + esc(b.d) + '</span></div>'; }).join('');
  h += '</div><p class="muted small" style="margin:10px 0 0">Points : séance +10 à +25, leçon terminée +15, module validé +30, objectif +20.</p></div>';
  return h;
}
function exLevelHtml(typeId) {
  var e = exLevel(typeId);
  var pct = e.next ? Math.round(100 * (e.n - (e.lvl ? TIERS[e.lvl - 1] : 0)) / (e.next - (e.lvl ? TIERS[e.lvl - 1] : 0))) : 100;
  return '<div class="lvl"><div class="row" style="justify-content:space-between"><span class="small"><b>Niveau ' + e.lvl + ' · ' + esc(e.name) + '</b></span><span class="muted small">' + e.n + ' séance' + (e.n > 1 ? 's' : '') + '</span></div><div class="bar"><i style="width:' + pct + '%"></i></div>' +
    '<p class="muted small" style="margin:4px 0 0">' + (e.next ? 'Encore ' + e.left + ' séance' + (e.left > 1 ? 's' : '') + ' pour « ' + TIER_NAMES[e.lvl + 1] + ' ».' : 'Niveau maximum : continue pour garder le rythme.') + '</p></div>';
}
var STEP_LABELS = { annonce: 'J’annonce', prolepse: 'Je préviens le malentendu', concession: 'Je concède', exemple: 'J’illustre', reformulation: 'Je reformule' };
function stepsHtml(t) {
  if (!t || !t.steps) return '';
  var h = '<div class="card"><h3>Les 5 étapes dans ton texte : ' + t.steps.count + ' / 5</h3>';
  Object.keys(STEP_LABELS).forEach(function (k) { var f = t.steps.found[k]; h += m(STEP_LABELS[k], f ? '✓ « ' + esc(f) + ' »' : 'non repéré', f ? 'tag-ok' : 'tag-warn'); });
  h += '<p class="muted small" style="margin:8px 0 0">Repérage de mots précis dans ta transcription. Une étape bien faite avec d’autres mots n’est pas vue : c’est un guide, pas un juge.</p></div>';
  return h;
}

/* ============================================================
   PWA : données locales, enregistrements, corbeille, réglages,
   mise à jour, couverture. Aucun appel réseau vers un service tiers.
   ============================================================ */
var VERSION = '1.0.0', BUILD = window.AGORA_BUILD || 'dev';
var DAY = 86400000;
var pwa = { swReg: null, updateReady: false, wantReload: false, offlineReady: false, installEvt: null, imp: null, proofEdit: null, proofFilter: '', msg: '', persisted: null, dismissed: {} };
var WHY_DEFAULT = [
  'Dans la Grèce antique, l’agora, c’était la place publique. On y vendait, on y croisait ses voisins et, surtout, on y parlait. Quelqu’un se levait, les autres écoutaient, et la meilleure idée avait sa chance.',
  'Donc l’agora n’appartenait à personne. Elle appartenait à celui qui osait prendre la parole.',
  'C’est ce que je veux ici. Un endroit où l’on s’entraîne sans juge et sans scène. Un endroit où l’on apprend à structurer, à prouver, à convaincre. Un endroit où chaque voix compte, parce qu’elle a travaillé.',
  'Parler en public, ce n’est pas un don réservé à quelques-uns. C’est un métier qui s’apprend, comme on construit une maison : pierre après pierre, étape après étape.',
  '**Voilà pourquoi Agora. Parce que chacun mérite sa place sur la place.**'
];
var errLog = [];
window.addEventListener('error', function (e) { errLog.push(String(e.message || e)); });
window.addEventListener('unhandledrejection', function (e) { errLog.push('promesse: ' + String(e.reason && e.reason.message || e.reason)); });
window.AGORA_ERRORS = errLog;

/* ---------- petits outils ---------- */
function byIdEl(id) { return document.getElementById(id); }
function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function fmtDay(t) { try { return new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
function fmtBytes(n) { n = +n || 0; if (n < 1024) return n + ' o'; if (n < 1048576) return Math.round(n / 1024) + ' Ko'; return (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' Mo'; }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function mdLite(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
function copyText(t, btn) {
  function done() { if (btn) { var o = btn.getAttribute('data-l') || btn.textContent; btn.setAttribute('data-l', o); btn.textContent = 'Copié'; setTimeout(function () { btn.textContent = o; }, 1600); } }
  function fb() {
    var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Copie impossible : sélectionne le texte à la main.'); }
    document.body.removeChild(ta);
  }
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fb); else fb(); } catch (e) { fb(); }
}
function saveFile(name, blob) {
  var a = document.createElement('a'); var u = URL.createObjectURL(blob);
  a.href = u; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(u); }, 60000);
}
function extFor(mime) { mime = String(mime || ''); if (/mp4|m4a|aac/.test(mime)) return 'm4a'; if (/webm/.test(mime)) return 'webm'; if (/ogg/.test(mime)) return 'ogg'; if (/wav/.test(mime)) return 'wav'; if (/mpeg|mp3/.test(mime)) return 'mp3'; return 'audio'; }
function safeName(s) { return String(s || 'agora').replace(/[^\wÀ-ſ -]+/g, '').trim().replace(/\s+/g, '-').slice(0, 50) || 'agora'; }

/* ---------- IndexedDB : enregistrements, sauvegardes, corbeille ---------- */
var idbP = null;
function idb() {
  if (idbP) return idbP;
  idbP = new Promise(function (res, rej) {
    try {
      var r = indexedDB.open('agora_db', 1);
      r.onupgradeneeded = function () { var d = r.result; ['rec', 'bak', 'trash'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
      r.onblocked = function () { rej(new Error('blocked')); };
    } catch (e) { rej(e); }
  });
  return idbP;
}
function idbDo(store, mode, fn) {
  return idb().then(function (d) {
    return new Promise(function (res, rej) {
      var t = d.transaction(store, mode), out = fn(t.objectStore(store));
      t.oncomplete = function () { res(out && typeof out === 'object' && 'result' in out ? out.result : out); };
      t.onerror = t.onabort = function () { rej(t.error); };
    });
  });
}
function idbAll(store) { return idbDo(store, 'readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }); }
function idbGet(store, id) { return idbDo(store, 'readonly', function (s) { return s.get(id); }); }
function idbPut(store, v) { return idbDo(store, 'readwrite', function (s) { return s.put(v); }); }
function idbDel(store, id) { return idbDo(store, 'readwrite', function (s) { return s.delete(id); }); }

/* ---------- enregistreur ---------- */
var wake = null;
function pwaWake(on) {
  try {
    if (on && navigator.wakeLock && !wake) navigator.wakeLock.request('screen').then(function (w) { wake = w; w.addEventListener('release', function () { wake = null; }); }, function () {});
    else if (!on && wake) { wake.release(); wake = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  if (st.rec && mr && mr.state === 'inactive') { stopRec(); toast('Enregistrement interrompu : l’appli a été quittée. Ce qui a été capté est gardé.', true); }
  else if (st.rec) pwaWake(true);
});
function pwaRecorder(stream) {
  pwaWake(true);
  var types = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  try { for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) return new MediaRecorder(stream, { mimeType: types[i] }); } catch (e) {}
  return new MediaRecorder(stream);
}
function pwaSaveRec(blob, dur) {
  pwaWake(false);
  var id = uid(); st.audioId = id;
  var rec = { id: id, name: String(st.sujet || 'Enregistrement').slice(0, 60), date: Date.now(), dur: Math.round(dur || st.recSec || st.audioLen || 0), type: st.type, sujet: st.sujet, mime: blob.type || '', size: blob.size, blob: blob, del: 0 };
  return idbPut('rec', rec).then(function () { persistAsk(true); refreshLib(); }).catch(function () { st.audioId = null; toast('Enregistrement non gardé : stockage indisponible sur ce navigateur.', true); });
}
function persistAsk(quiet) {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (ok) { pwa.persisted = ok; lsSet('ao_persist', ok ? '1' : '0'); if (!quiet) toast(ok ? 'Stockage protégé' : 'Le navigateur n’a pas accordé la protection'); if (view.tab === 'settings') render(); });
  } catch (e) {}
}
function libItemHtml(r) {
  return '<div class="ritem" data-id="' + esc(r.id) + '"><div class="rname"><b>' + esc(r.name) + '</b><span class="small muted">' + esc(fmtDay(r.date)) + ' · ' + fmt(r.dur || 0) + ' · ' + fmtBytes(r.size) + ' · ' + extFor(r.mime) + '</span></div>' +
    '<div class="row"><button class="chip" data-act="rec-play" data-v="' + esc(r.id) + '">Écouter</button><button class="chip" data-act="rec-ren" data-v="' + esc(r.id) + '">Renommer</button><button class="chip" data-act="rec-dl" data-v="' + esc(r.id) + '">Télécharger</button><button class="chip" data-act="rec-del" data-v="' + esc(r.id) + '">Supprimer</button></div><div class="rplay"></div></div>';
}
function refreshLib() {
  var box = byIdEl('recLib'); if (!box) return;
  idbAll('rec').then(function (list) {
    list = list.filter(function (r) { return !r.del; }).sort(function (a, b) { return b.date - a.date; });
    var h = '<div class="eyebrow">Mes enregistrements</div><p class="muted small" style="margin:0">Gardés uniquement sur ce téléphone. Garde l’appli ouverte et l’écran allumé pendant l’enregistrement : un appel ou un changement d’appli peut l’interrompre.</p>';
    if (st.blob && !st.audioId) h += '<button class="btn small ghost" data-act="rec-keep">Garder l’audio prêt dans l’appli</button>';
    h += list.length ? list.slice(0, 40).map(libItemHtml).join('') : '<p class="muted small" style="margin:0">Aucun enregistrement gardé. Ceux que tu fais ici apparaissent dans cette liste.</p>';
    box.innerHTML = h;
  }).catch(function () { box.innerHTML = '<div class="eyebrow">Mes enregistrements</div><p class="muted small" style="margin:0">Le stockage local est indisponible (navigation privée ?). L’analyse fonctionne, mais l’audio n’est pas gardé.</p>'; });
}
function playInto(holder, id) {
  idbGet('rec', id).then(function (r) {
    if (!r || !holder) return;
    holder.innerHTML = '';
    var a = document.createElement('audio'); a.controls = true; a.preload = 'metadata'; a.src = URL.createObjectURL(r.blob); a.style.width = '100%';
    holder.appendChild(a);
  }).catch(function () { toast('Lecture impossible.'); });
}

/* ---------- corbeille 24 h ---------- */
function trashPut(kind, label, payload) { return idbPut('trash', { id: uid(), kind: kind, label: String(label || '').slice(0, 80), at: Date.now(), payload: payload }); }
function trashPurge() {
  var lim = Date.now() - DAY;
  idbAll('trash').then(function (l) { l.filter(function (t) { return t.at < lim; }).forEach(function (t) { idbDel('trash', t.id); }); }).catch(function () {});
  idbAll('rec').then(function (l) { l.filter(function (r) { return r.del && r.del < lim; }).forEach(function (r) { idbDel('rec', r.id); }); }).catch(function () {});
}
function trashRestore(id) {
  idbGet('trash', id).then(function (t) {
    if (!t) return;
    var p = t.payload;
    if (t.kind === 'proof') S.proofs.unshift(p);
    else if (t.kind === 'session') { S.sessions.push(p); S.sessions.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); }
    else if (t.kind === 'lesson') { if (p.done) S.done[p.id] = true; if (p.quiz != null) S.quiz[p.id] = p.quiz; }
    persist(); return idbDel('trash', id);
  }).then(function () { toast('Élément restauré'); render(); }).catch(function () {});
}
function trashRestoreRec(id) {
  idbGet('rec', id).then(function (r) { if (!r) return; r.del = 0; return idbPut('rec', r); }).then(function () { toast('Enregistrement restauré'); render(); }).catch(function () {});
}

/* ---------- validation / import / export ---------- */
function str(x, n) { return typeof x === 'string' ? x.slice(0, n || 400) : ''; }
function isId(x) { return typeof x === 'string' && /^[\w.-]{1,40}$/.test(x); }
function cleanState(o) {
  if (!o || typeof o !== 'object') throw new Error('Données illisibles');
  var c = {}, a = function (x) { return Array.isArray(x) ? x : []; };
  c.goals = a(o.goals).filter(function (g) { return g && isId(g.id) && typeof g.t === 'string'; }).slice(0, 100).map(function (g) { return { id: g.id, t: str(g.t, 80), done: !!g.done }; });
  c.sessions = a(o.sessions).filter(function (s) { return s && isId(s.id) && typeof s.date === 'string' && typeof s.sujet === 'string'; }).slice(0, 300).map(function (s) {
    s.date = str(s.date, 10); s.sujet = str(s.sujet, 300); if (s.transcript != null) s.transcript = str(s.transcript, 30000); if (s.note != null) s.note = str(s.note, 4000);
    if (s.audioId != null && !isId(s.audioId)) s.audioId = null; return s;
  });
  c.proofs = a(o.proofs).filter(function (p) { return p && isId(p.id) && typeof p.fait === 'string'; }).slice(0, 1000).map(function (p) {
    return { id: p.id, sujet: str(p.sujet, 120), fait: str(p.fait, 1200), url: str(p.url, 400), tags: str(p.tags, 120), date: str(p.date, 10) || today() };
  });
  c.prep = a(o.prep).filter(function (p) { return p && isId(p.id) && (p.kind === 'debat' || p.kind === 'discours') && p.data && typeof p.data === 'object' && typeof p.topic === 'string'; }).slice(0, 25);
  c.done = {}; if (o.done && typeof o.done === 'object') Object.keys(o.done).slice(0, 500).forEach(function (k) { if (isId(k) && byId(D.lessons, k) && o.done[k]) c.done[k] = true; });
  c.quiz = {}; if (o.quiz && typeof o.quiz === 'object') Object.keys(o.quiz).slice(0, 500).forEach(function (k) { var n = +o.quiz[k]; if (isId(k) && byId(D.lessons, k) && isFinite(n) && n >= 0 && n <= 100) c.quiz[k] = n; });
  c.type = typeof o.type === 'string' && o.type.length < 40 ? o.type : null;
  c.erist = { best: o.erist && isFinite(+o.erist.best) ? Math.max(0, Math.min(99, +o.erist.best)) : 0 };
  c.xp = isFinite(+o.xp) ? Math.max(0, Math.min(1e6, Math.round(+o.xp))) : 0;
  c.days = a(o.days).filter(function (d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); }).slice(-400);
  c.badges = a(o.badges).filter(function (b) { return typeof b === 'string' && b.length < 60; }).slice(0, 100);
  c.why = typeof o.why === 'string' && o.why.trim() ? o.why.slice(0, 6000) : null;
  c.angles = typeof o.angles === 'string' ? o.angles.slice(0, 6000) : '';
  c.set = { sr: !!(o.set && o.set.sr) };
  c.since = isFinite(+o.since) ? +o.since : 0; c.lastExport = 0;
  return c;
}
function cleanRec(r) {
  if (!r || !isId(r.id) || typeof r.data !== 'string' || r.data.indexOf('data:') !== 0) return null;
  return { id: r.id, name: str(r.name, 60) || 'Enregistrement', date: +r.date || Date.now(), dur: +r.dur || 0, type: str(r.type, 30), sujet: str(r.sujet, 300), mime: str(r.mime, 60), size: +r.size || 0, data: r.data, del: 0 };
}
function parseImport(o) {
  if (!o || typeof o !== 'object') throw new Error('Fichier non reconnu');
  var res = { state: null, recs: [] };
  if (o.app === 'agora' && o.state) res.state = cleanState(o.state);
  else if (o.sessions || o.done || o.proofs || o.goals || o.xp != null || o.prep) res.state = cleanState(o); /* ancien export de l’artifact */
  if (Array.isArray(o.recordings)) res.recs = o.recordings.map(cleanRec).filter(Boolean);
  if (!res.state && !res.recs.length) throw new Error('Ce fichier ne contient ni données Agora ni enregistrements');
  return res;
}
function sig(s) { return [s.date, s.sujet, s.dur, s.type].join('|'); }
function mergeState(inc) {
  var added = { sessions: 0, proofs: 0, goals: 0, lessons: 0, prep: 0 };
  var ids = {}; S.sessions.forEach(function (s) { ids[s.id] = 1; ids[sig(s)] = 1; });
  inc.sessions.forEach(function (s) { if (!ids[s.id] && !ids[sig(s)]) { S.sessions.push(s); added.sessions++; } });
  S.sessions.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }); S.sessions = S.sessions.slice(0, 300);
  var pk = {}; S.proofs.forEach(function (p) { pk[p.id] = 1; pk[norm(p.sujet + p.fait + p.url)] = 1; });
  inc.proofs.forEach(function (p) { var k = norm(p.sujet + p.fait + p.url); if (!pk[p.id] && !pk[k]) { S.proofs.push(p); pk[p.id] = 1; pk[k] = 1; added.proofs++; } });
  var gk = {}; S.goals.forEach(function (g) { gk[g.id] = 1; gk[norm(g.t)] = 1; });
  inc.goals.forEach(function (g) { if (!gk[g.id] && !gk[norm(g.t)]) { S.goals.push(g); added.goals++; } });
  var pi = {}; S.prep.forEach(function (p) { pi[p.id] = 1; });
  inc.prep.forEach(function (p) { if (!pi[p.id]) { S.prep.push(p); added.prep++; } }); S.prep = S.prep.slice(0, 25);
  Object.keys(inc.done).forEach(function (k) { if (!S.done[k]) { S.done[k] = true; added.lessons++; } });
  Object.keys(inc.quiz).forEach(function (k) { if (S.quiz[k] == null || inc.quiz[k] > S.quiz[k]) S.quiz[k] = inc.quiz[k]; });
  S.xp = Math.max(S.xp, inc.xp); S.erist.best = Math.max(S.erist.best || 0, inc.erist.best);
  var dd = {}; S.days.concat(inc.days).forEach(function (d) { dd[d] = 1; }); S.days = Object.keys(dd).sort().slice(-120);
  var bb = {}; (S.badges || []).concat(inc.badges).forEach(function (b) { bb[b] = 1; }); S.badges = Object.keys(bb);
  if (!S.type && inc.type) S.type = inc.type;
  if (!S.why && inc.why) S.why = inc.why;
  if (!S.angles && inc.angles) S.angles = inc.angles;
  if (inc.since && (!S.since || inc.since < S.since)) S.since = inc.since;
  return added;
}
function backupNow(reason) {
  var snap = JSON.stringify(S); lsSet('ao_backup_prev', snap);
  return idbPut('bak', { id: 'b' + Date.now(), at: Date.now(), reason: reason, json: snap }).then(function () {
    return idbAll('bak').then(function (l) { l.sort(function (a, b) { return b.at - a.at; }); l.slice(5).forEach(function (b) { idbDel('bak', b.id); }); });
  }).catch(function () {});
}
function importRecs(recs) {
  var n = 0;
  return Promise.all(recs.map(function (r) {
    return idbGet('rec', r.id).then(function (ex) {
      if (ex) return;
      return fetch(r.data).then(function (x) { return x.blob(); }).then(function (b) { var o = { id: r.id, name: r.name, date: r.date, dur: r.dur, type: r.type, sujet: r.sujet, mime: r.mime || b.type, size: b.size, blob: b, del: 0 }; n++; return idbPut('rec', o); });
    });
  })).then(function () { return n; });
}
function exportState() {
  var o = { app: 'agora', format: 2, version: VERSION, exportedAt: new Date().toISOString(), state: S };
  saveFile('agora-donnees-' + today() + '.json', new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' }));
  S.lastExport = Date.now(); persist(); toast('Sauvegarde créée (sans enregistrements audio)');
}
function exportRecs() {
  idbAll('rec').then(function (l) {
    l = l.filter(function (r) { return !r.del; });
    if (!l.length) { toast('Aucun enregistrement à exporter.'); return; }
    var parts = ['{"app":"agora","format":2,"kind":"recordings","exportedAt":"' + new Date().toISOString() + '","recordings":['];
    return Promise.all(l.map(function (r) {
      return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { res({ id: r.id, name: r.name, date: r.date, dur: r.dur, type: r.type, sujet: r.sujet, mime: r.mime, size: r.size, data: fr.result }); }; fr.onerror = function () { res(null); }; fr.readAsDataURL(r.blob); });
    })).then(function (all) {
      all = all.filter(Boolean); parts.push(all.map(function (x) { return JSON.stringify(x); }).join(',')); parts.push(']}');
      saveFile('agora-enregistrements-' + today() + '.json', new Blob(parts, { type: 'application/json' })); toast('Fichier des enregistrements créé');
    });
  }).catch(function () { toast('Export des enregistrements impossible.'); });
}
function onImportFile(f) {
  if (!f) return;
  if (f.size > 120 * 1048576) { pwa.msg = 'Fichier trop gros (plus de 120 Mo).'; render(); return; }
  var fr = new FileReader();
  fr.onload = function () {
    try { pwa.imp = { name: f.name, p: parseImport(JSON.parse(fr.result)) }; pwa.msg = ''; }
    catch (e) { pwa.imp = null; pwa.msg = 'Import refusé : ' + (e && e.message || 'fichier invalide') + '. Rien n’a été modifié.'; }
    render();
  };
  fr.onerror = function () { pwa.msg = 'Fichier illisible.'; render(); };
  fr.readAsText(f);
}
function doMerge() {
  var p = pwa.imp && pwa.imp.p; if (!p) return;
  backupNow('avant import').then(function () {
    var added = p.state ? mergeState(p.state) : null;
    if (added) persist();
    return (p.recs.length ? importRecs(p.recs) : Promise.resolve(0)).then(function (n) {
      pwa.imp = null;
      pwa.msg = 'Import terminé' + (added ? ' : ' + added.sessions + ' séance(s), ' + added.proofs + ' preuve(s), ' + added.lessons + ' leçon(s) ajoutée(s)' : '') + (n ? ', ' + n + ' enregistrement(s)' : '') + '. Une copie de sécurité a été faite avant.';
      render();
    });
  }).catch(function () { pwa.msg = 'Import interrompu. Tes données n’ont pas été modifiées.'; render(); });
}
function rollbackImport() {
  idbAll('bak').then(function (l) {
    l.sort(function (a, b) { return b.at - a.at; });
    var raw = l.length ? l[0].json : lsGet('ao_backup_prev');
    if (!raw) { pwa.msg = 'Aucune copie de sécurité disponible.'; render(); return; }
    var cur = JSON.stringify(S);
    var c = cleanState(JSON.parse(raw)); c.lastExport = S.lastExport;
    Object.keys(c).forEach(function (k) { S[k] = c[k]; });
    lsSet('ao_backup_prev', cur); persist(); pwa.msg = 'Retour à la copie de sécurité effectué.'; render();
  }).catch(function () { pwa.msg = 'Retour impossible.'; render(); });
}

/* ---------- rappel de sauvegarde, installation, mise à jour ---------- */
function hasData() { return S.sessions.length || S.proofs.length || S.goals.length || S.xp > 0 || Object.keys(S.done).length; }
function needBackup() {
  if (!hasData()) return false;
  var base = S.lastExport || S.since || 0; if (!base) return false;
  if (lsGet('ao_bk_dismiss') === today()) return false;
  return Date.now() - base > 14 * DAY;
}
function isStandalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
function isIOS() { return /iPhone|iPad|iPod/.test(navigator.userAgent); }
function homeBanners() {
  var h = '';
  if (pwa.updateReady) h += '<div class="card banner"><b>Nouvelle version prête</b><p class="muted small" style="margin:4px 0 8px">Ton travail est conservé.</p><button class="btn small" data-act="update-now">Mettre à jour</button></div>';
  if (needBackup()) h += '<div class="card banner"><b>Pense à sauvegarder</b><p class="muted small" style="margin:4px 0 8px">Ta dernière sauvegarde date de plus de 14 jours' + (S.lastExport ? ' (' + esc(fmtDay(S.lastExport)) + ')' : ' ou n’a jamais été faite') + '.</p><div class="row"><button class="btn small" data-act="export-data">Sauvegarder maintenant</button><button class="btn small ghost" data-act="bk-later">Plus tard</button></div></div>';
  if (!isStandalone() && lsGet('ao_inst_dismiss') !== '1') {
    if (pwa.installEvt) h += '<div class="card banner"><b>Installer Agora</b><p class="muted small" style="margin:4px 0 8px">Pour l’ouvrir comme une application, même hors ligne.</p><div class="row"><button class="btn small" data-act="install">Installer</button><button class="btn small ghost" data-act="inst-hide">Masquer</button></div></div>';
    else if (isIOS()) h += '<div class="card banner"><b>Installer Agora sur l’iPhone</b><p class="muted small" style="margin:4px 0 8px">Dans Safari : bouton Partager, puis « Sur l’écran d’accueil ».</p><button class="btn small ghost" data-act="inst-hide">Masquer</button></div>';
  }
  return h;
}
function homeDaily() {
  var n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / DAY), ex = D.exerciseTypes[n % D.exerciseTypes.length], sj = ex.sujets[n % ex.sujets.length];
  var o = D.orators[n % D.orators.length], wk = Date.now() - 7 * DAY;
  var wkN = S.sessions.filter(function (s) { return new Date(s.date).getTime() > wk; }).length;
  var h = '<div class="card dayc"><div class="eyebrow">Défi du jour</div><h3>' + esc(ex.nom) + '</h3><p style="margin:6px 0 10px">' + esc(sj) + '</p><button class="btn small" data-act="daily-go" data-v="' + esc(ex.id) + '|' + (n % ex.sujets.length) + '">Relever le défi</button></div>';
  h += '<button class="card tap" data-act="orator" data-v="' + esc(o.id) + '"><div class="eyebrow">Orateur du jour</div><h3>' + esc(o.nom) + '</h3><p class="muted small" style="margin:4px 0 0">' + esc(o.discours.titre) + ' · ' + esc(o.epoque) + '</p></button>';
  h += '<div class="card"><div class="eyebrow">Cette semaine</div><div class="row" style="justify-content:space-around;margin-top:8px"><div class="pil"><b>' + wkN + '</b><span class="small muted">séance' + (wkN > 1 ? 's' : '') + '</span></div><div class="pil"><b>' + streak() + '</b><span class="small muted">jour' + (streak() > 1 ? 's' : '') + ' de suite</span></div><div class="pil"><b>' + S.xp + '</b><span class="small muted">points</span></div></div></div>';
  return h;
}
function whyHtml() {
  var paras = S.why ? S.why.split(/\n{2,}/).filter(function (x) { return x.trim(); }) : WHY_DEFAULT;
  return '<div class="card prose"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><h3>Pourquoi Agora ?</h3><button class="chip" data-act="why-edit">Modifier</button></div>' + paras.map(function (p, i) { return '<p' + (i === paras.length - 1 ? ' style="margin:0"' : '') + '>' + mdLite(p.trim()) + '</p>'; }).join('') + '</div>';
}

/* ---------- retour de coach manuel (aucune IA branchée) ---------- */
function coachPrompt(s) {
  var meas = {
    exercice: s.type, sujet: s.sujet, duree_visee_s: s.dur,
    voix: s.sig ? { variation_hauteur_demi_tons: s.sig.pitch && s.sig.pitch.sdSemitones, pauses: s.sig.pauses.count, blancs: s.sig.pauses.blank, fins_montantes_pct: Math.round(s.sig.endings.risingShare * 100), syll_par_s: s.sig.rhythm.syllPerSec } : null,
    texte: s.txt ? { mots: s.txt.words, mots_par_min: s.txt.wpm, tics: s.txt.fillers.total, plan_annonce: s.txt.planAnnounced } : null
  };
  return 'Tu es coach en art oratoire, exigeant et bienveillant. Voici la transcription d’un exercice de prise de parole (en français) et des mesures automatiques. Ne suppose rien sur la voix au-delà des mesures et n’invente aucun chiffre. Réponds en trois parties courtes : un point fort précis, la priorité n°1 à corriger, un exercice de 5 minutes.\n\nMesures : ' + JSON.stringify(meas) + '\n\nTranscription :\n' + (s.transcript || '(aucune)');
}
function coachBox(s) {
  var h = '';
  if (s.audioId) h += '<div class="card stack" id="resAudio" data-aid="' + esc(s.audioId) + '"><h3>Ton enregistrement</h3><div class="rplay"></div></div>';
  h += '<div class="card stack" id="aiBox"><h3>Retour de coach (facultatif)</h3><p class="muted small" style="margin:0">Cette appli n’envoie rien à une IA et ne consomme rien. Si tu veux un avis extérieur, copie le message ci-dessous, colle-le dans l’assistant de ton choix, puis note ici ce que tu en retiens.</p>';
  if (s.ai) h += aiHtml(s.ai);
  h += '<button class="btn ghost small" data-act="coach-copy" data-v="' + esc(s.id) + '">Copier le message pour un coach</button><textarea id="coachNote" placeholder="Ton retour, tes notes de coach…" maxlength="4000">' + esc(s.note || '') + '</textarea><button class="btn small" data-act="coach-save" data-v="' + esc(s.id) + '">Enregistrer la note</button></div>';
  return h;
}

/* ---------- PREUVES (bibliothèque locale) ---------- */
function vProofs() {
  var pe = pwa.proofEdit ? byId(S.proofs, pwa.proofEdit) : null;
  var h = '<div class="top"><h1>Preuves</h1></div><div class="stack">';
  h += '<div class="callout info">Cette appli ne cherche pas sur internet. Tu gardes ici tes faits, chiffres et citations, avec leur source et la date de vérification. Ajoute-les à la main ou importe un fichier.</div>';
  h += '<div class="card stack"><h3>Ma bibliothèque <span class="muted small">(' + S.proofs.length + ')</span></h3><input type="search" id="pSearch" placeholder="Chercher un mot, un sujet, une source…" value="' + esc(pwa.proofFilter) + '" autocomplete="off"><div id="pList" class="stack"></div></div>';
  h += '<div class="card stack"><h3>' + (pe ? 'Modifier la preuve' : 'Ajouter une preuve') + '</h3>';
  h += '<input type="text" id="pSujet" placeholder="Sujet (ex. luxe durable)" maxlength="120" value="' + esc(pe ? pe.sujet : '') + '"><textarea id="pFait" placeholder="Fait, chiffre ou citation" style="min-height:80px" maxlength="1200">' + esc(pe ? pe.fait : '') + '</textarea><input type="text" id="pUrl" placeholder="Source (lien ou référence)" maxlength="400" value="' + esc(pe ? pe.url : '') + '"><input type="text" id="pTags" placeholder="Mots-clés, séparés par des virgules" maxlength="120" value="' + esc(pe ? pe.tags || '' : '') + '"><label class="small muted">Vérifié le<input type="date" id="pDate" value="' + esc(pe ? pe.date : today()) + '"></label>';
  h += '<div class="row"><button class="btn small" data-act="proof-add">' + (pe ? 'Enregistrer les changements' : 'Enregistrer') + '</button>' + (pe ? '<button class="btn small ghost" data-act="proof-cancel">Annuler</button>' : '') + '</div></div>';
  h += '<div class="card stack"><h3>Importer des preuves</h3><p class="muted small" style="margin:0">Fichier .txt, .md, .csv ou .json. Une preuve par ligne, au format <code>Sujet | Fait | Source</code>. Les PDF ne sont pas lus : copie le texte utile dans un .txt.</p><label class="btn ghost small" style="cursor:pointer;align-self:flex-start">Choisir un fichier<input type="file" id="proofFile" accept=".txt,.md,.csv,.json,text/plain,application/json" hidden></label><div class="small" id="proofMsg">' + esc(pwa.msg && view.tab === 'proofs' ? pwa.msg : '') + '</div></div>';
  h += '<div class="card stack"><h3>Brief de recherche</h3><p class="muted small" style="margin:0">Génère un message à coller dans l’assistant de ton choix (avec recherche web), puis rapporte ici les références vérifiées.</p><input type="text" id="topicIn" placeholder="Ex. : le luxe durable en Europe" value="' + esc(proofTopic) + '" maxlength="120"><div class="row"><button class="btn" data-act="brief">Générer le brief</button><button class="btn ghost" data-act="angles-copy">Copier : pistes d’arguments</button></div><div id="briefOut"></div></div>';
  h += '<div class="card stack"><h3>Pistes d’arguments (notes)</h3><textarea id="anglesNote" placeholder="Colle ou écris ici les angles à creuser…" maxlength="6000">' + esc(S.angles || '') + '</textarea><button class="btn small" data-act="angles-save">Enregistrer les notes</button></div>';
  return h + '</div>';
}
function proofItemHtml(p) {
  var link = /^https?:\/\//i.test(p.url) ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' + esc(p.url) + '</a>' : esc(p.url || 'sans source');
  return '<div class="metric" style="align-items:flex-start"><span style="min-width:0;overflow-wrap:anywhere"><b>' + esc(p.sujet || 'Sans sujet') + '</b><br>' + esc(p.fait) + '<br><span class="small muted">' + link + ' · vérifié le ' + esc(p.date) + '</span>' + (p.tags ? '<br>' + p.tags.split(',').map(function (t) { return t.trim() ? '<span class="pill">' + esc(t.trim()) + '</span>' : ''; }).join(' ') : '') + '</span><span class="col"><button class="chip" data-act="proof-edit" data-v="' + esc(p.id) + '">Modifier</button><button class="chip" data-act="proof-del" data-v="' + esc(p.id) + '" aria-label="Supprimer">Supprimer</button></span></div>';
}
function fillProofList() {
  var box = byIdEl('pList'); if (!box) return;
  var words = norm(pwa.proofFilter).split(/\s+/).filter(Boolean);
  var l = S.proofs.filter(function (p) { var t = norm([p.sujet, p.fait, p.url, p.tags].join(' ')); return words.every(function (w) { return t.indexOf(w) >= 0; }); });
  box.innerHTML = l.length ? l.map(proofItemHtml).join('') : '<p class="muted small" style="margin:0">' + (S.proofs.length ? 'Aucun résultat pour cette recherche.' : 'Aucune preuve pour l’instant. Ajoute un fait, sa source et la date où tu l’as vérifié.') + '</p>';
}
function importProofsText(name, text) {
  var out = [];
  if (/\.json$/i.test(name)) {
    var j = JSON.parse(text);
    if (j && j.app === 'agora' && j.state) j = j.state.proofs; else if (j && j.proofs) j = j.proofs;
    if (!Array.isArray(j)) throw new Error('JSON sans liste de preuves');
    j.forEach(function (p) { if (p && typeof p.fait === 'string') out.push({ sujet: str(p.sujet, 120), fait: str(p.fait, 1200), url: str(p.url || p.source, 400), tags: str(p.tags, 120), date: str(p.date, 10) }); });
  } else {
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim(); if (!line || line.length < 4) return;
      var sep = line.indexOf('|') >= 0 ? '|' : line.indexOf('\t') >= 0 ? '\t' : line.indexOf(';') >= 0 ? ';' : null;
      var p = sep ? line.split(sep).map(function (x) { return x.trim(); }) : [name.replace(/\.\w+$/, ''), line, ''];
      if (p.length === 2) p = [p[0], p[1], ''];
      if (p[1]) out.push({ sujet: str(p[0], 120), fait: str(p[1], 1200), url: str(p[2], 400), tags: str(p[3], 120), date: '' });
    });
  }
  return out.slice(0, 500);
}

/* ---------- RÉGLAGES ---------- */
function themePref() { return lsGet('ao_theme') || 'auto'; }
function applyTheme(p) { var r = document.documentElement; if (p === 'light' || p === 'dark') r.setAttribute('data-theme', p); else r.removeAttribute('data-theme'); try { var m = document.querySelector('meta[name=theme-color]'); } catch (e) {} }
function vSettings() {
  var tp = themePref();
  var h = '<div class="top"><div><div class="eyebrow">Agora · by Stephen</div><h1>Réglages</h1></div><button class="btn small ghost" data-act="back">Fermer</button></div><div class="stack">';
  if (pwa.msg && view.tab === 'settings') h += '<div class="callout" role="status">' + esc(pwa.msg) + '</div>';
  h += '<div class="card stack"><h3>Tes données</h3><p class="muted small" style="margin:0">Tout est gardé sur ton appareil, rien n’est envoyé sur internet. Dernière sauvegarde : <b>' + (S.lastExport ? esc(fmtDay(S.lastExport)) : 'jamais') + '</b>.</p>';
  h += '<div class="row"><button class="btn small" data-act="export-data">Sauvegarder mes données</button><button class="btn small ghost" data-act="export-recs">Sauvegarder les enregistrements</button></div>';
  h += '<p class="muted small" style="margin:0">La sauvegarde des données est légère (sans audio). Les enregistrements ont leur propre fichier, plus lourd.</p><hr class="hr">';
  h += '<label class="btn ghost small" style="cursor:pointer;align-self:flex-start">Ajouter depuis un fichier<input type="file" id="impFile" accept=".json,application/json" hidden></label>';
  h += '<p class="muted small" style="margin:0">Fusionne un fichier de sauvegarde (ou l’ancien export de l’artifact) avec ce que tu as déjà, sans doublons. Rien n’est supprimé.</p>';
  if (pwa.imp) {
    var p = pwa.imp.p, s = p.state;
    h += '<div class="callout info"><b>' + esc(pwa.imp.name) + '</b><br>' + (s ? s.sessions.length + ' séance(s), ' + s.proofs.length + ' preuve(s), ' + Object.keys(s.done).length + ' leçon(s) terminée(s), ' + s.xp + ' pts' : 'aucune donnée de progression') + (p.recs.length ? '<br>' + p.recs.length + ' enregistrement(s)' : '') + '<div class="row" style="margin-top:8px"><button class="btn small" data-act="imp-merge">Fusionner</button><button class="btn small ghost" data-act="imp-cancel">Annuler</button></div></div>';
  }
  h += '<button class="btn small ghost" style="align-self:flex-start" data-act="imp-rollback">Revenir à la copie de sécurité d’avant import</button>';
  h += '<hr class="hr"><div class="small" id="stoInfo">Calcul de l’espace utilisé…</div><div class="row"><button class="btn small ghost" data-act="persist-ask">Protéger le stockage</button></div><p class="muted small" style="margin:0">Sur iPhone, installe l’appli sur l’écran d’accueil : Safari peut effacer les données d’un site rarement ouvert, pas celles d’une appli installée.</p></div>';
  h += '<div class="card stack"><h3>Corbeille (24 h)</h3><p class="muted small" style="margin:0">Ce que tu supprimes (enregistrement, preuve, séance, progression d’une leçon) reste ici 24 h avant d’être effacé pour de bon.</p><div id="trashList" class="stack"></div></div>';
  h += '<div class="card stack"><h3>Apparence</h3><div class="row">' + [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(function (x) { return '<button class="chip' + (tp === x[0] ? ' on' : '') + '" data-act="theme-set" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
  h += '<div class="card stack"><h3>Voix et transcription</h3><p class="muted small" style="margin:0">L’analyse de ta voix (hauteur, volume, pauses, rythme) est faite <b>sur ton téléphone</b> : l’audio ne quitte pas l’appareil. Pour analyser tes mots, tu écris ou colles la transcription.</p><label class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:10px"><input type="checkbox" data-act="sr-toggle"' + (S.set && S.set.sr ? ' checked' : '') + (SR_API ? '' : ' disabled') + ' style="margin-top:4px"><span class="small"><b>Transcription automatique (en ligne)</b><br><span class="muted">Optionnelle. Elle utilise le service de reconnaissance vocale de ton navigateur, qui envoie le son à des serveurs distants. ' + (SR_API ? 'Désactivée par défaut.' : 'Non disponible sur ce navigateur.') + '</span></span></label></div>';
  h += '<div class="card stack" id="whyEdit"><h3>Page « Pourquoi Agora ? »</h3><textarea id="whyText" style="min-height:160px" maxlength="6000">' + esc(S.why || WHY_DEFAULT.join('\n\n').replace(/\*\*/g, '')) + '</textarea><p class="muted small" style="margin:0">Sépare les paragraphes par une ligne vide. <b>**gras**</b> est accepté.</p><div class="row"><button class="btn small" data-act="why-save">Enregistrer</button><button class="btn small ghost" data-act="why-reset">Rétablir le texte d’origine</button></div></div>';
  h += '<div class="card stack"><h3>Application</h3>';
  h += m('Version', 'v' + VERSION + ' · ' + esc(BUILD)) + m('Hors ligne', pwa.offlineReady ? 'prêt' : (('serviceWorker' in navigator) ? 'préparation…' : 'non disponible'), pwa.offlineReady ? 'tag-ok' : '') + m('Installée', isStandalone() ? 'oui' : 'non');
  h += '<div class="row">' + (pwa.updateReady ? '<button class="btn small" data-act="update-now">Mettre à jour maintenant</button>' : '<button class="btn small ghost" data-act="update-check">Rechercher une mise à jour</button>') + (pwa.installEvt && !isStandalone() ? '<button class="btn small" data-act="install">Installer</button>' : '') + '</div>';
  h += '<p class="muted small" style="margin:0">Mes données ne sont jamais touchées par une mise à jour.</p></div>';
  h += '<div class="card stack"><h3>À propos</h3><p class="small" style="margin:0">Agora, l’art oratoire · <i>by Stephen</i>. Usage personnel : pas de compte, pas de paiement, aucune clé, aucun suivi. Polices : Dancing Script, DM Sans et Fraunces (licence OFL), hébergées dans l’appli.</p></div>';
  return h + '</div>';
}
function fillSettings() {
  var s = byIdEl('stoInfo');
  if (s) {
    var txt = function (u, q, rs, rc) { s.innerHTML = 'Espace utilisé : <b>' + fmtBytes(u) + '</b>' + (q ? ' sur ' + fmtBytes(q) + ' disponibles' : '') + ' · enregistrements : <b>' + rc + '</b> (' + fmtBytes(rs) + ') · protection : <b>' + (pwa.persisted === true || lsGet('ao_persist') === '1' ? 'oui' : pwa.persisted === false ? 'non accordée' : 'inconnue') + '</b>'; };
    idbAll('rec').then(function (l) { l = l.filter(function (r) { return !r.del; }); var rs = l.reduce(function (a, r) { return a + (r.size || 0); }, 0); if (navigator.storage && navigator.storage.estimate) return navigator.storage.estimate().then(function (e) { txt(e.usage, e.quota, rs, l.length); }); txt(rs, 0, rs, l.length); }).catch(function () { s.textContent = 'Espace utilisé : indisponible sur ce navigateur.'; });
  }
  var t = byIdEl('trashList');
  if (t) Promise.all([idbAll('trash'), idbAll('rec')]).then(function (r) {
    var items = r[0].map(function (x) { return { id: x.id, at: x.at, label: ({ proof: 'Preuve', session: 'Séance', lesson: 'Leçon' }[x.kind] || 'Élément') + ' · ' + x.label, act: 'trash-restore' }; })
      .concat(r[1].filter(function (x) { return x.del; }).map(function (x) { return { id: x.id, at: x.del, label: 'Enregistrement · ' + x.name, act: 'trash-restore-rec' }; }));
    items.sort(function (a, b) { return b.at - a.at; });
    t.innerHTML = items.length ? items.map(function (x) { var left = Math.max(0, Math.ceil((x.at + DAY - Date.now()) / 3600000)); return '<div class="metric"><span style="min-width:0;overflow-wrap:anywhere">' + esc(x.label) + '<br><span class="small muted">encore ' + left + ' h</span></span><button class="chip" data-act="' + x.act + '" data-v="' + esc(x.id) + '">Restaurer</button></div>'; }).join('') : '<p class="muted small" style="margin:0">La corbeille est vide.</p>';
  }).catch(function () { t.innerHTML = '<p class="muted small" style="margin:0">Corbeille indisponible.</p>'; });
}

/* ---------- après chaque affichage ---------- */
function pwaAfterRender() {
  try {
    if (view.tab === 'studio') { if (!view.sub) refreshLib(); else { var ra = byIdEl('resAudio'); if (ra) playInto(ra.querySelector('.rplay'), ra.getAttribute('data-aid')); } }
    if (view.tab === 'proofs') {
      fillProofList();
      var ps = byIdEl('pSearch'); if (ps) ps.oninput = function () { pwa.proofFilter = ps.value; fillProofList(); };
      var pf = byIdEl('proofFile'); if (pf) pf.onchange = function () {
        var f = pf.files && pf.files[0]; if (!f) return; var fr = new FileReader();
        fr.onload = function () {
          try {
            var list = importProofsText(f.name, String(fr.result)), pk = {}; S.proofs.forEach(function (p) { pk[norm(p.sujet + p.fait + p.url)] = 1; });
            var n = 0; list.forEach(function (p) { var k = norm(p.sujet + p.fait + p.url); if (!pk[k]) { pk[k] = 1; S.proofs.push({ id: uid() + n, sujet: p.sujet, fait: p.fait, url: p.url, tags: p.tags, date: p.date || today() }); n++; } });
            persist(); pwa.msg = n + ' preuve(s) importée(s)' + (list.length - n ? ', ' + (list.length - n) + ' déjà présente(s)' : '') + '.'; render();
          } catch (e) { var pm = byIdEl('proofMsg'); if (pm) pm.textContent = 'Import refusé : ' + (e && e.message || 'fichier invalide'); }
        };
        fr.readAsText(f);
      };
    }
    if (view.tab === 'settings') {
      fillSettings();
      var imf = byIdEl('impFile'); if (imf) imf.onchange = function () { onImportFile(imf.files && imf.files[0]); };
    }
  } catch (e) { errLog.push('afterRender: ' + (e && e.message)); }
}

/* ---------- actions ---------- */
function pwaAct(act, v, el, ev) {
  switch (act) {
    case 'settings': pwa.msg = ''; go('settings'); return true;
    case 'theme-set': lsSet('ao_theme', v); applyTheme(v); render(); return true;
    case 'sr-toggle': S.set = S.set || {}; S.set.sr = !!el.checked; persist(); return true;
    case 'install': if (pwa.installEvt) { pwa.installEvt.prompt(); pwa.installEvt.userChoice.then(function () { pwa.installEvt = null; render(); }); } return true;
    case 'inst-hide': lsSet('ao_inst_dismiss', '1'); render(); return true;
    case 'bk-later': lsSet('ao_bk_dismiss', today()); render(); return true;
    case 'update-check': swCheck(); return true;
    case 'update-now': swApply(); return true;
    case 'export-data': exportState(); if (view.tab === 'home' || view.tab === 'settings') setTimeout(render, 50); return true;
    case 'export-recs': exportRecs(); return true;
    case 'imp-merge': doMerge(); return true;
    case 'imp-cancel': pwa.imp = null; render(); return true;
    case 'imp-rollback': rollbackImport(); return true;
    case 'persist-ask': persistAsk(false); return true;
    case 'why-edit': pwa.msg = ''; go('settings'); setTimeout(function () { var w = byIdEl('whyEdit'); if (w) { w.scrollIntoView(); var t = byIdEl('whyText'); if (t) t.focus(); } }, 30); return true;
    case 'why-save': var wt = byIdEl('whyText'); S.why = wt && wt.value.trim() ? wt.value.trim().slice(0, 6000) : null; persist(); pwa.msg = 'Texte enregistré.'; render(); return true;
    case 'why-reset': S.why = null; persist(); pwa.msg = 'Texte d’origine rétabli.'; render(); return true;
    case 'rec-play': playInto(el.closest('.ritem').querySelector('.rplay'), v); return true;
    case 'rec-ren':
      var nm = el.closest('.ritem').querySelector('.rname'); var cur = nm.querySelector('b').textContent;
      nm.textContent = ''; var inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 60; inp.value = cur; inp.className = 'rn';
      var ok = document.createElement('button'); ok.className = 'chip'; ok.textContent = 'OK'; ok.setAttribute('data-act', 'rec-ren-ok'); ok.setAttribute('data-v', v);
      nm.appendChild(inp); nm.appendChild(ok); inp.focus(); return true;
    case 'rec-ren-ok':
      var ni = el.closest('.rname').querySelector('input').value.trim().slice(0, 60);
      idbGet('rec', v).then(function (r) { if (!r || !ni) return; r.name = ni; return idbPut('rec', r); }).then(refreshLib); return true;
    case 'rec-dl': idbGet('rec', v).then(function (r) { if (r) saveFile(safeName(r.name) + '.' + extFor(r.mime), r.blob); }); return true;
    case 'rec-del': idbGet('rec', v).then(function (r) { if (!r) return; r.del = Date.now(); return idbPut('rec', r); }).then(function () { toast('Placé dans la corbeille (24 h)'); refreshLib(); }); return true;
    case 'rec-keep': if (st.blob) pwaSaveRec(st.blob, st.audioLen); return true;
    case 'trash-restore': trashRestore(v); return true;
    case 'trash-restore-rec': trashRestoreRec(v); return true;
    case 'proof-add':
      var su = byIdEl('pSujet').value.trim(), fa = byIdEl('pFait').value.trim(), ur = byIdEl('pUrl').value.trim(), tg = byIdEl('pTags').value.trim(), dt = byIdEl('pDate').value || today();
      if (!fa) { toast('Écris le fait ou le chiffre à garder.'); return true; }
      if (pwa.proofEdit) { var pe = byId(S.proofs, pwa.proofEdit); if (pe) { pe.sujet = su; pe.fait = fa; pe.url = ur; pe.tags = tg; pe.date = dt; } pwa.proofEdit = null; }
      else S.proofs.unshift({ id: uid(), sujet: su, fait: fa, url: ur, tags: tg, date: dt });
      persist(); toast('Preuve enregistrée'); render(); return true;
    case 'proof-edit': pwa.proofEdit = v; render(); window.scrollTo(0, document.body.scrollHeight); return true;
    case 'proof-cancel': pwa.proofEdit = null; render(); return true;
    case 'proof-del':
      var pd = byId(S.proofs, v); if (pd) { trashPut('proof', pd.sujet || pd.fait.slice(0, 40), pd); S.proofs = S.proofs.filter(function (x) { return x.id !== v; }); persist(); toast('Placée dans la corbeille (24 h)'); render(); } return true;
    case 'sess-del':
      var sd = byId(S.sessions, v); if (sd) { trashPut('session', sd.date + ' · ' + sd.sujet, sd); S.sessions = S.sessions.filter(function (x) { return x.id !== v; }); persist(); toast('Séance placée dans la corbeille (24 h)'); view = { tab: 'home', sub: null }; render(); } return true;
    case 'lesson-reset': trashPut('lesson', v, { id: v, done: !!S.done[v], quiz: S.quiz[v] != null ? S.quiz[v] : null }); delete S.done[v]; delete S.quiz[v]; quizState = null; persist(); toast('Progression de la leçon mise de côté (24 h)'); render(); return true;
    case 'coach-copy': var cs = byId(S.sessions, v); if (cs) copyText(coachPrompt(cs), el); return true;
    case 'coach-save': var cs2 = byId(S.sessions, v); if (cs2) { cs2.note = byIdEl('coachNote').value.slice(0, 4000); persist(); toast('Note enregistrée'); } return true;
    case 'angles-copy':
      var ti = byIdEl('topicIn'); proofTopic = ti ? ti.value.trim() : ''; if (!proofTopic) { toast('Écris d’abord un sujet.'); return true; }
      copyText('Sujet de discours : « ' + proofTopic + ' ». Propose 4 angles d’argumentation en français. Pour chacun : l’angle, et le type de preuve à aller chercher avec l’endroit où la trouver. N’invente aucun chiffre ni aucune source.', el); return true;
    case 'angles-save': S.angles = byIdEl('anglesNote').value.slice(0, 6000); persist(); toast('Notes enregistrées'); return true;
    case 'daily-go': var dv = v.split('|'), dt2 = byId(D.exerciseTypes, dv[0]); if (dt2) { st.type = dt2.id; st.sujet = dt2.sujets[+dv[1] % dt2.sujets.length]; go('studio'); } return true;
  }
  return false;
}

/* ---------- service worker, installation, accès ---------- */
function swInit() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(function (reg) {
    pwa.swReg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) pwa.updateReady = true;
    reg.addEventListener('updatefound', function () {
      var w = reg.installing; if (!w) return;
      w.addEventListener('statechange', function () {
        if (w.state === 'installed' && navigator.serviceWorker.controller) { pwa.updateReady = true; toast('Mise à jour prête : Réglages', true); if (view.tab === 'home' || view.tab === 'settings') render(); }
      });
    });
  }).catch(function () {});
  navigator.serviceWorker.ready.then(function () { pwa.offlineReady = true; if (view.tab === 'settings') render(); });
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (pwa.wantReload) { pwa.wantReload = false; location.reload(); } });
}
function swCheck() {
  if (!pwa.swReg) { pwa.msg = 'Mises à jour non disponibles sur ce navigateur.'; render(); return; }
  pwa.swReg.update().then(function () {
    setTimeout(function () { pwa.msg = pwa.updateReady || pwa.swReg.waiting ? 'Une nouvelle version est prête.' : 'Tu as déjà la dernière version.'; if (pwa.swReg.waiting) pwa.updateReady = true; render(); }, 1200);
  }).catch(function () { pwa.msg = 'Vérification impossible (hors ligne ?).'; render(); });
}
function swApply() {
  var w = pwa.swReg && pwa.swReg.waiting; if (!w) { location.reload(); return; }
  pwa.wantReload = true; w.postMessage({ type: 'SKIP_WAITING' });
}
function showLock(msg) {
  var d = document.createElement('div'); d.className = 'lock'; d.setAttribute('role', 'alertdialog');
  var b = document.createElement('div'); b.className = 'lockbox';
  var h = document.createElement('h2'); h.textContent = 'Accès suspendu'; var p = document.createElement('p'); p.textContent = msg || 'Cette appli est momentanément désactivée.';
  var q = document.createElement('p'); q.className = 'small'; q.textContent = 'Tes données restent sur ton téléphone et ne sont pas supprimées.';
  b.appendChild(h); b.appendChild(p); b.appendChild(q); d.appendChild(b); document.body.appendChild(d);
}
function pwaBoot() {
  applyTheme(themePref());
  if (!S.since) { S.since = Date.now(); persist(); }
  try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(function (p) { pwa.persisted = p; }); } catch (e) {}
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pwa.installEvt = e; if (view.tab === 'home' || view.tab === 'settings') render(); });
  window.addEventListener('appinstalled', function () { pwa.installEvt = null; render(); });
  trashPurge(); setInterval(trashPurge, 3600000);
  swInit();
  var cv = byIdEl('cover');
  if (cv) {
    var seen = false; try { seen = sessionStorage.getItem('ao_cover') === '1'; } catch (e) {}
    var closeCover = function () { try { sessionStorage.setItem('ao_cover', '1'); } catch (e) {} cv.classList.add('out'); setTimeout(function () { if (cv.parentNode) cv.parentNode.removeChild(cv); }, 520); };
    if (seen) cv.parentNode.removeChild(cv);
    else { var go1 = byIdEl('coverGo'); if (go1) { go1.onclick = closeCover; } }
  }
  try {
    if (navigator.onLine !== false) fetch('acces.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.actif === false) showLock(j.message); }).catch(function () {});
  } catch (e) {}
}


/* ---------- navigation ---------- */
var TABS = [
  ['home', 'Accueil', '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'],
  ['studio', 'Studio', '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>'],
  ['course', 'Cours', '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6M20 4v14h-6"/>'],
  ['orators', 'Orateurs', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'],
  ['prep', 'Préparer', '<path d="M12 3v18M5 7h14M5 7l-2 7a3 3 0 0 0 6 0zM19 7l-2 7a3 3 0 0 0 6 0z"/>'],
  ['proofs', 'Preuves', '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>']
];
var view = { tab: 'home', sub: null };
function go(tab, sub) { view = { tab: tab, sub: sub || null }; render(); window.scrollTo(0, 0); }
function drawTabs() {
  tabbar.innerHTML = TABS.map(function (t) {
    return '<button data-act="tab" data-v="' + t[0] + '" class="' + (view.tab === t[0] ? 'on' : '') + '" aria-label="' + t[1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + t[2] + '</svg>' + t[1] + '</button>';
  }).join('');
}
function render() {
  drawTabs();
  var f = { home: vHome, studio: vStudio, course: vCourse, orators: vOrators, prep: vPrep, proofs: vProofs, settings: vSettings }[view.tab] || vHome;
  try { root.innerHTML = f(); } catch (e) { errLog.push('render: ' + (e && e.message)); root.innerHTML = '<div class="stack"><div class="card"><h3>Un écran n’a pas pu s’afficher</h3><p class="muted small">Tes données sont intactes.</p><button class="btn" data-act="tab" data-v="home">Retour à l’accueil</button></div></div>'; }
  if (view.tab === 'studio') studioAfterRender();
  pwaAfterRender();
}

/* ---------- conseils ---------- */
function nextLesson() { for (var i = 0; i < D.lessons.length; i++) if (!S.done[D.lessons[i].id]) return D.lessons[i]; return null; }
function recommend() {
  var last = S.sessions[0];
  if (!last) return { t: 'Fais ton premier enregistrement', d: 'Une minute sur une idée de ton choix suffit pour établir ta base.', go: ['studio'] };
  var a = last.sig, t = last.txt;
  if (t && t.fillers && t.fillers.per100 > 3) return { t: 'Réduis les tics', d: 'Dernière séance : ' + t.fillers.total + ' tics (' + t.fillers.per100 + ' pour 100 mots). Refais le même texte en les remplaçant par un silence.', go: ['course', 'c18'] };
  if (a && a.pauses && a.pauses.blank > 0) return { t: 'Travaille tes pauses', d: 'Tu as eu ' + a.pauses.blank + ' blanc(s) de plus de 2 s. Prépare tes transitions.', go: ['course', 'c18'] };
  if (a && a.pitch && a.pitch.sdSemitones < 2) return { t: 'Mets de la musique dans ta voix', d: 'Écart de hauteur : ' + a.pitch.sdSemitones + ' demi-tons (repère de l’appli : 2 à 4).', go: ['course', 'c19'] };
  if (a && a.endings && a.endings.risingShare > 0.4) return { t: 'Stabilise tes fins de phrase', d: 'Beaucoup de fins montantes : tes affirmations sonnent comme des questions.', go: ['course', 'c19'] };
  if (t && !t.planAnnounced) return { t: 'Annonce ton plan', d: 'Ouvre par « trois points : … » pour guider le public.', go: ['course', 'c5'] };
  var nx = nextLesson();
  if (nx) return { t: 'Continue le cours', d: 'Prochaine leçon : ' + nx.titre + '.', go: ['course', nx.id] };
  return { t: 'Passe à un format plus long', d: 'Ta dernière séance est correcte : essaie 2 minutes ou un discours.', go: ['studio'] };
}
function adviceList(sig, txt) {
  var out = [];
  if (txt && txt.ok) {
    if (txt.fillers.per100 > 3) out.push(['Tics', txt.fillers.total + ' tics détectés (' + txt.fillers.top.map(function (x) { return x[0] + ' ×' + x[1]; }).join(', ') + '). Remplace-les par un silence.']);
    if (txt.hedges.per100 > 3) out.push(['Atténuations', txt.hedges.total + ' formules qui adoucissent (« je pense que », « un peu »…). Garde-les pour les nuances utiles.']);
    if (txt.vague.total > 2) out.push(['Mots vagues', 'Remplace « ' + txt.vague.top.map(function (x) { return x[0]; }).join(' », « ') + ' » par un mot précis ou un chiffre.']);
    if (!txt.planAnnounced) out.push(['Plan', 'Aucune annonce de plan repérée. Essaie « trois raisons : … ».']);
    if (txt.evidence.total === 0) out.push(['Preuves', 'Pas de chiffre ni de source repérés. Ajoute un fait vérifiable.']);
    if (txt.closers > 0) out.push(['Conclusion', 'Ta fin s’éteint (« voilà », « c’est tout »…). Termine sur une phrase courte et ferme.']);
    if (txt.wpm && (txt.wpm < 110 || txt.wpm > 160)) out.push(['Débit', txt.wpm + ' mots/min (repère : 110 à 160).']);
  }
  if (sig && sig.ok) {
    if (sig.pauses.blank > 0) out.push(['Blancs', sig.pauses.blank + ' silence(s) de 2 s ou plus. Prépare tes transitions.']);
    if (sig.pitch && sig.pitch.sdSemitones < 2) out.push(['Voix plate', 'Écart de hauteur ' + sig.pitch.sdSemitones + ' demi-tons. Marque les mots clés par la hauteur ou le volume.']);
    if (sig.pitch && sig.pitch.sdSemitones > 4) out.push(['Voix très marquée', 'Écart ' + sig.pitch.sdSemitones + ' demi-tons : veille à garder des passages calmes.']);
    if (sig.endings.risingShare > 0.4) out.push(['Fins montantes', Math.round(sig.endings.risingShare * 100) + ' % de tes fins de phrase montent : tes affirmations sonnent comme des questions.']);
    if (sig.endings.fadingShare > 0.5) out.push(['Fins qui s’éteignent', 'Le volume baisse en fin de phrase. Soutiens jusqu’au dernier mot.']);
  }
  if (!out.length) out.push(['Bien joué', 'Rien d’alarmant selon les repères de l’appli. Passe à un exercice plus long ou plus difficile.']);
  return out.slice(0, 5);
}

/* ---------- ACCUEIL ---------- */
function vHome() {
  var r = recommend(), last = S.sessions[0];
  var doneN = D.lessons.filter(function (l) { return S.done[l.id]; }).length, total = D.lessons.length;
  var h = '<div class="brand"><span class="logo">'+LOGO+'</span><div><b>Agora</b><span>L’art oratoire · <i>by Stephen</i></span></div><button class="gear" data-act="settings" aria-label="Réglages"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button></div><div class="top"><div><h1>Bonjour, Stephen</h1></div><div class="pill">' + streak() + ' j · ' + S.xp + ' pts</div></div>';
  h += '<div class="stack">';
  h += homeBanners();
  h += '<button class="card tap" data-act="reco" data-v="' + esc(JSON.stringify(r.go)) + '"><div class="eyebrow">Prochaine étape</div><h3>' + esc(r.t) + '</h3><p class="muted small" style="margin:6px 0 0">' + esc(r.d) + '</p></button>';
  h += vRank();
  h += '<div class="card"><div class="row" style="justify-content:space-between"><h3>Cours</h3><span class="muted small">' + doneN + ' / ' + total + '</span></div><div class="bar" style="margin-top:8px"><i style="width:' + Math.round(100 * doneN / total) + '%"></i></div></div>';
  if (last) {
    h += '<div class="card"><div class="eyebrow">Dernière séance · ' + esc(last.date) + '</div><h3>' + esc(last.sujet) + '</h3>' + pillarsHtml(last.pil) + '<div class="row" style="margin-top:10px"><button class="btn small ghost" data-act="open-session" data-v="' + esc(last.id) + '">Revoir</button></div></div>';
  }
  h += homeDaily();
  h += goalsHtml();
  h += vBadges();
  h += '<div class="card"><h3>Historique</h3>' + (S.sessions.length ? S.sessions.slice(0, 8).map(function (s) {
    return '<button class="metric" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer" data-act="open-session" data-v="' + esc(s.id) + '"><span>' + esc(s.date) + ' · ' + esc(s.sujet) + '</span><b class="muted small">' + (s.pil && s.pil.logos != null ? s.pil.logos : '–') + '/' + (s.pil && s.pil.ethos != null ? s.pil.ethos : '–') + '/' + (s.pil && s.pil.pathos != null ? s.pil.pathos : '–') + '</b></button>';
  }).join('') + '<p class="muted small" style="margin:8px 0 0">Colonnes : Logos / Ethos / Pathos.</p>' : '<p class="muted">Aucune séance pour l’instant.</p>') + '</div>';
  h += whyHtml();
  h += '</div>';
  return h;
}
function goalsHtml() {
  var h = '<div class="card"><h3>Objectifs</h3>';
  h += S.goals.length ? S.goals.map(function (g) {
    return '<label class="metric" style="align-items:center"><span><input type="checkbox" data-act="goal-toggle" data-v="' + g.id + '"' + (g.done ? ' checked' : '') + '> ' + (g.done ? '<s>' + esc(g.t) + '</s>' : esc(g.t)) + '</span><button class="chip" data-act="goal-del" data-v="' + g.id + '" aria-label="Supprimer">×</button></label>';
  }).join('') : '<p class="muted small">Ex. : « Zéro blanc de plus de 2 s » ou « 5 séances cette semaine ».</p>';
  h += '<div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" id="goalIn" placeholder="Nouvel objectif" maxlength="80"><button class="btn small" data-act="goal-add">Ajouter</button></div></div>';
  return h;
}
function pillarsHtml(p) {
  if (!p) return '';
  function c(l, v, col) { return '<div class="pil"><b style="color:' + col + '">' + (v == null ? '–' : v) + '</b><span class="small muted">' + l + '</span></div>'; }
  return '<div class="pillars" style="margin-top:8px">' + c('Logos', p.logos, 'var(--logos)') + c('Ethos', p.ethos, 'var(--ethos)') + c('Pathos', p.pathos, 'var(--pathos)') + '</div>';
}

/* ---------- STUDIO ---------- */
var st = { type: 'argumenter', dur: 60, sujet: null, rec: null, blob: null, audio: null, transcript: '', status: '', busy: false, result: null, recSec: 0, recMs: 0, recog: null, lastSpan: null, steps: false };
function newSubject() { var t = byId(D.exerciseTypes, st.type); st.sujet = pick(t.sujets); }
function vStudio() {
  if (view.sub && view.sub.result) return vResult(view.sub.result);
  if (!st.sujet) newSubject();
  var t = byId(D.exerciseTypes, st.type);
  var h = '<div class="top"><h1>Studio</h1></div><div class="stack">';
  h += '<div class="card stack"><div class="eyebrow">Exercice</div><div class="hscroll">' + D.exerciseTypes.map(function (x) { return '<button class="chip' + (x.id === st.type ? ' on' : '') + '" data-act="st-type" data-v="' + x.id + '">' + esc(x.nom) + '</button>'; }).join('') + '</div>';
  h += '<div class="row">' + D.durations.map(function (d) { return '<button class="chip' + (d === st.dur ? ' on' : '') + '" data-act="st-dur" data-v="' + d + '">' + durLabel(d) + '</button>'; }).join('') + '</div>';
  h += '<div><div class="eyebrow">Sujet</div><h2>' + esc(st.sujet) + '</h2><div class="row" style="margin-top:6px"><button class="btn small ghost" data-act="st-new">Autre sujet</button></div></div>';
  h += '<div class="callout"><b>' + esc(t.modele) + '</b> — ' + esc(t.aide) + '</div>';
  h += exLevelHtml(st.type);
  if (st.type === 'discours') h += '<div class="small">' + D.speechSteps.map(function (s, i) { return '<div class="metric"><span>' + (i + 1) + '. <b>' + esc(s.nom) + '</b> — ' + esc(s.objectif) + '</span></div>'; }).join('') + '</div>';
  h += '</div>';
  h += '<div class="card stack" id="recCard">' + recHtml() + '</div>';
  h += '<div class="card stack" id="recLib"></div>';
  h += '<div class="card stack"><div class="eyebrow">Transcription (pour analyser les mots)</div><textarea id="trIn" placeholder="' + (SR_API && CAN_MIC && S.set && S.set.sr ? 'Elle se remplit pendant l’enregistrement (transcription en ligne activée). Tu peux la corriger.' : 'Écris ou colle ici le texte de ce que tu as dit. Sans texte, seule la voix est analysée.') + '">' + esc(st.transcript) + '</textarea></div>';
  h += '<button class="btn" id="goAnalyse" data-act="analyse"' + ((st.blob || st.transcript.trim()) ? '' : ' disabled') + '>Analyser</button><div id="stStatus" class="muted small">' + esc(st.status) + '</div>';
  h += '</div>';
  return h;
}
function remainLabel() { var r = st.timerOn ? Math.max(0, st.dur - st.recSec) : (st.ended ? 0 : st.dur); return fmt(Math.ceil(r)); }
function timerHtml() {
  return '<div class="timer' + (st.ended ? ' ended' : '') + '" id="tmr" aria-live="off">' + remainLabel() + '</div><div class="bar"><i id="tmrBar" style="width:' + Math.min(100, Math.round(100 * (st.recSec || 0) / st.dur)) + '%"></i></div><div class="small muted" id="tmrMsg" style="text-align:center">' + (st.ended ? 'Temps écoulé.' : 'Durée choisie : ' + durLabel(st.dur)) + '</div>';
}
function recHtml() {
  var h = timerHtml();
  if (CAN_MIC) {
    h += '<button class="rec' + (st.rec ? ' live' : '') + '" data-act="rec-toggle" aria-label="' + (st.rec ? 'Arrêter' : 'Enregistrer') + '">' + (st.rec ? 'Stop' : 'REC') + '</button>';
    h += '<p class="muted small" style="text-align:center;margin:0">' + esc(D.recordTips.standalone) + ' L’enregistrement s’arrête tout seul quand le temps est écoulé.</p>';
  } else {
    h += '<button class="btn" data-act="chrono-toggle">' + (st.timerOn ? 'Arrêter le chrono' : 'Démarrer le chrono') + '</button>';
    h += '<p class="muted small" style="margin:0">' + esc(D.recordTips.artifact) + ' Lance le chrono ici, puis le Dictaphone : un bip sonne quand le temps est écoulé.</p>';
  }
  h += '<div class="row"><label class="btn ghost small" style="cursor:pointer">Importer un enregistrement<input type="file" id="fileIn" accept="audio/*,video/*,.m4a,.mp3,.wav,.aac,.ogg,.webm,.caf" hidden></label>';
  if (st.blob) h += '<span class="pill">Audio prêt · ' + (st.audioLen ? fmt(st.audioLen) : '') + '</span>';
  h += '</div>';
  return h;
}
var beepCtx = null;
function beep0() { try { var C = window.AudioContext || window.webkitAudioContext; if (C) { beepCtx = beepCtx || new C(); if (beepCtx.resume) beepCtx.resume(); } } catch (e) {} }
function beep() {
  try {
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return; beepCtx = beepCtx || new C(); if (beepCtx.resume) beepCtx.resume();
    [0, 0.25, 0.5].forEach(function (d, i) {
      var o = beepCtx.createOscillator(), g = beepCtx.createGain(); o.frequency.value = i === 2 ? 880 : 660; o.connect(g); g.connect(beepCtx.destination);
      var t = beepCtx.currentTime + d; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.start(t); o.stop(t + 0.22);
    });
  } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate(200); } catch (e) {}
}
function startTimer() {
  clearInterval(tick); st.timerOn = true; st.ended = false; st.recSec = 0; st.recMs = Date.now();
  tick = setInterval(function () {
    st.recSec = (Date.now() - st.recMs) / 1000;
    var e = document.getElementById('tmr'); if (e) e.textContent = fmt(Math.ceil(Math.max(0, st.dur - st.recSec)));
    var b = document.getElementById('tmrBar'); if (b) b.style.width = Math.min(100, Math.round(100 * st.recSec / st.dur)) + '%';
    if (st.recSec >= st.dur) { endTimer(true); }
  }, 200);
}
function endTimer(timeUp) {
  clearInterval(tick); tick = null; st.timerOn = false;
  if (timeUp) { st.ended = true; st.recSec = st.dur; beep(); }
  if (st.rec) stopRec(); else refreshRec();
}
function studioAfterRender() {
  var f = document.getElementById('fileIn'); if (f) f.onchange = function () { if (f.files && f.files[0]) setBlob(f.files[0]); };
  var t = document.getElementById('trIn'); if (t) t.oninput = function () { st.transcript = t.value; var b = document.getElementById('goAnalyse'); if (b) b.disabled = !(st.blob || st.transcript.trim()); };
}
function setStatus(s) { st.status = s; var e = document.getElementById('stStatus'); if (e) e.textContent = s; }
function setBlob(b) {
  st.blob = b; st.audioLen = 0; setStatus('Lecture du fichier…');
  var r = new FileReader();
  r.onload = function () {
    decode(r.result).then(function (buf) { st.pcm = buf; st.audioLen = buf.length / 16000; setStatus('Fichier prêt (' + fmt(st.audioLen) + ').'); refreshRec(); })
      .catch(function () { st.blob = null; st.pcm = null; setStatus('Ce format audio n’est pas lisible ici. Exporte en M4A, MP3 ou WAV.'); refreshRec(); });
  };
  r.onerror = function () { setStatus('Fichier illisible.'); };
  r.readAsArrayBuffer(b);
}
function refreshRec() { var c = document.getElementById('recCard'); if (c) { c.innerHTML = recHtml(); studioAfterRender(); } var b = document.getElementById('goAnalyse'); if (b) b.disabled = !(st.blob || st.transcript.trim()); }
function decode(ab) {
  var Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  var ctx = new Ctx(1, 1, 16000);
  return new Promise(function (res, rej) {
    var p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej);
  }).then(function (buf) {
    var ch = buf.getChannelData(0);
    if (buf.numberOfChannels > 1) { var o = new Float32Array(ch.length), c2 = buf.getChannelData(1); for (var i = 0; i < ch.length; i++) o[i] = (ch[i] + c2[i]) / 2; return o; }
    return new Float32Array(ch);
  });
}
var mr = null, chunks = [], stream = null, tick = null;
function startRec() {
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
    stream = s; chunks = []; st.transcript = ''; st.blob = null; st.pcm = null; st.audioId = null;
    mr = pwaRecorder(s);
    mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = function () { s.getTracks().forEach(function (t) { t.stop(); }); var bb = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); setBlob(bb); pwaSaveRec(bb); };
    mr.start(); st.rec = true; startTimer();
    if (SR_API && S.set && S.set.sr) {
      try {
        var rc = new SR_API(); rc.lang = 'fr-FR'; rc.continuous = true; rc.interimResults = false;
        rc.onresult = function (ev) { var t = ''; for (var i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript + ' '; st.transcript = (st.transcript + ' ' + t).trim(); var ta = document.getElementById('trIn'); if (ta) ta.value = st.transcript; };
        rc.onend = function () { if (st.rec) { try { rc.start(); } catch (e) {} } };
        rc.start(); st.recog = rc;
      } catch (e) { st.recog = null; }
    }
    refreshRec();
  }).catch(function () { setStatus('Micro refusé ou indisponible. Importe un enregistrement à la place.'); });
}
function stopRec() { st.rec = false; clearInterval(tick); tick = null; st.timerOn = false; try { if (st.recog) st.recog.stop(); } catch (e) {} st.recog = null; try { mr.stop(); } catch (e) {} refreshRec(); }

function doAnalyse() {
  if (st.busy) return; st.busy = true;
  var b = document.getElementById('goAnalyse'); if (b) b.disabled = true;
  var txt = st.transcript.trim();
  function finish(sig) {
    var dur = sig && sig.ok ? sig.spanSec || sig.durationSec : (st.recSec || null);
    var t = txt ? A.analyzeText(txt, dur) : null;
    if (t && !t.ok) t = null;
    if (!sig && !t) { setStatus('Il me faut un audio ou un texte.'); st.busy = false; return; }
    if (sig && !sig.ok) {
      setStatus(sig.reason === 'trop_court' ? 'Enregistrement trop court (moins de quelques secondes).' : 'Aucune voix détectée dans le fichier.');
      if (!t) { st.busy = false; if (b) b.disabled = false; return; }
      sig = null;
    }
    var pil = A.pillars(sig, t);
    var rec = { id: uid(), audioId: st.audioId || null, date: today(), sujet: st.sujet, type: st.type, dur: st.dur, sig: sig ? slim(sig) : null, txt: t, transcript: txt, pil: pil };
    var lvBefore = exLevel(st.type).lvl;
    S.sessions.unshift(rec); S.sessions = S.sessions.slice(0, 200);
    var lvAfter = exLevel(st.type);
    touchDay(); addXp(10 + (sig ? 10 : 0) + (t ? 5 : 0) + (st.type === 'connecteurs' && t && t.steps ? t.steps.count * 3 : 0)); autoGoals();
    if (lvAfter.lvl > lvBefore) toast('Niveau ' + lvAfter.lvl + ' : ' + lvAfter.name + ' · ' + byId(D.exerciseTypes, st.type).nom, true);
    persist();
    st.busy = false; st.blob = null; st.pcm = null; st.audioId = null; st.transcript = ''; st.recSec = 0; st.ended = false; st.timerOn = false; st.status = '';
    view = { tab: 'studio', sub: { result: rec.id } }; render(); window.scrollTo(0, 0);
  }
  if (st.pcm) {
    setStatus('Analyse en cours…');
    A.analyzeSignal(st.pcm, { onProgress: function (p) { setStatus('Analyse en cours… ' + Math.round(p * 100) + ' %'); } }).then(finish).catch(function () { setStatus('Analyse impossible sur ce fichier.'); st.busy = false; });
  } else finish(null);
}
function slim(sig) { var s = JSON.parse(JSON.stringify(sig)); s.pauses.list = s.pauses.list.slice(0, 12); return s; }
function autoGoals() { /* les objectifs sont cochés à la main */ }

/* ---------- RÉSULTATS ---------- */
function chart(vals, kind) {
  var n = vals.length; if (n < 2) return '';
  var W = 300, H = 100, min = Infinity, max = -Infinity, i;
  for (i = 0; i < n; i++) if (vals[i] != null) { min = Math.min(min, vals[i]); max = Math.max(max, vals[i]); }
  if (!isFinite(min)) return '';
  if (kind === 'pitch') { min = Math.min(min, -4); max = Math.max(max, 4); } else { min = 0; max = 1; }
  var pts = [], d = '';
  for (i = 0; i < n; i++) {
    if (vals[i] == null || (kind === 'env' && vals[i] === 0)) { pts.push(null); continue; }
    pts.push([i / (n - 1) * W, H - (vals[i] - min) / (max - min || 1) * H]);
  }
  var started = false;
  pts.forEach(function (p) { if (!p) { started = false; return; } d += (started ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); started = true; });
  var zero = kind === 'pitch' ? '<line x1="0" x2="' + W + '" y1="' + (H - (0 - min) / (max - min) * H) + '" y2="' + (H - (0 - min) / (max - min) * H) + '" stroke="var(--line)" stroke-dasharray="3 3"/>' : '';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img">' + zero + '<path d="' + d + '" fill="none" stroke="' + (kind === 'pitch' ? 'var(--accent)' : 'var(--logos)') + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
}
function m(label, val, cls) { return '<div class="metric"><span>' + label + '</span><b class="' + (cls || '') + '">' + val + '</b></div>'; }
function vResult(id) {
  var s = byId(S.sessions, id);
  if (!s) return '<p>Séance introuvable.</p><button class="btn" data-act="back">Retour</button>';
  var a = s.sig, t = s.txt, h = '<div class="top"><div><div class="eyebrow">' + esc(s.date) + ' · ' + esc(durLabel(s.dur)) + '</div><h1>Résultat</h1></div><button class="btn small ghost" data-act="back">Fermer</button></div><div class="stack">';
  h += '<div class="card"><h3>' + esc(s.sujet) + '</h3>' + pillarsHtml(s.pil) + '<p class="muted small" style="margin:10px 0 0">Indices de 0 à 100 calculés par l’appli à partir de ta voix et de ton texte. Ils orientent ton travail ; ils ne mesurent pas l’effet réel sur un public.</p>' + ((s.pil.partial || []).length ? '<p class="small tag-warn">Non calculé faute de données : ' + s.pil.partial.join(', ') + '.</p>' : '') + '</div>';
  h += '<div class="card"><h3>À travailler en premier</h3>' + adviceList(a, t).map(function (x) { return '<div class="metric"><span><b>' + esc(x[0]) + '</b><br><span class="muted small">' + esc(x[1]) + '</span></span></div>'; }).join('') + '</div>';
  if (a) {
    h += '<div class="card"><h3>Voix</h3>';
    h += m('Durée (parole)', fmt(a.spanSec) + ' · ' + a.speechSec + ' s de voix');
    if (a.pitch) h += m('Hauteur médiane', a.pitch.medianHz + ' Hz') + m('Variation de hauteur', a.pitch.sdSemitones + ' demi-tons', a.pitch.sdSemitones < 2 ? 'tag-warn' : 'tag-ok') + m('Étendue (p10–p90)', a.pitch.rangeSemitones + ' demi-tons');
    h += m('Variation de volume', a.volume.sdDb + ' dB');
    h += m('Débit syllabique', a.rhythm.syllPerSec + ' syll/s');
    h += m('Pauses', a.pauses.count + ' (courtes ' + a.pauses.short + ' · longues ' + a.pauses.long + ' · blancs ' + a.pauses.blank + ')', a.pauses.blank ? 'tag-warn' : '') + m('Plus longue pause', a.pauses.longest + ' s');
    h += m('Fins montantes', Math.round(a.endings.risingShare * 100) + ' %') + m('Fins qui s’éteignent', Math.round(a.endings.fadingShare * 100) + ' %');
    h += '<p class="muted small" style="margin:8px 0 0">Repères de l’appli (pas des normes scientifiques) : variation de hauteur &lt; 2 plat, 2–4 vivant, &gt; 4 très marqué.</p></div>';
    h += '<div class="card"><h3>Courbe de hauteur</h3><p class="muted small">Écart à ta hauteur médiane, en demi-tons, sur toute la durée.</p>' + chart(a.series.pitch, 'pitch') + '<h3 style="margin-top:12px">Énergie de la voix</h3>' + chart(a.series.env, 'env') + '</div>';
  }
  if (t) {
    h += '<div class="card"><h3>Mots</h3>';
    h += m('Mots', t.words + (t.wpm ? ' · ' + t.wpm + ' mots/min' : ''), t.wpm && (t.wpm < 110 || t.wpm > 160) ? 'tag-warn' : '');
    h += m('Tics', t.fillers.total + (t.fillers.top.length ? ' (' + t.fillers.top.map(function (x) { return x[0] + ' ×' + x[1]; }).join(', ') + ')' : ''), t.fillers.per100 > 3 ? 'tag-bad' : '');
    h += m('Atténuations', t.hedges.total) + m('Mots vagues', t.vague.total) + m('Connecteurs logiques', t.connectors.total) + m('Preuves (chiffres, sources)', t.evidence.total) + m('Marqueurs de récit', t.story.total);
    h += m('Annonce du plan', t.planAnnounced ? 'oui' : 'non', t.planAnnounced ? 'tag-ok' : 'tag-warn') + m('Questions posées', t.questions) + m('Je / vous-nous', t.address.je + ' / ' + t.address.vous);
    if (t.repeats && t.repeats.length) h += m('Mots répétés', esc(t.repeats.join(', ')));
    h += '</div>';
    if (s.type === 'connecteurs') h += stepsHtml(t);
    h += '<div class="card"><h3>Ta transcription</h3><p class="small"><mark class="tic">tic</mark> <mark class="att">atténuation</mark> <mark class="vag">mot vague</mark></p><p style="line-height:1.8">' + A.markTics(s.transcript).map(function (p) { return p.k ? '<mark class="' + p.k + '">' + esc(p.t) + '</mark>' : esc(p.t); }).join('') + '</p></div>';
  }
  h += coachBox(s);
  h += '<div class="row"><button class="btn" data-act="again">Refaire</button><button class="btn ghost" data-act="back">Terminer</button><button class="btn ghost small" data-act="sess-del" data-v="' + s.id + '">Supprimer la séance</button></div></div>';
  return h;
}
function aiHtml(ai) {
  return '<div class="callout"><p><b>Point fort.</b> ' + esc(ai.fort) + '</p><p><b>À corriger d’abord.</b> ' + esc(ai.priorite) + '</p><p style="margin:0"><b>Exercice.</b> ' + esc(ai.exercice) + '</p></div>';
}
/* ---------- COURS ---------- */
var quizState = null;
function vCourse() {
  if (view.sub === 'erist') return vErist();
  if (view.sub === 'erist-quiz') return vEristQuiz();
  if (view.sub) return vLesson(view.sub);
  var h = '<div class="top"><h1>Cours</h1><span class="pill">' + D.lessons.filter(function (l) { return S.done[l.id]; }).length + ' / ' + D.lessons.length + '</span></div>';
  h += '<div class="callout info" style="margin-bottom:14px">Les chapitres 1 à 15 reprennent ton Tome I. Les chapitres 16 à 48, les leçons « Argumenter » et les bonus suivent le plan de ton livre ; ils sont rédigés par l’appli à partir des sources citées et seront à remplacer par tes Tomes II et III.</div><div class="stack">';
  var lastTome = '';
  D.modules.forEach(function (mo) {
    var ls = D.lessons.filter(function (l) { return l.m === mo.id; }); if (!ls.length) return;
    if (mo.tome !== lastTome) { h += '<div class="eyebrow" style="margin-top:8px">' + esc(mo.tome) + '</div>'; lastTome = mo.tome; }
    var dn = ls.filter(function (l) { return S.done[l.id]; }).length;
    h += '<div class="card"><div class="row" style="justify-content:space-between"><h3>' + esc(mo.titre) + '</h3><span class="muted small">' + dn + ' / ' + ls.length + '</span></div><p class="muted small" style="margin:2px 0 6px">' + esc(mo.sous) + '</p>';
    ls.forEach(function (l) {
      h += '<button class="metric" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer" data-act="lesson" data-v="' + l.id + '"><span>' + (S.done[l.id] ? '✓ ' : '') + '<span class="muted">' + esc(l.n) + '.</span> ' + esc(l.titre) + '</span><span class="muted small">' + l.min + ' min</span></button>';
    });
    if (mo.id === 'er') h += '<div class="row" style="margin-top:10px"><button class="btn small ghost" data-act="erist-open">Les 38 fiches</button><button class="btn small ghost" data-act="erist-quiz">Quiz global</button></div>';
    h += '</div>';
  });
  return h + '</div>';
}
function box(cls, label, body) { return '<div class="box ' + cls + '"><b>' + label + '</b><div>' + body + '</div></div>'; }
function vLesson(id) {
  var l = byId(D.lessons, id); if (!l) return '';
  var idx = D.lessons.indexOf(l), prev = D.lessons[idx - 1], next = D.lessons[idx + 1];
  var h = '<div class="top"><button class="btn small ghost" data-act="course-back">← Cours</button><span class="pill">' + l.min + ' min</span></div><div class="stack">';
  h += '<div><div class="eyebrow">' + (l.src === 'schop' ? 'Éristique ' : l.m === 'cx' ? 'Atelier ' : 'Chapitre ') + esc(l.n) + (l.src === 'livre' ? ' · ton Tome I' : l.src === 'schop' ? ' · d’après Schopenhauer, reformulé par l’appli' : ' · rédigé par l’appli') + '</div><h1>' + esc(l.titre) + '</h1></div>';
  if (l.accroche) h += '<p class="lead">' + esc(l.accroche) + '</p>';
  h += '<div class="card prose">' + l.sections.map(function (sec) { return '<h3>' + esc(sec.h) + '</h3>' + sec.p.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }).join('') + '</div>';
  if (l.retenir) h += box('b-ret', 'À retenir', '<ul>' + l.retenir.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
  if (l.erreur) h += box('b-err', 'Erreur fréquente', esc(l.erreur));
  if (l.methode) h += box('b-met', 'Méthode rapide', esc(l.methode));
  if (l.exercice) h += box('b-exo', 'Exercice', esc(l.exercice) + '<div style="margin-top:8px"><button class="btn small" data-act="go-studio">Aller au Studio</button></div>');
  h += '<div class="card" id="quizBox">' + quizHtml(l) + '</div>';
  if (l.sources && l.sources.length) h += '<div class="small muted">Sources : ' + l.sources.map(function (s) { return s.u ? '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>' : esc(s.t); }).join(' · ') + '</div>';
  if (S.done[l.id] || S.quiz[l.id] != null) h += '<div class="row"><button class="btn small ghost" data-act="lesson-reset" data-v="' + l.id + '">Refaire cette leçon (progression gardée 24 h dans la corbeille)</button></div>';
  h += '<div class="row" style="justify-content:space-between">' + (prev ? '<button class="btn small ghost" data-act="lesson" data-v="' + prev.id + '">← ' + esc(prev.titre).slice(0, 28) + '</button>' : '<span></span>') + (next ? '<button class="btn small ghost" data-act="lesson" data-v="' + next.id + '">' + esc(next.titre).slice(0, 28) + ' →</button>' : '') + '</div>';
  return h + '</div>';
}
function quizHtml(l) {
  if (!quizState || quizState.id !== l.id) quizState = { id: l.id, i: 0, score: 0, ans: null };
  var q = l.quiz[quizState.i];
  if (!q) {
    return '<h3>Quiz terminé</h3><p>Score : ' + quizState.score + ' / ' + l.quiz.length + '</p><button class="btn small" data-act="quiz-reset">Refaire</button>';
  }
  var h = '<div class="eyebrow">Question ' + (quizState.i + 1) + ' / ' + l.quiz.length + '</div><h3>' + esc(q.q) + '</h3>';
  q.o.forEach(function (o, i) {
    var c = '';
    if (quizState.ans != null) c = i === q.a ? ' good' : (i === quizState.ans ? ' badc' : '');
    h += '<button class="opt' + c + '" data-act="quiz-ans" data-v="' + i + '"' + (quizState.ans != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
  });
  if (quizState.ans != null) h += '<p class="small" style="margin-top:10px">' + esc(q.e) + '</p><button class="btn small" data-act="quiz-next">Suivant</button>';
  return h;
}
function quizAnswer(i) {
  var l = byId(D.lessons, quizState.id), q = l.quiz[quizState.i];
  if (quizState.ans != null) return; quizState.ans = i; if (i === q.a) quizState.score++;
  document.getElementById('quizBox').innerHTML = quizHtml(l);
}
function quizNext() {
  var l = byId(D.lessons, quizState.id); quizState.i++; quizState.ans = null;
  if (quizState.i >= l.quiz.length) {
    if (!S.done[l.id]) { var md0 = modulesDone().length; S.done[l.id] = today(); touchDay(); addXp(15); if (modulesDone().length > md0) { addXp(30); toast('Module validé !', true); } persist(); }
    S.quiz[l.id] = Math.max(S.quiz[l.id] || 0, quizState.score); persist();
  }
  document.getElementById('quizBox').innerHTML = quizHtml(l);
}

/* ---------- ORATEURS ---------- */
var oFilter = 'Tous', typeQ = null;
function vOrators() {
  if (view.sub === 'type') return vType();
  if (view.sub) return vOrator(view.sub);
  var tags = ['Tous'], i;
  D.orators.forEach(function (o) { o.tags.forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
  var h = '<div class="top"><h1>Orateurs</h1></div><div class="stack">';
  var A2 = S.type ? D.archetypes[S.type] : null;
  h += '<button class="card tap" data-act="type-open"><div class="eyebrow">Ton type d’orateur</div><h3>' + (A2 ? esc(A2.nom) : 'Découvrir mon type') + '</h3><p class="muted small" style="margin:6px 0 0">' + (A2 ? esc(A2.formule) + ' · refaire le test' : '8 questions. Modèle propre à l’appli, pas une typologie scientifique.') + '</p></button>';
  h += '<div class="hscroll">' + tags.map(function (t) { return '<button class="chip' + (oFilter === t ? ' on' : '') + '" data-act="o-filter" data-v="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>';
  D.orators.filter(function (o) { return oFilter === 'Tous' || o.tags.indexOf(oFilter) >= 0; }).forEach(function (o) {
    h += '<button class="card tap" data-act="orator" data-v="' + o.id + '"><div class="eyebrow">' + esc(o.epoque) + ' · ' + esc(o.lieu) + '</div><h3>' + esc(o.nom) + '</h3><p class="muted small" style="margin:4px 0 0">' + esc(o.discours.titre) + ' · ' + esc(D.archetypes[o.archetype].nom) + '</p></button>';
  });
  h += '<div class="small muted">Les « techniques » et l’archétype associé à chaque orateur sont une lecture pédagogique de l’appli.</div></div>';
  return h;
}
function vOrator(id) {
  var o = byId(D.orators, id); if (!o) return '';
  var ar = D.archetypes[o.archetype];
  var h = '<div class="top"><button class="btn small ghost" data-act="orators-back">← Orateurs</button></div><div class="stack">';
  h += '<div><div class="eyebrow">' + esc(o.epoque) + ' · ' + esc(o.lieu) + '</div><h1>' + esc(o.nom) + '</h1></div>';
  h += '<div class="card"><div class="eyebrow">' + esc(o.genre) + '</div><h3>' + esc(o.discours.titre) + '</h3><p class="muted small">' + esc(o.discours.date) + ' · ' + esc(o.discours.cadre) + '</p><p>' + esc(o.contexte) + '</p><p class="muted small" style="margin:0">' + esc(o.parcours) + '</p></div>';
  if (o.oeuvres) h += '<div class="card"><h3>Ses livres</h3>' + o.oeuvres.map(function (w) { return '<p style="margin:0 0 8px"><b>' + esc(w.titre) + '</b> <span class="muted small">(' + esc(w.date) + ')</span>' + (w.note ? '<br><span class="small">' + esc(w.note) + '</span>' : '') + '</p>'; }).join('') + '</div>';
  if (o.id === 'schopenhauer') h += '<button class="btn" data-act="lesson" data-v="e0">Suivre le cours sur ses 38 stratagèmes</button>';
  h += '<div class="card"><h3>Ce qu’on peut en apprendre</h3>' + o.techniques.map(function (t) { return '<p><b>' + esc(t.nom) + '.</b> ' + esc(t.texte) + '</p>'; }).join('') + '<p class="muted small" style="margin:0">Archétype rapproché : ' + esc(ar.nom) + '</p></div>';
  h += '<div class="card"><div class="eyebrow">Essaie</div><h3>' + esc(o.essai.label) + '</h3><p>' + esc(o.essai.consigne) + '</p><button class="btn small" data-act="o-try" data-v="' + o.id + '">Aller au Studio</button></div>';
  h += '<div class="small muted">Sources : ' + o.sources.map(function (s) { return '<a href="' + esc(s.u) + '" target="_blank" rel="noopener">' + esc(s.t) + '</a>'; }).join(' · ') + '</div></div>';
  return h;
}
function vType() {
  if (!typeQ) typeQ = { i: 0, sc: { L: 0, E: 0, P: 0 }, done: false };
  var Q = D.typeQuiz;
  if (typeQ.done) {
    var ar = D.archetypes[S.type];
    var sim = D.orators.filter(function (o) { return o.archetype === S.type; });
    return '<div class="top"><button class="btn small ghost" data-act="orators-back">← Orateurs</button></div><div class="stack"><div class="eyebrow">Ton type</div><h1>' + esc(ar.nom) + '</h1><p class="muted">' + esc(ar.formule) + '</p><div class="card"><p>' + esc(ar.texte) + '</p><p><b>Force.</b> ' + esc(ar.force) + '</p><p><b>Risque.</b> ' + esc(ar.risque) + '</p><p style="margin:0"><b>À travailler.</b> ' + esc(ar.travail) + '</p></div>' + (sim.length ? '<div class="card"><h3>Orateurs proches</h3>' + sim.map(function (o) { return '<button class="metric" style="width:100%;background:none;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer" data-act="orator" data-v="' + o.id + '"><span>' + esc(o.nom) + '</span><span class="muted small">' + esc(o.discours.titre) + '</span></button>'; }).join('') + '</div>' : '') + '<p class="muted small">Résultat issu d’un modèle propre à l’appli (trois axes : logos, ethos, pathos), pas d’un test validé scientifiquement.</p><button class="btn ghost" data-act="type-open">Refaire le test</button></div>';
  }
  var q = Q[typeQ.i];
  return '<div class="top"><button class="btn small ghost" data-act="orators-back">← Orateurs</button><span class="pill">' + (typeQ.i + 1) + ' / ' + Q.length + '</span></div><div class="stack"><h2>' + esc(q.q) + '</h2>' + q.o.map(function (o, i) { return '<button class="opt" data-act="type-ans" data-v="' + i + '">' + esc(o.t) + '</button>'; }).join('') + '</div>';
}

/* ---------- PREUVES ---------- */
var proofTopic = '';
function briefText(t) {
  return 'Je prépare un discours sur : « ' + t + ' ».\nFais une recherche web et donne-moi :\n1. 5 faits ou chiffres récents, chacun avec date, source exacte et lien.\n2. Les arguments les plus solides POUR et CONTRE, avec la meilleure preuve de chaque côté.\n3. 2 exemples concrets ou études de cas vérifiables.\n4. 1 citation ou 1 orateur qui a traité ce sujet (avec la source).\n5. Ce qui est contesté ou incertain.\nIndique clairement ce que tu n’as pas pu vérifier. Format : liste courte, utilisable à l’oral.';
}

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
    : 'Dans cette version, l’appli te donne une <b>trame</b> (structure et angles à remplir), sans texte généré. Aucun chiffre n’est inventé : tu saisis les tiens avec leur source.') + '</div>';
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
  h += (prepUI.err ? '<div class="callout small" style="border-color:var(--warn)">' + esc(prepUI.err) + '</div>' : '') + '<div class="callout' + (it.ai ? ' info' : '') + ' small">' + (it.ai ? 'Rédigé par une IA (ancien export). <b>Aucun chiffre n’a été vérifié</b> : saisis les tiens avec leur source dans chaque argument.' : 'Trame sans IA : à toi de remplir.') + ' Preuves vérifiées par toi : <b>' + proofCount(it) + '</b>.</div>';
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
  h += '<details class="card"><summary><b>Dossier chiffré à faire vérifier (message à copier)</b></summary><p class="small muted">Copie ce message et colle-le dans l’assistant de ton choix (avec recherche web) pour obtenir des chiffres avec leurs sources, puis saisis ici ceux que tu as vérifiés.</p><pre class="brief" id="briefPre">' + esc(dossierPrompt(it)) + '</pre><button class="btn small ghost" style="margin-top:8px" data-act="copy">Copier</button></details>';
  h += '<button class="btn" data-act="prep-studio" data-v="' + it.id + '">S’entraîner à le dire au Studio</button></div>';
  return h;
}
function vSpeech(it) {
  var d = it.data, h = '<div class="top"><button class="btn small ghost" data-act="prep-close">← Préparer</button><button class="chip" data-act="prep-del" data-v="' + it.id + '">Supprimer</button></div><div class="stack">';
  h += '<div><div class="eyebrow">Discours · ' + durLabel(it.dur) + (d.mots ? ' · environ ' + esc(d.mots) + ' mots' : '') + '</div><h1>' + esc(d.titre || it.topic) + '</h1></div>';
  h += (prepUI.err ? '<div class="callout small" style="border-color:var(--warn)">' + esc(prepUI.err) + '</div>' : '') + '<div class="callout' + (it.ai ? ' info' : '') + ' small">' + (it.ai ? 'Rédigé par une IA (ancien export). Les « [CHIFFRE À VÉRIFIER] » sont des emplacements : remplace-les par un chiffre que tu as vérifié, ou supprime la phrase.' : 'Trame sans IA : écris chaque partie avec tes mots.') + '</div>';
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

/* ---------- Éristique de Schopenhauer ---------- */
var eFam = 'tous';
var eq = { i: 0, sc: 0, ans: null, done: false };
var NAT = { loyal: ['Technique loyale', 'tag-ok'], limite: ['Zone grise', 'tag-warn'], deloyal: ['Déloyal', 'tag-bad'] };
function strat(n) { var L = D.erist.strats; for (var i = 0; i < L.length; i++) if (L[i].n === n) return L[i]; return null; }
function stratCard(s) {
  var nat = NAT[s.nat];
  return '<details class="card"><summary style="cursor:pointer"><span class="muted small">N° ' + s.n + ' · ' + esc(D.erist.familles[s.f]) + '</span><br><b>' + esc(s.t) + '</b> <span class="small ' + nat[1] + '">· ' + nat[0] + '</span></summary>' +
    '<div class="prose" style="margin-top:10px">' +
    '<p><b>Le principe.</b> ' + esc(s.p) + '</p>' +
    '<p><b>Exemple</b> <span class="muted small">(' + (s.exS ? 'de Schopenhauer' : 'de l’appli') + ')</span><br>' + esc(s.ex) + '</p>' +
    '<p><b>Comment le reconnaître.</b> ' + esc(s.r) + '</p>' +
    '<p><b>Comment y répondre</b> <span class="muted small">(' + (s.cS ? 'selon Schopenhauer' : 'conseil de l’appli') + ')</span><br>' + esc(s.c) + '</p>' +
    (s.faux ? '<p class="muted small" style="margin:0">Nom moderne rapproché : ' + esc(s.faux) + '</p>' : '') +
    '</div></details>';
}
function vErist() {
  var E = D.erist, h = '<div class="top"><button class="btn small ghost" data-act="course-back">← Cours</button><span class="pill">' + (S.erist && S.erist.best ? 'Meilleur quiz : ' + S.erist.best + ' / ' + E.quiz.length : '38 stratagèmes') + '</span></div><div class="stack">';
  h += '<div><div class="eyebrow">Arthur Schopenhauer</div><h1>L’art d’avoir toujours raison</h1></div>';
  h += '<div class="callout info small">' + esc(E.note) + '</div>';
  h += '<details class="card"><summary style="cursor:pointer"><b>Les idées de base du texte</b></summary><div class="prose" style="margin-top:10px">' + E.idees.map(function (x) { return '<h3>' + esc(x.t) + '</h3><p>' + esc(x.x) + '</p>'; }).join('') + '</div></details>';
  h += '<div class="box b-ret"><b>Comment s’en servir</b>Chaque fiche te donne le principe (comment la ruse fonctionne), de quoi la reconnaître chez l’autre, et la parade. Avant d’en utiliser une toi-même, pose-toi une question : si l’auditoire la repère, qu’est-ce que ça te coûte ? Les ruses « déloyales » abîment ta crédibilité (l’éthos) dès qu’elles sont vues ; les techniques « loyales » (le contre-exemple, la retorsion) se défendent devant n’importe quel public.</div>';
  h += '<button class="btn" data-act="erist-quiz">S’entraîner : reconnais la ruse (' + E.quiz.length + ' questions)</button>';
  var fams = ['tous'].concat(Object.keys(E.familles));
  h += '<div class="hscroll">' + fams.map(function (k) { return '<button class="chip' + (eFam === k ? ' on' : '') + '" data-act="erist-fam" data-v="' + k + '">' + esc(k === 'tous' ? 'Les 38' : E.familles[k]) + '</button>'; }).join('') + '</div>';
  E.strats.filter(function (s) { return eFam === 'tous' || s.f === eFam; }).forEach(function (s) { h += stratCard(s); });
  h += '<div class="small muted">Classement loyal / zone grise / déloyal : lecture de l’appli, à discuter. Les ruses sont décrites pour être reconnues et contrées ; Schopenhauer écrit lui-même qu’il faut savoir s’en défendre.</div></div>';
  return h;
}
function vEristQuiz() {
  var E = D.erist, Q = E.quiz;
  var h = '<div class="top"><button class="btn small ghost" data-act="erist-open">← Les 38 fiches</button><span class="pill">' + Math.min(eq.i + 1, Q.length) + ' / ' + Q.length + '</span></div><div class="stack">';
  if (eq.done) {
    var best = S.erist && S.erist.best || 0;
    h += '<div class="eyebrow">Résultat</div><h1>' + eq.sc + ' / ' + Q.length + '</h1><p class="muted">' + (eq.sc >= 10 ? 'Tu repères les ruses très bien.' : eq.sc >= 7 ? 'Bon réflexe. Revois les fiches que tu as ratées.' : 'Relis les fiches, puis réessaie : reconnaître une ruse demande de la pratique.') + ' Meilleur score : ' + best + ' / ' + Q.length + '.</p><button class="btn" data-act="erist-quiz">Recommencer</button>';
    return h + '</div>';
  }
  var q = Q[eq.i];
  h += '<h2 style="font-size:1.1rem">« ' + esc(q.q) + ' »</h2><p class="muted small">Quelle ruse est utilisée ?</p>';
  var oo = q.o.slice(), rot = (eq.i * 3 + 1) % oo.length; oo = oo.slice(rot).concat(oo.slice(0, rot));
  oo.forEach(function (n) {
    var s = strat(n), cls = '';
    if (eq.ans != null) cls = n === q.n ? ' good' : (n === eq.ans ? ' badc' : '');
    h += '<button class="opt' + cls + '" data-act="erist-ans" data-v="' + n + '"' + (eq.ans != null ? ' disabled' : '') + '>' + esc(s.t) + '</button>';
  });
  if (eq.ans != null) {
    var s2 = strat(q.n);
    h += '<div class="box ' + (eq.ans === q.n ? 'b-ret' : 'b-err') + '" style="margin-top:12px"><b>' + (eq.ans === q.n ? 'Exact' : 'Pas tout à fait') + ' · n° ' + s2.n + ' ' + esc(s2.t) + '</b>' + esc(q.e) + '</div><button class="btn" data-act="erist-next">' + (eq.i + 1 >= Q.length ? 'Voir le résultat' : 'Suivant') + '</button>';
  }
  return h + '</div>';
}
function eristAct(act, v) {
  switch (act) {
    case 'erist-open': eFam = 'tous'; go('course', 'erist'); return true;
    case 'erist-fam': eFam = v; render(); return true;
    case 'erist-quiz': eq = { i: 0, sc: 0, ans: null, done: false }; go('course', 'erist-quiz'); return true;
    case 'erist-ans':
      if (eq.ans != null) return true;
      eq.ans = +v; if (eq.ans === D.erist.quiz[eq.i].n) eq.sc++;
      render(); return true;
    case 'erist-next':
      eq.i++; eq.ans = null;
      if (eq.i >= D.erist.quiz.length) {
        eq.done = true; S.erist = S.erist || { best: 0 };
        if (eq.sc > S.erist.best) S.erist.best = eq.sc;
        addXp(5 + eq.sc); touchDay(); persist();
      }
      render(); window.scrollTo(0, 0); return true;
  }
  return false;
}


/* ---------- événements ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]'); if (!el) return;
  var act = el.getAttribute('data-act'), v = el.getAttribute('data-v');
  if (pwaAct(act, v, el, ev) || prepAct(act, v, el) || eristAct(act, v)) return;
  switch (act) {
    case 'tab': go(v); break;
    case 'reco': var g = JSON.parse(v); go(g[0], g[1]); break;
    case 'goal-add': var gi = document.getElementById('goalIn'); if (gi && gi.value.trim()) { S.goals.push({ id: uid(), t: gi.value.trim(), done: false }); persist(); render(); } break;
    case 'goal-toggle': S.goals.forEach(function (x) { if (x.id === v) { x.done = !x.done; if (x.done) addXp(20); } }); persist(); render(); break;
    case 'goal-del': S.goals = S.goals.filter(function (x) { return x.id !== v; }); persist(); render(); break;
    case 'open-session': view = { tab: 'studio', sub: { result: v } }; render(); window.scrollTo(0, 0); break;
    case 'st-type': st.type = v; newSubject(); render(); break;
    case 'st-dur': if (st.rec || st.timerOn) break; st.dur = +v; st.ended = false; st.recSec = 0; render(); break;
    case 'st-new': newSubject(); render(); break;
    case 'rec-toggle': st.rec ? endTimer(false) : startRec(); break;
    case 'chrono-toggle': if (st.timerOn) endTimer(false); else { beep0(); startTimer(); refreshRec(); } break;
    case 'analyse': doAnalyse(); break;
    case 'back': view = { tab: view.tab === 'studio' || view.tab === 'settings' ? 'home' : view.tab, sub: null }; render(); break;
    case 'again': view = { tab: 'studio', sub: null }; render(); break;
    case 'lesson': quizState = null; go('course', v); break;
    case 'course-back': go('course'); break;
    case 'go-studio': go('studio'); break;
    case 'quiz-ans': quizAnswer(+v); break;
    case 'quiz-next': quizNext(); break;
    case 'quiz-reset': quizState = null; document.getElementById('quizBox').innerHTML = quizHtml(byId(D.lessons, view.sub)); break;
    case 'o-filter': oFilter = v; render(); break;
    case 'orator': go('orators', v); break;
    case 'orators-back': go('orators'); break;
    case 'type-open': typeQ = null; go('orators', 'type'); break;
    case 'type-ans': var qq = D.typeQuiz[typeQ.i], ch = qq.o[+v]; for (var k in ch.s) typeQ.sc[k] += ch.s[k]; typeQ.i++; if (typeQ.i >= D.typeQuiz.length) { typeQ.done = true; S.type = D.archetypeFor(typeQ.sc); addXp(10); persist(); } render(); break;
    case 'o-try': var o = byId(D.orators, v); st.type = o.essai.type; st.dur = o.essai.duree; st.sujet = o.essai.label + ' — ' + o.essai.consigne; go('studio'); break;
    case 'brief': var ti = document.getElementById('topicIn'); proofTopic = ti.value.trim(); if (!proofTopic) break; var bt = briefText(proofTopic); document.getElementById('briefOut').innerHTML = '<pre class="brief" id="briefPre">' + esc(bt) + '</pre><button class="btn small ghost" style="margin-top:8px" data-act="copy">Copier</button>'; break;
    case 'copy': var pre = document.getElementById('briefPre'); try { navigator.clipboard.writeText(pre.textContent).then(function () { el.textContent = 'Copié'; }, function () { selectNode(pre); }); } catch (e) { selectNode(pre); } break;
  }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'goalIn') { var b = document.querySelector('[data-act="goal-add"]'); if (b) b.click(); } });
function selectNode(n) { var r = document.createRange(); r.selectNodeContents(n); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }

/* ---------- démarrage ---------- */
loadLocal(); pwaBoot(); render();
})();
