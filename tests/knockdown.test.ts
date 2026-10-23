import { describe, expect, it } from 'vitest';
import { knockChance } from '../src/systems/knockdown';

describe('💫 넉다운', () => {
  it('아군 무거운 공격 — 기병 > 기사, 중갑은 절반, 보스·거대는 안 밀림', () => {
    expect(knockChance('cavalry', 'ally', 'goblin')).toBeGreaterThan(knockChance('knight', 'ally', 'goblin'));
    expect(knockChance('knight', 'ally', 'orc')).toBeCloseTo(knockChance('knight', 'ally', 'goblin') / 2);
    expect(knockChance('cavalry', 'ally', 'dragon')).toBe(0);
    expect(knockChance('archer', 'ally', 'goblin')).toBe(0);
  });

  it('적 — 보스·우두머리만, 방패병·영웅·마차는 안 밀림', () => {
    expect(knockChance('dragon', 'enemy', 'soldier')).toBeGreaterThan(0);
    expect(knockChance('goblin', 'enemy', 'soldier')).toBe(0);
    expect(knockChance('dragon', 'enemy', 'shield')).toBe(0);
    expect(knockChance('dragon', 'enemy', 'hero')).toBe(0);
    expect(knockChance('dragon', 'enemy', 'wagon')).toBe(0);
  });
});
