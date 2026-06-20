# MIRROR — Doc Brutalist Feature
**Version:** 5.0  
**Type:** New mode — minimal codebase changes  
**Read completely before touching any code.**

---

## What Is Doc Brutalist

Doc Brutalist is a new Mirror mode that takes a developer's README, setup guide, or any documentation and subjects it to a brutal, honest audit. It finds every place real users would get confused, give up, or fail — then shows the problems three ways simultaneously: annotated original, section-by-section comparison, and a full rewrite. The developer reviews every finding, confirms what's real, and downloads documentation that actually converts users.

The name is the product philosophy: brutal honesty about your docs, no sugarcoating, no AI politeness. Your README is losing you users right now. Doc Brutalist shows you exactly how many and exactly why.

---

## Minimal Changes Required

Only create:
1. New route: `/doc-brutalist`
2. New executa: `doc-brutalist`
3. New sidebar item: between Learning Path and Profile
4. New mode folder: `src/modes/DocBrutalist/`

Only modify:
- `tokens.css` — add doc-brutalist color
- `App.tsx` — add new route
- `Sidebar.tsx` — add new nav item

Nothing else changes.

---

## 1. Color Token

Add to tokens.css:
```css
--brutalist:       #EF4444;   /* Harsh red — brutal, honest, cuts through */
--brutalist-soft:  #DC2626;
--brutalist-glow:  rgba(239, 68, 68, 0.20);
--brutalist-wash:  rgba(239, 68, 68, 0.06);
--brutalist-text:  #FCA5A5;
--shadow-glow-brutalist: 0 0 30px rgba(239, 68, 68, 0.25);
```

Add body mode class:
```css
body.mode-brutalist {
  --mode-color:  var(--brutalist);
  --mode-glow:   var(--brutalist-glow);
  --mode-wash:   var(--brutalist-wash);
  --mode-text:   var(--brutalist-text);
  --mode-shadow: var(--shadow-glow-brutalist);
}
```

---

## 2. Sidebar Entry

Add between Learning Path and Profile:
```
📄 Doc Brutalist    ← harsh red accent
```

