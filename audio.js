// js/audio.js — MONSTRA: WILDBOUND Modular Script

// ============================================================================
// WEB AUDIO SYNTHESIZER (FOOTSTEPS, SPLASH, CHIMES, MONSTRA CAPTURE)
// ============================================================================
let audioCtx = null;
let soundEnabled = true;

function playSound(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'step') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 22, now);
      gain.gain.setValueAtTime(0.022, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'splash') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.09);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      osc.start(now);
      osc.stop(now + 0.10);
    } else if (type === 'talk') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(690, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'catch') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(392, now);
      osc.frequency.setValueAtTime(523.25, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      osc.frequency.setValueAtTime(783.99, now + 0.3);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'quest') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.11);
      osc.frequency.setValueAtTime(659.25, now + 0.22);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'ui') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (err) {
    // Ignore audio context autoplay errors
  }
}

