import OmeggaPlugin from 'omegga';
import { IPlayerDataDb } from './playerData';

export type UMConfig = Record<string, unknown>;

export type UMStorage = {
  [key: `um_player_${string}`]: IPlayerDataDb;
};

export type UMPlugin = OmeggaPlugin<UMConfig, UMStorage>;
