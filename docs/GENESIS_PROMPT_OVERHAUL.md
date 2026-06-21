# MIRROR — Project Genesis Document Quality Overhaul
**Version:** 6.0  
**Problem:** Generated documents are shallow echo-backs of user answers.  
**Fix:** Complete rewrite of all 8 Claude generation prompts to produce elaborate, architect-level documents.  
**Read completely before touching any code.**

---

## The Core Problem

The current `generate_documents` method in `project_genesis_plugin.py` uses weak, generic prompts. Claude is returning surface-level content — restating what the user said without expanding, inferring, or architecting.

The fix is entirely in the prompts. No UI changes needed. No structural changes. Just rewrite the system prompts and document-specific instructions in the Python plugin.

---

## The Golden Rule For All 8 Prompts

Add this to EVERY document generation call:

```
CRITICAL RULES — VIOLATIONS WILL MAKE THIS DOCUMENT USELESS:

1. NEVER echo back what the user said. Expand it. Infer from it. Architect from it.
2. Every section must be LONG. Minimum 3-4 paragraphs per major section.
3. Include things the user DIDN'T say but any good engineer would know is needed.
4. Be SPECIFIC. No placeholders. No "TBD". No "e.g." — use real names, real values, real decisions.
5. Make decisions the user didn't make. A good architect doesn't ask permission for every detail.
6. Every document must be so complete that a developer who has never spoken to the user could build the exact product from this document alone.
7. Minimum length: 800 words per document. Most should be 1200-2000 words.
```

---

## Updated Base System Prompt

Replace the current `GENERATE_PROMPT_BASE` in `project_genesis_plugin.py` with this:

```python
GENERATE_PROMPT_BASE = """
You are a principal software architect and senior technical writer with 15 years of experience 
shipping production software. You are generating {doc_type} documentation for a real project 
that a developer will use to build from scratch.

PROJECT SPECIFICATION:
{spec_json}

PREVIOUSLY GENERATED DOCS (for consistency):
{previous_docs_summary}

YOUR JOB:
Generate a complete, elaborate, production-grade {doc_type} document for this project.

CRITICAL RULES — NEVER VIOLATE THESE:
1. NEVER echo back what the user said. Expand every point into full detail.
2. Make architectural decisions the spec didn't specify — good engineers do this automatically.
3. Every major section must be 3-5 paragraphs minimum, not bullet points alone.
4. Include things the user didn't mention but that any production app needs.
5. Be brutally specific: real package names with versions, real file paths, real function names.
6. No placeholders. No "TBD". No "[insert X here]". Every field filled with real content.
7. Minimum 1000 words. Longer is better. This document must be exhaustive.
8. Write as if this document will be read by a developer who has never spoken to anyone 
   about this project — it must be 100% self-contained.

{doc_specific_prompt}

Return the complete document as raw markdown. No JSON wrapper. No backticks around the whole thing.
Start directly with the # heading.
"""
```

---

## The 8 Document-Specific Prompts

Replace `DOC_INSTRUCTIONS` dict entirely with these detailed prompts:

