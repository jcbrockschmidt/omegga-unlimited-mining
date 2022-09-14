import { PS } from 'omegga';
import { UMStorage } from './types';

export interface IPlayerData {
  playerId: string;
  resources: { [voxelType: string]: number };
  pickLevel: number;
}

interface IPlayerDataAdapter extends IPlayerData {
  canLoad(): Promise<boolean>;
  load(): Promise<void>;
  save(): Promise<void>;
}

const allAdapters: Map<string, IPlayerDataAdapter> = new Map();

class PlayerDataAdapter implements IPlayerDataAdapter {
  public playerId: string;
  public resources: { [voxelType: string]: number };
  public pickLevel: number;
  private store: PS<UMStorage>;

  constructor(store: PS<UMStorage>, playerId: string) {
    this.store = store;
    this.playerId = playerId;
    this.resources = {};
    this.pickLevel = 1;
  }

  private getStoreId(): `um_player_${string}` {
    return `um_player_${this.playerId}`;
  }

  async canLoad(): Promise<boolean> {
    return (await this.store.get(this.getStoreId())) !== null;
  }

  async load(): Promise<void> {
    const savedData: IPlayerData = await this.store.get(this.getStoreId());
    this.resources = savedData.resources;
    this.pickLevel = savedData.pickLevel;
  }

  async save(): Promise<void> {
    await this.store.set(this.getStoreId(), this as IPlayerData);
  }
}

async function getPlayerDataAdapter(
  store: PS<UMStorage>,
  playerId: string
): Promise<IPlayerDataAdapter> {
  if (!allAdapters.has(playerId)) {
    const newAdapter = new PlayerDataAdapter(store, playerId);
    if (await newAdapter.canLoad()) {
      await newAdapter.load();
    }
    allAdapters.set(playerId, newAdapter);
  }
  return allAdapters.get(playerId);
}

async function getPlayerData(
  store: PS<UMStorage>,
  playerId: string
): Promise<IPlayerData> {
  return (await getPlayerDataAdapter(store, playerId)) as IPlayerData;
}

async function savePlayerData(
  store: PS<UMStorage>,
  playerId: string
): Promise<void> {
  const adapter = await getPlayerDataAdapter(store, playerId);
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
