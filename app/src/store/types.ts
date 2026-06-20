// ─────────────────────────────────────────────
// MIRROR — TypeScript Types
// Single source of truth. All types from SCHEMA.md.
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

export type ModeType = 'archaeology' | 'advocate' | 'babysitter' | 'learning' | 'profile' | 'genesis' | 'doc-brutalist';

export type DecisionType =
  | 'technical' | 'career' | 'business' | 'financial' | 'personal' | 'other';

export type BlindSpotCategory =
  | 'team_impact' | 'timeline_risk' | 'tech_debt' | 'cost_underestimate'
  | 'expertise_gap' | 'stakeholder_miss' | 'assumption_unchecked'
  | 'reversibility_ignored' | 'other';

// ── Prompt DNA ──────────────────────────────
export interface FailureFrequency {
  type: FailureType;
  count: number;
  last_seen: string;
}

export interface PromptPattern {
  pattern_description: string;
  frequency: number;
  example_prompt_ids: string[];
}

export interface PromptRecord {
  id: string;
  failure_type: FailureType;
  date: string;
  original_prompt: string;
  final_prompt: string | null;
  saved_to_library: boolean;
}

export interface PromptDNA {
  failure_frequencies: FailureFrequency[];
  successful_patterns: PromptPattern[];
  total_analyzed: number;
  total_saved: number;
  most_common_failure: FailureType | null;
  most_improving: FailureType | null;
  last_updated: string;
  clarity_avg?: number;
  specificity_avg?: number;
  context_avg?: number;
  format_avg?: number;
  consistency_avg?: number;
  prompt_history?: PromptRecord[];
}

export const emptyPromptDNA: PromptDNA = {
  failure_frequencies: [],
  successful_patterns: [],
  total_analyzed: 0,
  total_saved: 0,
  most_common_failure: null,
  most_improving: null,
  last_updated: new Date().toISOString(),
  clarity_avg: 70,
  specificity_avg: 60,
  context_avg: 50,
  format_avg: 40,
  consistency_avg: 80,
  prompt_history: [],
};

// ── Decision Map ─────────────────────────────
export interface BlindSpotRecord {
  category: BlindSpotCategory;
  count: number;
  decision_types: DecisionType[];
  last_seen: string;
}

export interface DecisionRecord {
  id: string;
  decision_type: DecisionType;
  readiness_score: number;
  blind_spots_found: BlindSpotCategory[];
  blind_spots_acknowledged: BlindSpotCategory[];
  date: string;
}

export interface DecisionMap {
  blind_spot_records: BlindSpotRecord[];
  top_blind_spot: BlindSpotCategory | null;
  average_readiness_score: number;
  total_decisions: number;
  decision_history: DecisionRecord[];
  last_updated: string;
}

export const emptyDecisionMap: DecisionMap = {
  blind_spot_records: [],
  top_blind_spot: null,
  average_readiness_score: 0,
  total_decisions: 0,
  decision_history: [],
  last_updated: new Date().toISOString(),
};

// ── Agent Log ────────────────────────────────
export interface WorkflowPattern {
  id: string;
  description: string;
  risk_classification: RiskLevel;
  drift_events_count: number;
  approval_rate: number;
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
  riskiest_workflow: string | null;
  run_history: AgentRunRecord[];
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
  last_updated: new Date().toISOString(),
};

// ── Improvement Score ────────────────────────
export interface ImprovementScore {
  current: number;
  previous_week: number;
  delta: number;
  breakdown: {
    prompt_score: number;
    decision_score: number;
    agent_score: number;
  };
  history: { date: string; score: number }[];
  last_calculated: string;
}

// ── Prompt Session ───────────────────────────
export interface PromptRewrite {
  id: 'A' | 'B' | 'C';
  strategy: string;
  fixes: string[];
  rewritten_prompt: string;
  predicted_output: string;
}

export interface PromptAssumption {
  assumption: string;
  reality: string;
  impact: string;
}

export interface PromptSession {
  id: string;
  date: string;
  original_prompt: string;
  bad_output: string;
  failure_type: FailureType;
  failure_explanation: string;
  integrity_score?: number;
  sub_scores?: {
    clarity: number;
    specificity: number;
    context: number;
    format_guidance: number;
  };
  diagnosis_summary?: string;
  assumptions: PromptAssumption[];
  rewrites: PromptRewrite[];
  diagnosis_confirmed: boolean;
  selected_rewrite: 'A' | 'B' | 'C' | 'blend' | null;
  final_prompt: string | null;
  saved_to_library: boolean;
  pattern_warning?: string | null;
}

// ── Decision Session ─────────────────────────
export interface Challenge {
  id: string;
  type: 'opposition' | 'blind_spot' | 'historical' | 'stress_test' | 'counter_question';
  title: string;
  content: string;
  mark: ReviewMark;
  blind_spot_category?: BlindSpotCategory | null;
}

export interface DecisionSession {
  id: string;
  date: string;
  decision_text: string;
  decision_type: DecisionType;
  challenges: Challenge[];
  counter_questions: string[];
  readiness_score: number;
  score_breakdown: {
    valid_count: number;
    overblown_count: number;
    not_applicable_count: number;
  };
  saved: boolean;
  outcome?: string;
}

// ── Agent Session ────────────────────────────
export type StepStatus =
  | 'pending' | 'coherent' | 'drifting'
  | 'irreversible_detected' | 'approved' | 'rejected';

