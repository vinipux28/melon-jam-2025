import * as THREE from "three";

//lighting: ambient + hemisphere + directional sun
export function createLighting(scene) {
  // ambient base
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  // hemisphere for subtle sky/ground coloration
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x444444, 0.35);
  hemi.position.set(0, 50, 0);
  scene.add(hemi);

  // directional sun
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  return { sun, hemi };
}
