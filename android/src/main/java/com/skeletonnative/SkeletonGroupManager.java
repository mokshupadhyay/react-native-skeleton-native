package com.skeletonnative;

import androidx.annotation.NonNull;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.uimanager.ThemedReactContext;

@ReactModule(name = SkeletonGroupManager.NAME)
public class SkeletonGroupManager extends SkeletonGroupManagerSpec<SkeletonGroupView> {
  public static final String NAME = "SkeletonNativeGroup";

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @NonNull
  @Override
  protected SkeletonGroupView createViewInstance(@NonNull ThemedReactContext context) {
    return new SkeletonGroupView(context);
  }
}
