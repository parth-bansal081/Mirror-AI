/**
 * useProfile — APS read/write + profile update logic.
 * All Anna Persistent Storage operations go through this file.
 */
import { v4 as uuidv4 } from 'uuid';
import {
  MirrorProfile,
  PromptDNA,
  DecisionMap,
  AgentLog,
  PromptSession,
  DecisionSession,
  AgentSession,
  LibraryPrompt,
  PromptLibrary,
  Challenge,
  BlindSpotCategory,
  emptyPromptDNA,
  emptyDecisionMap,
  emptyAgentLog,
  emptyLearningProgress,
  LearningProgress,
  PromptRecord,
  GenesisSession,
  BrutalistSession,
} from '../store/types';
import { storageGet, storageSetJSON, storageGetJSON } from './useAnna';

// ── APS key constants ────────────────────────────────────────
export const APS_KEYS = {
  PROMPT_DNA:        'mirror:profile:prompt_dna',
  DECISION_MAP:      'mirror:profile:decision_map',
  AGENT_LOG:         'mirror:profile:agent_log',
  IMPROVEMENT_SCORE: 'mirror:profile:improvement_score',
  PROMPT_LIBRARY:    'mirror:library:prompts',
  SESSION_COUNT:     'mirror:meta:session_count',
  LAST_ACTIVE:       'mirror:meta:last_active',
  SESSION_PREFIX:    'mirror:sessions:',
  LEARNING_PROGRESS: 'mirror:profile:learning_progress',
  GENESIS_SESSIONS:  'mirror:genesis:sessions',
  BRUTALIST_SESSIONS: 'mirror:brutalist:sessions',
} as const;

// ── Load profile on app start ────────────────────────────────
export async function loadProfile(): Promise<MirrorProfile> {
  const [dna, map, log, score, learning] = await Promise.all([
    storageGetJSON<PromptDNA>(APS_KEYS.PROMPT_DNA, emptyPromptDNA),
    storageGetJSON<DecisionMap>(APS_KEYS.DECISION_MAP, emptyDecisionMap),
    storageGetJSON<AgentLog>(APS_KEYS.AGENT_LOG, emptyAgentLog),
    storageGetJSON<MirrorProfile['improvement_score']>(APS_KEYS.IMPROVEMENT_SCORE, null),
    storageGetJSON<LearningProgress>(APS_KEYS.LEARNING_PROGRESS, emptyLearningProgress),
  ]);
  return {
    prompt_dna: dna,
    decision_map: map,
    agent_log: log,
    improvement_score: score,
    learning_progress: learning,
  };
}

// ── Load prompt library ──────────────────────────────────────
export async function loadPromptLibrary(): Promise<PromptLibrary> {
  return storageGetJSON<PromptLibrary>(APS_KEYS.PROMPT_LIBRARY, { prompts: [], total: 0 });
}

// ── Load session count ───────────────────────────────────────
export async function loadSessionCount(): Promise<number> {
  const raw = await storageGet(APS_KEYS.SESSION_COUNT);
  return raw ? parseInt(raw, 10) : 0;
}

// ── Save prompt session ──────────────────────────────────────
export async function savePromptSession(
  session: PromptSession,
  profile: MirrorProfile
): Promise<MirrorProfile> {
  const sessionKey = `${APS_KEYS.SESSION_PREFIX}prompt:${session.id}`;
  const updatedDNA = updatePromptDNA(profile.prompt_dna, session);

  await Promise.all([
    storageSetJSON(sessionKey, session),
    storageSetJSON(APS_KEYS.PROMPT_DNA, updatedDNA),
  ]);

  return { ...profile, prompt_dna: updatedDNA };
}

// ── Save to prompt library ───────────────────────────────────
export async function saveToLibrary(
  prompt: LibraryPrompt,
  library: PromptLibrary
): Promise<PromptLibrary> {
  const updated: PromptLibrary = {
    prompts: [prompt, ...library.prompts].slice(0, 200),
    total: library.total + 1,
  };
  await storageSetJSON(APS_KEYS.PROMPT_LIBRARY, updated);
  return updated;
}

// ── Save decision session ────────────────────────────────────
export async function saveDecisionSession(
  session: DecisionSession,
  profile: MirrorProfile
): Promise<MirrorProfile> {
  const sessionKey = `${APS_KEYS.SESSION_PREFIX}decision:${session.id}`;
  const updatedMap = updateDecisionMap(profile.decision_map, session);

  await Promise.all([
    storageSetJSON(sessionKey, session),
    storageSetJSON(APS_KEYS.DECISION_MAP, updatedMap),
  ]);

  return { ...profile, decision_map: updatedMap };
}

