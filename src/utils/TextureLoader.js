import * as THREE from 'three';

export const loadTexture = (url) => new THREE.TextureLoader().load(url);