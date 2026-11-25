// Sizzle & Serve — every sound is synthesized with WebAudio: no audio files,
// no network. A shared noise buffer makes the sizzle and the chop; short
// oscillators make the dings, blips and fanfare.
let ctx = null;
let muted = false;
let sizzleNodes = null;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

function noiseBuffer(seconds = 1) {
  const c = ensureCtx();
  if (!c) return null;
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
  const c = ensureCtx();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playPickup() {
  tone(620, 0.09, 'triangle', 0.1);
  tone(930, 0.08, 'triangle', 0.07, 0.05);
}

export function playPlace() {
  tone(280, 0.08, 'triangle', 0.1);
}

export function playChop() {
  const c = ensureCtx();
  if (!c || muted) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.08);
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  gain.gain.setValueAtTime(0.22, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.07);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
}

export function playDing() {
  tone(1180, 0.35, 'sine', 0.12);
  tone(1760, 0.3, 'sine', 0.06, 0.02);
}

export function playServe() {
  tone(880, 0.12, 'triangle', 0.12);
  tone(1174, 0.12, 'triangle', 0.12, 0.09);
  tone(1568, 0.22, 'triangle', 0.12, 0.18);
}

export function playError() {
  tone(160, 0.16, 'square', 0.06);
  tone(120, 0.2, 'square', 0.06, 0.1);
}

export function playBurnt() {
  tone(220, 0.3, 'sawtooth', 0.05);
  tone(180, 0.35, 'sawtooth', 0.05, 0.12);
}

export function playFanfare() {
  const notes = [523, 659, 784, 1046, 784, 1046];
  notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.12, i * 0.11));
}

export function startSizzle() {
  const c = ensureCtx();
  if (!c || muted || sizzleNodes) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(1.5);
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4200;
  filter.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.value = 0.045;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
  sizzleNodes = { src, gain };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    sizzleNodes.src.stop(ctx.currentTime + 0.2);
  } catch { /* already stopped */ }
  sizzleNodes = null;
}
