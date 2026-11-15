# SOL 14: RED HORIZON — Image Generation Prompt Library

**How to use:**
* Each prompt below follows the project's **2D pixel-art** style, colour palette and `assets/` folder layout.
* In the image tool (Midjourney, Flux, Leonardo.ai, DALL-E 3), pick the given **aspect ratio** and paste the English prompt as is.
* **Key rule:** every prompt excludes HUD bars and text; the software team (K3) layers the in-game UI on top in code.
* AI-generated images need a visible watermark (Space Apps rule) and are listed in REFERENCES.md.

---

## 1. `assets/backgrounds/` — Mars surface backgrounds (Aspect Ratio: `16:9`)

### 1.1. `bg_jezero_day.png` *(done — backup prompt)*
* **Path:** `assets/backgrounds/bg_jezero_day.png`
* **Prompt:**
> 2D 16-bit pixel art game background, Jezero Crater on Mars during daytime, layered rusty red canyon cliffs in the distance, small bright pale sun in a hazy dusty orange-amber sky, flat rocky red regolith ground at the bottom with small stones and pebbles, atmospheric perspective, clean retro sci-fi pixel art style, no characters, no buildings, no text, no UI, no HUD --ar 16:9

### 1.2. `bg_jezero_sunset.png` (blue sunset)
* **Path:** `assets/backgrounds/bg_jezero_sunset.png`
* **Prompt:**
> 2D 16-bit pixel art game background, Martian blue sunset in Jezero Crater, scientifically accurate Mars sunset with a cool glowing pale blue and soft violet halo around the setting sun on the horizon, dark silhouetted red canyon cliffs, deep twilight shadows on the rocky red regolith ground, melancholic sci-fi atmosphere, clean pixel art, no characters, no buildings, no text, no HUD --ar 16:9

### 1.3. `bg_jezero_night.png` (starry night with Phobos/Deimos)
* **Path:** `assets/backgrounds/bg_jezero_night.png`
* **Prompt:**
> 2D 16-bit pixel art game background, freezing Martian night in Jezero Crater, deep dark navy-black starry sky, two small irregular Martian moons Phobos and Deimos visible in the sky, dark blue-tinted silhouettes of canyon cliffs, cold moonlight illuminating rocky red-purple ground, crisp pixel art, no characters, no buildings, no text, no HUD --ar 16:9

### 1.4. `bg_storm.png` (great dust storm)
* **Path:** `assets/backgrounds/bg_storm.png`
* **Prompt:**
> 2D 16-bit pixel art game background, severe Martian dust storm, dense swirling walls of dark rust-red and burnt-orange dust clouds obscuring the sky and distant mountains, low visibility, wind-blown sand streaks across rocky Mars terrain, dramatic survival atmosphere, no characters, no buildings, no text, no HUD --ar 16:9

### 1.5. `bg_meridiani_day.png` (Meridiani Planum — equator)
* **Path:** `assets/backgrounds/bg_meridiani_day.png`
* **Prompt:**
> 2D 16-bit pixel art game background, Meridiani Planum on Mars during daytime, vast flat open red desert plains stretching to a distant low horizon, small scattered dark hematite blueberries and flat rocks on reddish-orange soil, bright warm dusty sky, clean retro sci-fi pixel art, no characters, no buildings, no text, no HUD --ar 16:9

### 1.6. `bg_arcadia_day.png` (Arcadia Planitia — icy mid-latitude)
* **Path:** `assets/backgrounds/bg_arcadia_day.png`
* **Prompt:**
> 2D 16-bit pixel art game background, Arcadia Planitia on Mars during daytime, cold high-latitude Martian landscape with frost-covered dark red ridges, patches of pale blue-white subsurface water ice peeking through reddish-brown soil, pale crisp sky, clean 16-bit pixel art, no characters, no buildings, no text, no HUD --ar 16:9

---

## 2. `assets/sprites/` — astronaut, drone and wrecks (Aspect Ratio: `1:1`)
*(Note: sprites are generated isolated on a flat pure white `#FFFFFF` background so the asset build can make it transparent.)*

### 2.1. `astronaut_idle.png` *(done — backup prompt)*
* **Path:** `assets/sprites/astronaut_idle.png`
* **Prompt:**
> 2D 16-bit pixel art character sprite, side profile view facing right of a NASA Mars astronaut standing idle, white bulky EVA spacesuit with gray joints, life support backpack, reflective dark blue helmet visor, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, full body, centered, no shadow on ground, no text --ar 1:1

### 2.2. `astronaut_walk.png` (walking step)
* **Path:** `assets/sprites/astronaut_walk.png`
* **Prompt:**
> 2D 16-bit pixel art character sprite, side profile view facing right of a NASA Mars astronaut mid-stride walking forward, arms swinging slightly, white EVA spacesuit with life support backpack and blue reflective visor, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, full body, centered, no ground, no text --ar 1:1

