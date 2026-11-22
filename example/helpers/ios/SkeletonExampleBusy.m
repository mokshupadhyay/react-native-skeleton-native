#import <React/RCTBridgeModule.h>
#import <QuartzCore/QuartzCore.h>

@interface SkeletonExampleBusy : NSObject <RCTBridgeModule>
@end

@implementation SkeletonExampleBusy

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

// `xcrun simctl launch <udid> <bundle> -skeletonUrl '<link>'` puts the link in
// NSUserDefaults, which avoids the confirmation alert of `simctl openurl`.
- (NSDictionary *)constantsToExport
{
  NSString *url = [[NSUserDefaults standardUserDefaults] stringForKey:@"skeletonUrl"];
  return @{@"launchUrl" : url ?: [NSNull null]};
}

RCT_EXPORT_METHOD(blockMainThread : (double)ms)
{
  NSLog(@"[SkeletonExample] MAIN_BLOCK_START");
  CFTimeInterval end = CACurrentMediaTime() + ms / 1000.0;
  while (CACurrentMediaTime() < end) {
  }
  NSLog(@"[SkeletonExample] MAIN_BLOCK_END");
}

@end
