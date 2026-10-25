/** A local, short chime. Context creation/resume happens only in a user gesture. */
export class NotificationSound {
  private context: AudioContext | null = null
  private voices = new Set<OscillatorNode>()
  private generation = 0
  private onReady: (ready: boolean) => void
  constructor(onReady: (ready: boolean) => void) { this.onReady = onReady }

  async activate() {
    const generation = ++this.generation
    try {
      this.context ??= new AudioContext()
      this.context.onstatechange = () => this.onReady(this.context?.state === 'running')
      await this.context.resume()
      if (generation !== this.generation) return
      this.onReady(this.context.state === 'running')
      this.play()
    } catch {
      if (generation === this.generation) this.onReady(false)
    }
  }

  play() {
    const context = this.context
    if (!context || context.state !== 'running') { this.onReady(false); return }
    this.stopVoices()
    const now = context.currentTime
    for (const [frequency, offset] of [[660, 0], [880, 0.12]]) {
      const oscillator = context.createOscillator(), gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, now + offset)
      gain.gain.linearRampToValueAtTime(0.075, now + offset + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22)
      oscillator.connect(gain); gain.connect(context.destination)
      this.voices.add(oscillator)
      oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect() }
      oscillator.start(now + offset); oscillator.stop(now + offset + 0.24)
    }
  }

  private stopVoices() {
    for (const voice of this.voices) { voice.stop(); voice.disconnect() }
    this.voices.clear()
  }
  stop() { ++this.generation; this.stopVoices() }
  dispose() {
    this.stop()
    if (this.context) { this.context.onstatechange = null; void this.context.close().catch(() => {}) }
    this.context = null
  }
}
