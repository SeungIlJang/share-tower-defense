import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moduseries.linedefense',
  appName: '모두의 타워디펜스',
  webDir: 'dist',
  // OTA: 앱은 아래 라이브 URL을 불러옴 → 게임 수정은 games 레포 푸시로 즉시 반영(재업로드 불필요)
  server: { url: 'https://seungiljang.github.io/games/linedefense/', androidScheme: 'https' },
  android: { backgroundColor: '#0d1018' },
  appendUserAgent: 'LDImmersive', // 전체화면(상태바 숨김) 빌드 표시 — 웹이 상태바 여백을 안 줌
  plugins: {
    // Capacitor 8 기본 SystemBars가 시작할 때 상태바·내비게이션바를 다시 보이게 함 → 숨김 고정, 여백(패딩)도 안 줌
    SystemBars: { hidden: true, insetsHandling: 'disable' },
  },
};

export default config;
