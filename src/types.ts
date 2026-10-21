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
  // 👾 변종(데이터: enemies.json) — 전용 그림이 없으면 look 그림을 tint 색·scale 크기로
  look?: string;
  tint?: string; // 곱하기 색(밝은 그림용)
  hue?: number; // 색상 회전(도) — 색 있는 그림을 다른 색으로
  scale?: number;
  variantOf?: string; // 이 적 대신 나옴
  minStage?: number; // 몇 관문부터
  chance?: number; // 확률
  ability?: 'explode' | 'heal' | 'rage' | 'summon' | 'split' | 'lifesteal';
  power?: number; // 💥 폭발 피해
  summon?: string; // 📣 소환할 적
  every?: number; // 소환 간격(초)
  split?: string; // 🟢 쓰러지면 나뉠 적
  count?: number;
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
