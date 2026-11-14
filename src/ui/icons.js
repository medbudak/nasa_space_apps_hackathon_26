// UI icons drawn by K4 (assets/ui/, pixel art PNG). Owner of this file: K3.
//
// Only icons listed in AVAILABLE are requested, so a missing file never causes a 404 in the console.
// When K4 delivers more icons (P2/P3 list in src/ui/dev/README.md), add their names here.
// If a listed file still fails to load, the emoji fallback is shown instead (watchIconErrors).

// Delivered by K4 on the nursedef branch: P1 (f905b0d) and P2 + P3 (a8df252).
export const AVAILABLE = new Set([
  // P1: HUD bars 16×16, Sol 0 instruments 48×48
  'hud_energy', 'hud_o2', 'hud_heat', 'hud_radiation', 'hud_sanity', 'hud_data',
  'instr_camera', 'instr_meda', 'instr_seis', 'instr_rad', 'instr_rimfax',
  'instr_spectrometer', 'instr_moxie', 'instr_plantChamber', 'instr_drone',
  // P2: other Sol 0 cards 48×48, downlink packets 24×24, decision-card costs 16×16
  'obj_forensic', 'obj_science', 'obj_balanced', 'lv_atlas5', 'lv_falconHeavy', 'lv_sls',
  'pwr_solar', 'pwr_solarRtg', 'pwr_fission', 'comms_relay', 'comms_relayX', 'traj_hohmann', 'traj_fast',
  'ins_thin', 'ins_thick', 'battery', 'spare_kit',
  'pkt_photo', 'pkt_report', 'pkt_experiment', 'pkt_family',
  'fx_energy', 'fx_o2', 'fx_suitO2', 'fx_radiation', 'fx_time', 'fx_score',
  // P3: power loads 16×16, mini-game objects 32×32
  'load_lifeSupport', 'load_heating', 'load_greenhouse', 'load_moxie', 'load_experiments', 'load_comms',
  'mg_wrench', 'mg_hand', 'mg_rock', 'mg_blast', 'mg_headphones', 'mg_dial_panel', 'mg_dial_antenna', 'mg_dial_camera',
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

/**
 * SVG version for mini-game scenes: an <image> whose box is centred on (cx, cy), or the emoji as <text>
 * when there is no file. Extra attributes (e.g. data-obj) are added to whichever element is drawn.
 */
export function svgIcon(name, { cx, cy, size = 32, fallback = '', attrs = '', className = '' } = {}) {
  if (!hasIcon(name)) {
    return `<text x="${cx}" y="${cy + size * 0.35}" text-anchor="middle" class="${className}" ${attrs}>${fallback}</text>`;
  }
  return `<image href="${iconUrl(name)}" x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}"
    class="svg-ico ${className}" ${attrs}></image>`;
}

/** Move a scene object made by svgIcon so that its centre is at y (works for <image> and <text>). */
export function setIconY(el, cy, size = 32) {
  el.setAttribute('y', el.tagName.toLowerCase() === 'image' ? cy - size / 2 : cy + size * 0.35);
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
