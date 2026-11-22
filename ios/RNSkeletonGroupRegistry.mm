#import "RNSkeletonGroupRegistry.h"
#import <QuartzCore/QuartzCore.h>
#import "RNSkeletonAnimator.h"

@implementation RNSkeletonGroupRegistry {
  NSHashTable<UIView *> *_members;
}

- (instancetype)init
{
  if (self = [super init]) {
    _epoch = CACurrentMediaTime();
    _members = [NSHashTable weakObjectsHashTable];
  }
  return self;
}

- (void)add:(UIView *)member
{
  [_members addObject:member];
}

- (void)remove:(UIView *)member
{
  [_members removeObject:member];
}

- (void)groupDidLayout
{
  for (UIView *member in _members.allObjects) {
    if ([member conformsToProtocol:@protocol(RNSkeletonMember)]) {
      [(id<RNSkeletonMember>)member skeletonGroupDidLayout];
    }
  }
}

@end
