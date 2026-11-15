// Sound effects made with the browser's built-in Web Audio API.
// No audio files and no downloads are needed.

let audioCtx = null
let muted = false

try {
  muted = localStorage.getItem('marsx-muted') === '1'
} catch {
  muted = false
}

export const isMuted = () => muted

export function setMuted(value) {
  muted = value
  try {
    localStorage.setItem('marsx-muted', value ? '1' : '0')
  } catch {
    /* storage not available */
  }
}

function getCtx() {
  if (muted) return null
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      audioCtx = new AC()
    }
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function tone(freq, start, dur, type = 'sine', vol = 0.06) {
  const c = getCtx()
  if (!c) return
  try {
    const t0 = c.currentTime + start
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.03)
  } catch {
    /* ignore audio errors */
  }
}

export const sfx = {
  click() {
    tone(720, 0, 0.06, 'square', 0.025)
  },
  good() {
    tone(523, 0, 0.12, 'triangle', 0.07)
    tone(659, 0.11, 0.12, 'triangle', 0.07)
    tone(784, 0.22, 0.2, 'triangle', 0.07)
  },
  bad() {
    tone(300, 0, 0.18, 'sawtooth', 0.05)
    tone(210, 0.18, 0.28, 'sawtooth', 0.05)
  },
  alarm() {
    tone(880, 0, 0.16, 'sawtooth', 0.045)
    tone(660, 0.2, 0.16, 'sawtooth', 0.045)
    tone(880, 0.4, 0.16, 'sawtooth', 0.045)
    tone(660, 0.6, 0.16, 'sawtooth', 0.045)
  },
  radio() {
    tone(1200, 0, 0.05, 'sine', 0.04)
    tone(1500, 0.09, 0.05, 'sine', 0.04)
    tone(1200, 0.18, 0.08, 'sine', 0.04)
  },
  win() {
    ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.25, 'triangle', 0.08))
  },
  lose() {
    ;[392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.35, 'sawtooth', 0.05))
  },
}