import type { StageData } from '../types';

export interface SpawnEvent {
  type: string;
}

/**
 * 웨이브 스케줄러 — 스테이지 시간(초) 흐름에 따라 적 소환 이벤트를 방출.
 * 렌더링과 무관한 순수 타이밍 로직.
 */
export class WaveSystem {
  private elapsed = 0;
  private queue: { time: number; type: string }[] = [];
  private cursor = 0;

  constructor(stage: StageData) {
    // 웨이브 → 개별 소환 시각으로 평탄화
    for (const wave of stage.waves) {
      for (const group of wave.enemies) {
        for (let i = 0; i < group.count; i++) {
          this.queue.push({ time: wave.at + i * group.interval, type: group.type });
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
      out.push({ type: this.queue[this.cursor].type });
      this.cursor++;
    }
    return out;
  }

  /** 모든 적 소환이 끝났는지 */
  get finished(): boolean {
    return this.cursor >= this.queue.length;
  }

  get totalCount(): number {
    return this.queue.length;
  }
}
