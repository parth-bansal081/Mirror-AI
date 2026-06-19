# MIRROR — App Flow
**Version:** 1.0.0

---

## 1. App Entry & Initialization

```
User opens Mirror in Anna
        │
        ▼
main.tsx: waitForAnna()
        │
        ├─ window.anna not ready? → poll every 50ms
        │
        └─ window.anna ready
                │
                ▼
        Load profile from APS
        (mirror:profile:prompt_dna, decision_map, agent_log)
                │
                ├─ No profile found → initialize empty profile
                │
                └─ Profile found → hydrate Zustand store
                        │
                        ▼
                Mount React App
                        │
                        ▼
                Show Dashboard (default view)
```

---

## 2. Navigation Structure

```
┌─────────────────────────────────────────────────┐
│  MIRROR                              [Profile ●] │ ← TopBar
├────────────┬────────────────────────────────────┤
│            │                                    │
│  🔍 Prompt │                                    │
│  Archaeology│         MAIN CONTENT AREA         │
│            │                                    │
│  😈 Devil's│                                    │
│  Advocate  │                                    │
│            │                                    │
│  🤖 Agent  │                                    │
│  Babysitter│                                    │
│            │                                    │
│  ─────────  │                                    │
│            │                                    │
│  👤 Profile│                                    │
│            │                                    │
└────────────┴────────────────────────────────────┘
         Sidebar                Main Panel
```

Active mode highlighted in sidebar. Profile dot shows session count.

---

## 3. Mode A — Prompt Archaeology: Full Flow

```
┌─────────────────────────────────────────────────────────┐
│  PROMPT ARCHAEOLOGY              Sessions: 12  │ Library │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  STEP 1: What failed?                                   │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  Your Prompt        │  │  Bad Output Received    │   │
│  │  [textarea]         │  │  [textarea]             │   │
│  │                     │  │                         │   │
│  └─────────────────────┘  └─────────────────────────┘   │
│                                                         │
│                    [ Analyze Failure ]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
        ↓ User clicks Analyze
┌─────────────────────────────────────────────────────────┐
│  ANALYZING...                                           │
│                                                         │
│  ◉ Step 1: Diagnosing failure type...    [spinning]     │
│  ○ Step 2: Identifying AI assumptions...               │
│  ○ Step 3: Generating rewrites...                      │
│  ○ Step 4: Predicting outputs...                       │
│                                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 25%                 │
└─────────────────────────────────────────────────────────┘
        ↓ Steps complete one by one (animated reveal)
┌─────────────────────────────────────────────────────────┐
│  FORENSIC ANALYSIS                                      │
│                                                         │
│  ✦ Failure Type: AMBIGUITY                              │
│    "The prompt left the output format undefined,        │
│     causing the AI to guess — it guessed wrong."        │
│                                                         │
│  ✦ AI Assumed:                                          │
│    • You wanted a paragraph response (not a list)       │
│    • The audience was technical                         │
│    • You needed comprehensive coverage, not brevity     │
│                                                         │
│  ── HUMAN REVIEW ──────────────────────────────────     │
│  Does this match what you experienced?                  │
│  [✓ Yes, accurate]  [✗ Partially wrong]                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
        ↓ User confirms → Rewrites reveal
┌─────────────────────────────────────────────────────────┐
│  THREE FIXES                                            │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  FIX A       │ │  FIX B       │ │  FIX C       │   │
│  │  Format-first│ │  Context-    │ │  Constraint- │   │
│  │              │ │  first       │ │  first       │   │
│  │  [prompt     │ │  [prompt     │ │  [prompt     │   │
│  │  text]       │ │  text]       │ │  text]       │   │
│  │              │ │              │ │              │   │
│  │  Fixes:      │ │  Fixes:      │ │  Fixes:      │   │
│  │  Ambiguity   │ │  Missing ctx │ │  Scope creep │   │
│  │              │ │              │ │              │   │
│  │  [Select]    │ │  [Select]    │ │  [Select]    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  Or blend manually:  [editable text area with selected] │
│                                                         │
│  [ Save to Library ]                                    │
└─────────────────────────────────────────────────────────┘
        ↓ Save → Profile updates, toast confirms
```

**Data flow:**
```
Frontend → anna.tools.invoke('mirror-prompt-analyzer', 'analyze_prompt', {prompt, bad_output})
         → prompt_analyzer_plugin.py → Claude API
         → Returns: {failure_type, assumptions[], rewrites[3], predicted_outputs[3]}
         → Frontend renders step by step
         → User selects → anna.storage.set('mirror:sessions:prompt:{uuid}', session)
         → anna.storage.set('mirror:profile:prompt_dna', updatedDNA)
```

