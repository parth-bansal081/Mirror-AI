# MIRROR — V2 Fixes & Upgrades
**Paste this entire file into your IDE agent. Read every word before touching any code.**

---

## Context

Mirror is already running at localhost:5180. Three modes exist: Prompt Archaeology, Devil's Advocate, Agent Babysitter. The following issues need fixing AND new features need adding. Do all of them in one continuous session without stopping.

---

## CRITICAL ISSUES TO FIX FIRST

### Fix 1 — Prompt Archaeology Results Are Cut Off

**Current behavior:** After "Analysis Complete" + Forensic Analysis section, the UI stops. The 3 rewrite variants never appear.

**What needs to happen:** After the user clicks "Yes, accurate" or "Partially wrong" on the forensic section, the following must render BELOW it in sequence:

**Section A — Prompt Integrity Score**
A large prominent score panel showing:
- A circular ring (SVG, animated fill from 0 to score over 1.2s)
- Score number in center: 0–100
- Score label below: "PROMPT INTEGRITY SCORE"
- Score color: red (0–40), orange (41–69), green (70–100)
- Below the ring: a breakdown grid showing 4 metrics each with their own percentage bar:

```
Clarity          [████████░░] 78%   How clearly the intent was stated
Specificity      [█████░░░░░] 52%   How specific the requirements were  
Context          [███░░░░░░░] 32%   How much relevant context was provided
Format Guidance  [██░░░░░░░░] 20%   Whether output format was specified
```

These 4 sub-scores must be calculated by the executa and returned alongside the main score. The overall score = average of the 4.

Below the breakdown: a one-line "Diagnosis Summary" in italic:
*"Your prompt scored 45/100 — primarily failing on context and format guidance. The AI had to guess both what you needed and how to present it."*

**Section B — AI Assumptions Panel**
Already partially showing but needs to be richer:
- Each assumption as a card with an icon
- Not just bullet points — show WHY each assumption was wrong
- Show "What you meant vs What AI heard" as a two-column comparison for each assumption

**Section C — Three Rewrite Variants (THIS IS MISSING — ADD IT)**
Three cards side by side (CSS grid, equal columns). Each card contains:
- Strategy badge at top: e.g. "FORMAT-FIRST" / "CONTEXT-FIRST" / "CONSTRAINT-FIRST"
- What this fixes: 2–3 badge pills showing the specific issues addressed
- The full rewritten prompt in a monospace box
- Predicted output: italic description of what the AI would likely return
- A "Select This Fix" button at bottom

Below the three cards:
- A "Blend Manually" textarea pre-filled with the selected variant's text
- The user can edit it freely
- A "Save to Library" button — saves the final prompt to the library

**Section D — Pattern Warning (if applicable)**
If this failure type has been seen before in the user's session history, show:
```
⚠ PATTERN DETECTED
You've had this same failure type (Vague Instruction) 3 times.
Consider adding format constraints to all your prompts by default.
```

---

### Fix 2 — Devil's Advocate Missing Human Review Cards + Score

**Current behavior:** Unknown — needs verification that after analysis, 5 challenge cards appear with Valid/Overblown/NA buttons AND the readiness score ring appears after all 5 are marked.

**What must happen:**
1. Analysis runs → 5 challenge cards appear with staggered animation (600ms between each)
2. Each card has exactly 3 buttons: `✓ Valid` (green) / `~ Overblown` (amber) / `✗ Not Applicable` (muted)
3. After ALL 5 are marked → "Generate Readiness Score" button appears
4. Click → Score ring animates (same SVG ring as Prompt Integrity Score)
5. Below score: breakdown of valid/overblown/NA counts
6. "Strongest unaddressed risk" shown if any valid challenges exist
7. "Save Decision" button saves to profile

If any of steps 2–7 are missing or broken, fix them.

---

### Fix 3 — Agent Babysitter: Clarify the UX + Fix Missing Steps

**Current behavior:** User inputs a task and clicks Define Checkpoints. Unknown if checkpoint plan actually renders.

