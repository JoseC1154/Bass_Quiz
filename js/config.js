const CONFIG = {
  levels: ['easy', 'intermediate', 'hard'],
  keys: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'F#', 'Ab', 'Bb', 'Db', 'Eb'],
  notes: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  scaleSteps: {
    major: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2]
  },
  audio: {
    tickVolume: 0.02,
    correctVolume: 0.05,
    incorrectVolume: 0.05,
    frequencies: {
      'C': [65.41, 130.81, 261.63, 523.25, 1046.50],
      'Db': [69.30, 138.59, 277.18, 554.37, 1108.73],
      'D': [73.42, 146.83, 293.66, 587.33, 1174.66],
      'Eb': [77.78, 155.56, 311.13, 622.25, 1244.51],
      'E': [82.41, 164.81, 329.63, 659.25, 1318.51],
      'F': [87.31, 174.61, 349.23, 698.46, 1396.91],
      'F#': [92.50, 185.00, 369.99, 739.99, 1479.98],
      'G': [98.00, 196.00, 392.00, 783.99, 1567.98],
      'Ab': [103.83, 207.65, 415.30, 830.61, 1661.22],
      'A': [110.00, 220.00, 440.00, 880.00, 1760.00],
      'Bb': [116.54, 233.08, 466.16, 932.33, 1864.66],
      'B': [123.47, 246.94, 493.88, 987.77, 1975.53]
    }
  },
  timer: {
    defaultTicks: 100,
    practiceTicks: 600,
    defaultBpm: 180,
    maxBpm: 240,
    tickPenalty: 10,
    streakThreshold: 3
  },
  ui: {
    autoCloseResults: 10000,
    feedbackDuration: 1000,
    correctFeedbackDuration: 300,
    incorrectFeedbackDuration: 2000
  }
};