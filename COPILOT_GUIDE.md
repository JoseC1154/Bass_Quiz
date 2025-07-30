# Copilot Guide for Scale Driller

## Project Overview
Scale Driller is a browser-based music quiz app for learning note and key placement on instruments (bass, guitar, piano, etc.).  
It is a **static web app using only HTML, CSS, and vanilla JavaScript**. All logic runs client-side and the app must be installable as a PWA to support offline use.

## Key Files & Structure
- `index.html`: Main entry point.
- `style.css`: Main stylesheet (use BEM or clear class names for new styles).
- `js/` directory: Modular JavaScript files.
  - `dom-manager.js`: Central DOM utility. **All UI changes must use DOMManager methods.**
  - `game.js`: Main game logic and state management.
  - `quiz-manager.js`: Quiz logic and question generation.
  - `audio-manager.js`: Handles audio playback and Web Audio API.
  - `audio-input.js`: Handles microphone input, pitch detection, and Input Tester modal.
  - `ui-components.js`: Renders instrument UIs (piano, bass, guitar, etc.).
  - `app.js`: App startup, event wiring, and global exposure of key functions.
  - `state.js`: App/game state.
- `service-worker.js`: PWA caching and offline support for HTML, CSS, JS, images, and libraries.
- `manifest.json`: PWA manifest for installable offline support.
- `images/`: Icons and instrument images.
- `libs/`: External libraries (e.g. `pitchy.min.js`, `aubio.js` for pitch detection).

## Coding Conventions
- **No frameworks or build tools.**  
  Use only HTML, CSS, and vanilla JavaScript. All libraries must be loaded using `<script>` tags.
- **DOM Access:** Only use `DOMManager` for UI manipulation (`show`, `hide`, `setText`, `setHTML`). Do not use `document.querySelector` directly outside this class.
- **Selectors:** All UI elements referenced by IDs, mapped in `DOMManager.selectors`.
- **State:** Managed in `state.js` and/or `quiz-manager.js`.
- **Audio:**
  - Use Web Audio API via `audio-manager.js`.
  - For note detection, integrate `pitchy` or `aubio.js` via `<script>` tags to improve detection accuracy.
  - Provide a fallback to the current Web Audio API pitch detection if libraries fail to load.
- **Instrument UIs:** Use `createPianoUI`, `createBassUI`, etc. for dynamic rendering. Expose these globally if needed.
- **Global Functions:** Expose `handleNoteInput` and instrument UI creators on `window` for dynamic event handlers.

## PWA and Offline Support
- Add a `service-worker.js` to cache:
  - All HTML, CSS, JS modules.
  - External libraries in `libs/`.
  - All instrument images and icons.
- Add `manifest.json` for installable app behavior.
- Ensure the app runs fully offline after the first visit.

## Developer Workflow
- **Run/Debug:** Open `index.html` in a browser. No build or install step.
- **Testing:** Manual browser testing. No formal test suite.
- **Adding Features:**
  - Extend or add to `js/` modules.
  - Keep UI logic in `dom-manager.js` and business logic in relevant modules.
  - Use `handleNoteInput(note)` for instrument UI note events.
  - For note detection improvements, extend `audio-manager.js` and `audio-input.js`.
- **Styling:** Edit `style.css` for main styles. Use BEM or clear class naming.

## Example Patterns
- Show quiz card:  
  ```javascript
  domManager.show('quizCard')