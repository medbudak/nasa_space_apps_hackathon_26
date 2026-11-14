// UI icons drawn by K4 (assets/ui/, pixel art PNG). Owner of this file: K3.
//
// Only icons listed in AVAILABLE are requested, so a missing file never causes a 404 in the console.
// When K4 delivers more icons (P2/P3 list in src/ui/dev/README.md), add their names here.
// If a listed file still fails to load, the emoji fallback is shown instead (watchIconErrors).

// Delivered by K4 (commit f905b0d on the nursedef branch): P1 = HUD bars (16×16) and Sol 0 instruments (48×48).
export const AVAILABLE = new Set([
  'hud_energy', 'hud_o2', 'hud_heat', 'hud_radiation', 'hud_sanity', 'hud_data',
  'instr_camera', 'instr_meda', 'instr_seis', 'instr_rad', 'instr_rimfax',
  'instr_spectrometer', 'instr_moxie', 'instr_plantChamber', 'instr_drone',
]);

// Resolved from this module, so the path works from index.html and from the dev pages alike.
const BASE = new URL('../../assets/ui/', import.meta.url);
const failed = new Set();

export function iconUrl(name) {
  return new URL(`${name}.png`, BASE).href;
}

/** True when the icon can be drawn (delivered and not failed to load). */
export function hasIcon(name) {
  return AVAILABLE.has(name) && !failed.has(name);
}

/**
 * HTML for an icon, or for its fallback (emoji text) when there is no file.
 * Icons are decorative: the text next to them names the thing, so they are hidden from screen readers.
 */
export function icon(name, { size = 16, fallback = '', className = '' } = {}) {
  if (!hasIcon(name)) return fallback ? `<i class="ico-fallback ${className}" aria-hidden="true">${fallback}</i>` : '';
  return `<img class="ico ${className}" src="${iconUrl(name)}" width="${size}" height="${size}" alt="" aria-hidden="true"
    draggable="false" data-ico="${name}" data-fallback="${fallback}">`;
}

/** Swap any icon that fails to load for its fallback, and stop requesting it. Call once per mounted root. */
export function watchIconErrors(root) {
  root.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.ico) return;
    failed.add(img.dataset.ico);
    const fb = img.dataset.fallback;
    if (fb) {
      const i = document.createElement('i');
      i.className = 'ico-fallback';
      i.setAttribute('aria-hidden', 'true');
      i.textContent = fb;
      img.replaceWith(i);
    } else {
      img.remove();
    }
  }, true); // error does not bubble: listen in the capture phase
}
