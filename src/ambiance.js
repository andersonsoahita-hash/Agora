/* Ambiance sonore générée dans l’appli (Web Audio), une couleur par exercice. Aucun fichier audio. */
var AGAMB = (function () {
  var MOODS = {
    mot:        { name: 'Lumineux',   root: 261.6, sc: [0, 2, 4, 7, 9], chord: [0, 7, 16], bpm: 66, wave: 'triangle', cut: 2200, vol: 1 },
    qr:         { name: 'Curieux',    root: 293.7, sc: [0, 2, 3, 5, 7, 9, 10], chord: [0, 7, 15], bpm: 76, wave: 'triangle', cut: 1900, vol: 1 },
    argumenter: { name: 'Posé',       root: 220.0, sc: [0, 3, 5, 7, 10], chord: [0, 7, 15], bpm: 60, wave: 'sine', cut: 1400, vol: 1 },
    connecteurs:{ name: 'Fluide',     root: 174.6, sc: [0, 2, 4, 6, 7, 9, 11], chord: [0, 7, 16], bpm: 72, wave: 'sine', cut: 2000, vol: 1 },
    recit:      { name: 'Chaleureux', root: 146.8, sc: [0, 3, 5, 7, 8, 10], chord: [0, 7, 15], bpm: 54, wave: 'triangle', cut: 1500, vol: 1 },
    debat:      { name: 'Tendu',      root: 164.8, sc: [0, 1, 3, 5, 7, 8], chord: [0, 7, 12], bpm: 84, wave: 'sawtooth', cut: 900, vol: .7 },
    discours:   { name: 'Solennel',   root: 146.8, sc: [0, 2, 4, 7, 9], chord: [0, 7, 12, 16], bpm: 48, wave: 'sine', cut: 1600, vol: 1 },
    lecture:    { name: 'Solennel',   root: 146.8, sc: [0, 2, 4, 7, 9], chord: [0, 7, 12, 16], bpm: 48, wave: 'sine', cut: 1600, vol: 1 },
    s_hom: { name: 'Hommage · doux et grave', root: 130.8, sc: [0, 3, 5, 7, 10], chord: [0, 7, 15], bpm: 44, wave: 'sine', cut: 1100, vol: 1 },
    s_mot: { name: 'Motiver · lumineux et rythmé', root: 196.0, sc: [0, 2, 4, 7, 9], chord: [0, 7, 16], bpm: 88, wave: 'triangle', cut: 2600, vol: 1 },
    s_con: { name: 'Convaincre · posé, en tension', root: 164.8, sc: [0, 3, 5, 7, 10], chord: [0, 7, 12], bpm: 66, wave: 'triangle', cut: 1300, vol: .9 },
    s_exp: { name: 'Expliquer · clair et calme', root: 220.0, sc: [0, 2, 4, 7, 9], chord: [0, 7, 16], bpm: 58, wave: 'sine', cut: 1800, vol: .9 },
    s_rem: { name: 'Remercier · chaleureux', root: 174.6, sc: [0, 2, 4, 5, 7, 9, 11], chord: [0, 7, 16], bpm: 56, wave: 'triangle', cut: 1700, vol: 1 },
    s_pro: { name: 'Se présenter · léger et dynamique', root: 233.1, sc: [0, 2, 4, 7, 9], chord: [0, 7, 12], bpm: 80, wave: 'triangle', cut: 2400, vol: .9 },
    s_tra: { name: 'Trac · rassurant et posé', root: 196.0, sc: [0, 2, 4, 7, 9], chord: [0, 7, 12], bpm: 52, wave: 'sine', cut: 1700, vol: 1 },
    s_voi: { name: 'Souffle · ouvert et ample', root: 155.6, sc: [0, 2, 4, 7, 9], chord: [0, 7, 16], bpm: 50, wave: 'sine', cut: 1900, vol: 1 },
    s_com: { name: 'Débat · ferme et posé', root: 207.7, sc: [0, 2, 4, 7, 9], chord: [0, 7, 16], bpm: 64, wave: 'triangle', cut: 2000, vol: .9 },
    s_spe: { name: 'Moments de vie · tendre', root: 185.0, sc: [0, 2, 3, 7, 9], chord: [0, 7, 15], bpm: 70, wave: 'triangle', cut: 1800, vol: .9 },
    express:    { name: 'Concentré',  root: 196.0, sc: [0, 3, 5, 7, 10], chord: [0, 7], bpm: 72, wave: 'sine', cut: 1200, vol: .9 }
  };
  var ctx = null, master = null, nodes = [], timer = 0, cur = null, step = 0;
  function hz(root, semi) { return root * Math.pow(2, semi / 12); }
  function impulse(c) {
    var n = c.sampleRate * 2.4, b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  function note(m, when, semi, dur, gain) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = m.wave === 'sawtooth' ? 'triangle' : m.wave; o.frequency.value = hz(m.root * 2, semi);
    g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(gain, when + .04); g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(master); o.start(when); o.stop(when + dur + .1);
  }
  function start(type, seed) {
    stop(true);
    var m0 = MOODS[type] || MOODS.argumenter, m = {}; for (var k in m0) m[k] = m0[k];
    if (seed) { var h = 0; for (var q = 0; q < seed.length; q++) h = (h * 31 + seed.charCodeAt(q)) >>> 0; m.root = m0.root * Math.pow(2, (h % 5 - 2) / 12); m.bpm = Math.round(m0.bpm * (0.94 + (h % 7) * 0.02)); }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    if (ctx.state === 'suspended') ctx.resume();
    master = ctx.createGain(); master.gain.value = 0;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = m.cut;
    var rv = ctx.createConvolver(); rv.buffer = impulse(ctx);
    var wet = ctx.createGain(); wet.gain.value = .55; var dry = ctx.createGain(); dry.gain.value = .7;
    var out = ctx.createGain(); out.gain.value = .22 * m.vol;
    master.connect(lp); lp.connect(dry); lp.connect(rv); rv.connect(wet); dry.connect(out); wet.connect(out); out.connect(ctx.destination);
    master.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5);
    m.chord.forEach(function (semi, i) {
      [-4, 4].forEach(function (det) {
        var o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
        o.type = m.wave; o.frequency.value = hz(m.root, semi); o.detune.value = det;
        g.gain.value = .07; l.frequency.value = .06 + i * .03; lg.gain.value = .035; l.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(master); o.start(); l.start(); nodes.push(o, l);
      });
    });
    var beat = 60 / m.bpm; step = 0;
    var next = ctx.currentTime + 1.2;
    timer = setInterval(function () {
      if (!ctx) return;
      while (next < ctx.currentTime + .6) {
        if (step % 2 === 0 || Math.random() < .35) note(m, next, m.sc[Math.floor(Math.random() * m.sc.length)] + (Math.random() < .25 ? 12 : 0), beat * 2.6, .045);
        step++; next += beat;
      }
    }, 250);
    cur = type; return true;
  }
  function stop(now) {
    clearInterval(timer); timer = 0; cur = null;
    var c = ctx, mg = master; ctx = null; master = null; nodes = [];
    if (!c) return;
    try { if (!now) { mg.gain.cancelScheduledValues(c.currentTime); mg.gain.setValueAtTime(mg.gain.value, c.currentTime); mg.gain.linearRampToValueAtTime(0, c.currentTime + .6); setTimeout(function () { try { c.close(); } catch (e) {} }, 800); } else c.close(); } catch (e) { try { c.close(); } catch (e2) {} }
  }
  return { start: start, stop: stop, on: function () { return !!ctx; }, discKey: function (d) { return 's_' + d.s; }, name: function (t) { return (MOODS[t] || MOODS.argumenter).name; } };
})();
