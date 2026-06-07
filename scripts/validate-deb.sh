#!/usr/bin/env bash
# Validates .deb / AppImage artifacts before publishing or manual install.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEB="${1:-}"
if [ -z "$DEB" ]; then
  DEB="$(ls -1t dist/*.deb 2>/dev/null | head -1 || true)"
fi

if [ -z "$DEB" ] || [ ! -f "$DEB" ]; then
  echo "error: no .deb found (build with npm run dist:linux first)" >&2
  exit 1
fi

DEB="$(readlink -f "$DEB")"

echo "==> Validating $(basename "$DEB")"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

extract_control() {
  local deb="$1"
  local dest="$2"
  (cd "$dest" && ar x "$deb" && tar xf control.tar.*)
}

extract_control "$DEB" "$WORK"

DATA="$WORK/data.tar"
case "$DEB" in
  *.deb)
    (cd "$WORK" && ar x "$DEB" && tar xf data.tar.*)
    ;;
esac

DESKTOP="$WORK/opt/Atop Viewer/usr/share/applications/atop-viewer.desktop"
if [ ! -f "$DESKTOP" ]; then
  DESKTOP="$(find "$WORK" -path '*/share/applications/atop-viewer.desktop' | head -1)"
fi
if [ ! -f "$DESKTOP" ]; then
  echo "error: atop-viewer.desktop not found in package" >&2
  exit 1
fi

echo "-- desktop-file-validate"
desktop-file-validate "$DESKTOP"

echo "-- postinst must install launcher wrapper"
grep -q 'atop-viewer-launcher' "$WORK/postinst" || {
  echo "error: postinst missing launcher script" >&2
  exit 1
}
grep -q 'update-alternatives --set' "$WORK/postinst" || {
  echo "error: postinst must force alternatives to launcher" >&2
  exit 1
}
grep -q 'ozone-platform=x11' "$WORK/postinst" || {
  echo "error: postinst launcher missing --ozone-platform=x11" >&2
  exit 1
}
grep -q 'env -i' "$WORK/postinst" || {
  echo "error: postinst launcher must use clean env (env -i)" >&2
  exit 1
}

echo "-- packaged binary must exist"
find "$WORK" -path '*/Atop Viewer/atop-viewer' -type f | grep -q . || {
  echo "error: main binary missing in package" >&2
  exit 1
}

if [ "${SKIP_DEB_SMOKE:-}" = "1" ]; then
  echo "==> Skipping install smoke test (SKIP_DEB_SMOKE=1)"
  echo "OK: static validation passed"
  exit 0
fi

if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
  echo "-- CI host install smoke test"
  sudo apt-get update -qq
  sudo apt-get install -y -qq atop xvfb desktop-file-utils >/dev/null
  sudo apt-get install -y -qq "$DEB"
  sudo bash scripts/smoke-test-deb.sh "$DEB" --installed
  echo "OK: all package validations passed"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "warn: docker not available; static checks only" >&2
  echo "OK: static validation passed"
  exit 0
fi

echo "-- container install smoke test (Ubuntu 24.04)"
docker run --rm \
  -v "$DEB:/pkg.deb:ro" \
  -v "$ROOT/scripts/smoke-test-deb.sh:/smoke.sh:ro" \
  ubuntu:24.04 \
  bash /smoke.sh /pkg.deb --installed
