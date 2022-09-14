import { IPickaxe, Pickaxe } from './pickaxe';
import { getInvSellPrice, getResourceSellPrice } from './pricing';
import {
  IVoxelInventory,
  IVoxelType,
  VoxelInventory,
  VoxelInventoryDb,
} from './resources';
import { UMPlugin } from './types';
import { IVoxel } from './voxel';

const { rgbToHex } = OMEGGA_UTIL.color;

export interface IPlayerDataDb {
  money: number;
  pickLevel: number;
  resources: VoxelInventoryDb;
}

export interface IPlayerData {
  displayMiningMessage(voxel: IVoxel): void;
  displayBorderMessage(): void;
  displayInventory(): void;
  displayStats(): void;
  addResource(voxelType: IVoxelType, amount: number): void;
  sellAll(): void;
  tryUpgradePick(): boolean;
  getPickaxePower(): number;
}

interface IPlayerDataAdapter extends IPlayerData {
  canLoad(): Promise<boolean>;
  load(): Promise<void>;
  save(): Promise<void>;
}

const allAdapters: Map<string, IPlayerDataAdapter> = new Map();

class PlayerDataAdapter implements IPlayerDataAdapter {
  private plugin: UMPlugin;
  private playerId: string;
  private money: number;
  private pickaxe: IPickaxe;
  private resources: IVoxelInventory;

  constructor(plugin: UMPlugin, playerId: string) {
    this.plugin = plugin;
    this.playerId = playerId;
    this.money = 0;
    this.pickaxe = new Pickaxe();
    this.resources = new VoxelInventory();
  }

  private getStoreId(): `um_player_${string}` {
    return `um_player_${this.playerId}`;
  }

  async canLoad(): Promise<boolean> {
    return (await this.plugin.store.get(this.getStoreId())) !== null;
  }

  async load(): Promise<void> {
    const savedData: IPlayerDataDb = await this.plugin.store.get(
      this.getStoreId()
    );
    this.pickaxe = new Pickaxe(savedData.pickLevel);
    this.money = savedData.money;
    this.resources = new VoxelInventory(savedData.resources);
  }

  async save(): Promise<void> {
    const dbData: IPlayerDataDb = {
      money: this.money,
      pickLevel: this.pickaxe.getLevel(),
      resources: this.resources.toDb(),
    };

    await this.plugin.store.set(this.getStoreId(), dbData);
  }

  displayMiningMessage({ type, hp }: IVoxel): void {
    const { color, name: displayName } = type;
    const name = displayName.toUpperCase();
    const hexColor = rgbToHex(color);
    const displayHp: string = hp > 0 ? hp.toString() : 'MINED';
    const msg =
      `<size="30"><color="${hexColor}">${name}</></>` +
      '<br>' +
      `<b><size="40">${displayHp}</>`;
    this.plugin.omegga.middlePrint(this.playerId, msg);
  }

  displayBorderMessage(): void {
    this.plugin.omegga.middlePrint(
      this.playerId,
      '<size="30">BORDER</><br><b><size="40">CANNOT MINE</>'
    );
  }

  displayInventory(): void {
    const player = this.plugin.omegga.getPlayer(this.playerId);

    const invEntries = this.resources.getAll();
    // Sort inventory by resource display name.
    invEntries.sort(
      ([type1]: [IVoxelType, number], [type2]: [IVoxelType, number]) =>
        type1.name.localeCompare(type2.name)
    );
    const msgLines: string[] = [
      `<size="20"><b><u>${player.name}'s Inventory:</></></>`,
    ];
    let total = 0;
    let totalSellValue = 0;
    for (const [type, amount] of invEntries) {
      const hexColor = rgbToHex(type.color);
      const sellValue = getResourceSellPrice(type) * amount;
      totalSellValue += sellValue;
      msgLines.push(
        `> <color="${hexColor}"><i>${type.name}</></>` +
          ` - ${amount}` +
          ` - <color="00ff00">$</>${sellValue.toFixed(2)}`
      );
      total += amount as number;
    }
    msgLines.push('_______________');
    msgLines.push(
      `<color="ffff00"><i>Total</></>` +
        ` - ${total}` +
        ` - <color="00ff00">$</>${totalSellValue.toFixed(2)}`
    );
    this.plugin.omegga.whisper(this.playerId, ...msgLines);
  }

