import { describe, it, expect } from 'vitest';
import { Pool } from '../src/utils/pool';
import { ResourceSystem } from '../src/systems/resources';
import { WaveSystem } from '../src/systems/waves';
import type { StageData } from '../src/types';

describe('Pool', () => {
  it('release한 객체를 재사용(acquire)한다', () => {
    let created = 0;
    const pool = new Pool<{ id: number }>(
      () => ({ id: ++created }),
      (o) => (o.id = -1)
    );
    const a = pool.acquire();
    pool.release(a);
    const b = pool.acquire();
    expect(b).toBe(a); // 동일 인스턴스 재사용
    expect(created).toBe(1);
  });
});

describe('ResourceSystem', () => {
  it('add는 상한을 넘지 않는다', () => {
    const r = new ResourceSystem(80, 0, 100);
    r.add(60);
    expect(r.amount).toBe(100);
  });

  it('시간 경과로 골드 적립, 소수는 누적', () => {
    const r = new ResourceSystem(100, 10);
    r.update(0.5); // +5
    expect(r.amount).toBe(105);
    r.update(0.04); // 0.4 누적 (아직 1 미만)
    expect(r.amount).toBe(105);
  });

  it('지불은 잔액 부족 시 실패', () => {
    const r = new ResourceSystem(50, 0);
    expect(r.spend(90)).toBe(false);
    expect(r.amount).toBe(50);
    expect(r.spend(50)).toBe(true);
    expect(r.amount).toBe(0);
  });
});

describe('WaveSystem', () => {
  const stage: StageData = {
    id: 1,
    name: 'T',
    baseHp: 100,
    startGold: 0,
    goldRate: 0,
    waves: [{ at: 1, enemies: [{ type: 'goblin', count: 3, interval: 1 }] }],
  };

  it('예정 시각에 적을 순서대로 소환하고 종료된다', () => {
    const w = new WaveSystem(stage);
    expect(w.totalCount).toBe(3);
    expect(w.update(1).length).toBe(1); // t=1 → 1마리
    expect(w.update(1).length).toBe(1); // t=2 → 1마리
    expect(w.finished).toBe(false);
    expect(w.update(1).length).toBe(1); // t=3 → 마지막
    expect(w.finished).toBe(true);
  });
});
