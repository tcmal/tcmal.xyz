import { VoxelWorld, ExtraModel, ExtraLight, LightType } from "./geometry";
import { TextureLoader, NearestFilter, MeshLambertMaterial, DoubleSide, BufferGeometry, Scene, Mesh, WebGLRenderer, Vector3, MeshBasicMaterial, AmbientLight, OrthographicCamera, Points, PointsMaterial, Float32BufferAttribute } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { path } from "./atlas";
import { groupBy } from "./util";
import level from "./level.json";

const MODEL_ROOT = "/models";
const TORCH_PARTICLE_MOVE_SPEED = 0.6;
const TORCH_FLICKER_INTENSITY = 0.1;
const TORCH_FLICKER_LERP_DURATION = 1;

// Basic scene setup
const scene = new Scene();
const D = 4;
const camera = new OrthographicCamera(-D * 1, D * 1, D, -D, 1, 1000);
camera.position.set(0, 6, 0);
camera.lookAt(new Vector3(3, 4, 3));

const ambientLight = new AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

let renderer;
let highlightContainer: SVGElement;

// Load texture atlas
const tex = new TextureLoader().load(path);
tex.magFilter = NearestFilter;
tex.minFilter = NearestFilter;
const material = new MeshLambertMaterial({ map: tex, side: DoubleSide });
const materialNoLighting = new MeshBasicMaterial({ map: tex, side: DoubleSide });

// Populate world from level.json
const world = new VoxelWorld(32);
world.fromLevelJson(level);

// Calculate world geometry
const { geometry, extras } = world.getGeometry();
const worldMesh = new Mesh(geometry, material);
scene.add(worldMesh);

// Make sure we highlight blocks
let highlights = level.filter(x => x.metadata.highlight);

// Deal with extra models (irregular / custom blocks)
let extrasByModel = groupBy(
  extras.filter((x) => x instanceof ExtraModel),
  "model"
);
let modelLoader = new GLTFLoader();
for (let model in extrasByModel) {
  console.log(model);
  modelLoader.load(
    `${MODEL_ROOT}/${model}.glb`,
    (res) => {
      let geometry: BufferGeometry = (res.scene.children[0] as any)
        .geometry;
      console.log(res.scene);
      // Fix for flipped UV y of GLTF
      let uvs = geometry.attributes.uv.array as any;
      for (let i = 1; i < uvs.length; i += 2) {
        uvs[i] = 1 - uvs[i];
      }

      for (let extra of extrasByModel[model]) {
        let mesh;
        if (!extra.ignoreLighting) {
          mesh = new Mesh(geometry, material);
        } else {
          mesh = new Mesh(geometry, materialNoLighting);
        }
        mesh.position.copy(extra.position);
        mesh.rotation.copy(extra.rotation);
        mesh.scale.copy(extra.scale);

        console.log(mesh);
        scene.add(mesh);
      }
    },
    undefined,
    (err) => {
      console.error("Error loading model " + model);
      console.error(err);
      // TODO
    }
  );
}

// Deal with extra lights (torches, etc)
let extraLights = extras.filter(
  (x) => x instanceof ExtraLight
) as ExtraLight[];
let lightObjs = extraLights.map(x => x.toLight());
lightObjs.forEach(x => {
  x.originalIntensity = x.intensity;
  x.lerpCompleted = 1;
  x.lerpDuration = 1;
  x.lerpLast = x.intensity;
  x.lerpDistance = 0;
  scene.add(x)
});

// Deal with particle systems (for torches)
let particleSystems = extraLights.filter(x => x.hasParticles).map(x => {
  const geometry = new BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 5; i++) {
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();

    vertices.push(x, y, z);
  }

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));

  const particleMaterial = new PointsMaterial({ size: 5 });
  particleMaterial.color.setRGB(0.2, 0.2, 0.2);

  const system = new Points(geometry, particleMaterial);
  system.position.copy(x.position);
  system.scale.set(0.25, 1, 0.25);

  return system;
});

