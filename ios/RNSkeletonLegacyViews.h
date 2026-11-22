// Old architecture container views. On the New Architecture the Fabric
// component views in RNSkeletonComponentViews.mm are used instead.
#import <React/RCTView.h>
#import "RNSkeletonAnimator.h"

NS_ASSUME_NONNULL_BEGIN

@interface RNSkeletonGroupView : RCTView <RNSkeletonGroupHost>
@end

@interface RNSkeletonShimmerView : RCTView <RNSkeletonMember>
@property (nonatomic, readonly) RNSkeletonAnimator *animator;
@property (nonatomic, strong, nullable) UIColor *highlightColor;
@property (nonatomic, assign) NSInteger duration;
@property (nonatomic, copy, nullable) NSString *direction;
@property (nonatomic, assign) CGFloat angle;
@property (nonatomic, copy, nullable) NSString *variant;
@property (nonatomic, assign) BOOL animated;
@property (nonatomic, copy, nullable) NSString *reduceMotion;
@end

NS_ASSUME_NONNULL_END