**What must render after Define Checkpoints:**
1. A numbered list of steps, each with:
   - Step description
   - Risk badge: `LOW` (green) / `MED` (amber) / `HIGH` (red) / `🔒 IRREVERSIBLE` (red, bold)
   - For IRREVERSIBLE steps: explanation "This action cannot be undone — Mirror will require your approval before proceeding"
2. "Approve Plan & Start Monitoring" button

**After approving the plan:**
Show a Step Logger interface:
- Current step highlighted
- Textarea: "Paste this step's output here"
- "Submit Step" button
- Status indicator: `● COHERENT` / `⚠ DRIFTING` / `🔒 APPROVAL REQUIRED`
- Step history list showing all submitted steps with their status

**When an IRREVERSIBLE step is reached:**
- Full screen overlay (position: fixed, inset: 0, z-index: 1000)
- Dark background with blur
- Modal shows:
  - Red warning icon
  - "⛔ IRREVERSIBLE ACTION DETECTED"  
  - What the action is (from the step definition)
  - Two large buttons: "✓ Approve & Continue" / "✗ Reject & Stop"
  - Cannot be dismissed by clicking outside or pressing Escape
  - Only the two buttons exit this state

**After run completes:**
- Plain English summary (3–5 sentences)
- Stats: steps completed / drift events / approvals given
- "Save to Agent Log" button

Also add a helper text ABOVE the task input explaining how to use it:
```
How to use Agent Babysitter:
1. Describe the full multi-step task your AI agent will run
2. Mirror maps which steps are risky or irreversible
3. As your agent runs (in Cursor, Claude Code, etc.), paste each step's output here
4. Mirror monitors for drift and gates irreversible actions
5. You stay in control — the agent can't do something permanent without your approval
```

---

## NEW FEATURE: Learning Path Negotiator (4th Mode)

Add a completely new mode called **"Learning Path"** to the sidebar, between Agent Babysitter and Profile.

### Sidebar entry:
- Icon: graduation cap or book concept
- Label: "Learning Path"
- Accent color: `#10B981` (emerald green) — new color for this mode
- URL: `/learning` (once routing is added per Fix 5 below)

### What it does:

**Step 1 — Topic Input**
```
What do you want to learn?
[textarea placeholder: "e.g. Kubernetes, machine learning, options trading, React hooks, system design..."]

Why do you need to learn this?
○ Job interview prep
○ Side project  
○ Work requirement
○ Pure curiosity
○ Career switch

[ Start Assessment ]
```

**Step 2 — Baseline Assessment (5 Questions)**
After clicking Start Assessment, Anna generates 5 targeted questions to assess what the user already knows. These are NOT multiple choice — they're short answer questions that reveal actual knowledge level through the quality of the answer.

Show questions one at a time. Each question:
- Shows in a card with the question text
- Has a textarea for the user's answer
- "Next Question" button (or "Skip — I don't know this")
- Progress: "Question 2 of 5"

Example questions for "Kubernetes":
1. "What problem does Kubernetes solve that Docker alone doesn't?"
2. "What's the difference between a Pod and a Container in Kubernetes?"
3. "How does Kubernetes decide which node to schedule a Pod on?"
4. "What happens to traffic when you do a rolling deployment in Kubernetes?"
5. "When would you use a StatefulSet instead of a Deployment?"

The quality and depth of answers determines baseline level: Beginner / Intermediate / Advanced.

**Step 3 — Curriculum Generation**
Anna generates a custom learning path based on:
- The topic
- The goal (interview/project/work/curiosity)
- The inferred baseline level from the 5 answers

Display as a visual roadmap:
```
YOUR KUBERNETES LEARNING PATH
Level: Intermediate → Production-Ready
Goal: Job Interview Prep
Estimated time: 3 weeks

WEEK 1 — CORE CONCEPTS (skip if you know these)
  ✓ Pods, Deployments, Services — you already know this (from Q2 answer)
  → ConfigMaps & Secrets
  → Namespaces & Resource Limits
  → Health checks (liveness/readiness probes)

WEEK 2 — CLUSTER OPERATIONS  
  → Scheduling & Node affinity
  → Rolling deployments & rollback
  → Persistent Volumes & StatefulSets
  
WEEK 3 — INTERVIEW PREP
  → Common interview scenarios
  → Debugging exercises
  → Mock questions & answers

[ Start Week 1 ] [ Reorder Topics ] [ Mark topics I know ]
```

