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
    } from "svelthree";
    import { VoxelWorld } from "./geometry";
    import { path, nameMap } from "./atlas";
    import level from "./level.json";

    export let w: number;
    export let h: number;

    let canvas: Canvas;

    const world = new VoxelWorld(16);
    const tex = new TextureLoader().load(path);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;

    for (let { x, y, z, name, metadata } of level) {
        if (nameMap[name]) {
            world.setVoxel(x, y, z, nameMap[name]);
            if (Object.keys(metadata).length > 0)
                world.setExtras(x, y, z, metadata);
        } else {
            console.warn("Unrecognised block name: " + name);
        }
    }

    const geometry = world.getGeometry();
    const material = new MeshLambertMaterial({ map: tex, side: DoubleSide });

    // Deal with vatro/svelthree#38
    $: w || h ? changeCanvasSize() : null;
    const changeCanvasSize = () => {
        console.log("changecanvassize");
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

        <OrbitControls {scene} enableDamping />
    </Scene>

    <WebGLRenderer
        {sti}
        sceneId="scene1"
        camId="cam1"
        config={{ antialias: true, alpha: true }}
    />
</Canvas>
