import OmeggaPlugin from 'omegga';
import { IPlayerDataDb } from './playerData';

// TODO: define config
export type UMConfig = { foo: string };

export type UMStorage = {
  [key: `um_player_${string}`]: IPlayerDataDb;
};

export type UMPlugin = OmeggaPlugin<UMConfig, UMStorage>;
