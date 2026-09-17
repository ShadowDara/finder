import { jsx } from "twynejs/jsx-runtime";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import model from "./model.json";

type Vec3 = number[];

type Element = {
  from: Vec3;
  to: Vec3;
  rotation?: {
    angle: number;
    axis: "x" | "y" | "z" | string;
    origin: Vec3;
  };
};

type Model = {
  elements: Element[];
};

function createMinecraftCube(element: Element): THREE.Mesh {
  const { from, to, rotation } = element;

  const size: [number, number, number] = [
    (to[0] - from[0]) / 16,
    (to[1] - from[1]) / 16,
    (to[2] - from[2]) / 16,
  ];

  const position: [number, number, number] = [
    (from[0] + to[0]) / 32 - 0.5,
    (from[1] + to[1]) / 32 - 0.5,
    (from[2] + to[2]) / 32 - 0.5,
  ];

  const geometry = new THREE.BoxGeometry(...size);

  const material = new THREE.MeshStandardMaterial({
    color: 0xff8800,
    wireframe: true,
  });

  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(...position);

  if (rotation) {
    const rad = THREE.MathUtils.degToRad(rotation.angle);

    switch (rotation.axis) {
      case "x":
        mesh.rotation.x = rad;
        break;

      case "y":
        mesh.rotation.y = rad;
        break;

      case "z":
        mesh.rotation.z = rad;
        break;
    }
  }

  return mesh;
}

function createMinecraftModel(data: Model): THREE.Group {
  const group = new THREE.Group();

  for (const element of data.elements) {
    group.add(createMinecraftCube(element));
  }

  return group;
}

export default function App(el: HTMLElement) {
  const container = (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    />
  );

  el.appendChild(container);

  // Scene
  const scene = new THREE.Scene();

  scene.background = new THREE.Color(0x222222);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );

  camera.position.set(3, 3, 3);

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setSize(container.clientWidth, container.clientHeight);

  container.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);

  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

  directionalLight.position.set(5, 5, 5);

  scene.add(directionalLight);

  // Minecraft model
  const minecraftModel = createMinecraftModel(model);

  scene.add(minecraftModel);

  // Orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;

  // Resize
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  }

  window.addEventListener("resize", resize);

  // Render loop
  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
  }

  animate();
}