---

## 4. Mode B — Devil's Advocate: Full Flow

```
┌─────────────────────────────────────────────────────────┐
│  DEVIL'S ADVOCATE                         Past: 8 calls │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Describe your decision:                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [textarea — what are you deciding?]            │   │
│  │  e.g. "I'm switching from React to Vue for     │   │
│  │  our 50k user app because Vue is simpler"      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [ Challenge Me ]                                       │
└─────────────────────────────────────────────────────────┘
        ↓ User clicks Challenge Me
┌─────────────────────────────────────────────────────────┐
│  Building your case against you...                      │
│                                                         │
│  ◉ Steelmanning the opposition...      [pulsing dot]    │
│  ○ Finding your blind spots...                         │
│  ○ Matching historical failures...                     │
│  ○ Stress-testing worst case...                        │
│  ○ Generating counter-questions...                     │
└─────────────────────────────────────────────────────────┘
        ↓ Challenges reveal one by one (staggered animation)
┌─────────────────────────────────────────────────────────┐
│  CHALLENGES  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  ⚔  STRONGEST OPPOSITION                       │    │
│  │  "Vue's ecosystem is 4x smaller. At 50k users, │    │
│  │   you'll hit edge cases with no community      │    │
│  │   answers. Migration cost alone is 3-6 months."│    │
│  │                     [✓ Valid] [~ Overblown] [✗] │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  ┌────────────────────────────────────────────────┐    │
│  │  🕳  BLIND SPOT DETECTED                        │    │
│  │  "You said 'simpler' but didn't define for     │    │
│  │   whom. Your team of 8 has 6 React seniors.    │    │
│  │   Simpler for whom exactly?"                   │    │
│  │                     [✓ Valid] [~ Overblown] [✗] │    │
│  └────────────────────────────────────────────────┘    │
│                                                         │
│  [Challenge 3] [Challenge 4] [Challenge 5]...          │
│                                                         │
│  ─── COUNTER-QUESTIONS ─────────────────────────────   │
│  Before deciding, can you answer these?:               │
│  1. What specific React pain point made you consider   │
│     this? Have you tried solving it within React?      │
│  2. Who on your team pushed for this? Why now?         │
│  ...                                                    │
│                                                         │
│  [ Generate Readiness Score ]                           │
└─────────────────────────────────────────────────────────┘
        ↓ User marks all challenges → Score generates
┌─────────────────────────────────────────────────────────┐
│  DECISION READINESS                                     │
│                                                         │
│          ╭─────────────╮                               │
│         ╱               ╲                              │
│        │      62%         │                            │
│        │    READY         │                            │
│         ╲               ╱                              │
│          ╰─────────────╯                               │
│                                                         │
│  ✓ 2 challenges valid — you acknowledged real risks     │
│  ~ 1 challenge overblown — good skepticism              │
│  ✗ 2 challenges not addressed — gaps remain             │
│                                                         │
│  Strongest unaddressed risk: Team expertise gap         │
│                                                         │
│  [ Save Decision ]  [ Reconsider ]                      │
└─────────────────────────────────────────────────────────┘
```

**Data flow:**
```
Frontend → anna.tools.invoke('mirror-decision-critic', 'challenge_decision', {decision})
         → decision_critic_plugin.py → Claude API (5 sequential calls, streamed back)
         → Returns: {opposition, blind_spots[], historical_matches[], stress_test, counter_questions[]}
         → User marks each → readiness_score calculated
         → anna.storage.set('mirror:sessions:decision:{uuid}', session)
         → anna.storage.set('mirror:profile:decision_map', updatedMap)
```

---

## 5. Mode C — Agent Babysitter: Full Flow

