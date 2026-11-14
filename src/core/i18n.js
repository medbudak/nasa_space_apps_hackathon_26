// Player-facing text, read from content/story.json (owned by K5) with t('key').
// Shape: one block per language, keys flat or nested:
//   { "en": { "storm.warning": "...", "wrecks": { "opportunity": { "title": "..." } } }, "tr": { ... } }
// t('wrecks.opportunity.title') and t('wrecks.opportunity.evidence.0') both work.
// A missing key shows the key itself, so gaps are visible instead of crashing the game.

const LANG_KEY = 'sol14.lang';
const LANGS = ['en', 'tr'];

let story = {};
let lang = readSavedLang() ?? 'en';

function readSavedLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANGS.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

export async function loadStory(url = new URL('../../content/story.json', import.meta.url)) {
  try {
    const res = await fetch(url);
    story = res.ok ? await res.json() : {};
  } catch {
    story = {};
  }
  if (!Object.keys(story).length) console.info('[i18n] content/story.json not found yet: showing text keys');
  return story;
}

/** Raw value for a key in one language block: a flat key first, then a dotted path. */
export function lookup(block, key) {
  if (!block) return undefined;
  if (key in block) return block[key];
  return key.split('.').reduce((node, part) => node?.[part], block);
}

/** Text for a key in the current language, falling back to English. {name} is filled from vars. */
export function t(key, vars = {}) {
  const found = lookup(story[lang], key) ?? lookup(story.en, key);
  const text = typeof found === 'string' ? found : key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** A list of texts, e.g. tList('wrecks.opportunity.evidence'). Empty when missing. */
export function tList(key) {
  const found = lookup(story[lang], key) ?? lookup(story.en, key);
  return Array.isArray(found) ? found : [];
}

export function getLang() {
  return lang;
}

export function setLang(next) {
  if (!LANGS.includes(next)) return;
  lang = next;
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    // language just won't be remembered
  }
}
