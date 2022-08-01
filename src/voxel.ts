import { Vector } from '../omegga';
import { IVoxelType } from './resources';

// TODO: documentation

export enum VoxelFace {
  PosX,
  NegX,
  PosY,
  NegY,
  PosZ,
  NegZ,
}

export interface IVoxel {
  type: IVoxelType;
  hp: number;
  obscuredFaces: Set<VoxelFace>;
}

export interface IVoxelConfig {
  brickType: string;
  brickAsset: string;
  brickSize: Vector;
}
