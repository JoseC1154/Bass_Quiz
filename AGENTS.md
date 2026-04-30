# AGENTS.md

## Mission
Make safe, high-quality improvements to Bass_Quiz that help bass guitar players learn faster without breaking existing behavior. Prefer focused changes, preserve current UX where possible, and keep gameplay responsive on desktop and mobile.

## Branch Rules
- Work only on the current branch unless explicitly told otherwise.
- Do not create, switch, delete, or rename branches unless asked.
- Before changes, check current branch and status.
- Keep commits focused and descriptive.

## AI Workflow Rules
- Inspect real repository files before suggesting changes.
- Never invent filenames, functions, classes, routes, or features.
- Never reference filenames unless confirmed in repository.
- Prefer existing architecture over parallel rewrites.
- Explain plan before large edits.
- Use smallest safe patch first.
- If user says step-by-step, give one step only and wait.
- If context is incomplete, inspect code instead of assuming.
- If uncertain, say uncertain instead of guessing.
- Read AGENTS.md before major tasks.

## Prompt Execution Order
1. Inspect actual repository structure.
2. Identify files truly involved.
3. Summarize current behavior.
4. Propose smallest safe change.
5. Validate result.
6. Report evidence.

## Preferred Prompt Types
Best results usually come from:
- inspect this repo and locate X
- find where feature Y is controlled
n- compare files involved in Z flow
- propose minimal patch for bug X
- explain current architecture before edits
- identify duplicate or stale logic

Avoid generic prompts like:
- improve everything
- rewrite app
- make it better

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
- Keep UI responsive across desktop, tablet, and mobile.
- Preserve saved scores, settings, and progress where possible.
- Keep learning flow fast, clear, and fun.

## Architecture Discipline
- Search for an existing implementation before creating a new one.
- Extend or repair existing systems when possible.
- Do not create parallel quiz engines.
- Do not create duplicate scoring systems.
- Do not create duplicate state stores.
- Prefer replacing stale logic over running two systems side by side.
- If duplication is unavoidable, explain migration and cleanup path.

## Bass Player Product Focus
Prioritize features that specifically help bass players:
- fretboard note recognition
- interval and number-system drills
- key signature fluency
- scale degree recall
- chord tone targeting
- rhythm and timing drills
- ear training opportunities
- 4-string and 5-string support
- realistic practice speed progression
- clear right/wrong feedback

## Quiz Content Rules
- Music theory must be accurate.
- Bass fretboard positions must be accurate.
- Prefer practical musician language over academic jargon.
- Questions should become harder progressively.
- Reward speed and accuracy.
- Avoid repetitive question loops.

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
- improving player experience

Avoid:
- unnecessary full file rewrites
- style churn during bug fixes
- moving code without purpose
- replacing stable systems without evidence
- adding generic features unrelated to bass players

## Validation Rules (Required)
Before marking any task complete, run relevant validation for the area changed.

### Smoke Test Matrix
- Quiz logic / answers / scoring:
  run project test command if available

- UI / layout / mobile responsiveness:
  open app locally and verify manually

- Storage / save-load / settings:
  test refresh persistence manually

- Syntax-only fallback:
  node --check <changed file>

## Validation Expectation
- Test the directly changed flow.
- Test adjacent shared flows likely to regress.
- If no automated test exists, perform a lightweight smoke check and report it.

## Environment Blockers
If tests fail because of runtime issues, missing packages, browser limits, or local environment mismatch:
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

### Validation Run
- command

### Results
- PASS / FAIL / BLOCKED BY ENVIRONMENT
- brief reason

### Remaining Risk
- none / short note

## Bass_Quiz Priority Areas
When relevant, pay extra attention to:
- answer correctness
- timer accuracy
- score tracking
- streak systems
- difficulty progression
- mobile tap targets
- bass fretboard visuals
- theory accuracy
- duplicate questions
- localStorage regressions
- audio latency if sound is used
- accessibility and readability
- fast game startup

## Testing Discipline
- A task is incomplete if relevant validation was not run.
- If your change causes a failing test and the cause is clear, fix it and rerun.
- If no test exists for the changed area, say so and add a lightweight smoke test when appropriate.

## Response Discipline
Be concise, factual, and specific. Do not claim success without validation evidence.