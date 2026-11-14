# CLAUDE.md

Shared instructions for the whole team and for Claude. Keep this file short.
Team decisions live in DECISIONS.md, which is loaded here:

@DECISIONS.md

## Project context

- Event: NASA Space Apps Challenge 2026, a 48-hour hackathon on Nov 14–15, 2026.
- Challenge: Space Mission Design Game.
- Goal: an interactive game where players design, manage and simulate a complete space mission, from concept to operations. Players make engineering decisions, manage limited resources, and see how each choice shapes mission success.
- Competing demands named in the challenge: mission objectives, spacecraft design, science instruments, launch vehicles, budget, power, mass, communications and orbit constraints.
- Audience: students who rarely get to attempt a whole mission. The game should make these trade-offs concrete instead of abstract.

Anything beyond this (platform, stack, mechanics, scope) is decided by the team and recorded in DECISIONS.md. If it is not recorded there, it has not been decided.

## How decisions are made

Planning is a team activity. Nobody, human or Claude, sets the direction alone.

Needs a team decision (record it in DECISIONS.md before building on it):
- Tech stack, engine or framework, platform, hosting
- Game rules, scoring, win/lose conditions, progression
- Which mission constraints are modeled and how (formulas, level of detail)
- Shared data formats, folder structure, interfaces between parts
- Adding a major dependency, or removing/renaming something other people use
- Scope changes: adding a feature to the demo or dropping one

Decide it yourself (no need to ask):
- Implementation details inside your own task: names, internal structure, helper functions
- Styling and text inside your own screen or component, unless a decision says otherwise
- Small libraries that only your part uses (mention them in your PR)

If you can't tell which list something belongs to, ask in the team chat. A two-minute question costs less than a two-hour rework.

## Git workflow

- `main` is the shared version and must always work. Never commit or push directly to `main`.
- Everyone works on a branch named after themselves: first name in lowercase ASCII letters (ş→s, ç→c, ğ→g, ı→i, ö→o, ü→u). Example: `enes`. If two members share a first name, add the surname initial (`enes-s`).
- For a second branch for parallel work, use `name-topic` with a hyphen, for example `enes-orbit-ui`. Don't use `name/topic`: git can't hold `enes` and `enes/...` at the same time.
- Push only to your own branches. Never commit to, rebase or force-push someone else's branch. Never force-push `main`.
- Sync often: run `git pull origin main` on your branch every few hours and always before opening a PR. Resolve conflicts on your branch, not on `main`.
- Changes reach `main` through pull requests. Small, frequent PRs beat one big PR at the end.
- Merge with "Create a merge commit", not "Squash and merge". Personal branches keep living after a merge, and squashing makes later PRs show old changes and conflicts.
- A PR that touches shared files (listed below) or the shared game model needs a quick OK from one teammate. A PR that only touches your own area can be merged by you once the project runs.
- Before merging, check that the project starts and the main game flow still works.
- If `main` breaks, fixing it comes first. Whoever merged the breaking change fixes it or reverts it.
- Commit messages: short, English, imperative ("Add launch vehicle picker"). Prefixes like `feat:`, `fix:` or `docs:` are welcome but optional.
- Shared files: dependency manifests and lockfiles, the entry point, global config, shared types/models, CLAUDE.md and DECISIONS.md. REFERENCES.md is shared too, but anyone may append a line to it without asking. For the others, tell the team before you edit one, keep the change small, and commit it on its own.
- Never commit secrets (API keys, tokens, `.env`). Personal notes go in `CLAUDE.local.md`, which is gitignored.

## Language

- Code, comments, commit messages, PRs, issues and repo docs are in English.
- Team chat and conversations with Claude can be in any language. Claude replies in the language it is addressed in.

## Rules for Claude

- Build on the accepted decisions in DECISIONS.md and never contradict them.
- If a task needs something from the "Needs a team decision" list that isn't in DECISIONS.md, stop and say so. Offer 2–3 options with short trade-offs. Add them as a `Proposed` entry only if the user asks. Never mark an entry `Accepted` unless the user says the team agreed.
- Stay inside the current task and the user's own area. No drive-by refactors in files other people are working on.
- Don't commit, push, merge or open PRs unless the user asks. When you do, follow the Git workflow above.
- Don't add AI attribution (co-author trailers, "Generated with" lines) to commits or PRs.
- Real-world values (launch vehicle capacity, mass, power, cost, data rates, orbital parameters) need a source. Cite it in a code comment and in REFERENCES.md. If a value is simplified for gameplay, label it as simplified. Never invent figures and present them as real.
- Keep the game understandable for students: every trade-off should be visible to the player through clear feedback, not hidden in the code.
- Before saying a task is done, run the project and check that the change works.

- When you add an external resource (data, code, library, image, sound, 3D model) or produce AI-generated content, add a line to REFERENCES.md in the same change.

## How the project is judged

Judges score five criteria. Use them to settle "is this worth building?" questions.

- Influence: how much positive impact the project can have, and for how many people.
- Creativity: how novel the approach is.
- Validity: scientifically sound, does what it claims, could work in the real world.
- Relevance: answers the challenge, is complete, technically feasible and usable.
- Presentation: tells the story clearly (the challenge, the solution, why it matters).

For this challenge that means: real trade-offs backed by sourced numbers (Validity), a full concept-to-operations loop that a student can actually play (Relevance), and a demo that explains itself (Presentation).

## Submission requirements

Taken from the Space Apps Judging & Awards Guide and Project Submission Guide. The demo format and deadline below come from last year's submission guide: confirm them in the 2026 guide on day one.

- Team size is 1 to 6 registered members. Everyone must be on the team page.
- The submission page and everything linked from it must be in English. A video demo may be in another language only with English subtitles.
- Project Demo: a video of up to 30 seconds, or a slide deck of up to 7 slides, hosted on a public link.
- Deadline: Sunday 23:59 in the Local Event's time zone. Late submissions are not judged. Submit early and edit afterwards.
- Required form fields include: summary, demo link, final project link, detailed description, NASA data used, other data used, and use of AI.
- Every external resource, including open-source code and free assets, must be listed in the References field. No copyrighted music, images or text without permission.
- AI tools are allowed but must be disclosed: where and how they were used. AI-generated images and videos need a visible watermark. AI-generated content must not contain or modify NASA logos, flags or mission identifiers.

REFERENCES.md is the running log for all of this. Keep it current so the submission form can be filled in from it in minutes.

## Things to watch

- Time: the hackathon lasts 48 hours. A simple demo that works beats an ambitious one that's unfinished. Keep time free at the end for the demo and the submission form.
- Depth over breadth: one mission that plays well from start to finish beats five half-built ones.
- Check the Space Apps brand guidelines before using NASA or Space Apps logos.
- Keep the README's run instructions up to date so any teammate, or a judge, can start the project.
- The final project link must open for a judge without setup problems. Test it from a clean machine or a private browser window before submitting.

## Optional: i-have-adhd skill

`.claude/skills/i-have-adhd/` makes Claude answer action-first: the next step first, numbered steps, no filler. It is off by default. Turn it on with `/i-have-adhd` and off with "stop adhd mode". Source: github.com/ayghri/i-have-adhd (MIT License).
