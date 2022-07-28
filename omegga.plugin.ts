import OmeggaPlugin, { Brick, OL, PS, PC, Vector } from 'omegga';

import { initMiningArea, initMiningMechanics } from './src';

// TODO: do something with these
type Config = { foo: string };
type Storage = { bar: string };

// TODO: refactor

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
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
