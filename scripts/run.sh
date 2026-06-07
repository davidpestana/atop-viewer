#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-dev}"
shift || true

case "$MODE" in
  dev) ELECTRON_VITE_CMD=(npx electron-vite dev -- --no-sandbox) ;;
  preview | start) ELECTRON_VITE_CMD=(npx electron-vite preview -- --no-sandbox) ;;
  *)
    echo "Uso: $0 [dev|preview|start]" >&2
    exit 1
    ;;
esac

# Cursor exporta GDK_BACKEND=wayland y puede crashear Electron (GTK 3 + 4).
fuser -k 5173/tcp 2>/dev/null || true
sleep 0.5

exec env -i \
  HOME="$HOME" \
  USER="${USER:-$(whoami)}" \
  LOGNAME="${LOGNAME:-$(whoami)}" \
  SHELL="${SHELL:-/bin/bash}" \
  PATH="${PATH:-/usr/local/bin:/usr/bin:/bin}" \
  DISPLAY="${DISPLAY:-:0}" \
  XAUTHORITY="${XAUTHORITY:-}" \
  WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-}" \
  XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}" \
  DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/bus}" \
  "${ELECTRON_VITE_CMD[@]}" "$@"
