// birds.js — Farnell-style AM/FM birds + flock manager (no auto-connect to destination)

const T60_MULTIPLIER = 6.90776;
const FREQ_MULTIPLIER = 7000;
const FREQ_OFFSET = 300;
const MAX_ATTACK_DECAY_TIME = 0.9;
const ENVELOPE_FREQ_MULTIPLIER = 3000;

/* ------------------------- Preset bank (normalized) ------------------------ */
export const PRESETS = {
  "lesser-spotted-grinchwarbler": {
    ifrq: 0.55102, atk: 0.591837, dcy: 0.187755,
    fmod1: 0.0716327, atkf1: 0.0204082, dcyf1: 0.346939,
    fmod2: 0.0204082, atkf2: 0.55102, dcyf2: 0.122449,
    amod1: 0.632653, atka1: 1, dcya1: 0.612245,
    amod2: 0.346939, atka2: 0.816327, dcya2: 0.653061
  },
  "speckled-throated-spew": {
    ifrq: 0.183673, atk: 0.591837, dcy: 0.387755,
    fmod1: 0.0104082, atkf1: 0.530612, dcyf1: 0.346939,
    fmod2: 0.244898, atkf2: 0.55102, dcyf2: 0.122449,
    amod1: 0.387755, atka1: 1, dcya1: 0.612245,
    amod2: 0.346939, atka2: 0.816327, dcya2: 0.653061
  },
  "triple-tailed-tree-troubler": {
    ifrq: 0.387755, atk: 0.0204082, dcy: 0.204082,
    fmod1: 0.367347, atkf1: 0.571429, dcyf1: 0.734694,
    fmod2: 0.918367, atkf2: 1, dcyf2: 0.77551,
    amod1: 0.571429, atka1: 0.367347, dcya1: 0.22449,
    amod2: 0.0204082, atka2: 0.183673, dcya2: 0.44898
  },
  "long-toed-mudhopper": {
    ifrq: 0.163265, atk: 0.22449, dcy: 0.183673,
    fmod1: 0.00306122, atkf1: 0.122449, dcyf1: 1,
    fmod2: 0.0612245, atkf2: 1, dcyf2: 0.77551,
    amod1: 0.979592, atka1: 0.204082, dcya1: 0.734694,
    amod2: 1, atka2: 0.142857, dcya2: 0.612245
  },
  "yellow-yiffled-yaffle": {
    ifrq: 0.0204082, atk: 0.367347, dcy: 0.183673,
    fmod1: 0.0612245, atkf1: 0, dcyf1: 1,
    fmod2: 0.285714, atkf2: 0.22449, dcyf2: 0.489796,
    amod1: 0.367347, atka1: 0.387755, dcya1: 0.734694,
    amod2: 0.204082, atka2: 0.428571, dcya2: 0.142857
  },
  "pointy-beaked-beetlefiend": {
    ifrq: 0.388571, atk: 0.204082, dcy: 0.309796,
    fmod1: 0.0204082, atkf1: 0.795918, dcyf1: 0.591837,
    fmod2: 0.285714, atkf2: 0.22449, dcyf2: 0.489796,
    amod1: 0.204082, atka1: 0.836735, dcya1: 0.734694,
    amod2: 0.77551, atka2: 0.428571, dcya2: 0.142857
  },
  "african-boojuboolubala": {
    ifrq: 0.306122, atk: 0.959184, dcy: 0.0408163,
    fmod1: 1, atkf1: 0, dcyf1: 0.591837,
    fmod2: 0.285714, atkf2: 0.22449, dcyf2: 0.489796,
    amod1: 0.204082, atka1: 0.836735, dcya1: 0.734694,
    amod2: 0.77551, atka2: 0.428571, dcya2: 0.142857
  },
  "common-muckoink": {
    ifrq: 0.0204082, atk: 0.8, dcy: 0.0816327,
    fmod1: 0.0204082, atkf1: 0.001, dcyf1: 0.99,
    fmod2: 0.0204082, atkf2: 0.01, dcyf2: 1,
    amod1: 1, atka1: 0.142857, dcya1: 0.734694,
    amod2: 1, atka2: 0.0612245, dcya2: 0.530612
  }
};

