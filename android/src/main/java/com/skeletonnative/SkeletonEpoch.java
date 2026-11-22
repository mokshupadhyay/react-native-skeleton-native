package com.skeletonnative;

import android.os.SystemClock;

/** The time every skeleton outside a group measures its phase from. */
final class SkeletonEpoch {
  static final long GLOBAL_MS = SystemClock.uptimeMillis();

  private SkeletonEpoch() {}
}
