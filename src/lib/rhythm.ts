export const clampBpm = (value: number) => Math.max(20, Math.min(240, Math.round(value || 80)));
export function tapTempo(taps: number[]): number | null {
  if (taps.length < 3) return null;
  const gaps = taps.slice(1).map((time, i) => time - taps[i]);
  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const consistent = gaps.filter((gap) => Math.abs(gap - median) <= median * 0.3);
  if (consistent.length < 2) return null;
  return clampBpm(60000 / (consistent.reduce((a, b) => a + b, 0) / consistent.length));
}
export interface Click {
  time: number;
  beat: number;
  accent: boolean;
}
export class BeatClock {
  next = 0;
  beat = 0;
  private last = 0;
  private previousBpm = 80;
  private started = false;
  start(now: number, bpm: number) {
    this.next = now + 0.04;
    this.last = this.next - 60 / bpm;
    this.beat = 0;
    this.previousBpm = bpm;
    this.started = true;
  }
  schedule(now: number, bpm: number, beats: number): Click[] {
    if (!this.started) return [];
    if (bpm !== this.previousBpm) {
      this.next = Math.max(now + 0.01, this.last + 60 / bpm);
      this.previousBpm = bpm;
    }
    // Do not play a burst of missed beats after a suspended tab wakes up.
    if (this.next < now - 0.1) this.next = now + 0.02;
    const clicks: Click[] = [];
    while (this.next < now + 0.08) {
      this.beat %= beats;
      clicks.push({ time: this.next, beat: this.beat, accent: this.beat === 0 });
      this.last = this.next;
      this.next += 60 / bpm;
      this.beat = (this.beat + 1) % beats;
    }
    return clicks;
  }
}
