import { VoxelWorld, ExtraModel, ExtraLight, LightType } from "./geometry";
import { TextureLoader, NearestFilter, MeshLambertMaterial, DoubleSide, BufferGeometry, Scene, PerspectiveCamera, Mesh, WebGLRenderer, Vector3, BoxGeometry, MeshBasicMaterial, AmbientLight, PointLightHelper, Clock, OrthographicCamera } from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { path } from "./atlas";
import { groupBy } from "./util";
import level from "./level.json";

const MODEL_ROOT = "/models";

// Basic scene setup
const scene = new Scene();
const D = 4;
const camera = new OrthographicCamera(-D*1, D*1, D, -D, 1, 1000);
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
    modelLoader.load(
        `${MODEL_ROOT}/${model}.glb`,
        (res) => {
            let geometry: BufferGeometry = (res.scene.children[0] as any)
                .geometry;

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
for (let light of extraLights) {
    scene.add(light.toLight());
}

export const createScene = (canvas, activeHighlightContainer) => {
    renderer = new WebGLRenderer({ canvas, antialias: true });
    highlightContainer = activeHighlightContainer;

    resize();
    window.addEventListener('resize', resize);

    animate();
};

export const resize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    
    let aspect = window.innerWidth / window.innerHeight;
    camera.left = -D*aspect;
    camera.right = D*aspect;
    camera.top = D;
    camera.bottom = -D;
    camera.updateProjectionMatrix();

    highlightContainer.setAttribute('width', window.innerWidth.toString());
    highlightContainer.setAttribute('height', window.innerHeight.toString());
    highlightContainer.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    highlightContainer.replaceChildren(highlightContainer.children[0]);
    for (let hi of highlights) {
        highlightBlock(hi);
    }
};

export const animate = () => {
    requestAnimationFrame(animate);

    // highlightContainer.replaceChildren(highlightContainer.children[0]);
    // for (let hi of highlights) {
    //     highlightBlock(hi);
    // }

    renderer.render(scene, camera);
};

export const handleBlockClick = (target) => (e) => {
    console.log(target, e);
};

export const highlightBlock = (block) => {
    const { x, y, z } = block;

    let corners = [
        [x, y, z],
        [x + 1, y, z],
        [x + 1, y + 1, z],
        [x + 1, y + 1, z + 1],
        [x, y + 1, z + 1],
        [x, y, z + 1]
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
    highlightContainer.innerHTML += `<polygon points="${points}" fill="red"/>`;
    let el = highlightContainer.lastElementChild;
    el.addEventListener('click', (e) => {
        console.log(e);
    })
}