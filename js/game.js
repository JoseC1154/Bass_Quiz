class Game {
  // Block note input while help is open
  helpOpen = false;
  /**
   * Handles note input from instrument UIs (e.g., piano, bass, guitar).
   * @param {string} note - The note name (e.g., 'C4', 'F#3')
   */
  handleNoteInput(note) {
    if (this.helpOpen) return; // Block input while help is open
    // For now, just log the note. Later, this can check answers, update UI, etc.
    console.log('Note input:', note);
    // Example: highlight the note, check answer, play sound, etc.
    // this.quiz.checkAnswer(note);
    // this.audio.playNote(note);
  }
  constructor() {
    this.state = new GameState();
    this.dom = new DOMManager();
    this.timer = new TimerManager(this.state, this.dom);
    this.audio = new AudioManager(this.dom);
    this.quiz = new QuizManager(this.state, this.dom, this.timer, this.audio);
    this.notification = new NotificationManager();
    
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeUI();
    this.setDefaultMode();
  }

  bindEvents() {
    // Start quiz button (assuming you have one)
    const startBtn = document.querySelector('#start-quiz, .primary-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }

    // Input method buttons
    const inputButtons = document.querySelectorAll('.input-method-btn');
    inputButtons.forEach(btn => {
      btn.addEventListener('click', () => this.handleInputMethodChange(btn));
    });

    // Menu buttons
    this.bindMenuEvents();
    
    // Quiz controls
    this.bindQuizEvents();
  }

  bindMenuEvents() {
    const menuToggle = this.dom.elements.menuToggle;
    const menuClose = this.dom.elements.menuClose;
    const dropdownMenu = this.dom.elements.dropdownMenu;

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        dropdownMenu?.classList.toggle('hidden');
      });
    }

    if (menuClose) {
      menuClose.addEventListener('click', () => {
        dropdownMenu?.classList.add('hidden');
      });
    }

    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }
  }

  bindQuizEvents() {
    // Close quiz button
    if (this.dom.elements.closeQuizBtn) {
      this.dom.elements.closeQuizBtn.addEventListener('click', () => {
        this.endQuiz();
      });
    }

    // Play again button
    if (this.dom.elements.playAgainBtn) {
      this.dom.elements.playAgainBtn.addEventListener('click', () => {
        this.startQuiz();
      });
    }

    // Help button
    if (this.dom.elements.helpBtn) {
      this.dom.elements.helpBtn.addEventListener('click', () => {
        this.showHelp();
      });
    }
  }

  initializeUI() {
    // Initialize input method buttons
    updateInputMethodButtons();
    
    // Set default input method
    this.state.input.method = 'touch';
    
    // Initialize any UI components that need setup
    this.updateInputUI();
  }

  setDefaultMode() {
    this.state.mode.type = 'Practice Mode';
  }

  handleInputMethodChange(button) {
    const inputType = button.dataset.input;
    
    // Update button states
    document.querySelectorAll('.input-method-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    
    // Update state
    this.state.input.method = inputType;
    
    // Handle specific input method requirements
    switch (inputType) {
      case 'midi':
        if (!midiAccess) {
          requestMIDIPermission();
        }
        break;
      case 'audio':
      case 'instrument':
        // Always (re)start audio input and pitch detection when switching to audio/instrument
        if (typeof requestAudioPermission === 'function') {
          requestAudioPermission();
        }
        break;
    }
    
    // Update UI
    this.updateInputUI();
  }

  updateInputUI() {
    // Hide all input UIs
    const inputUIs = ['keys-ui', 'piano-ui', 'bass-ui', 'guitar-ui', 'midi-ui', 'audio-ui'];
    inputUIs.forEach(id => {
      const element = document.getElementById(id);
      if (element) element.classList.add('hidden');
    });

    // Show appropriate UI based on input method
    const inputMethod = this.state.input.method;
    let targetUI = 'keys-ui'; // default

    if (inputMethod === 'touch') {
      // Determine which instrument UI to show based on selected input icon
      const inputIcon = document.querySelector('.input-icon.selected');
      if (inputIcon) {
        const iconType = inputIcon.dataset.type;
        switch (iconType) {
          case 'piano':
            targetUI = 'piano-ui';
            break;
          case 'bass':
            targetUI = 'bass-ui';
            break;
          case 'guitar':
            targetUI = 'guitar-ui';
            break;
          default:
            targetUI = 'keys-ui';
        }
      } else {
        targetUI = 'keys-ui';
      }
    } else if (inputMethod === 'midi') {
      targetUI = 'midi-ui';
    } else if (inputMethod === 'audio' || inputMethod === 'instrument') {
      targetUI = 'audio-ui';
    }

    // Always call the UI creation function for touch instrument UIs
    if (inputMethod === 'touch') {
      const inputIcon = document.querySelector('.input-icon.selected');
      if (inputIcon) {
        const iconType = inputIcon.dataset.type;
        switch (iconType) {
          case 'piano':
            if (typeof createPianoUI === 'function') createPianoUI();
            break;
          case 'bass':
            if (typeof createBassUI === 'function') createBassUI();
            break;
          case 'guitar':
            if (typeof createGuitarUI === 'function') createGuitarUI();
            break;
        }
      }
    }

    // Show the selected UI
    const targetElement = document.getElementById(targetUI);
    if (targetElement) {
      targetElement.classList.remove('hidden');
      // Always call createPianoUI if piano UI is shown
      if (targetUI === 'piano-ui' && typeof createPianoUI === 'function') {
        createPianoUI();
      }
    }
  }

  startQuiz() {
    const level = this.dom.elements.levelSelect?.value;
    const difficulty = parseInt(this.dom.elements.difficultySelect?.value || 4);
    
    if (!level) {
      this.notification.show('Please select a training level', 'warning');
      return;
    }

    // Generate quiz questions
    this.quiz.generate(level, 50); // Generate 50 questions
    
    if (this.state.quiz.data.length === 0) {
      this.notification.show('Failed to generate quiz questions', 'error');
      return;
    }

    // Initialize quiz state
    this.state.quiz.active = true;
    this.state.quiz.currentIndex = 0;
    this.state.quiz.correctAnswers = 0;
    this.state.quiz.startTime = performance.now();

    // Update UI
    this.dom.hide('settingsCard');
    this.dom.hide('resultsCard');
    this.dom.show('quizCard');

    // Start timers
    if (typeof this.timer.start === 'function') {
      this.timer.start();
    } else if (typeof this.timer.startMainTimer === 'function') {
      this.timer.startMainTimer();
    } else if (typeof this.timer.startTimer === 'function') {
      this.timer.startTimer();
    } else {
      // fallback: show a notification if no timer function is available
      this.notification.show('Timer is not available.', 'error');
    }

    // Show first question
    this.quiz.showQuestion();

    // Update input UI for quiz mode
    this.updateInputUI();

    // Start audio input/pitch detection if input method is audio or instrument
    if (this.state.input.method === 'audio' || this.state.input.method === 'instrument') {
      if (typeof requestAudioPermission === 'function') {
        requestAudioPermission();
      }
    }
  }

  endQuiz() {
    this.state.quiz.active = false;
    this.timer.clearAll();
    
    this.dom.hide('quizCard');
    this.dom.show('settingsCard');
    
    // Reset UI classes
    this.dom.elements.quizCard?.classList.remove('full-width');
  }

  showHelp() {
    // Disable quiz close button and suppress hover effect while help is open
    if (this.dom.elements.closeQuizBtn) {
      this.dom.elements.closeQuizBtn.disabled = true;
      this.dom.elements.closeQuizBtn.classList.add('no-hover');
    }
    // Pause the quiz
    if (typeof this.timer.pause === 'function') {
      this.timer.pause();
    }
    this.helpOpen = true;
    // Disable note input if utility exists
    if (typeof setNoteInputEnabled === 'function') setNoteInputEnabled(false);
    // Disable answer buttons and suppress hover effect
    const answerBtns = this.dom.elements.answerButtons?.querySelectorAll('button');
    if (answerBtns) answerBtns.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('no-hover');
    });
    // Show the help card/modal if it exists
    const helpCard = this.dom.elements.helpCard || document.getElementById('helpCard');
    if (helpCard) {
      // Get current scale and note degrees from quizManager
      if (typeof this.quiz.getCurrentHelpContent === 'function') {
        const helpContent = this.quiz.getCurrentHelpContent();
        if (helpContent) {
          if (typeof this.dom.setHTML === 'function') {
            this.dom.setHTML('helpCard', helpContent);
          } else {
            helpCard.innerHTML = helpContent;
          }
        }
      }
      helpCard.classList.remove('hidden');
      // Add close button if not present, styled like close-quiz
      let closeBtn = helpCard.querySelector('#closeHelpBtn');
      if (!closeBtn) {
        closeBtn = document.createElement('button');
        closeBtn.id = 'closeHelpBtn';
        closeBtn.className = 'close-btn';
        closeBtn.setAttribute('aria-label', 'Close Help');
        closeBtn.innerHTML = '✖';
        closeBtn.onclick = () => this.closeHelp();
        helpCard.insertBefore(closeBtn, helpCard.firstChild);
      } else {
        closeBtn.onclick = () => this.closeHelp();
      }
    } else {
      // fallback: show a notification if helpCard is missing
      this.notification.show('Help content not available.', 'info');
    }
  }

  closeHelp() {
    // Re-enable quiz close button and restore hover effect
    if (this.dom.elements.closeQuizBtn) {
      this.dom.elements.closeQuizBtn.disabled = false;
      this.dom.elements.closeQuizBtn.classList.remove('no-hover');
    }
    // Hide the help card/modal
    const helpCard = this.dom.elements.helpCard || document.getElementById('helpCard');
    if (helpCard) {
      helpCard.classList.add('hidden');
    }
    // Resume the quiz
    if (typeof this.timer.resume === 'function') {
      this.timer.resume();
    }
    this.helpOpen = false;
    // Re-enable note input if utility exists
    if (typeof setNoteInputEnabled === 'function') setNoteInputEnabled(true);
    // Re-enable answer buttons and restore hover effect
    const answerBtns = this.dom.elements.answerButtons?.querySelectorAll('button');
    if (answerBtns) answerBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('no-hover');
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }
}
function requestAudioPermission() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      window.audioInputActive = true;
      console.log('Microphone permission granted');
    })
    .catch(err => {
      console.error('Microphone permission denied:', err);
      window.audioInputActive = false;
    });
}