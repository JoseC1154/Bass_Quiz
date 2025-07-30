let midiAccess = null;
let midiInputActive = false;

async function requestMIDIPermission() {
  try {
    if (navigator.requestMIDIAccess) {
      if (!midiAccess) {
        midiAccess = await navigator.requestMIDIAccess();
        console.log('MIDI permission granted');
        
        // Update connection status
        updateMIDIStatus();
        
        // Listen for MIDI device changes
        midiAccess.onstatechange = updateMIDIStatus;
        
        // Set up MIDI input listeners
        setupMIDIInputs();
        
        // Show success feedback
        showPermissionFeedback('MIDI', true);
        
        // Update button states
        updateInputMethodButtons();
      }
    } else {
      console.log('MIDI not supported in this browser');
      showPermissionFeedback('MIDI', false, 'Not supported in this browser');
      updateInputMethodButtons();
    }
  } catch (error) {
    console.error('MIDI permission failed:', error);
    showPermissionFeedback('MIDI', false, error.message);
    updateInputMethodButtons();
  }
}

function updateMIDIStatus() {
  if (!midiAccess) return;
  
  const inputs = Array.from(midiAccess.inputs.values());
  const statusElement = document.getElementById('midi-connection-status');
  const deviceListElement = document.getElementById('midi-device-list');
  
  if (inputs.length > 0) {
    if (statusElement) {
      statusElement.textContent = '🎹 MIDI: Connected';
      statusElement.style.color = 'green';
    }
    
    if (deviceListElement) {
      const deviceNames = inputs.map(input => input.name).join(', ');
      deviceListElement.textContent = `Devices: ${deviceNames}`;
    }
  } else {
    if (statusElement) {
      statusElement.textContent = '🎹 MIDI: No Devices';
      statusElement.style.color = 'orange';
    }
    
    if (deviceListElement) {
      deviceListElement.textContent = 'Connect a MIDI device';
    }
  }
  
  // Update input method button states when MIDI status changes
  updateInputMethodButtons();
}

function setupMIDIInputs() {
  if (!midiAccess) return;
  
  for (const input of midiAccess.inputs.values()) {
    input.onmidimessage = handleMIDIMessage;
  }
}

function handleMIDIMessage(message) {
  const [command, note, velocity] = message.data;
  
  // Note on message (144 + channel) with velocity > 0
  if ((command & 0xf0) === 0x90 && velocity > 0) {
    const noteName = midiNoteToName(note);
    console.log('MIDI Note:', noteName);
    
    // Update display
    const noteDisplay = document.getElementById('midi-note-display');
    if (noteDisplay) {
      noteDisplay.textContent = `Note: ${noteName}`;
    }
    
    // Check if we're in quiz mode and MIDI input method is selected
    if (window.game && window.game.state.input.method === 'midi' && 
        !window.game.dom.elements.quizCard.classList.contains('hidden')) {
      handleNoteInput(noteName);
    }
  }
}

function midiNoteToName(midiNote) {
  const noteNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const noteName = noteNames[midiNote % 12];
  return noteName;
}

function showPermissionFeedback(permissionType, granted, errorMessage = '') {
  const notification = document.createElement('div');
  notification.className = 'permission-notification';
  
  if (granted) {
    notification.textContent = `${permissionType} permission granted! ✅`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
  } else {
    notification.textContent = `${permissionType} permission failed: ${errorMessage} ❌`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #dc3545, #e74c3c);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}