### 2.3. `astronaut_jump.png` (0.38 g low-gravity jump)
* **Path:** `assets/sprites/astronaut_jump.png`
* **Prompt:**
> 2D 16-bit pixel art character sprite, side profile view facing right of a NASA Mars astronaut floating mid-air in a low-gravity 0.38g jump, knees slightly bent, arms raised for balance, white EVA spacesuit with backpack and blue visor, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, full body, no ground, no text --ar 1:1

### 2.4. `astronaut_frozen.png` (walking with frozen joints at −80 °C)
* **Path:** `assets/sprites/astronaut_frozen.png`
* **Prompt:**
> 2D 16-bit pixel art character sprite, side profile view facing right of a freezing NASA Mars astronaut hunched forward with stiff frozen joints, light blue ice frost crystals clinging to the white EVA spacesuit and helmet visor, struggling to walk in extreme cold, crisp pixel outline, isolated on a solid pure white background #FFFFFF, full body, no ground, no text --ar 1:1

### 2.5. `astronaut_action.png` (repair / sampling / photo)
* **Path:** `assets/sprites/astronaut_action.png`
* **Prompt:**
> 2D 16-bit pixel art character sprite, side profile view facing right of a NASA Mars astronaut kneeling down on one knee holding a scientific scanner tablet and repair tool, white EVA spacesuit with backpack and blue visor, crisp pixel outline, isolated on a solid pure white background #FFFFFF, full body, no ground, no text --ar 1:1

### 2.6. `drone_ingenuity.png` (Ingenuity scout drone)
* **Path:** `assets/sprites/drone_ingenuity.png`
* **Prompt:**
> 2D 16-bit pixel art game sprite of NASA Ingenuity Mars Helicopter drone hovering, small gold-foil cubic body, top solar panel, coaxial carbon-fiber rotor blades spinning, four thin landing legs, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, centered, no text --ar 1:1

### 2.7. `rover_opportunity.png` *(done — backup prompt)*
* **Path:** `assets/sprites/rover_opportunity.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of the abandoned NASA Opportunity Mars rover, side-three-quarter view, six rocker-bogie wheels, camera mast, solar panels heavily covered in thick rusty red Martian dust, weathered worn look, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 1:1

### 2.8. `rover_spirit.png` (Spirit wreck — stuck in sand)
* **Path:** `assets/sprites/rover_spirit.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of the abandoned NASA Spirit Mars rover tilted at an awkward angle, right wheels half-buried in soft sand, dusty solar panels angled away from sun, weathered metallic chassis and camera mast, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no background scenery, no text --ar 1:1

### 2.9. `lander_phoenix.png` (Phoenix wreck — broken panel & CO2 ice)
* **Path:** `assets/sprites/lander_phoenix.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of the abandoned NASA Phoenix Mars Lander, three-legged stationary lander, one circular solar panel snapped and broken under heavy white dry ice frost, robotic digging arm frozen in place, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 1:1

### 2.10. `lander_insight.png` (InSight wreck + SEIS seismometer)
* **Path:** `assets/sprites/lander_insight.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of the abandoned NASA InSight Mars Lander, two round solar panels covered in thick red Martian dust, robotic arm, and a small copper-white dome SEIS seismometer resting right next to it, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 1:1

### 2.11. `lander_beagle2.png` (Beagle 2 bonus wreck)
* **Path:** `assets/sprites/lander_beagle2.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of the abandoned ESA Beagle 2 Mars lander, clam-shell disk-shaped probe resting on surface with only two of its four petal-shaped solar panels unfolded and the others partially closed, weathered metallic texture, crisp pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 1:1

---

## 3. `assets/structures/` — base structures and equipment (Aspect Ratio: `4:3` or `1:1`)

### 3.1. `habitat_main.png` *(done — backup prompt)*
* **Path:** `assets/structures/habitat_main.png`
* **Prompt:**
> 2D 16-bit pixel art game building asset of a sci-fi Mars dome habitat module, white and gray armored panels with light red dust weathering, heavy airlock door on the left, glowing warm yellow square viewport window in the center, roof communication dish antenna and external life-support pipes, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 4:3

### 3.2. `mav_rocket.png` (Mars Ascent Vehicle — MAV)
* **Path:** `assets/structures/mav_rocket.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of a Mars Ascent Vehicle rocket lander standing upright on four sturdy landing legs, white and orange aerospace fuselage, black heat shield nosecone, thruster nozzles at bottom, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, centered, no ground, no text --ar 1:1

