#!/bin/bash
set -e

cat >'/opt/Atop Viewer/atop-viewer-launcher' <<'EOF'
#!/bin/sh
exec env -i \
  HOME="$HOME" \
  USER="${USER:-$(id -un)}" \
  LOGNAME="${LOGNAME:-$(id -un)}" \
  SHELL="${SHELL:-/bin/sh}" \
  PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  DISPLAY="${DISPLAY:-:0}" \
  XAUTHORITY="${XAUTHORITY:-}" \
  WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-}" \
  XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}" \
  DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}/bus}" \
  LANG="${LANG:-C.UTF-8}" \
  "/opt/Atop Viewer/atop-viewer" --no-sandbox --ozone-platform=x11 "$@"
EOF
chmod 755 '/opt/Atop Viewer/atop-viewer-launcher'

DESKTOP='/usr/share/applications/atop-viewer.desktop'
if [ -f "$DESKTOP" ]; then
  sed -i 's|^Exec=.*|Exec=/opt/Atop Viewer/atop-viewer-launcher %U|' "$DESKTOP"
fi

if type update-alternatives 2>/dev/null >&1; then
  if [ -L '/usr/bin/atop-viewer' ] && [ -e '/usr/bin/atop-viewer' ] && [ "$(readlink '/usr/bin/atop-viewer')" != '/etc/alternatives/atop-viewer' ]; then
    rm -f '/usr/bin/atop-viewer'
  fi
  update-alternatives --install '/usr/bin/atop-viewer' 'atop-viewer' '/opt/Atop Viewer/atop-viewer-launcher' 110 \
    || ln -sf '/opt/Atop Viewer/atop-viewer-launcher' '/usr/bin/atop-viewer'
  update-alternatives --set 'atop-viewer' '/opt/Atop Viewer/atop-viewer-launcher' \
    || ln -sf '/opt/Atop Viewer/atop-viewer-launcher' '/usr/bin/atop-viewer'
else
  ln -sf '/opt/Atop Viewer/atop-viewer-launcher' '/usr/bin/atop-viewer'
fi

if hash update-desktop-database 2>/dev/null; then
  update-desktop-database /usr/share/applications || true
fi
