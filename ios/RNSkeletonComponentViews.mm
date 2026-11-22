// New Architecture (Fabric) component views. The old architecture uses the
// view managers in RNSkeletonViewManagers.mm instead.
#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTConversions.h>
#import <React/RCTViewComponentView.h>

#import <react/renderer/components/RNSkeletonNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNSkeletonNativeSpec/Props.h>
#import <react/renderer/components/RNSkeletonNativeSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "RNSkeletonAnimator.h"
#import "RNSkeletonGroupRegistry.h"
#import "RNSkeletonView.h"

using namespace facebook::react;

static UIColor *_Nullable RNSkeletonColor(const SharedColor &color)
{
  return color ? RCTUIColorFromSharedColor(color) : nil;
}

#pragma mark - SkeletonNativeView

@interface RNSkeletonNativeComponentView : RCTViewComponentView <RCTSkeletonNativeViewViewProtocol>
@end

@implementation RNSkeletonNativeComponentView {
  RNSkeletonView *_view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SkeletonNativeViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SkeletonNativeViewProps>();
    _props = defaultProps;
    _view = [[RNSkeletonView alloc] initWithFrame:self.bounds];
    self.contentView = _view;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &p = *std::static_pointer_cast<SkeletonNativeViewProps const>(props);
  _view.baseColor = RNSkeletonColor(p.baseColor);
  _view.highlightColor = RNSkeletonColor(p.highlightColor);
  _view.duration = p.duration;
  _view.direction = p.direction == SkeletonNativeViewDirection::Rtl ? @"rtl" : @"ltr";
  _view.angle = p.angle;
  switch (p.variant) {
    case SkeletonNativeViewVariant::Pulse:
      _view.variant = @"pulse";
      break;
    case SkeletonNativeViewVariant::None:
      _view.variant = @"none";
      break;
    default:
      _view.variant = @"shimmer";
  }
  _view.animated = p.animated;
  switch (p.reduceMotion) {
    case SkeletonNativeViewReduceMotion::Always:
      _view.reduceMotion = @"always";
      break;
    case SkeletonNativeViewReduceMotion::Never:
      _view.reduceMotion = @"never";
      break;
    default:
      _view.reduceMotion = @"system";
  }
  _view.cornerRadius = p.cornerRadius;
  [super updateProps:props oldProps:oldProps];
  [_view commitProps];
}

@end

// C linkage, as the generated component provider of React Native 0.71-0.76 expects.
extern "C" Class<RCTComponentViewProtocol> SkeletonNativeViewCls(void);

Class<RCTComponentViewProtocol> SkeletonNativeViewCls(void)
{
  return RNSkeletonNativeComponentView.class;
}

#pragma mark - SkeletonNativeGroup

@interface RNSkeletonGroupComponentView : RCTViewComponentView <RCTSkeletonNativeGroupViewProtocol, RNSkeletonGroupHost>
@end

@implementation RNSkeletonGroupComponentView {
  RNSkeletonGroupRegistry *_registry;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SkeletonNativeGroupComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SkeletonNativeGroupProps>();
    _props = defaultProps;
    _registry = [RNSkeletonGroupRegistry new];
  }
  return self;
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // A recycled group is a new group: give it a new epoch.
  _registry = [RNSkeletonGroupRegistry new];
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

// C linkage, as the generated component provider of React Native 0.71-0.76 expects.
extern "C" Class<RCTComponentViewProtocol> SkeletonNativeGroupCls(void);

Class<RCTComponentViewProtocol> SkeletonNativeGroupCls(void)
{
  return RNSkeletonGroupComponentView.class;
}

#pragma mark - SkeletonNativeShimmer

@interface RNSkeletonShimmerComponentView : RCTViewComponentView <RCTSkeletonNativeShimmerViewProtocol, RNSkeletonMember>
@end

@implementation RNSkeletonShimmerComponentView {
  RNSkeletonAnimator *_animator;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<SkeletonNativeShimmerComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const SkeletonNativeShimmerProps>();
    _props = defaultProps;
    _animator = [[RNSkeletonAnimator alloc] initWithHost:self overlay:YES];
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &p = *std::static_pointer_cast<SkeletonNativeShimmerProps const>(props);
  _animator.highlightColor = RNSkeletonColor(p.highlightColor);
  _animator.durationMs = p.duration;
  _animator.rtl = p.direction == SkeletonNativeShimmerDirection::Rtl;
  _animator.angle = MAX(-45, MIN(45, p.angle));
  switch (p.variant) {
    case SkeletonNativeShimmerVariant::Pulse:
      _animator.variant = RNSkeletonVariantPulse;
      break;
    case SkeletonNativeShimmerVariant::None:
      _animator.variant = RNSkeletonVariantNone;
      break;
    default:
      _animator.variant = RNSkeletonVariantShimmer;
  }
  _animator.animated = p.animated;
  switch (p.reduceMotion) {
    case SkeletonNativeShimmerReduceMotion::Always:
      _animator.reduceMotion = RNSkeletonReduceMotionAlways;
      break;
    case SkeletonNativeShimmerReduceMotion::Never:
      _animator.reduceMotion = RNSkeletonReduceMotionNever;
      break;
    default:
      _animator.reduceMotion = RNSkeletonReduceMotionSystem;
  }
  [super updateProps:props oldProps:oldProps];
  [_animator update];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super mountChildComponentView:childComponentView index:index];
  [_animator setNeedsSnapshot];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [super unmountChildComponentView:childComponentView index:index];
  [_animator setNeedsSnapshot];
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

// C linkage, as the generated component provider of React Native 0.71-0.76 expects.
extern "C" Class<RCTComponentViewProtocol> SkeletonNativeShimmerCls(void);

Class<RCTComponentViewProtocol> SkeletonNativeShimmerCls(void)
{
  return RNSkeletonShimmerComponentView.class;
}

#endif
