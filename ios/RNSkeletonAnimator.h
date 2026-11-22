#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/** Implemented by the group views (both architectures). */
@protocol RNSkeletonGroupHost <NSObject>
/** CACurrentMediaTime() when the group was created; every member's animation begins at it. */
@property (nonatomic, readonly) CFTimeInterval skeletonEpoch;
- (void)skeletonAddMember:(UIView *)member;
- (void)skeletonRemoveMember:(UIView *)member;
@end

/** Implemented by views that own an animator, so a group can ask them to re-layout. */
@protocol RNSkeletonMember <NSObject>
- (void)skeletonGroupDidLayout;
@end

typedef NS_ENUM(NSInteger, RNSkeletonVariant) {
  RNSkeletonVariantShimmer = 0,
  RNSkeletonVariantPulse = 1,
  RNSkeletonVariantNone = 2,
};

typedef NS_ENUM(NSInteger, RNSkeletonReduceMotion) {
  RNSkeletonReduceMotionSystem = 0,
  RNSkeletonReduceMotionAlways = 1,
  RNSkeletonReduceMotionNever = 2,
};

/** Default colours; keep in sync with DEFAULT_COLORS in src/props.ts. */
UIColor *RNSkeletonDefaultBaseColor(void);
UIColor *RNSkeletonDefaultHighlightColor(void);
RNSkeletonVariant RNSkeletonVariantFromString(NSString *_Nullable value);
RNSkeletonReduceMotion RNSkeletonReduceMotionFromString(NSString *_Nullable value);

/**
 * Owns the highlight layers of one host view and their Core Animation
 * animations. The animations are CABasicAnimations with repeatCount
 * HUGE_VALF whose beginTime is the shared epoch, so they are evaluated by the
 * render server and keep running while the main thread is blocked, and every
 * view with the same epoch is in phase.
 *
 * In overlay mode (used by <Shimmer>) the highlight sits in a layer above the
 * host's subviews (zPosition), masked by a snapshot of the host's content.
 */
@interface RNSkeletonAnimator : NSObject

- (instancetype)initWithHost:(UIView *)host overlay:(BOOL)overlay NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

@property (nonatomic, strong, nullable) UIColor *highlightColor;
@property (nonatomic, assign) NSInteger durationMs;
@property (nonatomic, assign) BOOL rtl;
@property (nonatomic, assign) CGFloat angle;
@property (nonatomic, assign) RNSkeletonVariant variant;
@property (nonatomic, assign) BOOL animated;
@property (nonatomic, assign) RNSkeletonReduceMotion reduceMotion;

/** Rebuild geometry and animations after props changed. */
- (void)update;
/** Call from the host's layoutSubviews. */
- (void)hostDidLayout;
/** Call from the host's didMoveToWindow. */
- (void)hostDidMoveToWindow;
/** Call from the host's traitCollectionDidChange:. */
- (void)hostTraitsDidChange;
/** Overlay mode: take a new snapshot of the content for the mask. */
- (void)setNeedsSnapshot;
/** Whether an animation is currently attached (for tests and debugging). */
@property (nonatomic, readonly) BOOL isAnimating;

@end

NS_ASSUME_NONNULL_END
