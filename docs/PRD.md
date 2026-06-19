# MIRROR — Product Requirements Document
**Version:** 1.0.0  
**Date:** June 2026  
**Platform:** Anna App (Executa runtime)  
**Hackathon:** Anna AI-Native App Hackathon — DoraHacks #2204

---

## 1. Product Vision

**MIRROR** is a meta-AI operating system — an AI that watches how you use AI and makes you permanently better at it.

Every other AI tool helps you do work. Mirror helps you do *AI* better. It sits alongside your AI usage, diagnoses failures, challenges your thinking, and builds a growing intelligence profile of how *you* specifically think and communicate. The longer you use it, the sharper it gets.

**Tagline:** *"AI that makes your AI better."*

---

## 2. The Problem

Three real, unsolved problems in 2026:

### Problem 1 — Prompt Failure Is Invisible
When an AI gives a bad answer, users have no idea why. Was it the phrasing? Missing context? Conflicting instructions? They tweak randomly and hope. There is no forensic layer. No tool explains *why* a prompt failed and *systematically* fixes it with reasoning shown.

### Problem 2 — AI Is Too Agreeable
Every major AI model is trained to be helpful and agreeable. Stanford research found AI chatbots validate user decisions 49% more than humans would — including dangerous ones. Nobody has built an AI whose *core purpose* is structured disagreement. A Devil's Advocate that pushes back before you commit to something bad.

### Problem 3 — Agent Runs Are a Blackbox Prayer
People run AI agents on long tasks and walk away. In a 10-step agentic workflow with 85% per-step accuracy, only 20% of runs succeed end-to-end. Errors compound silently. The agent stays confident the whole way down. No human-friendly supervision layer exists — only enterprise logging tools that require an engineering degree to read.

---

## 3. Solution — Three Modes, One Brain

Mirror is a single Anna App with three active modes, all sharing one persistent intelligence profile:

### Mode 1: Prompt Archaeology
*"Why did my AI give me that garbage answer?"*

User pastes a failed prompt + the bad output it produced. Mirror runs a forensic 4-step analysis, generates 3 improved rewrites each fixing a different root cause, lets the user pick/blend, and saves the result to their prompt library. Over time, Mirror flags patterns before they fail again.

### Mode 2: Devil's Advocate
*"AI that disagrees with you on purpose."*

User describes a decision — career move, tech stack choice, business idea, investment. Mirror runs a structured adversarial analysis: steelmans the opposing view, finds blind spots, stress-tests worst-case outcomes, generates 5 hard counter-questions. User reviews each challenge, marks valid vs overblown, receives a Decision Readiness Score. Saves to decision pattern history.

### Mode 3: Agent Babysitter
*"Watch this AI while I'm away."*

User describes a multi-step agent task or pastes a workflow. Mirror acts as supervisor: defines checkpoints before the run, monitors for drift, gates every irreversible action (send email, delete file, post content) requiring human approval before proceeding, summarizes progress in plain English every N steps. Builds a library of safe vs unsafe workflow patterns over time.

### The Shared Brain — Intelligence Profile
All three modes read from and write to a single persistent user profile:
- **Prompt DNA** — failure patterns, successful structures, common mistakes
- **Decision Map** — past decisions, blind spot history, readiness patterns
- **Agent Log** — safe/unsafe workflow patterns, approval/rejection history
- **Usage Insights** — time-of-day patterns, improvement trajectory over time

This profile is the product's long-term moat. After 30 sessions, Mirror knows more about how you think than any generic AI tool.

---

## 4. Users

**Primary:** Developers, technical PMs, power AI users — people who use AI daily and feel the pain of bad outputs and unverified decisions.

**Secondary:** Founders, analysts, researchers — anyone making important decisions with AI assistance.

**Not targeting:** Casual AI users, non-technical consumers.

---

## 5. Core User Flows

### Flow A — Prompt Archaeology
1. User navigates to Archaeology mode
2. Pastes failed prompt in left panel
3. Pastes bad output in right panel
4. Clicks "Analyze"
5. Mirror runs 4-step forensic analysis (visible step-by-step)
6. Three rewrite variants appear side by side
7. User clicks thumbs up/down on each challenge found
8. User selects preferred variant or blends manually
9. Clicks "Save to Library" — saved to profile
10. Profile Prompt DNA updates with new failure pattern

### Flow B — Devil's Advocate
1. User navigates to Devil's Advocate mode
2. Types decision in the input field
3. Clicks "Challenge Me"
4. Mirror runs 5-step adversarial analysis (visible progress)
5. Each challenge card appears sequentially
6. User marks each: Valid / Overblown / Not Applicable
7. Decision Readiness Score generates based on markings
8. User clicks "Save Decision" — saved to decision history
9. Profile Decision Map updates

### Flow C — Agent Babysitter
1. User navigates to Babysitter mode
2. Describes agent task in natural language OR pastes workflow steps
3. Clicks "Define Checkpoints"
4. Mirror analyzes and marks which steps are high-risk
5. User approves checkpoint plan
6. User starts agent run (externally)
7. User logs each step's output into Mirror as it completes
8. Mirror assesses each step: safe / drifting / irreversible-action-detected
9. On irreversible action: full-screen approval gate appears
10. User approves or rejects — Mirror logs decision
11. End of run: plain-English summary generated
12. Profile Agent Log updates

### Flow D — Profile Dashboard
1. User navigates to Profile
2. Sees Prompt DNA failure bar chart — failure types by frequency
3. Sees Decision Map — blind spots most often missed
4. Sees Agent Log — safe vs flagged workflow patterns
5. Sees Improvement Score — trajectory over time
6. Can search/filter past sessions by mode, date, outcome

---

## 6. Key Features by Priority

### Must Have (MVP — Hackathon)
- [ ] Prompt Archaeology — full 4-step analysis + 3 rewrites
- [ ] Devil's Advocate — full 5-step adversarial analysis + readiness score
- [ ] Human review gates on all critical outputs
- [ ] Persistent profile storing sessions from both modes
- [ ] Profile dashboard showing patterns from both modes
- [ ] Anna Executa tools wired to Claude API
- [ ] Smooth animated step-by-step analysis reveal UI

### Should Have (Hackathon stretch)
- [ ] Agent Babysitter — checkpoint definition + irreversible action gating
- [ ] Prompt library with search
- [ ] Export session as markdown

### Nice to Have (Post-hackathon)
- [ ] Cross-mode insight generation ("your prompt failures and decision blind spots share a pattern")
- [ ] Chrome extension that intercepts prompts on Claude.ai/ChatGPT
- [ ] Team profiles for shared pattern libraries

---

## 7. Non-Goals
- Mirror is NOT a general AI assistant — it does not answer questions
- Mirror does NOT replace Claude or any AI model
- Mirror does NOT auto-fix anything without human review
- Mirror does NOT connect to external accounts (email, calendar, etc.) in v1

---

## 8. Success Metrics (Hackathon)
- Judges can open and use Mirror without any instructions
- At least 2 full modes demonstrably working end-to-end
- Profile visibly updates after each session
- Demo video under 2 minutes shows the full loop
- Human review gates are used and feel natural, not bureaucratic

---

## 9. Constraints
- Must run inside Anna desktop agent runtime
- React UI bundled as static SPA (Vite, no external CDNs)
- Python Executas for AI processing (Claude API)
- Anna SDK `anna` object initialized before React mounts
- All tool_ids must match exactly across plugin, executa.json, pyproject.toml, and Anna admin
- CSP: script-src 'self' — all JS must be bundled