/* ------------------------------ Building blocks ---------------------------- */

class EnvelopeADSR {
  constructor(ac, param, attack = 0.9, decay = 0.9, minVal = 0, maxVal = 1) {
    this.ac = ac;
    this.param = param;
    this.attackTime = attack;
    this.decayTime = decay;
    this.minValue = minVal;
    this.maxValue = maxVal;
    this.oneSample = 1 / ac.sampleRate;
  }
  trigger(t = this.ac.currentTime) {
    const p = this.param;
    p.cancelScheduledValues(t);
    p.setValueAtTime(this.minValue, t);
    p.setTargetAtTime(this.maxValue, t, this.attackTime / T60_MULTIPLIER);
    p.setTargetAtTime(this.minValue, t + this.attackTime + this.oneSample, this.decayTime / T60_MULTIPLIER);
  }
  set maxValue(v) { this._max = v; }
  get maxValue() { return this._max; }
}

class BirdAM {
  constructor(ac) {
    this.ac = ac;
    this.modOsc = new OscillatorNode(ac);
    this.modGain = new GainNode(ac);
    this.mixGain = new GainNode(ac);
    this.modOsc.connect(this.modGain);
    this.modGain.connect(this.mixGain.gain);
    this.mixGain.gain.value = 1;
  }
  connect(dest) { this.mixGain.connect(dest); }
  start(t) { this.modOsc.start(t); }
  getModulatorFrequency() { return this.modOsc.frequency; }
  getModulatorGain() { return this.modGain.gain; }
  getMixerNode() { return this.mixGain; }
}

class BirdFM {
  constructor(ac) {
    this.ac = ac;
    this.modOsc = new OscillatorNode(ac);
    this.modGainStage = new GainNode(ac);
    this.modToFreq = new GainNode(ac); // extra stage for flexibility
    this.carrier = new OscillatorNode(ac);

    this.modOsc.connect(this.modGainStage);
    this.modGainStage.connect(this.modToFreq);
    this.modToFreq.connect(this.carrier.frequency);

    this.modGainStage.gain.value = 1;
    this.modToFreq.gain.value = 300;
  }
  connect(dest) { this.carrier.connect(dest); }
  start(t) { this.carrier.start(t); this.modOsc.start(t); }
  getModulatorFrequency() { return this.modOsc.frequency; }
  getModulatorGain() { return this.modGainStage.gain; }
  setCarrierFrequencyValue(f) { this.carrier.frequency.value = f; }
}

/* ---------------------------------- Bird ----------------------------------- */

export class Bird {
  constructor(ac) {
    this.ac = ac;
    this.am = new BirdAM(ac);
    this.fm = new BirdFM(ac);
    this.output = new GainNode(ac);

    // wire FM -> AM -> output
    this.fm.connect(this.am.getMixerNode());
    this.am.connect(this.output);

    // envelopes
    this.mainEnv = new EnvelopeADSR(ac, this.output.gain);
    this.fmFreqEnv = new EnvelopeADSR(ac, this.fm.getModulatorFrequency());
    this.amFreqEnv = new EnvelopeADSR(ac, this.am.getModulatorFrequency());
    this.fmGainEnv = new EnvelopeADSR(ac, this.fm.getModulatorGain());
    this.amGainEnv = new EnvelopeADSR(ac, this.am.getModulatorGain());

    this.started = false;
  }

  getOutputNode() { return this.output; }
  connect(dest) { this.output.connect(dest); }
  disconnect() { this.output.disconnect(); }

