const fs = require('fs')
const path = require('path')

/** @param {import('app-builder-lib').AfterPackContext} context */
exports.default = async function afterPack(context) {
  const src = path.join(context.packager.projectDir, 'build/atop-viewer-launcher')
  const dest = path.join(context.appOutDir, 'atop-viewer-launcher')
  fs.copyFileSync(src, dest)
  fs.chmodSync(dest, 0o755)
}
