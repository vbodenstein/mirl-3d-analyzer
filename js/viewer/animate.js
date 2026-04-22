// ══════════════════════════════════════════
//  ANIMATE
//  Single requestAnimationFrame loop that drives all four viewports.
// ══════════════════════════════════════════

import {
  renderer, scene, camera, labelRenderer, controls,
  rendererAnn, sceneAnn, cameraAnn, labelRendererAnn, controlsAnn,
  rendererL, sceneL, cameraL, controlsL,
  rendererR, sceneR, cameraR, controlsR,
} from '../core/scenes.js';

export function animate() {
  requestAnimationFrame(animate);
  controls.update(); controlsAnn.update();
  controlsL.update(); controlsR.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  rendererAnn.render(sceneAnn, cameraAnn);
  labelRendererAnn.render(sceneAnn, cameraAnn);
  rendererL.render(sceneL, cameraL);
  rendererR.render(sceneR, cameraR);
}
