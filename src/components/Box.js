import * as THREE from 'three';

export function createBox() {
    const box = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    box.castShadow = true;
    return box;
}