/** 골드 자원 관리 (시간당 적립 + 소모) */
export class ResourceSystem {
  private gold: number;
  private rate: number; // 초당 적립
  private carry = 0;
  private cap: number;

  constructor(startGold: number, ratePerSec: number, cap = Infinity) {
    this.gold = Math.min(startGold, cap);
    this.rate = ratePerSec;
    this.cap = cap;
  }

  /** dt(초) 만큼 시간 경과 → 적립 (정수 단위, 상한 clamp) */
  update(dt: number): void {
    if (this.gold >= this.cap) return;
    this.carry += this.rate * dt;
    const whole = Math.floor(this.carry);
    if (whole > 0) {
      this.gold = Math.min(this.cap, this.gold + whole);
      this.carry -= whole;
    }
  }

  /** 상한 올리기 — 🔋 마력 폭주 각성 */
  raiseCap(n: number): void {
    this.cap += n;
  }

  get max(): number {
    return this.cap;
  }

  get amount(): number {
    return this.gold;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /** 비용 지불 시도 — 성공하면 true */
  spend(cost: number): boolean {
    if (!this.canAfford(cost)) return false;
    this.gold -= cost;
    return true;
  }

  /** 즉시 적립 (상한 clamp) */
  add(amount: number): void {
    this.gold = Math.min(this.cap, this.gold + amount);
  }
}
