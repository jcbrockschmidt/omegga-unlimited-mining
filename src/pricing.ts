import {
  DirtResource,
  IVoxelInventory,
  IVoxelType,
  QuartzResource,
  StoneResource,
} from './resources';

const RESOURCE_TO_PRICE: Map<IVoxelType, number> = new Map([
  [DirtResource, 1],
  [StoneResource, 2],
  [QuartzResource, 20],
]);

export function getResourceSellPrice(type: IVoxelType): number {
  return RESOURCE_TO_PRICE.has(type) ? RESOURCE_TO_PRICE.get(type) : 0;
}

export function getInvSellPrice(inv: IVoxelInventory): number {
  return inv
    .getAll()
    .reduce(
      (total: number, [type, amount]) =>
        total + getResourceSellPrice(type) * amount,
      0
    );
}
