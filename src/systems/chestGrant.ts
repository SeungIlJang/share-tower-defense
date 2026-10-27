/**
 * 🎁 상자 열어서 바로 지급 — 전투 결과·광고 상자·주간 보스 단계에서 같이 씀.
 * 조각은 보유 유닛 중(이번 판에 많이 쓴 유닛일수록 잘), 💍 행운의 반지면 확률로 한 등급 위, 🛡️ 장비도 굴림.
 */
import unitsData from '../data/units.json';
import { rollChest, type ChestLoot } from './chests';
import { ringPct, rollEquip } from './equipment';
import { meta } from './upgrades';

export function grantNewChest(tier: ChestLoot['tier'], goldMult: number, used: Record<string, number> = {}): ChestLoot {
  const owned = Object.keys(unitsData).filter((k) => meta.ownsUnit(k));
  const up = Math.random() < (ringPct('ring_luck', meta.ringEq === 'ring_luck' ? meta.equipGrade('ring_luck') : 0) * 2) / 100;
  const t = Math.min(3, tier + (up ? 1 : 0)) as ChestLoot['tier'];
  const loot = rollChest(t, owned, used, goldMult, Math.random);
  loot.equip = rollEquip(t, Math.random);
  meta.grantChest(loot);
  return loot;
}
