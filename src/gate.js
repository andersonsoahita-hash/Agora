/* Écran d'accès : pluie de chiffres « business » + validation avant l'accueil. Purement visuel (aucune donnée, aucun réseau). */
var gate = (function () {
  var TOK = ['+18 %', 'Ar 2 500', '€ 4,2 k', '×3', 'ROI', 'KPI', 'B2B', '120 mots/min', '90 s', '5:00', '30 s', '+12,4 %', '1 M Ar', '100 %', '0 → 1', 'CA', 'NPS 72', '+7 pts',
    '01', '10', '0', '1', '3', '7', '9', '42', '2026', '€', '%', '↗', 'Σ', 'Δ', '◉', '✦', '◆', '▲', '⬢',
    'AGORA', 'VOLA', 'KOTRANA', 'AKANJO', 'VISIONHUB', 'STEPHEN GROUP', 'MADAGASCAR', 'PITCH', 'KABARY'];
  var raf = 0, cv, ctx, W = 0, H = 0, cols = [], last = 0, fs = 15, running = false;
  function rnd(n) { return Math.floor(Math.random() * n); }
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#070b14'; ctx.fillRect(0, 0, W, H);
    var n = Math.max(6, Math.floor(W / (fs * 1.9))); cols = [];
    for (var i = 0; i < n; i++) cols.push({ x: (i + .5) * (W / n), y: -rnd(H), v: 1.2 + Math.random() * 2.2, t: TOK[rnd(TOK.length)], gold: Math.random() < .35 });
  }
  function frame(ts) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (ts - last < 55) return; last = ts;
    ctx.fillStyle = 'rgba(7,11,20,.16)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '600 ' + fs + 'px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'; ctx.textAlign = 'center';
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i]; c.y += c.v * fs * .6;
      ctx.fillStyle = c.gold ? 'rgba(232,196,110,.95)' : 'rgba(214,92,64,.9)';
      ctx.fillText(c.t, c.x, c.y);
      if (c.y > H + fs && Math.random() > .96) { c.y = -fs; c.t = TOK[rnd(TOK.length)]; c.v = 1.2 + Math.random() * 2.2; c.gold = Math.random() < .35; }
      else if (c.y > H + fs * 6) { c.y = -fs; c.t = TOK[rnd(TOK.length)]; }
      else if (Math.random() < .08) c.t = TOK[rnd(TOK.length)];
    }
  }
  function start(canvas) {
    cv = canvas; ctx = cv.getContext('2d'); if (!ctx) return;
    size();
    var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) { for (var k = 0; k < 40; k++) { for (var i = 0; i < cols.length; i++) { cols[i].y = rnd(H); } frame0(); } return; }
    running = true; raf = requestAnimationFrame(frame);
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', vis);
  }
  function frame0() {
    ctx.fillStyle = 'rgba(7,11,20,.5)'; ctx.fillRect(0, 0, W, H);
    ctx.font = '600 ' + fs + 'px ui-monospace,Menlo,monospace'; ctx.textAlign = 'center';
    for (var i = 0; i < cols.length; i++) { var c = cols[i]; ctx.fillStyle = c.gold ? 'rgba(232,196,110,.8)' : 'rgba(214,92,64,.75)'; ctx.fillText(TOK[rnd(TOK.length)], c.x, c.y); }
  }
  function vis() { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (cv && cv.isConnected) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); }
  return { start: start, stop: stop };
})();
