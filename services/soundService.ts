// Sophisticated Web Audio API Synthesizer
// Uses noise buffers and filters for better "Whoosh" and "Impact" sounds

let audioCtx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  // Create white noise buffer once
  if (!noiseBuffer) {
      const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
      noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
  }
  return audioCtx;
};

// Helper for Tone (Oscillator)
const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1, slideTo?: number) => {
  const ctx = initAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  }
  
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

// Helper for Noise (Whoosh/Explosion)
const playNoise = (duration: number, playbackRate: number = 1, filterFreq: number = 1000, vol: number = 0.2, filterSweep: boolean = false) => {
    const ctx = initAudio();
    if (!noiseBuffer) return;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.playbackRate.value = playbackRate;

    const filter = ctx.createBiquadFilter();
    filter.type = filterSweep ? 'bandpass' : 'lowpass';
    filter.Q.value = filterSweep ? 1 : 0.5;
    filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
    if (filterSweep) {
        filter.frequency.exponentialRampToValueAtTime(filterFreq / 8, ctx.currentTime + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + duration);
};

export const SoundService = {
  playJump: () => {
    // Soft rising tone, less 8-bit
    playTone(150, 'sine', 0.2, 0.1, 300);
  },

  playAttack: () => {
    // Sharp "Schwing" sound
    // Very high bandpass sweep
    playNoise(0.12, 1.0, 3000, 0.4, true); 
  },

  playHit: () => {
    // Player getting hit
    playTone(150, 'sawtooth', 0.2, 0.1, 50);
  },

  playEnemyHit: () => {
      // Impactful Crunch
      const ctx = initAudio();
      const t = ctx.currentTime;
      
      // 1. Kick (Low punch)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // rounder kick
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + 0.1);

      // 2. Crunch (Mid-freq noise burst)
      playNoise(0.1, 0.8, 1200, 0.25, false);
  },

  playMagicFireball: () => {
      // Sizzling Whoosh
      playNoise(0.3, 1.0, 1500, 0.2, true);
      playTone(400, 'triangle', 0.3, 0.1, 100);
  },

  playMagicThunder: () => {
      // Crackle Noise
      playNoise(0.4, 2.0, 3000, 0.3, true); // High pitch noise
      playTone(50, 'sawtooth', 0.4, 0.2, 200); // Underlying buzz
  },

  playMagicIce: () => {
      // Glassy/Chime
      playTone(1200, 'sine', 0.3, 0.1);
      setTimeout(() => playTone(1800, 'sine', 0.2, 0.05), 50);
      setTimeout(() => playTone(2400, 'sine', 0.2, 0.05), 100);
  },

  playMagicExplosion: () => {
      // Deep Boom
      playNoise(0.8, 0.3, 200, 0.5, false); // Low rumble
      playTone(80, 'square', 0.5, 0.3, 20); // Sub-bass kick
  },

  playCoin: () => {
    // Clean high ping
    playTone(1400, 'sine', 0.1, 0.05);
    setTimeout(() => playTone(2000, 'sine', 0.3, 0.05), 50);
  },
  
  playDrink: () => {
      // Bubbling sound
      playTone(400, 'triangle', 0.1, 0.1, 600);
      setTimeout(() => playTone(500, 'triangle', 0.1, 0.1, 700), 100);
  },

  playEquip: () => {
      // Metallic Shwing
      const ctx = initAudio();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth'; // rich harmonics
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(1600, t + 0.15); // Slide up
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      // Highpass to make it thin/metallic
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(t + 0.3);
  },

  playLevelUp: () => {
    // Fanfare
    const ctx = initAudio();
    const now = ctx.currentTime;
    // Major chord arpeggio with longer sustain
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // C Major
        playTone(freq, 'triangle', 0.6, 0.1);
        setTimeout(() => playTone(freq, 'triangle', 0.4, 0.1), i * 120);
    });
  }
};