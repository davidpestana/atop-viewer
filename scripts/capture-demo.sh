#!/usr/bin/env bash
# Capture README / GitHub Pages demo assets using the built Electron app.
# Cypress targets browsers only; this uses Electron capturePage (reliable on Linux).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f out/main/index.js ]]; then
  echo "Run npm run build first." >&2
  exit 1
fi

GIF=0
for arg in "$@"; do
  if [[ "$arg" == "--gif" ]]; then GIF=1; fi
done

OUT_DIR="$ROOT/docs/assets"
PNG="$OUT_DIR/demo.png"
mkdir -p "$OUT_DIR"

CAPTURE_ENV=(
  ATOP_VIEWER_CAPTURE=1
  ATOP_VIEWER_CAPTURE_LOCALE=en
  ATOP_VIEWER_CAPTURE_PATH="$PNG"
)

if [[ "$GIF" == "1" ]]; then
  CAPTURE_ENV+=(ATOP_VIEWER_CAPTURE_GIF="$OUT_DIR/demo.gif")
fi

echo "Capturing to $PNG${GIF:+ and $OUT_DIR/demo.gif} ..."
echo "Close other Atop Viewer windows if capture hangs."

exec env -i \
  "${CAPTURE_ENV[@]}" \
  HOME="$HOME" \
  USER="${USER:-$(whoami)}" \
  LOGNAME="${LOGNAME:-$(whoami)}" \
  SHELL="${SHELL:-/bin/bash}" \
  PATH="${PATH:-/usr/local/bin:/usr/bin:/bin}" \
  DISPLAY="${DISPLAY:-:0}" \
  XAUTHORITY="${XAUTHORITY:-}" \
  XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}" \
  DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/bus}" \
  "$ROOT/node_modules/electron/dist/electron" . --no-sandbox --ozone-platform=x11
