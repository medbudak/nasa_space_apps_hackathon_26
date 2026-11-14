// TR/EN switch (owner: K3), top right of the game.
//
// K1 mounts it once in main.js with the i18n functions and a redraw:
//   import { mountLangSwitch } from './ui/langSwitch.js';
//   mountLangSwitch(document.body, {
//     t, getLang, setLang,
//     onChange: () => goTo(getState().scene),   // re-enter the open scene so it draws in the new language
//   });
// Panels that stay mounted across scenes (HUD, decision cards, mini-games) read the language through
// their `locale` function and redraw on their next refresh; call their refresh() in onChange to be instant.

export const LANGS = ['tr', 'en'];

export function mountLangSwitch(root, opts) {
  const { getLang, setLang, onChange, t } = opts;
  const el = document.createElement('div');
  el.className = 'lang-switch';
  el.setAttribute('role', 'group');
  root.appendChild(el);

  function render() {
    const now = getLang();
    el.setAttribute('aria-label', t('lang.label'));
    // Each language is named in its own language, so a player who cannot read the current one still finds theirs.
    el.innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" lang="${l}" aria-pressed="${l === now}"
      title="${t(`lang.${l}`)}">${l.toUpperCase()}</button>`).join('');
    el.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => choose(b.dataset.lang)));
  }

  function choose(l) {
    if (l === getLang()) return;
    setLang(l);
    document.documentElement.lang = l;
    render();
    el.querySelector(`[data-lang="${l}"]`)?.focus();
    onChange?.(l);
  }

  document.documentElement.lang = getLang();
  render();
  return { refresh: render, destroy: () => el.remove() };
}