// ── Save agent session ───────────────────────────────────────
export async function saveAgentSession(
  session: AgentSession,
  profile: MirrorProfile
): Promise<MirrorProfile> {
  const sessionKey = `${APS_KEYS.SESSION_PREFIX}agent:${session.id}`;
  const updatedLog = updateAgentLog(profile.agent_log, session);

  await Promise.all([
    storageSetJSON(sessionKey, session),
    storageSetJSON(APS_KEYS.AGENT_LOG, updatedLog),
  ]);

  return { ...profile, agent_log: updatedLog };
}

// ── Save learning progress ───────────────────────────────────
export async function saveLearningProgress(
  progress: LearningProgress,
  profile: MirrorProfile
): Promise<MirrorProfile> {
  await storageSetJSON(APS_KEYS.LEARNING_PROGRESS, progress);
  return { ...profile, learning_progress: progress };
}

// ── Save/Get Genesis Sessions ────────────────────────────────
export async function loadGenesisSessions(): Promise<GenesisSession[]> {
  return storageGetJSON<GenesisSession[]>(APS_KEYS.GENESIS_SESSIONS, []);
}

export async function saveGenesisSession(
  session: GenesisSession
): Promise<GenesisSession[]> {
  const sessions = await loadGenesisSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  let updated: GenesisSession[];
  if (index >= 0) {
    updated = [...sessions];
    updated[index] = session;
  } else {
    updated = [session, ...sessions];
  }
  await storageSetJSON(APS_KEYS.GENESIS_SESSIONS, updated);
  return updated;
}

// ── Save/Get Brutalist Sessions ──────────────────────────────
export async function loadBrutalistSessions(): Promise<BrutalistSession[]> {
  return storageGetJSON<BrutalistSession[]>(APS_KEYS.BRUTALIST_SESSIONS, []);
}

export async function saveBrutalistSession(
  session: BrutalistSession
): Promise<BrutalistSession[]> {
  const sessions = await loadBrutalistSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  let updated: BrutalistSession[];
  if (index >= 0) {
    updated = [...sessions];
    updated[index] = session;
  } else {
    updated = [session, ...sessions];
  }
  await storageSetJSON(APS_KEYS.BRUTALIST_SESSIONS, updated);
  return updated;
}


// ── Profile update algorithms ────────────────────────────────

function updatePromptDNA(dna: PromptDNA, session: PromptSession): PromptDNA {
  const existing = dna.failure_frequencies.find((f) => f.type === session.failure_type);

  let failure_frequencies = existing
    ? dna.failure_frequencies.map((f) =>
        f.type === session.failure_type
          ? { ...f, count: f.count + 1, last_seen: session.date }
          : f
      )
    : [...dna.failure_frequencies, { type: session.failure_type, count: 1, last_seen: session.date }];

  failure_frequencies.sort((a, b) => b.count - a.count);

  const n = dna.total_analyzed + 1;
  const sub = session.sub_scores ?? { clarity: 60, specificity: 50, context: 40, format_guidance: 30 };
  
  const prevClarity = dna.clarity_avg ?? 70;
  const prevSpec = dna.specificity_avg ?? 60;
  const prevContext = dna.context_avg ?? 50;
  const prevFormat = dna.format_avg ?? 40;
  const prevConsistency = dna.consistency_avg ?? 80;

  const clarity_avg = Math.round((prevClarity * dna.total_analyzed + sub.clarity) / n);
  const specificity_avg = Math.round((prevSpec * dna.total_analyzed + sub.specificity) / n);
  const context_avg = Math.round((prevContext * dna.total_analyzed + sub.context) / n);
  const format_avg = Math.round((prevFormat * dna.total_analyzed + sub.format_guidance) / n);
  const consistency_avg = Math.max(30, Math.round((prevConsistency * dna.total_analyzed + (100 - failure_frequencies.length * 8)) / n));

  const promptRecord: PromptRecord = {
    id: session.id,
    failure_type: session.failure_type,
    date: session.date,
    original_prompt: session.original_prompt,
    final_prompt: session.final_prompt,
    saved_to_library: session.saved_to_library,
  };
  const prompt_history = [promptRecord, ...(dna.prompt_history ?? [])].slice(0, 20);

  return {
    ...dna,
    failure_frequencies,
    total_analyzed: n,
    total_saved: session.saved_to_library ? dna.total_saved + 1 : dna.total_saved,
    most_common_failure: failure_frequencies[0]?.type ?? null,
    last_updated: new Date().toISOString(),
    clarity_avg,
    specificity_avg,
    context_avg,
    format_avg,
    consistency_avg,
    prompt_history,
  };
}

