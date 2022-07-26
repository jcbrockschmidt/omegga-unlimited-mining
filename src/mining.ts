import OmeggaPlugin, { Brick, Vector, WriteSaveObject } from '../omegga';
import { IResourceBrick, DirtResource } from './resources';

// TODO: use 20x Micro-Brick Cube because it looks better
// const MINABLE_BRICK_TYPE: string = '2x Cube';
// const MINABLE_BRICK_ASSET: string = 'PB_DefaultBrick';
const MINABLE_BRICK_TYPE: string = '20x Micro-Brick Cube';
const MINABLE_BRICK_ASSET: string = 'PB_DefaultMicroBrick';
const MINABLE_BRICK_SIZE: Vector = [10, 10, 10];

const MINABLE_BRICK_MSG: string = 'um:brick';

// TODO: make starting location more dynamic
const STARTING_Z: number = 100;

const DEFAULT_SAVE_DATA: WriteSaveObject = {
    brick_owners: [
        {
            id: OMEGGA_UTIL.uuid.random(),
            name: 'unlimited-mining',
        }
    ],
    brick_assets: [MINABLE_BRICK_ASSET],
    bricks: [],
};

enum CubeFace {
    PosX,
    NegX,
    PosY,
    NegY,
    PosZ,
    NegZ,
};

interface IMinableBrick {
    type: IResourceBrick,
    hp: number,
    obscuredFaces: Set<CubeFace>
};

// TODO: library for vector math?
const CUBE_FACE_TO_OFFSET: Record<CubeFace, Vector> = {
    [CubeFace.PosX]: [MINABLE_BRICK_SIZE[0] * 2, 0, 0],
    [CubeFace.NegX]: [-MINABLE_BRICK_SIZE[0] * 2, 0, 0],
    [CubeFace.PosY]: [0, MINABLE_BRICK_SIZE[1] * 2, 0],
    [CubeFace.NegY]: [0, -MINABLE_BRICK_SIZE[1] * 2, 0],
    [CubeFace.PosZ]: [0, 0, MINABLE_BRICK_SIZE[2] * 2],
    [CubeFace.NegZ]: [0, 0, -MINABLE_BRICK_SIZE[2] * 2],
};

const CUBE_FACE_TO_INVERT: Record<CubeFace, CubeFace> = {
    [CubeFace.PosX]: CubeFace.NegX,
    [CubeFace.NegX]: CubeFace.PosX,
    [CubeFace.PosY]: CubeFace.NegY,
    [CubeFace.NegY]: CubeFace.PosY,
    [CubeFace.PosZ]: CubeFace.NegZ,
    [CubeFace.NegZ]: CubeFace.PosZ,
};

const idToBrickData: Record<string, IMinableBrick> = {};

const { rgbToHex } = OMEGGA_UTIL.color;

// Get a unique ID for a brick given its coordinates.
function positionToBrickId(position: Vector): string {
    return position.toString();
}

// Get data for a minable brick given its position.
function getMinableBrickData(position: Vector): IMinableBrick | undefined {
    const id = positionToBrickId(position);
    return idToBrickData[id];
}

// Delete data for a minable brick given its position.
function deleteMinableBrickData(position: Vector): IMinableBrick | undefined {
    const id = positionToBrickId(position);
    const data = idToBrickData[id];
    delete idToBrickData[id];
    return data;
}

// Create a new minable brick.
async function createMinableBrick(
    position: Vector,
    type: IResourceBrick,
    obscuredFaces: Set<CubeFace>,
): Promise<void> {
    const { color, hp } = type; 
    const brickData: IMinableBrick = {
        type,
        hp: hp,
        obscuredFaces,
    };
    const id = positionToBrickId(position);
    idToBrickData[id] = brickData;

    const newBricks: Brick[] = [
        {
            size: MINABLE_BRICK_SIZE,
            position: position,
            color,
            components: {
                BCD_Interact: {
                    bPlayInteractSound: false,
                    Message: '',
                    ConsoleTag: MINABLE_BRICK_MSG
                }
            },
        },
    ];
    await Omegga.loadSaveData(
        {
            ...DEFAULT_SAVE_DATA,
            bricks: newBricks,
        },
        { quiet: true },
    );
}

