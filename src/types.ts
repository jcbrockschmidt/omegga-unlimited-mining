import OmeggaPlugin from 'omegga';
import { IPlayerDataRaw } from './playerData';

// TODO: define config
export type UMConfig = { foo: string };

export type UMStorage = {
  [key: `um_player_${string}`]: IPlayerDataRaw;
};

export type UMPlugin = OmeggaPlugin<UMConfig, UMStorage>;
