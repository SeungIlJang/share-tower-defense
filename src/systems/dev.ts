/**
 * 🛠️ 개발자 모드 — 시작 화면에서 성을 누르고 비밀번호 입력 시 진입.
 * 비밀번호는 코드에 그대로 두지 않고 SHA-256 해시만 비교(웹에 배포되므로 원문 노출 방지 — 완벽한 보안은 아님).
 * 전투 치트 설정은 이 기기에만 저장(localStorage).
 */

/** 비밀번호 SHA-256 해시 — 바꾸려면: node -e "console.log(require('crypto').createHash('sha256').update('새비번').digest('hex'))" */
export const DEV_PIN_HASH = '9e753e328997c742600c8c0e7d26a27e2338138645d8868049c18e3bc20e2dc9';
export const DEV_PIN_LEN = 6;

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 비밀번호 확인 */
export async function checkDevPin(pin: string): Promise<boolean> {
  try {
    return (await sha256Hex(pin)) === DEV_PIN_HASH;
  } catch {
    return false; // 보안 컨텍스트가 아니면(crypto.subtle 없음) 진입 불가
  }
}

/** ⚔️ 전투 치트 */
export interface DevFlags {
  godBase: boolean; // 🏰 우리 성 무적
  godHero: boolean; // 👑 영웅 무적
  infEnergy: boolean; // ⚡ 소환 에너지 무한
  infMana: boolean; // 💧 마나 무한
  oneHit: boolean; // 💥 아군 공격 한 방 처치
  noCooldown: boolean; // ⏱️ 소환·영웅 스킬 대기 없음 + 특수 무기 항상 충전
  battleButtons: boolean; // 🛠️ 전투 중 개발자 버튼(즉시 승리·레벨업·적 전멸)
}

export const DEV_FLAG_INFO: { key: keyof DevFlags; label: string }[] = [
  { key: 'godBase', label: '🏰 우리 성 무적' },
  { key: 'godHero', label: '👑 영웅 무적' },
  { key: 'infEnergy', label: '⚡ 소환 에너지 무한' },
  { key: 'infMana', label: '💧 마나 무한' },
  { key: 'oneHit', label: '💥 아군 공격 한 방 처치' },
  { key: 'noCooldown', label: '⏱️ 대기시간 없음(소환·스킬·특수 무기)' },
  { key: 'battleButtons', label: '🛠️ 전투 중 개발자 버튼(승리·레벨업·적 전멸)' },
];

const KEY = 'ld_dev_v1';
const EMPTY: DevFlags = { godBase: false, godHero: false, infEnergy: false, infMana: false, oneHit: false, noCooldown: false, battleButtons: false };

function load(): DevFlags {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DevFlags>) };
  } catch {
    return { ...EMPTY };
  }
}

export const devFlags: DevFlags = load();

export function setDevFlag(key: keyof DevFlags, on: boolean): void {
  devFlags[key] = on;
  try {
    localStorage.setItem(KEY, JSON.stringify(devFlags));
  } catch {
    /* 저장 실패는 무시 */
  }
}

export function clearDevFlags(): void {
  for (const k of Object.keys(EMPTY) as (keyof DevFlags)[]) setDevFlag(k, false);
}

/** 치트가 하나라도 켜졌나(전투 화면에 DEV 표시) */
export function anyDevFlag(): boolean {
  return Object.values(devFlags).some(Boolean);
}

/** 큰 숫자 보기 좋게 */
export function fmt(n: number): string {
  return Math.floor(n).toLocaleString('ko-KR');
}
