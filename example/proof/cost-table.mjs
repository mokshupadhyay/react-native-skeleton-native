// Summarise jankscope cost reports (cost-<lib>.json) into one table row each.
// UI-thread time per frame = mean of stages.mount + stages.uiOther over all
// frames of the idle segment. On Android it also prints the mean FrameMetrics
// UI-thread stages (input + animation + layout/measure + draw + sync) of drawn frames.
// Usage: node example/proof/cost-table.mjs <folder>...
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
for (const dir of process.argv.slice(2)) {
  for (const f of readdirSync(dir).filter((n) => /^cost-.*\.json$/.test(n)).sort()) {
    const r = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const seg = r.segments.find((s) => s.name === 'idle') ?? r.summary;
    const frames = r.frames.filter((fr) => fr.t >= (seg.startMs ?? 0) && fr.t < (seg.endMs ?? Infinity));
    const ui = mean(frames.map((fr) => fr.stages.mount + fr.stages.uiOther));
    const uiTotal = frames.reduce((a, fr) => a + fr.stages.mount + fr.stages.uiOther, 0);
    const durationS = (seg.durationMs ?? 10000) / 1000;
    const drawn = frames.filter((fr) => fr.android);
    const fm = mean(drawn.map((fr) => fr.android.input + fr.android.animation + fr.android.layoutMeasure + fr.android.draw + fr.android.sync));
    console.log(JSON.stringify({
      file: join(dir, f),
      platform: r.platform,
      device: r.device.model,
      buildType: r.buildType,
      architecture: r.architecture,
      frames: seg.frameCount,
      jankyPct: Number(seg.jankyPct.toFixed(2)),
      p95FrameMs: Number(seg.p95FrameMs.toFixed(2)),
      uiMsPerFrame: Number(ui.toFixed(3)),
      uiMsPerSecond: Number((uiTotal / durationS).toFixed(1)),
      durationMs: seg.durationMs,
      drawnFrames: drawn.length,
      androidUiStagesMsPerDrawnFrame: drawn.length ? Number(fm.toFixed(3)) : null,
      androidUiStagesMsPerSecond: r.platform === 'android' ? Number(((drawn.length ? fm * drawn.length : 0) / durationS).toFixed(1)) : null,
    }));
  }
}
