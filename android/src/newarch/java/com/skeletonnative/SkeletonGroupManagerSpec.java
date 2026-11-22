package com.skeletonnative;

import androidx.annotation.Nullable;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.SkeletonNativeGroupManagerDelegate;
import com.facebook.react.viewmanagers.SkeletonNativeGroupManagerInterface;

/** New Architecture: props arrive through the codegen delegate. */
public abstract class SkeletonGroupManagerSpec<T extends SkeletonGroupView> extends ViewGroupManager<T>
    implements SkeletonNativeGroupManagerInterface<T> {
  private final ViewManagerDelegate<T> delegate = new SkeletonNativeGroupManagerDelegate<>(this);

  @Nullable
  @Override
  protected ViewManagerDelegate<T> getDelegate() {
    return delegate;
  }
}
