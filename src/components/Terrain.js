import * as THREE from 'three';

export function getTerrainHeight(x, z) {
    return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2 + 
           Math.sin(x * 0.05) * Math.cos(z * 0.08) * 3 +
           Math.sin(x * 0.02) * Math.cos(z * 0.03) * 5;
}

export function createTerrain(texture = null) {
    const material = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        side: THREE.DoubleSide 
    });
    
    if (texture) {
        material.map = texture;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(100, 100);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
    }
    
    const geometry = new THREE.PlaneGeometry(400, 400, 200, 200);
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getY(i);
        const height = getTerrainHeight(x, z);
        positions.setZ(i, height);
    }
    
    geometry.computeVertexNormals();
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    return terrain;
}