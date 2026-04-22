// ══════════════════════════════════════════
//  COMPARE VIEW — side-by-side model viewers with synced cameras
// ══════════════════════════════════════════

import * as THREE from 'three';
import { App } from '../core/state.js';
import { sceneL, sceneR, cameraL, cameraR, controlsL, controlsR } from '../core/scenes.js';
import { showLoad, hideLoad } from '../core/loading.js';
import { loadOBJ } from '../viewer/loader.js';
import { computeCurvature } from '../analysis/curvature.js';
import { getCmap } from '../analysis/color-maps.js';

export function applyCompareColors(geo, mesh, curvData, analysisKey, cmapName, sceneRef) {
  if(analysisKey==='none'||!curvData[analysisKey]){
    mesh.material.vertexColors=false;mesh.material.color.set(0xccccbb);mesh.material.needsUpdate=true;return;
  }
  const data=curvData[analysisKey],cmap=getCmap(cmapName);
  const sorted=[...data].filter(isFinite).sort((a,b)=>a-b);
  const lo=sorted[Math.floor(sorted.length*.02)]||0;
  const hi=sorted[Math.floor(sorted.length*.98)]||1;
  const range=hi-lo||1, nV=data.length;
  const cols=new Float32Array(nV*3);
  for(let i=0;i<nV;i++){const t=(data[i]-lo)/range,[r,g,b]=cmap(t);cols[i*3]=r;cols[i*3+1]=g;cols[i*3+2]=b;}
  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));
  mesh.material.vertexColors=true;mesh.material.color.set(0xffffff);mesh.material.needsUpdate=true;
}

export function loadCompareModel(files, side) {
  loadOBJ(files, (geo, name) => {
    if(side==='left'){
      if(App.cmpMeshL)sceneL.remove(App.cmpMeshL);
      App.cmpGeoL=geo; App.cmpNameL=name;
      const mat=new THREE.MeshPhongMaterial({color:0xccccbb,side:THREE.DoubleSide,shininess:25});
      App.cmpMeshL=new THREE.Mesh(geo,mat); sceneL.add(App.cmpMeshL);
      showLoad('Computing analysis…');
      setTimeout(()=>{App.cmpCurvL=computeCurvature(geo);applyCompareColors(App.cmpGeoL,App.cmpMeshL,App.cmpCurvL,App.cmpAnalysisL,App.cmpCmapL,sceneL);hideLoad();},50);
      document.getElementById('cmp-left-name').textContent=name;
    } else {
      if(App.cmpMeshR)sceneR.remove(App.cmpMeshR);
      App.cmpGeoR=geo; App.cmpNameR=name;
      const mat=new THREE.MeshPhongMaterial({color:0xccccbb,side:THREE.DoubleSide,shininess:25});
      App.cmpMeshR=new THREE.Mesh(geo,mat); sceneR.add(App.cmpMeshR);
      showLoad('Computing analysis…');
      setTimeout(()=>{App.cmpCurvR=computeCurvature(geo);applyCompareColors(App.cmpGeoR,App.cmpMeshR,App.cmpCurvR,App.cmpAnalysisR,App.cmpCmapR,sceneR);hideLoad();},50);
      document.getElementById('cmp-right-name').textContent=name;
    }
    cameraL.position.set(0,0,3);controlsL.reset();
    cameraR.position.set(0,0,3);controlsR.reset();
  });
}

// ── Compare sidebar controls ──
document.getElementById('cmp-left-analysis').addEventListener('change',e=>{
  App.cmpAnalysisL=e.target.value;
  if(App.cmpMeshL)applyCompareColors(App.cmpGeoL,App.cmpMeshL,App.cmpCurvL,App.cmpAnalysisL,App.cmpCmapL,sceneL);
});
document.getElementById('cmp-right-analysis').addEventListener('change',e=>{
  App.cmpAnalysisR=e.target.value;
  if(App.cmpMeshR)applyCompareColors(App.cmpGeoR,App.cmpMeshR,App.cmpCurvR,App.cmpAnalysisR,App.cmpCmapR,sceneR);
});
document.getElementById('cmp-left-cmap').addEventListener('change',e=>{
  App.cmpCmapL=e.target.value;
  if(App.cmpMeshL)applyCompareColors(App.cmpGeoL,App.cmpMeshL,App.cmpCurvL,App.cmpAnalysisL,App.cmpCmapL,sceneL);
});
document.getElementById('cmp-right-cmap').addEventListener('change',e=>{
  App.cmpCmapR=e.target.value;
  if(App.cmpMeshR)applyCompareColors(App.cmpGeoR,App.cmpMeshR,App.cmpCurvR,App.cmpAnalysisR,App.cmpCmapR,sceneR);
});
document.getElementById('chk-sync-cam').addEventListener('change',e=>{App.syncCam=e.target.checked;});
