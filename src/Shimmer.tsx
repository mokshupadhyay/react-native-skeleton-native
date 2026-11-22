import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSkeletonGroup } from './context';
import { accessibilityProps } from './Skeleton';
import { resolveAnimationProps } from './props';
import SkeletonNativeShimmer from './specs/SkeletonNativeShimmerNativeComponent';
import type { SkeletonAccessibilityProps, SkeletonAnimationProps } from './types';

export interface ShimmerProps extends Omit<SkeletonAnimationProps, 'baseColor'>, SkeletonAccessibilityProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Draws the moving highlight over arbitrary children, limited to the pixels the
 * children draw. Android composites it live over the children (SRC_ATOP); iOS
 * masks it with a snapshot of the children taken on layout. See the README.
 */
export function Shimmer(props: ShimmerProps): React.ReactElement {
  const group = useSkeletonGroup();
  const anim = resolveAnimationProps(props, group ? group.props : null);
  return (
    <SkeletonNativeShimmer
      highlightColor={anim.highlightColor}
      duration={anim.duration}
      direction={anim.direction}
      angle={anim.angle}
      variant={anim.variant}
      animated={anim.animated}
      reduceMotion={anim.reduceMotion}
      {...accessibilityProps(group != null, props.accessibilityLabel)}
      testID={props.testID}
      style={props.style}
    >
      {props.children}
    </SkeletonNativeShimmer>
  );
}