export interface AgentStep {
  step_number: number;
  description: string;
  risk_level: RiskLevel;
  output_logged?: string;
  status: StepStatus;
  confidence_score?: number;
  drift_reason?: string;
  irreversible_action?: string;
  approval_decision?: 'approved' | 'rejected';
  timestamp?: string;
}

export interface AgentSession {
  id: string;
  date: string;
  task_description: string;
  steps: AgentStep[];
  checkpoint_plan_approved: boolean;
  run_complete: boolean;
  plain_summary?: string;
  drift_events: number;
  irreversible_count: number;
  approved_count: number;
  rejected_count: number;
  workflow_pattern_id?: string;
}

// ── Prompt Library ───────────────────────────
export interface LibraryPrompt {
  id: string;
  date_saved: string;
  original_prompt: string;
  final_prompt: string;
  failure_type_fixed: FailureType;
  rewrite_strategy: string;
  session_id: string;
  tags: string[];
  use_count: number;
}

export interface PromptLibrary {
  prompts: LibraryPrompt[];
  total: number;
}

// ── Learning Progress ────────────────────────
export interface StudyTopic {
  title: string;
  known: boolean;
  key: string;
}

export interface StudyWeek {
  week: number;
  title: string;
  topics: StudyTopic[];
}

export interface LearningProgress {
  topic: string;
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced' | '';
  current_week: number;
  completed_topics: string[];
  assessment_scores: Record<string, number>;
  knowledge_gaps: string[];
  curriculum?: StudyWeek[];
  last_updated: string;
}

export const emptyLearningProgress: LearningProgress = {
  topic: '',
  goal: '',
  level: '',
  current_week: 1,
  completed_topics: [],
  assessment_scores: {},
  knowledge_gaps: [],
  last_updated: new Date().toISOString(),
};

// ── Profile ──────────────────────────────────
export interface MirrorProfile {
  prompt_dna: PromptDNA;
  decision_map: DecisionMap;
  agent_log: AgentLog;
  improvement_score: ImprovementScore | null;
  learning_progress?: LearningProgress;
}

// ── App State ────────────────────────────────
export interface AppState {
  profile: MirrorProfile;
  profileLoaded: boolean;
  currentPromptSession: Partial<PromptSession> | null;
  currentDecisionSession: Partial<DecisionSession> | null;
  currentAgentSession: Partial<AgentSession> | null;
  currentLearningSession: Partial<LearningProgress> | null;
  currentGenesisSession: Partial<GenesisSession> | null;
  currentBrutalistSession: Partial<BrutalistSession> | null;
  activeMode: ModeType;
  isAnalyzing: boolean;
  analysisStep: number;
  error: string | null;
  promptLibrary: PromptLibrary;
  sessionCount: number;
  lastActive: string;
}

// ── Executa return schemas ───────────────────
export interface AnalyzePromptResult {
  failure_type: FailureType;
  failure_explanation: string;
  integrity_score?: number;
  sub_scores?: {
    clarity: number;
    specificity: number;
    context: number;
    format_guidance: number;
  };
  diagnosis_summary?: string;
  assumptions: PromptAssumption[];
  rewrites: PromptRewrite[];
  pattern_warning?: string | null;
  error?: string;
}

// ── Learning Path schemas ────────────────────
export interface GenerateQuestionsResult {
  questions: string[];
  error?: string;
}

export interface AssessBaselineResult {
  level: 'beginner' | 'intermediate' | 'advanced';
  what_they_know: string[];
  what_they_dont_know: string[];
  error?: string;
}

export interface GenerateCurriculumResult {
  level: string;
  goal: string;
  estimated_time: string;
  weeks: StudyWeek[];
  error?: string;
}

export interface EvaluateCheckpointResult {
  evaluation: 'correct' | 'partial' | 'incorrect';
  explanation: string;
  what_to_review: string;
  error?: string;
}

export interface ChallengeDecisionResult {
  decision_type: DecisionType;
  challenges: {
    id: string;
    type: 'opposition' | 'blind_spot' | 'historical' | 'stress_test';
    title: string;
    content: string;
    blind_spot_category?: BlindSpotCategory | null;
  }[];
  counter_questions: string[];
  error?: string;
}

export interface AnalyzeWorkflowResult {
  steps: {
    step_number: number;
    description: string;
    risk_level: RiskLevel;
    risk_reason: string;
    is_irreversible: boolean;
    irreversible_action?: string | null;
  }[];
  error?: string;
}

export interface AssessStepResult {
  status: 'coherent' | 'drifting' | 'irreversible_detected';
  confidence_score: number;
  drift_reason?: string | null;
  irreversible_action?: string | null;
  assessment_notes?: string;
  error?: string;
}

export interface GenerateSummaryResult {
  summary: string;
  pattern_description: string;
  risk_classification: RiskLevel;
  key_outcomes: string[];
  error?: string;
}

export interface GenesisSession {
  id: string;
  date: string;
  brief: string;
  answers: Record<string, string>;
  spec: {
    product_name: string;
    one_liner: string;
    users: string;
    platform: string;
    core_action: string;
    tech_stack: string[];
    has_backend: boolean;
    has_database: boolean;
    has_ai: boolean;
    ai_details: string;
    out_of_scope: string[];
    done_when: string;
    deployment: string;
    solo_or_team: string;
  } | null;
  documents: Record<string, string> | null;
  product_name: string;
}

// ── Doc Brutalist schemas ───────────────────
export interface Issue {
  id: string;
  type: string;
  location: string;
  problem: string;
  fix: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  drop_off_weight: number;
}

export interface BrutalistSession {
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


