import fs from 'fs';
import { OL, PS, PC, Vector, OmeggaPlayer, WriteSaveObject } from 'omegga';
import path from 'path';
import { formatMoney } from 'src/formatting';
import {
  displayHelp,
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

// Location and orientation to TP players to when they use /Hub.
const HUB_TP_POS: Vector = [-84, -730.5, 115 + SPAWN_OFFSET_Z];
const HUB_TP_PITCH = 0;
const HUB_TP_YAW = 90;

export default class Plugin implements UMPlugin {
  omegga: OL;
  config: PC<UMConfig>;
  store: PS<UMStorage>;

  private mine: IMine;
  private stationManager: IStationManager;
  // Save data for the main HUB/spawn area.
  private spawnSaveData: WriteSaveObject;
  // Path where the minigame preset/config for this gamemode should be placed.
  private minigamePresetPath: string;

  constructor(omegga: OL, config: PC<UMConfig>, store: PS<UMStorage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
    this.mine = new Mine(this, MINE_ORIGIN, MINE_WIDTH, MINE_HEIGHT);
    this.stationManager = new StationManager(this);

    this.spawnSaveData = OMEGGA_UTIL.brs.read(fs.readFileSync(SPAWN_SAVE_PATH));

    this.minigamePresetPath = path.resolve(
      this.omegga.presetPath,
      'Minigame',
      `${MINIGAME_PRESET}.bp`
    );
  }

  private checkCmdAdmin(playerName: string): boolean {
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

  async onCmdMiningHelp(playerName: string) {
    try {
      displayHelp(playerName);
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

  async onCmdHub(playerName: string) {
    const posArgs = HUB_TP_POS.join(' ');
    Omegga.writeln(
      `Chat.Command /TP ${playerName} ${posArgs} ${HUB_TP_PITCH} ${HUB_TP_YAW} 0`
    );
    Omegga.middlePrint(
      playerName,
      `<size="40"><b>TELEPORTED</></>` + '<br>' + `<size="30">TO SPAWN</>`
    );
  }

  async onCmdResetMiningData(playerName: string, confirm?: string) {
    if (confirm && confirm.toLowerCase() === 'confirm') {
      const player = this.omegga.getPlayer(playerName);
      const playerData = await PlayerDataManager.getPlayerData(this, player.id);
      playerData.reset();
      await PlayerDataManager.savePlayerData(this, player.id);
      Omegga.whisper(
        playerName,
        '<color="ff00ff">CONFIRMED</>: Your mining progress has been reset.'
      );
      Omegga.middlePrint(playerName, '<size="40"><b>DATA RESET</></>');
    } else {
      Omegga.whisper(
        playerName,
        '<color="ff0000">WARNING</>: This command will clear all your mining progress.' +
          `Your mining level will be set to <b>1</>, your money set to ${formatMoney(
            0
          )}, and your inventory cleared.`,
        '-',
        'Type <color="ffff00">/ResetMiningData confirm</> to confirm your reset.'
      );
    }
  }

  async init() {
    // Make minigame config visible to Omegga as a preset.
    if (fs.existsSync(this.minigamePresetPath)) {
      fs.unlinkSync(this.minigamePresetPath);
    } else {
      fs.mkdirSync(path.parse(this.minigamePresetPath).dir, {
        recursive: true,
      });
    }
    fs.symlinkSync(MINIGAME_CFG_PATH, this.minigamePresetPath);

    this.omegga
      .once('start', this.onStart.bind(this))
      .on('leave', this.onLeave.bind(this))
      .on('cmd:mininghelp', this.onCmdMiningHelp.bind(this))
      .on('cmd:resetmine', this.onCmdResetMine.bind(this))
      .on('cmd:inventory', this.onCmdInventory.bind(this))
      .on('cmd:inv', this.onCmdInventory.bind(this))
      .on('cmd:stats', this.onCmdStats.bind(this))
      .on('cmd:hub', this.onCmdHub.bind(this))
      .on('cmd:resetminingdata', this.onCmdResetMiningData.bind(this));

    this.stationManager.init();

    return {
      registeredCommands: [
        'mininghelp',
        'resetmine',
        'inventory',
        'inv',
        'stats',
        'hub',
        'resetminingdata',
      ],
    };
  }

  async stop() {
    this.stationManager.stop();

    await PlayerDataManager.saveAllPlayerData();

    this.omegga
      .removeAllListeners('cmd:mininghelp')
      .removeAllListeners('cmd:resetmine')
      .removeAllListeners('cmd:inventory')
      .removeAllListeners('cmd:inv')
      .removeAllListeners('cmd:stats')
      .removeAllListeners('cmd:hub');

    if (this.mine.isCreated()) {
      await this.mine.clearMine();
    }

    if (fs.existsSync(this.minigamePresetPath)) {
      fs.unlinkSync(this.minigamePresetPath);
    }
  }
}
