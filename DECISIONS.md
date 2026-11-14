# DECISIONS.md

The team's decision log. CLAUDE.md loads this file, so Claude sees it in every session.
If something is not recorded here, it has not been decided.

## How to use this file

- Add a decision only after the team has agreed on it, and write down who agreed.
- Statuses: `Proposed` (open for discussion), `Accepted` (agreed, build on it), `Superseded by D-XXX` (replaced by a newer decision).
- Never delete or rewrite an accepted decision. To change one, add a new entry and mark the old one `Superseded by D-XXX`.
- Keep entries short, a few lines each. Link to details (an issue, a doc, a sketch) when needed.
- Number entries in order: D-001, D-002, ... If two PRs use the same number, the one merged later renumbers.
- Change this file in its own commit, through a PR, and tell the team.
- Claude may draft `Proposed` entries when asked. Only the team marks an entry `Accepted`.

## Template

```
### D-XXX: <short title>
- Status: Proposed | Accepted | Superseded by D-XXX
- Date: YYYY-MM-DD
- Agreed by: <names>
- Decision: <what we chose, in one or two sentences>
- Why: <main reason, and the options we rejected>
- Affects: <files, parts of the game, or people>
```

## Open questions

Decide these together at the start. When one is agreed, move it to the log below.

- Platform (web, desktop, mobile) and tech stack
- Game format: turn-based or real-time, single-player or multiplayer, length of a session
- Target player and difficulty level
- Mission destinations and the mission types players can choose
- Which constraints the game models (budget, mass, power, communications, orbit, ...) and how simple each model is
- Data sources for real-world values
- Where game data lives (parts, launch vehicles, costs, scenarios) and in what format, so values can be tuned without touching logic
- How success is measured for the player (score, science return, mission outcome) and how the game explains why a mission failed
- What the final demo must show (minimum scope)
- Feature freeze time: when we stop adding features and switch to polish, demo and submission
- Demo format (30-second video or 7 slides) and who prepares it
- Who owns the submission page and REFERENCES.md at the end
- Who owns which part of the project

## Decision log

_No decisions yet._
