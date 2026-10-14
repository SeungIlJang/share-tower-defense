/** 전투 스탯 공통 타입 (유닛/적 공유) */
export interface CombatStats {
  name: string;
  hp: number;
  atk: number;
  def: number;
  atkSpeed: number; // 초당 공격 횟수
  range: number; // 공격 사거리(px)
  speed: number; // 이동 속도(px/s)
}

export interface UnitStats extends CombatStats {
  cost: number; // 소환 에너지 비용
  pop: number; // 인구(식량) 점유
}

export interface EnemyStats extends CombatStats {
  reward: number; // 처치 시 골드
}

export interface WaveEnemy {
  type: string;
  count: number;
  interval: number; // 소환 간격(초)
}

export interface Wave {
  at: number; // 스테이지 시작 후 발동 시각(초)
  enemies: WaveEnemy[];
}

export interface StageData {
  id: number;
  name: string;
  baseHp: number;
  startGold: number;
  goldRate: number; // 초당 골드
  world?: number; // 월드(1 관문의 숲, 2 모래 사막)
  enemyMult?: number; // 적 체력·공격 배율(월드 2부터)
  waves: Wave[];
}

export type Side = 'ally' | 'enemy';
