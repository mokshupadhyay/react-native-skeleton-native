// The same 20 rows rendered by each library. Colours, sizes and duration match.
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { Shimmer as FastShimmer, ShimmerProvider } from 'react-native-fast-shimmer';
import { Skeleton, SkeletonGroup } from 'react-native-skeleton-native';

export const ROWS = 20;
export const BASE = '#D5D9DF';
export const HIGHLIGHT = '#F7F8FA';
export const DURATION_MS = 1400;

const rows = Array.from({ length: ROWS }, (_, i) => i);

interface ListProps {
  tick: number;
}

// A style that changes on every storm tick, so every row is re-rendered and its
// props are committed to the native views.
const stormStyle = (tick: number) => ({ opacity: tick % 2 === 0 ? 1 : 0.999 });

export function NativeList({ tick }: ListProps) {
  return (
    <SkeletonGroup baseColor={BASE} highlightColor={HIGHLIGHT} duration={DURATION_MS} direction="ltr">
      {rows.map((i) => (
        <View key={i} style={[styles.row, stormStyle(tick)]}>
          <Skeleton.Circle size={48} />
          <View style={styles.lines}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={12} style={styles.second} />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

export function PlaceholderList({ tick }: ListProps) {
  // The library builds its mask from SkeletonPlaceholder.Item props, so the
  // layout is given as Item props instead of styles.
  return (
    <SkeletonPlaceholder backgroundColor={BASE} highlightColor={HIGHLIGHT} speed={DURATION_MS} borderRadius={4}>
      <SkeletonPlaceholder.Item opacity={tick % 2 === 0 ? 1 : 0.999}>
        {rows.map((i) => (
          <SkeletonPlaceholder.Item key={i} flexDirection="row" alignItems="center" paddingHorizontal={16} height={72}>
            <SkeletonPlaceholder.Item width={48} height={48} borderRadius={24} />
            <SkeletonPlaceholder.Item flex={1} marginLeft={16}>
              <SkeletonPlaceholder.Item width="70%" height={14} />
              <SkeletonPlaceholder.Item width="45%" height={12} marginTop={10} />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>
        ))}
      </SkeletonPlaceholder.Item>
    </SkeletonPlaceholder>
  );
}

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient as unknown as React.ComponentClass<object>);
const shimmerColors = [BASE, HIGHLIGHT, BASE];

export function ShimmerPlaceholderList({ tick }: ListProps) {
  return (
    <View>
      {rows.map((i) => (
        <View key={i} style={[styles.row, stormStyle(tick)]}>
          <ShimmerPlaceholder width={48} height={48} style={styles.round} shimmerColors={shimmerColors} duration={DURATION_MS} />
          <View style={styles.lines}>
            <ShimmerPlaceholder width={200} height={14} style={styles.radius} shimmerColors={shimmerColors} duration={DURATION_MS} />
            <ShimmerPlaceholder width={130} height={12} style={[styles.radius, styles.second]} shimmerColors={shimmerColors} duration={DURATION_MS} />
          </View>
        </View>
      ))}
    </View>
  );
}

const fastGradient = ['transparent', HIGHLIGHT, 'transparent'];

export function FastShimmerList({ tick }: ListProps) {
  return (
    <ShimmerProvider duration={DURATION_MS}>
      {rows.map((i) => (
        <View key={i} style={[styles.row, stormStyle(tick)]}>
          <View style={styles.circle}>
            <FastShimmer style={styles.fill} linearGradients={fastGradient} />
          </View>
          <View style={styles.lines}>
            <View style={styles.line1}>
              <FastShimmer style={styles.fill} linearGradients={fastGradient} />
            </View>
            <View style={[styles.line2, styles.second]}>
              <FastShimmer style={styles.fill} linearGradients={fastGradient} />
            </View>
          </View>
        </View>
      ))}
    </ShimmerProvider>
  );
}

export function StaticList({ tick }: ListProps) {
  return (
    <View>
      {rows.map((i) => (
        <View key={i} style={[styles.row, stormStyle(tick)]}>
          <View style={styles.circle} />
          <View style={styles.lines}>
            <View style={styles.line1} />
            <View style={[styles.line2, styles.second]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 72 },
  lines: { flex: 1, marginLeft: 16 },
  second: { marginTop: 10 },
  circle: { width: 48, height: 48, borderRadius: 24, backgroundColor: BASE, overflow: 'hidden' },
  line1: { width: '70%', height: 14, borderRadius: 4, backgroundColor: BASE, overflow: 'hidden' },
  line2: { width: '45%', height: 12, borderRadius: 4, backgroundColor: BASE, overflow: 'hidden' },
  round: { borderRadius: 24 },
  radius: { borderRadius: 4 },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