### 3.3. `greenhouse_ok.png` (greenhouse module — healthy plants)
* **Path:** `assets/structures/greenhouse_ok.png`
* **Prompt:**
> 2D 16-bit pixel art game building asset of a pressurized transparent geodesic Mars greenhouse dome with white metal frame, lush vibrant green potato and tomato plants growing inside under warm pink-white LED grow lights, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 4:3

### 3.4. `greenhouse_frozen.png` (greenhouse module — frozen plants)
* **Path:** `assets/structures/greenhouse_frozen.png`
* **Prompt:**
> 2D 16-bit pixel art game building asset of a damaged Mars greenhouse dome, glass panels covered in blue-white ice frost, wilted dark brown frozen plants inside, dim cold interior, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 4:3

### 3.5. `solar_clean.png` (solar array — clean)
* **Path:** `assets/structures/solar_clean.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of an array of three deployed Martian solar panels mounted on metallic stands, clean dark blue photovoltaic cells reflecting sunlight, power cables attached, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 4:3

### 3.6. `solar_dusty.png` (solar array — dusty)
* **Path:** `assets/structures/solar_dusty.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of an array of three deployed Martian solar panels heavily coated in rusty red-orange Martian dust, dull matte surface, power cables attached, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 4:3

### 3.7. `moxie_unit.png` (MOXIE oxygen generator and RTG power unit)
* **Path:** `assets/structures/moxie_unit.png`
* **Prompt:**
> 2D 16-bit pixel art game asset of a compact NASA MOXIE oxygen generator box connected by thick insulated cables to a finned black-and-gold RTG nuclear power source, small glowing green status LEDs and pressure gauges, crisp dark pixel outline, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 1:1

---

## 4. `assets/screens/` — full-screen panel backgrounds (Aspect Ratio: `16:9`)

### 4.1. `scr_launch.png` (Sol 00 launch scene)
* **Path:** `assets/screens/scr_launch.png`
* **Prompt:**
> 2D 16-bit pixel art cinematic scene, heavy space launch rocket lifting off from a launchpad at dusk, massive roaring orange and yellow flames and billowing white exhaust smoke clouds, gantry tower beside the rocket, dramatic sunset sky, no text, no UI, no HUD --ar 16:9

### 4.2. `scr_transit.png` (Sol 01–03 space transit)
* **Path:** `assets/screens/scr_transit.png`
* **Prompt:**
> 2D 16-bit pixel art deep space scene, interplanetary spacecraft cruising through starry black space, small pale blue Earth far behind on the left, glowing red planet Mars growing larger ahead on the right, solar panels extended, clean retro sci-fi pixel art, no text, no UI, no HUD --ar 16:9

### 4.3. `scr_map_corridor.png` (02 exploration map background)
* **Path:** `assets/screens/scr_map_corridor.png`
* **Prompt:**
> 2D 16-bit pixel art angled top-down tactical terrain map of a Mars exploration corridor in Jezero Crater, rusty red canyons, craters, winding rover tracks, dusty plains, muted dark-red aesthetic suitable for UI overlay, no markers, no text, no UI, no HUD --ar 16:9

### 4.4. `scr_lab_desk.png` (04 lab experiment desk)
* **Path:** `assets/screens/scr_lab_desk.png`
* **Prompt:**
> 2D 16-bit pixel art interior of a Mars habitat science laboratory, metal workbench in foreground with a scientific pendulum apparatus, glass test tubes, and a small green oscilloscope monitor, large reinforced window in background overlooking red Mars cliffs, warm interior lighting, no text, no UI, no HUD --ar 16:9

### 4.5. `scr_downlink.png` (05 downlink comms console)
* **Path:** `assets/screens/scr_downlink.png`
* **Prompt:**
> 2D 16-bit pixel art interior of a Mars habitat communications station, astronaut sitting at a glowing telemetry computer console in side profile, large panoramic window showing dusty red Martian horizon outside, cozy dim sci-fi lighting, no text, no UI, no HUD --ar 16:9

### 4.6. `scr_habitat_cutaway.png` (06 power management habitat cutaway)
* **Path:** `assets/screens/scr_habitat_cutaway.png`
* **Prompt:**
> 2D 16-bit pixel art cross-section cutaway view of a Mars habitat base on the left side of the frame against a Martian sunset background, showing bunk bed, control terminal, glowing green hydroponic plant shelves inside, and solar panels outside, clean detailed pixel art, no text, no UI, no HUD --ar 16:9

### 4.7. `scr_sol_transition.png` (sol transition frame)
* **Path:** `assets/screens/scr_sol_transition.png`
* **Prompt:**
> 2D 16-bit pixel art cinematic landscape of Mars horizon during day-to-night transition, glowing blue sun dipping below red canyon silhouettes on the left while deep starry night sky and Phobos rise on the right, atmospheric time-lapse mood, no text, no UI, no HUD --ar 16:9

