const util = require('util');
const fs = require('fs');
const sharp = require('sharp');
const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);

const getUsedTextures = async (filename) => {
    const data = JSON.parse(await readFile(filename));
    
    let blocks = {};
    for (let block of data) {
        if (blocks[block.name] !== -1) {
            blocks[block.name] = -1;
        }
    }
    
    return blocks;
}

(async () => {
    if (process.argv.length !== 5) {
        console.log('Usage: node scripts/createTextureAtlas.js <extracted pack root> <level.json> <atlas out>');
    }
    
    const packRoot = process.argv[2];
    const levelJson = process.argv[3];
    const atlasOut = process.argv[4];
    
    let blocks = await getUsedTextures(levelJson);    

    let blockRootDir = packRoot + "/assets/minecraft/textures/block/";
    const tileSize = (await sharp(blockRootDir + "bricks.png").metadata()).width;
    
    console.log(`Tile size: ${tileSize}`);

    const image = sharp({
        create: {
            width: tileSize * Object.keys(blocks).length,
            height: tileSize * 3,
            channels: 4,
            background: 0x0000
        }
    });

    let i = 0;
    let layers = [];
    for (let x in blocks ){
        let noPrefix = x.replace("minecraft:", "");
        const sideImgPath = (await exists(blockRootDir + `${noPrefix}_side.png`)) ? `${noPrefix}_side.png`
                            : blockRootDir + `${noPrefix}.png`;
        const topImgPath = (await exists(blockRootDir + `${noPrefix}_top.png`)) ? blockRootDir + `${noPrefix}_top.png`
                            : sideImgPath;
        const bottomImgPath = (await exists(blockRootDir + `${noPrefix}_bottom.png`)) ? blockRootDir + `${noPrefix}_bottom.png`
                            : topImgPath;

        if (!await exists(sideImgPath)) {
            console.error(`No texture for ${noPrefix}`);
            continue;
        }
        
        layers = layers.concat([
            {
                input: sideImgPath,
                top: 0,
                left: i * tileSize,
            },
            {
                input: topImgPath,
                top: tileSize,
                left: i * tileSize,
            },
            {
                input: bottomImgPath,
                top: 2 * tileSize,
                left: i * tileSize,
            },
        ]);
        blocks[x] = i + 1;

        i++;
    }
    
    image.composite(layers);

    await image.toFile(atlasOut);

    console.log(blocks);

})();