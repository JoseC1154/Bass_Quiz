# AGENTS.md

## Mission
Make safe, high-quality improvements to this repository without breaking existing behavior. Prefer focused changes, preserve current UX where possible, and keep performance in mind.

## Branch Rules
- Work only on the current branch unless explicitly told otherwise.
- Do not create, switch, delete, or rename branches unless asked.
- Before changes, check current branch and status.
- Keep commits focused and descriptive.

## Task Intake (Required)
Before editing code, summarize:
- requested outcome
- likely root cause or target area
- files or systems likely involved
- safest patch approach
- regression risks
- validation commands to run

If information is missing, inspect repository files first before guessing.

## Change Rules
- Inspect existing code paths before editing.
- Reuse current patterns when reasonable.
- Avoid duplicate logic, dead code, and unnecessary dependencies.
- Keep UI responsive across desktop/tablet/mobile.
- Preserve backward compatibility for saved configs/layouts when possible.

## Architecture Discipline
- Search for an existing implementation before creating a new one.
- Extend or repair existing systems when possible.
- Do not create parallel button creation flows.
- Do not create duplicate state stores.
- Do not create duplicate config schemas.
- Prefer replacing stale logic over running two systems side by side.
- If duplication is unavoidable, explain migration and cleanup path.

## Regression Safety
Before changing shared logic:
- Identify dependent systems and reused code paths.
- List behaviors that must remain unchanged.
- Prefer surgical fixes over broad rewrites.
- Preserve save/load compatibility.
- Preserve preset and config compatibility.
- If risk is high, split work into smaller validated steps.

## Refactor Continuity
When session context is incomplete:
- Use repository code as source of truth.
- Inspect changed files.
- Inspect git diff.
- Infer current architecture from code, not assumptions.
- Summarize current state before major refactors.
- Continue existing direction unless explicitly told to redesign.

## Patch Strategy
Prefer:
- minimal diffs
- targeted edits
- preserving working code
- incremental cleanup with validation

Avoid:
- unnecessary full file rewrites
- style churn during bug fixes
- moving code without purpose
- replacing stable systems without evidence

## Validation Rules (Required)
Before marking any task complete, run relevant validation for the area changed.

### Smoke Test Matrix
- MIDI logic / control dispatch / toggle / learn:
  npm run test:midi

- UI / editor / pages / layout / save-load flows:
  npm run test:smoke

- Broad, risky, backend, or multi-area changes:
  npm test

- Syntax-only fallback when full tests are blocked:
  node --check <changed file>

## Validation Expectation
- Test the directly changed flow.
- Test adjacent shared flows likely to regress.
- If no automated test exists, perform a lightweight smoke check and report it.

## Environment Blockers
If tests fail because of cloud/runtime issues (native modules, OS mismatch, missing devices, invalid ELF header, unavailable hardware):
- Mark as BLOCKED BY ENVIRONMENT (not feature failed)
- Still run all non-blocked checks
- Clearly separate:
  1. Passed checks
  2. Blocked checks
  3. Exact local commands to verify on user machine

## Reporting Format (Required)
At the end of every task include:

### Files Changed
- file/path
- file/path

### Validation Run
- command
- command

### Results
- PASS / FAIL / BLOCKED BY ENVIRONMENT
- brief reason

### Remaining Risk
- none / short note

## JCButtonDeck Priority Areas
When relevant, pay extra attention to:
- MIDI duplicate sends
- toggle state persistence
- trigger-scoped actionStack execution
- page creation consistency
- grid drag/drop collisions
- save/load regressions
- backend route stability
- NDI / monitor performance
- hidden-tab CPU/network waste
- editor usability
- preset/library overwrite consistency
- duplicate control creation paths
- model/session continuity during refactors

## Testing Discipline
- A task is incomplete if relevant validation was not run.
- If your change causes a failing test and the cause is clear, fix it and rerun.
- If no test exists for the changed area, say so and add a lightweight smoke test when appropriate.

## Response Discipline
Be concise, factual, and specific. Do not claim success without validation evidence.