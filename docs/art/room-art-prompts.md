# Room art prompts — Reforma Quest Madrid (single source for ALL room images)

This is the **one** document to generate every room image the game needs, in a single consistent style, on the **Seedream 4.0** website (free, unlimited). It supersedes ad-hoc prompting: `salon-flooring-prompts.md` remains the proven origin, and its STYLE BIBLE / NEGATIVE / Settings / Consistency Protocol are reproduced here **verbatim** so this file is self-contained.

Goal for every room: a **before** and an **after** of the **same** room that are **pixel-aligned** so swapping them reads as a transformation, not two different rooms. We get alignment by generating the _after_ as an **in-context edit** of the _before_. Where a room has multiple modules, each new module's _before_ is an **edit of the previous module's _after_**, so the room visibly accumulates its finished work.

> ⚠️ Before shipping any of this, confirm Seedream/ByteDance **commercial-use + output-ownership** terms and record it in `assets-register.json`. Until then it's prototype art. **This licence question is still a release blocker — do not overstate the licence.**

---

## Section 0 — How to use this doc (settings + the golden rules)

### Settings (use for every image, every room)

- **Aspect ratio:** 1:1 (square). **Resolution:** the highest free option (2K/4096 if available).
- **Seed:** pick one number **per room** and **write it down**; reuse it for that room so retries stay consistent. Record it in `assets-register.json` when the asset ships. (Salón used `73415`.)
- **Background:** plain, soft, neutral — NOT transparent (Seedream transparency is unreliable; we'll mask in-engine if needed).
- Generate **4 variations** of the _before_, pick the cleanest, then derive the _after_ from that exact image.

### The golden rules

1. **STYLE BIBLE is mandatory and verbatim.** Paste the Section 1 block into **every** prompt (before and after, every room). It is the single biggest lever for cross-room consistency.
2. **NEGATIVE is mandatory.** Paste the Section 2 block into the negative field for **every** generation.
3. **After = edit of before.** The _after_ is **always** an in-context EDIT of the chosen _before_ image — never a fresh generation. Keep the whole room pixel-for-pixel identical and change ONLY the focus.

### The CUMULATIVE rule (multi-module rooms)

Some rooms have more than one renovation module done in sequence (e.g. **Salón** does the **floor** first, then the **lighting**). The finished work from earlier modules must **stay present** in later modules:

- A module's **BEFORE** image is an **EDIT of the PREVIOUS module's AFTER** image — not a fresh room, and not the original room.
- So when the player later changes the lighting in the salón, the **new oak floor is still there**; the room accumulates its finished state module by module.
- Concretely for Salón: `salon-light-before` is an **edit of `salon-floor-after`** (same room, new floor already laid), and `salon-light-after` is an edit of `salon-light-before`.

### The CROSS-ROOM consistency rule (from room 2 onward)

From the **second room onward** (Dormitorio, Cocina, Baño, Recibidor), in addition to the STYLE BIBLE:

- Attach the finished **`salon-floor-after`** image as an **extra style reference**, and
- Add this line to the prompt: `match the art style, line weight, palette and lighting of the reference image`.

This keeps every new room locked to the look established by the first shipped room.

---

## Section 1 — STYLE BIBLE (paste this block verbatim into EVERY prompt)

This is copied **verbatim** from `salon-flooring-prompts.md`. Do not edit it — it is the locked style anchor for the whole game.

```
Isometric-lite flat illustration of a single room, TRUE 2:1 isometric (dimetric) projection, fixed 30-degree top-down camera angle, modern clean vector game-art style, soft flat cel shading with gentle ambient occlusion, smooth matte surfaces, thin consistent dark outlines, minimal but readable detail, cozy modest Madrid apartment, warm cohesive palette (off-white walls #F2ECE3, light oak wood, muted terracotta and sage-green accents), soft warm daylight coming from a window, even soft lighting with no harsh shadows, centered single room with two back walls forming an L-shape (open front, "dollhouse" cutaway), plain soft neutral background #EDE7DD, crisp clean edges, high quality.
```

---

## Section 2 — NEGATIVE prompt (paste into the negative field for every generation)

This is copied **verbatim** from `salon-flooring-prompts.md`.

```
photorealistic, photograph, realistic render, 3D render noise, one-point perspective, two-point perspective, vanishing point, fisheye, wide-angle distortion, tilted horizon, warped proportions, people, person, character, hands, faces, pets, text, words, letters, numbers, captions, watermark, signature, logo, UI elements, buttons, clutter, mess, extra rooms, multiple floors, staircase, ceiling, busy wallpaper patterns, harsh shadows, dramatic lighting, lens flare, bloom, motion blur, blurry, low resolution, jpeg artifacts, oversaturated, neon colors, grunge, dirt, horror.
```

---

## Section 3 — Per-image prompts

Each subsection is one asset pair. For each: paste the **STYLE BIBLE** (Section 1), then the **BEFORE** block; for the after, upload the chosen before as the edit input, paste the STYLE BIBLE, then the **AFTER (edit)** block. Always paste the **NEGATIVE** (Section 2) into the negative field. Only ever depict the **finished visible result** — never people, text, tools, exposed wiring/pipes, or any "how-to" of regulated work.

---

### 3.1 — Salón · Flooring module ✅ DONE (canonical example / style anchor)

- **Assets:** `salon-floor-before.png`, `salon-floor-after.png`
- **Folder:** `public/assets/rooms/salon/`
- **roomId:** `salon` · **Seed:** `73415`
- **STATUS:** ✅ **DONE** — already generated and wired into the game. Reproduced here as the canonical example and style anchor. The _after_ is **clean light-oak laminate laid over the worn dark parquet**.

**BEFORE** — paste STYLE BIBLE, then:

```
SCENE: a modest Madrid living room (salón). Two back walls in an L; the right-hand wall has one simple window letting in soft daylight. A small, slightly worn fabric sofa sits against the left wall; a low side table. The CENTER of the room is deliberately empty to show the floor clearly.
FOCUS — THE FLOOR (this is the "before"): old, dated, worn flooring — scuffed dark parquet with visible wear paths, a few dull stains, faded and uneven finish, a couple of lifted/gapped boards. The walls are plain off-white and slightly aged. The room feels tired but honest, not dirty or ruined.
COMPOSITION: full room visible, centered, square framing, generous margin around the room.
```

**AFTER (edit of the chosen before)** — upload the before, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE room exactly as in the reference: identical walls, window, sofa, side table, all furniture positions, the camera angle, the isometric projection, the lighting, the palette, the background, and the framing — pixel-for-pixel the same.
CHANGE ONLY THE FLOOR: replace the old worn parquet with brand-new, clean light-oak laminate flooring — even, uniform planks laid in one direction, fresh matte finish, subtle natural wood grain, no scuffs or stains, neatly fitted to the same floor boundary as the original.
Do not move, add, or remove anything else. The result must align with the original so it works as a before/after pair.
```

---

### 3.2 — Salón · Lighting module ⚠️ NEEDED NOW

- **Assets:** `salon-light-before.png`, `salon-light-after.png`
- **Folder:** `public/assets/rooms/salon/`
- **roomId:** `salon` · **Seed:** `73415` (same room, same seed)
- **STATUS:** ⚠️ **NEEDED NOW**
- **CRITICAL — CUMULATIVE:** generate `salon-light-before` as an **in-context EDIT of the finished `salon-floor-after`** image (same room, the **new oak floor already in place**). Do **not** start from the original worn-floor room, and do **not** generate fresh. This is the second Salón module, so the floor work must persist.

**BEFORE** — upload **`salon-floor-after`** as the edit input, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE room exactly as in the reference: the same L-shaped back walls, the same window, the same fabric sofa and low side table in their exact positions, the SAME new clean light-oak laminate floor already laid, the same camera angle, isometric projection, palette, background and framing — pixel-for-pixel the same.
CHANGE ONLY THE LIGHTING (this is the "before" of the lighting module): the room is poorly lit. A single weak, bare ceiling bulb hangs from the middle of the ceiling giving one small, thin pool of light; the corners of the room fall away into gloomy, under-lit shadow; there is no wall lighting, no lamps, no accent light. The overall feel is dim, flat and a little cold, like a gloomy late afternoon with the daylight fading, the room reading as uneven patches of murky light and dark. Keep the new oak floor clearly visible and unchanged.
FOCUS — THE CEILING AND THE UNEVEN LIGHT: draw the eye to the plain ceiling with its single tired bulb and to the blotchy, uneven pools of illumination across the room.
Do not move, add, or remove any furniture. The result must align with the reference so it works as a before/after pair.
```

**AFTER (edit of the before)** — upload the chosen `salon-light-before`, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE room exactly as in the reference: identical L-shaped walls, window, sofa, low side table, all furniture positions, the SAME new light-oak laminate floor, the camera angle, isometric projection, palette, background and framing — pixel-for-pixel the same.
CHANGE ONLY THE LIGHTING: give the room a considered, professionally finished lighting scheme. Several neat flush ceiling light points are spread evenly across the ceiling over the seating zone and over the table zone, plus a soft warm accent glow low on the walls, so the whole room is filled with warm, even, layered illumination — no dark corners, no single harsh pool. The light is warm and gentle, the room reads as bright, cosy and inviting, evenly lit from edge to edge. The ceiling is clean and neatly finished; all wiring is completely hidden.
Show ONLY the finished, polished result — no bulbs on cords, no wires, no tools, no fittings mid-installation, no how-to detail. Do not move, add, or remove any furniture. The result must align with the before so it works as a before/after pair.
```

> Context: this represents work carried out by a **licensed electrician**. The image shows only the finished, tidy result — never wiring, tools, junctions, or the act of installation.

---

### 3.3 — Dormitorio · Paint module ⚠️ NEEDED NOW

- **Assets:** `dormitorio-paint-before.png`, `dormitorio-paint-after.png`
- **Folder:** `public/assets/rooms/dormitorio/`
- **roomId:** `dormitorio` · **Seed:** pick a **new** number and write it down (this is a new room).
- **STATUS:** ⚠️ **NEEDED NOW** — module already built, art pending.
- **CROSS-ROOM:** this is room 2, so also **attach `salon-floor-after`** as an extra style reference and include `match the art style, line weight, palette and lighting of the reference image` in the before prompt.

**BEFORE** — paste STYLE BIBLE, attach `salon-floor-after` as a style reference, then:

```
SCENE: a modest Madrid bedroom (dormitorio). Two back walls in an L. A simple double bed with plain bedding sits against the back wall, its headboard centred; a small wooden nightstand beside it. The right-hand wall has one simple window letting in soft, calm daylight. The floor is plain, tidy and unremarkable — this room is about the WALLS, so keep the floor simple and let it recede.
FOCUS — THE WALLS (this is the "before"): the walls are tired and dated. Their colour is a dull, drab, slightly cold tone that feels aged and joyless; the surface is scuffed with a few scattered marks and scuffs, and there is one faint discoloured patch where something once hung or leaked. The skirting boards look slightly aged and dull. The room is honest and liveable, not dirty or ruined — just visibly overdue a fresh coat.
COMPOSITION: full room visible, centered, square framing, generous margin around the room.
match the art style, line weight, palette and lighting of the reference image
```

**AFTER (edit of the chosen before)** — upload the before, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE room exactly as in the reference: identical L-shaped walls, window, bed, bedding, nightstand, the floor, all furniture positions, the camera angle, isometric projection, palette family, background and framing — pixel-for-pixel the same.
CHANGE ONLY THE WALLS: they have been freshly and evenly repainted in a calm, warm neutral — a soft off-white carried by a gentle warm undertone (a whisper of warm sage or soft warm beige), fresh and matte and uniform. Every scuff, mark and the old discoloured patch is completely gone. The paint meets the ceiling and the skirting in crisp, clean, straight edges; the skirting looks freshly finished. The room now feels calm, bright, and cared-for.
Show ONLY the finished, even result — no brushes, rollers, tape, tins, drips, ladders or any how-to detail. Do not move, add, or remove anything else. The result must align with the before so it works as a before/after pair.
```

> Context: this is **safe DIY painting**. Show only the finished, evenly painted result.

---

### 3.4 — Cocina · Plumbing module 🔵 PLANNED

- **Assets:** `cocina-plumbing-before.png`, `cocina-plumbing-after.png`
- **Folder:** `public/assets/rooms/cocina/`
- **roomId:** `cocina` · **Seed:** pick a **new** number and write it down.
- **STATUS:** 🔵 **PLANNED**
- **CROSS-ROOM:** attach `salon-floor-after` as an extra style reference and include the match line.

**BEFORE** — paste STYLE BIBLE, attach `salon-floor-after` as a style reference, then:

```
SCENE: a small, modest Madrid kitchen (cocina). Two back walls in an L. Along the walls runs an L of dated kitchen units — plain wall cabinets above and base cabinets below in a tired, old-fashioned finish. A worktop runs along the base units. Under the window on the right-hand wall sits an old sink. The finishes throughout are worn and a little dated. Keep the layout clear and readable.
FOCUS — THE SINK, WORKTOP AND SINK ZONE (this is the "before"): the worktop is tired, dull and marked, its surface aged and its edges worn; the old sink beneath the window looks dated, dull and past its best. This whole counter-and-sink zone reads as the oldest, most worn part of the kitchen. The room is honest and functional, not filthy or ruined.
COMPOSITION: full room visible, centered, square framing, generous margin around the room.
match the art style, line weight, palette and lighting of the reference image
```

**AFTER (edit of the chosen before)** — upload the before, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE kitchen exactly as in the reference: identical L-shaped walls, window, the same cabinet layout above and below, all unit positions, the camera angle, isometric projection, palette family, background and framing — pixel-for-pixel the same.
CHANGE ONLY THE WORKTOP AND SINK AREA: a tidy, renewed worktop in a clean fresh finish runs neatly along the base units, and a clean modern sink sits under the window, neatly fitted and squarely aligned. The surfaces are fresh, even and well finished, sitting flush and true. Everything else in the kitchen stays exactly the same.
Show ONLY the finished, fitted result — no exposed pipes, no plumbing, no tools, no fittings mid-installation, no how-to detail. Do not move, add, or remove anything else. The result must align with the before so it works as a before/after pair.
```

> Context: this represents work done by a **plumber**. Show only the finished, fitted result — never exposed pipes, tools, or installation steps.

---

### 3.5 — Baño · Waterproofing / tiling module 🔵 PLANNED

- **Assets:** `bano-waterproof-before.png`, `bano-waterproof-after.png`
- **Folder:** `public/assets/rooms/bano/`
- **roomId:** `bano` · **Seed:** pick a **new** number and write it down.
- **STATUS:** 🔵 **PLANNED**
- **CROSS-ROOM:** attach `salon-floor-after` as an extra style reference and include the match line.

**BEFORE** — paste STYLE BIBLE, attach `salon-floor-after` as a style reference, then:

```
SCENE: a small, modest Madrid bathroom (baño). Two back walls in an L. On one wall a simple wet area / shower zone with a basin nearby; dated wall tiles cover the walls around the wet zone. Keep it modest, clean-lined and readable.
FOCUS — THE WET AREA AND ITS TILING (this is the "before"): the wall tiles around the shower and basin are dated and dull, their colour and pattern old-fashioned; the shower / wet zone looks tired and worn, with subtle signs of ageing around the wet area — faint dulling and discolouration at the edges and grout lines that read as "this has seen years of use". The room is honest and liveable, not filthy, mouldy or ruined — just visibly overdue for renewal.
COMPOSITION: full room visible, centered, square framing, generous margin around the room.
match the art style, line weight, palette and lighting of the reference image
```

**AFTER (edit of the chosen before)** — upload the before, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE bathroom exactly as in the reference: identical L-shaped walls, the basin, the overall layout and fixture positions, the camera angle, isometric projection, palette family, background and framing — pixel-for-pixel the same.
CHANGE ONLY THE SHOWER / WET AREA AND ITS TILING: fresh, renewed wall tiling in a clean light finish surrounds a sound, well-made shower area that clearly looks dry, sealed and well finished — crisp even tiles, clean grout lines, a neat and watertight wet zone. Everything else in the bathroom stays exactly the same.
Show ONLY the finished, sealed result — no tools, no adhesive, no membranes, no fittings mid-installation, no how-to detail. Do not move, add, or remove anything else. The result must align with the before so it works as a before/after pair.
```

> Context: this represents **waterproofing / tiling done by a professional**. Show only the finished, clearly dry and well-sealed result — never the process.

---

### 3.6 — Recibidor · Entrance-hall refresh 🔵 PLANNED (low priority)

- **Assets:** `recibidor-before.png`, `recibidor-after.png`
- **Folder:** `public/assets/rooms/recibidor/`
- **roomId:** `recibidor` · **Seed:** pick a **new** number and write it down.
- **STATUS:** 🔵 **PLANNED (low priority)** — this room hosts a "reading the quote" process module, so its art is secondary.
- **CROSS-ROOM:** attach `salon-floor-after` as an extra style reference and include the match line.

**BEFORE** — paste STYLE BIBLE, attach `salon-floor-after` as a style reference, then:

```
SCENE: a small, modest Madrid entrance hall (recibidor). Two back walls in an L forming a narrow, bare space. A dated ceiling light hangs above; the walls are empty and plain. The space is a little unwelcoming and dim, honest but joyless — the first thing you'd see stepping into the flat, and it doesn't yet say "welcome".
FOCUS — THE OVERALL BARE, DIM ENTRANCE (this is the "before"): plain empty walls in a dull, tired tone, a dated and weak light, an uninviting, slightly gloomy feel. Keep it modest and clean-lined, not dirty or ruined.
COMPOSITION: full room visible, centered, square framing, generous margin around the room.
match the art style, line weight, palette and lighting of the reference image
```

**AFTER (edit of the chosen before)** — upload the before, paste STYLE BIBLE, then:

```
EDIT THIS IMAGE. Keep the ENTIRE entrance hall exactly as in the reference: identical L-shaped walls, the overall layout, the camera angle, isometric projection, palette family, background and framing — pixel-for-pixel the same.
CHANGE ONLY the finish and mood to make it tidy and welcoming: the walls now wear a fresh, even coat in a calm warm neutral; the light is warmer and softer, filling the hall with a gentle, inviting glow; the entrance reads as clean, uncluttered and cared-for. Everything else stays exactly the same.
Show ONLY the finished, welcoming result — no tools, no clutter, no how-to detail. Do not move, add, or remove anything else. The result must align with the before so it works as a before/after pair.
```

---

## Section 4 — Delivery & optimization workflow

- Save each generated image as a **PNG** named **exactly** `<assetId>.png` (e.g. `salon-light-before.png`) into `public/assets/rooms/<roomId>/`. Folders will be created as needed. Or just hand the PNG files over.
- **You do NOT need to optimize.** Generate at **max quality** and save the PNG. Claude (or you) then runs the optimization step that **downscales to 1280px and converts to WebP** — `npm run art:optimize` (which runs `scripts/optimize-art.sh`, an ffmpeg wrapper). It converts every `*.png` under `public/assets/rooms/` to a `.webp` and removes the heavy PNG. The game loads the `.webp`. (This is exactly what happened to the salón floor: the 4096px PNGs became `salon-floor-before.webp` / `salon-floor-after.webp`, ~15× smaller.)
- Record each **shipped** asset's **seed + date** in `src/content/assets/assets-register.json` (mirror the existing entries; set `status`, `dateGenerated`, and `promptRef` pointing at this doc's subsection).
- ⚠️ **Licence is still a release blocker.** The Seedream/ByteDance **commercial-use / output-ownership** terms must be confirmed and recorded before any of this ships. Do not overstate the licence — until confirmed, all of it is prototype art.

