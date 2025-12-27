import * as THREE from 'three';

export function createSkybox(textureUrl) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(
    textureUrl,
    function(texture) {
      console.log('[info] skybox texture loaded');
    },
    undefined,
    function(err) {
      console.error(err);
    }
  );
  texture.encoding = THREE.sRGBEncoding;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.anisotropy = 16;

  const skyboxGeometry = new THREE.SphereGeometry(500, 64, 64);
  const skyboxMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide
  });
  const mesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  mesh.material.fog = false;
  return mesh;
}