### PRD Prompt
```python
PRD_PROMPT = """
Generate a Product Requirements Document with these MANDATORY sections, each elaborately filled:

# [Product Name] — Product Requirements Document
Version: 1.0.0 | Status: Active | Owner: Solo Developer

## 1. Executive Summary
Write 3-4 paragraphs. Describe what this product is, what gap in the market it fills, 
why existing solutions fail, and what success looks like. Be specific about the opportunity.

## 2. Problem Statement
Write the problem in three layers:
- Surface problem: what users complain about
- Real problem: the underlying cause
- Cost of the problem: what happens when it goes unsolved (time lost, money lost, frustration)
Be specific. Use numbers where possible. E.g. "Developers spend 20-40 minutes writing commit 
messages per day" not "developers waste time."

## 3. Target Users
Define 2-3 specific user personas. For each:
- Name and role (fictional but specific: "Arjun, 26, solo SaaS founder")
- Their daily workflow
- Their specific pain with this problem
- What they've tried before and why it failed
- What success looks like for them

## 4. Product Vision
One clear vision statement, then 3-4 paragraphs explaining the long-term product direction.
Where does this product go in 2 years? What does version 3.0 look like?

## 5. Core Features (MVP)
For each feature (minimum 4 features):
- Feature name and one-line description
- Full paragraph explaining what it does and why it matters
- Specific user interaction: step by step what the user does
- What the system does in response
- Edge cases that must be handled
- What is explicitly NOT included in this feature for v1

## 6. Out of Scope (v1)
List 6-8 things explicitly excluded from v1 with one sentence explaining why each was deferred.

## 7. Success Metrics
Define 4-5 specific measurable metrics with:
- Metric name
- How it's measured
- Current baseline (if applicable)
- Target for v1 launch
- Target for 3 months post-launch

## 8. Technical Constraints
List all real constraints: platform, performance requirements, browser support, 
device support, offline requirements, accessibility requirements, compliance requirements.

## 9. Risks & Mitigations
List 4-5 real risks with likelihood (High/Med/Low), impact (High/Med/Low), 
and specific mitigation strategy.

## 10. Open Questions
List 3-5 genuine open questions that need resolution before or during development,
with a suggested approach for each.
"""
```

### TECH_SPEC Prompt
```python
TECH_SPEC_PROMPT = """
Generate a Technical Specification with these MANDATORY sections:

# [Product Name] — Technical Specification
Version: 1.0.0 | Stack: [inferred from spec]

## 1. Architecture Overview
Write 3-4 paragraphs describing the overall architecture philosophy and approach.
Then include an ASCII diagram showing all major components and their relationships:

```
[Component A] ──────► [Component B]
      │                     │
      ▼                     ▼
[Component C] ◄──── [Component D]
```

Explain each arrow: what data flows, in what direction, triggered by what.

## 2. Technology Stack
For EVERY technology, explain:
- What it is
- Why this specific choice over alternatives (e.g. "Vite over CRA because...")
- Version to use (be specific: "React 18.2.0, NOT React 19 due to...")
- Any gotchas or important configuration notes

Cover: frontend framework, build tool, styling, state management, routing, 
database/storage, authentication, API layer, testing, deployment, monitoring.

## 3. Complete Directory Structure
Show the FULL file tree, every folder and every file:
```
project-root/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx        ← navigation, mode switching
│   │   │   ├── TopBar.tsx         ← breadcrumb, user info  
│   │   │   └── Layout.tsx         ← shell wrapper
```
Include a comment on every file explaining exactly what it does.

## 4. Core Components
For each major component (minimum 5):
- Component name and file path
- Props interface (full TypeScript)
- State it manages
- What it renders
- Side effects it triggers
- Dependencies on other components/hooks

## 5. Data Flow
Describe how data moves through the app for each major user action.
Use this format:
```
User clicks [X]
  → [Component] calls [function]
  → [function] calls [API/hook]
  → [State] updates
  → [UI] re-renders showing [result]
```
Cover at least 3 core user flows.

## 6. API Design
If the app has any API (internal or external):
- Full endpoint list with method, path, request body, response body
- Authentication approach
- Error response formats
- Rate limiting approach

## 7. State Management
- What state management library/approach and why
- What global state exists (with TypeScript interface)
- What local state stays in components (and which components)
- How state persists (localStorage, database, memory)

## 8. Error Handling Strategy
- What errors can occur (network, auth, validation, unexpected)
- How each is caught
- How each is shown to users
- How errors are logged

## 9. Performance Considerations
- Expected data sizes
- Potential bottlenecks identified upfront
- Caching strategy
- Code splitting approach
- Bundle size targets

## 10. Security Considerations
- Authentication approach with implementation details
- Authorization: who can do what
- Input validation: where and how
- Sensitive data handling
- CORS configuration
- Common vulnerabilities and how this app prevents them

## 11. Testing Strategy
- Unit testing: what gets tested, what tool, example test
- Integration testing: what flows get tested
- E2E testing: critical paths
- How to run all tests

## 12. Build & Deployment
Exact commands for:
- Development setup (step by step, copy-pasteable)
- Running locally
- Running tests
- Building for production
- Deploying (to specific platform)
"""
```

