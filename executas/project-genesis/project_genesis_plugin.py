#!/usr/bin/env python3
"""
bundled:project-genesis — Executa stdio tool plugin

Turns a developer's vague idea into 8 production-ready build documents.
Implements JSON-RPC 2.0 over stdio (describe / invoke / health).

tool_id: bundled:project-genesis  (MUST match pyproject.toml name + executa.json tool_id)
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-flash-latest"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
MAX_TOKENS = 8192
TIMEOUT = 180.0

# ---------------------------------------------------------------------------
# Plugin manifest
# ---------------------------------------------------------------------------
MANIFEST: dict[str, Any] = {
    "name": "bundled:project-genesis",
    "display_name": "Mirror Project Genesis",
    "version": "1.0.3",
    "description": "Turns any developer idea into 8 production-ready build documents.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "genesis", "project", "documentation"],
    "tools": [
        {
            "name": "assess_brief_depth",
            "description": "Analyzes a project brief to determine how much clarification is needed.",
            "parameters": [
                {
                    "name": "brief",
                    "type": "string",
                    "description": "The developer's project idea/description.",
                    "required": True,
                }
            ],
        },
        {
            "name": "generate_questions",
            "description": "Generates adaptive clarifying questions based on brief analysis.",
            "parameters": [
                {
                    "name": "brief",
                    "type": "string",
                    "description": "The project brief.",
                    "required": True,
                },
                {
                    "name": "missing_dimensions",
                    "type": "array",
                    "description": "List of missing dimensions from assess_brief_depth.",
                    "required": True,
                },
                {
                    "name": "count",
                    "type": "integer",
                    "description": "Number of questions to generate.",
                    "required": True,
                },
            ],
        },
        {
            "name": "validate_spec",
            "description": "Produces a clean validated specification summary from the brief + Q&A answers.",
            "parameters": [
                {
                    "name": "brief",
                    "type": "string",
                    "description": "The original project brief.",
                    "required": True,
                },
                {
                    "name": "answers",
                    "type": "object",
                    "description": "Map of question_id -> answer string.",
                    "required": True,
                },
            ],
        },
        {
            "name": "generate_documents",
            "description": "Generates all 8 production-ready build documents for the project.",
            "parameters": [
                {
                    "name": "spec",
                    "type": "object",
                    "description": "The validated spec from validate_spec.",
                    "required": True,
                }
            ],
        },
    ],
    "runtime": {"type": "python", "min_version": "3.11"},
}


# ---------------------------------------------------------------------------
# Gemini API
# ---------------------------------------------------------------------------
def _call_gemini(system: str, user: str, json_mode: bool = True) -> str:
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is not installed. Run: uv sync")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it in Anna Admin → Executa env vars.")

    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    headers = {"content-type": "application/json"}
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "systemInstruction": {"parts": [{"text": system}]},
        "generationConfig": {
            "maxOutputTokens": MAX_TOKENS,
        },
    }
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"

    import time
    last_exc = None
    for attempt in range(3):
        try:
            resp = httpx.post(url, json=body, headers=headers, timeout=TIMEOUT)
            if resp.status_code in (429, 503) and attempt < 2:
                wait = 10 * (attempt + 1)  # 10s, 20s
                print(f"[gemini] {resp.status_code} — retrying in {wait}s (attempt {attempt+1}/3)", file=sys.stderr)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        except httpx.HTTPStatusError as e:
            last_exc = e
            if e.response.status_code not in (429, 503):
                raise
            if attempt < 2:
                wait = 10 * (attempt + 1)
                print(f"[gemini] {e.response.status_code} — retrying in {wait}s (attempt {attempt+1}/3)", file=sys.stderr)
                time.sleep(wait)
    raise last_exc


def _parse_json(text: str, system: str, user: str) -> dict[str, Any]:
    """Parse JSON response, retry once with stricter prompt on failure."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    cleaned = cleaned.strip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        strict_user = (
            user
            + "\n\nCRITICAL: Your previous response was not valid JSON. "
            "Start your response with { and end with }. Nothing else."
        )
        retry_text = _call_gemini(system, strict_user)
        retry_cleaned = retry_text.strip().strip("`").strip()
        if retry_cleaned.lower().startswith("json"):
            retry_cleaned = retry_cleaned[4:].strip()
        return json.loads(retry_cleaned)


