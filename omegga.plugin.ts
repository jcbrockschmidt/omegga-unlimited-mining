import fs from 'fs';
import { OL, PS, PC, Vector, OmeggaPlayer, WriteSaveObject } from 'omegga';
import path from 'path';
import {
  IMine,
  IStationManager,
  Mine,
  PlayerDataManager,
  StationManager,
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
const MINIGAME_CFG_PATH = path.resolve(__dirname, '../data/minigame.bp');

export default class Plugin implements UMPlugin {
  omegga: OL;
  config: PC<UMConfig>;
  store: PS<UMStorage>;

  private mine: IMine;
  private spawnSaveData: WriteSaveObject;
  private stationManager: IStationManager;

  constructor(omegga: OL, config: PC<UMConfig>, store: PS<UMStorage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.mine = new Mine(this, MINE_ORIGIN, MINE_WIDTH, MINE_HEIGHT);
    this.stationManager = new StationManager(this);

    this.spawnSaveData = OMEGGA_UTIL.brs.read(fs.readFileSync(SPAWN_SAVE_PATH));
  }

  checkCmdAdmin(playerName: string): boolean {
    const player = this.omegga.getPlayer(playerName);
    if (!player.getRoles().includes('Admin')) {
      this.omegga.whisper(
        playerName,
        '<color="ff0000"><b>You are not admin</></>'
      );
      return false;
    }
    return true;
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

  async onCmdResetMine(playerName: string) {
    try {
      if (!this.checkCmdAdmin(playerName)) return;

      if (!this.mine.isCreated()) {
        this.omegga.whisper(playerName, 'No mine to reset');
        return;
      }
      this.omegga.broadcast('Resetting mine...');
      await this.mine.clearMine();
      await this.mine.createMine();
      this.omegga.broadcast('Mine reset');
      // We assume there is only one minigame--the minigame for this plugin.
      this.omegga.resetMinigame(0);
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

  async init() {
    // Make minigame config visible to Omegga as a preset.
    const minigamePresetDir = path.resolve(this.omegga.presetPath, 'Minigame');
    fs.mkdirSync(minigamePresetDir, { recursive: true });
    const minigameCopyPath = path.resolve(
      minigamePresetDir,
      `${MINIGAME_PRESET}.bp`
    );
    fs.copyFileSync(MINIGAME_CFG_PATH, minigameCopyPath);

    this.omegga
      .once('start', this.onStart.bind(this))
      .on('leave', this.onLeave.bind(this))
      .on('cmd:resetmine', this.onCmdResetMine.bind(this))
      .on('cmd:inventory', this.onCmdInventory.bind(this))
      .on('cmd:inv', this.onCmdInventory.bind(this))
      .on('cmd:stats', this.onCmdStats.bind(this));

    this.stationManager.init();

    return {
      registeredCommands: ['resetmine', 'inventory', 'inv', 'stats'],
    };
  }

  async stop() {
    this.stationManager.stop();

    await PlayerDataManager.saveAllPlayerData();

    this.omegga
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
