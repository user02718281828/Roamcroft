// Original generative ambient score; audio begins only after a player gesture.
import { spatialAmbience } from './ambience.ts';
import type { AcousticCamera } from './ambience.ts';
import type { State } from './model.ts';
export class ValleyAudio {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  enabled = false;
  clock = 0;
  note = 0;
  lastBird = 0;
  river: AudioBufferSourceNode | null = null;
  riverGain: GainNode | null = null;
  riverPan: StereoPannerNode | null = null;
  birdMix = { gain: 0, pan: 0 };
  async enable(value: boolean) {
    this.enabled = value;
    if (value) {
      try {
        if (!this.context) {
          this.context = new AudioContext();
          this.master = this.context.createGain();
          this.master.gain.value = 0.11;
          this.master.connect(this.context.destination);
          const c = this.context;
          const buffer = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
          const samples = buffer.getChannelData(0);
          let smooth = 0;
          for (let i = 0; i < samples.length; i++) {
            smooth = (smooth + (Math.random() * 2 - 1) * 0.04) / 1.025;
            samples[i] = smooth * 3;
          }
          this.river = c.createBufferSource();
          this.river.buffer = buffer;
          this.river.loop = true;
          const filter = c.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1400;
          this.riverGain = c.createGain();
          this.riverGain.gain.value = 0;
          this.riverPan = c.createStereoPanner();
          this.river
            .connect(filter)
            .connect(this.riverGain)
            .connect(this.riverPan)
            .connect(this.master);
          this.river.start();
        }
        await this.context.resume();
        this.master!.gain.setTargetAtTime(0.11, this.context.currentTime, 0.2);
      } catch {
        this.enabled = false;
      }
    } else if (this.context && this.master)
      this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.1);
    return this.enabled;
  }
  tone(
    frequency: number,
    duration: number,
    volume = 0.2,
    type: OscillatorType = 'sine',
    delay = 0,
    pan = 0,
  ) {
    if (!this.enabled || !this.context || !this.master || volume <= 0) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain(),
      stereo = c.createStereoPanner(),
      at = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(frequency, at);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(volume, at + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    o.connect(g);
    stereo.pan.value = pan;
    g.connect(stereo).connect(this.master);
    o.start(at);
    o.stop(at + duration + 0.05);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
      stereo.disconnect();
    };
  }
  effect(kind: 'good' | 'bad' | 'info') {
    if (kind === 'good') {
      this.tone(660, 0.32, 0.18);
      this.tone(880, 0.5, 0.12, 'sine', 0.08);
    } else if (kind === 'bad') this.tone(160, 0.25, 0.18, 'triangle');
    else this.tone(390, 0.1, 0.08);
  }
  tick(dt: number, night: boolean) {
    if (!this.enabled) return;
    this.clock += dt;
    this.lastBird += dt;
    if (this.clock > 1.3) {
      this.clock -= 1.3;
      const notes = [0, 4, 7, 11, 7, 4, 2, 7, 9, 7, 4, 2, 0, 7, 4, 2],
        n = notes[this.note++ % notes.length],
        root = night ? 146.83 : 196;
      this.tone(root * Math.pow(2, n / 12), 2.3, 0.15, 'sine');
      if (this.note % 4 === 0) {
        this.tone(root / 2, 5, 0.12, 'triangle');
        this.tone(root * 0.75, 4.5, 0.09);
      }
    }
    if (this.lastBird > 9 && !night) {
      this.lastBird = 0;
      const { gain, pan } = this.birdMix;
      this.tone(1600, 0.14, 0.3 * gain, 'sine', 0, pan);
      this.tone(2000, 0.13, 0.2 * gain, 'sine', 0.13, pan);
      this.tone(1780, 0.18, 0.15 * gain, 'sine', 0.3, pan);
    }
  }
  ambience(s: State, camera: AcousticCamera, paused: boolean) {
    const mix = spatialAmbience(s, camera);
    this.birdMix = paused ? { gain: 0, pan: 0 } : mix.birds;
    if (!this.context || !this.riverGain || !this.riverPan) return;
    const at = this.context.currentTime;
    this.riverGain.gain.setTargetAtTime(
      paused ? 0 : mix.river.gain * 0.65,
      at,
      0.3,
    );
    this.riverPan.pan.setTargetAtTime(mix.river.pan, at, 0.3);
  }
  dispose() {
    this.river?.stop();
    this.river?.disconnect();
    this.river = null;
    void this.context?.close();
    this.context = null;
    this.master = null;
  }
}
