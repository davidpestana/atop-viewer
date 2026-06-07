#!/usr/bin/env bash
# Patch .deb so menu entry and shipped launcher match (no postinst sed required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEB="${1:-}"
if [ -z "$DEB" ]; then
  DEB="$(ls -1t "$ROOT/dist"/*.deb 2>/dev/null | head -1 || true)"
fi
[ -n "$DEB" ] && [ -f "$DEB" ] || { echo "error: no .deb to patch" >&2; exit 1; }
DEB="$(readlink -f "$DEB")"

WORK="$(mktemp -d)"
PKG="$WORK/pkg"
trap 'rm -rf "$WORK"' EXIT

dpkg-deb -R "$DEB" "$PKG"
install -m 755 "$ROOT/build/atop-viewer-launcher" "$PKG/opt/Atop Viewer/atop-viewer-launcher"
install -m 644 "$ROOT/build/atop-viewer.desktop" "$PKG/usr/share/applications/atop-viewer.desktop"
dpkg-deb -b "$PKG" "$DEB"

echo "patched $(basename "$DEB")"
