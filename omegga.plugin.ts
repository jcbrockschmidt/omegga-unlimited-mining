import { OL, PS, PC, Vector } from 'omegga';
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

  async init() {
    // TODO: delete world plate

    this.omegga
      .on('leave', async ({ id }) => {
        try {
          await PlayerDataManager.savePlayerData(this, id);
        } catch (e) {
          console.log(e);
        }
      })
      .on('cmd:createmine', async (playerName: string) => {
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
      })
      .on('cmd:clearmine', async (playerName: string) => {
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
      })
      .on('cmd:resetmine', async (playerName: string) => {
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
      })
      .on('cmd:inv', async (playerName: string) => {
        try {
          const player = this.omegga.getPlayer(playerName);
          const playerData = await PlayerDataManager.getPlayerData(
            this,
            player.id
          );
          playerData.displayInventory();
        } catch (e) {
          console.log(e);
        }
      });

    return { registeredCommands: ['createmine', 'clearmine', 'resetmine'] };
  }

  async stop() {
    await PlayerDataManager.saveAllPlayerData();

    this.omegga
      .removeAllListeners('cmd:createmine')
      .removeAllListeners('cmd:clearmine')
      .removeAllListeners('cmd:resetmine');

    if (this.mine.isCreated()) {
      await this.mine.clearMine();
    }
  }
}
