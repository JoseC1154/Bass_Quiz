class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.quiz = {
      data: [],
      currentIndex: 0,
      correctAnswers: 0,
      active: false,
      startTime: null
    };
    
    this.timer = {
      totalTicks: CONFIG.timer.defaultTicks,
      currentBpm: CONFIG.timer.defaultBpm,
      levelStartBpm: CONFIG.timer.defaultBpm,
      correctStreak: 0,
      isPaused: false
    };
    
    this.input = {
      method: 'touch',
      audioActive: false,
      midiActive: false
    };
    
    this.mode = {
      type: 'BPM Challenge',
      timeAttack: {
        countdown: 0,
        interval: null
      }
    };
  }
}