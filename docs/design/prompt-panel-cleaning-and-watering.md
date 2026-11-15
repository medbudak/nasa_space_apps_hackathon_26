# SOL 14 — Panel Cleaning and Plant Watering Mini Tasks

Add two short, interactive maintenance mini tasks to the existing SOL 14: RED HORIZON project: cleaning a solar panel with the mouse and watering the root zone by hand. Study the project first, then build on the existing architecture. Don't ask the user to approve routine implementation choices.

## 1. Study the project first

- Read AGENTS.md and the existing project rules.
- Find the framework, render engine, scene management, inventory/resource system, save system, menus and pause logic.
- Scan the asset folder; use the files below if they exist. Don't assume files exist that don't.
- Don't rewrite the existing game loop or UI architecture. Extend the existing components.
- If the project uses a different asset folder, adapt the paths and report the mapping.

## 2. Experience goal

The player does a short physical action, sees the result at once and gets a meaningful improvement in the game's systems. This is not a measurement of biological dopamine. The times are design targets to test.

- Cleaning: about 8–15 seconds of active interaction.
- Watering: about 5–10 seconds of active interaction.
- No countdown or failure pressure during normal maintenance.
- While the menu is open, world time, resource use and outside threats stop. Mini-task input and visual animation keep running.
- Opening and closing again gives no extra reward or free resources.
- Don't create mandatory maintenance on every habitat visit. The need for maintenance follows the real system state.

## 3. Image files

The names below are the target contract; check the assets first. Except for the background, the PNG files must have real alpha transparency. White/green backgrounds or a drawn checkerboard are not acceptable.

```text
assets/minigames/
  solar/
    solar_clean_base.png
    solar_dust_overlay.png
    brush_cursor.png
  greenhouse/
    planter_base.png
    soil_dry.png
    soil_wet.png
    lettuce_plant.png
    watering_can.png
  shared/
    maintenance_bg.png
```

### Required asset specification

| File | Size | Content |
|---|---|---|
| solar_clean_base.png | 1024×640 | A clean rectangular panel seen from the front, thin metal frame; transparent outside |
| solar_dust_overlay.png | 1024×640 | Orange dust that sits only on the panel's cell area; frame and outside transparent |
| brush_cursor.png | 128×128 | One brush; bristles at the bottom, contact point about (64,104); transparent |
| planter_base.png | 512×512 | White-grey growing tray with orange details; no plant or soil; transparent |
| soil_dry.png | 512×512 | Dry growing medium that fits the tray's top opening; nothing else |
| soil_wet.png | 512×512 | Darker wet medium, same geometry and position as the dry layer |
| lettuce_plant.png | 512×512 | Only the lettuce; the root start aligned with the tray's top opening; no pot, transparent |
| watering_can.png | 256×256 | One watering can; spout pointing bottom-left; transparent |
| maintenance_bg.png | 1600×900 | A plain, dark habitat maintenance area; empty centre, no text; opaque |

The images contain no UI text, progress bars or buttons; draw those in code. The water stream, drops, dust particles and gauges may be drawn in code; separate images are not required.

### Layer and coordinate rules

- Keep the pixel-art look; use `image-rendering: pixelated` and turn smoothing off where it fits.
- Don't crop matching layers separately or scale them at different ratios.
- The panel base and the dust layer share the same canvas, perspective and cell boundaries.
- Suggested active panel area in source-image coordinates: x=64, y=64, width=896, height=512. If the image differs, inspect the real area and change the configuration.
- The greenhouse layers share the same 512×512 source canvas. Suggested tray opening: x=96–416, y=310–380; the plant's root start at about (256,350).
- Greenhouse draw order: tray → dry medium → wet medium → plant → watering can → water effect. Use a mask for the image's front edge if needed.
- Convert mouse points from screen pixels to scene and source-image coordinates; account for CSS scale and devicePixelRatio.

## 4. Panel cleaning

1. On the task screen, load the real panel state: current dust level, output and any earlier cleaning progress.
2. Put an erasable dust layer over the clean panel base.
3. Dragging with the left button pressed erases the dust under the brush. Use a canvas, render texture or the engine's mask system.
4. Sample between points on fast moves so the stroke has no gaps.
5. Count cleaned area as unique area. Cleaning the same spot again doesn't add progress.
6. Progress is measured against the cleanable dust area at the start of the task. The background and frame give no points. Keep the mask and the progress measurement consistent.
7. Complete at about 90% clean; clear the tiny leftover spots automatically. The threshold is configurable.
8. Update panel output with the existing energy model's dust–efficiency relation. Don't invent a fixed energy reward the game doesn't have.
9. The completion effect runs once: a short sound/animation and the real before/after output.
10. The result stays visible after completion; an automatic close must not take control away from the player.

