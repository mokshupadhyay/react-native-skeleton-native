#import "RNSkeletonLegacyViews.h"
#import "RNSkeletonGroupRegistry.h"

@implementation RNSkeletonGroupView {
  RNSkeletonGroupRegistry *_registry;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _registry = [RNSkeletonGroupRegistry new];
  }
  return self;
}

- (CFTimeInterval)skeletonEpoch
{
  return _registry.epoch;
}

- (void)skeletonAddMember:(UIView *)member
{
  [_registry add:member];
}

- (void)skeletonRemoveMember:(UIView *)member
{
  [_registry remove:member];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [_registry groupDidLayout];
}

@end

@implementation RNSkeletonShimmerView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _animator = [[RNSkeletonAnimator alloc] initWithHost:self overlay:YES];
    _duration = 1400;
    _angle = 20;
    _animated = YES;
  }
  return self;
}

- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  _animator.highlightColor = _highlightColor;
  _animator.durationMs = _duration;
  _animator.rtl = [_direction isEqualToString:@"rtl"];
  _animator.angle = MAX(-45, MIN(45, _angle));
  _animator.variant = RNSkeletonVariantFromString(_variant);
  _animator.animated = _animated;
  _animator.reduceMotion = RNSkeletonReduceMotionFromString(_reduceMotion);
  [_animator update];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [_animator hostDidLayout];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [_animator hostDidMoveToWindow];
}

- (void)didAddSubview:(UIView *)subview
{
  [super didAddSubview:subview];
  [_animator setNeedsSnapshot];
}

- (void)willRemoveSubview:(UIView *)subview
{
  [super willRemoveSubview:subview];
  [_animator setNeedsSnapshot];
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
  [_animator hostTraitsDidChange];
}

- (void)skeletonGroupDidLayout
{
  [_animator hostDidLayout];
}

@end
