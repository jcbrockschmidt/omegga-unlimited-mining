import { ColorRgb } from '../../omegga';

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

export * from './allResources';

export {
  IVoxelInventory,
  VoxelInventory,
  VoxelInventoryDb,
} from './voxelInventory';
