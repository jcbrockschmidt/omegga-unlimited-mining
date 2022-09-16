/** Helpers for text formatting. */

export function formatMoney(value: number) {
  return `<color="00ff00">$</><b>${value.toFixed(0)}</>`;
}
