// ══════════════════════════════════════════
//  SCENES
//  All renderers, scenes, cameras, and controls for the four viewports:
//    1) main viewer    2) annotation viewer    3) compare-left    4) compare-right
//  Also exports the shared raycaster and clip plane.
// ══════════════════════════════════════════

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { App } from './state.js';

// ──── Main viewer ────
export const vpEl = document.getElementById('viewer-vp');
export const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(devicePixelRatio);
renderer.localClippingEnabled = true;
vpEl.appendChild(renderer.domElement);

export const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
vpEl.appendChild(labelRenderer.domElement);

export const scene = new THREE.Scene();
scene.background = new THREE.Color(App.bgColor);

export const camera = new THREE.PerspectiveCamera(45, 1, 0.0001, 1000);
camera.position.set(0, 0, 3);
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
dir1.position.set(2, 3, 3); scene.add(dir1);
const dir2 = new THREE.DirectionalLight(0xffffff, 0.25);
dir2.position.set(-2, -1, -2); scene.add(dir2);

export const axesHelper = new THREE.AxesHelper(1.2);
axesHelper.visible = false;
scene.add(axesHelper);

export const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
export const raycaster = new THREE.Raycaster();

// ──── Annotation viewport ────
export const annVpEl = document.getElementById('ann-vp');
export const rendererAnn = new THREE.WebGLRenderer({ antialias: true });
rendererAnn.setPixelRatio(devicePixelRatio);
rendererAnn.localClippingEnabled = true;
annVpEl.appendChild(rendererAnn.domElement);

export const labelRendererAnn = new CSS2DRenderer();
labelRendererAnn.domElement.style.position = 'absolute';
labelRendererAnn.domElement.style.top = '0';
labelRendererAnn.domElement.style.pointerEvents = 'none';
annVpEl.appendChild(labelRendererAnn.domElement);

export const sceneAnn = new THREE.Scene();
sceneAnn.background = new THREE.Color('#dedad4');
sceneAnn.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirAnn = new THREE.DirectionalLight(0xffffff, 0.8);
dirAnn.position.set(2, 3, 3); sceneAnn.add(dirAnn);

export const cameraAnn = new THREE.PerspectiveCamera(45, 1, 0.0001, 1000);
cameraAnn.position.set(0, 0, 3);
export const controlsAnn = new OrbitControls(cameraAnn, rendererAnn.domElement);
controlsAnn.enableDamping = true;
controlsAnn.dampingFactor = 0.08;

// ──── Compare viewports ────
export const cmpVpL = document.getElementById('cmp-vp-left');
export const cmpVpR = document.getElementById('cmp-vp-right');
export const rendererL = new THREE.WebGLRenderer({ antialias: true });
export const rendererR = new THREE.WebGLRenderer({ antialias: true });
rendererL.setPixelRatio(devicePixelRatio); rendererL.localClippingEnabled = true;
rendererR.setPixelRatio(devicePixelRatio); rendererR.localClippingEnabled = true;
cmpVpL.appendChild(rendererL.domElement);
cmpVpR.appendChild(rendererR.domElement);

export const sceneL = new THREE.Scene(); sceneL.background = new THREE.Color('#dedad4');
export const sceneR = new THREE.Scene(); sceneR.background = new THREE.Color('#dedad4');
[sceneL, sceneR].forEach(s => {
  s.add(new THREE.AmbientLight(0xffffff, 0.6));
  const d = new THREE.DirectionalLight(0xffffff, 0.8);
  d.position.set(2, 3, 3); s.add(d);
});

export const cameraL = new THREE.PerspectiveCamera(45, 1, 0.0001, 1000);
export const cameraR = new THREE.PerspectiveCamera(45, 1, 0.0001, 1000);
cameraL.position.set(0, 0, 3);
cameraR.position.set(0, 0, 3);
export const controlsL = new OrbitControls(cameraL, rendererL.domElement);
export const controlsR = new OrbitControls(cameraR, rendererR.domElement);
[controlsL, controlsR].forEach(c => { c.enableDamping = true; c.dampingFactor = 0.08; });

function syncCameras(src, dst, dstCtrl) {
  dst.position.copy(src.position);
  dst.quaternion.copy(src.quaternion);
  dstCtrl.target.copy(src.position.clone().sub(new THREE.Vector3(0, 0, 3)));
}

controlsL.addEventListener('change', () => { if (App.syncCam) syncCameras(cameraL, cameraR, controlsR); });
controlsR.addEventListener('change', () => { if (App.syncCam) syncCameras(cameraR, cameraL, controlsL); });

// ══════════════════════════════════════════
//  RESIZE
// ══════════════════════════════════════════
export function resizeAll() {
  [[renderer, vpEl, camera, labelRenderer],
   [rendererAnn, annVpEl, cameraAnn, labelRendererAnn]].forEach(([r, el, cam, lr]) => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h); lr.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix();
  });
  [[rendererL, cmpVpL, cameraL], [rendererR, cmpVpR, cameraR]].forEach(([r, el, cam]) => {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix();
  });
}
window.addEventListener('resize', resizeAll);
resizeAll();
