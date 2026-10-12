/**
 * 범용 오브젝트 풀 — 대량 소환/소멸 시 GC 부담 감소.
 * (Phaser 그룹과 별개로 순수 로직/엔티티 재사용에 사용, 테스트 가능)
 */
export class Pool<T> {
  private free: T[] = [];
  private factory: () => T;
  private onReset: (obj: T) => void;

  constructor(factory: () => T, onReset: (obj: T) => void, prewarm = 0) {
    this.factory = factory;
    this.onReset = onReset;
    for (let i = 0; i < prewarm; i++) this.free.push(this.factory());
  }

  acquire(): T {
    const obj = this.free.pop();
    return obj !== undefined ? obj : this.factory();
  }

  release(obj: T): void {
    this.onReset(obj);
    this.free.push(obj);
  }

  /** 풀에 대기 중인(재사용 가능) 객체 수 */
  get available(): number {
    return this.free.length;
  }
}