### APP_FLOW Prompt
```python
APP_FLOW_PROMPT = """
Generate a comprehensive App Flow document:

# [Product Name] — App Flow
Version: 1.0.0

## 1. Application Entry & Initialization
Describe step by step what happens when the app loads:
- What files load in what order
- What initialization code runs
- What state is set up
- What the user sees during loading
- What happens if initialization fails

## 2. Navigation Architecture
Draw the complete navigation structure:
```
/ (root)
├── /dashboard          ← main landing
├── /[feature-1]        ← description
│   └── /[feature-1]/[sub]  ← description
├── /[feature-2]
└── /settings
```
For each route: what component renders, what state it needs, who can access it.

## 3. User Flows — One Per Core Feature
For EACH major feature, document the complete flow with ASCII UI mockups:

### Flow 1: [Feature Name]
**Entry point:** [how user gets here]
**Prerequisites:** [what must be true before user can do this]

Step 1: User sees [describe exact UI with ASCII mockup]
```
┌─────────────────────────────────────┐
│  [Header]                           │
├─────────────────────────────────────┤
│  [Input label]                      │
│  ┌─────────────────────────────┐    │
│  │  [placeholder text]         │    │
│  └─────────────────────────────┘    │
│                      [Button]       │
└─────────────────────────────────────┘
```

Step 2: User does [specific action]
→ System response: [exactly what happens]
→ UI change: [what appears/disappears/changes]
→ State change: [what data changes]

[Continue for every step until flow is complete]

**Success state:** [what user sees when flow completes successfully]
**Error states:** [every way this flow can fail and what user sees]
**Exit points:** [how user leaves this flow]

Document minimum 4 complete flows with full ASCII mockups.

## 4. State Transitions
Document every app state and what causes transitions:
```
IDLE ──[user action]──► LOADING ──[success]──► SUCCESS
                                └──[failure]──► ERROR ──[retry]──► LOADING
```

## 5. Error & Empty States
For every screen, document:
- Empty state (no data): exactly what is shown
- Loading state: exactly what is shown
- Error state: exactly what is shown and what user can do

## 6. Navigation Guards
What routes are protected? What happens when unauthorized user tries to access them?
"""
```

### DESIGN Prompt
```python
DESIGN_PROMPT = """
Generate a complete Design System document:

# [Product Name] — Design System
Version: 1.0.0

## 1. Design Philosophy
3-4 paragraphs explaining:
- The emotional feeling the UI should evoke (not just "clean" — be specific)
- Who the user is and how the design serves them specifically
- The one design rule that overrides everything else
- What this design deliberately avoids and why

## 2. Color System
Define EVERY color token with hex values AND usage rules:

```css
:root {
  /* === BACKGROUNDS === */
  --color-bg-primary:    #[hex];  /* main app background — used on body */
  --color-bg-secondary:  #[hex];  /* panels, cards */
  --color-bg-tertiary:   #[hex];  /* inputs, hover states */
  --color-bg-inverse:    #[hex];  /* tooltips, overlays */

  /* === BORDERS === */
  --color-border-subtle: #[hex];  /* most borders */
  --color-border-strong: #[hex];  /* active/focus states */

  /* === TEXT === */
  --color-text-primary:  #[hex];  /* headings, important content */
  --color-text-secondary:#[hex];  /* body text, descriptions */
  --color-text-muted:    #[hex];  /* placeholders, disabled */
  --color-text-inverse:  #[hex];  /* text on dark backgrounds */

  /* === BRAND/ACCENT === */
  --color-brand:         #[hex];  /* primary actions, CTAs */
  --color-brand-hover:   #[hex];  /* hover state of brand */
  --color-brand-subtle:  #[hex];  /* backgrounds behind brand elements */

  /* === SEMANTIC === */
  --color-success:       #[hex];  /* success states */
  --color-warning:       #[hex];  /* warning states */
  --color-error:         #[hex];  /* error states */
  --color-info:          #[hex];  /* informational */
}
```

For each color: explain exactly when to use it and when NOT to use it.

## 3. Typography
```css
/* Font choices with reasoning */
--font-display:  '[Font]', [fallbacks]; /* Why this font for headings */
--font-body:     '[Font]', [fallbacks]; /* Why this font for body */
--font-mono:     '[Font]', [fallbacks]; /* Why this font for code */

