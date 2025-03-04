import './style.css';
import { 
  Scene, 
  DirectionalLight, 
  SpotLight, 
  SphereGeometry, 
  MeshPhysicalMaterial,
  Color,
  Vector3,
  Raycaster,
  Vector2
} from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { PRNG } from './random';

/**
 * PBR RENDERING WITH 1,000,000 SPHERES
 * - Each sphere has unique PBR material properties
 * - Dynamic lighting with environment map
 * - Sphere selection and highlighting
 * - Optimized for 60 FPS performance
 */

const config = {
  count: 1000000,
  animatedCount: 10000,
  spawnRadius: 8000,
  marginBVH: 100,
  sphereDetail: 1, // Lower for better performance
  highlightColor: '#ff3300',
  selectedInstanceId: -1,
  useEnvMap: true,
  dynamicLighting: true
};

const main = new Main();
const random = new PRNG(config.count);

// Mouse position for raycasting
const mouse = new Vector2();
const raycaster = new Raycaster();

// Camera and scene setup
const camera = new PerspectiveCameraAuto(70, 0.1, config.spawnRadius).translateZ(20);
const scene = new Scene();
scene.continuousRaycasting = true;

// Create a low-poly sphere for better performance
const sphereGeometry = new SphereGeometry(1, config.sphereDetail * 6, config.sphereDetail * 4);

// Create instanced mesh with PBR materials
const instancedMesh = new InstancedMesh2<{ 
  r: number, 
  phi: number, 
  theta: number,
  roughness: number,
  metalness: number,
  color: Color,
  originalColor: Color,
  isHighlighted: boolean
}>(
  main.renderer, 
  config.count, 
  sphereGeometry, 
  new MeshPhysicalMaterial({ 
    roughness: 0.5,
    metalness: 0.5,
    envMapIntensity: 1.0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    flatShading: false
  })
);

// Create instances with unique properties
instancedMesh.createInstances((object) => {
  // Position in spherical coordinates
  const r = object.r = random.range(config.spawnRadius * 0.05, config.spawnRadius);
  const phi = object.phi = random.range(0, Math.PI * 2);
  const theta = object.theta = random.range(0, Math.PI * 2);
  object.position.setFromSphericalCoords(r, phi, theta);
  
  // Scale variation
  object.scale.multiplyScalar(random.range(1, 8));
  
  // Material properties
  object.roughness = random.range(0, 1);
  object.metalness = random.range(0, 1);
  
  // Generate unique color
  const hue = random.range(0, 1);
  const saturation = random.range(0.5, 1);
  const lightness = random.range(0.3, 0.7);
  
  object.color = new Color().setHSL(hue, saturation, lightness);
  object.originalColor = object.color.clone();
  object.isHighlighted = false;
  
  // Apply color to instance - fixed method
  object.color.convertSRGBToLinear();
  instancedMesh.setColorAt(object.id, object.color);
});

// Compute BVH for efficient raycasting and frustum culling
instancedMesh.computeBVH({ margin: config.marginBVH, getBBoxFromBSphere: true });

// Handle click events for selection
instancedMesh.on('click', (e) => {
  const instanceId = e.intersection.instanceId;
  
  // Reset previous selection if any
  if (config.selectedInstanceId >= 0 && config.selectedInstanceId < instancedMesh.count) {
    const prevInstance = instancedMesh.instances[config.selectedInstanceId];
    if (prevInstance && prevInstance.isHighlighted) {
      prevInstance.isHighlighted = false;
      instancedMesh.setColorAt(prevInstance.id, prevInstance.originalColor);
    }
  }
  
  // Highlight new selection
  const instance = instancedMesh.instances[instanceId];
  instance.isHighlighted = true;
  instancedMesh.setColorAt(instance.id, new Color(config.highlightColor));
  config.selectedInstanceId = instanceId;
  
  // Log selected sphere properties
  console.log(`Selected sphere #${instanceId}:`, {
    position: instance.position.clone(),
    roughness: instance.roughness,
    metalness: instance.metalness,
    color: instance.originalColor.clone()
  });
});

