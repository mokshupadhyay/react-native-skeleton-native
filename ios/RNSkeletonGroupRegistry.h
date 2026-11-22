#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/** Members of one group, held weakly; shared by both architectures' group views. */
@interface RNSkeletonGroupRegistry : NSObject
@property (nonatomic, readonly) CFTimeInterval epoch;
- (void)add:(UIView *)member;
- (void)remove:(UIView *)member;
/** Tell every member that the group's layout changed. */
- (void)groupDidLayout;
@end

NS_ASSUME_NONNULL_END
