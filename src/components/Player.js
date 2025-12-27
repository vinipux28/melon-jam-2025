import * as THREE from 'three';
import { getTerrainHeight } from './Terrain';
import { checkTreeCollision } from './Trees';

// reusable vectors to avoid per-frame alloc
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();

export function createPlayer(camera) {
  return {
    position: new THREE.Vector3(0, 1, 0),
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    speed: 2.5,
    jumpSpeed: 8,
    gravity: -25,
    yaw: 0,
    pitch: 0,
    jumpVelocity: 0,
    isOnGround: true,
    camera,
    bobTimer: 0,
    bobSpeed: 10,
    bobAmount: 0.05,
    // stamina system
    stamina: 100,
    maxStamina: 100,
    staminaDrain: 25,   // per sec
    staminaRefill: 15   // per sec
  };
}

export function setupPlayerControls() {
  const keys = { w:false,a:false,s:false,d:false,space:false,shift:false };
  const setKey = (e, down) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = down;
    if (e.code === 'Space') { e.preventDefault(); keys.space = down; }
    if (e.key === 'Shift') keys.shift = down;
  };
  window.addEventListener('keydown', e => setKey(e,true));
  window.addEventListener('keyup', e => setKey(e,false));
  return keys;
}

export function setupMouseControls(player, renderer) {
  let locked = false;
  const sensitivity = 0.002;

  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === renderer.domElement;
  });

  document.addEventListener('mousemove', e => {
    if (!locked) return;
    player.yaw   -= e.movementX * sensitivity;
    player.pitch -= e.movementY * sensitivity;
    player.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.pitch));
  });
}

export function updatePlayer(player, keys, delta, trees = null, hud = null) {
  // rotate camera
  player.camera.rotation.order = 'YXZ';
  player.camera.rotation.set(player.pitch, player.yaw, 0);

  // build forward/right from yaw
  forward.set(Math.sin(player.yaw),0,Math.cos(player.yaw));
  right.set(Math.cos(player.yaw),0,-Math.sin(player.yaw));

  // movement input
  player.direction.set(0,0,0);
  if(keys.w) player.direction.sub(forward);
  if(keys.s) player.direction.add(forward);
  if(keys.d) player.direction.add(right);
  if(keys.a) player.direction.sub(right);

  const hasInput = player.direction.lengthSq()>0;

  if(hasInput){
    player.direction.normalize();
    const sprinting = keys.shift && player.stamina>0;
    const spdMult = sprinting ? 2 : 1;

    if(sprinting) player.stamina = Math.max(0, player.stamina - player.staminaDrain * delta);

    player.velocity.lerp(player.direction.multiplyScalar(player.speed*spdMult), 8*delta);
  } else player.velocity.multiplyScalar(1-6*delta);

  if(!keys.shift || !hasInput) player.stamina = Math.min(player.maxStamina, player.stamina + player.staminaRefill*delta);

  const moving = player.velocity.lengthSq()>0.0001;

  // horizontal movement + tree collision
  if(moving){
    movement.copy(player.velocity).multiplyScalar(delta);
    const nx = player.position.x + movement.x;
    const nz = player.position.z + movement.z;

    if(!trees || !checkTreeCollision(trees,nx,nz)){
      player.position.x = nx; player.position.z = nz;
    } else {
      if(!checkTreeCollision(trees,nx,player.position.z)) player.position.x = nx;
      else if(!checkTreeCollision(trees,player.position.x,nz)) player.position.z = nz;
    }

    if(player.isOnGround) player.bobTimer += delta*player.bobSpeed;
  }

  // vertical / terrain
  const groundY = getTerrainHeight(player.position.x,player.position.z)+1;

  if(keys.space && player.isOnGround){
    player.jumpVelocity = player.jumpSpeed;
    player.isOnGround = false;
  }

  if(!player.isOnGround){
    player.jumpVelocity += player.gravity*delta;
    player.position.y += player.jumpVelocity*delta;
  }

  const snapThreshold = 1;
  const distToGround = player.position.y - groundY;

  if(player.position.y<=groundY || (player.isOnGround && Math.abs(distToGround)<snapThreshold)){
    player.position.y = groundY;
    player.jumpVelocity = 0;
    player.isOnGround = true;
  } else if(distToGround>snapThreshold) player.isOnGround=false;

  // camera + bob
  const bob = player.isOnGround && moving ? Math.sin(player.bobTimer)*player.bobAmount : 0;
  player.camera.position.set(player.position.x, player.position.y + bob, player.position.z);

  // HUD updates
  if(hud){
    const sprinting = keys.shift && moving && player.stamina>0;
    hud.setVisible('sprint', sprinting);
    hud.setStaminaBar(player.stamina<player.maxStamina || sprinting, player.stamina/player.maxStamina);
  }
}

export function enablePointerLock(renderer){
  renderer.domElement.addEventListener('click', ()=>renderer.domElement.requestPointerLock());
}

export function initPlayerGUI(gui,camera){
  const f = gui.addFolder('Player');
  f.add(camera,'fov',50,100).onChange(()=>camera.updateProjectionMatrix());
  f.open();
}
