#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash scripts/validate-deb.sh

APPIMAGE="$(ls -1t dist/*.AppImage 2>/dev/null | head -1 || true)"
if [ -n "$APPIMAGE" ]; then
  APPIMAGE="$(readlink -f "$APPIMAGE")"
  echo "==> Validating $(basename "$APPIMAGE")"
  WORK="$(mktemp -d)"
  (
    cd "$WORK"
    "$APPIMAGE" --appimage-extract >/dev/null
    DESKTOP="$(find squashfs-root -path '*/share/applications/*.desktop' | head -1)"
    if [ -z "$DESKTOP" ]; then
      DESKTOP="$(find squashfs-root -name '*.desktop' | head -1)"
    fi
    grep -F -- '--no-sandbox' "$DESKTOP" >/dev/null || {
      echo "error: AppImage desktop entry missing --no-sandbox" >&2
      exit 1
    }
  )
  rm -rf "$WORK"
  echo "OK: AppImage validated"
fi

echo "OK: all artifacts validated"
