# Component Definitions for Bass_Quiz

This file defines the purpose, functionality, and dependencies of each major component.  
AI assistants and developers should reference this file to ensure that each component behaves as intended.

---

## 1. App Bootstrap (app.js)

### Purpose
Initializes the app, creates the `Game` instance, manages global references, and handles UI switching between instruments.

### Key Behaviors
- Creates `game`, `audioManager`, and `notificationManager`.
- Exposes `window.handleNoteInput` to allow UI components to send note input to the game.
- Listens for clicks on `.input-icon` elements to:
  - Update the input mode indicator.
  - Hide all instrument UIs (`#keys-ui`, `#piano-ui`, `#bass-ui`, `#guitar-ui`).
  - Show the selected instrument UI.
  - Trigger `createPianoUI()` if `piano` is selected.
  - Automatically click the matching `.input-method-btn` to start detection.
- Resumes the `AudioContext` on the first user click.

### Dependencies
- `Game` class (from `game.js`)
- `createPianoUI` function (global)
  - **Purpose:** Dynamically generates and renders the piano UI on demand.
  - **Exposed as:** `window.createPianoUI` for external access by other scripts or debugging.
- `.input-method-btn` elements
- Instrument UI containers (`#keys-ui`, `#piano-ui`, `#bass-ui`, `#guitar-ui`)

- `#attack-time-container`: Container for attack time setting in the UI.
- `#key-select-container`: Container for key selection in the UI.
- `#degree-select-container`: Container for degree selection in the UI.
- `#time-mode-indicator`: Displays the current time mode.
- `#level-select`: Dropdown for difficulty level selection.
- `#mode-select-group`: Container for mode selection buttons.
- `.mode-icon`: Icons used for selecting quiz modes.
- `#helpCard`: Help information panel.
- `#closeHelpBtn`: Button to close the help card.
- `#detection-tester-btn`: Button for testing audio or MIDI input detection.
- `#helpBtn`: Button that opens the help card and pauses the quiz.

---

## 2. Game (game.js)

### Purpose
Manages quiz state, input handling, and interaction with audio/MIDI systems.

### Key Methods
- `start()`: Initializes a new quiz session.
- `handleNoteInput(note)`: Processes incoming note input (from UI, audio, or MIDI).
- `handleInputMethodChange(button)`:
  - Updates active input method (`midi`, `audio`, `instrument`, `touch`).
  - Requests microphone permission if `audio` is selected.
  - Requests MIDI permission if `midi` is selected.
  - Updates the UI to reflect the chosen input method.
- `updateInputUI()`: Refreshes UI states related to input.


### Dependencies
- `audioInputActive` (global)
- `midiAccess` (global)
- `requestAudioPermission()` from `audio-input.js`
- `requestMIDIPermission()` (likely in MIDI handling code)

### Related Globals
- `requestMIDIPermission()` (global)
  - **Purpose:** Requests permission to access connected MIDI devices.
  - **Usage:** Called in `handleInputMethodChange()` when MIDI is selected.
- `updateInputMethodButtons()` (global)
  - **Purpose:** Updates the state of input method buttons (MIDI, mic, cable).
  - **Usage:** Called after input method changes to refresh button states.
- `createPianoUI()`, `createBassUI()`, `createGuitarUI()` (global)
  - **Purpose:** Dynamically creates and renders UI for each instrument.
  - **Usage:** Invoked in `updateInputUI()` to display the correct instrument interface.

### Additional Dependencies
- `GameState`, `DOMManager`, `TimerManager`, `AudioManager`, `QuizManager`, `NotificationManager`
  - **Purpose:** Core classes instantiated in `game.js` for state management, UI handling, audio control, quiz logic, and user notifications.


### Help Button Behavior
- When the help button is pressed:
  - Pauses the quiz using `timerManager.pause()`.
  - Displays the `#helpCard` element with the current scale and note degrees, retrieved from `quizManager`.
  - Disables note input while help is open.
- When the close help button is pressed:
  - Hides the `#helpCard` element.
  - Resumes the quiz using `timerManager.resume()`.

### Input Tester Behavior
- When the input tester button (`#detection-tester-btn`) is pressed:
  - Opens the input tester interface.
  - Starts listening for input from audio (via `audio-input.js`) and/or MIDI (via `midi-input.js`).
  - Displays detected notes or input signals for testing connected devices.
  - May pause quiz interactions while the tester is open to prevent interference.

---

## 3. Audio Manager (audio-input.js)

