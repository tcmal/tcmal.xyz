import { BufferAttribute, BufferGeometry, MathUtils } from "svelthree";

import * as ATLAS_DESC from "./atlas.js";

const ATLAS_WIDTH = ATLAS_DESC.tileSize * ATLAS_DESC.nColumns;
const ATLAS_HEIGHT = ATLAS_DESC.tileSize * 3;
const TILE_SIZE_SCALED_Y = ATLAS_DESC.tileSize / ATLAS_HEIGHT;
const TILE_SIZE_SCALED_X = ATLAS_DESC.tileSize / ATLAS_WIDTH;

// Transform a UV coordinate to the space of the entire atlas
// This assumes texCol and texRow are valid, and uses (0, 0) at the bottom left
const transformUV = (uv, texCol, texRow) => [
    TILE_SIZE_SCALED_X * texCol + uv[0] * TILE_SIZE_SCALED_X,
    1 - (texRow + 1 - uv[1]) * TILE_SIZE_SCALED_Y,
];

// Some static data used to compute geometry.
const FACES = [
    {
        // left
        uvRow: 0,
        dir: [-1, 0, 0],
        corners: [
            { pos: [0, 1, 0], uv: [0, 1] },
            { pos: [0, 0, 0], uv: [0, 0] },
            { pos: [0, 1, 1], uv: [1, 1] },
            { pos: [0, 0, 1], uv: [1, 0] },
        ],
    },
    {
        // right
        uvRow: 0,
        dir: [1, 0, 0],
        corners: [
            { pos: [1, 1, 1], uv: [0, 1] },
            { pos: [1, 0, 1], uv: [0, 0] },
            { pos: [1, 1, 0], uv: [1, 1] },
            { pos: [1, 0, 0], uv: [1, 0] },
        ],
    },
    {
        // bottom
        uvRow: 2,
        dir: [0, -1, 0],
        corners: [
            { pos: [1, 0, 1], uv: [1, 0] },
            { pos: [0, 0, 1], uv: [0, 0] },
            { pos: [1, 0, 0], uv: [1, 1] },
            { pos: [0, 0, 0], uv: [0, 1] },
        ],
    },
    {
        // top
        uvRow: 1,
        dir: [0, 1, 0],
        corners: [
            { pos: [0, 1, 1], uv: [1, 1] },
            { pos: [1, 1, 1], uv: [0, 1] },
            { pos: [0, 1, 0], uv: [1, 0] },
            { pos: [1, 1, 0], uv: [0, 0] },
        ],
    },
    {
        // back
        uvRow: 0,
        dir: [0, 0, -1],
        corners: [
            { pos: [1, 0, 0], uv: [0, 0] },
            { pos: [0, 0, 0], uv: [1, 0] },
            { pos: [1, 1, 0], uv: [0, 1] },
            { pos: [0, 1, 0], uv: [1, 1] },
        ],
    },
    {
        // front
        uvRow: 0,
        dir: [0, 0, 1],
        corners: [
            { pos: [0, 0, 1], uv: [0, 0] },
            { pos: [1, 0, 1], uv: [1, 0] },
            { pos: [0, 1, 1], uv: [0, 1] },
            { pos: [1, 1, 1], uv: [1, 1] },
        ],
    },
];

export class VoxelWorld {
    size: number;
    blocks: Uint8Array;

    constructor(size) {
        this.size = size;

        this.blocks = new Uint8Array(size * size * size);
    }


    calcVoxelOffset = (x, y, z) => {
        const voxelX = MathUtils.euclideanModulo(x, this.size) | 0;
        const voxelY = MathUtils.euclideanModulo(y, this.size) | 0;
        const voxelZ = MathUtils.euclideanModulo(z, this.size) | 0;
        const voxelOffset = voxelY * this.size * this.size + voxelZ * this.size + voxelX;
        return voxelOffset;
    };

    getVoxel(x, y, z) {
        if (Math.min(x, y, z) < 0 || Math.max(x, y, z) >= this.size) return 0;
        return this.blocks[this.calcVoxelOffset(x, y, z)];
    }

    setVoxel(x, y, z, val) {
        this.blocks[this.calcVoxelOffset(x, y, z)] = val
    }

    getGeometry() {
        const { positions, uvs, normals, indices } = this.computeVertices();
        const geometry = new BufferGeometry();
        geometry.setAttribute(
            "position",
            new BufferAttribute(new Float32Array(positions), 3)
        );
        geometry.setAttribute(
            "normal",
            new BufferAttribute(new Float32Array(normals), 3)
        );
        geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
        geometry.setIndex(indices);

        return geometry;
    }

    computeVertices() {
        const positions = [];
        const uvs = [];
        const normals = [];
        const indices = [];

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const voxelVal = this.getVoxel(x, y, z);
                    if (voxelVal !== 0) {
                        for (const { dir, corners, uvRow } of FACES) {
                            let neighbourOnSide = this.getVoxel(
                                x + dir[0],
                                y + dir[1],
                                z + dir[2],
                            );
                            if (!neighbourOnSide) {
                                // We need a face riiiight here
                                const ndx = positions.length / 3;
                                for (const { pos, uv } of corners) {
                                    positions.push(
                                        pos[0] + x,
                                        pos[1] + y,
                                        pos[2] + z
                                    );
                                    uvs.push(
                                        ...transformUV(uv, voxelVal, uvRow)
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

        return { positions, normals, indices, uvs };
    }
}