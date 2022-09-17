import { OmeggaPlayer } from 'omegga';

const HELP_LINES = [
  '<size="20"><b><u>Help for Unlimited Mining:</></></>',
  '- <b>Start mining</></> by clicking bricks in the mining area.',
  '- <b>Sell you resources</></> by clicking the minecart.',
  '- <b>Upgrade your pick</></> by clicking the workbench.',
  '- <color="ffff00">/Inventory</> <i>or</> <color="ffff00">/Inv</> - View your inventory.',
  '- <color="ffff00">/Stats</> - View your stats.',
  '- <color="ffff00">/Hub</> - Teleport back to spawn.',
  '- <color="ffff00">/MiningHelp</> - Display this help again.',
  '<size="15"><color="ffff00"><i>(Use <u>Page Up</> to see everything)</></></>',
];

/**
 * Display help information to a player.
 *
 * @param player Player to display help to.
 */
export function displayHelp(player: string | OmeggaPlayer): void {
  Omegga.whisper(player, ...HELP_LINES);
}
