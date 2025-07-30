function createPianoUI() {
  const baseOctave = 4; // or 3, depending on your desired starting octave
  const pianoUI = document.getElementById('piano-ui');
  if (!pianoUI) return;
  // Use quiz-card width if available, otherwise fall back to pianoUI width
  let containerWidth = pianoUI.offsetWidth || window.innerWidth;
  const quizCard = document.getElementById('quiz-card');
  if (quizCard && quizCard.offsetWidth > 10) {
    containerWidth = quizCard.offsetWidth;
  }
  if (containerWidth < 10) {
    setTimeout(createPianoUI, 50);
    return;
  }

  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeyPairs = { 0: 'Db', 1: 'Eb', 3: 'F#', 4: 'Ab', 5: 'Bb' };

  const minKeyWidth = 50;

  // Calculate number of white keys that fit
  let totalWhiteKeys = Math.floor(containerWidth / minKeyWidth);
  const keyWidth = containerWidth / totalWhiteKeys;
  const keyHeight = keyWidth * 3;
  const fontSizeWhite = keyWidth * 0.3;
  const fontSizeBlack = keyWidth * 0.25;

  // Snap to a full octave (start and end on C)
  const whiteKeysPerOctave = whiteKeys.length;
  const remainder = totalWhiteKeys % whiteKeysPerOctave;
  if (remainder !== 0) totalWhiteKeys += (whiteKeysPerOctave - remainder);

  pianoUI.innerHTML = '';

  const keyboardContainer = document.createElement('div');
  keyboardContainer.className = 'keyboard-container';
  keyboardContainer.style.position = 'relative';
  keyboardContainer.style.width = `${containerWidth}px`;
  keyboardContainer.style.height = `${keyHeight}px`;
  pianoUI.appendChild(keyboardContainer);

  const whiteLayer = document.createElement('div');
  whiteLayer.className = 'white-keys';
  whiteLayer.style.position = 'relative';
  whiteLayer.style.width = `${containerWidth}px`;
  whiteLayer.style.height = `${keyHeight}px`;
  keyboardContainer.appendChild(whiteLayer);

  const blackLayer = document.createElement('div');
  blackLayer.className = 'black-keys';
  blackLayer.style.position = 'absolute';
  blackLayer.style.top = '0';
  blackLayer.style.left = '0';
  blackLayer.style.width = `${containerWidth}px`;
  blackLayer.style.height = `${keyHeight}px`;
  keyboardContainer.appendChild(blackLayer);

  // Step 1: Create white keys and store their positions
  const whiteKeyPositions = [];
  for (let i = 0; i < totalWhiteKeys; i++) {
    const noteIndex = i % whiteKeysPerOctave;
    const note = whiteKeys[noteIndex];
    // Calculate octave number for this key
    const octave = baseOctave + Math.floor(i / whiteKeysPerOctave);
    const noteWithOctave = note + octave;

    const whiteKey = document.createElement('div');
    whiteKey.className = 'piano-key white-key';
    whiteKey.dataset.note = noteWithOctave;
    whiteKey.innerHTML = `<span>${noteWithOctave}</span>`;
    whiteKey.style.width = `${keyWidth}px`;
    whiteKey.style.height = `${keyHeight}px`;
    whiteKey.style.fontSize = `${fontSizeWhite}px`;
    whiteKey.style.position = 'absolute';
    whiteKey.style.left = `${i * keyWidth}px`;
    whiteKey.addEventListener('click', () => handleNoteInput(noteWithOctave));
    whiteLayer.appendChild(whiteKey);
    whiteKeyPositions.push(i * keyWidth);
  }

  // Step 2: Create black keys using calculated positions
  blackLayer.innerHTML = '';
  const blackKeyWidth = keyWidth * 0.6;
  const blackKeyHeight = keyHeight * 0.65;
  for (let i = 0; i < totalWhiteKeys; i++) {
    const noteIndex = i % whiteKeysPerOctave;
    if (blackKeyPairs[noteIndex] !== undefined && i + 1 < totalWhiteKeys) {
      // Center between two white keys
      const left = whiteKeyPositions[i];
      const right = whiteKeyPositions[i + 1];
      const center = (left + right) / 2 - (blackKeyWidth / 2);
      // Calculate octave for black key (same as white key to left)
      const octave = baseOctave + Math.floor(i / whiteKeysPerOctave);
      const noteWithOctave = blackKeyPairs[noteIndex] + octave;
      const blackKey = document.createElement('div');
      blackKey.className = 'piano-key black-key';
      blackKey.dataset.note = noteWithOctave;
      blackKey.innerHTML = `<span>${noteWithOctave}</span>`;
      blackKey.style.width = `${blackKeyWidth}px`;
      blackKey.style.height = `${blackKeyHeight}px`;
      blackKey.style.fontSize = `${fontSizeBlack}px`;
      blackKey.style.position = 'absolute';
      blackKey.style.left = `${center + 42}px`;
      blackKey.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNoteInput(noteWithOctave);
      });
      blackLayer.appendChild(blackKey);
    }
  }
}

// Re-render piano on resize
if (!window._pianoResizeHandler) {
  window._pianoResizeHandler = () => createPianoUI();
  window.addEventListener('resize', window._pianoResizeHandler);
  window.addEventListener('orientationchange', window._pianoResizeHandler);
}

createPianoUI();