The user can:
- Drag/reorder topics
- Mark topics as "Already know this" → removes from path
- Click "Start Week 1" → begins that week's content

**Step 4 — Checkpoint Assessments**
At the end of each week, Anna generates 3 mini-assessments:
- Not multiple choice — short practical questions
- User answers in their own words
- Anna evaluates the answer and either: confirms understanding, identifies gaps, or suggests revisiting

**State:**
- Profile tracks: current week, topics completed, assessment scores, knowledge gaps found
- Each session in Learning Path mode updates the profile
- If user comes back after a week, Anna picks up exactly where they left off and asks what they've practiced since

### New Executa: `learning-path`
Create `executas/learning-path/` with:
- `learning_path_plugin.py`
- `executa.json` with tool_id: `bundled:learning-path`
- `pyproject.toml`

Methods to implement:
1. `generate_questions(topic, goal)` → returns 5 targeted baseline questions
2. `assess_baseline(topic, questions_and_answers[])` → returns level + what they know/don't know
3. `generate_curriculum(topic, goal, level, known_topics[])` → returns full week-by-week path
4. `evaluate_checkpoint(topic, question, user_answer)` → returns: correct/partial/incorrect + explanation + what to review

---

## NEW FEATURE: Proper URL Routing Per Tab (Fix 5)

**Current behavior:** All modes show at the same URL. Clicking tabs changes view but URL stays the same.

**What needs to happen:** Install React Router and add proper routes.

```bash
cd app && npm install react-router-dom
```

Routes:
```
/                          → redirect to /archaeology
/archaeology               → Prompt Archaeology mode
/advocate                  → Devil's Advocate mode  
/babysitter                → Agent Babysitter mode
/learning                  → Learning Path mode (new)
/profile                   → Profile dashboard
```

Update the Sidebar so each nav item uses `<NavLink to="/archaeology">` etc. instead of onClick state switching.

The active route should highlight the correct sidebar item automatically via NavLink's `isActive` prop.

The breadcrumb in TopBar should update automatically from the current route.

---

## NEW FEATURE: Richer Profile Dashboard

The Profile page currently shows "0 sessions" — it needs to actually display meaningful data after sessions are completed.

Add these sections to Profile:

**Overall Intelligence Score** (top, prominent)
- Large number 0–100
- Delta from last week: "↑ +12 this week"
- Subtitle: "Based on your prompting patterns, decision quality, and agent safety"

**Prompt DNA Section**
- Radar/spider chart (pure SVG — no libraries) with 5 axes:
  Clarity / Specificity / Context / Format / Consistency
- Below: "Most common failure: Vague Instructions (5 times)"
- Below: "Most improved: Context provision (+34% this week)"

**Decision Map Section**  
- Horizontal bar chart (pure CSS) of blind spot categories
- "8 decisions tracked — average readiness score: 67/100"
- Last 3 decisions listed with their readiness scores

**Agent Log Section**
- Stats: total runs / drift events / approvals given
- "Riskiest workflow type: tasks with email sending"

**Learning Progress Section** (new, from Learning Path mode)
- Current topic + week
- Topics completed vs remaining
- Last checkpoint score

**Recent Sessions** (bottom)
- List of last 10 sessions across all modes
- Each row: mode icon + date + key outcome + "View" link

---

## DESIGN ADDITIONS

### Prompt Integrity Score Visual
The score breakdown grid uses this exact CSS pattern:
```css
.metric-bar-track {
  background: var(--color-surface-hi);
  border-radius: 4px;
  height: 6px;
  width: 100%;
}
.metric-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: var(--color-signal);
  transition: width 800ms cubic-bezier(0.16, 1, 0.3, 1);
  /* width set via inline style as percentage */
}
```

### Learning Path Color
Add to tokens.css:
```css
--mode-learning: #10B981;  /* emerald — growth, progress */
--mode-learning-glow: rgba(16, 185, 129, 0.15);
```

