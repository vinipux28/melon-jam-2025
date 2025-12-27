import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getTerrainHeight } from './Terrain';

/* layered noise → forest patches */
function forestDensity(x, z) {
  return (
    Math.sin(x * 0.03) * Math.cos(z * 0.03) +
    Math.sin(x * 0.08) * Math.cos(z * 0.06) * 0.5
  );
}

export function createTrees(modelPath, count = 150, spread = 100) {
  const group = new THREE.Group();
  const loader = new GLTFLoader();

  loader.load(modelPath, (gltf) => {
    const template = gltf.scene;

    // mark all meshes once: always cast & receive shadow
    template.traverse(c => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    const trees = [];
    const colliders = [];

    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 3;

    while (placed < count && attempts++ < maxAttempts) {
      const x = (Math.random() - 0.5) * spread * 2;
      const z = (Math.random() - 0.5) * spread * 2;

      if (forestDensity(x, z) < -0.7) continue; // skip clearings

      const tree = template.clone(true);
      const y = getTerrainHeight(x, z);

      tree.position.set(x, y - 0.8, z); // embed a bit
      tree.rotation.y = Math.random() * Math.PI * 2;
      const scale = 0.15 + Math.random() * 0.1;
      tree.scale.setScalar(scale);

      // cache meshes for potential culling
      const meshes = [];
      tree.traverse(c => c.isMesh && meshes.push(c));

      trees.push({ obj: tree, meshes, x, z });
      colliders.push({ x, z, r: 1.5 });

      group.add(tree);
      placed++;
    }

    group.userData.trees = trees;
    group.userData.colliders = colliders;

    console.log(`[Trees] Loaded ${placed} trees`);
  });

  return group;
}

/* squared-distance collision check */
export function checkTreeCollision(group, x, z, playerRadius = 0.4) {
  const colliders = group.userData.colliders;
  if (!colliders) return false;

  for (let i = 0; i < colliders.length; i++) {
    const dx = x - colliders[i].x;
    const dz = z - colliders[i].z;
    const r = playerRadius + colliders[i].r;
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

/* culling only by distance; shadows always on */
export function updateTreeCulling(group, playerPosition, cullDistance = 80) {
  const trees = group.userData.trees;
  if (!trees) return;

  const px = playerPosition.x;
  const pz = playerPosition.z;
  const cullSq = cullDistance * cullDistance;

  for (const t of trees) {
    const dx = px - t.x;
    const dz = pz - t.z;
    const distSq = dx * dx + dz * dz;

    t.obj.visible = distSq < cullSq;
    // shadows always true, no per-frame check needed
  }
}