function createBassUI() {
  const bassUI = document.getElementById('bass-ui');
  if (!bassUI) return;
  
  bassUI.innerHTML = `
    <div class="bass-fretboard">
      <div class="bass-string" data-string="G">
        ${generateFrets('G', 12)}
      </div>
      <div class="bass-string" data-string="D">
        ${generateFrets('D', 12)}
      </div>
      <div class="bass-string" data-string="A">
        ${generateFrets('A', 12)}
      </div>
      <div class="bass-string" data-string="E">
        ${generateFrets('E', 12)}
      </div>
    </div>
  `;
  
  // Add click handlers to frets
  bassUI.querySelectorAll('.fret').forEach(fret => {
    fret.addEventListener('click', () => {
      const note = fret.dataset.note;
      handleNoteInput(note);
    });
  });
  
  bassUI.classList.remove('hidden');
}

function generateFrets(openNote, fretCount) {
  const noteIndex = CONFIG.notes.indexOf(openNote);
  let fretsHTML = `<div class="fret open" data-note="${openNote}">${openNote}</div>`;
  
  for (let fret = 1; fret <= fretCount; fret++) {
    const noteIdx = (noteIndex + fret) % 12;
    const note = CONFIG.notes[noteIdx];
    fretsHTML += `<div class="fret" data-note="${note}" data-fret="${fret}">${note}</div>`;
  }
  
  return fretsHTML;
}

function createGuitarUI() {
  const guitarUI = document.getElementById('guitar-ui');
  if (!guitarUI) return;
  
  guitarUI.innerHTML = `
    <div class="guitar-fretboard">
      <div class="guitar-string" data-string="E">
        ${generateFrets('E', 12)}
      </div>
      <div class="guitar-string" data-string="B">
        ${generateFrets('B', 12)}
      </div>
      <div class="guitar-string" data-string="G">
        ${generateFrets('G', 12)}
      </div>
      <div class="guitar-string" data-string="D">
        ${generateFrets('D', 12)}
      </div>
      <div class="guitar-string" data-string="A">
        ${generateFrets('A', 12)}
      </div>
      <div class="guitar-string" data-string="E">
        ${generateFrets('E', 12)}
      </div>
    </div>
  `;
  
  // Add click handlers to frets
  guitarUI.querySelectorAll('.fret').forEach(fret => {
    fret.addEventListener('click', () => {
      const note = fret.dataset.note;
      handleNoteInput(note);
    });
  });
  
  guitarUI.classList.remove('hidden');
}

function updateInputMethodButtons() {
  const touchBtn = document.getElementById('touch-input-btn');
  const midiBtn = document.getElementById('midi-input-btn');
  const micBtn = document.getElementById('mic-input-btn');
  const cableBtn = document.getElementById('cable-input-btn');
  
  // Touch is always available
  if (touchBtn) {
    touchBtn.disabled = false;
    touchBtn.title = 'Touch/Click Interface';
    touchBtn.style.opacity = '1';
  }
  
  // MIDI availability check
  if (midiBtn) {
    const midiSupported = navigator.requestMIDIAccess !== undefined;
    const midiConnected = typeof midiAccess !== 'undefined' && midiAccess && Array.from(midiAccess.inputs.values()).length > 0;
    
    if (!midiSupported) {
      midiBtn.disabled = true;
      midiBtn.title = 'MIDI not supported in this browser';
      midiBtn.style.opacity = '0.5';
    } else if (!midiConnected && !midiAccess) {
      midiBtn.disabled = false;
      midiBtn.title = 'Click to request MIDI access';
      midiBtn.style.opacity = '0.7';
    } else if (!midiConnected && midiAccess) {
      midiBtn.disabled = true;
      midiBtn.title = 'No MIDI devices connected';
      midiBtn.style.opacity = '0.5';
    } else {
      midiBtn.disabled = false;
      midiBtn.title = 'MIDI Keyboard/Controller - Ready';
      midiBtn.style.opacity = '1';
    }
  }
  
  // Audio availability check
  const audioSupported = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  const audioActive = typeof audioInputActive !== 'undefined' && audioInputActive;
  
  if (micBtn) {
    if (!audioSupported) {
      micBtn.disabled = true;
      micBtn.title = 'Microphone access not supported in this browser';
      micBtn.style.opacity = '0.5';
    } else if (!audioActive) {
      micBtn.disabled = false;
      micBtn.title = 'Click to request microphone access';
      micBtn.style.opacity = '0.7';
    } else {
      micBtn.disabled = false;
      micBtn.title = 'Microphone/Audio Input - Ready';
      micBtn.style.opacity = '1';
    }
  }
  
  if (cableBtn) {
    if (!audioSupported) {
      cableBtn.disabled = true;
      cableBtn.title = 'Audio interface access not supported in this browser';
      cableBtn.style.opacity = '0.5';
    } else if (!audioActive) {
      cableBtn.disabled = false;
      cableBtn.title = 'Click to request audio interface access';
      cableBtn.style.opacity = '0.7';
    } else {
      cableBtn.disabled = false;
      cableBtn.title = 'Instrument Cable (Audio Interface) - Ready';
      cableBtn.style.opacity = '1';
    }
  }
}

// Pre-render the piano UI on DOMContentLoaded so it is ready when unhidden
if (typeof createPianoUI === 'function') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createPianoUI);
  } else {
    createPianoUI();
  }
}
