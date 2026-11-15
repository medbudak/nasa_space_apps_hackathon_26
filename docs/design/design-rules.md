# SOL 14 — Shared Design and Interaction Rules

Version: 2.0 · 15 November 2026
Scope: main menu, mission prep, the outside world, interiors, base building, camera, experiments, reports and the opening animation.

This document is the project's shared design source. New screens and changes follow these rules. Later explicit decisions by the user can update it; the rules are not "unchangeable". This file is not an instruction to build every new mechanic at once. Implement what is in scope for the current task, and don't change working game rules on design grounds alone.

## 1. Visual references and priority

The three images the user gave with this document are the main references:

| Reference file | Use | What to take from it |
|---|---|---|
| image(20261115-101717).png | First landing / simple HUD | Large rocket, empty terrain, a small status card, one goal, the nearby interaction |
| image(20261115-101813).png | Exploration / detailed HUD | Layered Mars landscape, technical gauges, the return limit, task and report status |
| image(20261115-101823).png | Main menu | Pixel logo, an orange primary action, dark surfaces, thin frames, a Mars landscape |

Text, numbers, keys and buildings in the images are not game rules by themselves. Computed values come from the existing system. A reference showing a built base does not allow a base at the first landing. The latest explicit game decision: at the first landing there is only the large rocket and the astronaut; the player builds the facilities.

Instead of the old cyan-heavy screens, the rust orange, dark charcoal surfaces and warm white text of these references are the basis. The density of the detailed exploration HUD is not carried to every screen.

## 2. Visual identity

- Identity: Mars exploration and engineering; a modern, readable pixel-game look.
- World: a 2D side view; basalt, rust-red soil, layered cliffs, controlled atmospheric depth.
- Foreground, midground and background contrast stay distinct. Walkable ground, the player and interactive objects stay readable.
- Characters, vehicles, buildings and devices in the same scene share a similar pixel density, light direction and line style. Quality differences between references are not copied.
- Keep the identity of the approved large rocket and astronaut; don't make a new model for every new screen.
- Pixel art is not defined by the label "16-bit" alone: study the project's logical drawing resolution and sprite scale and set a shared scale.
- Use nearest-neighbour / `image-rendering: pixelated` on pixel raster assets. Don't apply it to the whole DOM, text, SVGs or CSS panels.
- Scale the pixel scene by whole numbers where possible. If the screen must be fitted, scale the image and the HUD separately and keep text readable.
- No neon glow, glass effects, heavy background blur, big rounded cards or metal ornaments on every panel.
- World lighting, a headlamp, the sunset and darkening the menu for readability are fine. UI buttons are flat colours; no decorative glossy gradients.
- Thin borders and a limited dark shadow only for separation/readability. Corners are 0–4 CSS px or a simple cut corner.

## 3. Shared tokens

These are starting tokens for the UI; they don't claim to be exact colours measured from the references. World images are not forced into this limited UI palette. New screens use the same tokens; repeated colours don't turn into local constants.

```css
:root {
  --ui-bg: #141820;
  --ui-panel: #202126;
  --ui-overlay: rgba(23, 24, 29, .94);
  --ui-track: #373a40;
  --ui-border: #777a7b;
  --ui-text: #f2e8d4;
  --ui-muted: #b7b3aa;
  --ui-primary: #cc5728;
  --ui-primary-hover: #dc6532;
  --ui-on-primary: #fff6e8;
  --ui-selected: #eddec0;
  --ui-on-selected: #1b1e23;
  --ui-data: #82cfc8;
  --ui-success: #91ce96;
  --ui-warning: #edbc63;
  --ui-danger: #ee7180;
  --ui-focus: #f4de9e;
  --ui-keycap: #23252b;
  --ui-radius: 4px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
}
```

