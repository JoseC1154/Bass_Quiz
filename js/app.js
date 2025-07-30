let game, audioManager, notificationManager;

document.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  audioManager = game.audio;
  notificationManager = game.notification;
  // Expose handleNoteInput globally for instrument UIs
  window.handleNoteInput = (...args) => game.handleNoteInput(...args);

  // Input Mode Indicator logic
  const inputModeIndicator = document.getElementById('input-mode-indicator');
  const inputIcons = document.querySelectorAll('.input-icon');
  const inputNames = {
    keys: 'Keyboard',
    piano: 'Piano',
    bass: 'Bass Guitar',
    guitar: 'Guitar'
  };
  inputIcons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      if (inputModeIndicator && inputNames[type]) {
        inputModeIndicator.textContent = `Input: ${inputNames[type]}`;
        inputModeIndicator.classList.remove('hidden');
      }

      // UI switching logic
      const quizUIContainer = document.getElementById('quiz-ui-container');
      if (quizUIContainer) {
        quizUIContainer.setAttribute('data-input', type);
      }
      // Hide all instrument UIs first (if you add them to DOMManager, use domManager.hide)
      const ids = ['keys-ui', 'piano-ui', 'bass-ui', 'guitar-ui'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('hidden');
          console.log(`[UI] Hiding: #${id}`);
        }
      });
      // Show the selected instrument UI
      const showId = type + '-ui';
      const showEl = document.getElementById(showId);
      if (showEl) {
        showEl.classList.remove('hidden');
        console.log(`[UI] Showing: #${showId}`);
      } else {
        console.warn(`[UI] Element not found: #${showId}`);
      }

      if (type === 'piano' && typeof createPianoUI === 'function') {
        console.log('Calling createPianoUI()');
        createPianoUI();
        // Double-check visibility after creation
        const pianoUI = document.getElementById('piano-ui');
        if (pianoUI) {
          console.log('[UI] #piano-ui classList after createPianoUI:', pianoUI.className);
        }
      }

      // NEW: Also trigger the corresponding input-method-btn click to set input method and start detection
      let inputMethod = type;
      // Map UI type to input-method-btn data-input value
      if (type === 'keys') inputMethod = 'touch';
      if (type === 'piano') inputMethod = 'audio';
      if (type === 'bass' || type === 'guitar') inputMethod = 'instrument';
      const btnToClick = document.querySelector(`.input-method-btn[data-input="${inputMethod}"]`);
      if (btnToClick) {
        btnToClick.click();
      }
    });
  }); // <-- Make sure both are closed here

  // Auto-resume audio context on user interaction
  document.body.addEventListener('click', () => {
    if (audioManager.context.state === 'suspended') {
      audioManager.context.resume();
    }
  }, { once: true });
});

window.createPianoUI = createPianoUI;