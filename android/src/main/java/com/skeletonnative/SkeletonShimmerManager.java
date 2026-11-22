package com.skeletonnative;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@ReactModule(name = SkeletonShimmerManager.NAME)
public class SkeletonShimmerManager extends SkeletonShimmerManagerSpec<SkeletonShimmerView> {
  public static final String NAME = "SkeletonNativeShimmer";

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  protected SkeletonShimmerView createViewInstance(@NonNull ThemedReactContext context) {
    return new SkeletonShimmerView(context);
  }

  @Override
  protected void onAfterUpdateTransaction(@NonNull SkeletonShimmerView view) {
    super.onAfterUpdateTransaction(view);
    view.painter.commit();
  }

  @Override
  @ReactProp(name = "highlightColor", customType = "Color")
  public void setHighlightColor(SkeletonShimmerView view, @Nullable Integer value) {
    view.painter.setHighlightColor(value);
  }

  @Override
  @ReactProp(name = "duration", defaultInt = 1400)
  public void setDuration(SkeletonShimmerView view, int value) {
    view.painter.setDuration(value);
  }

  @Override
  @ReactProp(name = "direction")
  public void setDirection(SkeletonShimmerView view, @Nullable String value) {
    view.painter.setDirection(value);
  }

  @Override
  @ReactProp(name = "angle", defaultFloat = 20f)
  public void setAngle(SkeletonShimmerView view, float value) {
    view.painter.setAngle(value);
  }

  @Override
  @ReactProp(name = "variant")
  public void setVariant(SkeletonShimmerView view, @Nullable String value) {
    view.painter.setVariant(value);
  }

  @Override
  @ReactProp(name = "animated", defaultBoolean = true)
  public void setAnimated(SkeletonShimmerView view, boolean value) {
    view.painter.setAnimated(value);
  }

  @Override
  @ReactProp(name = "reduceMotion")
  public void setReduceMotion(SkeletonShimmerView view, @Nullable String value) {
    view.painter.setReduceMotion(value);
  }
}
