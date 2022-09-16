import { PlayerDataManager } from './playerData';
import { BrickInteraction, Vector } from '../omegga';
import {
  DirtResource,
  BorderResource,
  StoneResource,
  QuartzResource,
  IronResource,
} from './resources';
import { UMPlugin } from './types';
import { IVoxel, VoxelFace, IVoxelConfig } from './voxel';
import { VoxelManager } from './voxelManager';

// TODO: pass into class via constructor
const DEFAULT_VOXEL_CONFIG: IVoxelConfig = {
  brickType: '20x Micro-Brick Cube',
  brickAsset: 'PB_DefaultMicroBrick',
  brickSize: [10, 10, 10],
};

const VOXEL_FACE_TO_INVERT: Record<VoxelFace, VoxelFace> = {
  [VoxelFace.PosX]: VoxelFace.NegX,
  [VoxelFace.NegX]: VoxelFace.PosX,
  [VoxelFace.PosY]: VoxelFace.NegY,
  [VoxelFace.NegY]: VoxelFace.PosY,
  [VoxelFace.PosZ]: VoxelFace.NegZ,
  [VoxelFace.NegZ]: VoxelFace.PosZ,
};

/**
 * Handles blocks generation and mining for a mine.
 */
export interface IMine {
  /**
   * Create the entrance to the mine. Should not be called while the mine remains created.
   */
  createMine(): Promise<void>;

  /**
   * Clear all voxels from the mine. Should only be called after the mine is created.
   */
  clearMine(): Promise<void>;

  /**
   * Determines whether or not the mine is created.
   *
   * @return Whether the mine is created.
   */
  isCreated(): boolean;

  /**
   * Hit a voxel on behalf of a player. May subtract its HP or delete it.
   * Deleted voxels will reveal any obscured voxels.
   *
   * @param playerId Player hitting the voxel.
   * @param position Position of the voxel in the mine.
   */
  hitVoxel(playerId: string, position: Vector): Promise<void>;
}

export class Mine implements IMine {
  private plugin: UMPlugin;
  private realOrigin: Vector;
  private entranceWidth: number;
  private entranceLength: number;
  private voxelManager: VoxelManager;
  private voxelTag: string;
  private voxelConfig: IVoxelConfig;
  private eventListener?: (args: BrickInteraction) => void;
  private voxelFaceToOffset: Record<VoxelFace, Vector>;
  private mineIsCreated: boolean;

  /**
   * @param plugin Omegga plugin for Unlimited Mining.
   * @param origin Position where the generation of the mine's voxels starts.
   * @param width Width of the entrance to the mine (x-axis).
   * @param length Length of the entrance to the mine (y-axis).
   */
  constructor(plugin: UMPlugin, origin: Vector, width: number, length: number) {
    this.plugin = plugin;
    this.realOrigin = [...origin];
    this.entranceWidth = width;
    this.entranceLength = length;
    this.voxelConfig = DEFAULT_VOXEL_CONFIG;
    // TODO: make unique to this mine. Include uuid that we also use for the brick group?
    this.voxelTag = 'um:voxel';
    this.voxelManager = new VoxelManager(this.voxelConfig, this.voxelTag);

    const { brickSize } = this.voxelConfig;
    this.voxelFaceToOffset = {
      [VoxelFace.PosX]: [brickSize[0] * 2, 0, 0],
      [VoxelFace.NegX]: [-brickSize[0] * 2, 0, 0],
      [VoxelFace.PosY]: [0, brickSize[1] * 2, 0],
      [VoxelFace.NegY]: [0, -brickSize[1] * 2, 0],
      [VoxelFace.PosZ]: [0, 0, brickSize[2] * 2],
      [VoxelFace.NegZ]: [0, 0, -brickSize[2] * 2],
    };

    this.mineIsCreated = false;
  }

  async createMine(): Promise<void> {
    if (this.mineIsCreated) {
      // TODO: create error type
      throw new Error('The mine is already created');
    }

    this.initMiningMechanics();

    const createVoxelPromises = [];
    for (let x = 0; x < this.entranceWidth; x++) {
      for (let y = 0; y < this.entranceLength; y++) {
        const obscuredFaces: Set<VoxelFace> = new Set([VoxelFace.NegZ]);
        if (x === 0) obscuredFaces.add(VoxelFace.NegX);
        else if (x === this.entranceWidth - 1)
          obscuredFaces.add(VoxelFace.PosX);
        if (y === 0) obscuredFaces.add(VoxelFace.NegY);
        else if (y === this.entranceLength - 1)
          obscuredFaces.add(VoxelFace.PosY);

        const { brickSize } = this.voxelConfig;
        const voxelPosition: Vector = [
          this.realOrigin[0] + brickSize[0] * 2 * x,
          this.realOrigin[1] + brickSize[1] * 2 * y,
          this.realOrigin[2],
        ];
        // TODO: Replace this with a proper world generator
        const resource = [
          IronResource,
          DirtResource,
          StoneResource,
          QuartzResource,
        ][Math.floor(Math.random() * 4)];
        createVoxelPromises.push(
          this.voxelManager.createVoxel(voxelPosition, resource, obscuredFaces)
        );
      }
    }
    await Promise.all(createVoxelPromises);

    this.mineIsCreated = true;
  }

