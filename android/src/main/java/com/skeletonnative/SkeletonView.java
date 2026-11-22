package com.skeletonnative;

import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.Outline;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import androidx.annotation.NonNull;

/**
 * One placeholder block: the base colour, clipped to a rounded rect, with the
 * highlight on top. A ViewGroup only so that it has a ViewGroupOverlay for
 * the highlight view; it never has React children.
 */
public class SkeletonView extends ViewGroup {
  final SkeletonPainter painter = new SkeletonPainter(this);
  private float cornerRadiusPx;

  public SkeletonView(Context context) {
    super(context);
    setWillNotDraw(false);
    // The outline clip is antialiased and applied by RenderThread.
    setOutlineProvider(new ViewOutlineProvider() {
      @Override
      public void getOutline(View view, Outline outline) {
        float r = Math.min(cornerRadiusPx, Math.min(view.getWidth(), view.getHeight()) / 2f);
        outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), r);
      }
    });
    setClipToOutline(true);
  }

  void setCornerRadius(float dp) {
    cornerRadiusPx = Math.max(0f, dp) * getResources().getDisplayMetrics().density;
    invalidateOutline();
  }

  @Override
  protected void onDraw(@NonNull Canvas canvas) {
    canvas.drawColor(painter.resolvedBaseColor());
    // The highlight is drawn by a child view in this view's overlay.
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // No children: React Native lays this view out; the overlay has its own layout.
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    painter.onAttached();
  }

  @Override
  protected void onDetachedFromWindow() {
    painter.onDetached();
    super.onDetachedFromWindow();
  }

  @Override
  public void onVisibilityAggregated(boolean isVisible) {
    super.onVisibilityAggregated(isVisible);
    painter.onVisibilityAggregated(isVisible);
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    super.onSizeChanged(w, h, oldw, oldh);
    invalidateOutline();
    painter.onSizeChanged();
  }

  @Override
  protected void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    painter.onConfigurationChanged();
  }
}
