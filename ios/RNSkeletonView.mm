#import "RNSkeletonView.h"

@implementation RNSkeletonView

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _animator = [[RNSkeletonAnimator alloc] initWithHost:self overlay:NO];
    _duration = 1400;
    _angle = 20;
    _animated = YES;
    self.layer.masksToBounds = YES;
    self.userInteractionEnabled = NO;
    [self applyBaseColor];
  }
  return self;
}

- (void)applyBaseColor
{
  UIColor *color = _baseColor ?: RNSkeletonDefaultBaseColor();
  if (@available(iOS 13.0, *)) {
    color = [color resolvedColorWithTraitCollection:self.traitCollection];
  }
  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  self.layer.backgroundColor = color.CGColor;
  CGFloat maxRadius = MIN(self.bounds.size.width, self.bounds.size.height) / 2;
  self.layer.cornerRadius = MAX(0, MIN(_cornerRadius, maxRadius));
  [CATransaction commit];
}

- (void)commitProps
{
  _animator.highlightColor = _highlightColor;
  _animator.durationMs = _duration;
  _animator.rtl = [_direction isEqualToString:@"rtl"];
  _animator.angle = MAX(-45, MIN(45, _angle));
  _animator.variant = RNSkeletonVariantFromString(_variant);
  _animator.animated = _animated;
  _animator.reduceMotion = RNSkeletonReduceMotionFromString(_reduceMotion);
  [self applyBaseColor];
  [_animator update];
}

// Old architecture: called once after each batch of prop updates.
- (void)didSetProps:(NSArray<NSString *> *)changedProps
{
  [self commitProps];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  [self applyBaseColor];
  [_animator hostDidLayout];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];
  [_animator hostDidMoveToWindow];
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousTraitCollection
{
  [super traitCollectionDidChange:previousTraitCollection];
  [self applyBaseColor];
  [_animator hostTraitsDidChange];
}

- (void)skeletonGroupDidLayout
{
  [_animator hostDidLayout];
}

@end
