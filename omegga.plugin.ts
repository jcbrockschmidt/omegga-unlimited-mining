import { OL, PS, PC, Vector, OmeggaPlayer } from 'omegga';
import {
  IMine,
  Mine,
  PlayerDataManager,
  UMConfig,
  UMPlugin,
  UMStorage,
} from './src';

const MINE_ORIGIN: Vector = [153, -13, 341];
const MINE_WIDTH = 10;
const MINE_HEIGHT = 20;

export default class Plugin implements UMPlugin {
  omegga: OL;
  config: PC<UMConfig>;
  store: PS<UMStorage>;

  private mine: IMine;

  constructor(omegga: OL, config: PC<UMConfig>, store: PS<UMStorage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.mine = new Mine(this, MINE_ORIGIN, MINE_WIDTH, MINE_HEIGHT);
  }

  async onLeave({ id }: OmeggaPlayer) {
    try {
      await PlayerDataManager.savePlayerData(this, id);
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdCreateMine(playerName: string) {
    try {
      if (this.mine.isCreated()) {
        this.omegga.whisper(playerName, 'Mine already created');
        return;
      }
      this.omegga.broadcast('Creating mine...');
      await this.mine.createMine();
      this.omegga.broadcast('Mine created');
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdClearMine(playerName: string) {
    try {
      if (!this.mine.isCreated()) {
        this.omegga.whisper(playerName, 'No mine to clear');
        return;
      }
      this.omegga.broadcast('Clearing mine...');
      await this.mine.clearMine();
      this.omegga.broadcast('Mine cleared');
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdResetMine(playerName: string) {
    try {
      if (!this.mine.isCreated()) {
        this.omegga.whisper(playerName, 'No mine to reset');
        return;
      }
      this.omegga.broadcast('Resetting mine...');
      await this.mine.clearMine();
      await this.mine.createMine();
      this.omegga.broadcast('Mine reset');
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdInventory(playerName: string) {
    try {
      const player = this.omegga.getPlayer(playerName);
      const playerData = await PlayerDataManager.getPlayerData(this, player.id);
      playerData.displayInventory();
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdStats(playerName: string) {
    try {
      const player = this.omegga.getPlayer(playerName);
      const playerData = await PlayerDataManager.getPlayerData(this, player.id);
      playerData.displayStats();
      await PlayerDataManager.savePlayerData(this, player.id);
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdSellAll(playerName: string) {
    try {
      const player = this.omegga.getPlayer(playerName);
      const playerData = await PlayerDataManager.getPlayerData(this, player.id);
      playerData.sellAll();
    } catch (e) {
      console.log(e);
    }
  }

  async init() {
    // TODO: delete world plate

    this.omegga
      .on('leave', this.onLeave.bind(this))
      .on('cmd:createmine', this.onCmdCreateMine.bind(this))
      .on('cmd:clearmine', this.onCmdClearMine.bind(this))
      .on('cmd:resetmine', this.onCmdResetMine.bind(this))
      .on('cmd:inventory', this.onCmdInventory.bind(this))
      .on('cmd:inv', this.onCmdInventory.bind(this))
      .on('cmd:stats', this.onCmdStats.bind(this))
      .on('cmd:sellall', this.onCmdSellAll.bind(this));

    return {
      registeredCommands: [
        'createmine',
        'clearmine',
        'resetmine',
        'inventory',
        'inv',
        'stats',
        'sellall',
      ],
    };
  }

  async stop() {
    await PlayerDataManager.saveAllPlayerData();

    this.omegga
      .removeAllListeners('cmd:createmine')
      .removeAllListeners('cmd:clearmine')
      .removeAllListeners('cmd:resetmine')
      .removeAllListeners('cmd:inventory')
      .removeAllListeners('cmd:inv')
      .removeAllListeners('cmd:stats')
      .removeAllListeners('cmd:sellall');

    if (this.mine.isCreated()) {
      await this.mine.clearMine();
    }
  }
}