---

## 5. `assets/vfx/` — atmosphere and morale effects (Aspect Ratio: `16:9`)

### 5.1. `vfx_frost_1.png` (light visor frost)
* **Path:** `assets/vfx/vfx_frost_1.png`
* **Prompt:**
> 2D 16-bit pixel art screen overlay border of light icy frost crystals forming only along the outer four corners and edges of the frame, pale cyan and white ice patterns, completely empty pure white #FFFFFF center area, no characters, no text --ar 16:9

### 5.2. `vfx_frost_2.png` (critical visor frost)
* **Path:** `assets/vfx/vfx_frost_2.png`
* **Prompt:**
> 2D 16-bit pixel art screen overlay border of thick jagged blue-white ice frost creeping halfway inward from all edges of the helmet visor frame, small open clear pure white #FFFFFF center view, freezing cold effect, no text --ar 16:9

### 5.3. `vfx_dust_storm.png` (dust storm particle curtain)
* **Path:** `assets/vfx/vfx_dust_storm.png`
* **Prompt:**
> 2D 16-bit pixel art horizontal wind-blown Martian sand particles, swirling orange-red dust streaks and diagonal sand grains rushing across a solid pure white #FFFFFF background, dynamic motion effect, no ground, no text --ar 16:9

### 5.4. `vfx_dust_devil.png` (dust devil whirlwind)
* **Path:** `assets/vfx/vfx_dust_devil.png`
* **Prompt:**
> 2D 16-bit pixel art sprite of a tall swirling Martian dust devil mini-tornado funnel made of dusty orange and tan sand spirals, narrow base widening toward top, isolated on a solid pure white background #FFFFFF, no ground, no text --ar 1:1

### 5.5. `vfx_shadow_hallucination.png` (morale shadow figure)
* **Path:** `assets/vfx/vfx_shadow_hallucination.png`
* **Prompt:**
> 2D 16-bit pixel art eerie dark shadowy silhouette figure resembling a distant astronaut standing still with faint static glitch pixels around its edges, isolated on a solid pure white background #FFFFFF, psychological hallucination sprite, no text --ar 1:1

---

## 6. `assets/ending/` — UFO finale and cover image (Aspect Ratio: `16:9`)

### 6.1. `ufo_liftoff.png` (Sol 14 MAV liftoff scene)
* **Path:** `assets/ending/ufo_liftoff.png`
* **Prompt:**
> 2D 16-bit pixel art cinematic scene, white-and-orange Mars Ascent Vehicle rocket blasting off from the dusty red Martian surface, bright thruster exhaust flame and billowing rust-colored dust clouds below, canyon cliffs in background, no text, no UI, no HUD --ar 16:9

### 6.2. `ufo_sky.png` (mysterious UFO light on the horizon)
* **Path:** `assets/ending/ufo_sky.png`
* **Prompt:**
> 2D 16-bit pixel art sci-fi scene in high Martian twilight sky, ascending rocket in the lower left while a mysterious bright glowing anomalous light orb with a sharp angular light trail hovers impossibly still in the upper right sky, dramatic mystery mood, no text, no UI, no HUD --ar 16:9

### 6.3. `ufo_photo_clear.png` (UFO photo — 80% sharp version)
* **Path:** `assets/ending/ufo_photo_clear.png`
* **Prompt:**
> 2D 16-bit pixel art grainy high-resolution spacecraft camera photograph of an unidentified metallic triangular-disc anomaly glowing faintly against dark Martian upper atmosphere, raw telemetry sensor aesthetic, mysterious silhouette partially obscured by scanline noise at bottom, no text, no HUD --ar 16:9

### 6.4. `ufo_photo_blur.png` (UFO photo — 30% blurred version)
* **Path:** `assets/ending/ufo_photo_blur.png`
* **Prompt:**
> 2D 16-bit pixel art heavily pixelated low-resolution blurry camera photograph of a vague glowing white-cyan light smear against dark red-black sky, heavy digital static noise and incomplete data transmission scanlines covering the lower half, no text, no HUD --ar 16:9

### 6.5. `cover_thumbnail.png` (project and demo video cover image)
* **Path:** `assets/ending/cover_thumbnail.png`
* **Prompt:**
> 2D 16-bit pixel art epic key art illustration for a Mars survival game, lone NASA astronaut standing on a red rocky ridge in Jezero Crater looking toward a dome habitat and dusty Opportunity rover in the midground, dramatic Martian sunset sky with two moons and a faint mysterious glowing star on the horizon, rich cinematic lighting, no text, no logo, no UI --ar 16:9