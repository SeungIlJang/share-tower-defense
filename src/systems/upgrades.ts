import type { UnitStats } from '../types';

/** 강화 순수 계산 (Vitest 검증) */

/** 레벨 N → 다음 레벨 강화 비용(메타 골드) */
export function upgradeCost(level: number): number {
  return 100 + level * 80;
}

/** 레벨당 +15% (반올림) */
export function scaleStat(base: number, level: number): number {
  return Math.round(base * (1 + level * 0.15));
}

/** 유닛 스탯에 강화 레벨 적용(hp·atk 상승) */
export function applyUpgrade(stats: UnitStats, level: number): UnitStats {
  if (level <= 0) return stats;
  return { ...stats, hp: scaleStat(stats.hp, level), atk: scaleStat(stats.atk, level) };
}

/**
 * 메타 진행도(영구) — 유닛 레벨 + 메타 골드.
 * 프로토타입은 localStorage, 네이티브 전환 시 @capacitor/preferences로 교체 예정.
 */
const KEY = 'ld_meta_v1';

export class MetaProgress {
  gold = 0;
  levels: Record<string, number> = {};

  constructor() {
    this.load();
  }

  level(type: string): number {
    return this.levels[type] ?? 0;
  }

  nextCost(type: string): number {
    return upgradeCost(this.level(type));
  }

  canUpgrade(type: string): boolean {
    return this.gold >= this.nextCost(type);
  }

  upgrade(type: string): boolean {
    const cost = this.nextCost(type);
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.levels[type] = this.level(type) + 1;
    this.save();
    return true;
  }

  addGold(amount: number): void {
    this.gold += amount;
    this.save();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const obj = JSON.parse(raw) as { gold?: number; levels?: Record<string, number> };
        this.gold = obj.gold ?? 0;
        this.levels = obj.levels ?? {};
      }
    } catch {
      /* ignore */
    }
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify({ gold: this.gold, levels: this.levels }));
    } catch {
      /* ignore */
    }
  }
}

/** 전역 싱글턴 */
export const meta = new MetaProgress();
