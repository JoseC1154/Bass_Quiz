console.log('TEST LOG FROM BUNDLE');
import { PitchDetector } from 'pitchy';
/* --- Library Loader Helper for pitch detection --- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadLibrary(lib) {
  if (lib === 'aubio' && !window.Aubio) {
    await loadScript('/libs/aubio.js');
  }
  // Pitchy is imported via npm, no need to load dynamically
}

// Choose detection library: 'pitchy', 'aubio', or 'default'
let audioDetectLib = 'pitchy';

// --- Detection Tester Button Logic ---
let detectionTesterActive = false;
let detectionTesterRAF = null;
let detectionTesterPitchDetector = null;

function startDetectionTester() {
  if (!audioContext || !analyser) {
    alert('Audio input not started. Please start audio input first.');
    return;
  }
  if (detectionTesterActive) return;
  detectionTesterActive = true;
  const btn = document.getElementById('detection-tester-btn');
  if (btn) btn.textContent = 'Stop Detection Tester';
  // Use Pitchy for detection
  detectionTesterPitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
  const bufferLength = analyser.fftSize;
  const timeDomainData = new Float32Array(bufferLength);
  const detect = () => {
    if (!detectionTesterActive) return;
    analyser.getFloatTimeDomainData(timeDomainData);
    const [freq, clarity] = detectionTesterPitchDetector.findPitch(timeDomainData, audioContext.sampleRate);
    if (freq && clarity > 0.5) {
      const note = frequencyToNote(freq);
      console.log('[Tester] Note:', note, 'Freq:', freq.toFixed(2), 'Clarity:', clarity.toFixed(2));
    } else {
      // Optionally log silence or unclear
      // console.log('[Tester] No clear pitch');
    }
    detectionTesterRAF = requestAnimationFrame(detect);
  };
  detect();
}

function stopDetectionTester() {
  detectionTesterActive = false;
  if (detectionTesterRAF) {
    cancelAnimationFrame(detectionTesterRAF);
    detectionTesterRAF = null;
  }
  const btn = document.getElementById('detection-tester-btn');
  if (btn) btn.textContent = 'Start Detection Tester';
}

document.addEventListener('DOMContentLoaded', () => {
  const testerBtn = document.getElementById('detection-tester-btn');
  if (testerBtn) {
    testerBtn.addEventListener('click', () => {
      if (!detectionTesterActive) {
        startDetectionTester();
      } else {
        stopDetectionTester();
      }
    });
  }
});

// --- Input Tester Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const openTesterBtn = document.getElementById('open-input-tester');
  const testerModal = document.getElementById('input-tester-modal');
  const closeTesterBtn = document.getElementById('close-input-tester');
  // Add: Populate mic select dropdown when modal opens
  const micSelect = document.getElementById('audio-mic-select-tester');
  async function populateMicSelect() {
    if (!micSelect) return;
    micSelect.innerHTML = '<option value="">Loading...</option>';
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      micSelect.innerHTML = '';
      mics.forEach(mic => {
        const opt = document.createElement('option');
        opt.value = mic.deviceId;
        opt.textContent = mic.label || `Microphone ${mic.deviceId.substr(0, 6)}`;
        micSelect.appendChild(opt);
      });
    } catch (e) {
      micSelect.innerHTML = '<option value="">No microphones found</option>';
    }
  }
  if (openTesterBtn && testerModal && closeTesterBtn) {
    openTesterBtn.addEventListener('click', () => {
      testerModal.classList.remove('hidden');
      populateMicSelect();
    });
    function closeTesterModal() {
      testerModal.classList.add('hidden');
      stopAudioInput('tester');
    }
    closeTesterBtn.addEventListener('click', closeTesterModal);
    testerModal.addEventListener('click', (e) => {
      if (e.target === testerModal) {
        closeTesterModal();
      }
    });
    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (!testerModal.classList.contains('hidden') && (e.key === 'Escape' || e.key === 'Esc')) {
        closeTesterModal();
      }
    });
    // Wire up Start Audio Input button
    // Use unique IDs for tester modal
    const startBtn = document.getElementById('audio-start-btn-tester');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!audioInputActive) {
          requestAudioPermission('tester');
        } else {
          stopAudioInput('tester');
        }
      });
    }
  }
});

let audioContext = null;
let analyser = null;
let microphone = null;
let audioInputActive = false;
let audioInputTarget = null; // 'tester' or null

async function requestAudioPermission(target = null) {
  try {
    let constraints = { audio: true };
    if (target === 'tester') {
      const micSelect = document.getElementById('audio-mic-select-tester');
      if (micSelect && micSelect.value) {
        constraints = { audio: { deviceId: { exact: micSelect.value } } };
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 2048;
      microphone.connect(analyser);
    }
    audioInputActive = true;
    audioInputTarget = target;
    // Update status for correct UI
    let statusElement, startBtn, freqDisplay, noteDisplay, vuBar;
    if (target === 'tester') {
      statusElement = document.getElementById('audio-connection-status-tester');
      startBtn = document.getElementById('audio-start-btn-tester');
      freqDisplay = document.getElementById('audio-frequency-display-tester');
      noteDisplay = document.getElementById('audio-note-display-tester');
      vuBar = document.getElementById('vu-meter-bar-tester');
    } else {
      statusElement = document.getElementById('audio-connection-status');
      startBtn = document.getElementById('audio-start-btn');
      freqDisplay = document.getElementById('audio-frequency-display');
      noteDisplay = document.getElementById('audio-note-display');
      vuBar = document.getElementById('vu-meter-bar');
    }
    if (statusElement) {
      statusElement.textContent = '🎤 Audio: Connected (listening...)';
      statusElement.style.color = 'green';
    }
    if (target === 'tester') {
      const testerStatus = document.getElementById('input-tester-status');
      if (testerStatus) {
        testerStatus.textContent = 'Mic Connected (listening...)';
        testerStatus.style.color = '#28a745';
      }
    }
    if (startBtn) {
      startBtn.textContent = 'Stop Audio Input';
      startBtn.classList.add('stop-audio');
    }
    if (freqDisplay) freqDisplay.textContent = 'Frequency: --';
    if (noteDisplay) noteDisplay.textContent = 'Play a note on your instrument';
    if (vuBar) vuBar.style.width = '0%';

    // --- Audio detection feedback ---
    let heardAudio = false;
    let lastFreq = null;
    let checkTimeout = setTimeout(() => {
      if (!heardAudio) {
        if (window.notificationManager && typeof window.notificationManager.show === 'function') {
          window.notificationManager.show('No audio detected from input. Please check your mic/cable and try again.', 'warning', 5000);
        } else {
          alert('No audio detected from input. Please check your mic/cable and try again.');
        }
        if (statusElement) {
          statusElement.textContent = '🎤 Audio: Connected (no signal)';
          statusElement.style.color = 'orange';
        }
      }
    }, 3500);
    // Patch startPitchDetection to set heardAudio if frequency is detected
    const origStartPitchDetection = startPitchDetection;
    window._audioInputHeardAudio = false;
    startPitchDetection = async function patchedStartPitchDetection(target) {
      await origStartPitchDetection(target, (freq) => {
        if (freq && !heardAudio) {
          heardAudio = true;
          window._audioInputHeardAudio = true;
          if (statusElement) {
            statusElement.textContent = '🎤 Audio: Connected (hearing audio)';
            statusElement.style.color = 'green';
          }
        }
        lastFreq = freq;
      });
    };
    startPitchDetection(target);
    showPermissionFeedback('Audio', true);
    console.log('Audio permission granted');
    updateInputMethodButtons();
  } catch (error) {
    console.error('Audio permission failed:', error);
    showPermissionFeedback('Audio', false, error.message);
    updateInputMethodButtons();
  }
}

function stopAudioInput(target = null) {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  audioInputActive = false;
  audioInputTarget = null;
  let statusElement, startBtn, freqDisplay, noteDisplay, vuBar;
  if (target === 'tester') {
    statusElement = document.getElementById('audio-connection-status-tester');
    startBtn = document.getElementById('audio-start-btn-tester');
    freqDisplay = document.getElementById('audio-frequency-display-tester');
    noteDisplay = document.getElementById('audio-note-display-tester');
    vuBar = document.getElementById('vu-meter-bar-tester');
  } else {
    statusElement = document.getElementById('audio-connection-status');
    startBtn = document.getElementById('audio-start-btn');
    freqDisplay = document.getElementById('audio-frequency-display');
    noteDisplay = document.getElementById('audio-note-display');
    vuBar = document.getElementById('vu-meter-bar');
  }
  if (statusElement) {
    statusElement.textContent = '🎤 Audio: Disconnected';
    statusElement.style.color = 'black';
  }
  if (target === 'tester') {
    const testerStatus = document.getElementById('input-tester-status');
    if (testerStatus) {
      testerStatus.textContent = 'No Input Connected';
      testerStatus.style.color = '#4a90e2';
    }
  }
  if (startBtn) {
    startBtn.textContent = 'Start Audio Input';
    startBtn.classList.remove('stop-audio');
  }
  if (vuBar) vuBar.style.width = '0%';
  if (noteDisplay) noteDisplay.textContent = 'Play a note on your instrument';
  if (freqDisplay) freqDisplay.textContent = 'Frequency: --';
  updateInputMethodButtons();
}


async function startPitchDetection(target = null) {
  if (!audioInputActive || !analyser) return;

  // Load chosen detection library
  let pitchDetector = null;
  if (audioDetectLib === 'pitchy') {
    const detectorFactory = PitchDetector.forFloat32Array;
    pitchDetector = detectorFactory(analyser.fftSize);
  } else if (audioDetectLib === 'aubio') {
    await loadLibrary('aubio');
    pitchDetector = new window.Aubio().newPitch(
      "default",
      analyser.fftSize,
      analyser.fftSize,
      audioContext.sampleRate
    );
  }

  // Buffers for audio data
  const bufferLength = analyser.fftSize;
  const timeDomainData = new Float32Array(bufferLength);
  const freqData = new Uint8Array(bufferLength);

  // Detection loop
  const detectPitch = async () => {
    if (!audioInputActive) return;

    let frequency = null;

    if (audioDetectLib === 'pitchy') {
      analyser.getFloatTimeDomainData(timeDomainData);
      const [freq, clarity] = pitchDetector.findPitch(timeDomainData, audioContext.sampleRate);
      console.log('[DEBUG][Pitchy] freq:', freq, 'clarity:', clarity);
      if (clarity > 0.8) {
        frequency = freq;
      }
    } else if (audioDetectLib === 'aubio') {
      analyser.getFloatTimeDomainData(timeDomainData);
      const result = pitchDetector.do(timeDomainData);
      frequency = result[0];
      console.log('[DEBUG][Aubio] freq:', frequency, 'result:', result);
    } else {
      // Default FFT-based detection
      analyser.getByteFrequencyData(freqData);
      let maxAmp = 0, maxIndex = 0;
      const sensitivitySlider = document.getElementById('audio-sensitivity');
      const sensitivity = sensitivitySlider ? parseFloat(sensitivitySlider.value) : 0.3;
      const threshold = 255 * sensitivity;
      for (let i = 0; i < bufferLength; i++) {
        if (freqData[i] > maxAmp && freqData[i] > threshold) {
          maxAmp = freqData[i];
          maxIndex = i;
        }
      }
      if (maxAmp > threshold) {
        frequency = (maxIndex * audioContext.sampleRate) / (analyser.fftSize * 2);
      }
      console.log('[DEBUG][FFT] maxAmp:', maxAmp, 'maxIndex:', maxIndex, 'frequency:', frequency);
    }

    // Debug: log frequency and notify connection check
    if (frequency) {
      if (typeof window._audioInputHeardAudioCallback === 'function') {
        window._audioInputHeardAudioCallback(frequency);
      }
      const noteName = frequencyToNote(frequency);
      // Log the detected note name for debugging
      if (noteName) {
        console.log('[Pitchy] Detected note:', noteName, 'Frequency:', frequency.toFixed(2));
      }
      const suffix = target === 'tester' ? '-tester' : '';
      const freqDisplay = document.getElementById('audio-frequency-display' + suffix);
      const noteDisplay = document.getElementById('audio-note-display' + suffix);
      const vuBar = document.getElementById('vu-meter-bar' + suffix);

      if (freqDisplay) freqDisplay.textContent = `Frequency: ${frequency.toFixed(1)} Hz`;
      if (noteName && noteDisplay) noteDisplay.textContent = `Note: ${noteName}`;
      if (vuBar) {
        analyser.getByteFrequencyData(freqData);
        // Use the max value for a more responsive VU meter
        let max = 0;
        for (let v of freqData) if (v > max) max = v;
        vuBar.style.width = Math.min(100, (max / 255) * 100) + '%';
      }

      // Highlight key on piano UI (normalize note name for sharps/flats)
      document.querySelectorAll('#piano-ui .piano-key.active')
        .forEach(key => key.classList.remove('active'));
      // Try both sharp and flat equivalents
      let highlightNotes = [noteName];
      if (noteName && noteName.includes('#')) {
        // Convert sharp to flat (e.g., C#4 -> Db4)
        const sharpToFlat = {
          'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
        };
        const match = noteName.match(/^([A-G]#)(\d)$/);
        if (match && sharpToFlat[match[1]]) {
          highlightNotes.push(sharpToFlat[match[1]] + match[2]);
        }
      } else if (noteName && noteName.includes('b')) {
        // Convert flat to sharp (e.g., Db4 -> C#4)
        const flatToSharp = {
          'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
        };
        const match = noteName.match(/^([A-G]b)(\d)$/);
        if (match && flatToSharp[match[1]]) {
          highlightNotes.push(flatToSharp[match[1]] + match[2]);
        }
      }
      let found = false;
      for (const n of highlightNotes) {
        const keyEl = document.querySelector(`#piano-ui .piano-key[data-note="${n}"]`);
        if (keyEl) {
          keyEl.classList.add('active');
          setTimeout(() => keyEl.classList.remove('active'), 350);
          found = true;
          break;
        }
      }

      // Feed into quiz if active
      if (
        window.game &&
        (window.game.state.input.method === 'audio' ||
          window.game.state.input.method === 'instrument') &&
        !window.game.dom.elements.quizCard.classList.contains('hidden')
      ) {
        handleNoteInput(noteName);
      }
    }

    requestAnimationFrame(detectPitch);
  };

  // Allow callback for connection check
  window._audioInputHeardAudioCallback = arguments[1] || null;
  detectPitch();
}

function frequencyToNote(frequency) {
  if (!frequency || frequency <= 0) return null;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const A4 = 440;
  const semitones = 12 * (Math.log2(frequency / A4));
  const midi = Math.round(semitones) + 69;
  if (midi < 0 || midi > 127) return null;
  const note = noteNames[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return note + octave;
}

window.requestAudioPermission = requestAudioPermission;