package com.skeletonnative;

import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.graphics.drawable.Drawable;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewParent;
import android.view.ViewTreeObserver;
import androidx.annotation.Nullable;

/**
 * Draws the moving highlight for one host view and decides when it runs.
 *
 * <p>The highlight is an {@link AnimatedVectorDrawable}: a repeating gradient
 * pattern (three periods wide) inside a group whose {@code translateX} is
 * animated by one period per cycle. On API 25+ with hardware rendering the
 * animation is evaluated on RenderThread, so it keeps moving while the UI
 * thread is blocked. On API 24 the same drawable animates on the UI thread.
 *
 * <p>Synchronisation: an AVD cannot be started at a given phase, so the phase
 * is applied in space instead. When the animation starts at {@code t0}, the
 * drawable is offset by {@code ((t0 - epoch) / period) * P} pixels, where
 * {@code P} is the pattern period. Because the pattern repeats every
 * {@code P}, this puts the band exactly where an animation started at the
 * epoch would have it. All views drawn in a group's coordinate space with the
 * group's epoch therefore show one band sweeping across the group.
 */
final class SkeletonPainter implements SkeletonMotion.Listener {
  static final int MODE_STATIC = 0;
  static final int MODE_SHIMMER = 1;
  static final int MODE_PULSE = 2;
  static final int MODE_GENTLE_PULSE = 3;

  /** Light and dark defaults; keep in sync with DEFAULT_COLORS in src/props.ts. */
  static final int LIGHT_BASE = 0xFFE1E4E8;
  static final int LIGHT_HIGHLIGHT = 0xFFF5F7F9;
  static final int DARK_BASE = 0xFF2B2E33;
  static final int DARK_HIGHLIGHT = 0xFF3D4148;

  /** Pattern period relative to the width of the swept area: 1/3 of each cycle has no band in view. */
  private static final float SHIMMER_PERIOD_FACTOR = 1.5f;
  /** For pulse, the triangle wave is so wide that the whole area sees one alpha. */
  private static final float PULSE_PERIOD_FACTOR = 100f;
  private static final float GENTLE_ALPHA = 0.4f;

  private final android.view.ViewGroup host;
  private final Rect visibleRect = new Rect();

  @Nullable private Integer baseColor;
  @Nullable private Integer highlightColor;
  private int durationMs = 1400;
  private boolean rtl;
  private float angle = 20f;
  private String variant = "shimmer";
  private boolean animated = true;
  private String reduceMotion = "system";

  @Nullable private AnimatedVectorDrawable avd;
  private int avdKey = -1;
  private int mode = -1;
  private boolean running;
  private float phaseFraction;
  private boolean dirty = true;

  private final SkeletonHighlightView highlight;
  private final android.view.ViewGroup hostGroup;

  private boolean attached;
  private boolean aggregatedVisible = true;
  private boolean onScreen = true;
  @Nullable private ViewTreeObserver observer;

  private final ViewTreeObserver.OnScrollChangedListener scrollListener =
      new ViewTreeObserver.OnScrollChangedListener() {
        @Override
        public void onScrollChanged() {
          checkOnScreen();
        }
      };

  // Runs on every UI-thread traversal (not on RenderThread-only animation
  // frames). React Native moves and resizes views outside a layout pass, so a
  // global-layout listener would miss changes to the group's size.
  private final ViewTreeObserver.OnPreDrawListener preDrawListener =
      new ViewTreeObserver.OnPreDrawListener() {
        @Override
        public boolean onPreDraw() {
          checkOnScreen();
          layoutHighlight();
          return true;
        }
      };

  SkeletonPainter(android.view.ViewGroup host) {
    this.host = host;
    this.hostGroup = host;
    highlight = new SkeletonHighlightView(host.getContext());
    highlight.layout(0, 0, SkeletonHighlightView.WIDTH_PX, SkeletonHighlightView.HEIGHT_PX);
    highlight.setVisibility(View.INVISIBLE);
    host.getOverlay().add(highlight);
  }

  /** The overlay child that draws the highlight (for SRC_ATOP layers in <Shimmer>). */
  SkeletonHighlightView highlightView() {
    return highlight;
  }

  // ---- props ---------------------------------------------------------------

  void setBaseColor(@Nullable Integer color) {
    baseColor = color;
    host.invalidate();
  }

  void setHighlightColor(@Nullable Integer color) {
    highlightColor = color;
    applyTint();
    host.invalidate();
  }

  void setDuration(int ms) {
    durationMs = ms > 0 ? ms : 1400;
    dirty = true;
  }

  void setDirection(@Nullable String direction) {
    rtl = "rtl".equals(direction);
    dirty = true;
  }

