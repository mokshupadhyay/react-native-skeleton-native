package com.skeletonnative;

import android.content.ContentResolver;
import android.content.Context;
import android.database.ContentObserver;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Process-wide view of the system animation settings. Android has no separate
 * "reduce motion" flag for apps: the accessibility setting "Remove animations"
 * and the developer option both set {@code ANIMATOR_DURATION_SCALE} to 0, which
 * disables every animator, including AnimatedVectorDrawable. A ContentObserver
 * on that setting tells attached views when it changes.
 */
final class SkeletonMotion {
  interface Listener {
    void onMotionSettingsChanged();
  }

  private static final CopyOnWriteArrayList<Listener> LISTENERS = new CopyOnWriteArrayList<>();
  private static ContentObserver observer;

  private SkeletonMotion() {}

  /**
   * The setting itself is read rather than ValueAnimator.getDurationScale():
   * the app process learns about a change asynchronously, after the
   * ContentObserver has already fired, so ValueAnimator can lag by one change.
   */
  static float durationScale(Context context) {
    return settingsScale(context);
  }

  private static float settingsScale(Context context) {
    try {
      return Settings.Global.getFloat(context.getContentResolver(), Settings.Global.ANIMATOR_DURATION_SCALE, 1f);
    } catch (RuntimeException e) {
      return 1f;
    }
  }

  static boolean animatorsEnabled(Context context) {
    return settingsScale(context) != 0f;
  }

  static void addListener(Context context, Listener listener) {
    LISTENERS.addIfAbsent(listener);
    if (observer == null) {
      final ContentResolver resolver = context.getApplicationContext().getContentResolver();
      observer = new ContentObserver(new Handler(Looper.getMainLooper())) {
        @Override
        public void onChange(boolean selfChange) {
          // AnimatedVectorDrawable scales durations by ValueAnimator's copy of the
          // setting, which the process receives a little later; restart after it has.
          new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
              for (Listener l : LISTENERS) l.onMotionSettingsChanged();
            }
          }, 250);
        }
      };
      Uri uri = Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE);
      try {
        resolver.registerContentObserver(uri, false, observer);
      } catch (RuntimeException e) {
        observer = null;
      }
    }
  }

  static void removeListener(Listener listener) {
    LISTENERS.remove(listener);
  }
}
