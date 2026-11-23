import { describe, expect, it } from 'vitest';
import { SKILL_WEIGHT, catchupHero, CATCHUP_MAX, CATCHUP_SLACK, catchupMult, catchupParts, deckPower, expectedPower, skillFactor, supportLevel, supportPower, unitPower } from '../src/systems/catchup';
import { tierFromLevel } from '../src/systems/evolution';
import { STAGES, recommendedLevel } from '../src/systems/worlds';

const deck = (lv: number, n = 5): { level: number; tier: number }[] => Array.from({ length: n }, () => ({ level: lv, tier: tierFromLevel(lv) }));
const em = (id: number): number => STAGES.find((s) => s.id === id)!.enemyMult ?? 1;

describe('🔥 따라오는 적', () => {
  it('권장 레벨 이하면 그대로(모든 관문)', () => {
    for (const st of STAGES) {
      const rec = recommendedLevel(st.id, st.enemyMult ?? 1);
      expect(catchupMult(st.id, st.enemyMult ?? 1, deck(rec))).toBe(1);
      expect(catchupMult(st.id, st.enemyMult ?? 1, deck(Math.max(0, rec - 3)))).toBe(1);
    }
    expect(catchupMult(1, 1, deck(0))).toBe(1); // 처음 시작한 사람
    expect(catchupMult(5, 1, [])).toBe(1);
  });

  it('봐주는 폭 없음 — 권장보다 한 레벨만 높아도 따라옴', () => {
    const rec = recommendedLevel(14, em(14));
    expect(deckPower(deck(rec + 1))).toBeGreaterThan(expectedPower(14, em(14)));
    expect(catchupMult(14, em(14), deck(rec + 1))).toBeGreaterThan(1);
    expect(CATCHUP_SLACK).toBe(1);
  });

  it('남는 우위는 10% 안쪽(상한 전) — 어느 관문에서 얼마나 강화해도', () => {
    for (const id of [1, 5, 10, 12, 20, 30, 50]) {
      const exp = expectedPower(id, em(id));
      for (const lv of [3, 5, 8, 10, 15, 20]) {
        const m = catchupMult(id, em(id), deck(lv));
        if (m >= CATCHUP_MAX) continue;
        expect(Math.max(1, deckPower(deck(lv)) / exp) / m).toBeLessThan(1.12);
      }
    }
    expect(catchupMult(1, 1, deck(10))).toBeLessThan(CATCHUP_MAX); // ★3으로 1관문에 와도 상한에 안 닿음
  });

  it('영웅·성·인구·에너지 강화도 셈 — 유닛이 권장 그대로여도 따라옴', () => {
    const rec = recommendedLevel(12, em(12));
    const e = supportLevel(12, em(12));
    const base = { hero: e, castle: e, pop: e, energy: e };
    expect(supportPower(12, em(12), base)).toBe(1);
    expect(supportPower(12, em(12), { hero: 0, castle: 0, pop: 0, energy: 0 })).toBe(1); // 덜 올렸다고 적이 약해지진 않음
    expect(catchupMult(12, em(12), deck(rec), base)).toBe(1);
    const hero = catchupMult(12, em(12), deck(rec), { ...base, hero: 10 });
    expect(hero).toBeGreaterThan(1.05);
    expect(catchupMult(12, em(12), deck(rec), { hero: 10, castle: 10, pop: 10, energy: 10 })).toBeGreaterThan(hero);
    expect(catchupMult(12, em(12), deck(rec))).toBe(1); // 안 넘기면 유닛만
  });

  it('많이 앞서면 넘친 만큼 따라옴 — 더 강화해도 격차는 벌어지지 않음', () => {
    const m = catchupMult(14, em(14), deck(10)); // 권장 Lv6에 Lv10(★3)
    expect(m).toBeGreaterThan(1.6);
    expect(m).toBeLessThan(2.9);
    const adv = (lv: number): number => deckPower(deck(lv)) / catchupMult(14, em(14), deck(lv));
    expect(adv(10)).toBeCloseTo(adv(8), 1); // 더 강화해도 남는 우위는 그대로(상한 전)
    expect(adv(10) / adv(6)).toBeLessThan(deckPower(deck(10)) / deckPower(deck(6))); // 하지만 격차는 줄어듦
  });

  it('한두 기만 몰아 키워도 잡힘 · 상한', () => {
    const lop = [...deck(12, 3), ...deck(0, 2)];
    expect(catchupMult(12, em(12), lop)).toBe(catchupMult(12, em(12), deck(12)));
    expect(catchupMult(1, 1, deck(100))).toBe(CATCHUP_MAX);
    expect(CATCHUP_MAX).toBe(6);
    expect(catchupParts(2)).toEqual({ hp: 2, atk: 2 }); // 체력·공격 함께
    expect(catchupParts(2, true)).toEqual({ hp: 1.6, atk: 1.6 }); // 보스는 60%만
    expect(catchupParts(1)).toEqual({ hp: 1, atk: 1 });
    expect(catchupHero(1)).toBe(1);
    expect(catchupHero(3)).toBe(4); // 👑 영웅은 적이 세진 폭의 1.5배만큼 튼튼
    expect(unitPower(0, 0)).toBe(1);
    expect(unitPower(10, 2)).toBeCloseTo(2.9 * 1.2 * skillFactor(10, 2), 5);
    expect(skillFactor(10, 2)).toBeCloseTo(Math.pow((2 + 3.5 * 1.25) / 3, SKILL_WEIGHT), 5); // 3타마다 ×3.5(★3 ×1.25)
    expect(skillFactor(30, 4)).toBeGreaterThan(skillFactor(10, 2));
  });
});
