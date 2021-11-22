<script>
    import {
        Canvas,
        Scene,
        PerspectiveCamera,
        DirectionalLight,
        AmbientLight,
        BufferGeometry,
        BufferAttribute,
        Mesh,
        MeshLambertMaterial,
        WebGLRenderer,
        OrbitControls,
        MeshBasicMaterial,
        TextureLoader,
        NearestFilter,
        MathUtils,
    } from "svelthree";
    import INITIAL_BLOCKS from "./blocks.json";

    const SIZE = 10;
    const FACES = [
        {
            // left
            dir: [-1, 0, 0],
            corners: [
                [0, 1, 0],
                [0, 0, 0],
                [0, 1, 1],
                [0, 0, 1],
            ],
        },
        {
            // right
            dir: [1, 0, 0],
            corners: [
                [1, 1, 1],
                [1, 0, 1],
                [1, 1, 0],
                [1, 0, 0],
            ],
        },
        {
            // bottom
            dir: [0, -1, 0],
            corners: [
                [1, 0, 1],
                [0, 0, 1],
                [1, 0, 0],
                [0, 0, 0],
            ],
        },
        {
            // top
            dir: [0, 1, 0],
            corners: [
                [0, 1, 1],
                [1, 1, 1],
                [0, 1, 0],
                [1, 1, 0],
            ],
        },
        {
            // back
            dir: [0, 0, -1],
            corners: [
                [1, 0, 0],
                [0, 0, 0],
                [1, 1, 0],
                [0, 1, 0],
            ],
        },
        {
            // front
            dir: [0, 0, 1],
            corners: [
                [0, 0, 1],
                [1, 0, 1],
                [0, 1, 1],
                [1, 1, 1],
            ],
        },
    ];

    let blocks = new Uint8Array(SIZE * SIZE * SIZE);

    const calcVoxelOffset = (x, y, z) => {
        const voxelX = MathUtils.euclideanModulo(x, SIZE) | 0;
        const voxelY = MathUtils.euclideanModulo(y, SIZE) | 0;
        const voxelZ = MathUtils.euclideanModulo(z, SIZE) | 0;
        const voxelOffset = voxelY * SIZE * SIZE + voxelZ * SIZE + voxelX;
        return voxelOffset;
    };

    const getVoxel = (x, y, z) => {
        let offset = calcVoxelOffset(x, y, z);
        if (offset < blocks.length) return blocks[offset];
        else return 0;
    };
    const setVoxel = (x, y, z, val) => (blocks[calcVoxelOffset(x, y, z)] = val);

    for (let y = 0; y < SIZE; ++y) {
        for (let z = 0; z < SIZE; ++z) {
            for (let x = 0; x < SIZE; ++x) {
                const height =
                    (Math.sin((x / SIZE) * Math.PI * 2) +
                        Math.sin((z / SIZE) * Math.PI * 3)) *
                        (SIZE / 6) +
                    SIZE / 2;
                if (y < height) {
                    setVoxel(x, y, z, 1);
                }
            }
        }
    }

    console.log(blocks);

    const calculateVertices = () => {
        const positions = [];
        const normals = [];
        const indices = [];

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                for (let z = 0; z < SIZE; z++) {
                    if (getVoxel(x, y, z)) {
                        for (const { dir, corners } of FACES) {
                            let neighbourOnSide = getVoxel(
                                x + dir[0],
                                y + dir[1],
                                z + dir[2]
                            );
                            if (neighbourOnSide) {
                                // We need a face riiiight here
                                const ndx = positions.length / 3;
                                for (const pos of corners) {
                                    positions.push(
                                        pos[0] + x,
                                        pos[1] + y,
                                        pos[2] + z
                                    );
                                    normals.push(...dir);
                                }
                                indices.push(
                                    ndx,
                                    ndx + 1,
                                    ndx + 2,
                                    ndx + 2,
                                    ndx + 1,
                                    ndx + 3
                                );
                            }
                        }
                    }
                }
            }
        }

        return { positions, normals, indices };
    };

    const { positions, normals, indices } = calculateVertices();

    const geometry = new BufferGeometry();
    geometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(positions), 3)
    );
    geometry.setAttribute(
        "normal",
        new BufferAttribute(new Float32Array(normals), 3)
    );
    geometry.setIndex(indices);

    const material = new MeshLambertMaterial({ color: "green" });
</script>

<Canvas let:sti w={500} h={500}>
    <Scene {sti} let:scene id="scene1" props={{ background: 0xedf2f7 }}>
        <PerspectiveCamera
            {scene}
            id="cam1"
            pos={[-SIZE * 0.3, SIZE * 0.8, -SIZE * 0.3]}
            lookAt={[SIZE / 2, SIZE / 2, SIZE / 2]}
        />
        <AmbientLight {scene} intensity={0.5} />
        <DirectionalLight {scene} pos={[-1, 2, 4]} intensity={1} />
        <DirectionalLight {scene} pos={[1, -1, -2]} intensity={1} />

        <Mesh {scene} {geometry} {material} />

        <OrbitControls {scene} autoRotate enableDamping />
    </Scene>

    <WebGLRenderer
        {sti}
        sceneId="scene1"
        camId="cam1"
        config={{ antialias: true, alpha: true }}
    />
</Canvas>
