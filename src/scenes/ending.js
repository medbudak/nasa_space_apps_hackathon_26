// Ending and cause-and-effect report card (M5). Owner: K1.
// Stub for the vertical slice: lists the score and the decision log. The full card comes in S6–10.

export default {
  enter({ state, t, goTo, ui }) {
    const root = document.createElement('div');
    root.style.cssText = 'position:absolute;inset:0;overflow:auto;padding:24px;';

    const heading = document.createElement('h2');
    heading.textContent = `${t('ending.score')}: ${state.score.total}`;

    const list = document.createElement('ol');
    for (const d of state.decisionLog) {
      const li = document.createElement('li');
      li.textContent = `Sol ${d.sol} · ${t(`event.${d.eventId}.title`)} → ${d.choice}`;
      list.append(li);
    }

    const again = document.createElement('button');
    again.textContent = t('ending.designNext');
    again.addEventListener('click', () => goTo('title'));

    root.append(heading, list, again);
    ui.append(root);
  },
};
