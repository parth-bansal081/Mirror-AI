/**
 * usePromptAnalysis — hook for the Prompt Archaeology mode.
 * Calls mirror-prompt-analyzer executa, updates Zustand store,
 * handles profile save and prompt library.
 */
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { invokeAnna, TOOLS, storageSet } from './useAnna';
import { APS_KEYS, savePromptSession, saveToLibrary } from './useProfile';
import { useProfileStore } from '../store/profileStore';
import {
  AnalyzePromptResult,
  PromptSession,
  LibraryPrompt,
  FailureType,
} from '../store/types';

const ANALYSIS_STEPS = [
  { id: 'diagnose',  label: 'Diagnosing failure type…' },
  { id: 'assume',    label: 'Identifying AI assumptions…' },
  { id: 'rewrite',   label: 'Generating rewrites…' },
  { id: 'predict',   label: 'Predicting outputs…' },
];

export function usePromptAnalysis() {
  const {
    profile,
    setProfile,
    promptLibrary,
    setPromptLibrary,
    setIsAnalyzing,
    setAnalysisStep,
    setError,
    incrementSessionCount,
    currentPromptSession,
    setCurrentPromptSession,
  } = useProfileStore();

  const [analysisSteps] = useState(ANALYSIS_STEPS);

  const analyze = useCallback(async (prompt: string, badOutput: string) => {
    if (!prompt.trim() || !badOutput.trim()) {
      setError('Please fill in both the prompt and the bad output.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setError(null);
    setCurrentPromptSession({ original_prompt: prompt, bad_output: badOutput });

    // Simulate step-by-step progress while Gemini processes
    const stepInterval = setInterval(() => {
      const current = useProfileStore.getState().analysisStep;
      if (current < 3) {
        setAnalysisStep(current + 1);
      }
    }, 2200);

    try {
      const result = await invokeAnna<AnalyzePromptResult>(
        TOOLS.PROMPT_ANALYZER,
        'analyze_prompt',
        { prompt, bad_output: badOutput }
      );

      clearInterval(stepInterval);
      setAnalysisStep(4); // All steps complete

      if (result.error) {
        throw new Error(result.error);
      }

      console.log('[usePromptAnalysis] analyze_prompt executa response:', result);

      const session: Partial<PromptSession> = {
        id: uuidv4(),
        date: new Date().toISOString(),
        original_prompt: prompt,
        bad_output: badOutput,
        failure_type: result.failure_type as FailureType,
        failure_explanation: result.failure_explanation,
        integrity_score: result.integrity_score,
        sub_scores: result.sub_scores,
        diagnosis_summary: result.diagnosis_summary,
        assumptions: result.assumptions,
        rewrites: result.rewrites,
        diagnosis_confirmed: false,
        selected_rewrite: null,
        final_prompt: null,
        saved_to_library: false,
        pattern_warning: result.pattern_warning,
      };

      setCurrentPromptSession(session);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setIsAnalyzing, setAnalysisStep, setError, setCurrentPromptSession]);

  const confirmDiagnosis = useCallback((confirmed: boolean) => {
    const latestSession = useProfileStore.getState().currentPromptSession;
    if (latestSession) {
      setCurrentPromptSession({ ...latestSession, diagnosis_confirmed: confirmed });
    }
  }, [setCurrentPromptSession]);

  const selectRewrite = useCallback((id: 'A' | 'B' | 'C' | 'blend', text: string) => {
    const latestSession = useProfileStore.getState().currentPromptSession;
    if (latestSession) {
      setCurrentPromptSession({
        ...latestSession,
        selected_rewrite: id,
        final_prompt: text,
      });
    }
  }, [setCurrentPromptSession]);

  const saveSession = useCallback(async () => {
    const latestSession = useProfileStore.getState().currentPromptSession;
    if (!latestSession?.id || !latestSession.failure_type) return;

    try {
      const session = latestSession as PromptSession;
      session.saved_to_library = !!session.final_prompt;

      const latestProfile = useProfileStore.getState().profile;
      const updatedProfile = await savePromptSession(session, latestProfile);
      setProfile(updatedProfile);

      // Save to library if a rewrite was chosen
      if (session.final_prompt && session.selected_rewrite && session.selected_rewrite !== 'blend') {
        const rewrite = session.rewrites?.find((r) => r.id === session.selected_rewrite);
        if (rewrite) {
          const libraryPrompt: LibraryPrompt = {
            id: uuidv4(),
            date_saved: session.date,
            original_prompt: session.original_prompt,
            final_prompt: session.final_prompt,
            failure_type_fixed: session.failure_type,
            rewrite_strategy: rewrite.strategy,
            session_id: session.id,
            tags: [],
            use_count: 0,
          };
          const latestLibrary = useProfileStore.getState().promptLibrary;
          const updatedLibrary = await saveToLibrary(libraryPrompt, latestLibrary);
          setPromptLibrary(updatedLibrary);
        }
      }

      // Update session count
      const newCount = useProfileStore.getState().sessionCount + 1;
      await storageSet(APS_KEYS.SESSION_COUNT, String(newCount));
      incrementSessionCount();

      return true;
    } catch (err) {
      setError('Failed to save session. Please try again.');
      return false;
    }
  }, [setProfile, setPromptLibrary, setError, incrementSessionCount]);

  const reset = useCallback(() => {
    setCurrentPromptSession(null);
    setAnalysisStep(0);
    setError(null);
    setIsAnalyzing(false);
  }, [setCurrentPromptSession, setAnalysisStep, setError, setIsAnalyzing]);

  return {
    analysisSteps,
    session: currentPromptSession,
    analyze,
    confirmDiagnosis,
    selectRewrite,
    saveSession,
    reset,
  };
}
