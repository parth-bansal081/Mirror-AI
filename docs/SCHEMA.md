# MIRROR — State Schema
**Version:** 1.0.0  
**Storage:** Anna APS (App Persistent Storage) via `window.anna.storage`

---

## 1. Storage Key Naming Convention

```
mirror:{domain}:{entity}:{id?}

Examples:
  mirror:profile:prompt_dna
  mirror:profile:decision_map
  mirror:profile:agent_log
  mirror:profile:improvement_score
  mirror:sessions:prompt:abc123
  mirror:sessions:decision:def456
  mirror:sessions:agent:ghi789
  mirror:library:prompts
  mirror:meta:session_count
  mirror:meta:last_active
```

---

## 2. TypeScript Types (store/types.ts)

```typescript
// ─────────────────────────────────────────────
// CORE PROFILE TYPES
// ─────────────────────────────────────────────

export type FailureType =
  | 'ambiguity'
  | 'missing_context'
  | 'conflicting_instructions'
  | 'wrong_format'
  | 'scope_too_broad'
  | 'scope_too_narrow'
  | 'no_examples'
  | 'unknown';

export type ReviewMark = 'valid' | 'overblown' | 'not_applicable' | 'unreviewed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'irreversible';

export type ModeType = 'archaeology' | 'advocate' | 'babysitter';

// ─────────────────────────────────────────────
// PROMPT DNA — tracks prompting failure patterns
// ─────────────────────────────────────────────

export interface FailureFrequency {
  type: FailureType;
  count: number;
  last_seen: string; // ISO date
}

export interface PromptPattern {
  pattern_description: string;
  frequency: number;
  example_prompt_ids: string[]; // references to session IDs
}

export interface PromptDNA {
  failure_frequencies: FailureFrequency[];  // ordered by count desc
  successful_patterns: PromptPattern[];     // what works for this user
  total_analyzed: number;
  total_saved: number;
  most_common_failure: FailureType | null;
  most_improving: FailureType | null;       // failure type with declining count
  last_updated: string;                     // ISO date
}

// Default empty PromptDNA
export const emptyPromptDNA: PromptDNA = {
  failure_frequencies: [],
  successful_patterns: [],
  total_analyzed: 0,
  total_saved: 0,
  most_common_failure: null,
  most_improving: null,
  last_updated: new Date().toISOString()
};

// ─────────────────────────────────────────────
// DECISION MAP — tracks decision blind spots
// ─────────────────────────────────────────────

export type DecisionType =
  | 'technical'    // tech stack, architecture
  | 'career'       // job, team, role
  | 'business'     // product, strategy
  | 'financial'    // investment, spending
  | 'personal'     // life choices
  | 'other';

export type BlindSpotCategory =
  | 'team_impact'
  | 'timeline_risk'
  | 'tech_debt'
  | 'cost_underestimate'
  | 'expertise_gap'
  | 'stakeholder_miss'
  | 'assumption_unchecked'
  | 'reversibility_ignored'
  | 'other';

export interface BlindSpotRecord {
  category: BlindSpotCategory;
  count: number;                  // how many times this was marked "valid"
  decision_types: DecisionType[]; // which decision types trigger this blind spot
  last_seen: string;
}

export interface DecisionRecord {
  id: string;
  decision_type: DecisionType;
  readiness_score: number;        // 0-100
  blind_spots_found: BlindSpotCategory[];
  blind_spots_acknowledged: BlindSpotCategory[]; // marked valid
  date: string;
}

export interface DecisionMap {
  blind_spot_records: BlindSpotRecord[];  // ordered by count desc
  top_blind_spot: BlindSpotCategory | null;
  average_readiness_score: number;        // rolling average
  total_decisions: number;
  decision_history: DecisionRecord[];     // last 20 decisions
  last_updated: string;
}

export const emptyDecisionMap: DecisionMap = {
  blind_spot_records: [],
  top_blind_spot: null,
  average_readiness_score: 0,
  total_decisions: 0,
  decision_history: [],
  last_updated: new Date().toISOString()
};

// ─────────────────────────────────────────────
// AGENT LOG — tracks workflow patterns
// ─────────────────────────────────────────────

export interface WorkflowPattern {
  id: string;
  description: string;            // e.g. "Research → Report → Email"
  risk_classification: RiskLevel;
  drift_events_count: number;
  approval_rate: number;          // % of irreversible actions approved
  times_run: number;
  last_run: string;
}

export interface AgentRunRecord {
  id: string;
  task_description: string;
  steps_total: number;
  steps_logged: number;
  drift_events: number;
  irreversible_actions: number;
  irreversible_approved: number;
  irreversible_rejected: number;
  completed: boolean;
  date: string;
}

export interface AgentLog {
  workflow_patterns: WorkflowPattern[];
  total_runs: number;
  total_drift_events: number;
  total_approvals: number;
  total_rejections: number;
  riskiest_workflow: string | null;  // workflow pattern description
  run_history: AgentRunRecord[];     // last 20 runs
  last_updated: string;
}

export const emptyAgentLog: AgentLog = {
  workflow_patterns: [],
  total_runs: 0,
  total_drift_events: 0,
  total_approvals: 0,
  total_rejections: 0,
  riskiest_workflow: null,
  run_history: [],
  last_updated: new Date().toISOString()
};

// ─────────────────────────────────────────────
// IMPROVEMENT SCORE
// ─────────────────────────────────────────────

export interface ImprovementScore {
  current: number;        // 0-100
  previous_week: number;  // for delta calculation
  delta: number;          // current - previous_week
  breakdown: {
    prompt_score: number;   // 0-100 based on failure frequency declining
    decision_score: number; // 0-100 based on readiness score improving
    agent_score: number;    // 0-100 based on drift events declining
  };
  history: { date: string; score: number }[]; // daily for last 30 days
  last_calculated: string;
}

// ─────────────────────────────────────────────
// SESSION TYPES
// ─────────────────────────────────────────────

// --- Prompt Session ---
export interface PromptRewrite {
  id: 'A' | 'B' | 'C';
  strategy: string;         // e.g. "Format-first"
  fixes: string[];          // what this rewrite addresses
  rewritten_prompt: string;
  predicted_output: string;
}

export interface PromptSession {
  id: string;               // uuid
  date: string;             // ISO
  original_prompt: string;
  bad_output: string;
  
  // Analysis results
  failure_type: FailureType;
  failure_explanation: string;
  assumptions: string[];    // what AI incorrectly assumed
  
  // Rewrites
  rewrites: PromptRewrite[];
  
  // User decisions
  diagnosis_confirmed: boolean;
  selected_rewrite: 'A' | 'B' | 'C' | 'blend' | null;
  final_prompt: string | null;  // the one they saved
  
  // Status
  saved_to_library: boolean;
}

// --- Decision Session ---
export interface Challenge {
  id: string;
  type: 'opposition' | 'blind_spot' | 'historical' | 'stress_test' | 'counter_question';
  title: string;
  content: string;
  mark: ReviewMark;
  blind_spot_category?: BlindSpotCategory;
}

export interface DecisionSession {
  id: string;               // uuid
  date: string;             // ISO
  decision_text: string;
  decision_type: DecisionType;
  
  // Analysis results
  challenges: Challenge[];
  counter_questions: string[];
  
  // User decisions
  readiness_score: number;  // calculated from marks
  score_breakdown: {
    valid_count: number;
    overblown_count: number;
    not_applicable_count: number;
  };
  
  // Status
  saved: boolean;
  outcome?: string;         // optional: user can note what they decided
}

// --- Agent Session ---
export type StepStatus = 'pending' | 'coherent' | 'drifting' | 'irreversible_detected' | 'approved' | 'rejected';

export interface AgentStep {
  step_number: number;
  description: string;
  risk_level: RiskLevel;
  output_logged?: string;
  status: StepStatus;
  confidence_score?: number;  // 0-100 from drift analysis
  drift_reason?: string;
  irreversible_action?: string;
  approval_decision?: 'approved' | 'rejected';
  timestamp?: string;
}

export interface AgentSession {
  id: string;               // uuid
  date: string;             // ISO
  task_description: string;
  
  // Checkpoint plan
  steps: AgentStep[];
  checkpoint_plan_approved: boolean;
  
  // Run data
  run_complete: boolean;
  plain_summary?: string;
  
  // Aggregates
  drift_events: number;
  irreversible_count: number;
  approved_count: number;
  rejected_count: number;
  
  // Pattern
  workflow_pattern_id?: string;  // references WorkflowPattern.id if matched
}

// ─────────────────────────────────────────────
// PROMPT LIBRARY
// ─────────────────────────────────────────────

export interface LibraryPrompt {
  id: string;
  date_saved: string;
  original_prompt: string;
  final_prompt: string;       // the improved version
  failure_type_fixed: FailureType;
  rewrite_strategy: string;
  session_id: string;         // reference to PromptSession
  tags: string[];             // user can tag prompts
  use_count: number;          // how many times user copied/used it
}

export interface PromptLibrary {
  prompts: LibraryPrompt[];
  total: number;
}

// ─────────────────────────────────────────────
// FULL APP STATE (Zustand store)
// ─────────────────────────────────────────────

export interface MirrorProfile {
  prompt_dna: PromptDNA;
  decision_map: DecisionMap;
  agent_log: AgentLog;
  improvement_score: ImprovementScore | null;
}

export interface AppState {
  // Profile
  profile: MirrorProfile;
  profileLoaded: boolean;

  // Current session (cleared on mode change)
  currentPromptSession: Partial<PromptSession> | null;
  currentDecisionSession: Partial<DecisionSession> | null;
  currentAgentSession: Partial<AgentSession> | null;

  // UI state
  activeMode: ModeType | 'profile';
  isAnalyzing: boolean;
  analysisStep: number;        // which step is currently revealing (0-indexed)
  error: string | null;

  // Library
  promptLibrary: PromptLibrary;

  // Meta
  sessionCount: number;
  lastActive: string;
}
```