async function mineBrick(position: Vector, {obscuredFaces, type}: IMinableBrick): Promise<void> {
    // Reveal new bricks on obscured faces.
    const newBrickPromises = [...obscuredFaces].map((face: CubeFace) => {
        let offset = CUBE_FACE_TO_OFFSET[face];
        // TODO: library for vector math?
        const newPos: Vector = [
            position[0] + offset[0],
            position[1] + offset[1],
            position[2] + offset[2],
        ];

        // Determine which faces this new brick has obscured.
        const faceCreatedFrom = CUBE_FACE_TO_INVERT[face];
        const newObscuredFaces: Set<CubeFace> = new Set();
        // TODO: is there a cleaner way to iterate over enum values?
        [
            CubeFace.PosX,
            CubeFace.NegX,
            CubeFace.PosY,
            CubeFace.NegY,
            CubeFace.PosZ,
            CubeFace.NegZ,
        ].forEach((checkFace) => {
            if ((checkFace === faceCreatedFrom) || (checkFace === CubeFace.PosZ && newPos[2] >= STARTING_Z))
                return;

            const checkOffset = CUBE_FACE_TO_OFFSET[checkFace];
            // TODO: library for vector math?
            const checkPos: Vector = [
                newPos[0] + checkOffset[0],
                newPos[1] + checkOffset[1],
                newPos[2] + checkOffset[2],
            ];
            const neighborBrick = getMinableBrickData(checkPos);
            if (neighborBrick) {
                const oppositeFace = CUBE_FACE_TO_INVERT[checkFace];
                neighborBrick.obscuredFaces.delete(oppositeFace);
            } else {
                newObscuredFaces.add(checkFace);
            }
        });
        return createMinableBrick(
            newPos,
            type,
            newObscuredFaces,
        );
    });

    await Promise.all(newBrickPromises);

    // Delete mined brick.
    // We want to delete bricks after we've placed the new bricks so
    // players don't accidently fall through the world if loading is slow.
    const brickRegion = {
        center: position,
        extent: MINABLE_BRICK_SIZE,
    };
    Omegga.clearRegion(brickRegion);
    deleteMinableBrickData(position);
}

// Hit a brick with a pickaxe at a given position.
async function hitBrick(playerId: string, position: Vector): Promise<void> {
    const brickData = getMinableBrickData(position);
    if (!brickData) {
        // TODO: create error type
        throw Error(`Missing data for brick at ${position}`);
    }
    const { color, displayName } = brickData.type;

    // Reduce HP
    // TODO: get player pick level
    brickData.hp--;

    const name = displayName.toUpperCase();
    const hexColor = rgbToHex(color);
    if (brickData.hp > 0) {
        Omegga.middlePrint(playerId, `<size="30"><color="${hexColor}">${name}</></><br><b><size="40">${brickData.hp}<\>`);
    } else {
        Omegga.middlePrint(playerId, `<size="30"><color="${hexColor}">${name}</></><br><b><size="40">MINED<\>`);
        await mineBrick(position, brickData);
    }
}

export function initMiningMechanics(plugin: OmeggaPlugin<any, any>) {
    plugin.omegga.on(
        'interact',
        async ({ player, position, brick_name, message }) => {
            if (message !== MINABLE_BRICK_MSG || brick_name !== MINABLE_BRICK_TYPE)
                return;

            await hitBrick(player.id, position);

            try {
            } catch (e) {
                console.log(e);
            }
        }
    );
}

// Creates the bricks at the top level of the mine.
export async function initMiningArea(width: number, length: number): Promise<void> {
    const brickPromises = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < length; y++) {
            const obscuredFaces: Set<CubeFace> = new Set([CubeFace.NegZ]);
            if (x === 0)
                obscuredFaces.add(CubeFace.NegX);
            else if (x === width - 1)
                obscuredFaces.add(CubeFace.PosX);
            if (y === 0)
                obscuredFaces.add(CubeFace.NegY);
            else if (y === length - 1)
                obscuredFaces.add(CubeFace.PosY);

            brickPromises.push(
                createMinableBrick(
                    [MINABLE_BRICK_SIZE[0] * 2 * x, MINABLE_BRICK_SIZE[1] * 2 * y, STARTING_Z],
                    DirtResource,
                    obscuredFaces,
                ),
            );
        }
    }
    await Promise.all(brickPromises);
}
