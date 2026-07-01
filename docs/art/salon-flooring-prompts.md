# Seedream 4.0 prompts — Salón flooring module (Phase 1 slice)

Goal: two images of the **same** living room — **before** (old worn floor) and **after** (new floor) — that are **pixel-aligned** so swapping them reads as a transformation, not two different rooms. We get alignment by generating the _after_ as an **in-context edit** of the _before_.

> ⚠️ Before shipping any of this, confirm Seedream/ByteDance **commercial-use + output-ownership** terms and record it in `assets-register.json`. Until then it's prototype art.

---

## 0) Settings (use for every image, every room)

- **Aspect ratio:** 1:1 (square). **Resolution:** the highest free option (2K/4096 if available).
- **Seed:** pick one number and **write it down** (e.g. `73415`); reuse it for this room so retries stay consistent.
- **Background:** plain, soft, neutral — NOT transparent (Seedream transparency is unreliable; we'll mask in-engine if needed).
- Generate **4 variations** of the _before_, pick the cleanest, then derive the _after_ from that exact image.

## 1) STYLE BIBLE — paste this block verbatim into EVERY prompt (this is what keeps all rooms consistent)

```
Isometric-lite flat illustration of a single room, TRUE 2:1 isometric (dimetric) projection, fixed 30-degree top-down camera angle, modern clean vector game-art style, soft flat cel shading with gentle ambient occlusion, smooth matte surfaces, thin consistent dark outlines, minimal but readable detail, cozy modest Madrid apartment, warm cohesive palette (off-white walls #F2ECE3, light oak wood, muted terracotta and sage-green accents), soft warm daylight coming from a window, even soft lighting with no harsh shadows, centered single room with two back walls forming an L-shape (open front, "dollhouse" cutaway), plain soft neutral background #EDE7DD, crisp clean edges, high quality.
```

## 2) BEFORE prompt {#before}

Paste the **STYLE BIBLE**, then append:

```
SCENE: a modest Madrid living room (salón). Two back walls in an L; the right-hand wall has one simple window letting in soft daylight. A small, slightly worn fabric sofa sits against the left wall; a low side table. The CENTER of the room is deliberately empty to show the floor clearly.
FOCUS — THE FLOOR (this is the "before"): old, dated, worn flooring — scuffed dark parquet with visible wear paths, a few dull stains, faded and uneven finish, a couple of lifted/gapped boards. The walls are plain off-white and slightly aged. The room feels tired but honest, not dirty or ruined.
COMPOSITION: full room visible, centered, square framing, generous margin around the room.
```

## 3) AFTER prompt {#after} — run as an EDIT, with the chosen BEFORE image as the reference/input

Upload your chosen _before_ image as the edit input, paste the **STYLE BIBLE**, then append:

```
EDIT THIS IMAGE. Keep the ENTIRE room exactly as in the reference: identical walls, window, sofa, side table, all furniture positions, the camera angle, the isometric projection, the lighting, the palette, the background, and the framing — pixel-for-pixel the same.
CHANGE ONLY THE FLOOR: replace the old worn parquet with brand-new, clean light-oak laminate flooring — even, uniform planks laid in one direction, fresh matte finish, subtle natural wood grain, no scuffs or stains, neatly fitted to the same floor boundary as the original.
Do not move, add, or remove anything else. The result must align with the original so it works as a before/after pair.
```

## 4) NEGATIVE prompt — paste into the negative field for both

```
photorealistic, photograph, realistic render, 3D render noise, one-point perspective, two-point perspective, vanishing point, fisheye, wide-angle distortion, tilted horizon, warped proportions, people, person, character, hands, faces, pets, text, words, letters, numbers, captions, watermark, signature, logo, UI elements, buttons, clutter, mess, extra rooms, multiple floors, staircase, ceiling, busy wallpaper patterns, harsh shadows, dramatic lighting, lens flare, bloom, motion blur, blurry, low resolution, jpeg artifacts, oversaturated, neon colors, grunge, dirt, horror.
```

## 5) Consistency protocol (for THIS room and every future room)

1. Use the **same STYLE BIBLE block verbatim** every time. It is the single biggest lever for cross-room consistency.
2. Reuse the **same seed** within a room. For a new room, you may keep the seed or pick a new one, but **always** include the style bible.
3. Always make the **after** an **edit of the before** — never a fresh generation — so geometry/lighting stay locked.
4. From the **second room onward**, also attach the **first finished room image** as an extra style reference and add: `match the art style, line weight, palette and lighting of the reference image`.
5. Keep the **camera phrase identical** ("TRUE 2:1 isometric, fixed 30-degree angle") — drifting the angle is the #1 cause of misaligned rooms.

## 6) Deliver back

Download both as PNG named exactly:

- `salon-floor-before.png`
- `salon-floor-after.png`

Drop them in `public/assets/rooms/salon/` (I'll create the folder) or just hand them to me. I'll wire them into the Phaser room as the before/after layers and update `assets-register.json` with the date + seed.

> Seedance (video) isn't needed for static room art. If we later want a 1–2s "transform" flourish, we can revisit — but a clean layer swap is the plan.
