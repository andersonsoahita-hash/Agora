// Génère un signal « voix » de synthèse dont on connaît les valeurs exactes.
const SR = 16000;

function synth(spec, { seed = 1, noise = 0.002, lead = 0.5, trail = 1.0 } = {}) {
  let rnd = seed;
  const rand = () => { rnd = (rnd * 1664525 + 1013904223) % 4294967296; return rnd / 4294967296 - 0.5; };
  const parts = [];
  const silence = (sec) => parts.push(new Float32Array(Math.round(sec * SR)));
  silence(lead);
  spec.forEach((s, idx) => {
    const syl = s.syl || 0.2, gap = s.gap ?? 0.05;
    const total = s.n * syl + (s.n - 1) * gap;
    const buf = new Float32Array(Math.round(total * SR));
    let phase = 0;
    for (let i = 0; i < buf.length; i++) {
      const t = i / SR;
      const prog = t / total;
      const f0 = (s.f0a + (s.f0b - s.f0a) * prog) * (1 + 0.012 * Math.sin(2 * Math.PI * 5 * t));
      phase += 2 * Math.PI * f0 / SR;
      const within = t % (syl + gap);
      let amp = 0;
      if (within < syl) amp = Math.pow(Math.sin(Math.PI * within / syl), 1.2) * (s.vol ?? 0.4);
      let v = 0;
      for (let h = 1; h <= 8; h++) v += Math.sin(h * phase) / h;
      buf[i] = v * amp * 0.5;
    }
    parts.push(buf);
    if (idx < spec.length - 1) silence(s.pauseAfter);
  });
  silence(trail);
  const N = parts.reduce((a, p) => a + p.length, 0);
  const out = new Float32Array(N);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  for (let i = 0; i < N; i++) out[i] += rand() * noise;
  return out;
}

function toWav(samples, sr = SR) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.max(-1, Math.min(1, samples[i])) * 32767, 44 + i * 2);
  return buf;
}

module.exports = { synth, toWav, SR };