---

## 3. APS Read/Write Operations

```typescript
// useProfile.ts — all APS interactions

const APS_KEYS = {
  PROMPT_DNA:        'mirror:profile:prompt_dna',
  DECISION_MAP:      'mirror:profile:decision_map',
  AGENT_LOG:         'mirror:profile:agent_log',
  IMPROVEMENT_SCORE: 'mirror:profile:improvement_score',
  PROMPT_LIBRARY:    'mirror:library:prompts',
  SESSION_COUNT:     'mirror:meta:session_count',
  LAST_ACTIVE:       'mirror:meta:last_active',
  SESSION_PREFIX:    'mirror:sessions:',
} as const;

// Load full profile on app start
export async function loadProfile(): Promise<MirrorProfile> {
  const anna = window.anna;
  
  const [dna, map, log, score] = await Promise.all([
    anna.storage.get(APS_KEYS.PROMPT_DNA),
    anna.storage.get(APS_KEYS.DECISION_MAP),
    anna.storage.get(APS_KEYS.AGENT_LOG),
    anna.storage.get(APS_KEYS.IMPROVEMENT_SCORE),
  ]);

  return {
    prompt_dna:        dna ? JSON.parse(dna) : emptyPromptDNA,
    decision_map:      map ? JSON.parse(map) : emptyDecisionMap,
    agent_log:         log ? JSON.parse(log) : emptyAgentLog,
    improvement_score: score ? JSON.parse(score) : null,
  };
}

// Save a prompt session and update DNA
export async function savePromptSession(session: PromptSession, profile: MirrorProfile): Promise<MirrorProfile> {
  const anna = window.anna;
  const sessionKey = `${APS_KEYS.SESSION_PREFIX}prompt:${session.id}`;

  // Update DNA
  const updatedDNA = updatePromptDNA(profile.prompt_dna, session);

  await Promise.all([
    anna.storage.set(sessionKey, JSON.stringify(session)),
    anna.storage.set(APS_KEYS.PROMPT_DNA, JSON.stringify(updatedDNA)),
  ]);

  return { ...profile, prompt_dna: updatedDNA };
}

// Save a decision session and update Decision Map
export async function saveDecisionSession(session: DecisionSession, profile: MirrorProfile): Promise<MirrorProfile> {
  const anna = window.anna;
  const sessionKey = `${APS_KEYS.SESSION_PREFIX}decision:${session.id}`;
  
  const updatedMap = updateDecisionMap(profile.decision_map, session);

  await Promise.all([
    anna.storage.set(sessionKey, JSON.stringify(session)),
    anna.storage.set(APS_KEYS.DECISION_MAP, JSON.stringify(updatedMap)),
  ]);

  return { ...profile, decision_map: updatedMap };
}

// Save a library prompt
export async function saveToLibrary(prompt: LibraryPrompt, library: PromptLibrary): Promise<PromptLibrary> {
  const updatedLibrary: PromptLibrary = {
    prompts: [prompt, ...library.prompts],
    total: library.total + 1,
  };
  await window.anna.storage.set(APS_KEYS.PROMPT_LIBRARY, JSON.stringify(updatedLibrary));
  return updatedLibrary;
}
```

