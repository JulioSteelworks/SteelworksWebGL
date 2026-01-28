import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.176.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/controls/OrbitControls.js/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import { RGBELoader } from 'https://cdn.jsdelivr.net/npm/three@0.176.0/examples/jsm/loaders/RGBELoader.js/+esm';


const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);
camera.position.set(0, 0.8, 1.6);
camera.lookAt(0, 0.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
document.body.appendChild(renderer.domElement);

// 🎥 Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 🌍 Environment
const pmrem = new THREE.PMREMGenerator(renderer);

new RGBELoader().load('./studio.hdr', (hdr) => {
  const envMap = pmrem.fromEquirectangular(hdr).texture;
  scene.environment = envMap;
  hdr.dispose();
});

// 💡 Basic Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
scene.background = new THREE.Color(0xffffff);

// 📐 ENCUADRE AUTOMÁTICO
const box = new THREE.Box3().setFromObject(gltf.scene);
const size = box.getSize(new THREE.Vector3());
const center = box.getCenter(new THREE.Vector3());

// Centrar modelo
gltf.scene.position.sub(center);

// Tamaño máximo
const maxDim = Math.max(size.x, size.y, size.z);

// Ajustar cámara según FOV
const fov = camera.fov * (Math.PI / 180);
let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

// Un poco más atrás para margen
cameraZ *= 1.4;

camera.position.set(0, maxDim * 0.4, cameraZ);
camera.lookAt(0, 0, 0);

// OrbitControls centrados
controls.target.set(0, 0, 0);
controls.update();

// Ajustar planos de clipping
camera.near = cameraZ / 100;
camera.far = cameraZ * 100;
camera.updateProjectionMatrix();


// 📦 GLB
const loader = new GLTFLoader();
loader.load('./model.glb', (gltf) => {

  gltf.scene.traverse((obj) => {
    if (!obj.isMesh) return;

    const m = obj.material;
    if (!m) return;

    // 👉 material filter
    if (!m.name.toLowerCase().includes('glass')) return;

    // 🔮 BETTER GLASS
    m.transparent = true;
    m.transmission = 1.0;
    m.thickness = 0.6;
    m.roughness = 0.1;
    m.ior = 1.45;

    // 🎨 GREEN TINT
    m.color.setRGB(0.1, 0.25, 0.1);

    m.depthWrite = false;
    m.side = THREE.DoubleSide;
    m.needsUpdate = true;
  });

  scene.add(gltf.scene);
});

// 🔁 Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 🔄 Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();