```
┌─────────────────────────────────────────────────────────┐
│  AGENT BABYSITTER                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  What task is your agent running?                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [textarea — describe the multi-step task]      │   │
│  │  e.g. "Research 10 competitors, summarize       │   │
│  │   each, write comparison report, email it"      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [ Define Checkpoints ]                                 │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│  CHECKPOINT PLAN                                        │
│                                                         │
│  Step 1: Research 10 competitors    [LOW RISK] ✓       │
│  Step 2: Summarize each             [LOW RISK] ✓       │
│  Step 3: Write comparison report    [MED RISK] ⚠       │
│  Step 4: Send email                 [HIGH RISK] 🔒      │
│                    ← IRREVERSIBLE — will require        │
│                      approval before executing          │
│                                                         │
│  [ Approve Plan & Start Monitoring ]                    │
└─────────────────────────────────────────────────────────┘
        ↓ User starts agent externally, logs steps here
┌─────────────────────────────────────────────────────────┐
│  LIVE MONITOR                              Step 2 of 4  │
│                                                         │
│  Log step output:                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [paste agent output for this step]             │   │
│  └─────────────────────────────────────────────────┘   │
│  [ Submit Step ]                                        │
│                                                         │
│  STATUS: ● COHERENT  — No drift detected               │
│  Confidence: ████████░░ 82%                             │
│                                                         │
│  Step history:                                          │
│  Step 1 ✓ Coherent — 94% confidence                   │
│  Step 2 ✓ Coherent — 82% confidence                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
        ↓ On irreversible action (Step 4)
┌─────────────────────────────────────────────────────────┐
│  ⛔ IRREVERSIBLE ACTION DETECTED                        │
│                                                         │
│  The agent is about to:                                 │
│  SEND EMAIL to: team@company.com                       │
│  Subject: "Competitor Analysis Q3 2026"                │
│  Body preview: [first 200 chars shown]                  │
│                                                         │
│  This CANNOT be undone.                                 │
│                                                         │
│  [ ✓ Approve & Send ]   [ ✗ Reject & Stop ]            │
│                                                         │
│  Drift check: ● No issues — content matches goal        │
└─────────────────────────────────────────────────────────┘
        ↓ Post-run
┌─────────────────────────────────────────────────────────┐
│  RUN COMPLETE                                           │
│                                                         │
│  4 steps • 1 approval gate • 0 drift events             │
│                                                         │
│  Summary:                                               │
│  The agent researched 10 competitors, produced          │
│  accurate summaries, and sent the comparison report.    │
│  No significant drift detected. Email was sent after    │
│  your manual approval at Step 4.                        │
│                                                         │
│  Pattern saved: "Research → Report → Email" workflow    │
│  classified as LOW RISK for future runs.                │
│                                                         │
│  [ Save to Agent Log ]                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Profile Dashboard Flow

```
┌─────────────────────────────────────────────────────────┐
│  YOUR INTELLIGENCE PROFILE           Updated 2 min ago  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┐  ┌───────────────────────┐   │
│  │  PROMPT DNA          │  │  IMPROVEMENT SCORE    │   │
│  │                      │  │                       │   │
│  │    [bar chart]       │  │     ↑ +18pts          │   │
│  │                      │  │    this week          │   │
│  │  Top failure: Format │  │                       │   │
│  │  Improving: Context  │  │  ████████░░ 78/100    │   │
│  └──────────────────────┘  └───────────────────────┘   │
│                                                         │
│  ┌──────────────────────┐  ┌───────────────────────┐   │
│  │  DECISION MAP        │  │  AGENT LOG            │   │
│  │                      │  │                       │   │
│  │  Most missed:        │  │  12 runs total        │   │
│  │  • Team impact       │  │  3 drift events       │   │
│  │  • Timeline risk     │  │  8 approvals given    │   │
│  │  • Tech debt         │  │                       │   │
│  │                      │  │  Riskiest workflow:   │   │
│  │  8 decisions tracked │  │  "Auto-publish" tasks │   │
│  └──────────────────────┘  └───────────────────────┘   │
│                                                         │
│  ── RECENT SESSIONS ────────────────────────────────── │
│  [Prompt] Format ambiguity fix     • 2h ago    [View]  │
│  [Decision] Tech stack change      • 1d ago    [View]  │
│  [Agent] Research + report run     • 2d ago    [View]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. State Transitions

```
App States:
IDLE → ANALYZING → REVIEWING → SAVED → IDLE

IDLE:        Input forms ready, no analysis running
ANALYZING:   Executa called, steps revealing, UI locked
REVIEWING:   Analysis complete, human review gates active
SAVED:       Session saved to profile, ready for new input
ERROR:       Analysis failed, retry button shown
```

---

## 8. Cross-Mode Profile Update Logic

After every session save:
```
PromptArchaeology session saved
  → Read mirror:profile:prompt_dna
  → Add failure_type to frequency map
  → Add fix_applied to success patterns
  → Increment session count
  → Write updated prompt_dna back to APS

DevilsAdvocate session saved
  → Read mirror:profile:decision_map
  → Add blind_spots marked as [Valid] to pattern list
  → Record decision_type + readiness_score
  → Write updated decision_map back to APS

AgentBabysitter session saved
  → Read mirror:profile:agent_log
  → Add workflow_pattern with risk classification
  → Record approval/rejection decisions
  → Write updated agent_log back to APS

ALL saves:
  → Recalculate global improvement_score
  → Write to mirror:profile:improvement_score
```
