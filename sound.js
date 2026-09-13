const Sound = (() => {
  let ctx = null;

  function enabled() {
    return localStorage.getItem('am_sound') !== 'off';
  }

  function init() {
    if (!enabled()) return null;

    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      ctx = new AudioContext();
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    return ctx;
  }

  function tone({
    frequency = 440,
    endFrequency = frequency,
    duration = 0.1,
    volume = 0.08,
    type = 'sine',
    delay = 0
  } = {}) {
    const audio = init();
    if (!audio) return;

    const now = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      now + duration
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function noise({
    duration = 0.08,
    volume = 0.05,
    filterFrequency = 1200,
    delay = 0
  } = {}) {
    const audio = init();
    if (!audio) return;

    const now = audio.currentTime + delay;
    const bufferSize = Math.max(
      1,
      Math.floor(audio.sampleRate * duration)
    );

    const buffer = audio.createBuffer(
      1,
      bufferSize,
      audio.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();

    source.buffer = buffer;

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFrequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);

    source.start(now);
    source.stop(now + duration + 0.01);
  }

  // 🏹 Flèche correctement libérée : petit whoosh descendant
  function arrowReleased() {
    noise({
      duration: 0.13,
      volume: 0.045,
      filterFrequency: 1800
    });

    tone({
      frequency: 520,
      endFrequency: 180,
      duration: 0.16,
      volume: 0.035,
      type: 'triangle'
    });
  }

  // ❌ Flèche bloquée : petit toc / bump
  function arrowBlocked() {
    tone({
      frequency: 145,
      endFrequency: 75,
      duration: 0.075,
      volume: 0.09,
      type: 'sine'
    });

    noise({
      duration: 0.045,
      volume: 0.025,
      filterFrequency: 700,
      delay: 0.01
    });
  }

  // 💡 Indice : confirmation légère
  function hint() {
    tone({
      frequency: 620,
      endFrequency: 780,
      duration: 0.09,
      volume: 0.055,
      type: 'sine'
    });

    tone({
      frequency: 780,
      endFrequency: 980,
      duration: 0.11,
      volume: 0.05,
      type: 'sine',
      delay: 0.075
    });
  }

  // 🎉 Niveau terminé : petite mélodie de victoire
  function victory() {
    tone({
      frequency: 523.25,
      duration: 0.13,
      volume: 0.055,
      type: 'sine'
    });

    tone({
      frequency: 659.25,
      duration: 0.13,
      volume: 0.055,
      type: 'sine',
      delay: 0.11
    });

    tone({
      frequency: 783.99,
      duration: 0.18,
      volume: 0.065,
      type: 'sine',
      delay: 0.22
    });

    tone({
      frequency: 1046.5,
      duration: 0.28,
      volume: 0.055,
      type: 'sine',
      delay: 0.36
    });
  }

  // 💔 Plus de vies : petite descente
  function gameOver() {
    tone({
      frequency: 330,
      endFrequency: 230,
      duration: 0.18,
      volume: 0.065,
      type: 'triangle'
    });

    tone({
      frequency: 230,
      endFrequency: 155,
      duration: 0.25,
      volume: 0.06,
      type: 'triangle',
      delay: 0.16
    });
  }

  // ▶️ Lancement d'un niveau : discret
  function levelStart() {
    tone({
      frequency: 330,
      endFrequency: 440,
      duration: 0.09,
      volume: 0.035,
      type: 'sine'
    });
  }

  // ⏭️ Niveau suivant : transition
  function levelNext() {
    tone({
      frequency: 440,
      endFrequency: 660,
      duration: 0.11,
      volume: 0.045,
      type: 'sine'
    });

    tone({
      frequency: 660,
      endFrequency: 880,
      duration: 0.13,
      volume: 0.045,
      type: 'sine',
      delay: 0.08
    });
  }

  return Object.freeze({
    init,
    arrowReleased,
    arrowBlocked,
    hint,
    victory,
    gameOver,
    levelStart,
    levelNext
  });
})();
