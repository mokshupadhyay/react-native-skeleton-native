import { NativeModules } from 'react-native';

/** Busy-waits on the UI/main thread for `ms`. Example app only. */
export function blockMainThread(ms) {
  NativeModules.SkeletonExampleBusy.blockMainThread(ms);
}

/** iOS: the link passed with `-skeletonUrl` at launch, or null. */
export function launchUrl() {
  const m = NativeModules.SkeletonExampleBusy;
  const c = m && (typeof m.getConstants === 'function' ? m.getConstants() : m);
  return (c && c.launchUrl) || null;
}
