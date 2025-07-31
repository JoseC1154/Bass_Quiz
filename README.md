# Scale Driller

Scale Driller is a browser-based music theory training app for learning key and note placement on instruments such as bass, guitar, and piano. The app is fully client-side, requiring no backend or build step—just open `index.html` in your browser.

## Features
- **Quiz Modes:** Practice, Time Attack, and BPM Challenge
- **Instrument UIs:** Virtual interfaces for piano, bass, guitar, MIDI, and audio input
- **Accessibility:** ARIA roles and labels for improved accessibility
- **Responsive Design:** Mobile-friendly and touch-optimized
- **Manual Testing:** No automated tests; test by opening in a browser
- **Help Button:** Pause the quiz and display the current scale with note degrees
- **Input Tester:** Test MIDI and audio inputs before starting a quiz
- **Offline Support:** Service worker for caching and running the app offline

## How It Works
- Select your quiz mode, level, key, scale type, and input method from the settings card
- Start the quiz to answer questions about scale degrees, note positions, or key relationships
- Use the Help button during the quiz to pause and review the scale with note degrees
- Use the Input Tester to verify MIDI or audio input before starting a quiz
- Use the virtual instrument UIs or connect MIDI/audio input for interactive play
- Get instant feedback and track your best score

## Scales and Notes
- **Supported Keys:** C, D, E, F, G, A, B, F#, Ab, Bb, Db, Eb
- **Note Names:** C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B
- **Scale Construction:**
  - Major: `[2, 2, 1, 2, 2, 2, 1]` (whole/half steps)
  - Minor: `[2, 1, 2, 2, 1, 2, 2]`
- **Quiz Logic:**
  - Questions ask for the degree of a scale in a given key, or the key for a given note/degree
  - Options are generated from the scale notes and shuffled

## Project Structure
- `index.html` — Main entry point and UI layout
- `style.css` — Main styles (BEM/clear class naming)
- `js/` — Modular JavaScript:
  - `dom-manager.js`: All DOM/UI changes (use this for UI updates)
  - `game.js`, `quiz-manager.js`, `audio-manager.js`, `timer-manager.js`: Core logic
  - `app.js`: App startup and event wiring
  - `state.js`: State management
  - `ui-components.js`: UI helpers
- `images/` — Icons and instrument images

## Developer Conventions
- **No frameworks or build tools** — pure vanilla JS, HTML, CSS
- **All DOM access via `DOMManager`** — do not use `document.querySelector` outside this class
- **Assets are local** — no external dependencies
- **Manual testing** — open `index.html` in your browser

## Planned Features & Roadmap
- Difficulty bar and improved score tracking
- More instrument UIs and training modes (chord mode, tritone, etc.)
- Visual and accessibility improvements

## Getting Started
1. Clone or download this repository
2. Open `index.html` in your browser
3. Select your settings and start training!

---

_See `.github/copilot-instructions.md` for AI agent and contributor guidelines._
