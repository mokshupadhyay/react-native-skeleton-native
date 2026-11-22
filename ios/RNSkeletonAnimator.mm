#import "RNSkeletonAnimator.h"

static NSString *const kShimmerKey = @"rnskeleton.shimmer";
static NSString *const kPulseKey = @"rnskeleton.pulse";

/** Pattern period relative to the swept width: one third of each cycle has no band in view. */
static const CGFloat kPeriodFactor = 1.5;
static const CGFloat kGentleOpacity = 0.35;
static const CGFloat kPulseOpacity = 1.0;
/** Above any React Native subview layer (they use zPosition 0 unless zIndex is set). */
static const CGFloat kOverlayZ = 10000;

typedef NS_ENUM(NSInteger, RNSkeletonMode) {
  RNSkeletonModeStatic,
  RNSkeletonModeShimmer,
  RNSkeletonModePulse,
  RNSkeletonModeGentlePulse,
};

static CFTimeInterval RNSkeletonGlobalEpoch(void)
{
  static CFTimeInterval epoch;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    epoch = CACurrentMediaTime();
  });
  return epoch;
}

static UIColor *RNSkeletonDynamic(UInt32 light, UInt32 dark)
{
  UIColor * (^make)(UInt32) = ^UIColor *(UInt32 rgb) {
    return [UIColor colorWithRed:((rgb >> 16) & 0xFF) / 255.0
                           green:((rgb >> 8) & 0xFF) / 255.0
                            blue:(rgb & 0xFF) / 255.0
                           alpha:1];
  };
  UIColor *lightColor = make(light);
  UIColor *darkColor = make(dark);
  if (@available(iOS 13.0, *)) {
    return [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *traits) {
      return traits.userInterfaceStyle == UIUserInterfaceStyleDark ? darkColor : lightColor;
    }];
  }
  return lightColor;
}

UIColor *RNSkeletonDefaultBaseColor(void)
{
  static UIColor *color;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    color = RNSkeletonDynamic(0xE1E4E8, 0x2B2E33);
  });
  return color;
}

UIColor *RNSkeletonDefaultHighlightColor(void)
{
  static UIColor *color;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    color = RNSkeletonDynamic(0xF5F7F9, 0x3D4148);
  });
  return color;
}

RNSkeletonVariant RNSkeletonVariantFromString(NSString *value)
{
  if ([value isEqualToString:@"pulse"]) return RNSkeletonVariantPulse;
  if ([value isEqualToString:@"none"]) return RNSkeletonVariantNone;
  return RNSkeletonVariantShimmer;
}

RNSkeletonReduceMotion RNSkeletonReduceMotionFromString(NSString *value)
{
  if ([value isEqualToString:@"always"]) return RNSkeletonReduceMotionAlways;
  if ([value isEqualToString:@"never"]) return RNSkeletonReduceMotionNever;
  return RNSkeletonReduceMotionSystem;
}

@implementation RNSkeletonAnimator {
  __weak UIView *_host;
  BOOL _overlay;
  CALayer *_container;
  CALayer *_transformLayer;
  CAGradientLayer *_gradient;
  CALayer *_pulse;
  CALayer *_mask;
  __weak UIView<RNSkeletonGroupHost> *_group;
  NSString *_animationKey;
  BOOL _inBackground;
  BOOL _snapshotScheduled;
}

