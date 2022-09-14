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
          await PlayerDataManager.savePlayerData(this.store, id);
        } catch (e) {
          console.log(e);
        }
      })
      .on('cmd:initmine', async () => {
        this.omegga.broadcast('Creating mining area...');
        try {
          await this.mine.createMine();
        } catch (e) {
          console.log(e);
        }
      })
      .on('cmd:clearmine', async () => {
        this.omegga.broadcast('Clearing mining area...');
        try {
          await this.mine.clearMine();
        } catch (e) {
          console.log(e);
        }
      })
      .on('cmd:resetmine', async () => {
        this.omegga.broadcast('Resetting mining area...');
        try {
          await this.mine.clearMine();
          await this.mine.createMine();
        } catch (e) {
          console.log(e);
        }
      });

    return { registeredCommands: ['initmine', 'clearmine', 'resetmine'] };
  }

  async stop() {
    await PlayerDataManager.saveAllPlayerData();

    this.omegga
      .removeAllListeners('cmd:initmine')
      .removeAllListeners('cmd:clearmine')
      .removeAllListeners('cmd:resetmine');

    // TODO: Why does this fail?
    // await this.mine.clearMine();
  }
}