/* Complete type scale */
--text-xs:   11px;  /* used for: labels, timestamps, metadata */
--text-sm:   13px;  /* used for: secondary text, captions */
--text-base: 15px;  /* used for: body text, descriptions */
--text-md:   17px;  /* used for: emphasized body, card titles */
--text-lg:   20px;  /* used for: section headings */
--text-xl:   24px;  /* used for: page headings */
--text-2xl:  32px;  /* used for: hero numbers, score displays */
--text-3xl:  48px;  /* used for: landing hero only */

/* Line heights */
--leading-tight:   1.2;  /* headings only */
--leading-normal:  1.6;  /* body text */
--leading-relaxed: 1.75; /* long-form content */
```

## 4. Spacing System
```css
/* 4px base unit */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px; --space-12: 48px;
--space-16: 64px;

/* Component-specific spacing */
--padding-card:   var(--space-5);
--padding-input:  var(--space-3) var(--space-4);
--padding-button: var(--space-3) var(--space-6);
--gap-section:    var(--space-12);
```

## 5. Component Specifications
For EACH major component (minimum 8 components):

### [Component Name]
- **Visual description:** exact appearance in words
- **CSS:** complete styles including hover, focus, active, disabled states
- **Variants:** list all visual variants with their CSS differences
- **Usage rules:** when to use this component and when NOT to
- **Accessibility:** ARIA roles, keyboard behavior, focus management

Include specs for: Button (all variants), Input, Card, Modal, Navigation item,
Badge/Tag, Loading state, Empty state, Error state.

## 6. Animation & Motion
```css
/* Easing functions */
--ease-snap:    cubic-bezier(0.16, 1, 0.3, 1);  /* UI responses: 150ms */
--ease-reveal:  cubic-bezier(0.16, 1, 0.3, 1);  /* content appearing: 300-400ms */
--ease-smooth:  ease;                             /* transitions: 200ms */

/* Keyframe animations */
@keyframes fadeUp { ... }
@keyframes slideIn { ... }
@keyframes pulse { ... }
```

Rules for when to animate vs not animate. Reduced motion handling.

## 7. Responsive Behavior
- Breakpoints with reasoning
- How layout changes at each breakpoint
- What collapses, reorders, or hides on mobile
- Touch target sizes for mobile

## 8. Dark/Light Mode (if applicable)
How CSS variables swap for each mode. Which elements need special treatment.

## 9. Accessibility Standards
- Color contrast requirements (WCAG AA minimum)
- Focus management rules
- ARIA labeling patterns
- Keyboard navigation map
"""
```

### SCHEMA Prompt
```python
SCHEMA_PROMPT = """
Generate a complete Data Schema document:

# [Product Name] — Data Schema
Version: 1.0.0

## 1. Data Storage Strategy
2-3 paragraphs explaining:
- What storage technologies are used and why
- What data lives where (client vs server vs cache)
- Data persistence strategy (what survives refresh, what doesn't)
- Privacy considerations

## 2. Complete TypeScript Types
Define EVERY type the application uses. Be exhaustive:

```typescript
// ── Core domain types ──────────────────────────────────────
export interface [PrimaryEntity] {
  id: string;              // UUID v4
  created_at: string;      // ISO 8601 datetime
  updated_at: string;      // ISO 8601 datetime
  // ... every field with type AND comment explaining what it stores
}

// ── Enum types ─────────────────────────────────────────────
export type [StatusEnum] = 
  | 'pending'    // explanation
  | 'active'     // explanation  
  | 'completed'; // explanation

// ── API types ──────────────────────────────────────────────
export interface [ApiRequest] {
  // ... every field
}

export interface [ApiResponse] {
  data: [Entity] | null;
  error: string | null;
  meta: {
    total: number;
    page: number;
  };
}

