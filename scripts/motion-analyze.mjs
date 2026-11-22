// Measure whether a region of a screen recording kept moving.
//
// The recording is resampled to a constant frame rate with ffmpeg (screen
// recorders on Android and the iOS simulator only emit a frame when something
// on screen changed, so a frozen screen produces duplicate frames here). The
// region is cropped, scaled to 160 px wide and converted to 8-bit grey. Two
// consecutive frames count as "changed" when the mean absolute difference of
// their pixels is above --threshold grey levels.
//
// Usage:
//   node scripts/motion-analyze.mjs <video> --crop w:h:x:y [--fps 60] [--threshold 0.6]
//     [--from seconds] [--to seconds] [--marker w:h:x:y --window seconds] [--json]
//
// With --marker, the analysed window starts at the first frame where the marker
// region is red (the example app turns it red right before a block) and lasts
// --window seconds.
//
// Prints the number of frames, changed and identical transitions, and the
// longest run of identical frames (the longest frozen stretch) in ms.
import { spawn } from 'node:child_process';

function parseArgs(argv) {
  const out = { fps: 60, threshold: 0.6, from: 0, to: 0, json: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--crop') out.crop = argv[++i];
    else if (a === '--fps') out.fps = Number(argv[++i]);
    else if (a === '--threshold') out.threshold = Number(argv[++i]);
    else if (a === '--from') out.from = Number(argv[++i]);
    else if (a === '--to') out.to = Number(argv[++i]);
    else if (a === '--json') out.json = true;
    else if (a === '--marker') out.marker = argv[++i];
    else if (a === '--window') out.window = Number(argv[++i]);
    else rest.push(a);
  }
  out.video = rest[0];
  return out;
}

export function analyzeDiffs(diffs, fps, threshold) {
  let changed = 0;
  let identical = 0;
  let run = 0;
  let longest = 0;
  let longestAt = -1;
  diffs.forEach((d, i) => {
    if (d > threshold) {
      changed++;
      run = 0;
    } else {
      identical++;
      run++;
      if (run > longest) {
        longest = run;
        longestAt = i - run + 1;
      }
    }
  });
  const frameMs = 1000 / fps;
  return {
    transitions: diffs.length,
    changed,
    identical,
    // A run of n identical transitions means the same image was on screen for n + 1 frames.
    longestFrozenMs: longest === 0 ? 0 : Math.round((longest + 1) * frameMs),
    longestFrozenStartS: longestAt < 0 ? null : Number((longestAt * frameMs / 1000).toFixed(2)),
  };
}

async function readFrames(video, vf, size, onFrame, from, to) {
  const args = ['-v', 'error'];
  if (from) args.push('-ss', String(from));
  args.push('-i', video);
  if (to) args.push('-t', String(to - (from || 0)));
  args.push('-vf', vf, '-f', 'rawvideo', '-');
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  let buf = Buffer.alloc(0);
  for await (const chunk of ff.stdout) {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= size) {
      onFrame(buf.subarray(0, size));
      buf = buf.subarray(size);
    }
  }
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg failed');
}

/** Time (s) of the first frame whose marker region is mostly red, or null. */
async function findMarker(video, crop, fps) {
  let index = 0;
  let found = null;
  await readFrames(video, `fps=${fps},crop=${crop},scale=8:8,format=rgb24`, 8 * 8 * 3, (f) => {
    if (found === null) {
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < f.length; i += 3) { r += f[i]; g += f[i + 1]; b += f[i + 2]; }
      const n = f.length / 3;
      if (r / n > 150 && g / n < 90 && b / n < 90) found = index / fps;
    }
    index++;
  });
  return found;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.video || !o.crop) {
    console.error('usage: motion-analyze.mjs <video> --crop w:h:x:y [--fps 60] [--threshold 0.6] [--from s] [--to s] [--json]');
    process.exit(2);
  }
  let markerAt = null;
  if (o.marker) {
    markerAt = await findMarker(o.video, o.marker, o.fps);
    if (markerAt === null) {
      console.error('marker never turned red');
      process.exit(1);
    }
    o.from = markerAt;
    o.to = markerAt + (o.window || 2);
  }
  const [cw, ch] = o.crop.split(':').map(Number);
  const W = 160;
  const H = Math.max(2, Math.round((ch / cw) * W / 2) * 2);
  const args = ['-v', 'error'];
  if (o.from) args.push('-ss', String(o.from));
  args.push('-i', o.video);
  if (o.to) args.push('-t', String(o.to - (o.from || 0)));
  args.push('-vf', `fps=${o.fps},crop=${o.crop},scale=${W}:${H}:flags=area,format=gray`, '-f', 'rawvideo', '-');
  const ff = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'inherit'] });
  const size = W * H;
  let buf = Buffer.alloc(0);
  let prev = null;
  const diffs = [];
  for await (const chunk of ff.stdout) {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= size) {
      const frame = buf.subarray(0, size);
      if (prev) {
        let sum = 0;
        for (let i = 0; i < size; i++) sum += Math.abs(frame[i] - prev[i]);
        diffs.push(sum / size);
      }
      prev = Buffer.from(frame);
      buf = buf.subarray(size);
    }
  }
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) process.exit(1);
  const result = { video: o.video, crop: o.crop, fps: o.fps, threshold: o.threshold, from: o.from, to: o.to, ...analyzeDiffs(diffs, o.fps, o.threshold) };
  if (o.json) console.log(JSON.stringify(result));
  else console.log(result);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
