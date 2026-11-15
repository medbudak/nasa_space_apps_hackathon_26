/**
 * SOL 14: RED HORIZON — Ses Motoru (K5)
 * Kısa efektler Web Audio ile sentezlenir. Bazı olaylar ve yüzey ambiyansı K5 Arif'in CC0 kayıtlarını çalar
 * (assets/audio, kaynaklar REFERENCES.md); kayıt açılamazsa sentez sesi çalar.
 * Kayıtlar HTMLAudioElement ile çalınır: fetch gerekmez, file:// altında da çalışır.
 * bus 'audio:play' → kısa efektler; ambiyans (rüzgâr, fırtına) ve mekik uğultusu sahneye göre değişir.
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
  const VOLUME = 0.55;

  /* ---------------- Kayıtlı sesler (CC0) ---------------- */
  const SAMPLE_DIR = 'assets/audio/';
  const SAMPLES = {
    alarm: { file: 'alarm', vol: 0.5, maxSec: 2.5 },
    quake: { file: 'quake_rumble', vol: 0.8 },
    launch: { file: 'rocket_rumble', vol: 0.7, maxSec: 10 },
    static: { file: 'radio_static', vol: 0.25, maxSec: 2 },
    shutter: { file: 'camera_shutter', vol: 0.6 },
    cheer: { file: 'crowd_cheer', vol: 0.7, maxSec: 13, fadeSec: 2.5 } // açılış: kalkış sonrası alkış/tezahürat
  };
  const LOOPS = { wind: { file: 'wind_loop', vol: 0.35 }, storm: { file: 'storm_loop', vol: 0.6 } };
  const failed = new Set(); // açılamayan kayıtlar: bir daha denenmez, sentez sesi çalar
  const loops = {};

  function playSample(name) {
    const spec = SAMPLES[name];
    if (!spec || failed.has(name) || muted || !unlocked) return false;
    const el = new Audio(SAMPLE_DIR + spec.file + '.mp3');
    el.volume = spec.vol * VOLUME;
    el.addEventListener('error', () => failed.add(name));
    el.play().catch(() => failed.add(name));
    if (spec.maxSec && spec.fadeSec) {
      // son fadeSec saniyede sesi yavaşça kıs, sonra durdur
      const start = el.volume;
      setTimeout(() => {
        const t0 = performance.now();
        const id = setInterval(() => {
          const f = 1 - (performance.now() - t0) / (spec.fadeSec * 1000);
          if (f <= 0) {
            clearInterval(id);
            el.pause();
          } else el.volume = start * f;
        }, 50);
      }, (spec.maxSec - spec.fadeSec) * 1000);
    } else if (spec.maxSec) setTimeout(() => el.pause(), spec.maxSec * 1000);
    return true;
  }

  /** Döngü kaydının sesi (0 = dur); dönüş: kayıt kullanılabiliyor mu */
  function setLoop(name, vol) {
    if (failed.has(name) || !unlocked) return false;
    let el = loops[name];
    if (!el) {
      if (vol <= 0) return true;
      el = loops[name] = new Audio(SAMPLE_DIR + LOOPS[name].file + '.mp3');
      el.loop = true;
      el.addEventListener('error', () => failed.add(name));
    }
    const v = muted ? 0 : Math.min(1, vol * LOOPS[name].vol * VOLUME * 2);
    el.volume = v;
    if (v > 0 && el.paused) el.play().catch(() => failed.add(name));
    else if (v === 0 && !el.paused) el.pause();
    return !failed.has(name);
  }

  function ac() {
    // Tarayıcı autoplay politikası: ilk kullanıcı etkileşiminden önce AudioContext açma (konsol uyarısı üretir)
    if (muted || !unlocked) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain();
      master.gain.value = VOLUME;
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
    static: () => noise({ dur: 0.8, vol: 0.06, freq: 2500, type: 'bandpass', q: 0.3 }),
    shutter: () => {
      noise({ dur: 0.04, vol: 0.08, freq: 4000, type: 'highpass' });
      noise({ dur: 0.05, vol: 0.06, freq: 2500, type: 'highpass', delay: 0.07 });
    },
    // K2 trial: sounds of the text-free launch intro (src/fx/opening.js O.cues)
    intro_music: () => {
      // slow A-minor chords, then a rising A major as the rocket leaves (about 14 s)
      const chords = [[110, 130.81, 164.81], [87.31, 110, 130.81], [98, 123.47, 146.83], [82.41, 103.83, 123.47], [110, 138.59, 164.81, 220]];
      chords.forEach((ch, i) => ch.forEach((f) => {
        tone({ type: 'triangle', f0: f, dur: 3.2, vol: 0.05, delay: i * 2.6 });
        tone({ type: 'sawtooth', f0: f * 2, dur: 2.6, vol: 0.008, delay: i * 2.6 });
      }));
      [0, 2.6, 5.2, 7.8].forEach((d) => tone({ type: 'sine', f0: 55, f1: 45, dur: 1.2, vol: 0.12, delay: d }));
    },
    crowd: () => {
      for (let i = 0; i < 14; i++) noise({ dur: 0.7, vol: 0.035, freq: 500 + Math.random() * 300, type: 'bandpass', q: 0.5, delay: i * 0.5 });
    },
    heartbeat: () => {
      tone({ type: 'sine', f0: 70, f1: 40, dur: 0.16, vol: 0.22 });
      tone({ type: 'sine', f0: 62, f1: 38, dur: 0.16, vol: 0.14, delay: 0.21 });
    },
    countdown: () => tone({ type: 'square', f0: 880, dur: 0.14, vol: 0.05 }),
    roar: () => {
      noise({ dur: 0.5, vol: 0.3, freq: 400 });
      for (let i = 0; i < 8; i++) noise({ dur: 1.2, vol: 0.22 - i * 0.022, freq: 150, delay: i * 0.9 });
      tone({ type: 'sine', f0: 60, f1: 30, dur: 2.5, vol: 0.18 });
    },
    cheer: () => {
      for (let i = 0; i < 8; i++) noise({ dur: 0.9, vol: 0.05, freq: 1000 + Math.random() * 400, type: 'bandpass', q: 0.6, delay: i * 0.4 });
      for (let i = 0; i < 160; i++) tone({ type: 'square', f0: 1800 + Math.random() * 2200, dur: 0.03, vol: 0.006 + Math.random() * 0.008, delay: Math.random() * 3 });
    }
  };

  function play(name, payload) {
    try {
      if (name === 'step') {
        const now = performance.now();
        if (now - lastStep < 220) return;
        lastStep = now;
      }
      if (playSample(name)) return;
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
    // Yüzeyde rüzgâr kaydı; fırtınada fırtına kaydı da yükselir. Kayıt yoksa sentez rüzgârı çalar.
    const outside = mode === 'surface';
    const windRecorded = setLoop('wind', outside ? 0.4 + intensity * 0.6 : 0);
    setLoop('storm', outside ? Math.max(0, intensity - 0.5) * 2 : 0);
    const windVol = outside && !windRecorded ? 0.03 + intensity * 0.12 : 0;
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
      if (master) master.gain.value = muted ? 0 : VOLUME;
      if (muted) Object.values(loops).forEach((el) => el.pause());
      return muted;
    },
    isMuted: () => muted
  };
})((window.SOL14 = window.SOL14 || {}));
