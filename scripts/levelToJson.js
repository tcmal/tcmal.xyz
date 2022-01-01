const World = require('prismarine-world')('1.16')
const Chunk = require('prismarine-chunk')('1.16')
const Anvil = require('prismarine-provider-anvil').Anvil('1.16')
const Vec3 = require('vec3')

const BED = 1;
const STAIRS = 2;
const SLAB = 3;
const CHEST = 4;

const getBlocks = async (world, min, max) => {
    let blocks = [];
    for (let x = min.x; x <= max.x; x++) {
        for (let y = min.y; y <= max.y; y++) {
            for (let z = min.z; z <= max.z; z++) {
                let block = await world.getBlock(new Vec3(x, y, z));
                if (block.name !== 'air') {
                    let specialType = undefined;
                    if (block.name.includes("bed")) {
                        specialType = BED;
                    } else if (block.name.includes("slab")) {
                        specialType = SLAB;
                    } else if (block.name.includes("stairs")) {
                        specialType = STAIRS;
                    } else if (block.name.includes("chest")) {
                        specialType = CHEST;
                    }
                    blocks.push({
                        x: x - min.x,
                        y: y - min.y,
                        z: z - min.z,
                        name: 'minecraft:' + block.name,
                        metadata: { specialType, ...block.getProperties() }
                    });
                }
            }
        }
    }

    return blocks;
}


(async () => {
    if (process.argv.length !== 9) {
    console.log('Usage : node anvil.js <regionPath> <sx> <sy> <sz> <ex> <ey> <ez>')
    process.exit(1)
    }

    const regionPath = process.argv[2]

    const world = new World(null, new Anvil(regionPath))

    const min = new Vec3(
        Math.min(process.argv[3], process.argv[6]),
        Math.min(process.argv[4], process.argv[7]),
        Math.min(process.argv[5], process.argv[8])
    );
    const max = new Vec3(
        Math.max(process.argv[3], process.argv[6]),
        Math.max(process.argv[4], process.argv[7]),
        Math.max(process.argv[5], process.argv[8])
    );

    console.log(JSON.stringify(await getBlocks(world, min, max)));
    world.stopSaving();
})()
