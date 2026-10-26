package com.moduseries.linedefense;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false); // 화면 끝까지 그림
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // 가로 화면에서 카메라 구멍(노치) 쪽까지 사용
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
        // 플러그인·웹뷰 준비가 끝난 뒤 한 번 더(시작 직후 다시 나타나는 경우 대비)
        getWindow().getDecorView().postDelayed(this::hideSystemBars, 600);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars(); // 알림창 등에서 돌아왔을 때 다시 숨김
    }

    /** 몰입 모드 — 상태바·내비게이션바 숨김(가장자리 스와이프로 잠깐 표시) */
    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
