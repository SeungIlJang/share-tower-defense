import Phaser from 'phaser';
import { Fighter } from './Fighter';

/** 아군 유닛 (플레이어가 에너지로 소환) */
export class Unit extends Fighter {
  pop = 0; // 인구(식량) 점유
  constructor(scene: Phaser.Scene) {
    super(scene, 0x4a9eff);
  }
}