---

## 4. Profile Update Algorithms

```typescript
// updatePromptDNA — called after each prompt session save
function updatePromptDNA(dna: PromptDNA, session: PromptSession): PromptDNA {
  const existing = dna.failure_frequencies.find(f => f.type === session.failure_type);
  
  let failure_frequencies: FailureFrequency[];
  if (existing) {
    failure_frequencies = dna.failure_frequencies.map(f =>
      f.type === session.failure_type
        ? { ...f, count: f.count + 1, last_seen: session.date }
        : f
    );
  } else {
    failure_frequencies = [
      ...dna.failure_frequencies,
      { type: session.failure_type, count: 1, last_seen: session.date }
    ];
  }

  // Sort by count descending
  failure_frequencies.sort((a, b) => b.count - a.count);

  return {
    ...dna,
    failure_frequencies,
    total_analyzed: dna.total_analyzed + 1,
    total_saved: session.saved_to_library ? dna.total_saved + 1 : dna.total_saved,
    most_common_failure: failure_frequencies[0]?.type ?? null,
    last_updated: new Date().toISOString(),
  };
}

// calculateReadinessScore — from challenge markings
export function calculateReadinessScore(challenges: Challenge[]): number {
  const total = challenges.length;
  if (total === 0) return 0;

  const validCount = challenges.filter(c => c.mark === 'valid').length;
  const overblownCount = challenges.filter(c => c.mark === 'overblown').length;
  const naCount = challenges.filter(c => c.mark === 'not_applicable').length;

  // Valid challenges acknowledged = good (user is aware)
  // Overblown = good (healthy skepticism of criticism)
  // Not applicable = neutral
  // Unreviewed = bad

  const acknowledgedRatio = (validCount + overblownCount + naCount) / total;
  const baseScore = Math.round(acknowledgedRatio * 100);

  // Penalty for each valid challenge (means real risk exists)
  const riskPenalty = validCount * 8;

  return Math.max(0, Math.min(100, baseScore - riskPenalty));
}

// calculateImprovementScore — global score across all modes
export function calculateImprovementScore(profile: MirrorProfile): number {
  const { prompt_dna, decision_map, agent_log } = profile;

  // Prompt score: 100 if no failures, decreases with failure frequency
  const promptScore = prompt_dna.total_analyzed === 0 
    ? 50 
    : Math.max(0, 100 - (prompt_dna.failure_frequencies[0]?.count ?? 0) * 5);

  // Decision score: based on average readiness score
  const decisionScore = decision_map.total_decisions === 0 
    ? 50 
    : decision_map.average_readiness_score;

  // Agent score: based on drift events ratio
  const agentScore = agent_log.total_runs === 0 
    ? 50 
    : Math.max(0, 100 - (agent_log.total_drift_events / Math.max(agent_log.total_runs, 1)) * 20);

  return Math.round((promptScore + decisionScore + agentScore) / 3);
}
```

