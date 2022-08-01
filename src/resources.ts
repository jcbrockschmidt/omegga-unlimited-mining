import { ColorRgb } from '../omegga';

/**
 * Describes a voxel's properties.
 */
export interface IVoxelType {
  /**
   * Display name for a voxel.
   */
  name: string;
  /*
   * Color of voxels in the world.
   */
  color: ColorRgb;
  /**
   * How much power it takes to destroy a voxel. A negative HP indicates an
   * unbreakable voxel.
   */
  hp: number;
}

export const BorderResource: IVoxelType = {
  name: 'Border',
  color: [0, 0, 0],
  hp: -1,
};

export const DirtResource: IVoxelType = {
  name: 'Dirt',
  color: [51, 45, 26],
  // hp: 5,
  hp: 1, // DEBUG
};

export const StoneResource: IVoxelType = {
  name: 'Stone',
  color: [145, 142, 133],
  hp: 10,
};

export const QuartzResource: IVoxelType = {
  name: 'Quartz',
  color: [233, 223, 224],
  hp: 10,
};

export const AluminiumResource: IVoxelType = {
  name: 'Aluminium',
  color: [136, 139, 141],
  hp: 15,
};

export const CopperResource: IVoxelType = {
  name: 'Copper',
  color: [184, 115, 51],
  hp: 25,
};

export const IronResource: IVoxelType = {
  name: 'Iron',
  color: [165, 156, 148],
  hp: 30,
};

export const SilverResource: IVoxelType = {
  name: 'Silver',
  color: [211, 211, 211],
  hp: 50,
};

export const GoldResource: IVoxelType = {
  name: 'Gold',
  color: [255, 215, 0],
  hp: 100,
};

export const SapphireResource: IVoxelType = {
  name: 'Sapphire',
  color: [15, 82, 186],
  hp: 200,
};