Label: "Doc Brutalist"
Icon: a scalpel or slash symbol — something that communicates cutting
Color: --brutalist (#EF4444)
Route: /doc-brutalist

---

## 3. Full Page Flow

### Stage 1 — Input

```
┌─────────────────────────────────────────────────────────┐
│  ✂ DOC BRUTALIST                                        │
│  Your docs are losing you users. Find out exactly why.  │
│                                                         │
│  Who is your target user?                               │
│  ○ Developer (technical, knows code)                    │
│  ○ Technical but not a developer (understands concepts) │
│  ○ Non-technical (business user, no code knowledge)     │
│  ○ Mixed audience                                       │
│                                                         │
│  What should they accomplish in their first 5 minutes?  │
│  ┌─────────────────────────────────────────────────┐   │
│  │  e.g. "Install the package and run their        │   │
│  │   first query" or "Sign up and create a         │   │
│  │   project"                                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Your documentation:                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Paste your README or docs here...              │   │
│  │                                                 │   │
│  │  [large textarea, monospace font]               │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  OR  [ ↑ Upload .md file ]                             │
│                                                         │
│  [ Brutalize It → ]                                     │
└─────────────────────────────────────────────────────────┘
```

File upload handling:
```typescript
// When user uploads .md file:
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target?.result as string;
    setDocContent(content);  // populates the textarea
  };
  reader.readAsText(file);
};
// User sees their file content in the textarea after upload
// They can edit before submitting
```

---

### Stage 2 — Analysis Running

```
┌─────────────────────────────────────────────────────────┐
│  ✂ BRUTALIZING YOUR DOCS...                            │
│                                                         │
│  ◉ First paragraph test...           [pulsing red dot] │
│  ○ Time to first success audit...                      │
│  ○ Assumption scanner...                               │
│  ○ Jargon detector...                                  │
│  ○ Copy-paste failure check...                         │
│  ○ Missing sections audit...                           │
│  ○ Generating rewrite...                               │
│                                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  14%                    │
│                                                         │
│  "Reading your docs as a confused developer would..."   │
└─────────────────────────────────────────────────────────┘
```

Rotating text during analysis:
- "Reading your docs as a confused developer would..."
- "Finding every assumption you made..."
- "Counting how many users this loses you..."
- "Locating the commands that will fail..."
- "Building the honest version..."

---

### Stage 3 — The Brutality Report + Three Views

After analysis, UI transforms into a three-panel workspace with tabs:

```
┌─────────────────────────────────────────────────────────────────┐
│  ✂ DOC BRUTALIST — Results                     Clarity: 34/100 │
├──────────────────────────────────────────────────────────────────┤
│  [ Annotated ]  [ Side by Side ]  [ Full Rewrite ]  [ Export ] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Active tab content renders here]                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

The Clarity Score (0-100) is shown prominently in the header.
Color: red (0-40), amber (41-69), green (70-100).
Subtitle below score: "Your docs would fail 7 out of 10 first-time users."

---

### Tab 1 — Annotated Original

Shows the user's ORIGINAL documentation with issues highlighted inline:

```
┌────────────────────────────────────────────────────────────┐
│  YOUR ORIGINAL — 23 issues found                           │
│                                                            │
│  # My Awesome Tool                          [▲ ISSUE #1]  │
│  ╔══════════════════════════════════════════════════════╗  │
│  ║ ⚠ First paragraph failure                           ║  │
│  ║ Doesn't explain what this does in plain English.    ║  │
│  ║ A new user has no idea what "awesome tool" means.   ║  │
│  ╚══════════════════════════════════════════════════════╝  │
│                                                            │
│  A powerful CLI for managing your workflows               │
│  with enterprise-grade performance.          [▲ ISSUE #2] │
│  ╔══════════════════════════════════════════════════════╗  │
│  ║ ⚠ Jargon without definition                         ║  │
│  ║ "enterprise-grade" means nothing to your user.      ║  │
│  ║ Replace with: what it actually does faster/better.  ║  │
│  ╚══════════════════════════════════════════════════════╝  │
│                                                            │
│  ## Installation                                           │
│  Run: npm install my-tool              [▲ ISSUE #3]       │
│  ╔══════════════════════════════════════════════════════╗  │
│  ║ ⚠ Missing prerequisite                              ║  │
│  ║ Assumes Node.js is installed. 40% of your target    ║  │
│  ║ users won't have it. Add: "Requires Node.js 18+"    ║  │
│  ╚══════════════════════════════════════════════════════╝  │
│                                                            │
│  [continues through entire original doc with all issues]  │
└────────────────────────────────────────────────────────────┘
```

Each issue annotation:
- Issue number
- Issue type badge: JARGON / ASSUMPTION / MISSING / CONFUSING / BROKEN COMMAND / WRONG ORDER
- One sentence explaining the problem
- One sentence explaining the fix

Human review on this tab:
Each issue has two small buttons: `✓ Real issue` / `✗ Not applicable`
User marks each one. Only confirmed issues carry forward to the rewrite.

---

### Tab 2 — Side by Side

Original and improved version shown section by section:

```
┌──────────────────────────┬──────────────────────────────┐
│  ORIGINAL                │  IMPROVED                    │
│  ─────────────────────── │  ─────────────────────────── │
│                          │                              │
│  # My Awesome Tool       │  # My Awesome Tool           │
│                          │                              │
│  A powerful CLI for      │  A CLI tool that lets you    │
│  managing your workflows │  run and schedule any        │
│  with enterprise-grade   │  terminal command from a     │
│  performance.            │  simple config file.         │
│                          │  No scripting needed.        │
│                          │                              │
│  [red highlight on       │  [green highlight on         │
│   problem text]          │   improved text]             │
│                          │                              │
│  ## Installation         │  ## Before you start        │
│  Run: npm install my-tool│  You need Node.js 18+.      │
│                          │  Check: node --version       │
│                          │                              │
│                          │  ## Install (30 seconds)    │
│                          │  npm install -g my-tool     │
│                          │  my-tool --version           │
│                          │  → Should print: 2.1.0      │
└──────────────────────────┴──────────────────────────────┘
```

Color coding:
- Red highlight in original = problem area
- Green highlight in improved = what changed
- Unchanged sections shown in muted style

Each section pair has an accept button:
`✓ Use this improvement` / `✗ Keep original`

---

### Tab 3 — Full Rewrite

Complete rewritten documentation, structured around the user's target audience and 5-minute goal:

```
┌────────────────────────────────────────────────────────────┐
│  FULL REWRITE  [contenteditable — edit before downloading] │
│                                                            │
│  # My Awesome Tool                                         │
│                                                            │
│  Run and schedule any terminal command from a simple       │
│  config file. No scripting. No cron syntax.                │
│                                                            │
│  **What you'll have in 5 minutes:** A working config       │
│  file that runs your first automated command.              │
│                                                            │
│  ## Before you start                                       │
│  - Node.js 18 or higher ([install here](nodejs.org))      │
│  - A terminal (Terminal on Mac, PowerShell on Windows)     │
│                                                            │
│  ## Install                                                │
│  npm install -g my-tool                                    │
│  my-tool --version  # should print: 2.1.0                 │
│                                                            │
│  ## Your first workflow (2 minutes)                        │
│  [step by step, copy-pasteable, with expected output]      │
│                                                            │
│  ## Common problems                                        │
│  **"command not found"** → restart your terminal          │
│  **"permission denied"** → run with sudo on Mac/Linux     │
│  **nothing happens** → check your config file path        │
│                                                            │
│  [continues — full rewrite based on confirmed issues only] │
└────────────────────────────────────────────────────────────┘
```

The rewrite only incorporates issues the user marked as "Real issue" in Tab 1 and sections they accepted in Tab 2. If they rejected an improvement, the original text is kept.

Fully editable — `contenteditable` on the entire content area.

---

### Tab 4 — Export

```
┌────────────────────────────────────────────────────────────┐
│  EXPORT YOUR DOCS                                          │
│                                                            │
│  Clarity Score:  34/100 → 81/100  ↑ +47 points           │
│  Issues found:   23                                        │
│  Issues fixed:   18  (5 marked not applicable)            │
│  Users saved:    estimated 6-7 out of 10 first-timers     │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  [ ↓ Download README.md ]                           │ │
│  │  Downloads your approved rewrite as README.md        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  [ Copy to Clipboard ]                              │ │
│  │  Copies full rewrite text                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  [ Copy Issues Report ]                             │ │
│  │  Copies list of all 23 issues for your records      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [ Save to Profile ]  → saves session + both scores       │
└────────────────────────────────────────────────────────────┘
```

The "estimated users saved" is calculated from:
- Issues confirmed as real × average user drop-off weight per issue type
- MISSING PREREQUISITE = high drop-off, JARGON = medium, WRONG ORDER = high

---

## 4. Executa: doc-brutalist

Create `executas/doc-brutalist/` with:

### executa.json
```json
{
  "slug": "doc-brutalist",
  "name": "Mirror Doc Brutalist",
  "version": "1.0.0",
  "executa_type": "tool",
  "tool_id": "bundled:doc-brutalist",
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
name = "bundled:doc-brutalist"
version = "1.0.0"
requires-python = ">=3.11"
dependencies = ["httpx>=0.27.0"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### doc_brutalist_plugin.py

Two methods:

**Method 1: analyze_docs**

```python
ANALYZE_SYSTEM = """
You are a brutally honest documentation reviewer. Your job is to find every
place a real user would get confused, fail, or give up reading this documentation.

You are NOT being helpful or encouraging. You are being ruthlessly honest.
Every problem you find costs the developer real users.

Return ONLY valid JSON. No markdown. Start with { end with }.

Schema:
{
  "clarity_score": 0-100,
  "clarity_verdict": "one brutal sentence about overall quality",
  "estimated_user_failure_rate": "X out of 10 first-time users will fail",
  "issues": [
    {
      "id": "issue_1",
      "type": "FIRST_PARAGRAPH|JARGON|ASSUMPTION|MISSING_PREREQ|BROKEN_COMMAND|WRONG_ORDER|MISSING_SECTION|CONFUSING_LABEL|NO_EXPECTED_OUTPUT|TOO_LONG",
      "location": "exact quote of the problematic text (max 100 chars)",
      "problem": "one sentence explaining what's wrong",
      "fix": "one sentence explaining the fix",
      "severity": "HIGH|MEDIUM|LOW",
      "drop_off_weight": 1-10
    }
  ],
  "missing_sections": ["list of sections this README should have but doesn't"],
  "top_3_fixes": ["the 3 highest-impact fixes, in priority order"],
  "first_paragraph_verdict": "does the first paragraph tell you what this does in plain English? Be harsh.",
  "time_to_first_success": "how long following these docs literally would take, and where it first breaks"
}

Scoring guide:
0-20: Actively harmful — will confuse and drive away users
21-40: Significantly flawed — loses most first-time users
41-60: Average — some users make it through, many don't
61-80: Good — most users succeed, some friction remains
81-100: Excellent — nearly all users succeed immediately

Be harsh. Most READMEs score 20-40. A score above 70 means genuinely good docs.
"""

def analyze_docs(doc_content: str, target_user: str, five_minute_goal: str) -> dict:
    user_msg = f"""
Target user: {target_user}
5-minute goal: {five_minute_goal}

Documentation to brutalize:
{doc_content}

Find every issue. Be ruthless. Score honestly.
"""
    try:
        raw = call_claude(ANALYZE_SYSTEM, user_msg)
        clean = raw.strip().strip('`').strip()
        if clean.startswith('json'):
            clean = clean[4:].strip()
        return json.loads(clean)
    except json.JSONDecodeError:
        retry = user_msg + "\n\nReturn ONLY the JSON object. Start with { and end with }."
        try:
            return json.loads(call_claude(ANALYZE_SYSTEM, retry).strip())
        except:
            return {"error": "Analysis failed. Please try again."}
```

**Method 2: generate_rewrite**

```python
REWRITE_SYSTEM = """
You are rewriting documentation to be genuinely usable by real humans.

Rules:
- Write for the specific target user provided
- Every step must be copy-pasteable and work
- Include expected output for every command
- No jargon without explanation
- Prerequisites stated FIRST, before any instructions
- First paragraph must answer: what is this, what does it do, who is it for
- Structure: What it is → Prerequisites → Install → First success → Common problems → Next steps
- Be warm but direct. Not corporate. Not over-enthusiastic. Just clear.

Return the complete rewritten documentation as plain markdown.
Do NOT wrap in JSON. Do NOT add backticks. Just return the markdown.
"""

def generate_rewrite(
    original_doc: str,
    target_user: str,
    five_minute_goal: str,
    confirmed_issues: list,
    accepted_improvements: list
) -> str:
    issues_text = "\n".join([
        f"- {i['type']}: {i['problem']} → Fix: {i['fix']}"
        for i in confirmed_issues
    ])
    
    user_msg = f"""
Target user: {target_user}
5-minute goal: {five_minute_goal}

Original documentation:
{original_doc}

Confirmed issues to fix:
{issues_text}

Rewrite this documentation fixing all confirmed issues.
Structure it so a {target_user} can achieve "{five_minute_goal}" in under 5 minutes.
"""
    return call_claude(REWRITE_SYSTEM, user_msg)
```

---

## 5. React Components

Create `src/modes/DocBrutalist/`:

```
DocBrutalist/
├── index.tsx              ← Stage state machine
├── DocInput.tsx           ← Stage 1: textarea + upload + user context
├── AnalysisProgress.tsx   ← Stage 2: 7-step progress reveal
├── ResultsWorkspace.tsx   ← Stage 3: 4-tab workspace
├── AnnotatedView.tsx      ← Tab 1: inline annotations
├── SideBySideView.tsx     ← Tab 2: comparison columns
├── RewriteView.tsx        ← Tab 3: editable full rewrite
├── ExportView.tsx         ← Tab 4: download options
└── IssueCard.tsx          ← Reusable issue annotation card
```

### State Machine (index.tsx)

```typescript
type BrutalistStage =
  | 'input'       // Stage 1
  | 'analyzing'   // Stage 2
  | 'results';    // Stage 3

interface BrutalistState {
  stage: BrutalistStage;
  docContent: string;
  targetUser: string;
  fiveMinuteGoal: string;
  
  // Analysis results
  clarityScore: number;
  clarityVerdict: string;
  estimatedFailureRate: string;
  issues: Issue[];
  missingSections: string[];
  topThreeFixes: string[];
  timeToFirstSuccess: string;
  
  // Human review decisions
  confirmedIssues: string[];    // issue IDs marked as real
  rejectedIssues: string[];     // issue IDs marked not applicable
  acceptedImprovements: string[]; // section IDs accepted in side-by-side
  
  // Rewrite
  rewriteContent: string;       // editable by user
  
  // UI
  activeTab: 'annotated' | 'sidebyside' | 'rewrite' | 'export';
  analysisStep: number;
}
```

### IssueCard.tsx

```typescript
interface IssueCardProps {
  issue: Issue;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  status: 'unreviewed' | 'confirmed' | 'rejected';
}

// Renders inline in AnnotatedView
// Shows: issue type badge (colored) + problem + fix + severity
// Two buttons: ✓ Real issue (green) / ✗ Not applicable (muted)
// When confirmed: card gets red left border, confirmed badge
// When rejected: card fades to 40% opacity, strikethrough
```

Issue type badge colors:
```typescript
const ISSUE_COLORS = {
  FIRST_PARAGRAPH:   '#EF4444',  // red — critical
  MISSING_PREREQ:    '#EF4444',  // red — critical
  BROKEN_COMMAND:    '#EF4444',  // red — critical
  WRONG_ORDER:       '#F59E0B',  // amber — high
  ASSUMPTION:        '#F59E0B',  // amber — high
  MISSING_SECTION:   '#F59E0B',  // amber — high
  JARGON:            '#6B7280',  // gray — medium
  CONFUSING_LABEL:   '#6B7280',  // gray — medium
  NO_EXPECTED_OUTPUT:'#6B7280',  // gray — medium
  TOO_LONG:          '#3B82F6',  // blue — low
};
```

### SideBySideView.tsx

```typescript
// Splits doc into sections (by ## headings)
// Shows each section as a row: original left, improved right
// Red highlight on changed text in original
// Green highlight on changed text in improved
// Each row has: ✓ Use improvement / ✗ Keep original

// When user selects "Use improvement" → 
//   that section gets queued for the rewrite
// When user selects "Keep original" → 
//   original text used in final rewrite
```

### RewriteView.tsx

```typescript
// Shows complete rewrite
// contenteditable div for inline editing
// Auto-saves to state on every keystroke (debounced 300ms)
// Shows word count
// "Reset to generated" button if user wants to undo edits
// Syntax highlighting for code blocks (pure CSS, no library)
```

---

## 6. Profile Integration

Add to profile schema:

```typescript
interface BrutalistSession {
  id: string;
  date: string;
  doc_title: string;        // first heading or "Untitled"
  target_user: string;
  original_clarity_score: number;
  final_clarity_score: number;   // recalculated after confirmed fixes
  issues_found: number;
  issues_confirmed: number;
  issues_fixed: number;
  downloaded: boolean;
}
```

APS key: `mirror:sessions:brutalist:{uuid}`

Add to Profile dashboard:
```
Doc Brutalist section:
- "X docs analyzed"
- Average clarity score improvement: +Y points
- Total issues found: Z
- Recent sessions list
```

---

## 7. Clarity Score Calculation

Initial score comes from Claude. After human review, recalculate:

```typescript
function recalculateScore(
  baseScore: number,
  confirmedIssues: Issue[],
  totalIssues: Issue[]
): number {
  // Each confirmed issue has a drop_off_weight (1-10)
  // Total possible drop_off = sum of all issue weights
  // Confirmed drop_off = sum of confirmed issue weights
  // Score improves proportionally as confirmed issues are "fixed"
  
  const totalWeight = totalIssues.reduce((sum, i) => sum + i.drop_off_weight, 0);
  const confirmedWeight = confirmedIssues.reduce((sum, i) => sum + i.drop_off_weight, 0);
  
  // Final score = base + improvement from fixing confirmed issues
  const improvement = (confirmedWeight / Math.max(totalWeight, 1)) * (100 - baseScore);
  return Math.min(100, Math.round(baseScore + improvement));
}
```

Show both scores in export tab:
- Original: 34/100
- After fixes: 81/100
- Delta: +47 points

---

## 8. Download Implementation

```typescript
// Download as README.md
function downloadReadme(content: string, docTitle: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'README.md';
  a.click();
  URL.revokeObjectURL(url);
}

// Copy issues report
function copyIssuesReport(issues: Issue[], scores: ScoreSummary): string {
  return `# Doc Brutalist Report
Generated: ${new Date().toLocaleDateString()}

## Scores
Original Clarity: ${scores.original}/100
After Fixes: ${scores.final}/100
Improvement: +${scores.delta} points

## Issues Found (${issues.length} total)

${issues.map((i, idx) => `
### Issue ${idx + 1}: ${i.type} [${i.severity}]
Location: "${i.location}"
Problem: ${i.problem}
Fix: ${i.fix}
Drop-off weight: ${i.drop_off_weight}/10
Status: ${i.confirmed ? '✓ Confirmed' : '✗ Not applicable'}
`).join('\n')}
`;
}
```

---

## 9. Build Instructions

```bash
# No new npm packages needed
# JSZip already installed from Project Genesis
# No new fonts needed

cd app
npm run build   # must pass
anna-app dev    # must run without errors
```

---

## 10. Rules For This Build Session

1. Do NOT touch any existing mode — only add new files
2. Only modify: tokens.css, App.tsx, Sidebar.tsx
3. The annotated view must show issues inline — not in a separate panel
4. Issue cards must have real review buttons — not decorative
5. The rewrite is generated AFTER user reviews annotated view — not before
6. Only confirmed issues go into the rewrite — rejected ones are ignored
7. The full rewrite is editable before download — contenteditable required
8. Clarity score shown in header at all times during results stage
9. Both scores (original + after fixes) shown in export tab
10. tool_id `bundled:doc-brutalist` must match in executa.json, pyproject.toml, and describe()['name']
11. npm run build must pass after all changes
12. anna-app dev must run with no console errors

---

## 11. Verification Checklist

- [ ] Doc Brutalist appears in sidebar with red accent color
- [ ] Route `/doc-brutalist` works with page slide transition
- [ ] Body class switches to `mode-brutalist` on navigation
- [ ] Stage 1: target user radio buttons work
- [ ] Stage 1: 5-minute goal textarea works
- [ ] Stage 1: paste text in textarea works
- [ ] Stage 1: upload .md file populates textarea
- [ ] Stage 1: both input methods result in same analysis
- [ ] Stage 2: 7 analysis steps reveal sequentially
- [ ] Stage 2: rotating text changes during analysis
- [ ] Stage 3: clarity score shown in header immediately
- [ ] Tab 1 Annotated: issues shown inline at correct positions
- [ ] Tab 1 Annotated: each issue has ✓ Real / ✗ Not applicable buttons
- [ ] Tab 1 Annotated: confirmed issues get red border, rejected fade
- [ ] Tab 2 Side by Side: original and improved shown in two columns
- [ ] Tab 2 Side by Side: red highlights on original problems
- [ ] Tab 2 Side by Side: green highlights on improvements
- [ ] Tab 2 Side by Side: accept/keep buttons work per section
- [ ] Tab 3 Rewrite: full rewrite generated after review
- [ ] Tab 3 Rewrite: content is fully editable inline
- [ ] Tab 3 Rewrite: edits save to state automatically
- [ ] Tab 4 Export: shows both scores + delta
- [ ] Tab 4 Export: download README.md works
- [ ] Tab 4 Export: copy to clipboard works
- [ ] Tab 4 Export: copy issues report works
- [ ] Tab 4 Export: Save to Profile saves session
- [ ] Profile dashboard shows brutalist sessions
- [ ] All other modes still work (no regressions)
- [ ] npm run build passes with no TypeScript errors
- [ ] anna-app dev runs without console errors
