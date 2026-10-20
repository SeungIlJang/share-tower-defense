import { describe, expect, it } from 'vitest';
import { AURA_RADIUS, HERO_SKILLS, HERO_TIERS, heroBodyScale, heroTier, nextHeroTier, auraRadius, heroLvMult, heroSkillPower, heroStats, heroUpCost, inAura, maceTargets, stepToward } from '../src/systems/hero';
import { isSkillSwing } from '../src/systems/unitSkills';

describe('👑 영웅', () => {
  it('스테이지·적 배율에 따라 강해짐', () => {
    expect(heroStats(1).hp).toBe(1100);
    expect(heroStats(11).hp).toBeGreaterThan(heroStats(1).hp);
    expect(heroStats(1, 2).atk).toBe(60);
  });

  it('오라 판정', () => {
    expect(inAura(100, 100)).toBe(true);
    expect(inAura(100 + AURA_RADIUS, 100)).toBe(true);
    expect(inAura(100 + AURA_RADIUS + 1, 100)).toBe(false);
    expect(inAura(0, 100, 50)).toBe(false);
  });

  it('목표로 한 걸음 — 넘어가지 않고 범위 안', () => {
    expect(stepToward(100, 200, 100, 0.5, 0, 1000)).toBe(150);
    expect(stepToward(190, 200, 100, 0.5, 0, 1000)).toBe(200);
    expect(stepToward(100, 0, 100, 0.5, 80, 1000)).toBe(80);
    expect(stepToward(900, 2000, 1000, 1, 0, 1000)).toBe(1000);
  });

  it('철퇴 — 앞쪽 사거리 안 가까운 2명', () => {
    const es = [
      { x: 500, active: true },
      { x: 150, active: true },
      { x: 300, active: true },
      { x: 50, active: true }, // 뒤쪽
      { x: 200, active: false },
    ];
    expect(maceTargets(100, es).map((e) => e.x)).toEqual([150, 300]);
    expect(maceTargets(100, es, 100)).toHaveLength(1);
  });
});

describe('👑 영웅 강화 · 오라 카드 · 스킬', () => {
  it('오라 반지름 = 기본 + 영구 강화 + 레벨업 카드 + 각성', () => {
    expect(auraRadius(0, 0, false)).toBe(AURA_RADIUS);
    expect(auraRadius(2, 1, false)).toBe(AURA_RADIUS + 30 + 25);
    expect(auraRadius(0, 4, true)).toBe(AURA_RADIUS + 100 + 100);
  });

  it('영웅 레벨·스킬 위력·비용', () => {
    expect(heroLvMult(5)).toBeCloseTo(1.6);
    expect(heroSkillPower(2)).toBeCloseTo(1.3);
    expect(heroUpCost('hero', 0)).toBe(200);
    expect(heroUpCost('aura', 1)).toBe(500);
    expect(heroUpCost('skill', 2)).toBe(650);
  });

  it('스킬 3종 — 철퇴만 기본, 나머지는 가격 있음', () => {
    expect(HERO_SKILLS.map((s) => s.hotkey)).toEqual(['J', 'K', 'L']);
    expect(HERO_SKILLS.filter((s) => s.price === 0).map((s) => s.key)).toEqual(['mace']);
  });

  it('기술 오라 — 스킬 주기 단축(최소 2타)', () => {
    expect(isSkillSwing(5, 1)).toBe(true);
    expect(isSkillSwing(4, 1)).toBe(false);
    expect(isSkillSwing(4, 1, 1)).toBe(true);
    expect(isSkillSwing(2, 4, 3)).toBe(true); // 3-3 → 최소 2
  });
});

describe('👑 영웅 진화', () => {
  it('레벨 → 단계', () => {
    expect(heroTier(0)).toBe(0);
    expect(heroTier(4)).toBe(0);
    expect(heroTier(5)).toBe(1);
    expect(heroTier(14)).toBe(2);
    expect(heroTier(15)).toBe(3);
    expect(heroTier(20)).toBe(4);
  });

  it('다음 진화 · 몸집', () => {
    expect(nextHeroTier(0)?.min).toBe(5);
    expect(nextHeroTier(20)).toBeNull();
    expect(heroBodyScale(4)).toBeGreaterThan(heroBodyScale(0));
  });

  it('그림 5장이 매니페스트에 있음(스킬 동작 포함)', async () => {
    const m = (await import('../public/sprites/manifest.json')).default as unknown as Record<string, { anims: Record<string, unknown> }>;
    for (const t of HERO_TIERS) expect(Object.keys(m[t.look].anims)).toContain('skill');
  });
});
