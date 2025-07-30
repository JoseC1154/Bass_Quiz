class TimerManager {
  constructor(gameState, domManager) {
    this.state = gameState;
    this.dom = domManager;
    this.intervals = new Map();
    this.timeouts = new Map();
  }

  setInterval(name, callback, delay) {
    this.clearInterval(name);
    const intervalId = setInterval(callback, delay);
    this.intervals.set(name, intervalId);
    return intervalId;
  }

  setTimeout(name, callback, delay) {
    this.clearTimeout(name);
    const timeoutId = setTimeout(callback, delay);
    this.timeouts.set(name, timeoutId);
    return timeoutId;
  }

  clearInterval(name) {
    if (this.intervals.has(name)) {
      clearInterval(this.intervals.get(name));
      this.intervals.delete(name);
    }
  }

  clearTimeout(name) {
    if (this.timeouts.has(name)) {
      clearTimeout(this.timeouts.get(name));
      this.timeouts.delete(name);
    }
  }

  clearAll() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.intervals.clear();
    this.timeouts.clear();
  }

  // Add stubs for quiz-manager compatibility (no-ops if not used)
  addTicksForCorrect() {
    // Optionally implement scoring/time logic here
  }

  subtractTicksForWrong() {
    // Optionally implement penalty logic here
  }

  start() {
    // Start a simple countdown timer with BPM logic
    this.clearAll();
    if (!this.state.quiz.active) return;

    // Use BPM from state or default
    this.state.timerValue = this.state.timerValue || 60; // fallback if not set
    this.state.timer = this.state.timer || {};
    this.state.timer.currentBpm = this.state.timer.currentBpm || 120; // default BPM

    const updateTimerDisplay = () => {
      this.dom.setText('totalTimer', `Time: ${this.state.timerValue}s | BPM: ${this.state.timer.currentBpm}`);
    };

    updateTimerDisplay();

    const tickLoop = () => {
      if (!this.state.quiz.active) {
        this.clearInterval('main');
        return;
      }
      this.state.timerValue--;
      updateTimerDisplay();
      if (this.state.timerValue <= 0) {
        this.clearInterval('main');
        this.state.quiz.active = false;
        if (typeof this.dom.elements.quizCard !== 'undefined') {
          this.dom.hide('quizCard');
        }
        if (typeof this.dom.elements.resultsCard !== 'undefined') {
          this.dom.show('resultsCard');
        }
        return;
      }
      // Optionally, increase BPM as quiz progresses
      // Example: every 10 seconds, increase BPM by 10
      if (this.state.timerValue % 10 === 0) {
        this.state.timer.currentBpm += 10;
      }
      // Recalculate interval based on BPM
      const interval = (360 / this.state.timer.currentBpm) * 1000;
      this.setInterval('main', tickLoop, interval);
    };

    // Initial interval based on BPM
    const interval = (360 / this.state.timer.currentBpm) * 1000;
    this.setInterval('main', tickLoop, interval);
  }
}