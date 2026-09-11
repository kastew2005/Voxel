/*
 * Voxel Survival — stable Three.js bridge.
 * Three.js is loaded as a classic browser script in index.html.
 * This deliberately avoids dynamic ESM imports from a CDN, which can fail on
 * iOS Safari / GitHub Pages when a CDN returns an HTML error document.
 */
const THREE = globalThis.THREE;
if (!THREE) {
  throw new Error('Three.js не загрузился. Проверь доступ к CDN или интернет-соединение.');
}
export default THREE;
