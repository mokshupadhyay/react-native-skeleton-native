import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { useSkeletonGroup } from './context';
import {
  DEFAULT_LABEL,
  normalizeDimension,
  normalizeLines,
  normalizeRadius,
  resolveAnimationProps,
} from './props';
import type { NativeAnimationProps } from './props';
import SkeletonNativeView from './specs/SkeletonNativeViewNativeComponent';
import type { SkeletonCircleProps, SkeletonProps, SkeletonTextProps } from './types';

type A11yProps = Pick<
  ViewProps,
  'accessible' | 'accessibilityRole' | 'accessibilityState' | 'accessibilityLabel' | 'importantForAccessibility' | 'accessibilityElementsHidden'
>;

const BUSY = { busy: true } as const;

/**
 * Accessibility props for one placeholder. Outside a group each placeholder is
 * one "Loading" progress bar; inside a group the group is the only element and
 * every placeholder is hidden from screen readers.
 */
export function accessibilityProps(inGroup: boolean, label: string | undefined): A11yProps {
  if (inGroup) {
    return { accessible: false, importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true };
  }
  return {
    accessible: true,
    accessibilityRole: 'progressbar',
    accessibilityState: BUSY,
    accessibilityLabel: label ?? DEFAULT_LABEL,
  };
}

const HIDDEN: A11yProps = accessibilityProps(true, undefined);

function nativeProps(p: NativeAnimationProps) {
  return {
    baseColor: p.baseColor,
    highlightColor: p.highlightColor,
    duration: p.duration,
    direction: p.direction,
    angle: p.angle,
    variant: p.variant,
    animated: p.animated,
    reduceMotion: p.reduceMotion,
  };
}

function SkeletonBlock(props: SkeletonProps): React.ReactElement {
  const group = useSkeletonGroup();
  const anim = resolveAnimationProps(props, group ? group.props : null);
  const width = normalizeDimension('width', props.width, '100%');
  const height = normalizeDimension('height', props.height, 16);
  const radius = normalizeRadius(props.radius, 4);
  return (
    <SkeletonNativeView
      {...nativeProps(anim)}
      {...accessibilityProps(group != null, props.accessibilityLabel)}
      cornerRadius={radius}
      testID={props.testID}
      style={[{ width, height }, props.style]}
    />
  );
}

function SkeletonCircle(props: SkeletonCircleProps): React.ReactElement {
  const size = typeof props.size === 'number' && Number.isFinite(props.size) && props.size >= 0 ? props.size : 40;
  return <SkeletonBlock {...props} width={size} height={size} radius={size / 2} />;
}

function SkeletonText(props: SkeletonTextProps): React.ReactElement {
  const group = useSkeletonGroup();
  const anim = resolveAnimationProps(props, group ? group.props : null);
  const lines = normalizeLines(props.lines);
  const lastLineWidth = normalizeDimension('lastLineWidth', props.lastLineWidth, '60%');
  const lineHeight = normalizeRadius(props.lineHeight, 12);
  const gap = normalizeRadius(props.gap, 8);
  const radius = normalizeRadius(props.radius, 4);
  const rows: React.ReactElement[] = [];
  for (let i = 0; i < lines; i++) {
    const last = lines > 1 && i === lines - 1;
    rows.push(
      <SkeletonNativeView
        key={i}
        {...nativeProps(anim)}
        {...HIDDEN}
        cornerRadius={radius}
        style={{ width: last ? lastLineWidth : '100%', height: lineHeight, marginTop: i === 0 ? 0 : gap }}
      />,
    );
  }
  return (
    <View
      {...accessibilityProps(group != null, props.accessibilityLabel)}
      testID={props.testID}
      style={[styles.text, props.style]}
    >
      {rows}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { width: '100%' },
});

type SkeletonComponent = React.NamedExoticComponent<SkeletonProps> & {
  Circle: React.NamedExoticComponent<SkeletonCircleProps>;
  Text: React.NamedExoticComponent<SkeletonTextProps>;
};

const Circle = React.memo(SkeletonCircle);
Circle.displayName = 'Skeleton.Circle';
const Text = React.memo(SkeletonText);
Text.displayName = 'Skeleton.Text';

/** One placeholder block. `Skeleton.Circle` and `Skeleton.Text` are shortcuts. */
export const Skeleton = Object.assign(React.memo(SkeletonBlock), { Circle, Text }) as SkeletonComponent;
Skeleton.displayName = 'Skeleton';
