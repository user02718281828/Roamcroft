// Opt-in production diagnostics (?profile=1). No gameplay state or network data is exported.
import { translate } from '../i18n/core.ts';
import { subscribeLocale } from '../i18n/locale.ts';
export function distribution(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    sum = values.reduce((a, b) => a + b, 0);
  const at = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * q) - 1)];
  return {
    samples: values.length,
    mean: sum / values.length,
    p95: at(0.95),
    p99: at(0.99),
    max: sorted[sorted.length - 1],
  };
}
export class FrameProfile {
  enabled = false;
  recording = false;
  until = 0;
  frames: number[] = [];
  phases = new Map<string, number[]>();
  metadata: Record<string, unknown> = {};
  private panel?: HTMLElement;
  private output?: HTMLElement;
  private observer?: PerformanceObserver;
  private unsubscribeLocale?: () => void;
  start(seconds = 30) {
    this.frames = [];
    this.phases.clear();
    this.until = performance.now() + seconds * 1000;
    this.recording = true;
  }
  add(name: string, ms: number) {
    if (!this.recording) return;
    let values = this.phases.get(name);
    if (!values) this.phases.set(name, (values = []));
    if (values.length < 20000) values.push(ms);
  }
  begin() {
    return this.recording ? performance.now() : 0;
  }
  end(name: string, start: number) {
    if (start) this.add(name, performance.now() - start);
  }
  frame(ms: number, eligible: boolean) {
    if (!this.recording) return;
    if (eligible && ms > 0 && this.frames.length < 20000) this.frames.push(ms);
    if (performance.now() >= this.until) {
      this.recording = false;
      this.publish();
    }
  }
  summary() {
    const frames = distribution(this.frames),
      slow = [...this.frames]
        .sort((a, b) => b - a)
        .slice(0, Math.max(1, Math.ceil(this.frames.length * 0.01)));
    return {
      frames,
      averageFps: frames ? 1000 / frames.mean : null,
      onePercentLowFps: slow.length
        ? 1000 / (slow.reduce((a, b) => a + b, 0) / slow.length)
        : null,
      phases: Object.fromEntries(
        [...this.phases].map(([key, values]) => [key, distribution(values)]),
      ),
      ...this.metadata,
    };
  }
  publish() {
    if (this.output) {
      this.output.textContent = JSON.stringify(this.summary());
      this.output.dataset.status = 'complete';
    }
  }
  mount() {
    if (
      typeof window === 'undefined' ||
      new URLSearchParams(location.search).get('profile') !== '1'
    )
      return;
    this.enabled = true;
    const panel = document.createElement('details');
    panel.style.cssText =
      'position:fixed;right:8px;bottom:70px;z-index:1000;background:#10271eee;color:white;padding:8px;max-width:360px;font:12px monospace';
    const title = document.createElement('summary');
    title.textContent = translate('profile.title');
    panel.appendChild(title);
    const button = document.createElement('button');
    button.textContent = translate('profile.start');
    button.style.cssText = 'padding:10px';
    button.onclick = () => {
      this.start();
      output.textContent = translate('profile.recording');
      output.dataset.status = 'recording';
    };
    panel.appendChild(button);
    const output = document.createElement('pre');
    output.id = 'frame-profile';
    output.style.cssText =
      'max-height:180px;overflow:auto;white-space:pre-wrap';
    panel.appendChild(output);
    this.unsubscribeLocale = subscribeLocale(() => {
      title.textContent = translate('profile.title');
      button.textContent = translate('profile.start');
      if (output.dataset.status === 'recording') output.textContent = translate('profile.recording');
    });
    this.panel = panel;
    this.output = output;
    document.body.appendChild(panel);
    if (typeof PerformanceObserver !== 'undefined')
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            this.add('longTask', entry.duration);
        });
        this.observer.observe({ type: 'longtask', buffered: false });
      } catch {}
  }
  dispose() {
    this.unsubscribeLocale?.();
    this.observer?.disconnect();
    this.panel?.remove();
    this.recording = false;
    this.enabled = false;
  }
}
export const frameProfile = new FrameProfile();

// Queries are polled only after completion; never gl.finish/readPixels or a blocking wait.
export class GpuTimer {
  private extension: any;
  private pending: { query: WebGLQuery; generation: number }[] = [];
  private current: WebGLQuery | null = null;
  private gl: WebGL2RenderingContext;
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.extension = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    frameProfile.metadata.renderer = info
      ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
  }
  begin() {
    const gl = this.gl,
      ext = this.extension;
    frameProfile.metadata.gpuTimer = ext
      ? 'EXT_disjoint_timer_query_webgl2'
      : 'unavailable';
    if (!ext) return;
    const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
    while (
      this.pending.length &&
      (disjoint ||
        gl.getQueryParameter(this.pending[0].query, gl.QUERY_RESULT_AVAILABLE))
    ) {
      const sample = this.pending.shift()!;
      if (!disjoint && sample.generation === frameProfile.until)
        frameProfile.add(
          'gpuRender',
          gl.getQueryParameter(sample.query, gl.QUERY_RESULT) / 1e6,
        );
      gl.deleteQuery(sample.query);
    }
    if (!frameProfile.recording || this.pending.length >= 8) return;
    this.current = gl.createQuery();
    if (this.current) gl.beginQuery(ext.TIME_ELAPSED_EXT, this.current);
  }
  end() {
    if (this.current) {
      this.gl.endQuery(this.extension.TIME_ELAPSED_EXT);
      this.pending.push({
        query: this.current,
        generation: frameProfile.until,
      });
      this.current = null;
    }
  }
  dispose() {
    for (const item of this.pending) this.gl.deleteQuery(item.query);
    this.pending = [];
  }
}
