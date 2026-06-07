# Atop Viewer

Graphical explorer for Linux [atop](https://www.atoptool.nl/) performance logs.

**Status:** beta (`0.0.x`) · **License:** [MIT](LICENSE)

- **Downloads:** [davidpestana.github.io/atop-viewer](https://davidpestana.github.io/atop-viewer/)
- **Releases:** [GitHub Releases](https://github.com/davidpestana/atop-viewer/releases)

## Requirements

| Component | Details |
|-----------|---------|
| OS | Linux (Ubuntu/Debian tested; other distros via AppImage) |
| `atop` | Installed and running, writing to `/var/log/atop/atop_YYYYMMDD` |
| Permissions | Read access to atop logs (appropriate group or root) |

```bash
sudo apt install atop
sudo systemctl enable --now atop
```

Check the sampling interval:

```bash
grep LOGINTERVAL /etc/default/atop
# Example: LOGINTERVAL=600  → one sample every 10 minutes
```

## Installation

### Ubuntu / Debian (.deb)

1. Download the `.deb` from [GitHub Pages](https://davidpestana.github.io/atop-viewer/) or [Releases](https://github.com/davidpestana/atop-viewer/releases).
2. Install:

```bash
sudo apt install ./atop-viewer-0.0.1-beta-amd64.deb
```

3. Launch the app:

```bash
atop-viewer
```

It should also appear in the application menu as **Atop Viewer**.

### Other Linux distributions (AppImage)

```bash
chmod +x atop-viewer-*-x86_64.AppImage
./atop-viewer-*-x86_64.AppImage
```

AppImage is portable; you still need `atop` installed separately. Some distros require `libfuse2`.

### Updating

Download the latest beta from the download page or Releases and reinstall (`.deb`) or replace the AppImage.

## Using the app

1. **Pick a daily log** (`atop_YYYYMMDD`) from the top dropdown.
2. **Browse history** with the time slider (~atop interval).
3. **System charts:** load, CPU, and memory per sample.
4. **Process table** for the selected interval, with live status (Live / Terminated / PID reused).
5. **Live mode:** polls the log file every 15 s and refreshes when atop writes a new sample (cannot go faster than `LOGINTERVAL`).
6. **Process timelines:** heatmap, stack, and lifecycle for top processes.
7. **Settings** (“UI relevance” panel): minimum CPU filter, max rows, timeline top N, locale ES/EN. Stored in `~/.config/atop-viewer/settings.json`.

### Hidden processes

By default, processes below **0.05% CPU** in a sample are filtered out. Set **minimum CPU to 0%** in settings to show all (e.g. idle background editors).

## Development

Requires **Node.js 20+**, npm, and atop on the system.

```bash
git clone https://github.com/davidpestana/atop-viewer.git
cd atop-viewer
npm install
npm run dev
```

If Electron fails to open from the Cursor integrated terminal (GTK/Wayland), use an external terminal or:

```bash
bash scripts/run.sh dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development with hot reload |
| `npm run build` | Build main, preload, and renderer |
| `npm start` | Run local production build |
| `npm run dist:linux` | Build `.deb` and `.AppImage` in `dist/` |
| `npm run validate:packages` | Validate built installers (desktop file, postinst, Docker smoke test) |
| `npm run dist:linux:check` | Build + validate before publishing or manual install |

### Validate a `.deb` before installing

Build and run automated checks (including a clean Ubuntu container install + launch under Xvfb):

```bash
npm run dist:linux:check
```

Or validate an existing package:

```bash
npm run validate:deb -- dist/atop-viewer-0.0.4-beta-amd64.deb
```

CI runs the same validation on every push; releases are blocked if it fails.

## CI/CD and beta releases

- **CI** (`.github/workflows/ci.yml`): build on every push/PR to `main` or `master`.
- **Release** (`.github/workflows/release.yml`): on tag `v0.0.x` or `v0.0.x-beta`, builds Linux installers, publishes a **pre-release** on GitHub, and deploys the [download page](https://davidpestana.github.io/atop-viewer/).

### Publishing a beta version

```bash
# Bump version in package.json (e.g. 0.0.2-beta), commit, then:
git tag v0.0.2-beta
git push origin master
git push origin v0.0.2-beta
```

Or run **Actions → Release → Run workflow** manually (e.g. version `0.0.2-beta`).

Convention: `0.0.x-beta` until the MVP stabilizes.

### GitHub Pages

After the first release, enable Pages if needed:

**Settings → Pages → Build and deployment → GitHub Actions**

URL: `https://<user>.github.io/atop-viewer/`

## How atop works

`atop` is a sampling agent managed by systemd:

```bash
atop -w /var/log/atop/atop_YYYYMMDD <LOGINTERVAL>
```

Each sample stores CPU, load, memory, processes, disk, network, etc. The app reads logs via `atop -r … -J …` (no custom binary parser).

## Project layout

```text
electron/          Main process, atop parser, settings, live services
src/               React UI (charts, tables, i18n)
docs/              Static download site (GitHub Pages, EN/ES)
.github/workflows/ CI and release
scripts/run.sh     Clean-environment launcher on Linux
```

## License

[MIT](LICENSE) — free and open source software.
