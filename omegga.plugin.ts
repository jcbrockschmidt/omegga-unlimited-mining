import { OL, PS, PC } from 'omegga';

import {
  initMiningArea,
  initMiningMechanics,
  UMConfig,
  UMPlugin,
  UMStorage,
} from './src';

export default class Plugin implements UMPlugin {
  omegga: OL;
  config: PC<UMConfig>;
  store: PS<UMStorage>;

  constructor(omegga: OL, config: PC<UMConfig>, store: PS<UMStorage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  async init() {
    // TODO: delete world plate

    try {
      initMiningMechanics(this);
    } catch (e) {
      console.log(e);
    }

    // TODO: rename command
    this.omegga.on('cmd:test', async () => {
      this.omegga.broadcast('Initializing mining area...');
      try {
        await initMiningArea(10, 20);
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

    // TODO: cmd to reset mining area

    return { registeredCommands: ['test'] };
  }

  async stop() {
    // TODO: save player data
  }
}