- Orange: the primary action, a goal or active guidance. Don't make every number orange.
- Cream: the selected surface of a large choice card. In the HUD a thin marker can also show selection.
- Cyan: data/measurements; not the general primary button colour.
- Green: a passed check or a valid placement; only derived from the real state.
- Amber: a state that needs attention. Red: an error or critical state.
- State is never shown by colour alone; text, an icon or a shape goes with it.
- The red camera focus frame is an approved exception. When ready it says "Ready to shoot"; red alone does not mean success.
- Aim for at least 4.5:1 contrast for normal text and 3:1 for large text, measured on the real composition. Using the tokens alone does not guarantee it.

## 4. Typography, icons and text

- A pixel heading font may be used for the logo and short headings. It must support every Turkish character.
- Long descriptions and small HUD text use the project's readable font. Don't turn everything into a monospace/pixel font.
- Use `font-variant-numeric: tabular-nums` for numbers so panel widths don't jump when a percentage changes.
- At 1280×720, aim for at least 16 CSS px body text and 14 px helper text; headings about 24–36 px. Scale up moderately on large screens.
- The old rule forcing every panel heading into 12–14 px cyan capitals no longer applies. Capitals only on short section labels.
- One sentence, one purpose: "Choose where the habitat goes", "E · Open the cargo". Don't put long tutorials in the permanent HUD.
- Icons come from one family. Functional UI icons can be simple; they don't have to be the same raster as world sprites. No random emoji.
- Keys appear in a small dark keycap. The key shown is read from the real input mapping.
- English/Turkish text comes from localisation keys. Decimal separators, percentages and units are formatted consistently per language.

## 5. Layout and scale

- Target landscape 16:9. Check at 1920×1080, 1366×768 and 1280×720.
- Don't stretch the world at other aspect ratios; use a controlled camera view or letterboxing. The UI stays in the safe area.
- The HUD is a screen layer separate from the world camera. Margins at least 16 px, 24–32 px on large screens.
- Don't shrink the whole UI until it is unreadable. First reduce spacing/image size and move secondary information into an expandable section.
- The primary action and the close control stay visible. Controlled vertical scrolling is fine for zoom/accessibility; no horizontal overflow and no scrollbar inside an image.
- Don't impose one fixed percentage for the scene, panels and menus. During play the world keeps at least about 70% of the visible area; deliberately opened tools such as a full-screen report or settings are exceptions.

## 6. HUD: two densities, one system

### Simple HUD — start and default exploration
- Top left: suit O₂ and battery; below them the direction/distance to the current shelter.
- Top centre: one active goal, with direction/distance if needed.
- Top right: sol and time; below them the location and outside temperature.
- Nearby object: a single interaction label. If several objects are close, one priority object is chosen.
- Bottom edge: only the necessary short shortcuts. A mini-map is optional; don't show meaningless empty markers at the start.
- Habitat energy, morale, radiation and detailed reports live in their own panels.

### Detailed exploration HUD — player choice or an open system panel
- The second reference's layout may be used: a compact technical strip at the top, a short task list and a small map in a corner.
- O₂ return limit, battery, temperature, radiation, morale and shelter information are shown only where the current simulation gives them meaning.
- The simple and detailed views use the same data. Two different HUDs are never overlaid at once.
- In a critical risk the relevant gauge also shows in the simple HUD; the whole detailed panel is not forced open.
- "Return is safe" and the O₂ return notch come from the distance, use rate and current route. If there is no calculation, don't invent a safe label; if it is an estimate, say so.
- Use a small threshold tolerance/hysteresis so the risk state doesn't keep blinking around the threshold.

## 7. Main menu and mission prep

### Main menu
- Based on the third reference's Mars landscape, pixel logo and dark left menu area.
- There is one orange primary action: "New mission" without a save, "Continue" with a valid save.
- Without a save, "Continue" can be shown disabled with "No saved mission", as in this reference; this replaces the earlier suggestion to hide it.
- Secondary actions: New mission, Quick mission, Settings; don't show the repeated primary action twice.
- The quick mission description comes from the existing game setting. Language and sound are small helper controls.
- If starting a new mission can overwrite a save, it says so clearly.