// ── UI/State types ─────────────────────────────────────────
export interface AppState {
  // ... complete app state shape
}
```

Include types for: every entity, every API request/response, 
every form, every UI state, every error.

## 3. Database Schema (if applicable)
For each table/collection:
```sql
CREATE TABLE [table_name] (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- every column with type, constraints, and comment
  
  -- INDEXES
  -- INDEX reasoning: why this index exists
);
```

Include: all indexes with reasoning, all foreign keys, all constraints.

## 4. Storage Key Naming (for localStorage/APS/Redis)
```
[namespace]:[entity]:[id]:[field?]

Examples:
  mirror:profile:user_123:prompt_dna
  mirror:sessions:prompt:uuid-here
  mirror:library:prompts
```
List every storage key the app uses with its value schema.

## 5. Data Validation Rules
For every input the user can provide:
- Field name
- Type
- Required/optional
- Min/max length or value
- Format requirements (regex if applicable)
- Error message shown for each violation

## 6. Data Migration Strategy
How will data be migrated when the schema changes in v2?
What is the versioning strategy for stored data?

## 7. Sensitive Data Handling
- What data is considered sensitive
- How it's encrypted at rest
- How it's encrypted in transit
- What data is never stored
- Data retention policy
"""
```

### IMPLEMENTATION_PLAN Prompt
```python
IMPL_PLAN_PROMPT = """
Generate a complete Implementation Plan:

# [Product Name] — Implementation Plan
Version: 1.0.0 | Estimated total time: [estimate based on complexity]

## Pre-Build Checklist
List EVERY tool, account, and credential needed before writing a single line of code:
- [ ] Node.js [specific version] — download from [url]
- [ ] [Package manager] [version]
- [ ] [All accounts needed] with signup URLs
- [ ] [All API keys needed] with instructions on where to get them
- [ ] [All CLI tools] with exact install commands
- [ ] Verify each with: [verification command]

## Phase 0 — Project Scaffold
**Goal:** [specific, measurable goal]
**Estimated time:** [X hours]
**Complete when:** [exact verifiable condition]

### Steps:
For each step:
1. [Action] — `exact command to run`
   Expected output: [what should appear in terminal]
   If this fails: [common failure and fix]

2. Create [file] at [path] with this exact content:
```
[full file content]
```

**Verify Phase 0:** Run `[command]` — you should see `[exact expected output]`

## Phase 1 — [Name]
[Same detailed format as Phase 0]

## Phase 2 — [Name]  
[Same detailed format]

[Continue for all phases — minimum 5 phases]

## Troubleshooting Reference
For each common problem:
| Problem | Likely Cause | Exact Fix |
|---------|--------------|-----------|
| [error message] | [why it happens] | [step by step fix] |

Minimum 10 troubleshooting entries based on the tech stack chosen.

## Dependency Reference
List every package with:
- Package name and version
- What it does in this project
- Install command
- Any important configuration needed
"""
```

### TRACKER Prompt
```python
TRACKER_PROMPT = """
Generate a complete Build Tracker:

# [Product Name] — Build Tracker
Last Updated: [auto-fill with current date]

## Overall Progress
```
Phase 0 — Scaffold         [ ] 0/[N] tasks
Phase 1 — [Name]           [ ] 0/[N] tasks
Phase 2 — [Name]           [ ] 0/[N] tasks
Phase 3 — [Name]           [ ] 0/[N] tasks
Phase 4 — [Name]           [ ] 0/[N] tasks
Phase 5 — Polish & Deploy  [ ] 0/[N] tasks
───────────────────────────────────────────
TOTAL                       0/[N] tasks complete
```

## Phase 0 — Scaffold
| # | Task | Status | File/Command | Notes |
|---|------|--------|--------------|-------|
| 0.1 | [specific task] | [ ] | [file or command] | |
[List EVERY task — minimum 6 per phase]

## Phase 1 — [Name]
[Same format]

[Continue for all phases]

## Complete File Creation Checklist
Every single file that needs to exist when the project is done:

### Config Files
- [ ] `/[path]/[filename]` — [what it does]

### Source Files  
- [ ] `/src/[path]/[Component].tsx` — [what it does]
[List EVERY file]

### Executa Files (if applicable)
- [ ] `executas/[name]/[plugin].py`
- [ ] `executas/[name]/executa.json`

## Blockers Log
| Date | Blocker | Status | Resolution |
|------|---------|--------|------------|
| — | — | — | — |

## Key Decisions Log
| Decision | Options Considered | Choice Made | Reasoning |
|----------|-------------------|-------------|-----------|
| [tech choice] | [alt A vs alt B] | [chosen] | [why] |
[Pre-fill with 5-8 decisions already made in the spec]

## Testing Checklist
- [ ] All unit tests pass
- [ ] All integration tests pass  
- [ ] App works offline (if applicable)
- [ ] Mobile layout works (if applicable)
- [ ] All error states handled
- [ ] All empty states handled
- [ ] Performance: [metric] meets target
- [ ] Accessibility: keyboard navigation works
- [ ] Build succeeds with zero warnings
"""
```

