export interface IPickaxe {
  getLevel(): number;
  getPower(): number;
  upgrade(): number;
  getUpgradeCost(): number;
  reset(): void;
}

export class Pickaxe implements IPickaxe {
  private level: number;

  constructor(level?: number) {
    this.level = level || 1;
  }

  getLevel(): number {
    return this.level;
  }

  getPower(): number {
    return this.level;
  }

  upgrade(): number {
    this.level += 1;
    return this.level;
  }

  getUpgradeCost(): number {
    return (this.level + 1) * 500;
  }

  reset(): void {
    this.level = 1;
  }
}
