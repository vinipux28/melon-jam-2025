import * as THREE from 'three';

export function initFog(scene, gui) {
  const defaultFogColor = 0xdfeef6;
  const defaultFogDensity = 0.012; /* denser fog to hide chunk boundaries */

  scene.fog = new THREE.FogExp2(defaultFogColor, defaultFogDensity);

  const fogParams = { enabled: true, color: defaultFogColor, density: defaultFogDensity };
  const fogFolder = gui.addFolder('Fog');
  fogFolder.add(fogParams, 'enabled').name('Enabled').onChange((v) => {
    scene.fog = v ? new THREE.FogExp2(fogParams.color, fogParams.density) : null;
  });
  fogFolder.addColor(fogParams, 'color').name('Color').onChange((c) => {
    if (scene.fog) scene.fog.color.set(c);
  });
  fogFolder.add(fogParams, 'density', 0.000, 0.030).name('Density').onChange((d) => {
    if (scene.fog) scene.fog.density = d;
  });

  fogFolder.open();

  return {
    setDensity: (d) => { if (scene.fog) scene.fog.density = d; },
    setColor: (c) => { if (scene.fog) scene.fog.color.set(c); }
  };
}