const AudioFX = {
  ctx: null,
  master: null,

  init() {
    if (this.ctx) return;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.ctx.destination);

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  play(freq, duration = 0.08, type = "sine", volume = 0.3, slideTo = 0) {
    if (!State.current.settings.sound) return;

    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(now);
    osc.stop(now + duration + 0.03);
  },

  click() {
    this.play(500, 0.05, "triangle", 0.25, 700);
  },

  crit() {
    this.play(880, 0.12, "square", 0.22, 1760);
  },

  buy() {
    this.play(440, 0.09, "sine", 0.3, 880);
  },

  unlock() {
    this.play(660, 0.09, "triangle", 0.28, 990);
    setTimeout(() => this.play(990, 0.12, "triangle", 0.25, 1320), 80);
  },

  event() {
    this.play(740, 0.1, "sawtooth", 0.18, 1180);
  },

  error() {
    this.play(180, 0.12, "square", 0.18, 120);
  },

  prestige() {
    [440, 660, 880, 1320].forEach((freq, i) => {
      setTimeout(() => this.play(freq, 0.14, "triangle", 0.25, freq * 1.5), i * 90);
    });
  },

  win() {
    [660, 880, 990, 1320].forEach((freq, i) => {
      setTimeout(() => this.play(freq, 0.12, "triangle", 0.24, freq * 1.2), i * 70);
    });
  },

  lose() {
    this.play(320, 0.14, "sawtooth", 0.2, 120);
  },

  boss() {
    this.play(120, 0.25, "sawtooth", 0.28, 60);
    setTimeout(() => this.play(90, 0.3, "square", 0.22, 45), 120);
  }
};