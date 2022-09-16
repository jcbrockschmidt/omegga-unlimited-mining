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

// TODO: documentation, maybe justify use
export interface IVoxelManager {
  /**
   * Create a voxel in the world.
   *
   * @param position Position of the voxel in the mine.
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
   * @param position Position of the voxel in the mine.
   */
  deleteVoxel(position: Vector): Promise<void>;

  /**
   * Delete all voxels managed by a manager.
   */
  clearVoxels(): Promise<void>;

  /**
   * Get a voxel given its position in the world.
   *
   * @param position Position of the voxel in the world.
   */
  getVoxel(position: Vector): IVoxel | undefined;
}

let voxelManagerCount = 0;

// TODO: doc
export class VoxelManager implements IVoxelManager {
  private voxelConfig: IVoxelConfig;
  private voxelTag: string;
  private idToVoxel: Map<string, IVoxel>;
  private brickOwnerId: string;
  private emptySaveData: WriteSaveObject;

  // TODO: doc
  constructor(voxelConfig: IVoxelConfig, voxelTag: string) {
    this.voxelConfig = voxelConfig;
    this.voxelTag = voxelTag;
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
        position: position,
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
      center: position,
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

  /**
   * Returns a unique ID for a voxel given its position in the mine.
   *
   * @param position Position of the voxel in the mine.
   */
  private getVoxelId(position: Vector): string {
    return position.toString();
  }
}
