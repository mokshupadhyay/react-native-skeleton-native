package com.skeletonexamplehelpers;

import android.os.SystemClock;
import android.util.Log;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;

public class BusyModule extends ReactContextBaseJavaModule {
  BusyModule(ReactApplicationContext context) {
    super(context);
  }

  @NonNull
  @Override
  public String getName() {
    return "SkeletonExampleBusy";
  }

  @ReactMethod
  public void blockMainThread(final double ms) {
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        Log.i("SkeletonExample", "MAIN_BLOCK_START");
        long end = SystemClock.uptimeMillis() + (long) ms;
        while (SystemClock.uptimeMillis() < end) {
          // busy
        }
        Log.i("SkeletonExample", "MAIN_BLOCK_END");
      }
    });
  }
}
