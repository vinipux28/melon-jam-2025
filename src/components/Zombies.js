import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getTerrainHeight } from './Terrain';

let baseModel = null;
let baseAnimations = null;
const activeZombies = [];

/**
 * Load GLB model and cache it for spawning.
 * Returns a promise that resolves when the model is loaded.
 */
export function loadZombieModel(path = '/entities/zombie.glb') {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      baseModel = gltf.scene;
      baseAnimations = gltf.animations || [];

      console.log('[Zombies] model loaded, animations:', baseAnimations.length);
      baseAnimations.forEach((c, i) => console.log(`  [${i}] ${c.name}`));

      baseModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          //so zombie is always visible
          child.frustumCulled = false;
        }
      });

      resolve({ model: baseModel, animations: baseAnimations });
    }, undefined, (err) => reject(err));
  });
}

/**
 * Spawn a zombie at the given position (object with x,z or Vector3) and play animationName.
 * Returns the spawned zombie object.
 */
export function spawnZombieAt(scene, position = { x: 0, z: 0 }, animationName = 'Run') {
  if (!baseModel) {
    console.warn('[Zombies] spawn requested before model loaded');
    return null;
  }

  const pos = position instanceof THREE.Vector3 ? position : new THREE.Vector3(position.x || 0, 0, position.z || 0);

  // clone with skeleton support
  const clone = SkeletonUtils.clone(baseModel);

  const y = getTerrainHeight(pos.x, pos.z);
  clone.position.set(pos.x, y - 0.3, pos.z);
  clone.scale.setScalar(1);

  // ensure meshes cast/receive shadows on the clone and disable frustum culling
  clone.traverse((c) => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      c.frustumCulled = false;
    }
  });

  // animation mixer for this clone
  const mixer = new THREE.AnimationMixer(clone);

  let clip = null;
  if (baseAnimations && baseAnimations.length) {
    clip = THREE.AnimationClip.findByName(baseAnimations, animationName) || baseAnimations[0];
  }

  if (clip) {
    const action = mixer.clipAction(clip);
    action.reset();
    action.play();
  }

  const zombie = {
    obj: clone,
    mixer,
    clipName: clip ? clip.name : null
  };

  activeZombies.push(zombie);
  scene.add(clone);
  return zombie;
}

/**
 * Update all active zombie mixers. Call once per frame with delta.
 */
export function updateZombies(delta) {
  if (!delta) return;
  for (let i = 0; i < activeZombies.length; i++) {
    const z = activeZombies[i];
    if (z.mixer) z.mixer.update(delta);
  }
}

export function getLoadedAnimationNames() {
  return (baseAnimations || []).map((a) => a.name);
}
