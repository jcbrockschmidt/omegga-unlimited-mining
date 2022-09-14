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
  private pickLevel: number;
  private resources: IVoxelInventory;
  private totalMined: number;

  constructor(plugin: UMPlugin, playerId: string) {
    this.plugin = plugin;
    this.playerId = playerId;
    this.money = 0;
    this.pickLevel = 1;
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
    this.pickLevel = savedData.pickLevel;
    this.money = savedData.money;
    this.resources = new VoxelInventory(savedData.resources);
  }

  async save(): Promise<void> {
    const dbData: IPlayerDataDb = {
      money: this.money,
      pickLevel: this.pickLevel,
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
    for (const [type, amount] of invEntries) {
      const hexColor = rgbToHex(type.color);
      msgLines.push(`> <color="${hexColor}"><i>${type.name}</></> - ${amount}`);
      total += amount as number;
    }
    msgLines.push('_______________');
    msgLines.push(`<color="ffff00"><i>Total</></> - ${total}`);
    this.plugin.omegga.whisper(this.playerId, ...msgLines);
  }

  displayStats(): void {
    const player = this.plugin.omegga.getPlayer(this.playerId);
    const msgLines: string[] = [
      `<size="20"><b><u>${player.name}'s Stats:</></></>`,
      `<color="ffff00"><i>Pick Level:</></> ${this.pickLevel}`,
      `<color="ffff00"><i>Money:</></> <color="00ff00">$</>${this.money.toFixed(
        2
      )}`,
    ];
    this.plugin.omegga.whisper(this.playerId, ...msgLines);
  }

  addResource(voxelType: IVoxelType, amount: number): void {
    this.resources.add(voxelType, amount);
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
