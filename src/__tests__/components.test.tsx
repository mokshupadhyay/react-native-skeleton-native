import * as React from 'react';
import { I18nManager } from 'react-native';
import { render } from '@testing-library/react-native';
import { Shimmer, Skeleton, SkeletonGroup } from '../index';

type Node = { type: unknown; props: Record<string, unknown>; children: unknown };

function hostNodes(root: { toJSON(): unknown }, name: string): Node[] {
  const out: Node[] = [];
  const walk = (n: unknown) => {
    if (n == null || typeof n !== 'object') return;
    if (Array.isArray(n)) return n.forEach(walk);
    const node = n as Node;
    if (node.type === name) out.push(node);
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  walk(root.toJSON());
  return out;
}

const flat = (style: unknown): Record<string, unknown> =>
  Array.isArray(style) ? Object.assign({}, ...style.map(flat)) : ((style as Record<string, unknown>) ?? {});

describe('<Skeleton>', () => {
  it('renders one native block with defaults', async () => {
    const r = await render(<Skeleton />);
    const [block] = hostNodes(r, 'SkeletonNativeView');
    expect(block).toBeDefined();
    expect(block.props).toMatchObject({
      duration: 1400,
      direction: 'ltr',
      angle: 20,
      variant: 'shimmer',
      animated: true,
      reduceMotion: 'system',
      cornerRadius: 4,
    });
    expect(block.props.baseColor).toBeUndefined();
    expect(flat(block.props.style)).toMatchObject({ width: '100%', height: 16 });
  });

  it('is a busy progress bar labelled "Loading" by default', async () => {
    const r = await render(<Skeleton />);
    const [block] = hostNodes(r, 'SkeletonNativeView');
    expect(block.props).toMatchObject({
      accessible: true,
      accessibilityRole: 'progressbar',
      accessibilityState: { busy: true },
      accessibilityLabel: 'Loading',
    });
  });

  it('accepts a custom label', async () => {
    const r = await render(<Skeleton accessibilityLabel="Loading profile" />);
    expect(hostNodes(r, 'SkeletonNativeView')[0].props.accessibilityLabel).toBe('Loading profile');
  });

  it('passes size, radius, colours and animation props', async () => {
    const r = await render(
      <Skeleton width={120} height={20} radius={10} baseColor="#111" highlightColor="#eee" duration={800} angle={0} variant="pulse" animated={false} reduceMotion="always" direction="rtl" />,
    );
    const [b] = hostNodes(r, 'SkeletonNativeView');
    expect(flat(b.props.style)).toMatchObject({ width: 120, height: 20 });
    expect(b.props).toMatchObject({
      cornerRadius: 10,
      baseColor: '#111',
      highlightColor: '#eee',
      duration: 800,
      angle: 0,
      variant: 'pulse',
      animated: false,
      reduceMotion: 'always',
      direction: 'rtl',
    });
  });

  it('direction auto follows I18nManager.isRTL', async () => {
    const spy = jest.replaceProperty(I18nManager, 'isRTL', true);
    const r = await render(<Skeleton direction="auto" />);
    expect(hostNodes(r, 'SkeletonNativeView')[0].props.direction).toBe('rtl');
    spy.restore();
  });

  it('Skeleton.Circle is a round block of the given size', async () => {
    const r = await render(<Skeleton.Circle size={48} />);
    const [b] = hostNodes(r, 'SkeletonNativeView');
    expect(flat(b.props.style)).toMatchObject({ width: 48, height: 48 });
    expect(b.props.cornerRadius).toBe(24);
  });

  it('Skeleton.Text renders lines with a shorter last line, as one accessible element', async () => {
    const r = await render(<Skeleton.Text lines={3} lastLineWidth="40%" />);
    const lines = hostNodes(r, 'SkeletonNativeView');
    expect(lines).toHaveLength(3);
    expect(flat(lines[0].props.style).width).toBe('100%');
    expect(flat(lines[2].props.style).width).toBe('40%');
    lines.forEach((l) => expect(l.props.importantForAccessibility).toBe('no-hide-descendants'));
    const container = hostNodes(r, 'View')[0];
    expect(container.props).toMatchObject({ accessible: true, accessibilityRole: 'progressbar', accessibilityLabel: 'Loading' });
  });

  it('a single text line uses the full width', async () => {
    const r = await render(<Skeleton.Text lines={1} />);
    const lines = hostNodes(r, 'SkeletonNativeView');
    expect(lines).toHaveLength(1);
    expect(flat(lines[0].props.style).width).toBe('100%');
  });
});

describe('<SkeletonGroup>', () => {
  it('passes its props to every skeleton and lets skeletons override them', async () => {
    const r = await render(
      <SkeletonGroup baseColor="#222" duration={2000} variant="pulse" reduceMotion="never">
        <Skeleton />
        <Skeleton duration={500} />
        <Skeleton.Text lines={2} />
      </SkeletonGroup>,
    );
    const blocks = hostNodes(r, 'SkeletonNativeView');
    expect(blocks).toHaveLength(4);
    blocks.forEach((b) => expect(b.props).toMatchObject({ baseColor: '#222', variant: 'pulse', reduceMotion: 'never' }));
    expect(blocks.map((b) => b.props.duration)).toEqual([2000, 500, 2000, 2000]);
  });

  it('wraps children in the native group view', async () => {
    const r = await render(
      <SkeletonGroup>
        <Skeleton />
      </SkeletonGroup>,
    );
    const [group] = hostNodes(r, 'SkeletonNativeGroup');
    expect(group).toBeDefined();
    expect(hostNodes(r, 'SkeletonNativeView')).toHaveLength(1);
  });

  it('is the only accessibility element; blocks are hidden', async () => {
    const r = await render(
      <SkeletonGroup accessibilityLabel="Loading feed">
        <Skeleton />
        <Skeleton.Circle />
        <Skeleton.Text />
      </SkeletonGroup>,
    );
    const [group] = hostNodes(r, 'SkeletonNativeGroup');
    expect(group.props).toMatchObject({
      accessible: true,
      accessibilityRole: 'progressbar',
      accessibilityState: { busy: true },
      accessibilityLabel: 'Loading feed',
    });
    hostNodes(r, 'SkeletonNativeView').forEach((b) => {
      expect(b.props.accessible).toBe(false);
      expect(b.props.importantForAccessibility).toBe('no-hide-descendants');
      expect(b.props.accessibilityElementsHidden).toBe(true);
      expect(b.props.accessibilityRole).toBeUndefined();
    });
    const textContainer = hostNodes(r, 'View').find((v) => v.props.importantForAccessibility === 'no-hide-descendants');
    expect(textContainer).toBeDefined();
  });

  it('defaults the group label to "Loading"', async () => {
    const r = await render(<SkeletonGroup />);
    expect(hostNodes(r, 'SkeletonNativeGroup')[0].props.accessibilityLabel).toBe('Loading');
  });
});

describe('<Shimmer>', () => {
  it('wraps children and passes animation props but no base colour', async () => {
    const r = await render(
      <Shimmer duration={1000} highlightColor="#fff" angle={-10}>
        <Skeleton />
      </Shimmer>,
    );
    const [s] = hostNodes(r, 'SkeletonNativeShimmer');
    expect(s.props).toMatchObject({ duration: 1000, highlightColor: '#fff', angle: -10, variant: 'shimmer', animated: true, reduceMotion: 'system' });
    expect('baseColor' in s.props).toBe(false);
    expect(s.props).toMatchObject({ accessible: true, accessibilityRole: 'progressbar', accessibilityLabel: 'Loading' });
  });

  it('inherits group props and hides itself inside a group', async () => {
    const r = await render(
      <SkeletonGroup duration={3000} animated={false}>
        <Shimmer />
      </SkeletonGroup>,
    );
    const [s] = hostNodes(r, 'SkeletonNativeShimmer');
    expect(s.props).toMatchObject({ duration: 3000, animated: false, accessible: false, importantForAccessibility: 'no-hide-descendants' });
  });
});
