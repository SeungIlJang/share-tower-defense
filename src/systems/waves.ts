import type { StageData } from '../types';

export interface SpawnEvent {
  type: string;
  elite?: boolean; // ⭐ 웨이브 마지막 적
  budget?: string; // 🗺️ 원래 자리 적(체력·공격·보상은 이 적 것)
}

/**
 * 웨이브 스케줄러 — 스테이지 시간(초) 흐름에 따라 적 소환 이벤트를 방출.
 * 렌더링과 무관한 순수 타이밍 로직.
 */
export interface WavePreview {
  at: number; // 발동 시각(초)
  groups: { type: string; count: number }[];
}

export class WaveSystem {
  private elapsed = 0;
  private queue: { time: number; type: string; elite?: boolean; budget?: string }[] = [];
  private cursor = 0;
  private previews: WavePreview[] = []; // 📣 예고용 웨이브 목록(시각순)
  private announced = 0;

  constructor(stage: StageData) {
    this.previews = [...stage.waves]
      .map((w) => ({ at: w.at, groups: w.enemies.map((g) => ({ type: g.type, count: g.count })) }))
      .sort((a, b) => a.at - b.at);
    // 웨이브 → 개별 소환 시각으로 평탄화
    for (const wave of stage.waves) {
      for (const group of wave.enemies) {
        for (let i = 0; i < group.count; i++) {
          this.queue.push({ time: wave.at + (group.delay ?? 0) + i * group.interval, type: group.type, elite: group.elite, budget: group.budget });
        }
      }
    }
    this.queue.sort((a, b) => a.time - b.time);
  }

  /** dt(초) 경과 → 이번 프레임에 소환돼야 할 적들 반환 */
  update(dt: number): SpawnEvent[] {
    this.elapsed += dt;
    const out: SpawnEvent[] = [];
    while (this.cursor < this.queue.length && this.queue[this.cursor].time <= this.elapsed) {
      const q = this.queue[this.cursor];
      out.push({ type: q.type, elite: q.elite, budget: q.budget });
      this.cursor++;
    }
    return out;
  }

  /** 📣 lead초 안에 시작하는 다음 웨이브(아직 예고 안 한 것) — 한 번만 돌려줌 */
  nextWave(lead: number): WavePreview | null {
    const w = this.previews[this.announced];
    if (!w || w.at - this.elapsed > lead) return null;
    this.announced++;
    return w;
  }

  get now(): number {
    return this.elapsed;
  }

  /** 모든 적 소환이 끝났는지 */
  get finished(): boolean {
    return this.cursor >= this.queue.length;
  }

  get totalCount(): number {
    return this.queue.length;
  }
}
