<script lang="ts">
    import {
        Canvas,
        Scene,
        PerspectiveCamera,
        Mesh,
        MeshLambertMaterial,
        WebGLRenderer,
        OrbitControls,
        TextureLoader,
        AmbientLight,
        NearestFilter,
        DoubleSide,
        GLTFLoader,
        Geometry,
        BufferGeometry,
    } from "svelthree";
    import { VoxelWorld } from "./geometry";
    import { path, nameMap } from "./atlas";
    import level from "./level.json";

    const MODEL_ROOT = "/models";

    export let w: number;
    export let h: number;

    const groupBy = function (xs, key) {
        return xs.reduce(function (rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    };

    let canvas: Canvas;

    const world = new VoxelWorld(32);
    const tex = new TextureLoader().load(path);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;

    for (let { x, y, z, name, metadata } of level) {
        if (nameMap[name]) {
            world.setVoxel(x + 4, y, z, nameMap[name]);
            if (Object.keys(metadata).length > 0)
                world.setExtras(x + 4, y, z, metadata);
        } else {
            console.warn("Unrecognised block name: " + name);
        }
    }

    const { geometry, extras } = world.getGeometry();
    const material = new MeshLambertMaterial({ map: tex, side: DoubleSide });

    let extrasByModel = groupBy(extras, "model");
    let loadedExtras = [];
    let modelLoader = new GLTFLoader();
    for (let model in extrasByModel) {
        modelLoader.load(
            `${MODEL_ROOT}/${model}.glb`,
            (res) => {
                let geometry: BufferGeometry = (res.scene.children[0] as any)
                    .geometry;

                // Fix for flipped UV y of GLTF
                let uvs = geometry.attributes.uv.array;
                for (let i = 1; i < uvs.length; i += 2) {
                    uvs[i] = 1 - uvs[i];
                }

                loadedExtras = [
                    ...loadedExtras,
                    ...extrasByModel[model].map((x) => ({
                        geometry,
                        ...x,
                    })),
                ];
            },
            undefined,
            (err) => {
                console.error("Error loading model " + model);
                console.error(err);
                // TODO
            }
        );
    }

    $: console.log(loadedExtras);

    // Deal with vatro/svelthree#38
    $: w || h ? changeCanvasSize() : null;
    const changeCanvasSize = () => {
        canvas && canvas.doResize(w, h);
    };
</script>

<Canvas let:sti bind:this={canvas} {w} {h}>
    <Scene {sti} let:scene id="scene1">
        <PerspectiveCamera
            {scene}
            id="cam1"
            pos={[-7.5, 7.5, -7.5]}
            lookAt={[7.5, 7.5, 7.5]}
        />
        <AmbientLight {scene} intensity={1.0} />

        <Mesh {scene} {geometry} {material} />

        {#each loadedExtras as extra}
            <Mesh
                {scene}
                geometry={extra.geometry}
                {material}
                pos={[extra.position.x, extra.position.y, extra.position.z]}
                rot={[extra.rotation.x, extra.rotation.y, extra.rotation.z]}
                scale={[extra.scale.x, extra.scale.y, extra.scale.z]}
            />
        {/each}

        <OrbitControls {scene} enableDamping />
    </Scene>

    <WebGLRenderer
        {sti}
        sceneId="scene1"
        camId="cam1"
        config={{ antialias: true, alpha: true }}
    />
</Canvas>
