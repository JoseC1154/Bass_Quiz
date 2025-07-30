# Copilot Instructions for Scale Driller

## Project Overview
- **Scale Driller** is a browser-based music quiz app for learning key and note placement on instruments (bass, guitar, piano, etc.).
- The app is a static web project (HTML/CSS/JS) with no build step or backend; all logic runs client-side.
- Main entry: `index.html` loads `script.js` and/or files in `js/`.

## Architecture & Key Files
- **UI logic** is modularized in `js/`:
  - `dom-manager.js`: Central DOM utility for element selection, show/hide, and text updates. All UI changes should use this class.
  - `game.js`, `quiz-manager.js`, `audio-manager.js`, `timer-manager.js`: Contain core quiz/game logic, state, audio, and timing.
  - `app.js`: Likely the main orchestrator for app startup and event wiring.
- **Assets**: Images/icons in `images/` and subfolders. Use relative paths for referencing in code.
- **Styles**: Multiple CSS files (`style.css`, `style_cleaned.css`, etc.); `style.css` is the default.

## Patterns & Conventions
- **DOM Access**: Always use `DOMManager` methods for UI manipulation (show/hide/setText/setHTML). Do not use `document.querySelector` directly outside this class.
- **Selectors**: All UI elements are referenced by IDs, mapped in `DOMManager`'s `selectors` object.
- **State**: App/game state is managed in `state.js` and/or `quiz-manager.js`.
- **No Frameworks**: Pure vanilla JS; do not introduce frameworks or build tools.
- **Audio**: Uses Web Audio API via `audio-manager.js`.

## Developer Workflows
- **Run/Debug**: Open `index.html` in a browser. No build or install step required.
- **Testing**: No formal test suite; manual testing in browser is standard.
- **Adding Features**: Extend or add to `js/` modules. Keep UI logic in `dom-manager.js` and business logic in relevant modules.
- **Styling**: Edit `style.css` for main styles. Use BEM or clear class naming for new styles.

## Examples
- To show the quiz card: `domManager.show('quizCard')`
- To update timer text: `domManager.setText('timerDisplay', '00:30')`

## External Integrations
- None. All logic and assets are local.

- See `README.md` for planned features and future modes.
- Keep code modular and readable; follow the structure of existing JS modules.

---

_If any conventions or workflows are unclear, please ask for clarification or examples from the codebase._
