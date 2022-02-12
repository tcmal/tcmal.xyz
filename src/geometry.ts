import { BufferAttribute, BufferGeometry, Euler, MathUtils, PointLight, Vector3 } from "three";

import * as ATLAS_DESC from "./atlas.js";

const ATLAS_WIDTH = ATLAS_DESC.tileSize * ATLAS_DESC.nColumns;
const ATLAS_HEIGHT = ATLAS_DESC.tileSize * 3;
const TILE_SIZE_SCALED_Y = ATLAS_DESC.tileSize / ATLAS_HEIGHT;
const TILE_SIZE_SCALED_X = ATLAS_DESC.tileSize / ATLAS_WIDTH;
const ROT_Y = new Vector3(0, 1, 0);

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
    blocks: object;
    extras: object;

    constructor(size) {
        this.size = size;

        this.blocks = {};
        this.extras = {};
    }

    fromLevelJson(json) {
        for (let { x, y, z, name, metadata } of json) {
            if (ATLAS_DESC.nameMap[name]) {
                this.setVoxel(x, y, z, ATLAS_DESC.nameMap[name]);
                if (Object.keys(metadata).length > 0)
                    this.setExtras(x, y, z, metadata);
            } else {
                console.warn("Unrecognised block name: " + name);
            }
        }
    }

    keyFromXYZ = (x, y, z) => {
        const voxelX = MathUtils.euclideanModulo(x, this.size) | 0;
        const voxelY = MathUtils.euclideanModulo(y, this.size) | 0;
        const voxelZ = MathUtils.euclideanModulo(z, this.size) | 0;
        const voxelOffset = (voxelY * this.size * this.size) + (voxelZ * this.size) + voxelX;
        return voxelOffset;
    };

    xyzFromKey = (key) => {
        const x = MathUtils.euclideanModulo(key, this.size) | 0;
        const z = (MathUtils.euclideanModulo(key - x, this.size * this.size) | 0) / this.size;
        const y = (key - x - (z * this.size)) / (this.size * this.size) | 0;
        return { x, y, z };
    }

    getVoxel(x, y, z) {
        if (Math.min(x, y, z) < 0 || Math.max(x, y, z) >= this.size) return undefined;
        return this.blocks[this.keyFromXYZ(x, y, z)];
    }

    getExtras(x: any, y: any, z: any) {
        if (Math.min(x, y, z) < 0 || Math.max(x, y, z) >= this.size) return undefined;
        return this.extras[this.keyFromXYZ(x, y, z)];
    }

    setVoxel(x, y, z, val) {
        this.blocks[this.keyFromXYZ(x, y, z)] = val
    }

    setExtras(x, y, z, extras) {
        this.extras[this.keyFromXYZ(x, y, z)] = extras;
    }

    getGeometry() {
        const { positions, uvs, normals, indices, extras } = this.computeVertices();
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

        return { geometry, extras };
    }

    computeVertices(): BufferSet {
        const buffers = new BufferSet([], [], [], [], []);
        for (let key in this.blocks) {
            const { x, y, z } = this.xyzFromKey(key);
            const block = this.blocks[key];
            const extras = this.extras[key];

            if (block !== 0) {
                // Alternative drawing for special types
                if (extras !== undefined && extras.specialType !== undefined) {
                    this.alternativeDraw(x, y, z, buffers);
                    continue;
                }

                for (const { dir, corners, uvRow } of FACES) {
                    let neighbourCoordOffset = this.keyFromXYZ(x + dir[0],
                        y + dir[1],
                        z + dir[2]);
                    if (this.blocks[neighbourCoordOffset] === undefined || this.extras[neighbourCoordOffset] !== undefined) {
                        // We need a face riiiight here
                        buffers.setMarker();

                        for (const { pos, uv } of corners) {
                            buffers.addPosition(
                                pos[0] + x,
                                pos[1] + y,
                                pos[2] + z
                            );
                            buffers.addUV(
                                ...transformUV(uv, block - 1, uvRow)
                            );

                            buffers.addNormal(...dir);
                        }
                        buffers.addIndicesFromMarker(
                            0,
                            1,
                            2,
                            2,
                            1,
                            3
                        );
                    }
                }
            }
        }
        return buffers;
    }

    alternativeDraw(x, y, z, buffers) {
        const extras = this.getExtras(x, y, z);
        const block = this.getVoxel(x, y, z);
        return ({
            [ATLAS_DESC.CHEST]: () => [], // TODO
            [ATLAS_DESC.MODEL]: () => {
                let obj = new ExtraModel(extras.model);
                obj.position.set(x, y, z);
                buffers.addExtras(obj);
            },
            [ATLAS_DESC.TORCH]: () => {

                let obj = new ExtraModel(
                    'torch',
                );
                obj.position.set(x + .5, y - .75, z + .5);
                obj.ignoreLighting = true;

                let light = new ExtraLight(LightType.Point);
                light.position.set(x + .5, y + .5, z + .5);
                light.color = 0xFFFDCF;
                light.intensity = 1.0;
                light.hasParticles = true;

                buffers.addExtras(obj, light);
            },
            [ATLAS_DESC.BED]: () => {
                if (extras.part != "head")
                    return;

                const rotationAngle = {
                    "north": 0,
                    "south": Math.PI,
                    "east": Math.PI / 2,
                    "west": Math.PI / -2,
                }[extras.facing];


                let obj = new ExtraModel(
                    'bed',
                );
                obj.position.set(x + 0.5, y + 0.5, z);
                obj.rotation.set(0, rotationAngle, 0);

                buffers.addExtras(obj);
            },

            [ATLAS_DESC.SLAB]: () => {
                // Basically normal block rendering, but change our faces array
                for (const { dir, corners, uvRow } of FACES) {
                    let neighbourCoordOffset = this.keyFromXYZ(x + dir[0],
                        y + dir[1],
                        z + dir[2]);
                    let modY = extras.type == "top" ? 0.5 : 0;
                    if (this.blocks[neighbourCoordOffset] === undefined || this.extras[neighbourCoordOffset] !== undefined) {
                        // We need a face riiiight here
                        buffers.setMarker();

                        for (const { pos, uv } of corners) {
                            buffers.addPosition(
                                pos[0] + x,
                                (pos[1] * .5) + y + modY,
                                pos[2] + z
                            );
                            if (uvRow === 0) {
                                buffers.addUV(
                                    ...transformUV([uv[0], uv[1] * .5], block - 1, uvRow)
                                );
                            } else { // Top/bottom, dont change UV Y.
                                buffers.addUV(
                                    ...transformUV(uv, block - 1, uvRow)
                                );
                            }


                            buffers.addNormal(...dir);
                        }
                        buffers.addIndicesFromMarker(
                            0,
                            1,
                            2,
                            2,
                            1,
                            3
                        );
                    }
                }
            },
            [ATLAS_DESC.STAIRS]: () => {
                // Faces, constructed facing north (negative Z)
                const STAIRS_FACES = [
                    // Bottom
                    {
                        uvRow: 2,
                        normal: [0, -1, 0],
                        corners: [
                            { pos: [1, 0, 1], uv: [1, 0] },
                            { pos: [0, 0, 1], uv: [0, 0] },
                            { pos: [1, 0, 0], uv: [1, 1] },
                            { pos: [0, 0, 0], uv: [0, 1] },
                        ],
                    },
                    // Back
                    {
                        uvRow: 0,
                        normal: [0, 0, 1],
                        corners: [
                            { pos: [0, 1, 1], uv: [0, 1] },
                            { pos: [0, 0, 1], uv: [0, 0] },
                            { pos: [1, 1, 1], uv: [1, 1] },
                            { pos: [1, 0, 1], uv: [1, 0] },
                        ],
                    },
                    // Top of top stair
                    {
                        uvRow: 1,
                        normal: [0, 1, 0],
                        corners: [
                            { pos: [0, 1, 1], uv: [0, 1] },
                            { pos: [0, 1, 0.5], uv: [0, 0.5] },
                            { pos: [1, 1, 1], uv: [1, 1] },
                            { pos: [1, 1, 0.5], uv: [1, 0.5] },
                        ],
                    },
                    // Top of bottom stair
                    {
                        uvRow: 1,
                        normal: [0, 1, 0],
                        corners: [
                            { pos: [0, 0.5, 0.5], uv: [0, 0.5] },
                            { pos: [0, 0.5, 0], uv: [0, 0] },
                            { pos: [1, 0.5, 0.5], uv: [1, 0.5] },
                            { pos: [1, 0.5, 0], uv: [1, 0] },
                        ],
                    },
                    // Side of top stair
                    {
                        uvRow: 0,
                        normal: [0, 0, -1],
                        corners: [
                            { pos: [0, 1, 0.5], uv: [0, 1] },
                            { pos: [0, 0.5, 0.5], uv: [0, 0.5] },
                            { pos: [1, 1, 0.5], uv: [1, 1] },
                            { pos: [1, 0.5, 0.5], uv: [1, 0.5] },
                        ],
                    },
                    // Side of bottom stair
                    {
                        uvRow: 0,
                        normal: [0, 0, -1],
                        corners: [
                            { pos: [0, 0.5, 0], uv: [0, 0.5] },
                            { pos: [0, 0, 0], uv: [0, 0] },
                            { pos: [1, 0.5, 0], uv: [1, 0.5] },
                            { pos: [1, 0, 0], uv: [1, 0] },
                        ],
                    },
                    // Side profile (left)
                    {
                        // Index path: (0, 1, 2), (1, 2, 3), (3, 4, 5) (3, 4, 6)
                        uvRow: 0,
                        normal: [-1, 0, 0],
                        corners: [
                            { pos: [0, 0, 0], uv: [0, 0] },
                            { pos: [0, 0, 1], uv: [1, 0] },
                            { pos: [0, 0.5, 0], uv: [0, 0.5] },
                            { pos: [0, 0.5, 1], uv: [1, 0.5] },
                            { pos: [0, 1, 0.5], uv: [.5, 1] },
                            { pos: [0, 0.5, 0.5], uv: [.5, .5] },
                            { pos: [0, 1, 1], uv: [1, 1] },
                        ],

                    },
                    // Side profile (right)
                    {
                        // Index path: (0, 1, 2), (1, 2, 3), (3, 4, 5) (3, 4, 6)
                        uvRow: 0,
                        normal: [1, 0, 0],
                        corners: [
                            { pos: [1, 0, 0], uv: [0, 0] },
                            { pos: [1, 0, 1], uv: [1, 0] },
                            { pos: [1, 0.5, 0], uv: [0, 0.5] },
                            { pos: [1, 0.5, 1], uv: [1, 0.5] },
                            { pos: [1, 1, 0.5], uv: [.5, 1] },
                            { pos: [1, 0.5, 0.5], uv: [.5, .5] },
                            { pos: [1, 1, 1], uv: [1, 1] },
                        ],

                    },
                ];
                const STAIRS_FACES_TO_DRAW = [
                    {
                        // left
                        dir: [-1, 0, 0],
                        faces: [3, 4, 6]
                    },
                    {
                        // right
                        dir: [1, 0, 0],
                        faces: [3, 4, 7]
                    },
                    {
                        // bottom
                        dir: [0, -1, 0],
                        faces: [0]
                    },
                    {
                        // top
                        dir: [0, 1, 0],
                        faces: [2, 3]
                    },
                    {
                        // back
                        dir: [0, 0, -1],
                        faces: [1]
                    },
                    {
                        // front
                        dir: [0, 0, 1],
                        faces: [3, 4, 5]
                    },
                ];

                // Raycast in each direction to figure out what faces we need to draw
                let drawing = {};
                for (const { dir, faces } of STAIRS_FACES_TO_DRAW) {
                    let neighbourCoordOffset = this.keyFromXYZ(x + dir[0],
                        y + dir[1],
                        z + dir[2]);
                    if (this.blocks[neighbourCoordOffset] === undefined || this.extras[neighbourCoordOffset] !== undefined) {
                        for (var face of faces) {
                            drawing[face] = true;
                        }
                    }
                }

                // Draw each face
                // TODO: Deal with "shape"
                // TODO: Deal with "half"
                const [rotationAngle, transformation, uvTransformation] = {
                    "north": [Math.PI, new Vector3(1, 0, 1), new Vector3(0, -1, 0)],
                    "south": [0, new Vector3(0, 0, 0), new Vector3(0, 0, 0)],
                    "east": [Math.PI / 2, new Vector3(0, 0, 1), new Vector3(0, 0, 0)],
                    "west": [Math.PI / -2, new Vector3(1, 0, 0), new Vector3(0, 0, 0)],
                }[extras.facing];

                for (let { corners, uvRow, normal } of Object.keys(drawing).map(x => STAIRS_FACES[x])) {
                    buffers.setMarker();

                    let workingVec = new Vector3(0, 0, 0);
                    for (const { pos, uv } of corners) {
                        workingVec.setX(pos[0]);
                        workingVec.setY(pos[1]);
                        workingVec.setZ(pos[2]);
                        workingVec.applyAxisAngle(ROT_Y, rotationAngle);
                        buffers.addPosition(
                            workingVec.x + x + transformation.x,
                            workingVec.y + y + transformation.y,
                            workingVec.z + z + transformation.z
                        );

                        buffers.addUV(
                            ...transformUV(uv, block - 1, uvRow)
                        );

                        buffers.addNormal(...normal);
                    }
                    if (corners.length == 4) {
                        buffers.addIndicesFromMarker(
                            0,
                            1,
                            2,
                            2,
                            1,
                            3
                        );
                    } else {
                        buffers.addIndicesFromMarker(
                            // (0, 1, 2), (1, 2, 3), (3, 4, 5) (3, 4, 6)
                            0,
                            1,
                            2,
                            1,
                            2,
                            3,
                            3,
                            4,
                            5,
                            3,
                            4,
                            6,
                        );
                    }

                }
            },
        })[extras.specialType]();
    }
}


