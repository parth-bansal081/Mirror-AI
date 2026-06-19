# MIRROR — Project Genesis Feature
**Version:** 4.0  
**Type:** New primary feature — minimal codebase changes  
**Read completely before touching any code.**

---

## What Is Project Genesis

Project Genesis is the new hero feature of Mirror. It takes a developer's vague idea — a sentence, a paragraph, a brain dump — asks smart adaptive clarifying questions, runs a full spec analysis, and generates all 8 production-ready build documents simultaneously. The developer downloads them, drops them into their IDE agent, and starts building immediately.

The other modes (Prompt Archaeology, Devil's Advocate, Agent Babysitter, Learning Path) remain exactly as they are — they become secondary tools in the sidebar. Project Genesis becomes the first thing users see.

---

## Minimal Changes Required

Do NOT rebuild the app. Make only these changes:

1. Add one new route: `/genesis` 
2. Add one new executa: `project-genesis`
3. Add one new sidebar item: "Project Genesis" at the TOP of the nav
4. Change the default route from `/archaeology` to `/genesis`
5. Update the dashboard hero section to feature Project Genesis
6. Add a download/export utility function

Everything else stays exactly the same.

---

## 1. Sidebar Changes

Move "Project Genesis" to the very top of the sidebar nav, above all other modes.

```
┌──────────────────┐
│  ◉ MIRROR        │
│                  │
│  Good morning,   │
│  Parth 👋        │
│                  │
│  ─────────────   │
│                  │
│  ✦ Project       │  ← NEW — TOP, hero color, slightly larger
│    Genesis       │
│                  │
│  ─────────────   │
│                  │
│  🔍 Archaeology  │  ← Secondary tools
│  😈 Advocate     │
│  🤖 Babysitter   │
│  📚 Learning     │
│                  │
│  ─────────────   │
│  👤 Profile      │
└──────────────────┘
```

Project Genesis nav item styling — distinct from all others:
```css
.nav-genesis {
  background: linear-gradient(135deg, var(--genesis-wash) 0%, transparent 100%);
  border: 1px solid var(--genesis-glow);
  border-radius: var(--radius-md);
  margin: var(--space-3);
  padding: 12px var(--space-4);
  color: var(--genesis-color);
  font-weight: var(--weight-bold);
  font-size: var(--text-base);
  position: relative;
  overflow: hidden;
}

.nav-genesis::before {
  content: '✦';
  margin-right: var(--space-2);
  animation: breathe 2s ease infinite;
}

/* Shimmer effect on genesis nav item */
.nav-genesis::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--genesis-glow), transparent);
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
  opacity: 0.4;
}
```

Add genesis color to tokens.css:
```css
--genesis-color:  #E879F9;   /* Fuchsia — creation, magic, spark */
--genesis-soft:   #C026D3;
--genesis-glow:   rgba(232, 121, 249, 0.20);
--genesis-wash:   rgba(232, 121, 249, 0.06);
--genesis-text:   #F0ABFC;
--shadow-glow-genesis: 0 0 30px rgba(232, 121, 249, 0.25);
```

Add to body mode classes:
```css
body.mode-genesis {
  --mode-color:  var(--genesis-color);
  --mode-glow:   var(--genesis-glow);
  --mode-wash:   var(--genesis-wash);
  --mode-text:   var(--genesis-text);
  --mode-shadow: var(--shadow-glow-genesis);
}
```

---

## 2. New Route

Add to React Router:
```typescript
<Route path="/genesis" element={
  <PageTransition>
    <ProjectGenesis />
  </PageTransition>
} />
```

Change default redirect:
```typescript
<Route path="/" element={<Navigate to="/genesis" replace />} />
```

---

## 3. Dashboard Hero Update

The Profile/dashboard page hero section should now feature Project Genesis prominently:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Good morning, Parth ✦                               │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  ✦  PROJECT GENESIS                          │   │
│  │                                              │   │
│  │  Turn any idea into 8 production-ready       │   │
│  │  build documents. Instantly.                 │   │
│  │                                              │   │
│  │  [ Start Building → ]                        │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── Other tools ─────────────────────────────────   │
│  [Archaeology]  [Devil's Advocate]  [Babysitter]    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

The Genesis card is the largest element on the dashboard. It has:
- Fuchsia gradient border glow
- Shimmer animation on the card
- "Start Building →" button navigates to `/genesis`
- Below it: the other 4 modes as small secondary quick-action chips

---

## 4. Project Genesis Page — Full Flow

### Stage 1: Brief Input

```
┌──────────────────────────────────────────────────────┐
│  ✦ PROJECT GENESIS                                   │
│  From idea to 8 build docs in minutes.               │
│                                                      │
│  What are you building?                              │
│  ┌────────────────────────────────────────────────┐  │
│  │  Describe your idea. A sentence is fine.       │  │
│  │  A brain dump is better. Don't overthink it.   │  │
│  │                                                │  │
│  │  [textarea — large, monospace, inviting]       │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Examples:                                           │
│  "A React app for tracking freelance invoices"       │
│  "Chrome extension that summarizes any webpage"      │
│  "CLI tool that auto-generates git commit messages"  │
│                                                      │
│  [ Analyze Brief → ]                                 │
└──────────────────────────────────────────────────────┘
```

When user clicks Analyze Brief:
- Send brief to executa method `assess_brief_depth`
- Executa returns: `{ vagueness_score: 0-100, missing_dimensions: string[], question_count_needed: number }`
- vagueness_score 0-30: brief is detailed → ask 3-4 questions
- vagueness_score 31-60: moderate → ask 5-7 questions  
- vagueness_score 61-100: very vague → ask 8-10 questions

---

### Stage 2: Adaptive Clarifying Questions

Questions appear ONE AT A TIME — not all at once. Each question slides in after the previous is answered.

Show progress: "Question 3 of 6" with a progress bar.

```
┌──────────────────────────────────────────────────────┐
│  ✦ PROJECT GENESIS  ████████░░░░  Question 3 of 6   │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │  Who are the primary users of this app?        │  │
│  │                                                │  │
│  │  [textarea — user types their answer]          │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [ ← Back ]              [ Next Question → ]         │
│                                                      │
│  [ Skip — I'll decide later ]  ← muted link          │
└──────────────────────────────────────────────────────┘
```

The question bank covers these dimensions adaptively — executa picks which ones are needed based on the brief:

**Always asked (if not in brief):**
1. Who are the primary users?
2. What platform? (web / mobile / desktop / CLI / extension)
3. What's the core action — the ONE thing users must be able to do?

**Asked if brief is vague on tech:**
4. Any preferred tech stack or constraints?
5. Does this need a backend / database, or is it frontend-only?
6. Any third-party APIs or services involved?

**Asked if brief is vague on scope:**
7. What's explicitly OUT of scope for v1?
8. What does "done" look like — how will you know it's working?

**Asked if brief mentions AI:**
9. Which AI model or API? Or should we recommend one?
10. Does the AI need memory between sessions?

**Asked if brief mentions team/deployment:**
11. Solo project or team?
12. Where will this be deployed?

After all questions answered — show a summary confirmation:

```
┌──────────────────────────────────────────────────────┐
│  ✦ Here's what Mirror understood                     │
│                                                      │
│  Product:   Freelance invoice tracker                │
│  Users:     Freelancers, solo devs                   │
│  Platform:  React web app                            │
│  Core:      Create, track, and export invoices       │
│  Stack:     React + Supabase                         │
│  Out of scope: Payment processing, tax calculation   │
│  Done when: Can create invoice, mark paid, export PDF│
│                                                      │
│  [ ✎ Edit anything ]    [ ✦ Generate Documents → ]  │
└──────────────────────────────────────────────────────┘
```

User can edit any line inline before generating.

---

### Stage 3: Generation

When user clicks Generate Documents:

Show a dramatic generation sequence — this is the money moment:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ✦  GENERATING                          │
│                                                      │
│    PRD                    [████████████] ✓           │
│    Tech Spec              [████████░░░░] generating  │
│    App Flow               [░░░░░░░░░░░░] waiting     │
│    Design                 [░░░░░░░░░░░░] waiting     │
│    Schema                 [░░░░░░░░░░░░] waiting     │
│    Implementation Plan    [░░░░░░░░░░░░] waiting     │
│    Tracker                [░░░░░░░░░░░░] waiting     │
│    Rules                  [░░░░░░░░░░░░] waiting     │
│                                                      │
│    Building your project architecture...             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Each doc generates sequentially. The progress bars fill one by one. The rotating text at the bottom changes:
- "Analyzing your requirements..."
- "Designing the architecture..."
- "Mapping the user flows..."
- "Defining the data schema..."
- "Planning the implementation phases..."
- "Writing the build rules..."

Each doc takes ~3-5 seconds to generate. Total time: ~30-40 seconds. The sequential reveal makes it feel substantial and considered.

---

### Stage 4: The Document Workspace

After all 8 generate, the UI transforms into a full document workspace:

```
┌─────────────────────────────────────────────────────────────────┐
│  ✦ PROJECT GENESIS — Freelance Invoice Tracker        [ ↓ ZIP ] │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                   │
│  📄 PRD      │  # Freelance Invoice Tracker — PRD               │
│  📄 Tech Spec│                                                   │
│  📄 App Flow │  **Version:** 1.0.0                              │
│  🎨 Design   │  **Date:** June 2026                             │
│  🗄 Schema   │                                                   │
│  📋 Impl Plan│  ## 1. Product Vision                            │
│  ✅ Tracker  │  [full PRD content renders here]                 │
│  📏 Rules    │                                                   │
│              │  [user can edit inline — contenteditable]        │
│  ─────────── │                                                   │
│  [ ↓ ZIP ]   │                                                   │
│  [ Copy All ]│                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘
```

Left panel: list of all 8 docs as clickable tabs
Right panel: full content of selected doc, editable inline
Top right: "↓ ZIP" downloads all 8 as a zip file

Each doc tab shows:
- Icon (distinct per doc type)
- Doc name
- Word count
- A small green checkmark when generation is complete

**Inline editing:**
The content area uses `contenteditable` — user can edit any part of any doc directly in the browser before downloading. Changes are saved to state automatically.

**Download options:**
- "↓ ZIP" — downloads all 8 as `.md` files in a zip
- Individual "Copy" button on each doc tab — copies that doc's content to clipboard
- "Copy All" — copies all 8 docs concatenated with clear separators

---

## 5. The 8 Documents — What Each Contains

The executa generates each doc tailored to the user's specific project. Here's the template structure for each:

### PRD.md
```
# [Project Name] — Product Requirements Document
## 1. Product Vision (2-3 sentences)
## 2. The Problem (specific pain being solved)
## 3. Users (who, their context, their goals)
## 4. Core Features (MVP only — what must work)
## 5. Out of Scope (explicit v1 exclusions)
## 6. Success Metrics (how to know it's working)
## 7. Constraints (tech, time, budget, platform)
```

### TECH_SPEC.md
```
# [Project Name] — Technical Specification
## 1. Architecture Overview (diagram in ASCII)
## 2. Tech Stack (every technology, why chosen)
## 3. Directory Structure (full file tree)
## 4. Key Components (each major component explained)
## 5. API Design (endpoints if applicable)
## 6. Third-party Integrations
## 7. Error Handling Strategy
## 8. Build & Run Instructions
```

### APP_FLOW.md
```
# [Project Name] — App Flow
## 1. Entry & Initialization
## 2. Navigation Structure (ASCII diagram)
## For each core user flow:
   ## Flow N — [Flow Name]
   - Step by step with ASCII UI mockups
   - Data flow arrows
   - State transitions
```

### DESIGN.md
```
# [Project Name] — Design Document
## 1. Design Philosophy (3 sentences)
## 2. Color System (CSS variables)
## 3. Typography (fonts, sizes, weights)
## 4. Component Specs (each key component)
## 5. Animation System
## 6. Empty & Error States
```

### SCHEMA.md
```
# [Project Name] — Data Schema
## 1. Storage Strategy
## 2. TypeScript Types (all interfaces)
## 3. Database Schema (if applicable)
## 4. API Response Schemas
## 5. State Management Types
```

### IMPLEMENTATION_PLAN.md
```
# [Project Name] — Implementation Plan
## Pre-Build Checklist (installs, accounts, keys)
## Phase 0 — Scaffold
## Phase 1 — Foundation
## Phase N — [Feature]
Each phase:
- Goal
- Steps with exact commands
- Verify condition
## Troubleshooting Reference
```

### TRACKER.md
```
# [Project Name] — Build Tracker
## Overall Progress
## Phase N tasks (checkboxes)
## Blockers Log
## Key Decisions Made
## File Creation Checklist
```

### RULES.md
```
# [Project Name] — Agent Rules
## 1. Never stop until complete
## 2. Read docs before coding
## 3. Follow phase order
## 4. [Platform-specific rules based on tech stack]
## 5. TypeScript rules
## 6. CSS rules
## 7. Error handling rules
## 8. Final delivery definition (checklist)
```

---

## 6. New Executa: project-genesis

Create `executas/project-genesis/` with:

### executa.json
```json
{
  "slug": "project-genesis",
  "name": "Mirror Project Genesis",
  "version": "1.0.0",
  "executa_type": "tool",
  "tool_id": "bundled:project-genesis",
  "type": "python",
  "enabled": true,
  "distribution": {
    "profiles": {
      "local": { "type": "local" }
    }
  }
}
```

### pyproject.toml
```toml
[project]
name = "bundled:project-genesis"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = ["httpx>=0.27.0"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### project_genesis_plugin.py

Four methods to implement:

**Method 1: assess_brief_depth**
```python
ASSESS_PROMPT = """
You are analyzing a project brief to determine how much clarification is needed.

Return ONLY valid JSON:
{
  "vagueness_score": 0-100,
  "missing_dimensions": ["list of what's missing: users/platform/stack/scope/etc"],
  "question_count_needed": 3-10,
  "what_is_clear": ["list of things already clearly stated in the brief"]
}

vagueness_score guide:
0-30: Brief is detailed, 3-4 questions needed
31-60: Moderate detail, 5-7 questions needed  
61-100: Very vague, 8-10 questions needed
"""
```

**Method 2: generate_questions**
```python
QUESTIONS_PROMPT = """
Generate adaptive clarifying questions for this project brief.

Given:
- Brief: {brief}
- Missing dimensions: {missing_dimensions}
- Number of questions needed: {count}

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "question": "Who are the primary users of this app?",
      "dimension": "users",
      "why_asking": "Determines complexity and feature depth"
    }
  ]
}

Rules:
- Never ask about something already in the brief
- Ask the most impactful questions first
- Questions should be specific, not generic
- Each question targets exactly one missing dimension
"""
```

**Method 3: validate_spec**
```python
VALIDATE_PROMPT = """
Given a project brief and the user's answers to clarifying questions,
produce a clean validated specification summary.

Return ONLY valid JSON:
{
  "product_name": "short name for the project",
  "one_liner": "one sentence describing what it does",
  "users": "who uses it",
  "platform": "web/mobile/desktop/CLI/extension/etc",
  "core_action": "the one thing users must be able to do",
  "tech_stack": ["list of technologies"],
  "has_backend": true/false,
  "has_database": true/false,
  "has_ai": true/false,
  "ai_details": "which model/API if applicable",
  "out_of_scope": ["explicit v1 exclusions"],
  "done_when": "definition of done",
  "deployment": "where it will be deployed",
  "solo_or_team": "solo/team"
}
"""
```

**Method 4: generate_documents**
```python
# This is the main method — generates all 8 docs
# Takes the validated spec as input
# Makes 8 sequential Claude calls, one per document
# Returns all 8 as a JSON object

GENERATE_PROMPT_BASE = """
You are a senior software architect generating production-ready {doc_type} documentation.

Project Specification:
{spec_json}

Generate a complete, detailed {doc_type} for this specific project.
Be concrete and specific — no placeholders, no "TBD", no generic advice.
Every section must be filled with real content for THIS project.

{doc_specific_instructions}

Return the complete markdown document as a plain string.
Do not wrap in JSON. Just return the raw markdown.
"""

DOC_INSTRUCTIONS = {
  "PRD": "Include specific feature descriptions, exact user flows, concrete success metrics with numbers where possible.",
  "TECH_SPEC": "Include exact package names and versions, full directory tree, ASCII architecture diagram, exact commands to run.",
  "APP_FLOW": "Include ASCII UI mockups for every screen, exact state transitions, data flow with arrows.",
  "DESIGN": "Include exact CSS custom property values, specific color hex codes, font choices with fallbacks.",
  "SCHEMA": "Include complete TypeScript interfaces with all fields typed, no 'any' types.",
  "IMPLEMENTATION_PLAN": "Include exact bash commands, specific npm package names, clear verify conditions per phase.",
  "TRACKER": "Include every file that needs to be created as a checkbox item.",
  "RULES": "Include platform-specific rules based on the tech stack in the spec. Be strict and specific."
}

def generate_documents(spec: dict) -> dict:
    docs = {}
    doc_order = ["PRD", "TECH_SPEC", "APP_FLOW", "DESIGN", "SCHEMA", "IMPLEMENTATION_PLAN", "TRACKER", "RULES"]
    
    for doc_type in doc_order:
        prompt = GENERATE_PROMPT_BASE.format(
            doc_type=doc_type,
            spec_json=json.dumps(spec, indent=2),
            doc_specific_instructions=DOC_INSTRUCTIONS[doc_type]
        )
        # Pass previously generated docs as context for consistency
        context = f"\nAlready generated docs for context:\n{json.dumps({k: docs[k][:500] for k in docs}, indent=2)}" if docs else ""
        
        content = call_claude(
            system="You are a senior software architect. Generate complete, specific, production-ready documentation. Return raw markdown only — no JSON wrapper, no backticks.",
            user=prompt + context
        )
        docs[doc_type] = content
    
    return {
        "documents": docs,
        "product_name": spec.get("product_name", "Your Project"),
        "generated_at": datetime.now().isoformat()
    }
```

**CRITICAL:** Pass previously generated docs as context when generating later ones. This ensures TECH_SPEC references the same stack as PRD, SCHEMA uses the same types as TECH_SPEC, RULES reference the same tech as TECH_SPEC. Consistency across all 8 is the whole value.

---

## 7. New React Components

Create `src/modes/ProjectGenesis/` with:

```
ProjectGenesis/
├── index.tsx              ← Mode root, manages stage state
├── BriefInput.tsx         ← Stage 1: textarea + analyze button
├── QuestionFlow.tsx        ← Stage 2: one question at a time
├── SpecConfirmation.tsx   ← Stage 2 end: summary + edit + generate
├── GenerationSequence.tsx ← Stage 3: dramatic progress reveal
├── DocumentWorkspace.tsx  ← Stage 4: 8 docs side by side
├── DocTab.tsx             ← Individual doc tab in left panel
├── DocEditor.tsx          ← Editable content area
└── DownloadButton.tsx     ← ZIP + copy functionality
```

### State Machine for ProjectGenesis/index.tsx

```typescript
type GenesisStage = 
  | 'brief'           // Stage 1: input
  | 'questions'       // Stage 2: Q&A
  | 'confirmation'    // Stage 2 end: review spec
  | 'generating'      // Stage 3: progress
  | 'workspace';      // Stage 4: edit + download

interface GenesisState {
  stage: GenesisStage;
  brief: string;
  vaguenessScore: number;
  questions: Question[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  spec: ValidatedSpec | null;
  documents: Record<string, string>;  // doc_type → markdown content
  generatingDoc: string | null;       // which doc is currently generating
  completedDocs: string[];
  selectedDoc: string;                // which tab is active in workspace
  productName: string;
}
```

### GenerationSequence.tsx — The Drama

```typescript
// This component receives a callback to generate each doc
// It calls generate_documents which returns all 8
// But it SIMULATES sequential generation for the UI:
// - Shows each doc's progress bar filling as it generates
// - Actually one Claude call per doc happens sequentially in the executa
// - Frontend polls for completion or uses streaming if available

const DOC_DISPLAY_NAMES = {
  PRD: { label: 'Product Requirements', icon: '📄', color: '--archaeology' },
  TECH_SPEC: { label: 'Technical Specification', icon: '⚙️', color: '--babysitter' },
  APP_FLOW: { label: 'App Flow', icon: '🗺', color: '--learning' },
  DESIGN: { label: 'Design System', icon: '🎨', color: '--advocate' },
  SCHEMA: { label: 'Data Schema', icon: '🗄', color: '--genesis' },
  IMPLEMENTATION_PLAN: { label: 'Implementation Plan', icon: '📋', color: '--archaeology' },
  TRACKER: { label: 'Build Tracker', icon: '✅', color: '--learning' },
  RULES: { label: 'Agent Rules', icon: '📏', color: '--babysitter' },
};
```

### DocumentWorkspace.tsx — The Payoff

Left panel (240px wide):
- List of 8 doc tabs
- Each shows: icon + name + word count + status
- Active tab highlighted with genesis color
- Bottom: "↓ Download ZIP" + "Copy All" buttons

Right panel (fills remaining space):
- Large editable content area
- Font: JetBrains Mono for markdown content
- `contenteditable="true"` on the content div
- Auto-saves to state on every keystroke
- Header shows: doc name + word count + "Copied!" flash on copy

### DownloadButton — ZIP generation

Use JSZip (install via npm — no CDN):
```bash
cd app && npm install jszip
```

```typescript
import JSZip from 'jszip';

async function downloadZip(documents: Record<string, string>, productName: string) {
  const zip = new JSZip();
  const folder = zip.folder('docs');
  
  const fileNames: Record<string, string> = {
    PRD: 'PRD.md',
    TECH_SPEC: 'TECH_SPEC.md',
    APP_FLOW: 'APP_FLOW.md',
    DESIGN: 'DESIGN.md',
    SCHEMA: 'SCHEMA.md',
    IMPLEMENTATION_PLAN: 'IMPLEMENTATION_PLAN.md',
    TRACKER: 'TRACKER.md',
    RULES: 'RULES.md',
  };
  
  Object.entries(documents).forEach(([key, content]) => {
    folder?.file(fileNames[key], content);
  });
  
  // Also add AGENT_PROMPT.md automatically
  folder?.file('AGENT_PROMPT.md', generateAgentPrompt(productName, documents));
  
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${productName.toLowerCase().replace(/\s+/g, '-')}-docs.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
```

**IMPORTANT:** Also auto-generate an `AGENT_PROMPT.md` in the zip — a ready-to-paste prompt that tells the IDE agent to read all 8 docs and build the project. This is the thing that makes the whole flow complete.

```typescript
function generateAgentPrompt(productName: string, documents: Record<string, string>): string {
  return `# ${productName} — Agent Build Prompt
**Paste this entire prompt into your IDE agent to start the build.**

---

You are building ${productName} — a complete, production-ready application.
Your job is to build the entire application from scratch, end-to-end, without stopping until complete.

## Your First Action

Read ALL of the following files in the \`docs/\` folder before writing a single line of code:
1. \`docs/PRD.md\` — what you are building and why
2. \`docs/TECH_SPEC.md\` — exact architecture and stack
3. \`docs/APP_FLOW.md\` — every user flow
4. \`docs/DESIGN.md\` — complete design system
5. \`docs/SCHEMA.md\` — all data types and storage
6. \`docs/IMPLEMENTATION_PLAN.md\` — phased build plan
7. \`docs/TRACKER.md\` — track your progress here
8. \`docs/RULES.md\` — rules that govern everything

Do not start coding until you have read all 8 files.

## Rules
- Follow the phases in IMPLEMENTATION_PLAN.md exactly
- Update TRACKER.md as you complete each task
- Do not stop until all tasks in TRACKER.md are checked off
- Do not ask questions — make reasonable decisions and continue
- Run the build command at the end and confirm it succeeds

Now read the docs and begin with Phase 0.
`;
}
```

---

## 8. Profile/Session Tracking for Genesis

Add to the profile schema (SCHEMA.md additions):

```typescript
interface GenesisSession {
  id: string;
  date: string;
  product_name: string;
  one_liner: string;
  tech_stack: string[];
  docs_generated: string[];  // which of the 8 were generated
  download_count: number;    // how many times zip was downloaded
}
```

APS key: `mirror:sessions:genesis:{uuid}`

Add to Profile dashboard:
- "Genesis Projects" section showing past generated doc sets
- Each entry: product name + date + tech stack badges + "Re-open" link
- "Re-open" loads the documents back into the workspace for further editing

---

## 9. Build Instructions

```bash
# Install new dependency
cd app
npm install jszip

# No new font needed
# No new chart library needed
# Everything else already exists

npm run build  # must pass
anna-app dev   # must run without errors
```

---

## 10. Rules For This Build Session

1. Do NOT rebuild anything that already exists
2. Only create: new route, new executa folder, new mode folder, genesis CSS tokens
3. Only modify: tokens.css (add genesis color), sidebar (add genesis nav item), App.tsx (add route + change default), dashboard hero (add genesis card)
4. The document workspace's contenteditable areas must save to React state on every change
5. JSZip must be installed via npm — not CDN
6. The AGENT_PROMPT.md must be auto-included in every zip download
7. All 8 docs must pass previously generated docs as context — consistency is the whole value
8. The generation sequence must show each doc completing one by one — not all at once
9. tool_id `bundled:project-genesis` must match in executa.json, pyproject.toml name, and describe()['name'] in plugin
10. After build: npm run build must pass, anna-app dev must run, all 4 stages of Genesis must work end-to-end

---

## 11. Verification Checklist

- [ ] Project Genesis appears at top of sidebar with fuchsia glow styling
- [ ] Default route is `/genesis` not `/archaeology`
- [ ] Dashboard hero shows Genesis card prominently with "Start Building →"
- [ ] Stage 1: Brief textarea accepts input, Analyze Brief button calls executa
- [ ] Stage 2: Questions appear ONE AT A TIME with progress bar
- [ ] Stage 2: Adaptive — vague brief gets more questions than detailed brief
- [ ] Stage 2: Spec confirmation summary shows all answers editable
- [ ] Stage 3: Generation sequence shows 8 progress bars filling sequentially
- [ ] Stage 3: Rotating text changes during generation
- [ ] Stage 4: Document workspace shows all 8 tabs in left panel
- [ ] Stage 4: Content is editable inline (contenteditable)
- [ ] Stage 4: Clicking each tab shows that doc's content
- [ ] Download ZIP works and contains 9 files (8 docs + AGENT_PROMPT.md)
- [ ] Each doc in ZIP is specific to the user's project (not generic)
- [ ] All 8 docs are consistent with each other (same stack, same names)
- [ ] Genesis sessions saved to APS and visible in Profile
- [ ] All other modes still work (no regressions)
- [ ] npm run build passes
- [ ] anna-app dev runs without console errors
