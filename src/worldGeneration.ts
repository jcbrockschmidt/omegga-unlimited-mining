import { Vector } from 'omegga';
import {
  BasaltResource,
  BedrockResource,
  ClayResource,
  DirtResource,
  IVoxelType,
  PackedDirtResource,
  ShaleResource,
  StoneResource,
} from './resources';

/**
 * Determines what types of voxels appear where.
 */
export interface IWorldGenerator {
  /**
   * Determine the voxel type at a given position.
   *
   * @param position Position of voxel relative to it's voxel manager's
   *   coordinate system.
   */
  getVoxelType(position: Vector): IVoxelType;
}

export class BasicWorldGenerator implements IWorldGenerator {
  getVoxelType(position: Vector): IVoxelType {
    const z = position[2];

    if (z < -550) {
      return BasaltResource;
    } else if (z < -450) {
      return BedrockResource;
    } else if (z < -350) {
      return StoneResource;
    } else if (z < -250) {
      return ShaleResource;
    } else if (z < -150) {
      return ClayResource;
    } else if (z < -50) {
      return PackedDirtResource;
    } else {
      return DirtResource;
    }
  }
}
