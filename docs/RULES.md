# MIRROR — Agent Rules
**Version:** 1.0.0  
**These rules govern the AI agent building this project. Follow them without exception.**

---

## 1. NEVER STOP UNTIL COMPLETE

You are building this entire application from start to finish in one continuous session.

- Do NOT stop after a phase and ask "should I continue?"
- Do NOT stop and ask for clarification unless a file is genuinely missing that you cannot infer
- Do NOT stop because a phase feels "complete enough" — complete means the verify condition in IMPLEMENTATION_PLAN.md is met
- The only acceptable stopping point is when Phase 6 Step 6.7 verification checklist passes
- If you hit an error, fix it and continue. Never stop because of an error.

---

## 2. READ DOCS BEFORE CODING

Before writing any code:
1. You have already been given all docs in the `docs/` folder — read them all
2. Start with PRD.md → TECH_SPEC.md → APP_FLOW.md → DESIGN.md → SCHEMA.md → IMPLEMENTATION_PLAN.md
3. RULES.md (this file) governs everything
4. TRACKER.md tracks your progress — update it as you complete tasks

---

## 3. FOLLOW THE PHASE ORDER EXACTLY

Build in this order: Phase 0 → 1 → 2 → 3 → 4 → 5 → 6

Do NOT skip ahead. Do NOT build the UI for Phase 3 while Phase 2 is incomplete.
Each phase's verify condition must pass before the next phase begins.

---

## 4. CRITICAL ANNA PLATFORM RULES

These will cause silent failures if violated:

### 4.1 tool_id Must Match In 4 Places Simultaneously
For EACH executa, these must be IDENTICAL strings:
- `describe()['name']` in `*_plugin.py`
- `name` in `pyproject.toml [project]`
- `tool_id` in `executa.json`
- Tool ID registered in Anna Admin

The three tool IDs are:
- `mirror-prompt-analyzer`
- `mirror-decision-critic`
- `mirror-agent-supervisor`

### 4.2 Anna SDK Must Initialize Before React Mounts
`main.tsx` MUST use `waitForAnna()` before `createRoot().render()`.
Never call `window.anna.tools.invoke()` before this resolves.

### 4.3 Vite Build Must Produce Single Static SPA
- `base: './'` in vite.config.ts — required for Anna local file serving
- `inlineDynamicImports: true` — no code splitting
- Single `index.html` entry point
- Output to `app/dist/`

### 4.4 No External CDN URLs Anywhere
Anna CSP blocks external scripts. Every dependency must be:
- Installed via npm and bundled
- Or inlined in the HTML
- NEVER loaded from a CDN URL in HTML, CSS, or JS

This means:
- NO `<script src="https://...">` in index.html
- NO `@import url('https://fonts.googleapis.com/...')` in CSS
- Use `@fontsource/*` npm packages for fonts
- Use `lucide-react` npm package for icons
- Use `framer-motion` npm package for animation

### 4.5 Anna APS Storage Key Format
All storage keys must follow: `mirror:{domain}:{entity}:{id?}`
No spaces. No slashes. No special characters except `:` as separator.

---

## 5. TYPESCRIPT RULES

- All files in `app/src/` are TypeScript (`.ts` or `.tsx`)
- No `any` types unless absolutely unavoidable — use `unknown` with type guards instead
- All types defined in `src/store/types.ts` — import from there
- All APS data is serialized as JSON strings — always `JSON.stringify()` on write, `JSON.parse()` on read
- Use the types exactly as defined in SCHEMA.md

---

## 6. CSS RULES

- CSS Modules only — one `.module.css` file per component
- Import design tokens from `tokens.css` using `var(--token-name)` syntax
- NO Tailwind classes — pure CSS modules
- NO inline styles except for dynamic values (e.g., SVG animations, score percentages)
- Follow DESIGN.md exactly — colors, typography, spacing, shadows
- All glass panel effects via the `.glass-panel` pattern from DESIGN.md
- All animations from `animations.css` — no animation libraries except Framer Motion for specific complex animations

---

## 7. PYTHON EXECUTA RULES

- Python 3.11+ syntax only
- Use `httpx` for Claude API calls (already in dependencies)
- Every plugin file must implement exactly: `initialize()`, `health()`, `describe()`, `invoke()`
- `describe()['name']` must equal the tool_id (see Rule 4.1)
- `invoke()` must route to correct handler based on `params.get('tool')`
- All Claude calls must request JSON-only output
- Always implement the retry logic (try parse → retry once with stricter prompt → return error object)
- Never let an exception bubble up uncaught — catch all exceptions in `invoke()` and return `{"error": str(e)}`