### RULES Prompt
```python
RULES_PROMPT = """
Generate a complete Agent Rules document:

# [Product Name] — Agent Rules
Version: 1.0.0
These rules govern the AI agent building this project. Follow without exception.

## 1. NEVER STOP UNTIL COMPLETE
[Elaborate rule about continuous building — 2-3 paragraphs]
- Do NOT stop after phases and ask "should I continue?"
- Do NOT stop for clarification unless a file is genuinely missing
- The only acceptable stop is when the final verification checklist passes
- If you hit an error: fix it and continue. Never stop because of an error.

## 2. READ ALL DOCS FIRST
Before writing a single line of code, read in this order:
1. PRD.md — understand WHAT and WHY
2. TECH_SPEC.md — understand HOW (architecture)
3. APP_FLOW.md — understand the user journey
4. DESIGN.md — understand the visual system
5. SCHEMA.md — understand data structures
6. IMPLEMENTATION_PLAN.md — follow the phases
7. TRACKER.md — update as you go
8. RULES.md (this file) — these govern everything

## 3. PHASE ORDER IS MANDATORY
[Rule about following phases exactly]

## 4. TECH STACK RULES
Based on the chosen stack, specific rules:

### TypeScript Rules
- No `any` types — use `unknown` with type guards
- All types in `[types file path]` — import from there
- Strict mode enabled — no disabling strict checks
- [Stack-specific rules based on what was chosen]

### CSS Rules  
- [Based on chosen styling approach]
- [Specific naming conventions]
- [What's allowed and not allowed]

### [Framework-Specific Rules]
- [Based on the specific framework chosen]
- [Common gotchas for this stack]
- [Performance rules]

## 5. FILE CREATION RULES
- Never create files outside the structure in TECH_SPEC.md
- Never put [X] in [wrong location]
- [Specific rules based on directory structure]

## 6. ERROR HANDLING RULES
Every async operation must be wrapped in try/catch:
```typescript
// Correct pattern:
try {
  const result = await [operation]();
  // handle success
} catch (error) {
  // handle error — never silently swallow
  console.error('[context]:', error);
  // show user-facing error
}
```

## 7. STATE MANAGEMENT RULES
- [Based on chosen state management]
- [What goes in global state vs local state]
- [How state is updated]

## 8. TESTING RULES
- Write tests for [what] as you build
- Run tests after each phase before proceeding
- Never skip tests to move faster

## 9. PERFORMANCE RULES
- [Specific to the stack chosen]
- [Image optimization rules if applicable]
- [Bundle size rules]

## 10. SECURITY RULES
- Never commit [sensitive data type]
- Always validate [what] before [action]
- [Auth rules specific to chosen auth approach]

## 11. TRACKER UPDATE RULES
After completing each task:
- Change `[ ]` to `[x]` in TRACKER.md
- Update "Last Updated" date
- Add any blockers to Blockers Log
- Add any non-obvious decisions to Key Decisions Log

## 12. FINAL DELIVERY DEFINITION
Build is ONLY complete when ALL of these are true:
- [ ] Every task in TRACKER.md is checked [x]
- [ ] `[build command]` runs with zero errors and zero warnings
- [ ] `[test command]` — all tests pass
- [ ] App loads without console errors
- [ ] Every core user flow works end to end
- [ ] All error states show appropriate messages
- [ ] All empty states show appropriate UI
- [ ] [Platform-specific deployment check]
"""
```

