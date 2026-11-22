import {
  DEFAULT_ANGLE,
  DEFAULT_DURATION_MS,
  normalizeAngle,
  normalizeDimension,
  normalizeDuration,
  normalizeLines,
  normalizeRadius,
  resolveAnimationProps,
  resolveDirection,
} from '../props';

describe('props validation', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('fills every default', () => {
    expect(resolveAnimationProps({}, null)).toEqual({
      baseColor: undefined,
      highlightColor: undefined,
      duration: DEFAULT_DURATION_MS,
      direction: 'ltr',
      angle: DEFAULT_ANGLE,
      variant: 'shimmer',
      animated: true,
      reduceMotion: 'system',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('rejects bad durations and clamps extreme ones', () => {
    expect(normalizeDuration(800)).toBe(800);
    expect(normalizeDuration(800.6)).toBe(801);
    expect(normalizeDuration(0)).toBe(DEFAULT_DURATION_MS);
    expect(normalizeDuration(-5)).toBe(DEFAULT_DURATION_MS);
    expect(normalizeDuration(Number.NaN)).toBe(DEFAULT_DURATION_MS);
    expect(normalizeDuration(Infinity)).toBe(DEFAULT_DURATION_MS);
    expect(normalizeDuration('1000' as unknown as number)).toBe(DEFAULT_DURATION_MS);
    expect(normalizeDuration(10)).toBe(100);
    expect(normalizeDuration(1e9)).toBe(60000);
    expect(warn).toHaveBeenCalledTimes(5);
  });

  it('clamps the angle', () => {
    expect(normalizeAngle(undefined)).toBe(20);
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(-30)).toBe(-30);
    expect(normalizeAngle(90)).toBe(45);
    expect(normalizeAngle(-90)).toBe(-45);
    expect(normalizeAngle(Number.NaN)).toBe(20);
  });

  it('resolves direction, including auto', () => {
    expect(resolveDirection('ltr', true)).toBe('ltr');
    expect(resolveDirection('rtl', false)).toBe('rtl');
    expect(resolveDirection('auto', true)).toBe('rtl');
    expect(resolveDirection('auto', false)).toBe('ltr');
    expect(resolveDirection(undefined, true)).toBe('rtl');
    expect(resolveDirection('up' as never, false)).toBe('ltr');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('falls back on unknown enum values', () => {
    const p = resolveAnimationProps({ variant: 'wave' as never, reduceMotion: 'maybe' as never }, null);
    expect(p.variant).toBe('shimmer');
    expect(p.reduceMotion).toBe('system');
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('passes reduceMotion through', () => {
    expect(resolveAnimationProps({ reduceMotion: 'always' }, null).reduceMotion).toBe('always');
    expect(resolveAnimationProps({ reduceMotion: 'never' }, null).reduceMotion).toBe('never');
    expect(resolveAnimationProps({}, { reduceMotion: 'always' }).reduceMotion).toBe('always');
  });

  it('own props win over inherited ones, undefined does not', () => {
    const p = resolveAnimationProps(
      { duration: 900, animated: undefined },
      { duration: 2000, animated: false, baseColor: 'red', variant: 'pulse' },
    );
    expect(p.duration).toBe(900);
    expect(p.animated).toBe(false);
    expect(p.baseColor).toBe('red');
    expect(p.variant).toBe('pulse');
  });

  it('validates dimensions, radius and lines', () => {
    expect(normalizeDimension('width', 10, 0)).toBe(10);
    expect(normalizeDimension('width', '50%', 0)).toBe('50%');
    expect(normalizeDimension('width', '12.5%', 0)).toBe('12.5%');
    expect(normalizeDimension('width', '50px' as never, 7)).toBe(7);
    expect(normalizeDimension('width', -1, 7)).toBe(7);
    expect(normalizeRadius(-1, 4)).toBe(4);
    expect(normalizeRadius(6, 4)).toBe(6);
    expect(normalizeLines(undefined)).toBe(3);
    expect(normalizeLines(2.7)).toBe(2);
    expect(normalizeLines(0)).toBe(1);
    expect(normalizeLines(500)).toBe(100);
  });
});
