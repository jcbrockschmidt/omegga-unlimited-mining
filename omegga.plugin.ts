import fs from 'fs';
import { OL, PS, PC, Vector, OmeggaPlayer, WriteSaveObject } from 'omegga';
import path from 'path';
import {
  IMine,
  Mine,
  PlayerDataManager,
  UMConfig,
  UMPlugin,
  UMStorage,
} from './src';

// We want the mine to start as high as possible to prevent players from
// reaching the world's baseplate. This is the highest order of magnitude we
// can use without problems. Use 10000000 results in a black screen when a
// player spawns in. We also can't start underneath the world's baseplate since
// minigame spawn points won't work.
const SPAWN_OFFSET_Z = 1000000;
const SPAWN_SAVE_PATH = `${__dirname}/../data/spawn.brs`;

// The mine origin and size is hard-coded to align with the spawn build.
const MINE_ORIGIN: Vector = [0, 0, 10 + SPAWN_OFFSET_Z];
const MINE_WIDTH = 20;
const MINE_HEIGHT = 20;

const MINIGAME_PRESET = 'unlimited-mining';
const MINIGAME_PRESET_DIR = path.resolve(
  __dirname,
  '../../../data/Saved/Presets/Minigame'
);
const MINIGAME_CFG_SRC_PATH = path.resolve(__dirname, '../data/minigame.bp');
const MINIGAME_CFG_DEST_PATH = path.resolve(
  MINIGAME_PRESET_DIR,
  `${MINIGAME_PRESET}.bp`
);

export default class Plugin implements UMPlugin {
  omegga: OL;
  config: PC<UMConfig>;
  store: PS<UMStorage>;

  private mine: IMine;
  private spawnSaveData: WriteSaveObject;

  constructor(omegga: OL, config: PC<UMConfig>, store: PS<UMStorage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.mine = new Mine(this, MINE_ORIGIN, MINE_WIDTH, MINE_HEIGHT);

    this.spawnSaveData = OMEGGA_UTIL.brs.read(fs.readFileSync(SPAWN_SAVE_PATH));
  }

  async onStart() {
    this.omegga.loadMinigame(MINIGAME_PRESET);
    this.omegga.loadSaveData(this.spawnSaveData, { offZ: SPAWN_OFFSET_Z });
    await this.mine.createMine();
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
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdSellAll(playerName: string) {
    try {
      const player = this.omegga.getPlayer(playerName);
      const playerData = await PlayerDataManager.getPlayerData(this, player.id);
      playerData.sellAll();
      await PlayerDataManager.savePlayerData(this, player.id);
    } catch (e) {
      console.log(e);
    }
  }

  async onCmdUpgradePick(playerName: string) {
    try {
      const player = this.omegga.getPlayer(playerName);
      const playerData = await PlayerDataManager.getPlayerData(this, player.id);
      if (playerData.tryUpgradePick()) {
        await PlayerDataManager.savePlayerData(this, player.id);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async init() {
    // Make minigame config visible to Omegga as a preset.
    fs.mkdirSync(MINIGAME_PRESET_DIR, { recursive: true });
    fs.copyFileSync(MINIGAME_CFG_SRC_PATH, MINIGAME_CFG_DEST_PATH);

    this.omegga
      .on('start', this.onStart.bind(this))
      .on('leave', this.onLeave.bind(this))
      .on('cmd:createmine', this.onCmdCreateMine.bind(this))
      .on('cmd:clearmine', this.onCmdClearMine.bind(this))
      .on('cmd:resetmine', this.onCmdResetMine.bind(this))
      .on('cmd:inventory', this.onCmdInventory.bind(this))
      .on('cmd:inv', this.onCmdInventory.bind(this))
      .on('cmd:stats', this.onCmdStats.bind(this))
      .on('cmd:sellall', this.onCmdSellAll.bind(this))
      .on('cmd:upgradepick', this.onCmdUpgradePick.bind(this));

    return {
      registeredCommands: [
        'createmine',
        'clearmine',
        'resetmine',
        'inventory',
        'inv',
        'stats',
        'sellall',
        'upgradepick',
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
      .removeAllListeners('cmd:sellall')
      .removeAllListeners('cmd:upgradepick');

    if (this.mine.isCreated()) {
      await this.mine.clearMine();
    }
  }
}
