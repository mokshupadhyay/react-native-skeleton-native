package com.skeletonnative;

import com.facebook.react.uimanager.ViewGroupManager;

/** Old architecture: the group has no props of its own. */
public abstract class SkeletonGroupManagerSpec<T extends SkeletonGroupView> extends ViewGroupManager<T> {}
