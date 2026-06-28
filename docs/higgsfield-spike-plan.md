# Higgsfield spike plan

Higgsfield is an **auxiliary** tool for visual exploration (concept art, asset ideas, short videos) only. It is **not** the game engine or a source of truth, and **never** a source for legal, safety, construction, or normative content. No MCP server or external generation tool may be invoked without explicit user approval. See `docs/adr/0005-higgsfield-as-auxiliary-tool-only.md`.

## Test prompt (example, not yet run)

> "Isometric illustration of a small Madrid flat mid-renovation: bare brick wall, dust sheets, a stepladder, warm neutral palette, clean flat-vector style, no text."

## Expected output

2–4 still concept images of an apartment/room in a consistent flat-vector style usable as mood reference for placeholder replacement.

## Evaluation criteria

- Output is **editable** (vector or clean raster we can modify).
- Output can be **versioned** in Git (reasonable file size).
- Licensing is **clear** and compatible with possible future commercial use.
- Asset **provenance** documented (prompt, model, settings, date).
- **Cost** in credits is known and acceptable before running.
- Results are **reproducible** enough to regenerate variants.
- The project can fully continue **without** Higgsfield.

## Go / No-Go decision table

| Criterion    | Go if…                 | No-Go if…            |
| ------------ | ---------------------- | -------------------- |
| Editable     | vector/clean raster    | locked/opaque format |
| Versionable  | small, diffable enough | huge binaries        |
| Licensing    | clear, commercial-ok   | unclear/restrictive  |
| Provenance   | fully recorded         | unknown              |
| Cost         | within agreed cap      | exceeds cap          |
| Reproducible | variants regenerable   | one-off only         |
| Independence | game works without it  | creates a dependency |

Default to **No-Go** if any row is No-Go.

## Cost-risk notes

Credits are a real cost. Set a maximum spend per spike before starting. Treat all output as throwaway until it passes the table.

## Rollback plan

Placeholders (coloured rectangles, CSS panels, text) remain the default art. If a spike is No-Go or any asset later proves problematic, delete the generated assets; nothing in gameplay depends on them. Log every run in `docs/mcp-usage-log.md`.

## Decision log

_No spike has been run. No Higgsfield output is in the repository._