# ---------------------------------------------------------------------------
# Prompts — assess / questions / validate (unchanged)
# ---------------------------------------------------------------------------
ASSESS_SYSTEM = """You are analyzing a project brief to determine how much clarification is needed.
Return ONLY valid JSON. No markdown fences. Start with { and end with }."""

ASSESS_PROMPT = """Analyze this project brief and determine how much clarification is needed.

BRIEF:
{brief}

Return ONLY valid JSON with EXACTLY this structure:
{{
  "vagueness_score": <integer 0-100>,
  "missing_dimensions": ["list of what's missing: users/platform/stack/scope/ai/team/etc"],
  "question_count_needed": <integer 3-10>,
  "what_is_clear": ["list of things already clearly stated in the brief"]
}}

vagueness_score guide:
- 0-30: Brief is detailed → 3-4 questions needed
- 31-60: Moderate detail → 5-7 questions needed
- 61-100: Very vague → 8-10 questions needed"""

QUESTIONS_SYSTEM = """You are generating adaptive clarifying questions for a developer's project brief.
Return ONLY valid JSON. No markdown fences. Start with { and end with }."""

QUESTIONS_PROMPT = """Generate adaptive clarifying questions for this project brief.

Brief: {brief}
Missing dimensions: {missing_dimensions}
Number of questions needed: {count}

Return ONLY valid JSON with EXACTLY this structure:
{{
  "questions": [
    {{
      "id": "q1",
      "question": "Who are the primary users of this app?",
      "dimension": "users",
      "why_asking": "Determines complexity and feature depth"
    }}
  ]
}}

Rules:
- Never ask about something already in the brief
- Ask the most impactful questions first
- Questions should be specific, not generic
- Each question targets exactly one missing dimension
- Generate exactly {count} questions"""

VALIDATE_SYSTEM = """You are producing a clean validated specification from a project brief and Q&A answers.
Return ONLY valid JSON. No markdown fences. Start with { and end with }."""

VALIDATE_PROMPT = """Given a project brief and answers to clarifying questions, produce a clean validated spec.

ORIGINAL BRIEF:
{brief}

ANSWERS TO CLARIFYING QUESTIONS:
{answers_str}

Return ONLY valid JSON with EXACTLY this structure:
{{
  "product_name": "short name for the project",
  "one_liner": "one sentence describing what it does",
  "users": "who uses it",
  "platform": "web/mobile/desktop/CLI/extension/etc",
  "core_action": "the one thing users must be able to do",
  "tech_stack": ["list of technologies"],
  "has_backend": true,
  "has_database": true,
  "has_ai": false,
  "ai_details": "which model/API if applicable, or empty string",
  "out_of_scope": ["explicit v1 exclusions"],
  "done_when": "definition of done",
  "deployment": "where it will be deployed",
  "solo_or_team": "solo or team"
}}"""


# ---------------------------------------------------------------------------
# Document generation — new elaborate system prompt (from GENESIS_PROMPT_OVERHAUL.md)
# ---------------------------------------------------------------------------
GENERATE_PROMPT_BASE = """You are a principal software architect and senior technical writer with 15 years of experience shipping production software. You are generating {doc_type} documentation for a real project that a developer will use to build from scratch.

PROJECT SPECIFICATION:
{spec_json}

PREVIOUSLY GENERATED DOCS (for consistency):
{previous_docs_summary}

YOUR JOB:
Generate a complete, elaborate, production-grade {doc_type} document for this project.

CRITICAL RULES — NEVER VIOLATE THESE:
1. NEVER echo back what the user said. Expand every point into full detail.
2. Make architectural decisions the spec didn't specify — good engineers do this automatically.
3. Include things the user didn't mention but that any production app needs.
4. Be brutally specific: real package names with versions, real file paths, real function names.
5. No placeholders. No "TBD". No "[insert X here]". Every field filled with real content.
6. Write as if this document will be read by a developer who has never spoken to anyone about this project — it must be 100% self-contained.

{doc_specific_prompt}

Return the complete document as raw markdown. No JSON wrapper. No backticks around the whole thing.
Start directly with the # heading."""