---

## 5. Executa Return Schemas

### prompt-analyzer → analyze_prompt
```typescript
interface AnalyzePromptResult {
  failure_type: FailureType;
  failure_explanation: string;    // 1-2 sentences plain English
  assumptions: string[];          // 2-4 items, what AI wrongly assumed
  rewrites: {
    id: 'A' | 'B' | 'C';
    strategy: string;             // e.g. "Format-first"
    fixes: string[];              // what this rewrite addresses
    rewritten_prompt: string;
    predicted_output: string;     // what AI would likely return
  }[];
  error?: string;                 // if analysis failed
}
```

### decision-critic → challenge_decision
```typescript
interface ChallengeDecisionResult {
  decision_type: DecisionType;
  challenges: {
    id: string;
    type: 'opposition' | 'blind_spot' | 'historical' | 'stress_test';
    title: string;
    content: string;              // 2-3 sentences
    blind_spot_category?: BlindSpotCategory;
  }[];
  counter_questions: string[];    // 5 questions
  error?: string;
}
```

### agent-supervisor → analyze_workflow
```typescript
interface AnalyzeWorkflowResult {
  steps: {
    step_number: number;
    description: string;
    risk_level: RiskLevel;
    risk_reason: string;
    is_irreversible: boolean;
    irreversible_action?: string;
  }[];
  error?: string;
}

interface AssessStepResult {
  status: 'coherent' | 'drifting' | 'irreversible_detected';
  confidence_score: number;       // 0-100
  drift_reason?: string;
  irreversible_action?: string;
  error?: string;
}

interface GenerateSummaryResult {
  summary: string;                // 3-5 sentences plain English
  pattern_description: string;   // e.g. "Research → Report → Email"
  risk_classification: RiskLevel;
  error?: string;
}
```