function updateDecisionMap(map: DecisionMap, session: DecisionSession): DecisionMap {
  const validChallenges = session.challenges.filter((c) => c.mark === 'valid');
  const blindSpots = validChallenges
    .filter((c): c is Challenge & { blind_spot_category: BlindSpotCategory } =>
      !!c.blind_spot_category
    )
    .map((c) => c.blind_spot_category);

  // Update blind spot records
  const updatedRecords = [...map.blind_spot_records];
  for (const category of blindSpots) {
    const idx = updatedRecords.findIndex((r) => r.category === category);
    if (idx >= 0) {
      updatedRecords[idx] = {
        ...updatedRecords[idx],
        count: updatedRecords[idx].count + 1,
        last_seen: session.date,
      };
    } else {
      updatedRecords.push({
        category,
        count: 1,
        decision_types: [session.decision_type],
        last_seen: session.date,
      });
    }
  }
  updatedRecords.sort((a, b) => b.count - a.count);

  // Update decision history
  const decisionRecord = {
    id: session.id,
    decision_type: session.decision_type,
    readiness_score: session.readiness_score,
    blind_spots_found: blindSpots,
    blind_spots_acknowledged: blindSpots,
    date: session.date,
  };

  const history = [decisionRecord, ...map.decision_history].slice(0, 20);
  const avgScore = history.length
    ? Math.round(history.reduce((s, r) => s + r.readiness_score, 0) / history.length)
    : 0;

  return {
    ...map,
    blind_spot_records: updatedRecords,
    top_blind_spot: updatedRecords[0]?.category ?? null,
    average_readiness_score: avgScore,
    total_decisions: map.total_decisions + 1,
    decision_history: history,
    last_updated: new Date().toISOString(),
  };
}

function updateAgentLog(log: AgentLog, session: AgentSession): AgentLog {
  const runRecord = {
    id: session.id,
    task_description: session.task_description,
    steps_total: session.steps.length,
    steps_logged: session.steps.filter((s) => s.output_logged).length,
    drift_events: session.drift_events,
    irreversible_actions: session.irreversible_count,
    irreversible_approved: session.approved_count,
    irreversible_rejected: session.rejected_count,
    completed: session.run_complete,
    date: session.date,
  };

  const history = [runRecord, ...log.run_history].slice(0, 20);

  return {
    ...log,
    total_runs: log.total_runs + 1,
    total_drift_events: log.total_drift_events + session.drift_events,
    total_approvals: log.total_approvals + session.approved_count,
    total_rejections: log.total_rejections + session.rejected_count,
    run_history: history,
    last_updated: new Date().toISOString(),
  };
}

// ── Score calculation ────────────────────────────────────────
export function calculateReadinessScore(challenges: Challenge[]): number {
  const total = challenges.length;
  if (total === 0) return 0;

  const validCount = challenges.filter((c) => c.mark === 'valid').length;
  const overblownCount = challenges.filter((c) => c.mark === 'overblown').length;
  const naCount = challenges.filter((c) => c.mark === 'not_applicable').length;

  const acknowledgedRatio = (validCount + overblownCount + naCount) / total;
  const baseScore = Math.round(acknowledgedRatio * 100);
  const riskPenalty = validCount * 8;

  return Math.max(0, Math.min(100, baseScore - riskPenalty));
}

export function calculateImprovementScore(profile: MirrorProfile): number {
  const { prompt_dna, decision_map, agent_log } = profile;

  const promptScore =
    prompt_dna.total_analyzed === 0
      ? 50
      : Math.max(0, 100 - (prompt_dna.failure_frequencies[0]?.count ?? 0) * 5);

  const decisionScore =
    decision_map.total_decisions === 0 ? 50 : decision_map.average_readiness_score;

  const agentScore =
    agent_log.total_runs === 0
      ? 50
      : Math.max(
          0,
          100 - (agent_log.total_drift_events / Math.max(agent_log.total_runs, 1)) * 20
        );

  return Math.round((promptScore + decisionScore + agentScore) / 3);
}

// ── UUID helper (re-exported for modes) ──────────────────────
export { uuidv4 };