### Purpose
Handles audio input (microphone or interface) and pitch detection.

### Key Functions
- `requestAudioPermission()`:
  - Requests microphone access.
  - Sets `window.audioInputActive` to `true` or `false` based on permission.
- `startPitchDetection(target)`:
  - Starts pitch detection using Pitchy or Aubio.
  - Creates an analyzer node and continuously detects pitch.
- `loadLibrary(lib)`:
  - Loads `aubio` dynamically (Pitchy is bundled via npm).

### Dependencies
- `PitchDetector` (from `pitchy`)
- `Aubio` (from `aubio.js`)
- `audioInputActive` (global)

### Related Globals
- `showPermissionFeedback` (global)
  - **Purpose:** Displays visual feedback to the user when audio permission is granted or denied.
  - **Usage:** Called in `requestAudioPermission()` to notify the user of permission results.
- `updateInputMethodButtons` (global)
  - **Purpose:** Refreshes the UI state of input method buttons (MIDI, mic, cable).
  - **Usage:** Triggered after requesting audio permission or stopping audio input.
- `handleNoteInput` (global)
  - **Purpose:** Sends detected note input from pitch detection to the active quiz/game instance.
  - **Usage:** Invoked in `startPitchDetection()` after detecting a pitch.

### Additional Dependencies
- `CONFIG.audio.correctVolume`, `CONFIG.audio.incorrectVolume`, `CONFIG.audio.tickVolume`
  - **Purpose:** Defines audio playback volumes for correct/incorrect sounds and metronome ticks.
  - **Source:** Global `CONFIG` object (likely in `config.js`).
- `domManager.audioContext`
  - **Purpose:** Provides the shared `AudioContext` instance for all audio operations.
  - **Source:** `domManager` module or singleton used across the application.

---


## 4. UI Components (ui-components.js)

### Purpose
Manages the rendering and interaction of instrument UIs (piano, bass, guitar) and updates input method buttons.

### Key Functions
- `createPianoUI()`
  - **Purpose:** Generates and renders the piano UI dynamically.
  - **Usage:** Called when piano input is selected in the application.
- `createBassUI()`
  - **Purpose:** Generates and renders the bass UI with string and fret mapping.
  - **Usage:** Called when bass input is selected.
- `createGuitarUI()`
  - **Purpose:** Generates and renders the guitar UI with string and fret mapping.
  - **Usage:** Called when guitar input is selected.
- `generateFrets(openNote, fretCount)`
  - **Purpose:** Builds the fret buttons for stringed instruments based on the root note and number of frets.
  - **Usage:** Used internally by `createBassUI()` and `createGuitarUI()`.
- `updateInputMethodButtons()`
  - **Purpose:** Enables or disables input method buttons (MIDI, mic, cable) based on:
    - MIDI support (`navigator.requestMIDIAccess`)
    - Audio support (`navigator.mediaDevices`)
    - Current state of `midiAccess` and `audioInputActive`
  - **Usage:** Refreshes button appearance and tooltips dynamically.

### Dependencies
- `handleNoteInput()` (global)
  - **Purpose:** Sends note input from UI components to the game logic.
- `CONFIG.notes` (from `config.js`)
  - **Purpose:** Provides note definitions for generating instrument interfaces.
- `midiAccess` (global from `midi-input.js`)
- `audioInputActive` (global from `audio-input.js`)
- DOM elements:
  - `#piano-ui`
  - `#bass-ui`
  - `#guitar-ui`
  - `#quiz-card`
  - Input buttons: `#touch-input-btn`, `#midi-input-btn`, `#mic-input-btn`, `#cable-input-btn`

---

## 5. Known Global Variables

| Variable           | Type    | Purpose                                  |
|--------------------|---------|------------------------------------------|
| `audioInputActive` | Boolean | Indicates if microphone access is granted. |
| `midiAccess`       | Object  | Stores MIDI access from `navigator.requestMIDIAccess`. |

---

## 6. Configuration (config.js)

### Purpose
The `CONFIG` object provides centralized configuration values for game logic, audio settings, UI options, and note/key definitions.

### Structure
- `CONFIG.audio`
  - `correctVolume`: Volume for correct answer sound.
  - `incorrectVolume`: Volume for incorrect answer sound.
  - `tickVolume`: Volume for metronome ticks.
  - `frequencies`: Map of note names to their corresponding frequencies.
- `CONFIG.timer`
  - Quiz timing settings (e.g. duration, countdown intervals).
