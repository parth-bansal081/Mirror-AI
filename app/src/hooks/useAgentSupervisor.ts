/**
 * useAgentSupervisor — hook for Agent Babysitter mode.
 */
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { invokeAnna, TOOLS, storageSet } from './useAnna';
import { APS_KEYS, saveAgentSession } from './useProfile';
import { useProfileStore } from '../store/profileStore';
import {
  AnalyzeWorkflowResult,
  AssessStepResult,
  GenerateSummaryResult,
  AgentSession,
  AgentStep,
  StepStatus,
} from '../store/types';

const PLAN_STEPS = [
  { id: 'parse',    label: 'Parsing task into steps…' },
  { id: 'classify', label: 'Classifying risk levels…' },
  { id: 'gate',     label: 'Flagging irreversible actions…' },
];

export function useAgentSupervisor() {
  const {
    profile,
    setProfile,
    setIsAnalyzing,
    setAnalysisStep,
    setError,
    incrementSessionCount,
    currentAgentSession,
    setCurrentAgentSession,
  } = useProfileStore();

  const [planSteps] = useState(PLAN_STEPS);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // ── Phase 1: Analyze workflow ─────────────────────────────
  const analyzeWorkflow = useCallback(async (taskDescription: string) => {
    if (!taskDescription.trim()) {
      setError('Please describe the agent task first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setError(null);

    const stepInterval = setInterval(() => {
      const current = useProfileStore.getState().analysisStep;
      if (current < 2) {
        setAnalysisStep(current + 1);
      }
    }, 1500);

    try {
      const result = await invokeAnna<AnalyzeWorkflowResult>(
        TOOLS.AGENT_SUPERVISOR,
        'analyze_workflow',
        { task_description: taskDescription }
      );

      clearInterval(stepInterval);
      setAnalysisStep(3);

      if (result.error) throw new Error(result.error);

      const steps: AgentStep[] = result.steps.map((s) => ({
        step_number: s.step_number,
        description: s.description,
        risk_level: s.risk_level,
        status: 'pending' as StepStatus,
        irreversible_action: s.irreversible_action ?? undefined,
      }));

      const session: Partial<AgentSession> = {
        id: uuidv4(),
        date: new Date().toISOString(),
        task_description: taskDescription,
        steps,
        checkpoint_plan_approved: false,
        run_complete: false,
        drift_events: 0,
        irreversible_count: 0,
        approved_count: 0,
        rejected_count: 0,
      };

      setCurrentAgentSession(session);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Workflow analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setIsAnalyzing, setAnalysisStep, setError, setCurrentAgentSession]);

  // ── Phase 2: Approve checkpoint plan ─────────────────────
  const approvePlan = useCallback(() => {
    const session = useProfileStore.getState().currentAgentSession;
    if (!session) return;
    setCurrentAgentSession({ ...session, checkpoint_plan_approved: true });
  }, [setCurrentAgentSession]);

  // ── Phase 3: Submit a step output for assessment ─────────
  const assessStep = useCallback(async (
    stepNumber: number,
    stepOutput: string
  ): Promise<AssessStepResult | null> => {
    const session = useProfileStore.getState().currentAgentSession;
    if (!session?.steps) return null;

    const stepDef = session.steps.find((s) => s.step_number === stepNumber);
    if (!stepDef) return null;

    setIsAssessing(true);
    try {
      const previousSteps = session.steps
        .filter((s) => s.step_number < stepNumber && s.output_logged)
        .map((s) => ({ step: s.step_number, output: s.output_logged }));

      const result = await invokeAnna<AssessStepResult>(
        TOOLS.AGENT_SUPERVISOR,
        'assess_step',
        {
          task_description: session.task_description,
          step_number: stepNumber,
          step_description: stepDef.description,
          step_output: stepOutput,
          previous_steps: JSON.stringify(previousSteps),
        }
      );

      if (result.error) throw new Error(result.error);

      // Update the step in session
      const updatedSteps = session.steps.map((s) =>
        s.step_number === stepNumber
          ? {
              ...s,
              output_logged: stepOutput,
              status: result.status as StepStatus,
              confidence_score: result.confidence_score,
              drift_reason: result.drift_reason ?? undefined,
              irreversible_action: result.irreversible_action ?? s.irreversible_action,
              timestamp: new Date().toISOString(),
            }
          : s
      );

      const newDriftEvents = (session.drift_events ?? 0) +
        (result.status === 'drifting' ? 1 : 0);

      setCurrentAgentSession({
        ...session,
        steps: updatedSteps,
        drift_events: newDriftEvents,
      });

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Step assessment failed.');
      return null;
    } finally {
      setIsAssessing(false);
    }
  }, [setIsAssessing, setError, setCurrentAgentSession]);

  // ── Phase 4: Approve/reject irreversible action ───────────
  const resolveIrreversible = useCallback((stepNumber: number, decision: 'approved' | 'rejected') => {
    const session = useProfileStore.getState().currentAgentSession;
    if (!session?.steps) return;

    const updatedSteps = session.steps.map((s) =>
      s.step_number === stepNumber
        ? { ...s, status: decision as StepStatus, approval_decision: decision }
        : s
    );

    setCurrentAgentSession({
      ...session,
      steps: updatedSteps,
      irreversible_count: (session.irreversible_count ?? 0) + 1,
      approved_count: (session.approved_count ?? 0) + (decision === 'approved' ? 1 : 0),
      rejected_count: (session.rejected_count ?? 0) + (decision === 'rejected' ? 1 : 0),
    });
  }, [setCurrentAgentSession]);

  // ── Phase 5: Complete run + generate summary ──────────────
  const completeRun = useCallback(async () => {
    const session = useProfileStore.getState().currentAgentSession;
    if (!session?.steps) return;

    setIsSummarizing(true);
    try {
      const stepsData = session.steps.map((s) => ({
        step: s.step_number,
        description: s.description,
        status: s.status,
        confidence: s.confidence_score,
        drift: s.drift_reason,
      }));

      const result = await invokeAnna<GenerateSummaryResult>(
        TOOLS.AGENT_SUPERVISOR,
        'generate_summary',
        {
          task_description: session.task_description,
          steps_data: JSON.stringify(stepsData),
          drift_events: session.drift_events ?? 0,
          approvals_given: session.approved_count ?? 0,
          rejections: session.rejected_count ?? 0,
        }
      );

      const completedSession: AgentSession = {
        ...(session as AgentSession),
        run_complete: true,
        plain_summary: result.summary,
      };

      setCurrentAgentSession(completedSession);

      // Save to profile
      const updatedProfile = await saveAgentSession(completedSession, profile);
      setProfile(updatedProfile);

      const newCount = useProfileStore.getState().sessionCount + 1;
      await storageSet(APS_KEYS.SESSION_COUNT, String(newCount));
      incrementSessionCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  }, [profile, setProfile, setError, setCurrentAgentSession, incrementSessionCount]);

  const reset = useCallback(() => {
    setCurrentAgentSession(null);
    setAnalysisStep(0);
    setError(null);
    setIsAnalyzing(false);
  }, [setCurrentAgentSession, setAnalysisStep, setError, setIsAnalyzing]);

  return {
    planSteps,
    session: currentAgentSession,
    isAssessing,
    isSummarizing,
    analyzeWorkflow,
    approvePlan,
    assessStep,
    resolveIrreversible,
    completeRun,
    reset,
  };
}