- (instancetype)initWithHost:(UIView *)host overlay:(BOOL)overlay
{
  if (self = [super init]) {
    _host = host;
    _overlay = overlay;
    _durationMs = 1400;
    _angle = 20;
    _animated = YES;
    _variant = RNSkeletonVariantShimmer;
    _reduceMotion = RNSkeletonReduceMotionSystem;

    _container = [CALayer layer];
    _container.masksToBounds = YES;
    _container.hidden = YES;
    if (overlay) {
      _container.zPosition = kOverlayZ;
      _mask = [CALayer layer];
      _container.mask = _mask;
    }
    _transformLayer = [CALayer layer];
    _transformLayer.anchorPoint = CGPointZero;
    _transformLayer.position = CGPointZero;
    _transformLayer.bounds = CGRectZero;
    _gradient = [CAGradientLayer layer];
    _gradient.startPoint = CGPointMake(0, 0.5);
    _gradient.endPoint = CGPointMake(1, 0.5);
    [_transformLayer addSublayer:_gradient];
    _pulse = [CALayer layer];
    [_container addSublayer:_transformLayer];
    [_container addSublayer:_pulse];
    [host.layer addSublayer:_container];

    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    [center addObserver:self
               selector:@selector(reduceMotionChanged)
                   name:UIAccessibilityReduceMotionStatusDidChangeNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(didEnterBackground)
                   name:UIApplicationDidEnterBackgroundNotification
                 object:nil];
    [center addObserver:self
               selector:@selector(willEnterForeground)
                   name:UIApplicationWillEnterForegroundNotification
                 object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  UIView *host = _host;
  if (host) [_group skeletonRemoveMember:host];
}

#pragma mark - Notifications

- (void)reduceMotionChanged
{
  [self update];
}

- (void)didEnterBackground
{
  _inBackground = YES;
  [self removeAnimations];
}

- (void)willEnterForeground
{
  _inBackground = NO;
  [self update];
}

#pragma mark - Mode and colours

- (RNSkeletonMode)mode
{
  if (!_animated || _variant == RNSkeletonVariantNone) return RNSkeletonModeStatic;
  BOOL reduced = _reduceMotion == RNSkeletonReduceMotionAlways ||
      (_reduceMotion == RNSkeletonReduceMotionSystem && UIAccessibilityIsReduceMotionEnabled());
  if (reduced) return RNSkeletonModeGentlePulse;
  return _variant == RNSkeletonVariantPulse ? RNSkeletonModePulse : RNSkeletonModeShimmer;
}

- (UIColor *)resolvedHighlight
{
  UIColor *color = _highlightColor ?: RNSkeletonDefaultHighlightColor();
  UIView *host = _host;
  if (@available(iOS 13.0, *)) {
    if (host) color = [color resolvedColorWithTraitCollection:host.traitCollection];
  }
  return color;
}

- (BOOL)isAnimating
{
  return [_gradient animationForKey:kShimmerKey] != nil || [_pulse animationForKey:kPulseKey] != nil;
}

#pragma mark - Lifecycle

- (void)hostDidMoveToWindow
{
  UIView *host = _host;
  if (!host) return;
  if (host.window) {
    [self findGroup];
    [self update];
    if (_overlay) [self setNeedsSnapshot];
  } else {
    // Core Animation drops a layer's animations when it leaves the window; take
    // them off explicitly so update re-adds them (at the epoch phase) on return.
    [self removeAnimations];
    [_group skeletonRemoveMember:host];
    _group = nil;
  }
}

- (void)hostDidLayout
{
  [self update];
  if (_overlay) [self setNeedsSnapshot];
}

- (void)hostTraitsDidChange
{
  [self update];
  if (_overlay) [self setNeedsSnapshot];
}

- (void)findGroup
{
  UIView *host = _host;
  UIView<RNSkeletonGroupHost> *found = nil;
  for (UIView *v = host.superview; v != nil; v = v.superview) {
    if ([v conformsToProtocol:@protocol(RNSkeletonGroupHost)]) {
      found = (UIView<RNSkeletonGroupHost> *)v;
      break;
    }
  }
  if (found != _group) {
    [_group skeletonRemoveMember:host];
    _group = found;
    [found skeletonAddMember:host];
  }
}

- (void)removeAnimations
{
  [_gradient removeAnimationForKey:kShimmerKey];
  [_pulse removeAnimationForKey:kPulseKey];
  _animationKey = nil;
}

#pragma mark - Geometry and animations

- (void)update
{
  UIView *host = _host;
  if (!host) return;
  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  [self applyWithHost:host];
  [CATransaction commit];
}

- (void)applyWithHost:(UIView *)host
{
  CGRect bounds = host.bounds;
  CGFloat w = bounds.size.width;
  CGFloat h = bounds.size.height;
  RNSkeletonMode mode = [self mode];
  _container.frame = bounds;
  if (_overlay) _mask.frame = bounds;

  BOOL visible = mode != RNSkeletonModeStatic && w > 0 && h > 0;
  _container.hidden = !visible;
  if (!visible || host.window == nil || _inBackground) {
    [self removeAnimations];
    return;
  }

  UIView *group = _group;
  CGFloat ox = 0, oy = 0, gw = w, gh = h;
  if (group) {
    CGPoint origin = [host convertPoint:CGPointZero toView:group];
    ox = origin.x;
    oy = origin.y;
    gw = MAX(group.bounds.size.width, 1);
    gh = MAX(group.bounds.size.height, 1);
  }
  CFTimeInterval epoch = group ? [(id<RNSkeletonGroupHost>)group skeletonEpoch] : RNSkeletonGlobalEpoch();
  CGColorRef high = [self resolvedHighlight].CGColor;
  CGColorRef clear = [[self resolvedHighlight] colorWithAlphaComponent:0].CGColor;
  CFTimeInterval duration = MAX(_durationMs, 100) / 1000.0;

  if (mode == RNSkeletonModeShimmer) {
    _pulse.hidden = YES;
    [_pulse removeAnimationForKey:kPulseKey];
    _transformLayer.hidden = NO;

    CGFloat tanA = tan(_angle * M_PI / 180.0);
    CGFloat period = MAX(1, MAX(kPeriodFactor * gw, kPeriodFactor * fabs(tanA) * gh));
    CGFloat oxm = _rtl ? gw - ox - w : ox;
    CGFloat s = _rtl ? -1 : 1;
    CGFloat c = _rtl ? gw : 0;
    // Maps the (mirrored, unskewed) group space of the gradient into host
    // coordinates: x = s*(u + tan*(v - gh/2)) + c - ox, y = v - oy.
    CATransform3D t = CATransform3DIdentity;
    t.m11 = s;
    t.m21 = s * tanA;
    t.m41 = c - ox - s * tanA * gh / 2;
    t.m42 = -oy;
    _transformLayer.transform = t;

    // Left edge a multiple of the period, 1.5-2.5 periods left of the host,
    // so a translation of up to one period always covers it with margin.
    CGFloat left = ceil((oxm - 2.5 * period) / period) * period;
    _gradient.frame = CGRectMake(left, oy, 4 * period, h);
    NSMutableArray *colors = [NSMutableArray array];
    NSMutableArray<NSNumber *> *locations = [NSMutableArray array];
    [colors addObject:(__bridge id)clear];
    [locations addObject:@0];
    for (int k = 0; k < 4; k++) {
      [colors addObjectsFromArray:@[ (__bridge id)clear, (__bridge id)high, (__bridge id)clear ]];
      [locations addObjectsFromArray:@[ @((k + 0.36) / 4), @((k + 0.5) / 4), @((k + 0.64) / 4) ]];
    }
    [colors addObject:(__bridge id)clear];
    [locations addObject:@1];
    _gradient.colors = colors;
    _gradient.locations = locations;

    NSString *key = [NSString stringWithFormat:@"s|%.3f|%.4f|%.6f", period, duration, epoch];
    if (![key isEqualToString:_animationKey] || [_gradient animationForKey:kShimmerKey] == nil) {
      CABasicAnimation *a = [CABasicAnimation animationWithKeyPath:@"transform.translation.x"];
      a.fromValue = @0;
      a.toValue = @(period);
      a.duration = duration;
      a.repeatCount = HUGE_VALF;
      a.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
      a.removedOnCompletion = NO;
      // A beginTime at the shared epoch puts every view of the group in phase.
      a.beginTime = [_gradient convertTime:epoch fromLayer:nil];
      [_gradient addAnimation:a forKey:kShimmerKey];
      _animationKey = key;
    }
  } else {
    _transformLayer.hidden = YES;
    [_gradient removeAnimationForKey:kShimmerKey];
    _pulse.hidden = NO;
    _pulse.frame = bounds;
    _pulse.backgroundColor = high;
    _pulse.opacity = 0;
    BOOL gentle = mode == RNSkeletonModeGentlePulse;
    CFTimeInterval half = gentle ? duration : duration / 2;
    CGFloat peak = gentle ? kGentleOpacity : kPulseOpacity;
    NSString *key = [NSString stringWithFormat:@"p|%.4f|%.2f|%.6f", half, peak, epoch];
    if (![key isEqualToString:_animationKey] || [_pulse animationForKey:kPulseKey] == nil) {
      CABasicAnimation *a = [CABasicAnimation animationWithKeyPath:@"opacity"];
      a.fromValue = @0;
      a.toValue = @(peak);
      a.duration = half;
      a.autoreverses = YES;
      a.repeatCount = HUGE_VALF;
      a.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
      a.removedOnCompletion = NO;
      a.beginTime = [_pulse convertTime:epoch fromLayer:nil];
      [_pulse addAnimation:a forKey:kPulseKey];
      _animationKey = key;
    }
  }
}

#pragma mark - Overlay mask

- (void)setNeedsSnapshot
{
  if (!_overlay || _snapshotScheduled) return;
  _snapshotScheduled = YES;
  // Next run loop turn, after the children of this layout pass have been laid out.
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_snapshotScheduled = NO;
    [self takeSnapshot];
  });
}

- (void)takeSnapshot
{
  UIView *host = _host;
  if (!host || host.window == nil || _container.hidden) return;
  CGRect bounds = host.bounds;
  if (bounds.size.width <= 0 || bounds.size.height <= 0) return;
  [CATransaction begin];
  [CATransaction setDisableActions:YES];
  _container.hidden = YES;
  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
  format.opaque = NO;
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithBounds:bounds format:format];
  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *ctx) {
    [host.layer renderInContext:ctx.CGContext];
  }];
  _container.hidden = NO;
  _mask.frame = bounds;
  _mask.contents = (__bridge id)image.CGImage;
  _mask.contentsScale = image.scale;
  [CATransaction commit];
}

@end
