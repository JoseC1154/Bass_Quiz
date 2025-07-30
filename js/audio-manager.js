class AudioManager {
  constructor(domManager) {
    this.dom = domManager;
    this.context = domManager.audioContext;
  }

  playTone(frequency, duration = 0.15, volume = 0.1) {
    // Resume context if needed
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    // Always try to play the tone after a short delay to ensure context is running
    setTimeout(() => {
      if (this.context.state !== 'running') {
        this.context.resume().then(() => {
          this._playToneNow(frequency, duration, volume);
        });
      } else {
        this._playToneNow(frequency, duration, volume);
      }
    }, 0);
  }

  _playToneNow(frequency, duration, volume) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    gain.gain.setValueAtTime(volume, this.context.currentTime);

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  playCorrectSound() {
    this.playTone(880, 0.15, CONFIG.audio.correctVolume);
  }

  playIncorrectSound() {
    const duration = 0.2;
    const tone1 = 880;
    const tone2 = tone1 / Math.pow(2, 1 / 12);
    
    this.playTone(tone1, duration, CONFIG.audio.incorrectVolume);
    setTimeout(() => {
      this.playTone(tone2, duration, CONFIG.audio.incorrectVolume);
    }, duration * 1000);
  }

  playTickSound() {
    // Always try to play the tick after a short delay to ensure context is running
    setTimeout(() => {
      if (this.context.state !== 'running') {
        this.context.resume().then(() => {
          this._playTickNow();
        });
      } else {
        this._playTickNow();
      }
    }, 0);
  }

  _playTickNow() {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, this.context.currentTime);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    gain.gain.setValueAtTime(CONFIG.audio.tickVolume, this.context.currentTime);

    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.05);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}