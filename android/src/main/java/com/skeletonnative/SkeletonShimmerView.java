package com.skeletonnative;

import android.content.Context;
import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import androidx.annotation.NonNull;
import com.facebook.react.views.view.ReactViewGroup;

/**
 * Draws its children, then the highlight (a view in this view's overlay)
 * composited with SRC_ATOP, so the highlight only appears on pixels the
 * children drew. Both are inside an offscreen layer that RenderThread replays
 * on every animation frame, so the masking follows the children live.
 */
public class SkeletonShimmerView extends ReactViewGroup {
  final SkeletonPainter painter = new SkeletonPainter(this);
  private final Paint atop = new Paint();

  public SkeletonShimmerView(Context context) {
    super(context);
    atop.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_ATOP));
    // The highlight view composites onto the children with SRC_ATOP through its layer paint.
    painter.highlightView().setLayerType(LAYER_TYPE_HARDWARE, atop);
    setWillNotDraw(false);
  }

  @Override
  protected void dispatchDraw(@NonNull Canvas canvas) {
    int w = getWidth();
    int h = getHeight();
    if (!painter.isAnimating() || w <= 0 || h <= 0) {
      super.dispatchDraw(canvas);
      return;
    }
    // Children, then the overlay (the highlight), inside one offscreen layer so
    // that SRC_ATOP only sees the children's pixels.
    int layer = canvas.saveLayer(0, 0, w, h, null);
    super.dispatchDraw(canvas);
    canvas.restoreToCount(layer);
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
    painter.onSizeChanged();
  }

  @Override
  protected void onConfigurationChanged(Configuration newConfig) {
    super.onConfigurationChanged(newConfig);
    painter.onConfigurationChanged();
  }
}
