import { Vector } from '../omegga';
import { IVoxelType } from './resources';

/**
 * The 6 faces of a voxel.
 */
export enum VoxelFace {
  PosX, // Face in positive X direction.
  NegX, // Face in negative X direction.
  PosY, // Face in positive Y direction.
  NegY, // Face in negative Y direction.
  PosZ, // Face in positive Z direction.
  NegZ, // Face in negative Z direction.
}

/**
 * Properties of an individual voxel in the world.
 */
export interface IVoxel {
  /**
   * The voxel's type.
   */
  type: IVoxelType;
  /**
   * Hitpoints remaining until the voxel breaks. A negative HP value means the
   * voxel is unbreakable.
   */
  hp: number;
  /** Faces that are obscuring hidden/unrendered voxels. */
  obscuredFaces: Set<VoxelFace>;
}

/**
 * Describes the brick properties of a voxel.
 */
export interface IVoxelConfig {
  brickType: string;
  brickAsset: string;
  brickSize: Vector;
}
