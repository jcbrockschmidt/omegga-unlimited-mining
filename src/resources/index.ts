import { ColorRgb } from '../../omegga';

export type BrickMaterial =
  | 'BMC_Plastic'
  | 'BMC_Glass'
  | 'BMC_Glow'
  | 'BMC_Metallic'
  | 'BMC_Hologram';

/**
 * Describes a voxel's properties.
 */
export interface IVoxelType {
  /**
   * Display name for a voxel.
   */
  name: string;

  /**
   * Name used for voxel type in internal database. Must be unique.
   */
  dbName: string;

  /**
   * Color of voxels in the world.
   */
  color: ColorRgb;

  /**
   * Material of voxels in the world.
   */
  material?: BrickMaterial;

  /**
   * How much power it takes to destroy a voxel. A negative HP indicates an
   * unbreakable voxel.
   */
  hp: number;
}

export * from './allResources';

export {
  IVoxelInventory,
  VoxelInventory,
  VoxelInventoryDb,
} from './voxelInventory';
