import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SkeletonGroupContext } from './context';
import type { GroupContextValue } from './context';
import { DEFAULT_LABEL } from './props';
import SkeletonNativeGroup from './specs/SkeletonNativeGroupNativeComponent';
import type { SkeletonAnimationProps } from './types';

export interface SkeletonGroupProps extends SkeletonAnimationProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Screen reader label for the whole group. Default `"Loading"`. */
  accessibilityLabel?: string;
  testID?: string;
}

const BUSY = { busy: true } as const;

/**
 * Wraps many skeletons. Every skeleton and <Shimmer> inside shares one native
 * animation epoch and the group's coordinate space, so one highlight sweeps
 * across the whole group. Animation props set here are inherited.
 * The group is one accessibility element; the blocks inside are hidden.
 */
export function SkeletonGroup(props: SkeletonGroupProps): React.ReactElement {
  const { children, style, accessibilityLabel, testID } = props;
  const { baseColor, highlightColor, duration, direction, angle, variant, animated, reduceMotion } = props;
  const value = React.useMemo<GroupContextValue>(
    () => ({ props: { baseColor, highlightColor, duration, direction, angle, variant, animated, reduceMotion } }),
    [baseColor, highlightColor, duration, direction, angle, variant, animated, reduceMotion],
  );
  return (
    <SkeletonGroupContext.Provider value={value}>
      <SkeletonNativeGroup
        accessible
        accessibilityRole="progressbar"
        accessibilityState={BUSY}
        accessibilityLabel={accessibilityLabel ?? DEFAULT_LABEL}
        testID={testID}
        style={style}
      >
        {children}
      </SkeletonNativeGroup>
    </SkeletonGroupContext.Provider>
  );
}