  void setAngle(float degrees) {
    angle = Float.isNaN(degrees) ? 20f : Math.max(-45f, Math.min(45f, degrees));
    dirty = true;
  }

  void setVariant(@Nullable String value) {
    variant = value == null ? "shimmer" : value;
    dirty = true;
  }

  void setAnimated(boolean value) {
    animated = value;
    dirty = true;
  }

  void setReduceMotion(@Nullable String value) {
    reduceMotion = value == null ? "system" : value;
    dirty = true;
  }

  // ---- colours ---------------------------------------------------------------

  private boolean isNight() {
    int night = host.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
    return night == Configuration.UI_MODE_NIGHT_YES;
  }

  int resolvedBaseColor() {
    if (baseColor != null) return baseColor;
    return isNight() ? DARK_BASE : LIGHT_BASE;
  }

  int resolvedHighlightColor() {
    int color = highlightColor != null ? highlightColor : (isNight() ? DARK_HIGHLIGHT : LIGHT_HIGHLIGHT);
    if (mode == MODE_GENTLE_PULSE) {
      color = Color.argb(Math.round(Color.alpha(color) * GENTLE_ALPHA), Color.red(color), Color.green(color), Color.blue(color));
    }
    return color;
  }

  void onConfigurationChanged() {
    applyTint();
    host.invalidate();
  }

  private void applyTint() {
    if (avd == null) return;
    avd.setTintList(ColorStateList.valueOf(resolvedHighlightColor()));
    avd.setTintMode(PorterDuff.Mode.SRC_IN);
  }

  // ---- mode and drawable ------------------------------------------------------

  int computeMode() {
    if (!animated || "none".equals(variant)) return MODE_STATIC;
    if ("never".equals(reduceMotion)) {
      // Even when asked to ignore the setting, nothing can animate with animators off.
      return SkeletonMotion.animatorsEnabled(host.getContext()) ? variantMode() : MODE_STATIC;
    }
    if (!SkeletonMotion.animatorsEnabled(host.getContext())) return MODE_STATIC;
    if ("always".equals(reduceMotion)) return MODE_GENTLE_PULSE;
    return variantMode();
  }

  private int variantMode() {
    return "pulse".equals(variant) ? MODE_PULSE : MODE_SHIMMER;
  }

  int mode() {
    if (mode < 0) mode = computeMode();
    return mode;
  }

  /** Apply the props set since the last call; called once per prop update batch. */
  void commit() {
    if (dirty) refresh();
  }

  /** Re-evaluate the mode and the drawable after a prop or setting change. */
  void refresh() {
    dirty = false;
    int newMode = computeMode();
    boolean pulse = newMode == MODE_PULSE || newMode == MODE_GENTLE_PULSE;
    int key = newMode == MODE_STATIC ? -1 : SkeletonResources.drawable(pulse, effectiveDurationMsFor(newMode));
    if (newMode != mode || key != avdKey) {
      stop();
      if (avd != null) {
        highlight.setDrawable(null);
        avd = null;
      }

      mode = newMode;
      avdKey = key;
      if (key != -1) {
        Drawable d = host.getContext().getDrawable(key);
        if (d instanceof AnimatedVectorDrawable) {
          avd = (AnimatedVectorDrawable) d.mutate();
          highlight.setDrawable(avd);
          applyTint();
        } else {
          mode = MODE_STATIC;
        }
      }
    } else {
      applyTint();
    }
    updateRunning();
    layoutHighlight();
    host.invalidate();
  }

  private int effectiveDurationMsFor(int m) {
    return m == MODE_GENTLE_PULSE ? durationMs * 2 : durationMs;
  }

  boolean isAnimating() {
    return mode() != MODE_STATIC;
  }

  // ---- lifecycle --------------------------------------------------------------

  void onAttached() {
    attached = true;
    observer = host.getViewTreeObserver();
    observer.addOnScrollChangedListener(scrollListener);
    observer.addOnPreDrawListener(preDrawListener);
    SkeletonMotion.addListener(host.getContext(), this);
    // The setting may have changed while detached.
    refresh();
  }

  void onDetached() {
    attached = false;
    if (observer != null && observer.isAlive()) {
      observer.removeOnScrollChangedListener(scrollListener);
      observer.removeOnPreDrawListener(preDrawListener);
    }
    observer = null;
    SkeletonMotion.removeListener(this);
    updateRunning();
  }

  void onVisibilityAggregated(boolean visible) {
    aggregatedVisible = visible;
    updateRunning();
  }

  void onSizeChanged() {
    checkOnScreen();
    layoutHighlight();
  }

  @Override
  public void onMotionSettingsChanged() {
    // A different duration scale changes the real period, so restart from the epoch.
    stop();
    refresh();
  }

