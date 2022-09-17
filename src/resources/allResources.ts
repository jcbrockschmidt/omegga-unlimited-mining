import { IVoxelType } from '.';

export const BorderResource: IVoxelType = {
  name: 'Border',
  dbName: 'border',
  color: [0, 0, 0],
  hp: -1,
};

// Filler resources

export const DirtResource: IVoxelType = {
  name: 'Dirt',
  dbName: 'dirt',
  color: [90, 79, 45],
  hp: 3,
};

export const PackedDirtResource: IVoxelType = {
  name: 'Packed Dirt',
  dbName: 'packed_dirt',
  color: [51, 45, 26],
  hp: 5,
};

export const ClayResource: IVoxelType = {
  name: 'Clay',
  dbName: 'clay',
  color: [213, 163, 114],
  hp: 10,
};

export const ShaleResource: IVoxelType = {
  name: 'Shale',
  dbName: 'shale',
  color: [89, 106, 130],
  hp: 20,
};

export const StoneResource: IVoxelType = {
  name: 'Stone',
  dbName: 'stone',
  color: [145, 142, 133],
  hp: 35,
};

export const BedrockResource: IVoxelType = {
  name: 'Bedrock',
  dbName: 'bedrock',
  color: [120, 115, 110],
  hp: 50,
};

export const BasaltResource: IVoxelType = {
  name: 'Basalt',
  dbName: 'basalt',
  color: [76, 74, 74],
  hp: 100,
};

// Other resources

export const QuartzResource: IVoxelType = {
  name: 'Quartz',
  dbName: 'quartz',
  color: [233, 223, 224],
  hp: 10,
};

export const AluminiumResource: IVoxelType = {
  name: 'Aluminium',
  dbName: 'aluminium',
  color: [136, 139, 141],
  hp: 15,
};

export const CopperResource: IVoxelType = {
  name: 'Copper',
  dbName: 'copper',
  color: [184, 115, 51],
  hp: 25,
};

export const IronResource: IVoxelType = {
  name: 'Iron',
  dbName: 'iron',
  color: [165, 156, 148],
  material: 'BMC_Metallic',
  hp: 30,
};

export const SilverResource: IVoxelType = {
  name: 'Silver',
  dbName: 'silver',
  color: [211, 211, 211],
  hp: 50,
};

export const GoldResource: IVoxelType = {
  name: 'Gold',
  dbName: 'gold',
  color: [255, 215, 0],
  hp: 100,
};

export const SapphireResource: IVoxelType = {
  name: 'Sapphire',
  dbName: 'sapphire',
  color: [15, 82, 186],
  hp: 200,
};