### Prep
- The names Objective → Rocket → Habitat → Instruments → Check are visible.
- Back/next positions are fixed. Choices are kept between steps.
- Each choice shows its function, its cost/load effect and a short result.
- Numbers, rocket capacity, durations and success conditions come from game data; nothing is copied from a mockup.
- Every existing instrument stays reachable; no option is removed because a design has fewer cards.
- The last step holds comms, spares and the real readiness check. If something critical blocks launch, the launch button is disabled, the reason is visible and a "Fix" link goes to the relevant choice.
- "Start launch" is used only on the final check.
- The large preview images on the right are menu illustrations in one shared 2.2:1 frame; they don't stand for a specific vehicle's technical drawing, and a habitat in the illustration doesn't mean the base exists at landing.

## 8. First landing and the player-built base

- At a new mission's first landing there is only the existing large rocket and the astronaut; the materials are inside the rocket.
- The distant glaciers, wrecks and lava cave stay. A base in a menu illustration doesn't require a pre-built base at the start.
- First goal: "Take the building materials out of the rocket". The rocket is the temporary shelter.
- Flow: cargo → choose a spot → shell → power → life support → test → active base.
- The placement preview is green where valid and red where not; both show a short reason and confirm/cancel keys.
- Placement mode takes over the movement keys; the character doesn't walk at the same time.
- Cancelling doesn't use up a package; overlap, door access and blocked passages are checked.
- A habitat with a shell but not yet active is not shown as a safe shelter.
- Each facility's image, collision, output, interaction and marker follow its real build state.
- Equipment not chosen in mission prep never appears on its own. This includes the greenhouse, RTG and extra modules.
- Building does not charge mass or budget a second time. Save/load keeps progress.

## 9. Interiors and stations

- An interior is a side cutaway; the astronaut's movement and the reachable stations are clear.
- Not every interior needs a three-column bottom control centre. The old fixed 26% panel rule is removed.
- Default is the simple HUD + a label for the nearby station. Details open only on interaction.
- When a station drawer is needed: a short status, one action, its duration and resource effect. Don't dump data over the whole screen.
- Picking a card selects/highlights the station. Auto-walk is used only if it already exists and is reliable; no pathfinding is added just for this document.
- Exit text follows the real location: "Go outside", "Back to the habitat", "Back to the rocket". Don't write "Back to the shuttle" everywhere.
- Jumping inside follows the existing game rule; while a modal/POV is open, movement keys don't leak into the scene.

## 10. Camera and 2.5D interactions

- The camera, watering, panel cleaning and experiment close-ups may use limited parallax where needed. A 2.5D transition is not forced on every station.
- Far layers move little, near layers more; start at 0.2 / 0.5 / 1.0. The real shift is limited by the scene size; no empty edge appears.
- A porthole on the Mars surface shows the Mars surroundings. Don't put Earth and Mars in the same window as decoration.
- In a close-up, unnecessary outside HUD is hidden; the close key and critical resource warnings stay reachable.
- In the research camera the body and hands are in the foreground; the LCD shows the real current frame. The scene outside the camera matches the same view.
- Focus progresses while the target is in frame and conditions allow. It cancels when the target leaves; small movements don't keep resetting it.
- When focus completes: a red frame + "Ready to shoot". The photo is taken only when the user clicks/presses a key.
- While the camera is open, Space takes the photo; jumping doesn't work. The real key label comes from the input system.
- The photo records only the frame; hands, body, HUD and the target marker are not in it.
- A GIF is a reference/preview, not played in place of a working mechanic. In-game effects are controllable animations.
- Production layers are preferably alpha PNGs/sprite sheets. Green-screen deliveries are intermediate assets; no green remains in the game, and chroma keying doesn't erase the object's own colours.

## 11. Motion, animation and accessibility

