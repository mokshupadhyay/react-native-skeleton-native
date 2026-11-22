package com.skeletonnative;

import android.content.Context;
import android.os.SystemClock;
import com.facebook.react.views.view.ReactViewGroup;

/**
 * Container for a group of skeletons. It holds the animation epoch that every
 * skeleton and shimmer inside measures its phase from, and its size is the
 * space the highlight sweeps across. Skeletons find it by walking up their
 * parents, so it works on both architectures without any JS involvement.
 */
public class SkeletonGroupView extends ReactViewGroup {
  final long epochMs = SystemClock.uptimeMillis();

  public SkeletonGroupView(Context context) {
    super(context);
  }
}
