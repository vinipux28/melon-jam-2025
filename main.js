import * as THREE from "three";
import * as dat from 'dat.gui';
import { createBox } from "./src/components/Box";
import { createTerrain } from "./src/components/Terrain";
// sphere removed
import { createSkybox } from "./src/components/Skybox";
import { createLighting } from "./src/components/Lighting";
import { loadTexture } from "./src/utils/TextureLoader";
import { HUD } from "./src/utils/HUD";
import { createPlayer, setupPlayerControls, setupMouseControls, updatePlayer, enablePointerLock, initPlayerGUI } from "./src/components/Player";
import { initFog } from "./src/components/FogManager";
import { createTrees, updateTreeCulling } from "./src/components/Trees";
import { loadZombieModel, spawnZombieAt, updateZombies } from "./src/components/Zombies";

//setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

//camera
const camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 0);

scene.add(new THREE.AxesHelper(5));
// scene.add(new THREE.GridHelper(30));

//objects
const skybox = createSkybox("/img/sky_23_2k.png");
const box = createBox();
const terrain = createTerrain(loadTexture("/img/grass_04.png"));
const trees = createTrees("/environment/pine_tree.glb", 500, 180);

scene.add(skybox, box, terrain, trees);

createLighting(scene);

const gui = new dat.GUI();

initPlayerGUI(gui, camera);

const fogManager = initFog(scene, gui);

//init player
const player = createPlayer(camera);
const keys = setupPlayerControls();
setupMouseControls(player, renderer);

enablePointerLock(renderer);

//init HUD
const hud = new HUD();
hud.setText('sprint', 'Sprinting', 20, 'bottom', {
  font: '14px monospace',
  color: 'white',
  visible: false
});

//pause state
let isPaused = false;

/* pause when pointer unlocks or tab loses focus */
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) {
    isPaused = true;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    isPaused = true;
  }
});

/* resume on click */
renderer.domElement.addEventListener('click', () => {
  if (isPaused) {
    isPaused = false;
  }
});

// load zombie model and spawn one at player position (& plays 'Run' animation)
loadZombieModel('/entities/zombie.glb')
  .then(() => {
    spawnZombieAt(scene, { x: player.position.x, z: player.position.z }, 'Run');
  })

//init clock
const clock = new THREE.Clock();

let step = 0;
let cullingCounter = 0;
function animate(time) {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  /* skip updates when paused */
  if (!isPaused) {
    updatePlayer(player, keys, delta, trees, hud);
    updateZombies(delta);
    cullingCounter++;
    if (cullingCounter % 3 === 0) {
      updateTreeCulling(trees, player.position, 80, 40);
    }

    //objects
    box.rotation.x = box.rotation.y = time * 0.001;

    renderer.render(scene, camera);
    hud.render(); 
  } else {
    renderer.render(scene, camera);
    hud.showPauseOverlay();
  }
}

animate();
