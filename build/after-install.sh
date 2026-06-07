#!/bin/bash
set -e

cat >'/opt/Atop Viewer/atop-viewer-launcher' <<'EOF'
#!/bin/sh
exec "/opt/Atop Viewer/atop-viewer" --no-sandbox "$@"
EOF
chmod 755 '/opt/Atop Viewer/atop-viewer-launcher'

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
