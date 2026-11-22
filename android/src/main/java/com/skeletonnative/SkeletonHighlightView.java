package com.skeletonnative;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * A tiny view (three periods of {@link #PERIOD_PX} px, {@link #HEIGHT_PX} px
 * tall) that draws the AnimatedVectorDrawable. Its scale properties stretch
 * it to the real size. RenderThread re-rasterizes an animating
 * VectorDrawable into a bitmap on every frame at the size given by its bounds
 * and the scale of the canvas it was recorded into; View scale properties are
 * applied later, by the RenderNode, so the bitmap stays 300 x 2 px however
 * big the skeleton is. It lives in the host's ViewGroupOverlay.
 */
@SuppressLint("ViewConstructor")
final class SkeletonHighlightView extends View {
  static final int PERIOD_PX = 100;
  static final int WIDTH_PX = 3 * PERIOD_PX;
  static final int HEIGHT_PX = 2;

  @Nullable private AnimatedVectorDrawable avd;
  private float skewX;

  SkeletonHighlightView(Context context) {
    super(context);
    setPivotX(0f);
    setPivotY(0f);
    setWillNotDraw(false);
    setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);
  }

  void setDrawable(@Nullable AnimatedVectorDrawable drawable) {
    if (avd != null) avd.setCallback(null);
    avd = drawable;
    if (avd != null) {
      avd.setCallback(this);
      avd.setBounds(0, 0, WIDTH_PX, HEIGHT_PX);
    }
    invalidate();
  }

  void setSkewX(float value) {
    if (value != skewX) {
      skewX = value;
      invalidate();
    }
  }

  @Override
  protected void onDraw(@NonNull Canvas canvas) {
    if (avd == null) return;
    if (skewX != 0f) canvas.skew(skewX, 0f);
    avd.draw(canvas);
  }

  @Override
  protected boolean verifyDrawable(@NonNull Drawable who) {
    return who == avd || super.verifyDrawable(who);
  }
}
