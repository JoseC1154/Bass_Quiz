class QuizManager {
  constructor(gameState, domManager, timerManager, audioManager) {
    this.state = gameState;
    this.dom = domManager;
    this.timer = timerManager;
    this.audio = audioManager;
  }

  generate(level, count) {
    this.state.quiz.data = [];
    const selectedDegree = +document.getElementById('degree-select')?.value;
    let fixedKey;
    
    if (level === 'easy') {
      fixedKey = this.dom.elements.keySelect.value === 'random' 
        ? this.randomChoice(CONFIG.keys) 
        : this.dom.elements.keySelect.value;
    }
    
    for (let i = 0; i < count; i++) {
      let degree, key;
      
      if (level === 'degree-training') {
        degree = selectedDegree;
        key = this.randomChoice(CONFIG.keys);
      } else {
        degree = Math.floor(Math.random() * 7) + 1;
        key = (level === 'easy') ? fixedKey : this.randomChoice(CONFIG.keys);
      }
      
      const scale = this.getScale(key);
      const isDegreeLevel = ['easy', 'intermediate', 'degree-training'].includes(level);
      
      if (isDegreeLevel) {
        let options = scale.filter(n => n !== scale[degree - 1]);
        options = this.shuffle(options).slice(0, 4);
        options.push(scale[degree - 1]);
        options = this.shuffle(options);
        
        this.state.quiz.data.push({
          question: `What is degree ${degree} in the key of ${key}?`,
          answer: scale[degree - 1],
          options: options
        });
      } else if (level === 'hard') {
        const note = scale[degree - 1];
        let options = CONFIG.keys.filter(k => k !== key);
        options = this.shuffle(options).slice(0, 4);
        options.push(key);
        options = this.shuffle(options);
        
        this.state.quiz.data.push({
          question: `${note} is the ${degree} degree of what key?`,
          answer: key,
          options: options
        });
      }
    }
  }

  getScale(key) {
    const scaleTypeElem = document.getElementById('scale-type');
    if (!scaleTypeElem) return [];
    
    const scaleType = scaleTypeElem.value;
    const steps = CONFIG.scaleSteps[scaleType] || CONFIG.scaleSteps.major;
    let start = CONFIG.notes.indexOf(key);
    
    if (start === -1) return [];
    
    let scale = [key];
    for (let step of steps) {
      start = (start + step) % 12;
      scale.push(CONFIG.notes[start]);
    }
    
    return scale.slice(0, 7);
  }

  showQuestion() {
    const currentQuestion = this.state.quiz.data[this.state.quiz.currentIndex];
    if (!currentQuestion) return;
    
    this.timer.clearTimeout('question');
    this.timer.clearInterval('timeAttack');
    
    // Handle time attack countdown
    const isTimeAttack = this.state.mode.type === 'Time Attack';
    const isPracticeMode = this.state.mode.type === 'Practice Mode';
    
    if (isTimeAttack || (isPracticeMode && document.getElementById('attack-time-select').value)) {
      this.startTimeAttackCountdown();
    }
    
    this.dom.setText('questionDiv', currentQuestion.question);
    this.dom.setHTML('answerButtons', '');
    
    currentQuestion.options.forEach(option => {
      const btn = document.createElement('button');
      btn.textContent = option;
      btn.onclick = () => {
        btn.blur();
        btn.classList.remove('hover');
        this.checkAnswer(option);
      };
      this.dom.elements.answerButtons.appendChild(btn);
    });
  }

  checkAnswer(selected) {
    this.timer.clearTimeout('question');
    this.timer.clearInterval('timeAttack');
    
    const currentQuestion = this.state.quiz.data[this.state.quiz.currentIndex];
    const correct = currentQuestion.answer;
    const isCorrect = selected === correct;
    
    const buttons = [...this.dom.elements.answerButtons.querySelectorAll('button')];
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correct) btn.classList.add('correct');
      if (btn.textContent === selected && !isCorrect) btn.classList.add('incorrect');
    });
    
    if (isCorrect) {
      this.audio.playCorrectSound();
      if (typeof this.timer.addTicksForCorrect === 'function') {
        this.timer.addTicksForCorrect();
      }
      this.state.quiz.correctAnswers++;
    } else {
      this.audio.playIncorrectSound();
      this.showTimeAttackX();
      if (typeof this.timer.subtractTicksForWrong === 'function') {
        this.timer.subtractTicksForWrong();
      }
      // else: do nothing if function does not exist
    }
    
    this.timer.setTimeout('nextQuestion', () => this.nextQuestion(), CONFIG.ui.feedbackDuration);
  }

  nextQuestion() {
    this.state.quiz.currentIndex++;
    const elapsedTime = (performance.now() - this.state.quiz.startTime) / 1000;
    
    if (this.state.quiz.active && elapsedTime >= 180) {
      this.end();
    } else if (this.state.quiz.currentIndex < this.state.quiz.data.length) {
      this.showQuestion();
    } else {
      this.end();
    }
  }

  end() {
    const best = Math.max(this.state.quiz.correctAnswers, parseInt(localStorage.getItem('bestScore') || 0));
    localStorage.setItem('bestScore', best);
    
    this.dom.hide('quizCard');
    this.dom.elements.quizCard.classList.remove('full-width');
    this.timer.clearAll();
    
    this.dom.show('resultsCard');
    this.displayResults(best);
    
    // Auto-close results
    setTimeout(() => {
      this.dom.hide('resultsCard');
      this.dom.show('settingsCard');
    }, CONFIG.ui.autoCloseResults);
  }

  displayResults(best) {
    const elapsedTime = ((performance.now() - this.state.quiz.startTime) / 1000).toFixed(1);
    const attemptedCount = this.state.quiz.currentIndex + 1;
    
    const html = `
      <div style="font-size: 1.2em; margin-bottom: 16px;">🏆 Best Score: <strong>${best}</strong></div>
      <div>✅ Correct: <strong>${this.state.quiz.correctAnswers}</strong></div>
      <div>❌ Incorrect: <strong>${attemptedCount - this.state.quiz.correctAnswers}</strong></div>
      <div>⏱️ Time: <strong>${elapsedTime}</strong> seconds</div>
    `;
    
    this.dom.setHTML('scoreSummary', html);
  }

  showTimeAttackX() {
    const timeAttackX = this.dom.elements.timeAttackX;
    if (timeAttackX) {
      timeAttackX.classList.remove('hidden');
      timeAttackX.classList.add('show');
      
      setTimeout(() => {
        timeAttackX.classList.remove('show');
        timeAttackX.classList.add('hidden');
      }, 1000);
    }
  }

  startTimeAttackCountdown() {
    const attackTimeSelect = document.getElementById('attack-time-select');
    let countdown = parseInt(attackTimeSelect?.value || 5);
    
    // Update initial display
    const timerDisplay = this.dom.elements.timerDisplay;
    const timerLabel = this.dom.elements.timerLabel;
    
    if (timerDisplay && timerLabel) {
      timerDisplay.textContent = countdown;
      timerLabel.textContent = '';
    }
    
    // Start countdown
    this.timer.setInterval('timeAttack', () => {
      countdown--;
      if (timerDisplay) timerDisplay.textContent = countdown;
      
      if (countdown <= 0) {
        this.timer.clearInterval('timeAttack');
        // Auto-fail the question if time runs out
        this.timeAttackTimeOut();
      }
    }, 1000);
  }

  timeAttackTimeOut() {
    // Show large X overlay for timeout
    this.showTimeAttackX();
    
    // Disable all buttons
    const buttons = [...this.dom.elements.answerButtons.querySelectorAll('button')];
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === this.state.quiz.data[this.state.quiz.currentIndex].answer) {
        btn.classList.add('correct');
      }
    });
    
    // Don't add to correct answers, proceed with penalty
    if (typeof this.timer.subtractTicksForWrong === 'function') {
      this.timer.subtractTicksForWrong();
    }
    this.timer.setTimeout('nextQuestion', () => this.nextQuestion(), 1500);
  }

  // Utility methods
  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }
}