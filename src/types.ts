import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type SkeletonVariant = 'shimmer' | 'pulse' | 'none';
export type SkeletonDirection = 'ltr' | 'rtl' | 'auto';
/**
 * `system` follows the OS setting (iOS Reduce Motion, Android "Remove
 * animations" / animator duration scale 0). `always` behaves as if it were
 * on, `never` ignores it.
 */
export type ReduceMotionMode = 'system' | 'always' | 'never';

/** Animation and colour props shared by every component. */
export interface SkeletonAnimationProps {
  /** Block colour. Defaults to a grey that follows the system light/dark theme, natively. */
  baseColor?: ColorValue;
  /** Colour at the centre of the moving highlight. Defaults follow the system theme. */
  highlightColor?: ColorValue;
  /** Time for one sweep (or one pulse), in ms. Default 1400. */
  duration?: number;
  /** Sweep direction. `auto` follows the app's layout direction (`I18nManager.isRTL`). Default `auto`. */
  direction?: SkeletonDirection;
  /** Lean of the highlight band from vertical, in degrees, clamped to -45..45. Default 20. */
  angle?: number;
  /** Default `shimmer`. */
  variant?: SkeletonVariant;
  /** `false` pauses the animation and shows the static block. Default `true`. */
  animated?: boolean;
  /** Default `system`. */
  reduceMotion?: ReduceMotionMode;
}

export interface SkeletonAccessibilityProps {
  /** Screen reader label. Default `"Loading"`. */
  accessibilityLabel?: string;
  testID?: string;
}

export interface SkeletonProps extends SkeletonAnimationProps, SkeletonAccessibilityProps {
  /** Number (dp/pt) or percentage string. Default `'100%'`. */
  width?: number | `${number}%`;
  /** Default 16. */
  height?: number | `${number}%`;
  /** Corner radius. Default 4. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonCircleProps extends SkeletonAnimationProps, SkeletonAccessibilityProps {
  /** Diameter. Default 40. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export interface SkeletonTextProps extends SkeletonAnimationProps, SkeletonAccessibilityProps {
  /** Number of lines, at least 1. Default 3. */
  lines?: number;
  /** Width of the last line when there is more than one: number or percentage. Default `'60%'`. */
  lastLineWidth?: number | `${number}%`;
  /** Height of one line. Default 12. */
  lineHeight?: number;
  /** Space between lines. Default 8. */
  gap?: number;
  /** Corner radius of each line. Default 4. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
}
