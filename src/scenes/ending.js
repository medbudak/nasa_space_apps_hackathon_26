// Ending and cause-and-effect report card (M5). Owner: K1.
// buildReport() is pure (no DOM) and tested in tests/ending.test.mjs; the scene only draws its result.

import { addScore, SCORE_CATEGORIES } from '../core/state.js';
import { massMargin } from '../core/engineering.js';
import { backdrop } from '../core/backdrop.js';

const TOP_CAUSES = 5;

const rule = (data, key) => data.rules[key].value;

function countSent(records) {
  return Object.values(records).filter((r) => r.sent).length;
}

/** Minimum and full success as in DECISIONS.md D-006. */
export function missionSuccess(state, data) {
  const reports = countSent(state.forensics);
  const experiments = countSent(state.experiments);
  const full =
    reports >= rule(data, 'fullSuccessReports') &&
    experiments >= rule(data, 'fullSuccessExperiments') &&
    state.outcome === 'hero';
  const minimum = reports >= rule(data, 'minimumSuccessReports') && experiments >= rule(data, 'minimumSuccessExperiments');
  return { level: full ? 'full' : minimum ? 'minimum' : 'none', reports, experiments };
}

/**
 * Everything the report card shows, from state alone.
 * topCauses groups score entries by the choice that caused them, biggest effect first.
 */
export function buildReport(state, data) {
  const byCategory = Object.fromEntries(SCORE_CATEGORIES.map((c) => [c, 0]));
  const groups = new Map();
  for (const entry of state.score.entries) {
    byCategory[entry.category] = (byCategory[entry.category] ?? 0) + entry.points;
    const key = entry.cause ?? `reason:${entry.reason}`;
    if (!groups.has(key)) groups.set(key, { cause: entry.cause, points: 0, entries: [] });
    const group = groups.get(key);
    group.points += entry.points;
    group.entries.push(entry);
  }
  const topCauses = [...groups.values()]
    .filter((g) => g.points !== 0)
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
    .slice(0, TOP_CAUSES);

  return {
    outcome: state.outcome ?? 'lost',
    lost: !state.outcome || state.outcome === 'lost',
    success: missionSuccess(state, data),
    total: state.score.total,
    byCategory,
    topCauses,
    timeline: state.decisionLog,
    stats: state.stats,
    comparison: data.comparison ?? [],
  };
}

/** Adds the mass-margin bonus once, when the launched design left enough capacity unused. */
export function scoreMassMargin(state, data) {
  if (state.score.entries.some((e) => e.category === 'massMargin')) return;
  const summary = state.designSummary;
  if (!summary?.capacity) return;
  const marginPct = massMargin(summary.capacity, summary.mass) * 100;
  if (marginPct >= rule(data, 'massMarginBonusPct')) {
    addScore('massMargin', rule(data, 'massMarginBonus'), 'consequence.massMarginKept', 'design.rocketId');
  }
}

// Label for a cause, e.g. "Battery: 20 kWh" or "Night freeze: walked slowly".
function causeLabel(cause, state, t) {
  if (!cause) return t('cause.none');
  const [kind, ...rest] = cause.split('.');
  if (kind === 'decision') {
    const eventId = rest.join('.');
    const last = state.decisionLog.findLast((d) => d.eventId === eventId);
    return `${t(`event.${eventId}.title`)}: ${last ? t(`event.${eventId}.choice.${last.choice}`) : '?'}`;
  }
  const value = rest.reduce((node, key) => node?.[key], state.design);
  return t(`cause.${cause}`, { value: Array.isArray(value) ? value.length : value });
}

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function table(headers, rows) {
  const tableEl = el('table', null, 'report-table');
  const head = tableEl.createTHead().insertRow();
  for (const h of headers) head.append(el('th', h));
  const body = tableEl.createTBody();
  for (const cells of rows) {
    const tr = body.insertRow();
    for (const c of cells) tr.append(el('td', String(c)));
  }
  return tableEl;
}

export default {
  enter({ state, data, t, goTo, ui }) {
    scoreMassMargin(state, data);
    const report = buildReport(state, data);

    const root = el('div', null, 'report');
    root.style.cssText = 'position:absolute;inset:0;overflow:auto;padding:24px;';

    root.append(
      el('h1', t(`ending.title.${report.outcome}`)),
      el('p', t(`ending.success.${report.success.level}`, report.success), 'report-success'),
      el('h2', `${t('ending.score')}: ${report.total}`),
      table(
        [t('ending.category'), t('ending.points')],
        SCORE_CATEGORIES.map((c) => [t(`ending.category.${c}`), report.byCategory[c]]),
      ),
    );

    // The heart of M5: which choices shaped the mission, biggest effect first.
    root.append(el('h2', report.lost ? t('ending.lessonsLearned') : t('ending.topCauses')));
    const causes = el('ol', null, 'report-causes');
    for (const group of report.topCauses) {
      const consequences = group.entries.map((e) => `Sol ${e.sol}: ${t(e.reason)}`).join(' · ');
      const sign = group.points > 0 ? '+' : '';
      causes.append(el('li', `${causeLabel(group.cause, state, t)} → ${consequences} → ${sign}${group.points}`));
    }
    root.append(causes);

    if (report.timeline.length) {
      root.append(el('h2', t('ending.timeline')));
      const list = el('ol', null, 'report-timeline');
      for (const d of report.timeline) {
        list.append(el('li', `Sol ${d.sol} · ${t(`event.${d.eventId}.title`)} → ${t(`event.${d.eventId}.choice.${d.choice}`)}`));
      }
      root.append(list);
    }

    if (report.comparison.length) {
      root.append(el('h2', t('ending.comparison')));
      root.append(
        table(
          ['', t('ending.stat.mass'), t('ending.stat.sols')],
          [
            [t('ending.you'), state.designSummary?.mass ?? '-', report.stats.solsSurvived],
            ...report.comparison.map((m) => [m.realName, m.massKg?.value ?? '-', m.solsOperated?.value ?? '-']),
          ],
        ),
      );
    }

    const again = el('button', t('ending.designNext'));
    again.addEventListener('click', () => goTo('title'));
    root.append(again);
    ui.append(backdrop('assets/ending/cover_thumbnail_alt.png', 0.75), root);
  },
};