# ---------------------------------------------------------------------------
# The 8 document-specific prompts (from GENESIS_PROMPT_OVERHAUL.md)
# ---------------------------------------------------------------------------
PRD_PROMPT = """Generate a Product Requirements Document with these MANDATORY sections, each elaborately filled.
CRITICAL FORMAT RULES:
- Minimum 1000 words. Longer is better. This document must be exhaustive.
- Every major section must be 3-5 paragraphs minimum, not bullet points alone.

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
with a suggested approach for each."""


TECH_SPEC_PROMPT = """Generate a Technical Specification with these MANDATORY sections.
CRITICAL FORMAT RULES:
- Minimum 1000 words. Longer is better. This document must be exhaustive.
- Every major section must be 3-5 paragraphs minimum, not bullet points alone.

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
- Deploying (to specific platform)"""


APP_FLOW_PROMPT = """Generate a comprehensive App Flow document:

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
What routes are protected? What happens when unauthorized user tries to access them?"""


DESIGN_PROMPT = """Generate a complete Design System document:

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
- Keyboard navigation map"""


SCHEMA_PROMPT = """Generate a complete Data Schema document:

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
- Data retention policy"""


IMPL_PLAN_PROMPT = """Generate a complete Implementation Plan:

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
- Any important configuration needed"""


TRACKER_PROMPT = """Generate a complete Build Tracker:

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
- [ ] Build succeeds with zero warnings"""


RULES_PROMPT = """Generate a complete Agent Rules document:

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
- [ ] [Platform-specific deployment check]"""