  async clearMine(): Promise<void> {
    if (!this.mineIsCreated) {
      // TODO: create error type
      throw new Error('There is no mine to clear');
    }
    this.voxelManager.clearVoxels();
    this.plugin.omegga.removeListener('interact', this.eventListener);

    this.mineIsCreated = false;
  }

  isCreated(): boolean {
    return this.mineIsCreated;
  }

  async hitVoxel(playerId: string, position: Vector): Promise<void> {
    const playerData = await PlayerDataManager.getPlayerData(
      this.plugin,
      playerId
    );

    const voxelData = this.voxelManager.getVoxel(position);
    if (!voxelData) {
      // TODO: create error type
      throw new Error(`Missing data for voxel at ${position}`);
    }

    if (voxelData.hp >= 0) {
      // Reduce HP.
      voxelData.hp -= playerData.getPickaxePower();

      playerData.displayMiningMessage(voxelData);

      // TODO: refactor printing into PlayerMiner
      if (voxelData.hp <= 0) {
        await this.removeVoxel(position, voxelData);
      }

      playerData.addResource(voxelData.type, 1);
    } else {
      playerData.displayBorderMessage();
    }
  }

  // TODO: doc
  private initMiningMechanics(): void {
    const { brickType } = this.voxelConfig;
    this.eventListener = async ({ player, position, brick_name, message }) => {
      if (message !== this.voxelTag || brick_name !== brickType) return;

      try {
        await this.hitVoxel(player.id, position);
      } catch (e) {
        console.log(e);
      }
    };
    this.plugin.omegga.on('interact', this.eventListener);
  }

  // TODO: doc
  private async removeVoxel(
    position: Vector,
    { obscuredFaces, type }: IVoxel
  ): Promise<void> {
    // Reveal new bricks on obscured faces.
    const ceilingZ = this.realOrigin[2];
    const createVoxelPromises = [...obscuredFaces].map((face: VoxelFace) => {
      const offset = this.voxelFaceToOffset[face];
      const newPos: Vector = [
        position[0] + offset[0],
        position[1] + offset[1],
        position[2] + offset[2],
      ];

      // Determine which faces this new voxel has obscured.
      const faceCreatedFrom = VOXEL_FACE_TO_INVERT[face];
      const newObscuredFaces: Set<VoxelFace> = new Set();
      // TODO: is there a cleaner way to iterate over enum values?
      [
        VoxelFace.PosX,
        VoxelFace.NegX,
        VoxelFace.PosY,
        VoxelFace.NegY,
        VoxelFace.PosZ,
        VoxelFace.NegZ,
      ].forEach(checkFace => {
        if (
          checkFace === faceCreatedFrom ||
          (checkFace === VoxelFace.PosZ && newPos[2] >= ceilingZ)
        )
          return;

        const checkOffset = this.voxelFaceToOffset[checkFace];
        const checkPos: Vector = [
          newPos[0] + checkOffset[0],
          newPos[1] + checkOffset[1],
          newPos[2] + checkOffset[2],
        ];
        const neighborVoxel = this.voxelManager.getVoxel(checkPos);
        if (neighborVoxel) {
          const oppositeFace = VOXEL_FACE_TO_INVERT[checkFace];
          neighborVoxel.obscuredFaces.delete(oppositeFace);
        } else {
          newObscuredFaces.add(checkFace);
        }
      });
      return this.voxelManager.createVoxel(newPos, type, newObscuredFaces);
    });

    // Check if a ceiling border block should be placed.
    const { brickSize } = this.voxelConfig;
    const aboveCeiling = position[2] >= ceilingZ;
    // Don't place a ceiling border in the mine entrance.
    const outsideEntrance =
      position[0] < this.realOrigin[0] ||
      position[0] >
        this.realOrigin[0] + (this.entranceWidth - 1) * brickSize[0] * 2 ||
      position[1] < this.realOrigin[1] ||
      position[1] >
        this.realOrigin[1] + (this.entranceLength - 1) * brickSize[1] * 2;
    if (aboveCeiling && outsideEntrance) {
      const borderOffset = this.voxelFaceToOffset[VoxelFace.PosZ];
      const borderPos: Vector = [
        position[0] + borderOffset[0],
        position[1] + borderOffset[1],
        position[2] + borderOffset[2],
      ];
      // We do not include obscured faces for border voxels since we don't
      // expect them to ever be deleted, except during a reset.
      createVoxelPromises.push(
        this.voxelManager.createVoxel(borderPos, BorderResource, new Set())
      );
    }

    await Promise.all(createVoxelPromises);

    // Delete mined voxel.
    // We want to delete voxels after we've placed the new voxels so
    // players don't accidently fall through the world if loading is slow.
    this.voxelManager.deleteVoxel(position);
  }
}
