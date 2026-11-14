/**
 * SOL 14: RED HORIZON — Prosedürel Ses Motoru (K5)
 * Web Audio API ile sentezlenir; harici/telifli ses dosyası yoktur.
 * bus 'audio:play' → kısa efektler; ambiyans (rüzgâr) ve habitat uğultusu sahneye göre değişir.
 */
(function (S) {
  'use strict';
  let ctx = null;
  let master = null;
  let muted = false;
  let unlocked = false;
  let wind = null;
  let hum = null;
  let lastStep = 0;

  function ac() {
    // Tarayıcı autoplay politikası: ilk kullanıcı etkileşiminden önce AudioContext açma (konsol uyarısı üretir)
    if (muted || !unlocked) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone({ type = 'square', f0, f1 = null, t = 0, dur = 0.1, vol = 0.06, delay = 0 }) {
    const c = ac();
    if (!c) return;
    const now = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + dur + 0.02);
  }

  function noiseBuffer(c, seconds) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function noise({ dur = 0.12, vol = 0.08, freq = 900, q = 0.8, type = 'lowpass', delay = 0 }) {
    const c = ac();
    if (!c) return;
    const now = c.currentTime + delay;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, dur + 0.05);
    const filt = c.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = freq;
    filt.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    src.connect(filt).connect(g).connect(master);
    src.start(now);
    src.stop(now + dur + 0.05);
  }

  const SFX = {
    click: () => tone({ f0: 620, f1: 900, dur: 0.05, vol: 0.04 }),
    hover: () => tone({ f0: 480, dur: 0.03, vol: 0.02, type: 'triangle' }),
    open: () => {
      tone({ f0: 330, f1: 660, dur: 0.09, vol: 0.04, type: 'triangle' });
      tone({ f0: 660, dur: 0.06, vol: 0.03, type: 'triangle', delay: 0.07 });
    },
    close: () => tone({ f0: 520, f1: 260, dur: 0.08, vol: 0.035, type: 'triangle' }),
    step: () => noise({ dur: 0.07, vol: 0.05, freq: 380 }),
    jump: () => {
      noise({ dur: 0.12, vol: 0.05, freq: 500 });
      tone({ f0: 180, f1: 360, dur: 0.25, vol: 0.03, type: 'sine' });
    },
    land: () => noise({ dur: 0.18, vol: 0.08, freq: 260 }),
    alarm: () => {
      for (let i = 0; i < 3; i++) {
        tone({ type: 'sawtooth', f0: 760, dur: 0.12, vol: 0.05, delay: i * 0.24 });
        tone({ type: 'sawtooth', f0: 520, dur: 0.1, vol: 0.05, delay: i * 0.24 + 0.12 });
      }
    },
    bonus: () => [523, 659, 784, 1046].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.05, delay: i * 0.07 })),
    success: () => [440, 554, 659, 880].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.1, vol: 0.05, delay: i * 0.06 })),
    fail: () => {
      tone({ type: 'square', f0: 300, f1: 120, dur: 0.3, vol: 0.05 });
    },
    wire: () => {
      tone({ type: 'square', f0: 1200, dur: 0.03, vol: 0.03 });
      noise({ dur: 0.08, vol: 0.05, freq: 3000, type: 'highpass' });
    },
    tick: (p) => tone({ type: 'sine', f0: (p && p.freq) || 700, dur: 0.04, vol: 0.025 }),
    scan: () => [587, 784, 988].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.08, vol: 0.04, delay: i * 0.05 })),
    downlink: () => [880, 1320, 880, 1760].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.07, vol: 0.035, delay: i * 0.08 })),
    door: () => {
      noise({ dur: 0.5, vol: 0.06, freq: 700, type: 'bandpass', q: 0.6 });
      tone({ type: 'sine', f0: 90, f1: 60, dur: 0.5, vol: 0.05 });
    },
    freeze: () => [1800, 1500, 1200, 1600].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.15, vol: 0.025, delay: i * 0.05 })),
    quake: () => {
      noise({ dur: 1.4, vol: 0.2, freq: 120 });
      tone({ type: 'sine', f0: 50, f1: 32, dur: 1.4, vol: 0.12 });
    },
    leak: () => noise({ dur: 0.6, vol: 0.05, freq: 5000, type: 'highpass' }),
    glitch: () => {
      for (let i = 0; i < 6; i++) tone({ type: 'square', f0: 200 + Math.random() * 1800, dur: 0.03, vol: 0.03, delay: i * 0.04 });
    },
    launch: () => {
      noise({ dur: 2.5, vol: 0.18, freq: 300 });
      tone({ type: 'sawtooth', f0: 60, f1: 140, dur: 2.5, vol: 0.05 });
    },
    meteor: () => {
      noise({ dur: 0.3, vol: 0.14, freq: 2000, type: 'highpass' });
      tone({ type: 'square', f0: 240, f1: 80, dur: 0.3, vol: 0.05 });
    },
    sol: () => [392, 523, 659].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.5, vol: 0.04, delay: i * 0.18 })),
    ufo_ping: () => [740, 1110, 740, 1480].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.12, vol: 0.05, delay: i * 0.14 })),
    static: () => noise({ dur: 0.8, vol: 0.06, freq: 2500, type: 'bandpass', q: 0.3 })
  };

  function play(name, payload) {
    try {
      if (name === 'step') {
        const now = performance.now();
        if (now - lastStep < 220) return;
        lastStep = now;
      }
      const fn = SFX[name];
      if (fn) fn(payload);
    } catch (e) {
      /* ses hatası oyunu durdurmaz */
    }
  }

  /** Sürekli ambiyans: rüzgâr (yüzey) / uğultu (habitat). intensity 0..1 */
  function setAmbience(mode, intensity = 0.3) {
    const c = ac();
    if (!c) return;
    if (!wind) {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 3);
      src.loop = true;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 420;
      filt.Q.value = 0.5;
      const g = c.createGain();
      g.gain.value = 0;
      src.connect(filt).connect(g).connect(master);
      src.start();
      wind = { g, filt };
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = 58;
      const hg = c.createGain();
      hg.gain.value = 0;
      o.connect(hg).connect(master);
      o.start();
      hum = { g: hg };
    }
    const t = c.currentTime;
    const windVol = mode === 'surface' ? 0.03 + intensity * 0.12 : 0;
    const humVol = mode === 'habitat' ? 0.025 : 0;
    wind.g.gain.setTargetAtTime(windVol, t, 0.6);
    wind.filt.frequency.setTargetAtTime(300 + intensity * 700, t, 0.6);
    hum.g.gain.setTargetAtTime(humVol, t, 0.6);
  }

  S.Audio = {
    init() {
      S.bus.on('audio:play', (p) => (typeof p === 'string' ? play(p) : play(p.name, p)));
      const unlock = () => {
        unlocked = true;
        ac();
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    },
    play,
    setAmbience,
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.55;
      return muted;
    },
    isMuted: () => muted
  };
})((window.SOL14 = window.SOL14 || {}));