# Map used by generate_documents
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


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------
def assess_brief_depth(brief: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock fallback
        word_count = len(brief.split())
        if word_count > 80:
            score = 20
            count = 3
            missing = ["platform"]
        elif word_count > 40:
            score = 45
            count = 5
            missing = ["users", "platform", "stack"]
        else:
            score = 75
            count = 8
            missing = ["users", "platform", "stack", "scope", "done_when"]

        return {
            "vagueness_score": score,
            "missing_dimensions": missing,
            "question_count_needed": count,
            "what_is_clear": ["core idea"],
        }

    user_msg = ASSESS_PROMPT.format(brief=brief)
    raw = _call_gemini(ASSESS_SYSTEM, user_msg)
    result = _parse_json(raw, ASSESS_SYSTEM, user_msg)

    # Normalize
    score = int(result.get("vagueness_score", 50))
    score = max(0, min(100, score))
    result["vagueness_score"] = score

    if score <= 30:
        result["question_count_needed"] = max(3, min(4, result.get("question_count_needed", 3)))
    elif score <= 60:
        result["question_count_needed"] = max(5, min(7, result.get("question_count_needed", 5)))
    else:
        result["question_count_needed"] = max(8, min(10, result.get("question_count_needed", 8)))

    return result


def generate_questions(brief: str, missing_dimensions: list[str], count: int) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock fallback
        all_questions = [
            {"id": "q1", "question": "Who are the primary users of this app?", "dimension": "users", "why_asking": "Determines complexity and feature depth"},
            {"id": "q2", "question": "What platform is this for? (web / mobile / desktop / CLI / browser extension)", "dimension": "platform", "why_asking": "Defines the technical architecture"},
            {"id": "q3", "question": "What is the ONE core action users must be able to do in v1?", "dimension": "core_action", "why_asking": "Focuses the MVP scope"},
            {"id": "q4", "question": "Do you have a preferred tech stack, or should we recommend one?", "dimension": "stack", "why_asking": "Determines technologies to use"},
            {"id": "q5", "question": "Does this need a backend and database, or is it frontend-only?", "dimension": "backend", "why_asking": "Architecture decision"},
            {"id": "q6", "question": "What is explicitly OUT of scope for v1?", "dimension": "scope", "why_asking": "Prevents scope creep"},
            {"id": "q7", "question": "What does 'done' look like — how will you know when v1 is working?", "dimension": "done_when", "why_asking": "Defines success criteria"},
            {"id": "q8", "question": "Are there any third-party APIs or services involved?", "dimension": "integrations", "why_asking": "Identifies external dependencies"},
        ]
        return {"questions": all_questions[:count]}

    user_msg = QUESTIONS_PROMPT.format(
        brief=brief,
        missing_dimensions=json.dumps(missing_dimensions),
        count=count,
    )
    raw = _call_gemini(QUESTIONS_SYSTEM, user_msg)
    result = _parse_json(raw, QUESTIONS_SYSTEM, user_msg)

    # Ensure IDs are sequential
    questions = result.get("questions", [])
    for i, q in enumerate(questions):
        q["id"] = f"q{i+1}"

    return {"questions": questions[:count]}


def validate_spec(brief: str, answers: dict[str, str]) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock fallback
        return {
            "product_name": "My Project",
            "one_liner": "A tool that helps developers build faster.",
            "users": "Developers and technical users",
            "platform": "Web app (React)",
            "core_action": "Create and manage project documentation",
            "tech_stack": ["React", "TypeScript", "Node.js"],
            "has_backend": True,
            "has_database": True,
            "has_ai": False,
            "ai_details": "",
            "out_of_scope": ["Mobile app", "Team collaboration"],
            "done_when": "Core features work end-to-end without errors",
            "deployment": "Vercel",
            "solo_or_team": "solo",
        }

    answers_str = "\n".join([f"Q: {qid}\nA: {answer}" for qid, answer in answers.items()])
    user_msg = VALIDATE_PROMPT.format(brief=brief, answers_str=answers_str)
    raw = _call_gemini(VALIDATE_SYSTEM, user_msg)
    return _parse_json(raw, VALIDATE_SYSTEM, user_msg)


def generate_documents(spec: dict[str, Any]) -> dict[str, Any]:
    spec_json = json.dumps(spec, indent=2)
    docs: dict[str, str] = {}

    system_prompt = (
        "You are a principal software architect and senior technical writer with 15 years of experience shipping production software.\n"
        "Your task is to generate 8 complete, elaborate, production-grade build documents for a project based on its specification.\n\n"
        "You MUST return a valid JSON object matching exactly this schema:\n"
        "{\n"
        '  "PRD": "Product Requirements Document markdown content",\n'
        '  "TECH_SPEC": "Technical Specification markdown content",\n'
        '  "APP_FLOW": "App Flow Diagram markdown content",\n'
        '  "DESIGN": "Design System markdown content",\n'
        '  "SCHEMA": "Data Schema markdown content",\n'
        '  "IMPLEMENTATION_PLAN": "Implementation Plan markdown content",\n'
        '  "TRACKER": "Build Tracker Checklist markdown content",\n'
        '  "RULES": "Agent Code Enforcement Rules markdown content"\n'
        "}\n\n"
        "Start the JSON with { and end with }. Do not wrap in markdown code blocks or return extra text. Return ONLY the raw JSON."
    )

    user_message = (
        f"Generate all 8 build documents for the project '{spec.get('product_name', 'this project')}' based on the specification below:\n\n"
        f"PROJECT SPECIFICATION:\n{spec_json}\n\n"
        "CRITICAL INSTRUCTIONS FOR DOCUMENTS:\n"
        f"1. PRD (Product Requirements Document):\n{DOC_PROMPTS['PRD']}\n\n"
        f"2. TECH_SPEC (Technical Specification):\n{DOC_PROMPTS['TECH_SPEC']}\n\n"
        f"3. APP_FLOW (App Flow Chart):\n{DOC_PROMPTS['APP_FLOW']}\n\n"
        f"4. DESIGN (Design System):\n{DOC_PROMPTS['DESIGN']}\n\n"
        f"5. SCHEMA (Database Schema & Types):\n{DOC_PROMPTS['SCHEMA']}\n\n"
        f"6. IMPLEMENTATION_PLAN (Phase Plan):\n{DOC_PROMPTS['IMPLEMENTATION_PLAN']}\n\n"
        f"7. TRACKER (Build Checklist):\n{DOC_PROMPTS['TRACKER']}\n\n"
        f"8. RULES (Agent Rules):\n{DOC_PROMPTS['RULES']}\n\n"
        "Remember:\n"
        "- PRD and TECH_SPEC must be exhaustive and detailed (aim for 1,000+ words).\n"
        "- Other documents must be clean, concise, and copy-paste ready.\n"
        "- Absolutely NO TBD or placeholders. Write real content.\n"
    )

    if not GEMINI_API_KEY:
        # Mock fallback
        for doc_type in ["PRD", "TECH_SPEC", "APP_FLOW", "DESIGN", "SCHEMA", "IMPLEMENTATION_PLAN", "TRACKER", "RULES"]:
            docs[doc_type] = (
                f"# {spec.get('product_name', 'Project')} — {doc_type}\n\n"
                f"*Mock content for {doc_type}. Connect Gemini API for real generation.*\n\n"
                f"Spec: {spec.get('one_liner', '')}\n"
            )
    else:
        # Call Gemini in JSON mode
        content = _call_gemini(system_prompt, user_message, json_mode=True)
        # Parse the JSON response
        result = _parse_json(content, system_prompt, user_message)
        for doc_type in ["PRD", "TECH_SPEC", "APP_FLOW", "DESIGN", "SCHEMA", "IMPLEMENTATION_PLAN", "TRACKER", "RULES"]:
            docs[doc_type] = result.get(doc_type, f"# {spec.get('product_name', 'Project')} — {doc_type}\n\nFailed to generate content.")

    return {
        "documents": docs,
        "product_name": spec.get("product_name", "Your Project"),
        "generated_at": datetime.now().isoformat(),
    }


TOOL_DISPATCH = {
    "assess_brief_depth": assess_brief_depth,
    "generate_questions": generate_questions,
    "validate_spec": validate_spec,
    "generate_documents": generate_documents,
}


# ---------------------------------------------------------------------------
# JSON-RPC handlers
# ---------------------------------------------------------------------------
def handle_describe(_params: dict[str, Any]) -> dict[str, Any]:
    return MANIFEST


def handle_invoke(params: dict[str, Any]) -> Any:
    tool_name = params.get("tool")
    args = params.get("arguments") or {}
    if not isinstance(args, dict):
        raise ValueError("`arguments` must be an object")

    fn = TOOL_DISPATCH.get(tool_name)
    if fn is None:
        raise ValueError(f"Unknown tool: {tool_name!r}. Available: {list(TOOL_DISPATCH)}")

    try:
        payload = fn(**args)
    except Exception as exc:
        return {"success": False, "error": f"{type(exc).__name__}: {exc}"}

    return {"success": True, "data": payload}


def handle_health(_params: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": "ok",
        "version": MANIFEST["version"],
        "api_key_set": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL,
        "tools": [t["name"] for t in MANIFEST["tools"]],
    }


METHOD_DISPATCH = {
    "describe": handle_describe,
    "invoke": handle_invoke,
    "health": handle_health,
}


# ---------------------------------------------------------------------------
# Stdio loop
# ---------------------------------------------------------------------------
def send(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> None:
    print(
        f"[bundled:project-genesis] {MANIFEST['display_name']} v{MANIFEST['version']} ready",
        file=sys.stderr,
    )
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": f"parse error: {e}"}})
            continue

        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params") or {}
        handler = METHOD_DISPATCH.get(method)

        if handler is None:
            send({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"method not found: {method}"}})
            continue

        try:
            result = handler(params)
            send({"jsonrpc": "2.0", "id": req_id, "result": result})
        except Exception as exc:
            send({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32000, "message": str(exc)}})


if __name__ == "__main__":
    main()