---

## Section 5 — Consistency protocol (for every room, adapted from the salón module)

1. Use the **same STYLE BIBLE block verbatim** every time (Section 1). It is the single biggest lever for cross-room consistency.
2. Reuse the **same seed** within a room. For a new room, pick a new seed and **write it down**, but **always** include the style bible.
3. Always make the **after** an **edit of the before** — never a fresh generation — so geometry/lighting stay locked.
4. For a **multi-module room**, make each new module's **before** an **edit of the PREVIOUS module's after**, so finished work accumulates (e.g. `salon-light-before` is an edit of `salon-floor-after` — the new oak floor stays present when we change the lighting).
5. From the **second room onward**, also attach the **finished `salon-floor-after` image** as an extra style reference and add: `match the art style, line weight, palette and lighting of the reference image`.
6. Keep the **camera phrase identical** ("TRUE 2:1 isometric, fixed 30-degree angle") — drifting the angle is the #1 cause of misaligned rooms.
7. Always paste the **NEGATIVE prompt** (Section 2) into the negative field, every generation.
8. Only ever depict the **finished, visible result**. Never people, text, tools, exposed wiring/pipes, membranes, or any "how-to" of regulated work — the game shows outcomes, not construction methods.

> Seedance (video) isn't needed for static room art. If we later want a 1–2s "transform" flourish, we can revisit — but a clean layer swap is the plan.
