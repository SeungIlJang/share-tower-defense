import { describe, expect, it } from 'vitest';
import { CATCHUP_MAX, CATCHUP_SLACK, catchupMult, catchupParts, deckPower, expectedPower, skillFactor, unitPower } from '../src/systems/catchup';
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

  it('조금 앞서는 건(10%까지) 그대로', () => {
    expect(deckPower(deck(6))).toBeGreaterThan(expectedPower(14, em(14))); // 권장보다 한 단계 위
    expect(catchupMult(14, em(14), deck(6))).toBeLessThan(1.1);
    expect(CATCHUP_SLACK).toBe(1.1);
  });

  it('많이 앞서면 넘친 만큼의 80% — 그래도 강화한 쪽이 유리', () => {
    const m = catchupMult(14, em(14), deck(10)); // 권장 Lv6에 Lv10(★3)
    expect(m).toBeGreaterThan(1.5);
    expect(m).toBeLessThan(1.9);
    const adv = (lv: number): number => deckPower(deck(lv)) / catchupMult(14, em(14), deck(lv));
    expect(adv(10)).toBeGreaterThan(adv(8)); // 더 강화하면 여전히 더 유리
    expect(adv(8)).toBeGreaterThan(adv(6));
    expect(adv(10) / adv(6)).toBeLessThan(deckPower(deck(10)) / deckPower(deck(6))); // 하지만 격차는 줄어듦
  });

  it('한두 기만 몰아 키워도 잡힘 · 상한', () => {
    const lop = [...deck(12, 3), ...deck(0, 2)];
    expect(catchupMult(12, em(12), lop)).toBe(catchupMult(12, em(12), deck(12)));
    expect(catchupMult(1, 1, deck(100))).toBe(CATCHUP_MAX);
    expect(CATCHUP_MAX).toBe(2.5);
    expect(catchupParts(2)).toEqual({ hp: 2, atk: 2 }); // 체력·공격 함께
    expect(catchupParts(2, true)).toEqual({ hp: 1.6, atk: 1.6 }); // 보스는 60%만
    expect(catchupParts(1)).toEqual({ hp: 1, atk: 1 });
    expect(unitPower(0, 0)).toBe(1);
    expect(unitPower(10, 2)).toBeCloseTo(2.9 * 1.2 * skillFactor(10, 2), 5);
    expect(skillFactor(10, 2)).toBeCloseTo(Math.sqrt((2 + 3.5 * 1.25) / 3), 5); // 3타마다 ×3.5(★3 ×1.25)
    expect(skillFactor(30, 4)).toBeGreaterThan(skillFactor(10, 2));
  });
});
