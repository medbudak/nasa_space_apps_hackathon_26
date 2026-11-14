// Player-facing text, read from content/story.json (owned by K5) with t('key').
// Expected shape: { "en": { "storm.warning": "..." }, "tr": { "storm.warning": "..." } }
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

/** Text for a key in the current language. {name} placeholders are filled from vars. */
export function t(key, vars = {}) {
  const text = story[lang]?.[key] ?? story.en?.[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
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