  displayStats(): void {
    const player = this.plugin.omegga.getPlayer(this.playerId);
    const pickLevel = this.pickaxe.getLevel();
    const pickUpgradeCost = this.pickaxe.getUpgradeCost().toFixed(2);
    const formattedMoney = this.money.toFixed(2);
    const msgLines: string[] = [
      `<size="20"><b><u>${player.name}'s Stats:</></></>`,
      `<color="ffff00"><i>Pick Level:</></> ${pickLevel} (next for <color="00ff00">$</>${pickUpgradeCost})`,
      `<color="ffff00"><i>Money:</></> <color="00ff00">$</>${formattedMoney}`,
    ];
    this.plugin.omegga.whisper(this.playerId, ...msgLines);
  }

  addResource(voxelType: IVoxelType, amount: number): void {
    this.resources.add(voxelType, amount);
  }

  sellAll(): void {
    if (this.resources.isEmpty()) {
      this.plugin.omegga.whisper(this.playerId, 'Nothing to sell.');
      return;
    }
    const sellValue = getInvSellPrice(this.resources);
    this.resources.clear();
    this.money += sellValue;
    const formattedValue = sellValue.toFixed(2);
    this.plugin.omegga.whisper(
      this.playerId,
      `Sold all for <color="00ff00">$</>${formattedValue}.`
    );
  }

  tryUpgradePick(): boolean {
    const upgradeCost = this.pickaxe.getUpgradeCost();
    if (upgradeCost > this.money) {
      const formattedDiff = (upgradeCost - this.money).toFixed(2);
      this.plugin.omegga.whisper(
        this.playerId,
        `Cannot upgrade pickaxe. You need <color="00ff00">$</>${formattedDiff} more.`
      );
      return;
    }
    const formattedCost = upgradeCost.toFixed(2);
    const newLevel = this.pickaxe.upgrade();
    this.plugin.omegga.whisper(
      this.playerId,
      `Upgraded pickaxe to level <color="ffff00"><b>${newLevel}</></> for <color="00ff00">$</>${formattedCost}.`
    );
    this.plugin.omegga.middlePrint(
      this.playerId,
      `<size="30">PICKAXE LEVEL</><br><b><size="40">《 <color="ffff00">${newLevel}</> 》</>`
    );
    // TODO: can we play a sound effect?
    // TODO: announce to server? maybe only at milestones like first upgrade and every 10
    this.money -= upgradeCost;
  }

  getPickaxePower(): number {
    return this.pickaxe.getPower();
  }
}

async function getPlayerDataAdapter(
  plugin: UMPlugin,
  playerId: string
): Promise<IPlayerDataAdapter> {
  if (!allAdapters.has(playerId)) {
    const newAdapter = new PlayerDataAdapter(plugin, playerId);
    if (await newAdapter.canLoad()) {
      await newAdapter.load();
    }
    allAdapters.set(playerId, newAdapter);
  }
  return allAdapters.get(playerId);
}

async function getPlayerData(
  plugin: UMPlugin,
  playerId: string
): Promise<IPlayerData> {
  return (await getPlayerDataAdapter(plugin, playerId)) as IPlayerData;
}

async function savePlayerData(
  plugin: UMPlugin,
  playerId: string
): Promise<void> {
  const adapter = await getPlayerDataAdapter(plugin, playerId);
  adapter.save();
}

async function saveAllPlayerData(): Promise<void> {
  await Promise.all(
    Array.from(allAdapters.values()).map(adapter => adapter.save())
  );
}

export const PlayerDataManager = {
  getPlayerData,
  savePlayerData,
  saveAllPlayerData,
};