abstract class ExtraObject {
    position: Vector3
    rotation: Euler
    scale: Vector3

    constructor() {
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Euler(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);
    }
}

export class ExtraModel extends ExtraObject {
    model: string
    ignoreLighting = false

    constructor(model) {
        super();

        this.model = model;
    }
}

export enum LightType {
    Point
}

export class ExtraLight extends ExtraObject {
    type: LightType;

    distance?: number;
    color?: number;
    intensity?: number;
    decay?: number;
    hasParticles?: boolean;

    constructor(type) {
        super();

        this.type = type;
    }

    toLight() {
        let light;
        if (this.type == LightType.Point) {
            light = new PointLight(this.color, this.intensity, this.distance, this.decay);
        }

        light.position.copy(this.position);
        light.rotation.copy(this.rotation);
        light.scale.copy(this.scale);

        return light;
    }
}

class BufferSet {
    positions: number[]
    uvs: number[]
    normals: number[]
    indices: number[]
    marker?: number
    extras: ExtraObject[]

    constructor(positions, uvs, normals, indices, extras) {
        this.positions = positions;
        this.uvs = uvs;
        this.normals = normals;
        this.indices = indices;
        this.extras = extras;
    }

    addIndices(...indices) {
        this.indices.push(...indices);
    }
    addNormal(...normals) {
        this.normals.push(...normals);
    }
    addUV(...uvs) {
        this.uvs.push(...uvs);
    }
    addPosition(...positions) {
        this.positions.push(...positions);
    }
    addExtras(...extras) {
        this.extras.push(...extras);
    }

    setMarker() {
        this.marker = this.positions.length / 3;
    }

    addIndicesFromMarker(...indices) {
        if (this.marker === undefined)
            throw new Error("Called addIndicesFromMarker without calling setMarker");

        this.addIndices(...indices.map(x => this.marker + x));

        this.marker = undefined;
    }

}