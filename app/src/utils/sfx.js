// Pequeno gerador de beep via Web Audio API (sem libs)
let ctx;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // retoma se estiver suspended (alguns browsers pausam ao trocar de aba)
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/**
 * playSfx('success' | 'warning' | 'error' | 'cancel')
 * Sons curtinhos e discretos, executados em interação de usuário (cliques).
 */
export function playSfx(type = "success") {
  const ac = getCtx();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);

  // Envelopes
  const now = ac.currentTime;
  const dur = 0.15; // 150ms por tom
  const gap = 0.05;

  const setTone = (freq, startTime) => {
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.cancelScheduledValues(startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
  };

  switch (type) {
    case "warning":
      osc.type = "triangle";
      setTone(520, now);
      setTone(440, now + dur + gap);
      break;
    case "error":
      osc.type = "square";
      setTone(300, now);
      setTone(240, now + dur + gap);
      break;
    case "cancel":
      osc.type = "sine";
      setTone(380, now);
      break;
    case "success":
    default:
      osc.type = "sine";
      setTone(660, now);
      setTone(880, now + dur + gap);
      break;
  }

  osc.start(now);
  osc.stop(now + dur * 2 + gap + 0.02);
}
