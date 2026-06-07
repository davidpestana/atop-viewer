#!/usr/bin/env bash
# Smoke-test an atop-viewer .deb after install (container or CI host).
set -euo pipefail

DEB="${1:?usage: smoke-test-deb.sh /path/to/package.deb [--installed]}"
INSTALLED="${2:-}"

if [ "$INSTALLED" != "--installed" ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq atop xvfb desktop-file-utils ca-certificates >/dev/null
  apt-get install -y -qq "$DEB"
fi

DESKTOP=/usr/share/applications/atop-viewer.desktop
desktop-file-validate "$DESKTOP"
grep -F 'atop-viewer-launcher' "$DESKTOP" >/dev/null || {
  echo "error: installed desktop entry must launch atop-viewer-launcher" >&2
  cat "$DESKTOP" >&2
  exit 1
}

TARGET="$(readlink -f /usr/bin/atop-viewer)"
if [ "$TARGET" != '/opt/Atop Viewer/atop-viewer-launcher' ]; then
  echo "error: /usr/bin/atop-viewer -> $TARGET (expected launcher wrapper)" >&2
  exit 1
fi

MISSING="$(ldd '/opt/Atop Viewer/atop-viewer' | grep 'not found' || true)"
if [ -n "$MISSING" ]; then
  echo "error: packaged binary has missing libraries:" >&2
  echo "$MISSING" >&2
  exit 1
fi

set +e
OUTPUT="$(xvfb-run -a timeout 12 atop-viewer 2>&1)"
STATUS=$?
set -e

if echo "$OUTPUT" | grep -q 'SUID sandbox helper binary was found'; then
  echo "error: packaged app still hits chrome-sandbox fatal:" >&2
  echo "$OUTPUT" >&2
  exit 1
fi

if [ "$STATUS" -ne 0 ] && [ "$STATUS" -ne 124 ]; then
  echo "error: atop-viewer smoke launch failed (exit $STATUS):" >&2
  echo "$OUTPUT" >&2
  exit 1
fi

echo "smoke test passed"
