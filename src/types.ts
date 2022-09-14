import OmeggaPlugin from 'omegga';
import { IPlayerData } from './playerData';

// TODO: define config
export type UMConfig = { foo: string };

export type UMStorage = {
  [key: `um_player_${string}`]: IPlayerData;
};

export type UMPlugin = OmeggaPlugin<UMConfig, UMStorage>;
