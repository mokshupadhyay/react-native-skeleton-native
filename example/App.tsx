/**
 * Comparison app for react-native-skeleton-native. The same list of 20
 * skeleton rows is rendered by one of four libraries, chosen by a deep link:
 *
 *   skeletonexample://run?lib=native|placeholder|shimmer|fast|none&scenario=idle|js|ui|storm|cost
 *
 * Scenarios start 3 s after the link opens. Before a block starts, the marker
 * square (top right) turns red and two frames are drawn, so a screen
 * recording shows when the block began. `cost` runs a 10 s idle jankscope
 * session and saves the report as cost-<lib>.json.
 */
import * as React from 'react';
import { Linking, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Jankscope } from 'react-native-jankscope';
import { blockMainThread, launchUrl } from 'skeleton-example-helpers';
import { NativeList, PlaceholderList, ShimmerPlaceholderList, FastShimmerList, StaticList } from './src/lists';

export type LibraryId = 'native' | 'placeholder' | 'shimmer' | 'fast' | 'none';
export type Scenario = 'idle' | 'js' | 'ui' | 'storm' | 'cost';

const LIBRARIES: Record<LibraryId, string> = {
  native: 'react-native-skeleton-native',
  placeholder: 'react-native-skeleton-placeholder',
  shimmer: 'react-native-shimmer-placeholder',
  fast: 'react-native-fast-shimmer',
  none: 'static rows (no animation)',
};

const START_DELAY_MS = 3000;
const BLOCK_MS = 2000;
const COST_MS = 10000;

function parse(url: string | null): { lib: LibraryId; scenario: Scenario } {
  const out = { lib: 'native' as LibraryId, scenario: 'idle' as Scenario };
  if (!url) return out;
  const query = url.split('?')[1] ?? '';
  for (const pair of query.split('&')) {
    const [k, v] = pair.split('=');
    if (k === 'lib' && v in LIBRARIES) out.lib = v as LibraryId;
    if (k === 'scenario' && ['idle', 'js', 'ui', 'storm', 'cost'].includes(v)) out.scenario = v as Scenario;
  }
  return out;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function busyJs(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy
  }
}

export default function App() {
  const [run, setRun] = React.useState<{ lib: LibraryId; scenario: Scenario; id: number } | null>(null);
  const [active, setActive] = React.useState(false);
  const [status, setStatus] = React.useState('waiting');
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    let id = 0;
    // A plain launch (no link) only shows the list; a scenario needs a link.
    const open = (url: string | null | undefined) => {
      if (url) setRun({ ...parse(url), id: ++id });
    };
    const fromLaunch = launchUrl();
    if (fromLaunch) open(fromLaunch);
    else Linking.getInitialURL().then(open);
    const sub = Linking.addEventListener('url', (e) => open(e.url));
    return () => sub.remove();
  }, []);

  React.useEffect(() => {
    if (!run) return;
    let cancelled = false;
    (async () => {
      setActive(false);
      setStatus('starting');
      await sleep(START_DELAY_MS);
      if (cancelled) return;
      if (run.scenario === 'cost') {
        setStatus('measuring');
        await Jankscope.start({ label: `cost-${run.lib}` });
        Jankscope.mark('idle');
        await sleep(COST_MS);
        const report = await Jankscope.stop();
        await Jankscope.saveReport(report, `cost-${run.lib}.json`);
        setStatus(`saved cost-${run.lib}.json`);
        return;
      }
      setActive(true);
      setStatus(run.scenario);
      await nextFrame();
      await nextFrame();
      await nextFrame();
      if (run.scenario === 'js') {
        busyJs(BLOCK_MS);
      } else if (run.scenario === 'ui') {
        blockMainThread(BLOCK_MS);
        await sleep(BLOCK_MS + 200);
      } else if (run.scenario === 'storm') {
        const end = Date.now() + BLOCK_MS;
        while (Date.now() < end && !cancelled) {
          setTick((t) => t + 1);
          await nextFrame();
        }
      } else {
        await sleep(BLOCK_MS);
      }
      if (cancelled) return;
      setActive(false);
      setStatus('done');
    })();
    return () => {
      cancelled = true;
    };
  }, [run]);

  const lib = run?.lib ?? 'native';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>{LIBRARIES[lib]}</Text>
            <Text style={styles.subtitle}>{`${run?.scenario ?? '-'} · ${status}`}</Text>
          </View>
          <View testID="marker" style={[styles.marker, active && styles.markerActive]} />
        </View>
        <View style={styles.list}>
          {lib === 'native' && <NativeList tick={tick} />}
          {lib === 'placeholder' && <PlaceholderList tick={tick} />}
          {lib === 'shimmer' && <ShimmerPlaceholderList tick={tick} />}
          {lib === 'fast' && <FastShimmerList tick={tick} />}
          {lib === 'none' && <StaticList tick={tick} />}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 64 },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#111' },
  subtitle: { fontSize: 13, color: '#555', marginTop: 2 },
  marker: { width: 40, height: 40, backgroundColor: '#000000' },
  markerActive: { backgroundColor: '#FF0000' },
  list: { flex: 1, overflow: 'hidden' },
});
