import { OL, PS, PC, Vector } from 'omegga';
import { IMine, Mine, UMConfig, UMPlugin, UMStorage } from './src';

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

    this.omegga.on('cmd:test', async () => {
      this.omegga.broadcast('Creating mining area...');
      try {
        await this.mine.createMine();
      } catch (e) {
        console.log(e);
      }
    });

    this.omegga.on('cmd:ResetMine', async () => {
      this.omegga.broadcast('Resetting mining area...');
      try {
        await this.mine.clearMine();
        await this.mine.createMine();
      } catch (e) {
        console.log(e);
      }
    });

    // DEBUG
    this.omegga.on('cmd:pos', async () => {
      this.omegga.broadcast('Player positions:');
      const playerPositions = await Omegga.getAllPlayerPositions();
      playerPositions.forEach(pos => {
        this.omegga.broadcast(` * ${pos.player.name}  - ${pos.pos}`);
      });
    });

    return { registeredCommands: ['test', 'ResetMine'] };
  }

  async stop() {
    await this.mine.clearMine();/res
    // TODO: save player data
  }
}
