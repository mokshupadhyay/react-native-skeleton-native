package com.skeletonnative;

import androidx.annotation.Nullable;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ViewManagerDelegate;
import com.facebook.react.viewmanagers.SkeletonNativeViewManagerDelegate;
import com.facebook.react.viewmanagers.SkeletonNativeViewManagerInterface;

/** New Architecture: props arrive through the codegen delegate. */
public abstract class SkeletonViewManagerSpec<T extends SkeletonView> extends SimpleViewManager<T>
    implements SkeletonNativeViewManagerInterface<T> {
  private final ViewManagerDelegate<T> delegate = new SkeletonNativeViewManagerDelegate<>(this);

  @Nullable
  @Override
  protected ViewManagerDelegate<T> getDelegate() {
    return delegate;
  }
}
