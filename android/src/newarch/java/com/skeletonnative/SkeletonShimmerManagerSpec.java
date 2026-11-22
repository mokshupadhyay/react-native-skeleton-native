package com.skeletonnative;

import androidx.annotation.Nullable;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.SkeletonNativeShimmerManagerDelegate;
import com.facebook.react.viewmanagers.SkeletonNativeShimmerManagerInterface;

/** New Architecture: props arrive through the codegen delegate. */
public abstract class SkeletonShimmerManagerSpec<T extends SkeletonShimmerView> extends ViewGroupManager<T>
    implements SkeletonNativeShimmerManagerInterface<T> {
  private final ViewManagerDelegate<T> delegate = new SkeletonNativeShimmerManagerDelegate<>(this);

  @Nullable
  @Override
  protected ViewManagerDelegate<T> getDelegate() {
    return delegate;
  }
}
