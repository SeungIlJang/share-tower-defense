/** 골드 자원 관리 (시간당 적립 + 소모) */
export class ResourceSystem {
  private gold: number;
  private rate: number; // 초당 골드
  private carry = 0;

  constructor(startGold: number, ratePerSec: number) {
    this.gold = startGold;
    this.rate = ratePerSec;
  }

  /** dt(초) 만큼 시간 경과 → 골드 적립 (정수 단위로 누적) */
  update(dt: number): void {
    this.carry += this.rate * dt;
    const whole = Math.floor(this.carry);
    if (whole > 0) {
      this.gold += whole;
      this.carry -= whole;
    }
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

  add(amount: number): void {
    this.gold += amount;
  }
}
