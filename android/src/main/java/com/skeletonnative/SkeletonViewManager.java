package com.skeletonnative;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * View manager for SkeletonNativeView. The spec base class differs per
 * architecture (src/newarch adds the codegen interface and delegate); the
 * {@code @ReactProp} setters serve the old architecture.
 */
@ReactModule(name = SkeletonViewManager.NAME)
public class SkeletonViewManager extends SkeletonViewManagerSpec<SkeletonView> {
  public static final String NAME = "SkeletonNativeView";

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  protected SkeletonView createViewInstance(@NonNull ThemedReactContext context) {
    return new SkeletonView(context);
  }

  @Override
  protected void onAfterUpdateTransaction(@NonNull SkeletonView view) {
    super.onAfterUpdateTransaction(view);
    view.painter.commit();
  }

  @Override
  @ReactProp(name = "baseColor", customType = "Color")
  public void setBaseColor(SkeletonView view, @Nullable Integer value) {
    view.painter.setBaseColor(value);
  }

  @Override
  @ReactProp(name = "highlightColor", customType = "Color")
  public void setHighlightColor(SkeletonView view, @Nullable Integer value) {
    view.painter.setHighlightColor(value);
  }

  @Override
  @ReactProp(name = "duration", defaultInt = 1400)
  public void setDuration(SkeletonView view, int value) {
    view.painter.setDuration(value);
  }

  @Override
  @ReactProp(name = "direction")
  public void setDirection(SkeletonView view, @Nullable String value) {
    view.painter.setDirection(value);
  }

  @Override
  @ReactProp(name = "angle", defaultFloat = 20f)
  public void setAngle(SkeletonView view, float value) {
    view.painter.setAngle(value);
  }

  @Override
  @ReactProp(name = "variant")
  public void setVariant(SkeletonView view, @Nullable String value) {
    view.painter.setVariant(value);
  }

  @Override
  @ReactProp(name = "animated", defaultBoolean = true)
  public void setAnimated(SkeletonView view, boolean value) {
    view.painter.setAnimated(value);
  }

  @Override
  @ReactProp(name = "reduceMotion")
  public void setReduceMotion(SkeletonView view, @Nullable String value) {
    view.painter.setReduceMotion(value);
  }

  @Override
  @ReactProp(name = "cornerRadius", defaultFloat = 0f)
  public void setCornerRadius(SkeletonView view, float value) {
    view.setCornerRadius(value);
  }
}