Suggested states: ready → cleaning → completed. Closing halfway saves the cleaning progress; reopening restores it. A panel that is already clean gives no reward again.

## 5. Watering by hand

1. Load the chosen plant's current moisture, its target moisture range and the water available.
2. The watering can follows the mouse. Holding the button draws a water stream from the spout to the root zone.
3. Moisture rises only while the stream reaches the growing medium; pouring on leaves or into empty space doesn't count.
4. In the first version, stop the stream and the water use while off target; show the target area with a soft highlight. No hidden water penalty.
5. Compute water use over the pouring time with delta time. Apply water use and moisture gain in the same step; don't let them drift apart in different updates.
6. Fade the wet layer in gradually over the dry one. The plant doesn't grow at once or turn into a harvest.
7. Stop the stream automatically when the target moisture range is reached. No overwatering penalty in the first version.
8. If the water runs out, stop and explain why; moisture and water never go negative.
9. If the screen is closed halfway, the water used and the current moisture are kept. Reopening doesn't give the water back.
10. For a plant at the right moisture show "No watering needed"; give no reward again.

Adding nutrients, harvesting, plant death or a new morale system are out of scope for these two mini tasks. Don't use watering and feeding as interchangeable terms.

## 6. Input, accessibility and pausing

- Use one pointer input for mouse and, where possible, touch.
- Stop cleaning/watering safely on pointer capture loss, pointerup, pointercancel, window blur and screen close.
- Offer a click-to-start / click-to-stop mode as an alternative to holding.
- Add a keyboard alternative to move between targets and start/stop the action; keep it consistent with the existing accessibility setup.
- ESC closes; partial progress is kept.
- If the pause system supports it, use a pause token/reference count instead of one boolean, so another open menu doesn't resume the world by mistake.
- Use real UI time for UI effects and pausable world time for the world simulation. Don't apply the time spent in the menu as resource use when it closes.
- Show state with text or an icon as well as colour; the result is clear with sound off too.
- With reduced motion on, reduce particles and screen shake.

## 7. Saves and system links

- Add the cleaning mask, or a cell state at a high enough resolution, to the existing save. A percentage alone can't rebuild the visual mask.
- Update plant moisture and the water reserve in the existing data source; don't create a separate, conflicting state.
- If the save schema changes, add safe defaults/migration for old saves.
- Resource updates and the completion event are safe to call more than once.
- Cleaning and dust building up again follow the existing world simulation. Reopening the screen doesn't reset the dust at random.
- The general log remembers the first maintenance tutorial; the tutorial doesn't repeat on every open.

## 8. UI text

Panel: "PANEL MAINTENANCE", "Move the brush over the dusty areas", "Cleaned", "Panel cleaned", "Power output", "BACK".

Greenhouse: "WATER THE PLANT", "Pour the water at the root zone", "Moisture", "Water reserve", "Moisture OK", "Not enough water", "No watering needed", "BACK".

Take state values from the real system. Don't hard-code mockup values into the working system. All text goes into `content/story.json` in EN and TR.

## 9. Tests and acceptance criteria

- Rubbing the same spot of the panel again doesn't raise progress.
- No cleaning credit on the frame or empty space.
- At different screen sizes/DPR the brush's visual contact point matches where dust is erased.
- Fast dragging leaves no gaps.
- Completion at the 90% threshold and the system improvement apply only once.
- Close/reopen and save/load restore the cleaning mask.
- No water is used off target or when the button is released.
- The same pouring time gives about the same water use and moisture gain at different FPS.
- Water never goes below zero and moisture never above the allowed limit.
- pointercancel and focus loss stop the stream.
- Waiting 60 seconds in the menu doesn't advance world resources or threats; the mini-task animation still runs.
- Closing nested menus doesn't resume the game early.
- Cancelling and reopening gives no free water or repeated reward.
- Clean or sufficiently watered objects show the correct completed state.
- Real player tests watch the time and clarity; don't add artificial waiting because a target time isn't met.

Run logic tests with the existing test tools and at least one real interaction check. State clearly which conditions you couldn't test.

## 10. Hand-over

Finish a working implementation. At the end:
1. Briefly describe the behaviour added.
2. List the files changed and the asset mapping.
3. Share the tests run and their results.
4. For a missing/incompatible asset, give the exact file name and the fix needed.
5. Show where the brush size, target moisture, flow and timing values can be tuned later.

If images are missing, finish the rest and mark the placeholders clearly. Don't present placeholder assets as final art. Don't build a new economy, reward system or dependency beyond the project's current scope.
