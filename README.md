# Atop Viewer

Explorador gráfico de logs [atop](https://www.atoptool.nl/) para Linux.

**Estado:** beta (`0.0.x`) · **Licencia:** [MIT](LICENSE)

- **Descargas:** [davidpestana.github.io/atop-viewer](https://davidpestana.github.io/atop-viewer/)
- **Releases:** [GitHub Releases](https://github.com/davidpestana/atop-viewer/releases)

## Requisitos

| Componente | Detalle |
|------------|---------|
| Sistema | Linux (Ubuntu/Debian probado; otras distros vía AppImage) |
| `atop` | Instalado y activo, escribiendo en `/var/log/atop/atop_YYYYMMDD` |
| Permisos | Lectura de logs atop (usuario en grupo adecuado o root) |

```bash
sudo apt install atop
sudo systemctl enable --now atop
```

Comprueba el intervalo de muestreo:

```bash
grep LOGINTERVAL /etc/default/atop
# Ejemplo: LOGINTERVAL=600  → una muestra cada 10 minutos
```

## Instalación (usuarios)

### Ubuntu / Debian (.deb)

1. Descarga el `.deb` desde [GitHub Pages](https://davidpestana.github.io/atop-viewer/) o [Releases](https://github.com/davidpestana/atop-viewer/releases).
2. Instala:

```bash
sudo apt install ./atop-viewer-0.0.1-beta-amd64.deb
```

3. Lanza la aplicación:

```bash
atop-viewer
```

También debería aparecer en el menú de aplicaciones como **Atop Viewer**.

### Otras distribuciones Linux (AppImage)

```bash
chmod +x atop-viewer-*-x86_64.AppImage
./atop-viewer-*-x86_64.AppImage
```

AppImage es portable; necesitas `atop` instalado por separado. En algunas distros hace falta `libfuse2`.

### Actualizar

Descarga la nueva versión beta desde la página de descargas o Releases e instala encima (`.deb`) o sustituye el AppImage.

## Uso de la aplicación

1. **Selecciona un log diario** (`atop_YYYYMMDD`) en el desplegable superior.
2. **Explora el histórico** con el slider temporal (~intervalo de atop).
3. **Gráficas de sistema:** load, CPU y memoria por muestra.
4. **Tabla de procesos** del intervalo seleccionado, con estado vivo (Vivo / Terminado / PID reutilizado).
5. **Modo En vivo:** la app sondea el fichero cada 15 s y refresca cuando atop escribe una muestra nueva (no puede ir más rápido que `LOGINTERVAL`).
6. **Líneas temporales:** heatmap, stack y ciclo de vida de los procesos más relevantes.
7. **Ajustes** (panel «Relevancia en interfaz»): filtro CPU mínimo, filas máximas, top N del timeline, idioma ES/EN. Se guardan en `~/.config/atop-viewer/settings.json`.

### Nota sobre procesos «ocultos»

Por defecto se ocultan procesos con CPU &lt; 0,05 % en la muestra. Pon **CPU mínima 0 %** en ajustes para ver todos (p. ej. procesos idle como editores en segundo plano).

## Desarrollo

Requisitos: **Node.js 20+**, npm, atop en el sistema.

```bash
git clone https://github.com/davidpestana/atop-viewer.git
cd atop-viewer
npm install
npm run dev
```

Si Electron no abre desde la terminal integrada de Cursor (GTK/Wayland), usa una terminal externa o:

```bash
bash scripts/run.sh dev
```

### Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con hot reload |
| `npm run build` | Compila main, preload y renderer |
| `npm start` | Ejecuta build de producción local |
| `npm run dist:linux` | Genera `.deb` y `.AppImage` en `dist/` |

## CI/CD y releases beta

- **CI** (`.github/workflows/ci.yml`): build en cada push/PR a `main`.
- **Release** (`.github/workflows/release.yml`): al etiquetar `v0.0.x` o `v0.0.x-beta` construye instaladores Linux, publica un **pre-release** en GitHub y despliega la [página de descargas](https://davidpestana.github.io/atop-viewer/).

### Publicar una versión beta

```bash
# Actualiza version en package.json (ej. 0.0.2-beta), commit, luego:
git tag v0.0.2-beta
git push origin main
git push origin v0.0.2-beta
```

O dispara manualmente **Actions → Release → Run workflow** e indica la versión (p. ej. `0.0.2-beta`).

Convención: series `0.0.x-beta` hasta estabilizar el MVP.

### GitHub Pages

Tras el primer release, activa Pages en el repo si no se configuró solo:

**Settings → Pages → Build and deployment → GitHub Actions**

La URL será `https://<usuario>.github.io/atop-viewer/`.

## Cómo funciona atop

`atop` es un agente de muestreo gestionado por systemd:

```bash
atop -w /var/log/atop/atop_YYYYMMDD <LOGINTERVAL>
```

Cada muestra guarda CPU, load, memoria, procesos, disco, red, etc. La app lee logs con `atop -r … -J …` (sin reimplementar el formato binario).

## Estructura del proyecto

```text
electron/          Proceso main, parser atop, settings, servicios en vivo
src/               UI React (gráficas, tablas, i18n)
docs/              Sitio estático de descargas (GitHub Pages)
.github/workflows/ CI y release
scripts/run.sh     Arranque con entorno limpio en Linux
```

## Licencia

[MIT](LICENSE) — software libre y de código abierto.