  setup(p) {
    // base frequency
    this.setFrequency(p.ifrq);

    // main amp env
    this.mainEnv.attackTime = MAX_ATTACK_DECAY_TIME * p.atk;
    this.mainEnv.decayTime  = MAX_ATTACK_DECAY_TIME * p.dcy;

    // FM
    this.fmFreqEnv.maxValue   = ENVELOPE_FREQ_MULTIPLIER * p.fmod1;
    this.fmFreqEnv.attackTime = MAX_ATTACK_DECAY_TIME * p.atkf1;
    this.fmFreqEnv.decayTime  = MAX_ATTACK_DECAY_TIME * p.dcyf1;

    this.fmGainEnv.maxValue   = p.amod1;
    this.fmGainEnv.attackTime = MAX_ATTACK_DECAY_TIME * p.atka1;
    this.fmGainEnv.decayTime  = MAX_ATTACK_DECAY_TIME * p.dcya1;

    // AM
    this.amFreqEnv.maxValue   = ENVELOPE_FREQ_MULTIPLIER * p.fmod2;
    this.amFreqEnv.attackTime = MAX_ATTACK_DECAY_TIME * p.atkf2;
    this.amFreqEnv.decayTime  = MAX_ATTACK_DECAY_TIME * p.dcyf2;

    this.amGainEnv.maxValue   = -p.amod2;
    this.amGainEnv.attackTime = MAX_ATTACK_DECAY_TIME * p.atka2;
    this.amGainEnv.decayTime  = MAX_ATTACK_DECAY_TIME * p.dcya2;
  }

  setFrequency(norm) {
    const f = FREQ_OFFSET + FREQ_MULTIPLIER * norm;
    this.fm.getModulatorGain().value = f;
    this.fm.setCarrierFrequencyValue(f);
  }

  chirp(t = this.ac.currentTime) {
    if (!this.started) {
      this.output.gain.value = 0;
      this.fm.start(0);
      this.am.start(0);
      this.started = true;
    }
    this.mainEnv.trigger(t);
    this.fmFreqEnv.trigger(t);
    this.amFreqEnv.trigger(t);
    this.fmGainEnv.trigger(t);
    this.amGainEnv.trigger(t);
  }
}

/* --------------------------------- Flock ----------------------------------- */

export class Flock {
  constructor(ac, {
    count = 5,
    preset = 'lesser-spotted-grinchwarbler',
    chirpSpread = 1.5,
    freqJitter = 0.15,
    envJitter  = 0.30
  } = {}) {
    if (preset === 'triple-tailed-tree-troubler') {
      console.warn('Skipping "triple-tailed-tree-troubler" (feedback risk as flock).');
      preset = 'lesser-spotted-grinchwarbler';
    }
    this.ac = ac;
    this.params = { chirpSpread, freqJitter, envJitter };
    this.presetKey = preset;
    this.birds = [];
    this.base = PRESETS[preset];

    for (let i = 0; i < count; i++) {
      const b = new Bird(ac);
      b.setup(this.base);
      this.birds.push(b);
    }
  }

  get size() { return this.birds.length; }

  resize(newCount) {
    const cur = this.birds.length;
    if (newCount === cur) return;
    if (newCount > cur) {
      for (let i = cur; i < newCount; i++) {
        const b = new Bird(this.ac);
        b.setup(this.base);
        this.birds.push(b);
      }
    } else {
      for (let i = cur - 1; i >= newCount; i--) {
        this.birds[i].disconnect();
        this.birds.splice(i, 1);
      }
    }
  }

  // Randomized “chorus” in a window around now
  chirp() {
    const now = this.ac.currentTime;
    const { chirpSpread, freqJitter, envJitter } = this.params;

    // capture baseline
    const defFreq = this.base.ifrq;
    const atkMain = this.base.atk;
    const dcyMain = this.base.dcy;

    this.birds.forEach(b => {
      b.setFrequency(defFreq + (Math.random() - 0.5) * freqJitter);
      b.mainEnv.attackTime = MAX_ATTACK_DECAY_TIME * (atkMain + (Math.random() - 0.5) * envJitter);
      b.mainEnv.decayTime  = MAX_ATTACK_DECAY_TIME * (dcyMain + (Math.random() - 0.5) * envJitter);
      const t = now + (Math.random() - 0.5) * chirpSpread;
      b.chirp(t);
    });
  }
}