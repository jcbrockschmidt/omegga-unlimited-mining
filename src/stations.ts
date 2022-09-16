import { BrickInteraction } from 'omegga';
import { IExpiringSet, TimedExpiringSet } from './expiringSet';
import { PlayerDataManager } from './playerData';
import { UMPlugin } from './types';

const SELL_ALL_TAG = 'um:sellall';
const UPGRADE_TAG = 'um:upgradepick';

// TODO: refactor more from omegga.plugin.ts into here

export interface IStationManager {
  init(): void;
  stop(): void;
}

export class StationManager {
  private plugin: UMPlugin;
  private eventListener?: (args: BrickInteraction) => void;
  private sellWaitingConfirm: IExpiringSet<string>;
  private upgradeWaitingConfirm: IExpiringSet<string>;

  constructor(plugin: UMPlugin) {
    this.plugin = plugin;

    // Players have 5 seconds to confirm station interactions.
    this.sellWaitingConfirm = new TimedExpiringSet(5000);
    this.upgradeWaitingConfirm = new TimedExpiringSet(5000);
  }

  private async handleSellAll(playerId: string) {
    const playerData = await PlayerDataManager.getPlayerData(
      this.plugin,
      playerId
    );
    if (playerData.hasResources()) {
      Omegga.middlePrint(
        playerId,
        '<size="30">INVENTORY IS</>' +
          '<br>' +
          `<size="40"><b><u>EMPTY</></></>`
      );
      return;
    }

    if (!this.sellWaitingConfirm.has(playerId)) {
      const sellValue = playerData.getTotalResourcesValue();
      const formattedValue = sellValue.toFixed(2);
      Omegga.whisper(
        playerId,
        `Sell all resources for <color="00ff00">$</><b>${formattedValue}</>?`,
        '<size="15"><color="ffff00"><i>Click again to confirm.</></></>'
      );
      Omegga.middlePrint(
        playerId,
        `<size="40">SELL FOR <b><color="00ff00">$</>${formattedValue}</>?</>` +
          '<br>' +
          `<size="20"><color="ffff00"><i>CLICK TO CONFIRM</></></>`
      );
      this.sellWaitingConfirm.add(playerId);
      return;
    }

    const sellValue = playerData.sellAllResources();
    const formattedValue = sellValue.toFixed(2);
    Omegga.middlePrint(
      playerId,
      '<size="30">SOLD FOR</>' +
        '<br>' +
        `<size="40"><b><color="00ff00">$</>${formattedValue}</></>`
    );
    Omegga.whisper(
      playerId,
      `Sold all resources for <color="00ff00">$</>${formattedValue}</>.`
    );
    await PlayerDataManager.savePlayerData(this.plugin, playerId);

    this.sellWaitingConfirm.delete(playerId);
  }

  private async handleUpgradePick(playerId: string) {
    const playerData = await PlayerDataManager.getPlayerData(
      this.plugin,
      playerId
    );
    const upgradeCost = playerData.getPickUpgradeCost();
    const playerMoney = playerData.getMoney();
    if (upgradeCost > playerMoney) {
      const formattedDiff = (upgradeCost - playerMoney).toFixed(2);
      Omegga.middlePrint(
        playerId,
        '<size="40"><b><u>CANNOT UPGRADE</></></>' +
          '<br>' +
          `<size="30">NEED <color="00ff00">$</>${formattedDiff}</>`
      );
      return;
    }

    if (!this.upgradeWaitingConfirm.has(playerId)) {
      const formattedValue = upgradeCost.toFixed(2);
      Omegga.whisper(
        playerId,
        `Upgrade pickaxe for <color="00ff00">$</><b>${formattedValue}</>?`,
        '<size="15"><color="ffff00"><i>Click again to confirm.</></></>'
      );
      Omegga.middlePrint(
        playerId,
        `<size="40">UPGRADE FOR <b><color="00ff00">$</>${formattedValue}</>?</>` +
          '<br>' +
          `<size="20"><color="ffff00"><i>CLICK TO CONFIRM</></>`
      );
      this.upgradeWaitingConfirm.add(playerId);
      return;
    }

    const newLevel = playerData.upgradePick();
    const formattedCost = upgradeCost.toFixed(2);
    Omegga.whisper(
      playerId,
      `Upgraded pickaxe to level <color="ffff00"><b>${newLevel}</></> for <color="00ff00">$</>${formattedCost}.`
    );
    Omegga.middlePrint(
      playerId,
      '<size="30"><b>PICKAXE LEVEL</></>' +
        '<br>' +
        `<size="40"><b>《 <color="ffff00">${newLevel}</> 》</></>`
    );

    await PlayerDataManager.savePlayerData(this.plugin, playerId);

    this.upgradeWaitingConfirm.delete(playerId);
  }

  init(): void {
    this.eventListener = async ({ player, message }) => {
      switch (message) {
        case SELL_ALL_TAG:
          await this.handleSellAll(player.id);
          break;
        case UPGRADE_TAG:
          await this.handleUpgradePick(player.id);
          break;
      }
    };
    Omegga.on('interact', this.eventListener);
  }

  stop(): void {
    Omegga.removeListener('interact', this.eventListener);
  }
}
