import { IVoxelType } from '.';
import * as allResources from './allResources';

export type VoxelInventoryDb = { [type: string]: number };

export interface IVoxelInventory {
  get(type: IVoxelType): number;
  set(type: IVoxelType, amount: number): void;
  add(type: IVoxelType, amount: number): number;
  getAll(): Array<[IVoxelType, number]>;
  clear(): void;
  isEmpty(): boolean;
  toDb(): VoxelInventoryDb;
}

export class VoxelAmountNegativeError extends Error {}

const DB_NAME_TO_VOXEL_TYPE: Map<string, IVoxelType> = new Map(
  Object.values(allResources).map((voxelType: IVoxelType) => [
    voxelType.dbName,
    voxelType,
  ])
);

export class VoxelInventory implements IVoxelInventory {
  private inv: Map<IVoxelType, number>;

  constructor(invDb?: VoxelInventoryDb) {
    this.inv = new Map();

    if (invDb) {
      Object.entries(invDb).forEach(([dbName, amount]) => {
        const voxelType = DB_NAME_TO_VOXEL_TYPE.get(dbName);
        this.inv.set(voxelType, amount);
      });
    }
  }

  get(type: IVoxelType): number {
    return this.inv.has(type) ? this.inv.get(type) : 0;
  }

  set(type: IVoxelType, amount: number): void {
    if (amount < 0) {
      throw new VoxelAmountNegativeError('Voxel amount cannot be negative');
    } else if (amount === 0) {
      this.inv.delete(type);
    } else {
      this.inv.set(type, amount);
    }
  }

  add(type: IVoxelType, amount: number): number {
    if (amount < 0) {
      throw new VoxelAmountNegativeError('Voxel amount cannot be negative');
    }
    const newAmount = this.get(type) + amount;
    this.set(type, newAmount);
    return newAmount;
  }

  getAll(): Array<[IVoxelType, number]> {
    return Array.from(this.inv.entries());
  }

  clear(): void {
    this.inv.clear();
  }

  isEmpty(): boolean {
    return this.inv.size === 0;
  }

  toDb(): VoxelInventoryDb {
    const invDb: VoxelInventoryDb = {};
    for (const [type, amount] of this.inv) {
      if (amount > 0) {
        invDb[type.dbName] = amount;
      }
    }
    return invDb;
  }
}
