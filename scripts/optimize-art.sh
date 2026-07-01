#!/usr/bin/env bash
# Optimize room art for the web: downscale source PNGs to 1280px WebP.
#
# The artist generates max-quality PNGs (Seedream, ~4096px) and drops them into
# public/assets/rooms/<roomId>/<assetId>.png. This converts each PNG to a
# 1280px WebP (q90) — roughly 15x smaller and visually lossless for flat
# cel-shaded art — and removes the heavy PNG so it never lands in git history.
# The game loads .webp (see src/game/ui/spatial-ui.ts:artUrl).
#
# Requires ffmpeg (with libwebp). Usage:
#   bash scripts/optimize-art.sh                          # all rooms
#   bash scripts/optimize-art.sh public/assets/rooms/salon # one room
set -euo pipefail

ROOT="${1:-public/assets/rooms}"
SIZE=1280
QUALITY=90

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "error: ffmpeg not found (needed for WebP conversion)." >&2
  echo "Install ffmpeg, or hand the PNGs to the maintainer to optimize." >&2
  exit 1
fi

found=0
while IFS= read -r -d '' png; do
  found=1
  webp="${png%.png}.webp"
  echo "→ $(basename "$png")  →  $(basename "$webp")"
  ffmpeg -y -loglevel error -i "$png" \
    -vf "scale=${SIZE}:${SIZE}:flags=lanczos" \
    -c:v libwebp -quality "${QUALITY}" -compression_level 6 "$webp"
  rm -f "$png"
done < <(find "$ROOT" -type f -name '*.png' -print0)

if [ "$found" -eq 0 ]; then
  echo "No PNGs to optimize under $ROOT (already WebP?)."
else
  echo "Done. Remember to record each new asset in src/content/assets/assets-register.json."
fi
