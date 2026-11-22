package com.skeletonnative;

import androidx.annotation.Nullable;
import com.facebook.react.uimanager.SimpleViewManager;

/** Old architecture: props arrive through the {@code @ReactProp} setters. */
public abstract class SkeletonViewManagerSpec<T extends SkeletonView> extends SimpleViewManager<T> {
  public abstract void setBaseColor(T view, @Nullable Integer value);

  public abstract void setHighlightColor(T view, @Nullable Integer value);

  public abstract void setDuration(T view, int value);

  public abstract void setDirection(T view, @Nullable String value);

  public abstract void setAngle(T view, float value);

  public abstract void setVariant(T view, @Nullable String value);

  public abstract void setAnimated(T view, boolean value);

  public abstract void setReduceMotion(T view, @Nullable String value);

  public abstract void setCornerRadius(T view, float value);
}
