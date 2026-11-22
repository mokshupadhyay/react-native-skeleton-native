#import <UIKit/UIKit.h>
#import "RNSkeletonAnimator.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * One placeholder block: base colour, corner radius and the highlight layers.
 * The old architecture uses it directly; on Fabric it is the content view of
 * RNSkeletonNativeComponentView.
 */
@interface RNSkeletonView : UIView <RNSkeletonMember>

@property (nonatomic, readonly) RNSkeletonAnimator *animator;
@property (nonatomic, strong, nullable) UIColor *baseColor;
@property (nonatomic, strong, nullable) UIColor *highlightColor;
@property (nonatomic, assign) NSInteger duration;
@property (nonatomic, copy, nullable) NSString *direction;
@property (nonatomic, assign) CGFloat angle;
@property (nonatomic, copy, nullable) NSString *variant;
@property (nonatomic, assign) BOOL animated;
@property (nonatomic, copy, nullable) NSString *reduceMotion;
@property (nonatomic, assign) CGFloat cornerRadius;

/** Apply the props set since the last call. */
- (void)commitProps;

@end

NS_ASSUME_NONNULL_END