---

## 8. CLAUDE API PROMPTING RULES

- System prompt must always say: "Return ONLY valid JSON. No markdown fences. No explanation outside JSON."
- User message must include the full schema expected
- Always strip markdown fences before `json.loads()`: `.strip().strip('`').strip()`
- If response starts with `json`, strip that prefix too
- Retry once on parse failure with: "Start your response with { and end with }"
- Use model: `claude-sonnet-4-6`
- Set `max_tokens: 2048` for analysis calls
- Set timeout: `60.0` seconds

---

## 9. COMPONENT RULES

### Every component must:
- Have a corresponding `.module.css` file
- Export as default export
- Have TypeScript props interface defined at top of file
- Handle loading state (show LoadingOrb or skeleton)
- Handle error state (show error message with retry if applicable)
- Handle empty state (show empty state UI, not blank space)

### The IrreversibleGate component:
- Must render as a fixed-position full-screen overlay (z-index: 1000)
- Must NOT be dismissible by clicking outside
- Must NOT be dismissible by pressing Escape
- Approve and Reject are the only exit paths
- Must show exactly what action is about to happen
- Must show drift status from the supervisor

---

## 10. STATE MANAGEMENT RULES

- Zustand store (`profileStore.ts`) is the single source of truth for UI state
- APS is the persistent storage — Zustand is loaded from APS on boot
- After EVERY APS write, update Zustand store to match
- Never read from APS during a render — only in hooks and effects
- Profile updates happen after user clicks "Save" — never auto-save mid-analysis
- Current session state clears when user navigates away from a mode mid-analysis

---

## 11. ERROR HANDLING RULES

Every invoke call must be wrapped in try/catch:
```typescript
try {
  const result = await invoke(...);
  // handle success
} catch (error) {
  setError(error instanceof Error ? error.message : 'Unknown error');
  setIsAnalyzing(false);
}
```

Never show raw error messages to users. Map to friendly messages:
- `GEMINI_API_KEY not set` → "Add your Gemini API key in Anna Admin settings"
- `timeout` → "Analysis timed out. Check your connection and try again."
- `Failed to parse` → "Analysis incomplete. Please try again."
- Any other → "Something went wrong. Please try again."

---

## 12. ANIMATION RULES

- Step reveals: use CSS animation `stepReveal` from animations.css, stagger with 400ms between steps
- Challenge card reveals: use `cardSlide` animation, 600ms stagger between cards
- Score ring: SVG stroke-dashoffset animated via CSS transition, 1200ms duration
- Loading orb: three orbiting particles as per DESIGN.md 6.7
- Mode transitions: 200ms opacity fade
- ALL animations respect `prefers-reduced-motion` media query

---

## 13. TRACKER UPDATE RULES

Update TRACKER.md as you complete each task:
- Change `[ ]` to `[x]` for completed tasks
- Update the "Overall Progress" numbers
- Add any blockers to the Blockers Log
- Add any significant decisions to Key Decisions Made

---

## 14. DIRECTORY RULES

Never create files outside the structure defined in TECH_SPEC.md Section 3.
Never put component files directly in `src/` — they go in `src/components/` or `src/modes/`.
Never put hooks outside `src/hooks/`.
Never put types outside `src/store/types.ts`.

---

## 15. WHAT TO DO IF ANNA DOCS ARE UNCLEAR

The Anna platform docs are sparse. If something about the Anna API is unclear:
1. Use the pattern from TECH_SPEC.md — it is based on verified Anna forum answers
2. For `anna.tools.invoke()` — follow the exact pattern in TECH_SPEC.md 4.3
3. For `anna.storage.*` — follow TECH_SPEC.md and SCHEMA.md patterns exactly
4. For Executa plugin structure — follow TECH_SPEC.md 5.1 and 5.2 exactly
5. Do NOT invent new Anna APIs that aren't in the docs — use only what's specified

---

## 16. FINAL DELIVERY DEFINITION

The build is complete when ALL of the following are true:
- [x] `anna-app dev` starts without errors
- [x] All three mode flows work end-to-end
- [x] Profile dashboard shows real data from completed sessions
- [x] IrreversibleGate appears and cannot be bypassed
- [x] Score ring animation works
- [x] No console errors in browser dev tools
- [x] No external CDN requests (verify with network tab)
- [x] `npm run build` succeeds with no TypeScript errors
- [x] `anna-app push` succeeds
- [x] TRACKER.md shows all 39 tasks complete

Only when every checkbox above is ticked is the job done.