  private void checkOnScreen() {
    boolean now = host.getWidth() > 0 && host.getHeight() > 0 && host.getGlobalVisibleRect(visibleRect);
    if (now != onScreen) {
      onScreen = now;
      updateRunning();
    }
  }

  private void updateRunning() {
    boolean shouldRun = avd != null && mode != MODE_STATIC && attached && aggregatedVisible && onScreen;
    if (shouldRun && !running) {
      long epoch = epochMs();
      float scale = SkeletonMotion.durationScale(host.getContext());
      float periodMs = SkeletonResources.quantize(effectiveDurationMsFor(mode)) * (scale > 0 ? scale : 1f);
      long now = SystemClock.uptimeMillis();
      double cycles = (now - epoch) / (double) periodMs;
      phaseFraction = (float) (cycles - Math.floor(cycles));
      avd.start();
      running = true;
      layoutHighlight();
    } else if (!shouldRun && running) {
      stop();
    }
  }

  private void stop() {
    if (running && avd != null) avd.stop();
    running = false;
  }

  // ---- geometry and drawing ---------------------------------------------------

  static final class Geometry {
    float ox;
    float oy;
    int gw;
    int gh;
    @Nullable SkeletonGroupView group;
  }

  private final Geometry geometry = new Geometry();

  /** Offset of the host inside its group (or itself) and the size of the swept area. */
  Geometry geometry(int w, int h) {
    Geometry g = geometry;
    g.group = null;
    float x = 0;
    float y = 0;
    View v = host;
    ViewParent p = v.getParent();
    while (p instanceof View) {
      View pv = (View) p;
      x += v.getLeft() + v.getTranslationX();
      y += v.getTop() + v.getTranslationY();
      if (pv instanceof SkeletonGroupView) {
        g.group = (SkeletonGroupView) pv;
        break;
      }
      x -= pv.getScrollX();
      y -= pv.getScrollY();
      v = pv;
      p = pv.getParent();
    }
    if (g.group != null) {
      g.ox = x;
      g.oy = y;
      g.gw = Math.max(g.group.getWidth(), 1);
      g.gh = Math.max(g.group.getHeight(), 1);
    } else {
      g.ox = 0;
      g.oy = 0;
      g.gw = Math.max(w, 1);
      g.gh = Math.max(h, 1);
    }
    return g;
  }

  private long epochMs() {
    Geometry g = geometry(host.getWidth(), host.getHeight());
    return g.group != null ? g.group.epochMs : SkeletonEpoch.GLOBAL_MS;
  }

  /**
   * Positions the highlight view. In the mirrored, unskewed group space u the
   * pattern repeats every {@code period}; the drawable's left edge sits at
   * {@code left} there. A drawable point (x, y) in the 300 x 2 px view must
   * land at host x = s * (left + tan * (oy - gh / 2) + k * x + tan * (h / 2) * y) + c - ox,
   * host y = (h / 2) * y, where k = period / 100, s = -1 for rtl (c = gw) and
   * s = 1 otherwise (c = 0). View scale/translation give the linear part and
   * a canvas skew inside the view gives the y-dependent shift. Setters are
   * no-ops when values do not change, so this never causes a redraw loop.
   */
  void layoutHighlight() {
    int w = host.getWidth();
    int h = host.getHeight();
    if (avd == null || mode == MODE_STATIC || w <= 0 || h <= 0) {
      highlight.setVisibility(View.INVISIBLE);
      return;
    }
    Geometry g = geometry(w, h);
    boolean pulse = mode == MODE_PULSE || mode == MODE_GENTLE_PULSE;
    float tan = pulse ? 0f : (float) Math.tan(Math.toRadians(angle));
    float period = pulse
        ? PULSE_PERIOD_FACTOR * g.gw
        : Math.max(1f, Math.max(SHIMMER_PERIOD_FACTOR * g.gw, SHIMMER_PERIOD_FACTOR * Math.abs(tan) * g.gh));
    float oxm = rtl ? g.gw - g.ox - w : g.ox;
    // Left edge congruent to the phase shift (mod period), 0.5-1.5 periods left of the host.
    float shift = phaseFraction * period;
    double kp = Math.ceil((oxm - 1.5f * period - shift) / period);
    float left = (float) (shift + kp * period);

    float k = period / SkeletonHighlightView.PERIOD_PX;
    float sy = h / (float) SkeletonHighlightView.HEIGHT_PX;
    float s = rtl ? -1f : 1f;
    float c = rtl ? g.gw : 0f;
    highlight.setScaleX(s * k);
    highlight.setScaleY(sy);
    highlight.setTranslationX(s * (left + tan * (g.oy - g.gh / 2f)) + c - g.ox);
    highlight.setTranslationY(0f);
    highlight.setSkewX(tan * sy / k);
    highlight.setVisibility(View.VISIBLE);
  }
}