particleSystems.forEach(x => scene.add(x));

export const createScene = (canvas, activeHighlightContainer) => {
  renderer = new WebGLRenderer({ canvas, antialias: true });
  highlightContainer = activeHighlightContainer;

  resize();
  window.addEventListener('resize', resize);

  animate(0);

  updateHighlights();
};

export const resize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight)

  let aspect = window.innerWidth / window.innerHeight;
  camera.left = -D * aspect;
  camera.right = D * aspect;
  camera.top = D;
  camera.bottom = -D;
  camera.updateProjectionMatrix();

  highlightContainer.setAttribute('width', window.innerWidth.toString());
  highlightContainer.setAttribute('height', window.innerHeight.toString());
  highlightContainer.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
};

let lastTime = 0;
export const animate = (time) => {
  requestAnimationFrame(animate);

  let delta = time - lastTime;
  lastTime = time;

  for (let light of lightObjs) {
    let progress = light.lerpCompleted / light.lerpDuration;
    light.intensity = light.lerpLast + (progress * light.lerpDistance);
    if (progress >= 1) {
      light.lerpCompleted = 0;
      light.lerpRemaining = Math.random() * TORCH_FLICKER_LERP_DURATION;

      light.lerpLast = light.intensity = light.lerpLast + light.lerpDistance;

      let newIntensity = light.originalIntensity + (Math.random() * TORCH_FLICKER_INTENSITY * 2) - TORCH_FLICKER_INTENSITY;
      light.lerpDistance = newIntensity - light.intensity;
    } else {
      light.lerpCompleted += delta / 1000;
    }
  }
  for (let system of particleSystems) {
    let verts = system.geometry.attributes.position;
    for (let pIdx = 0; pIdx < verts.count; pIdx++) {
      verts.setY(pIdx, verts.getY(pIdx) + (TORCH_PARTICLE_MOVE_SPEED * delta / 1000));

      if (verts.getY(pIdx) > 1) {
        verts.setX(pIdx, Math.random());
        verts.setY(pIdx, Math.random() * .25);
        verts.setZ(pIdx, Math.random());
      }

      verts.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
};

export const handleBlockClick = (target) => (e) => {
  console.log(target, e);
};


export const updateHighlights = () => {
  highlightContainer.replaceChildren(highlightContainer.children[0]);
  for (let hi of highlights) {
    highlightBlock(hi);
  }
}

export const highlightBlock = (block) => {
  const { x, y, z } = block;

  let scale = block.metadata.highlightScale || 1;
  let offset = block.metadata.highlightOffset || [0, 0, 0];
  let corners = [
    [x + offset[0], y + offset[1], z + offset[2]],
    [x + scale + offset[0], y + offset[1], z + offset[2]],
    [x + scale + offset[0], y + scale + offset[1], z + offset[2]],
    [x + scale + offset[0], y + scale + offset[1], z + scale + offset[2]],
    [x + offset[0], y + scale + offset[1], z + scale + offset[2]],
    [x + offset[0], y + offset[1], z + scale + offset[2]]
  ];

  let pos = new Vector3();
  var width = window.innerWidth, height = window.innerHeight;
  var widthHalf = width / 2, heightHalf = height / 2;

  let points = "";
  for (let [cx, cy, cz] of corners) {
    pos.set(cx, cy, cz);
    pos.project(camera);
    pos.x = (pos.x * widthHalf) + widthHalf;
    pos.y = - (pos.y * heightHalf) + heightHalf;

    points += `${pos.x.toFixed(0)},${pos.y.toFixed(0)} `;
  }

  points = points.trim();

  // Using createElement doesn't work for some reason
  highlightContainer.innerHTML += `<polygon data-block="${[x, y, z]}" points="${points}" fill="red"/>`;
  let el = highlightContainer.lastElementChild;
  el.addEventListener('click', (e) => {
    console.log(e);
  })
}