### Roadmap Visual
The curriculum roadmap uses a vertical timeline design:
- Left: week labels
- Center: vertical line connecting topics
- Right: topic cards
- Completed topics: checkmark, muted style
- Current topic: highlighted with mode color
- Future topics: normal style

---

## UPDATED EXECUTA CLAUDE PROMPTS

### Prompt Analyzer — add score calculation to response schema

The `analyze_prompt` method must now return this extended JSON:

```json
{
  "failure_type": "vague_instruction",
  "failure_explanation": "...",
  "integrity_score": 45,
  "sub_scores": {
    "clarity": 78,
    "specificity": 52,
    "context": 32,
    "format_guidance": 20
  },
  "diagnosis_summary": "Your prompt scored 45/100 — primarily failing on context and format guidance...",
  "assumptions": [
    {
      "assumption": "What AI assumed",
      "reality": "What you actually meant",
      "impact": "How this caused the bad output"
    }
  ],
  "rewrites": [
    {
      "id": "A",
      "strategy": "Format-First",
      "fixes": ["format_guidance", "specificity"],
      "rewritten_prompt": "...",
      "predicted_output": "..."
    },
    {
      "id": "B", 
      "strategy": "Context-First",
      "fixes": ["context", "clarity"],
      "rewritten_prompt": "...",
      "predicted_output": "..."
    },
    {
      "id": "C",
      "strategy": "Constraint-First", 
      "fixes": ["specificity", "format_guidance"],
      "rewritten_prompt": "...",
      "predicted_output": "..."
    }
  ],
  "pattern_warning": null
}
```

Update the system prompt to instruct Claude to calculate these scores rigorously:

```
Calculate integrity_score as the average of the 4 sub_scores.
For sub_scores:
- clarity: 0-100, how clearly the core intent was stated
- specificity: 0-100, how specific and constrained the requirements were  
- context: 0-100, how much relevant background context was provided
- format_guidance: 0-100, whether output format, length, tone were specified

Be honest and harsh. Most prompts score below 60. A prompt like "write code" scores:
clarity=20, specificity=10, context=5, format_guidance=0, overall=9.
A well-crafted prompt with context, constraints, and format guidance scores 75-90.
```

---

## RULES FOR THIS BUILD SESSION

1. Do NOT restart the app from scratch — modify existing files
2. Fix the issues in this order: Fix 1 → Fix 2 → Fix 3 → Add Learning Path → Add Routing → Enrich Profile
3. After each fix, verify it works before moving to the next
4. The app must still run on `anna-app dev` after all changes
5. No external CDN links — all dependencies via npm
6. All new components follow the same CSS module pattern as existing components
7. The learning path executa follows the exact same plugin structure as the existing 3 executas
8. tool_id for learning path: `bundled:learning-path` — must match in executa.json, pyproject.toml name, and describe()['name']
9. React Router: use `HashRouter` not `BrowserRouter` — Anna serves static files and hash routing works without a server
10. After ALL changes are done: run `npm run build` in the app/ folder and confirm it succeeds with no TypeScript errors
11. Do NOT stop and ask questions — make reasonable decisions and continue
12. Update TRACKER.md as you complete each item

---

## VERIFICATION CHECKLIST

Before declaring this session complete, verify:

- [ ] Prompt Archaeology shows: Score ring + 4 sub-score bars + assumptions with why + 3 rewrite cards + Save to Library
- [ ] Prompt Integrity Score animates from 0 to value
- [ ] Diagnosis summary text appears below score
- [ ] Devil's Advocate shows: 5 challenge cards + Valid/Overblown/NA buttons + Readiness Score ring after all marked
- [ ] Agent Babysitter shows: how-to-use text + checkpoint plan + step logger + irreversible full-screen gate
- [ ] Learning Path mode exists in sidebar (emerald green)
- [ ] Learning Path: 5 question assessment → curriculum generation → checkpoint evaluation all work
- [ ] All 5 modes have separate URLs via React Router HashRouter
- [ ] Profile shows real data sections (not just "0 sessions")
- [ ] `npm run build` passes with no errors
- [ ] `anna-app dev` still works after all changes