- Hover/press 100–160 ms; panel transitions about 160–220 ms; close-up transitions 200–300 ms as a starting target. The goal is quick feedback.
- Buttons don't move their layout or text on hover. No primary button pulses continuously.
- No long camera shake, forced head-bob or strong repeated flashes. With reduced motion, tilt, parallax and shake can be turned off.
- The world, camera and attached markers are drawn with the same frame transform. The HUD uses separate screen coordinates. Don't give markers a separate delayed CSS transition.
- Movement is delta-time based; low performance doesn't change movement speed. Render/input loops don't multiply when screens open and close.
- WASD/A-D don't clash with shortcuts. For example, if D moves, don't also use D for downlink. Study the existing mapping; build keycaps from the real mapping.
- Tab focus is visible, buttons work with Enter/Space, and focus returns when a modal closes. Controls ideally have a click area of at least 44×44 CSS px.
- Warnings never rely on sound or colour alone. Sounds can be turned off; important notices are also given as text.

## 12. Scientific explanations and game feedback

- Learning loop: observe → predict/decide → act → measure → compare → report.
- Results and reasons are short and concrete: "Insulation went up; heat loss went down." Numeric results come from the real simulation.
- No zero-gravity lab is shown on the Mars surface. Experiments match Mars gravity and what the installed device can measure.
- Exception (user decision, 15 November 2026): the crew animation inside the shuttle/lander is always weightless floating, as on the Sol 0 transit deck. While the lander is on the Mars surface this is a game simplification and is labelled once in the game (`hp.zero_g_note`). Experiments, jump height and all other calculations stay at 0.38 g.
- A photo alone is not proof of rock safety, material composition or structural soundness. Observation and verified measurement are named separately.
- Power W/kW, energy Wh/kWh, mass kg; suit temperature, body temperature and outside temperature are never used interchangeably. Radiation dose and dose rate carry separate units/labels.
- Data collected / report ready / sent to base / delivered to Earth are separate states. Success counts at the stage the mission rule requires.
- A measurement screen shows only data the model in use supports; don't present decorative random numbers as scientific results.
- Small tasks are meaningful and short. Endless reward loops, needless repetition, fear-of-missing-out pressure or unmeasured health claims such as "protecting dopamine" are not design goals.

## 13. Component and data rules

- Use the project's existing framework/render setup; don't add a new engine just for design.
- Shared tokens and components: panel, button, choice row, radio/checkbox, keycap, status bar, task notice, interaction label, step indicator.
- All numbers and task states come from the central game model. Don't keep independent UI state for the same O₂/battery.
- Screen refreshes, the clock and resource use are separate responsibilities; two open panels must not apply resource use twice.
- Producing a screenshot is not coding the UI; interface text is not baked into images. Don't use a whole screen as one picture.
- Skipping the opening/launch animation reaches the same game state as letting it finish. Control is handed over once.
- Save compatibility is kept; don't delete saves that have an old base. Apply any needed migration explicitly.

## 14. Design completion check

For each relevant change, check whatever it affects:
- [ ] Simple/detailed density suits the screen type, with one primary action.
- [ ] Turkish characters, readable text, measured contrast, keyboard focus.
- [ ] No clipping, overlap or horizontal scrollbar at the three target resolutions.
- [ ] World and sprite scale are consistent; no scrollbar inside images.
- [ ] At the first landing only the rocket/astronaut; object services follow the real build state.
- [ ] Critical risks show in the simple HUD; safety/measurement claims rest on data.
- [ ] Numbers, units, selected states and report progress match the central model.
- [ ] The target marker doesn't jitter while the camera moves; opening/closing screens doesn't duplicate input or rendering.
- [ ] The interaction hint shows the right object and the real key; no modal input leaks.
- [ ] Reduced motion, sound off and skipping animations work.
- [ ] The relevant build/tests ran; screenshots were taken of the implemented screens.

## 15. Working instructions for Claude / the implementer

Read this file and the relevant existing components before starting. Match the screen in scope to the closest reference type. Implement with the shared components; don't replace game data and calculations with numbers from the example images. If an image is missing, use a consistent placeholder and say so at hand-over. In the report, keep the design draft, the implemented screen and the tested behaviour separate. If a new explicit user decision contradicts this document, apply the decision and update the rule; carry on with the work that isn't ambiguous.
