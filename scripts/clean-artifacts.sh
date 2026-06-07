#!/usr/bin/env bash
# Remove local build artifacts and test leftovers (safe; keeps latest .deb/.AppImage by default).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

KEEP="${1:-1}"

echo "Cleaning atop-viewer artifacts in $ROOT"

rm -rf "$ROOT/dist/linux-unpacked" "$ROOT/squashfs-root" /tmp/sq 2>/dev/null || true

if [ -d "$ROOT/dist" ]; then
  mapfile -t DEBS < <(ls -1t "$ROOT/dist"/*.deb 2>/dev/null || true)
  mapfile -t APPIMAGES < <(ls -1t "$ROOT/dist"/*.AppImage 2>/dev/null || true)

  idx=0
  for f in "${DEBS[@]:-}"; do
    idx=$((idx + 1))
    if [ "$idx" -gt "$KEEP" ]; then
      echo "remove ${f#$ROOT/}"
      rm -f "$f"
    fi
  done

  idx=0
  for f in "${APPIMAGES[@]:-}"; do
    idx=$((idx + 1))
    if [ "$idx" -gt "$KEEP" ]; then
      echo "remove ${f#$ROOT/}"
      rm -f "$f"
    fi
  done
fi

echo "Done. dist usage:"
du -sh "$ROOT/dist" 2>/dev/null || echo "(empty)"