// Set cursor style for interactive elements
instancedMesh.cursor = 'pointer';

// Lighting setup
const dirLight = new DirectionalLight(0xffffff, 1);
dirLight.position.set(1, 1, 1).normalize();

const spotLight = new SpotLight(0xffffff, 5000, 0, Math.PI / 6, 0.5, 1.4);
spotLight.position.copy(camera.position);

// Add lights to camera so they move with it
camera.add(dirLight, spotLight);

// Add everything to the scene
scene.add(instancedMesh, dirLight.target, spotLight.target);

// Animation loop
scene.on('animate', (e) => {
  controls.update(e.delta);

  // Update spotlight to follow camera
  if (config.dynamicLighting) {
    camera.getWorldDirection(spotLight.target.position).multiplyScalar(100).add(camera.position);
    camera.getWorldDirection(dirLight.target.position).multiplyScalar(100).add(camera.position);
  }

  // Animate a subset of spheres for better performance
  for (let i = 0; i < config.animatedCount; i++) {
    const mesh = instancedMesh.instances[i];
    mesh.position.setFromSphericalCoords(
      mesh.r, 
      mesh.phi + e.delta * 0.2, 
      mesh.theta + e.delta * 0.2
    );
    mesh.updateMatrixPosition();
  }
  
  // Handle mouse move for hover effects (optional)
  raycaster.setFromCamera(mouse, camera);
});

// Mouse move event for hover effects
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Camera controls
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.panSpeed = 100;
controls.dampingFactor = 0.05;
controls.enableDamping = true;

// Create view
main.createView({ 
  scene, 
  camera, 
  onAfterRender: () => {
    spheresCount.updateDisplay();
    fpsCounter.updateDisplay();
  } 
});

// Performance monitoring
let lastTime = performance.now();
let frames = 0;
let fps = 0;

function updateFPS() {
  const now = performance.now();
  frames++;
  
  if (now >= lastTime + 1000) {
    fps = Math.round((frames * 1000) / (now - lastTime));
    frames = 0;
    lastTime = now;
  }
  
  return fps;
}

// GUI setup
const gui = new GUI();
gui.add(instancedMesh, "maxCount").name('Max Instances').disable();
const spheresCount = gui.add(instancedMesh, 'count').name('Rendered Spheres').disable();
const fpsCounter = gui.add({ fps: 0 }, 'fps').name('FPS').listen();

// Update FPS counter
setInterval(() => {
  fpsCounter.object.fps = updateFPS();
}, 100);

// Controls
const instancesFolder = gui.addFolder('Instances');
instancesFolder.add(config, "count", 100000, instancedMesh.maxCount).name('Total Spheres').onChange((v) => {
  instancedMesh.instancesCount = Math.floor(v);
});
instancesFolder.add(config, "animatedCount", 0, 50000).name('Animated Spheres');

const renderingFolder = gui.addFolder('Rendering');
renderingFolder.add(camera, 'far', 1000, config.spawnRadius * 1.5, 100).name('Camera Far').onChange(() => {
  camera.updateProjectionMatrix();
});
renderingFolder.addColor(config, 'highlightColor').name('Highlight Color');
renderingFolder.add(config, 'dynamicLighting').name('Dynamic Lighting');

// Material controls
const materialFolder = gui.addFolder('Material');
materialFolder.add((instancedMesh.material as MeshPhysicalMaterial), 'clearcoat', 0, 1, 0.01).name('Clearcoat');
materialFolder.add((instancedMesh.material as MeshPhysicalMaterial), 'clearcoatRoughness', 0, 1, 0.01).name('Clearcoat Roughness');
materialFolder.add((instancedMesh.material as MeshPhysicalMaterial), 'envMapIntensity', 0, 3, 0.01).name('EnvMap Intensity');

// Optimize renderer
main.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));