---

## Updated Python Plugin

In `project_genesis_plugin.py`, update the `generate_documents` function:

```python
DOC_PROMPTS = {
    "PRD": PRD_PROMPT,
    "TECH_SPEC": TECH_SPEC_PROMPT,
    "APP_FLOW": APP_FLOW_PROMPT,
    "DESIGN": DESIGN_PROMPT,
    "SCHEMA": SCHEMA_PROMPT,
    "IMPLEMENTATION_PLAN": IMPL_PLAN_PROMPT,
    "TRACKER": TRACKER_PROMPT,
    "RULES": RULES_PROMPT,
}

def generate_documents(spec: dict) -> dict:
    docs = {}
    doc_order = ["PRD", "TECH_SPEC", "APP_FLOW", "DESIGN", 
                 "SCHEMA", "IMPLEMENTATION_PLAN", "TRACKER", "RULES"]
    
    for doc_type in doc_order:
        # Build previous docs summary for consistency
        previous_summary = ""
        if docs:
            previous_summary = "\n".join([
                f"=== {k} (first 800 chars) ===\n{v[:800]}\n"
                for k, v in docs.items()
            ])
        
        system_prompt = GENERATE_PROMPT_BASE.format(
            doc_type=doc_type,
            spec_json=json.dumps(spec, indent=2),
            previous_docs_summary=previous_summary or "None yet.",
            doc_specific_prompt=DOC_PROMPTS[doc_type]
        )
        
        user_message = f"""
Generate the complete {doc_type} document for {spec.get('product_name', 'this project')}.

Remember:
- Minimum 1000 words
- Every section fully elaborated
- Real specific values — no placeholders
- Include things the spec didn't mention but that any good engineer would add
- Make this document so complete that a developer who never spoke to anyone 
  about this project could build it exactly from this document alone

Start generating now. Be exhaustive. Be specific. Be excellent.
"""
        
        content = call_claude(
            system=system_prompt,
            user=user_message,
            max_tokens=4096  # INCREASE THIS — current limit is too low for detailed docs
        )
        docs[doc_type] = content
    
    return {
        "documents": docs,
        "product_name": spec.get("product_name", "Your Project"),
        "generated_at": datetime.now().isoformat()
    }
```

**CRITICAL:** Change `max_tokens` from 1000 to 4096 in the `call_claude` function call for document generation. The current 1000 token limit is why documents are short — they're being cut off.

---

## The Single Most Important Fix

In `call_claude()` function, the `max_tokens` parameter is almost certainly set to 1000. This is why every document is a few sentences — Claude literally cannot write more.

Find this in the plugin and change it:

```python
# BEFORE (wrong):
body = {
    "model": CLAUDE_MODEL,
    "max_tokens": 1000,  # ← THIS IS THE PROBLEM
    ...
}

# AFTER (correct):
body = {
    "model": CLAUDE_MODEL,
    "max_tokens": 4096,  # ← Allow full detailed documents
    ...
}
```

This single change alone will dramatically improve document quality even before the prompt improvements take effect.

---

## Verification

After making these changes, test with this brief:

```
A CLI tool that watches your git commits, uses AI to analyze 
staged changes, detects incomplete or broken code, and blocks 
the commit with a confidence score below 70%.
```

Expected results after fix:
- PRD: 1000+ words, 10 sections, specific personas, real metrics
- TECH_SPEC: Full architecture diagram, complete directory tree with file comments, specific package versions
- APP_FLOW: ASCII mockups for every screen, complete step-by-step flows
- DESIGN: Full CSS token system with real hex values, component specs
- SCHEMA: Complete TypeScript interfaces with every field typed and commented
- IMPLEMENTATION_PLAN: Copy-pasteable commands, verification steps per phase
- TRACKER: Every single file listed as a checkbox
- RULES: Stack-specific rules, specific file path rules, complete delivery checklist

If any document is still under 500 words — the max_tokens fix didn't apply. Check the call_claude function again.
