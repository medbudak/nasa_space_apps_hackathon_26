/**
 * SOL 14: RED HORIZON — Çekirdek temel (K1)
 * Ortak namespace (window.SOL14), olay veri yolu (bus), çeviri (t), deterministik RNG ve yardımcılar.
 * Tüm modüller klasik <script> olarak yüklenir: hem file:// hem http:// üzerinde çalışır.
 */
(function (S) {
  'use strict';

  /* ---------- Olay Veri Yolu (AGENTS.md sözleşme #4) ---------- */
  const listeners = new Map();
  S.bus = {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event).delete(fn);
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      for (const fn of Array.from(set)) {
        try {
          fn(payload);
        } catch (err) {
          console.error('[bus:' + event + ']', err);
        }
      }
    },
    clear() {
      listeners.clear();
    }
  };

  /* ---------- Çeviri: t('anahtar', {degisken}) (sözleşme #3) ---------- */
  S.lang = 'en'; // English by default (judges, submission); Turkish stays a menu option
  S.t = function t(key, vars) {
    const story = S.STORY || { tr: {}, en: {} };
    const dict = story[S.lang] || story.tr;
    let raw = dict[key];
    if (raw === undefined) raw = story.tr[key];
    if (raw === undefined) {
      if (S.debugMissingKeys) S.debugMissingKeys.add(key);
      return key;
    }
    if (vars) {
      for (const k of Object.keys(vars)) {
        raw = raw.split('{' + k + '}').join(String(vars[k]));
      }
    }
    return raw;
  };
  S.hasKey = (key) => Boolean(S.STORY && S.STORY.tr && S.STORY.tr[key] !== undefined);

  /* ---------- Yardımcılar ---------- */
  S.util = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, k) => a + (b - a) * k,
    /**
     * Eylemsizlik: hız hedefe iki kademeli üstel yumuşatmayla oturur (kalkış ve duruş S eğrisi, ease-in-out).
     * m = { v, vMid } yerinde güncellenir; tau iki kademenin toplam oturma süresi (sn). Lander içi ve transit güvertesi.
     */
    easeVelocity(m, target, dt, tau) {
      const k = 1 - Math.exp(-dt / (tau / 2));
      m.vMid += (target - m.vMid) * k;
      m.v += (m.vMid - m.v) * k;
      return m.v;
    },
    round1: (v) => Math.round(v * 10) / 10,
    round2: (v) => Math.round(v * 100) / 100,
    /** Sol içi dakika -> "HH:MM" (Mars saati, 24 sa 39 dk) */
    clock(minute) {
      const m = ((Math.floor(minute) % 1480) + 1480) % 1480;
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    },
    /** Dakika süresini "X sa Y dk" biçiminde verir */
    duration(minutes) {
      const m = Math.max(0, Math.round(minutes));
      const h = Math.floor(m / 60);
      const r = m % 60;
      return h > 0 ? S.t('unit.h_min', { h, m: r }) : S.t('unit.min', { m: r });
    },
    escape(str) {
      return String(str).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
      );
    },
    deepClone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  };

  /* ---------- Deterministik RNG (mulberry32) — QA profilleri tekrarlanabilir olsun ---------- */
  S.makeRng = function makeRng(seed) {
    let a = seed >>> 0;
    return function rng() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
})((window.SOL14 = window.SOL14 || {}));
