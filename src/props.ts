import { I18nManager } from 'react-native';
import type { ColorValue } from 'react-native';
import type { ReduceMotionMode, SkeletonAnimationProps, SkeletonDirection, SkeletonVariant } from './types';

export const DEFAULT_DURATION_MS = 1400;
export const MIN_DURATION_MS = 100;
export const MAX_DURATION_MS = 60000;
export const DEFAULT_ANGLE = 20;
export const MAX_ANGLE = 45;
export const DEFAULT_LABEL = 'Loading';

/**
 * The colours the native views use when `baseColor` / `highlightColor` are not
 * given. They are applied natively, so they follow the system theme without a
 * React re-render.
 */
export const DEFAULT_COLORS = {
  light: { base: '#E1E4E8', highlight: '#F5F7F9' },
  dark: { base: '#2B2E33', highlight: '#3D4148' },
} as const;

const VARIANTS: readonly SkeletonVariant[] = ['shimmer', 'pulse', 'none'];
const DIRECTIONS: readonly SkeletonDirection[] = ['ltr', 'rtl', 'auto'];
const REDUCE_MOTION: readonly ReduceMotionMode[] = ['system', 'always', 'never'];

declare const __DEV__: boolean | undefined;

function warn(message: string): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(`react-native-skeleton-native: ${message}`);
  }
}

export interface NativeAnimationProps {
  baseColor?: ColorValue;
  highlightColor?: ColorValue;
  duration: number;
  direction: 'ltr' | 'rtl';
  angle: number;
  variant: SkeletonVariant;
  animated: boolean;
  reduceMotion: ReduceMotionMode;
}

export function normalizeDuration(value: number | undefined): number {
  if (value === undefined) return DEFAULT_DURATION_MS;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    warn(`duration must be a positive number of ms, got ${String(value)}; using ${DEFAULT_DURATION_MS}.`);
    return DEFAULT_DURATION_MS;
  }
  return Math.round(Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, value)));
}

export function normalizeAngle(value: number | undefined): number {
  if (value === undefined) return DEFAULT_ANGLE;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    warn(`angle must be a number of degrees, got ${String(value)}; using ${DEFAULT_ANGLE}.`);
    return DEFAULT_ANGLE;
  }
  return Math.min(MAX_ANGLE, Math.max(-MAX_ANGLE, value));
}

function oneOf<T extends string>(name: string, value: T | undefined, allowed: readonly T[], fallback: T): T {
  if (value === undefined) return fallback;
  if (allowed.indexOf(value) === -1) {
    warn(`${name} must be one of ${allowed.join(', ')}, got ${String(value)}; using ${fallback}.`);
    return fallback;
  }
  return value;
}

export function resolveDirection(value: SkeletonDirection | undefined, isRTL: boolean = I18nManager.isRTL): 'ltr' | 'rtl' {
  const d = oneOf('direction', value, DIRECTIONS, 'auto');
  if (d === 'auto') return isRTL ? 'rtl' : 'ltr';
  return d;
}

/** Merge own props over group props, validate, and fill defaults. */
export function resolveAnimationProps(
  own: SkeletonAnimationProps,
  inherited: SkeletonAnimationProps | null,
): NativeAnimationProps {
  const pick = <K extends keyof SkeletonAnimationProps>(key: K): SkeletonAnimationProps[K] =>
    own[key] !== undefined ? own[key] : inherited ? inherited[key] : undefined;
  return {
    baseColor: pick('baseColor'),
    highlightColor: pick('highlightColor'),
    duration: normalizeDuration(pick('duration')),
    direction: resolveDirection(pick('direction')),
    angle: normalizeAngle(pick('angle')),
    variant: oneOf('variant', pick('variant'), VARIANTS, 'shimmer'),
    animated: pick('animated') !== false,
    reduceMotion: oneOf('reduceMotion', pick('reduceMotion'), REDUCE_MOTION, 'system'),
  };
}

export type Dimension = number | `${number}%`;

export function normalizeDimension(name: string, value: Dimension | undefined, fallback: Dimension): Dimension {
  if (value === undefined) return fallback;
  if (typeof value === 'number') {
    if (Number.isFinite(value) && value >= 0) return value;
  } else if (typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value)) {
    return value;
  }
  warn(`${name} must be a non-negative number or a percentage string, got ${String(value)}; using ${String(fallback)}.`);
  return fallback;
}

export function normalizeRadius(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    warn(`radius must be a non-negative number, got ${String(value)}; using ${fallback}.`);
    return fallback;
  }
  return value;
}

export function normalizeLines(value: number | undefined): number {
  if (value === undefined) return 3;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) {
    warn(`lines must be a number of at least 1, got ${String(value)}; using 1.`);
    return 1;
  }
  return Math.min(100, Math.floor(value));
}
