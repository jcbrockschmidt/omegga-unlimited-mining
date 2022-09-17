import { Brick, Vector, WriteSaveObject } from 'omegga';
import { BrickMaterial, IVoxelType } from './resources';
import { IVoxel, IVoxelConfig, VoxelFace } from './voxel';

const BRS_BRICK_MATERIALS: BrickMaterial[] = [
  'BMC_Plastic',
  'BMC_Glass',
  'BMC_Glow',
  'BMC_Metallic',
  'BMC_Hologram',
];

const MATERIAL_TO_INDEX: Map<BrickMaterial, number> = new Map(
  BRS_BRICK_MATERIALS.map((material, i) => [material, i])
);

const DEFAULT_MATERIAL_INDEX = MATERIAL_TO_INDEX['BMC_Plastic'];

/**
 * Manages voxel creation and deletion.
 *
 * Abstracts bricks into voxels. Uses a faux coordinate system for voxels where
 * 1 voxel is 1 unit.
 */
export interface IVoxelManager {
  /**
   * Create a voxel.
   *
   * @param position Position of the voxel relative to the voxel manager's
   *   coordinate system.
   * @param type Properties for the voxel.
   * @param obscuredFaces Faces that have un-loaded voxels behind them.
   */
  createVoxel(
    position: Vector,
    type: IVoxelType,
    obscuredFaces: Set<VoxelFace>
  ): Promise<void>;

  /**
   * Delete a voxel given its position.
   *
   * @param position Position of the voxel relative to the voxel manager's
   *   coordinate system.
   */
  deleteVoxel(position: Vector): Promise<void>;

  /**
   * Delete all voxels managed by a manager.
   */
  clearVoxels(): Promise<void>;

  /**
   * Get a voxel given its position.
   *
   * @param position Position of the voxel relative to the voxel manager's
   *   coordinate system.
   */
  getVoxel(position: Vector): IVoxel | undefined;

  /**
   * Convert real coordinates to the voxel manager's coordinate system.
   */
  vectorFromReal(realVector: Vector): Vector;

  /**
   * Convert coordinates from the voxel manager's coordinate system to the real
   * coordinate system.
   */
  vectorToReal(vector: Vector): Vector;
}

let voxelManagerCount = 0;

/**
 * Basic voxel manager.
 */
export class VoxelManager implements IVoxelManager {
  private voxelConfig: IVoxelConfig;
  private voxelTag: string;
  private realOrigin: Vector;
  private idToVoxel: Map<string, IVoxel>;
  private brickOwnerId: string;
  private emptySaveData: WriteSaveObject;

  /**
   * @param voxelConfig Describes the brick properties of voxels.
   * @param voxelTag Tag used for voxel interaction events.
   * @param realOrigin Position of (0, 0, 0) for the voxel manager's coordinate
   *   system in the real coordinate space.
   */
  constructor(voxelConfig: IVoxelConfig, voxelTag: string, realOrigin: Vector) {
    this.voxelConfig = voxelConfig;
    this.voxelTag = voxelTag;
    this.realOrigin = [...realOrigin];
    this.idToVoxel = new Map();

    this.brickOwnerId = OMEGGA_UTIL.uuid.random();
    const brickOwnerName = `um-voxel-manager-${voxelManagerCount++}`;
    this.emptySaveData = {
      brick_owners: [
        {
          id: this.brickOwnerId,
          name: brickOwnerName,
        },
      ],
      brick_assets: [voxelConfig.brickAsset],
      bricks: [],
      materials: BRS_BRICK_MATERIALS,
    };
  }

  async createVoxel(
    position: Vector,
    type: IVoxelType,
    obscuredFaces: Set<VoxelFace>
  ): Promise<void> {
    const { color, hp } = type;

    const voxel: IVoxel = {
      type,
      hp,
      obscuredFaces,
    };

    const materialIndex = type.material
      ? MATERIAL_TO_INDEX.get(type.material)
      : DEFAULT_MATERIAL_INDEX;

    const bricks: Brick[] = [
      {
        size: this.voxelConfig.brickSize,
        position: this.vectorToReal(position),
        color,
        components: {
          BCD_Interact: {
            bPlayInteractSound: false,
            Message: '',
            ConsoleTag: this.voxelTag,
          },
        },
        material_index: materialIndex,
      },
    ];
    await Omegga.loadSaveData(
      {
        ...this.emptySaveData,
        bricks: bricks,
      },
      { quiet: true }
    );

    const id = this.getVoxelId(position);
    this.idToVoxel.set(id, voxel);
  }

  async deleteVoxel(position: Vector): Promise<void> {
    const id = this.getVoxelId(position);
    if (!this.idToVoxel.has(id)) return;

    const brickRegion = {
      center: this.vectorToReal(position),
      extent: this.voxelConfig.brickSize,
    };
    Omegga.clearRegion(brickRegion);

    this.idToVoxel.delete(id);
  }

  async clearVoxels(): Promise<void> {
    this.idToVoxel.clear();
    Omegga.clearBricks(this.brickOwnerId);
  }

  getVoxel(position: Vector): IVoxel | undefined {
    const id = this.getVoxelId(position);
    return this.idToVoxel.get(id);
  }

  vectorFromReal(realVector: Vector): Vector {
    const { brickSize } = this.voxelConfig;
    return [
      (realVector[0] - this.realOrigin[0]) / (brickSize[0] * 2),
      (realVector[1] - this.realOrigin[1]) / (brickSize[1] * 2),
      (realVector[2] - this.realOrigin[2]) / (brickSize[2] * 2),
    ];
  }

  vectorToReal(vector: Vector): Vector {
    const { brickSize } = this.voxelConfig;
    return [
      vector[0] * (brickSize[0] * 2) + this.realOrigin[0],
      vector[1] * (brickSize[1] * 2) + this.realOrigin[1],
      vector[2] * (brickSize[2] * 2) + this.realOrigin[2],
    ];
  }

  /**
   * Returns a unique ID for a voxel given its position in the mine.
   *
   * @param position Position of the voxel relative to the voxel manager's
   *   coordinate system
   */
  private getVoxelId(position: Vector): string {
    return position.toString();
  }
}
