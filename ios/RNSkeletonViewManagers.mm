// Old architecture view managers. With the New Architecture, Fabric uses the
// component views in RNSkeletonComponentViews.mm for the same names.
#import <React/RCTViewManager.h>
#import "RNSkeletonLegacyViews.h"
#import "RNSkeletonView.h"

@interface RNSkeletonViewManager : RCTViewManager
@end

@implementation RNSkeletonViewManager

RCT_EXPORT_MODULE(SkeletonNativeView)

- (UIView *)view
{
  return [RNSkeletonView new];
}

RCT_EXPORT_VIEW_PROPERTY(baseColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(highlightColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(duration, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(direction, NSString)
RCT_EXPORT_VIEW_PROPERTY(angle, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(variant, NSString)
RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
RCT_EXPORT_VIEW_PROPERTY(reduceMotion, NSString)
RCT_EXPORT_VIEW_PROPERTY(cornerRadius, CGFloat)

@end

@interface RNSkeletonGroupManager : RCTViewManager
@end

@implementation RNSkeletonGroupManager

RCT_EXPORT_MODULE(SkeletonNativeGroup)

- (UIView *)view
{
  return [RNSkeletonGroupView new];
}

@end

@interface RNSkeletonShimmerManager : RCTViewManager
@end

@implementation RNSkeletonShimmerManager

RCT_EXPORT_MODULE(SkeletonNativeShimmer)

- (UIView *)view
{
  return [RNSkeletonShimmerView new];
}

RCT_EXPORT_VIEW_PROPERTY(highlightColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(duration, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(direction, NSString)
RCT_EXPORT_VIEW_PROPERTY(angle, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(variant, NSString)
RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
RCT_EXPORT_VIEW_PROPERTY(reduceMotion, NSString)

@end