- `CONFIG.keys`
  - Key definitions for quizzes (e.g. C, G, D).
- `CONFIG.notes`
  - Note definitions (e.g. C, C#, D).
- `CONFIG.levels`
  - Difficulty levels and their parameters.
- `CONFIG.ui`
  - UI-related constants for layout and appearance.

### Dependencies
- Used in `audio-input.js` for volume settings.
- Referenced in `game.js` for quiz behavior.
- May be used in `ui-components.js` for UI behavior.

---

## 7. DOM Manager (dom-manager.js)

### Purpose
Provides a centralized interface for accessing and manipulating DOM elements across the application.  
Also manages a shared `AudioContext` instance used by the Audio Manager.

### Key Methods
- `cacheElements()`: Stores references to important DOM elements for quick access.
- `show(elementKey)`: Removes the `hidden` class from a cached element.
- `hide(elementKey)`: Adds the `hidden` class to a cached element.
- `setText(elementKey, text)`: Updates the text content of an element.
- `setHTML(elementKey, html)`: Updates the inner HTML of an element.

### Exposed Singleton
- `domManager`
  - **Purpose:** Global instance of the DOM Manager.
  - **Usage:** Used by `audio-input.js` and potentially other files to manage UI updates and access `audioContext`.

### Dependencies
- `window.AudioContext || window.webkitAudioContext`
  - **Purpose:** Provides a shared `AudioContext` instance for audio processing.

---

## 8. MIDI Input (midi-input.js)

### Purpose
Handles requesting MIDI access, monitoring connected devices, listening for MIDI messages, and translating MIDI note data into note input for the quiz.

### Exposed Globals
- `midiAccess`
  - **Purpose:** Stores MIDI access from `navigator.requestMIDIAccess`.
- `midiInputActive`
  - **Purpose:** Boolean tracking whether MIDI input is active.
- `requestMIDIPermission()`
  - **Purpose:** Requests MIDI device access and sets up event listeners for MIDI messages.
- `showPermissionFeedback()`
  - **Purpose:** Displays user feedback (success or failure) for MIDI permission requests.

### Related Globals
- `updateInputMethodButtons()`
  - **Purpose:** Refreshes the state of input method buttons (MIDI, mic, cable) after permission or device changes.
- `handleNoteInput()`
  - **Purpose:** Processes detected MIDI notes and forwards them to the game logic.
- `window.game`
  - **Purpose:** Provides access to the global game instance for checking input method state.

### Browser APIs
- `navigator.requestMIDIAccess`
  - **Purpose:** Requests access to connected MIDI devices.
- `MIDIMessageEvent.data`
  - **Purpose:** Raw MIDI message data used to extract note and velocity information.

---

## 9. Notification Manager (notification-manager.js)

### Purpose
Manages the display of notifications for the application, providing feedback to the user for events such as permission requests, errors, and general updates.

### Exposed Globals
- `NotificationManager`
  - **Purpose:** Class responsible for creating and managing notifications.
  - **Usage:** Instantiated in `app.js` or `game.js` and may be assigned to `window.notificationManager`.

### Key Methods
- `show(message, type)`
  - **Purpose:** Displays a notification with the specified message and type (e.g. success, error, warning, info).
- `dismiss(notificationElement)`
  - **Purpose:** Removes a notification from the DOM manually or automatically after a timeout.

### Dependencies
- CSS animations: `slideInRight`, `slideOutRight`
  - **Purpose:** Provide entry and exit animations for notifications.
  - **Source:** Must be defined in the global stylesheet.
- `document.body`
  - **Purpose:** Used to append notification elements to the DOM.

---

## 10. Quiz Manager (quiz-manager.js)

### Purpose
Handles quiz generation, question display, answer validation, scoring, and results presentation.

### Dependencies
- `CONFIG`
  - **Purpose:** Provides keys, notes, scale steps, and UI configuration for quiz logic.
- `GameState`
  - **Purpose:** Tracks quiz progress, current question, score, and session state.
- `domManager`
  - **Purpose:** Updates quiz-related UI elements such as question prompts and answer buttons.
- `timerManager`
  - **Purpose:** Manages timeouts, countdowns, and tick rewards or penalties during a quiz.
- `audioManager`
  - **Purpose:** Plays correct/incorrect sounds during gameplay.
- `localStorage`
  - **Purpose:** Stores and retrieves the best score for quizzes.
- `performance.now()`
  - **Purpose:** Measures precise time for quiz sessions.

### Related Globals
- DOM IDs: `degree-select`, `scale-type`, `attack-time-select`
  - **Purpose:** Required elements for configuring quiz settings in the UI.

---

## 11. Service Worker (service-worker.js)

### Purpose
Manages caching and offline access to assets using the Service Worker API.

**Note:** Ensure the registration path in `index.html` matches the actual location of the service worker (e.g. `/service-worker.js` or `/js/service-worker.js`).

### Key Constants
- `CACHE_NAME`
  - **Purpose:** Versioned cache identifier for storing assets.
- `ASSETS_TO_CACHE`
  - **Purpose:** List of application assets to pre-cache during installation.

### Browser APIs
- `caches`
  - **Purpose:** Provides methods for creating, retrieving, and deleting cached assets.
- `self`
  - **Purpose:** Service Worker global context used for lifecycle event handling.
- `fetch`
  - **Purpose:** Intercepts network requests and serves cached responses if available.

### Events
- `install`
  - **Purpose:** Pre-caches application assets for offline use.
- `activate`
  - **Purpose:** Removes outdated caches from previous versions.
- `fetch`
  - **Purpose:** Serves requests from cache or fetches them from the network if not cached.

---

## 12. Game State (state.js)

### Purpose
Manages the persistent state for the game session, including quiz data, timer, input method, and mode settings.

### Dependencies
- `CONFIG.timer`
  - **Purpose:** Provides default values for ticks and BPM.

### Properties
- `quiz`
  - `data`: Array of quiz questions.
  - `currentIndex`: Current question index.
  - `correctAnswers`: Number of correct answers.
  - `active`: Indicates if a quiz is currently in progress.
  - `startTime`: Timestamp when the quiz session started.
- `timer`
  - `totalTicks`: Initial tick count, based on `CONFIG.timer.defaultTicks`.
  - `currentBpm`: Current tempo in beats per minute.
  - `levelStartBpm`: BPM at the start of the current level.
  - `correctStreak`: Number of consecutive correct answers.
  - `isPaused`: Boolean flag for paused timer state.
- `input`
  - `method`: Current input method (`touch`, `audio`, `midi`, or `instrument`).
  - `audioActive`: Boolean indicating microphone state.
  - `midiActive`: Boolean indicating MIDI state.
- `mode`
  - `type`: Active quiz mode (e.g., BPM Challenge, Time Attack).
  - `timeAttack.countdown`: Countdown value for Time Attack mode.
  - `timeAttack.interval`: Reference to the countdown interval.

### Usage
- Accessed and updated by `game.js` to manage gameplay.
- Referenced by `quiz-manager.js` for quiz state tracking.

---

## 13. Timer Manager (timer-manager.js)

### Purpose
Provides a centralized timing mechanism for quizzes, including tick-based progression and BPM-based timing.

### Dependencies
- `gameState` (from `state.js`)
  - **Purpose:** Provides access to quiz state and timer values for updating ticks and BPM.
- `domManager` (from `dom-manager.js`)
  - **Purpose:** Updates UI elements such as tick counters and handles quiz card transitions.

### Key Methods
- `setInterval(name, callback, delay)`
  - **Purpose:** Creates a named interval for executing repeated actions.
- `clearInterval(name)`
  - **Purpose:** Clears a previously created interval.
- `setTimeout(name, callback, delay)`
  - **Purpose:** Creates a named timeout for delayed execution.
- `clearTimeout(name)`
  - **Purpose:** Clears a previously created timeout.
- `clearAll()`
  - **Purpose:** Clears all active intervals and timeouts.
- `addTicksForCorrect()`
  - **Purpose:** Rewards the player with additional ticks for correct answers.
- `subtractTicksForWrong()`
  - **Purpose:** Deducts ticks for incorrect answers.
- `start()`
  - **Purpose:** Starts and manages the main quiz timer, adjusting BPM progression.

### Browser APIs
- `setInterval`
- `clearInterval`
- `setTimeout`
- `clearTimeout`

### Usage
- Utilized in `game.js` to manage quiz timing and progression.
- Referenced in `quiz-manager.js` to adjust ticks and control the timer during gameplay.

---

## Piano UI Quiz Answer Selection

- Piano keys act as answer choices during a quiz.
- All possible correct keys highlight green when selected.
- Wrong keys highlight red.
- All keys are disabled after a selection.
- Answer buttons (if present) are also highlighted and disabled.
