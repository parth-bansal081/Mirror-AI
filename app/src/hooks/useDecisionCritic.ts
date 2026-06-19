/**
 * useDecisionCritic — hook for Devil's Advocate mode.
 */
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { invokeAnna, TOOLS, storageSet } from './useAnna';
import { APS_KEYS, saveDecisionSession, calculateReadinessScore } from './useProfile';
import { useProfileStore } from '../store/profileStore';
import {
  ChallengeDecisionResult,
  DecisionSession,
  Challenge,
  ReviewMark,
} from '../store/types';

const ANALYSIS_STEPS = [
  { id: 'steelman',  label: 'Steelmanning the opposition…' },
  { id: 'blindspot', label: 'Finding your blind spots…' },
  { id: 'stress',    label: 'Stress-testing worst case…' },
  { id: 'questions', label: 'Generating counter-questions…' },
  { id: 'score',     label: 'Preparing challenges…' },
];

export function useDecisionCritic() {
  const {
    profile,
    setProfile,
    setIsAnalyzing,
    setAnalysisStep,
    setError,
    incrementSessionCount,
    currentDecisionSession,
    setCurrentDecisionSession,
  } = useProfileStore();

  const [analysisSteps] = useState(ANALYSIS_STEPS);

  const challenge = useCallback(async (decision: string) => {
    if (!decision.trim()) {
      setError('Please describe your decision first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(0);
    setError(null);
    setCurrentDecisionSession({ decision_text: decision });

    const stepInterval = setInterval(() => {
      const current = useProfileStore.getState().analysisStep;
      if (current < 4) {
        setAnalysisStep(current + 1);
      }
    }, 2500);

    try {
      const result = await invokeAnna<ChallengeDecisionResult>(
        TOOLS.DECISION_CRITIC,
        'challenge_decision',
        { decision }
      );

      clearInterval(stepInterval);
      setAnalysisStep(5);

      if (result.error) throw new Error(result.error);

      // Build challenge objects with unreviewed marks
      const challenges: Challenge[] = result.challenges.map((c) => ({
        ...c,
        mark: 'unreviewed' as ReviewMark,
      }));

      const session: Partial<DecisionSession> = {
        id: uuidv4(),
        date: new Date().toISOString(),
        decision_text: decision,
        decision_type: result.decision_type,
        challenges,
        counter_questions: result.counter_questions,
        readiness_score: 0,
        score_breakdown: { valid_count: 0, overblown_count: 0, not_applicable_count: 0 },
        saved: false,
      };

      setCurrentDecisionSession(session);
    } catch (err) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [setIsAnalyzing, setAnalysisStep, setError, setCurrentDecisionSession]);

  const markChallenge = useCallback((challengeId: string, mark: ReviewMark) => {
    const session = useProfileStore.getState().currentDecisionSession;
    if (!session?.challenges) return;

    const updated = session.challenges.map((c) =>
      c.id === challengeId ? { ...c, mark } : c
    );

    const score = calculateReadinessScore(updated);
    const valid_count = updated.filter((c) => c.mark === 'valid').length;
    const overblown_count = updated.filter((c) => c.mark === 'overblown').length;
    const not_applicable_count = updated.filter((c) => c.mark === 'not_applicable').length;

    setCurrentDecisionSession({
      ...session,
      challenges: updated,
      readiness_score: score,
      score_breakdown: { valid_count, overblown_count, not_applicable_count },
    });
  }, [setCurrentDecisionSession]);

  const saveSession = useCallback(async () => {
    const session = useProfileStore.getState().currentDecisionSession;
    if (!session?.id || !session.challenges) return false;

    try {
      const fullSession = session as DecisionSession;
      fullSession.saved = true;

      const updatedProfile = await saveDecisionSession(fullSession, profile);
      setProfile(updatedProfile);

      const newCount = useProfileStore.getState().sessionCount + 1;
      await storageSet(APS_KEYS.SESSION_COUNT, String(newCount));
      incrementSessionCount();

      return true;
    } catch (err) {
      setError('Failed to save session.');
      return false;
    }
  }, [profile, setProfile, setError, incrementSessionCount]);

  const reset = useCallback(() => {
    setCurrentDecisionSession(null);
    setAnalysisStep(0);
    setError(null);
    setIsAnalyzing(false);
  }, [setCurrentDecisionSession, setAnalysisStep, setError, setIsAnalyzing]);

  return { analysisSteps, session: currentDecisionSession, challenge, markChallenge, saveSession, reset };
}
