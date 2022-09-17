import {
  BasaltResource,
  BedrockResource,
  ClayResource,
  DirtResource,
  IVoxelInventory,
  IVoxelType,
  PackedDirtResource,
  QuartzResource,
  ShaleResource,
  StoneResource,
} from './resources';

const RESOURCE_TO_PRICE: Map<IVoxelType, number> = new Map([
  // Filler resources
  [DirtResource, 1],
  [PackedDirtResource, 2],
  [ClayResource, 3],
  [ShaleResource, 4],
  [StoneResource, 5],
  [BedrockResource, 6],
  [BasaltResource, 7],
  [BasaltResource, 7],
  [StoneResource, 2],
  // Other resources
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
