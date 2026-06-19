/**
 * useLearningPath — hook for the Learning Path Negotiator mode.
 */
import { useState, useCallback } from 'react';
import { invokeAnna, TOOLS } from './useAnna';
import { saveLearningProgress } from './useProfile';
import { useProfileStore } from '../store/profileStore';
import {
  LearningProgress,
  StudyWeek,
  GenerateQuestionsResult,
  AssessBaselineResult,
  GenerateCurriculumResult,
  EvaluateCheckpointResult,
} from '../store/types';

const ASSESSMENT_STEPS = [
  { id: 'questions', label: 'Generating custom questions…' },
  { id: 'baseline',  label: 'Analyzing baseline responses…' },
  { id: 'curriculum',label: 'Negotiating learning path curriculum…' },
];

export function useLearningPath() {
  const {
    profile,
    setProfile,
    setIsAnalyzing,
    setAnalysisStep,
    setError,
    currentLearningSession,
    setCurrentLearningSession,
  } = useProfileStore();

  const [assessmentSteps] = useState(ASSESSMENT_STEPS);

  // Phase 1: Start baseline assessment
  const startAssessment = useCallback(async (topic: string, goal: string) => {
    if (!topic.trim()) {
      setError('Please specify what you want to learn.');
      return null;
    }
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setError(null);

    try {
      const result = await invokeAnna<GenerateQuestionsResult>(
        TOOLS.LEARNING_PATH,
        'generate_questions',
        { topic, goal }
      );

      if (result.error) throw new Error(result.error);

      const session: Partial<LearningProgress> = {
        topic,
        goal,
        level: '',
        current_week: 1,
        completed_topics: [],
        assessment_scores: {},
        knowledge_gaps: [],
        last_updated: new Date().toISOString(),
      };
      
      setCurrentLearningSession(session);
      setIsAnalyzing(false);
      return result.questions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate assessment.');
      setIsAnalyzing(false);
      return null;
    }
  }, [setIsAnalyzing, setAnalysisStep, setError, setCurrentLearningSession]);

  // Phase 2: Analyze baseline and generate curriculum
  const submitBaseline = useCallback(async (
    topic: string,
    goal: string,
    questions: string[],
    answers: string[]
  ) => {
    setIsAnalyzing(true);
    setAnalysisStep(1);
    setError(null);

    const questionsAndAnswers = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || "Don't know"
    }));

    try {
      // 1. Assess baseline
      const baseline = await invokeAnna<AssessBaselineResult>(
        TOOLS.LEARNING_PATH,
        'assess_baseline',
        { topic, answers: questionsAndAnswers }
      );
      if (baseline.error) throw new Error(baseline.error);

      setAnalysisStep(2);

      // 2. Generate curriculum based on baseline level
      const curriculumResult = await invokeAnna<GenerateCurriculumResult>(
        TOOLS.LEARNING_PATH,
        'generate_curriculum',
        {
          topic,
          goal,
          level: baseline.level,
          known_topics: baseline.what_they_know
        }
      );
      if (curriculumResult.error) throw new Error(curriculumResult.error);

      const session: LearningProgress = {
        topic,
        goal,
        level: baseline.level,
        current_week: 1,
        completed_topics: [],
        assessment_scores: {},
        knowledge_gaps: baseline.what_they_dont_know,
        curriculum: curriculumResult.weeks,
        last_updated: new Date().toISOString(),
      };

      setCurrentLearningSession(session);
      
      // Update profile
      const updatedProfile = await saveLearningProgress(session, profile);
      setProfile(updatedProfile);

      setIsAnalyzing(false);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Baseline assessment failed.');
      setIsAnalyzing(false);
      return null;
    }
  }, [setIsAnalyzing, setAnalysisStep, setError, setCurrentLearningSession, profile, setProfile]);

  // Update curriculum directly (reordering, marking known, etc.)
  const updateCurriculum = useCallback(async (updatedWeeks: StudyWeek[]) => {
    const session = useProfileStore.getState().currentLearningSession;
    if (!session) return;

    const completed: string[] = [];
    updatedWeeks.forEach(w => {
      w.topics.forEach(t => {
        if (t.known) completed.push(t.key);
      });
    });

    const updated: LearningProgress = {
      ...(session as LearningProgress),
      completed_topics: completed,
      curriculum: updatedWeeks,
      last_updated: new Date().toISOString(),
    };

    setCurrentLearningSession(updated);
    const updatedProfile = await saveLearningProgress(updated, profile);
    setProfile(updatedProfile);
  }, [setCurrentLearningSession, profile, setProfile]);

  // Generate checkpoint questions for the current week
  const getCheckpointQuestions = useCallback(async (weekTitle: string) => {
    const session = useProfileStore.getState().currentLearningSession;
    if (!session) return null;
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await invokeAnna<GenerateQuestionsResult>(
        TOOLS.LEARNING_PATH,
        'generate_questions',
        {
          topic: `${session.topic} (Week Checkpoint: ${weekTitle})`,
          goal: `Assess practical understanding of this week's topics.`
        }
      );
      setIsAnalyzing(false);
      if (result.error) throw new Error(result.error);
      return result.questions.slice(0, 3); // return 3 mini-assessments
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate checkpoint.');
      setIsAnalyzing(false);
      return null;
    }
  }, [setIsAnalyzing, setError]);

  // Evaluate checkpoint question response
  const evaluateCheckpoint = useCallback(async (question: string, answer: string) => {
    const session = useProfileStore.getState().currentLearningSession;
    if (!session) return null;

    try {
      const result = await invokeAnna<EvaluateCheckpointResult>(
        TOOLS.LEARNING_PATH,
        'evaluate_checkpoint',
        {
          topic: session.topic,
          question,
          user_answer: answer
        }
      );
      if (result.error) throw new Error(result.error);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkpoint evaluation failed.');
      return null;
    }
  }, [setError]);

  // Advance week or finish curriculum
  const completeWeek = useCallback(async (weekNum: number, gaps: string[]) => {
    const session = useProfileStore.getState().currentLearningSession;
    if (!session) return;

    const nextWeek = weekNum + 1;
    const isFinished = nextWeek > (session.curriculum?.length ?? 3);

    const updated: LearningProgress = {
      ...(session as LearningProgress),
      current_week: isFinished ? weekNum : nextWeek,
      knowledge_gaps: Array.from(new Set([...(session.knowledge_gaps || []), ...gaps])),
      last_updated: new Date().toISOString(),
    };

    setCurrentLearningSession(updated);
    const updatedProfile = await saveLearningProgress(updated, profile);
    setProfile(updatedProfile);
    return isFinished;
  }, [setCurrentLearningSession, profile, setProfile]);

  const reset = useCallback(() => {
    setCurrentLearningSession(null);
    setIsAnalyzing(false);
    setError(null);
  }, [setCurrentLearningSession, setIsAnalyzing, setError]);

  return {
    assessmentSteps,
    session: currentLearningSession,
    startAssessment,
    submitBaseline,
    updateCurriculum,
    getCheckpointQuestions,
    evaluateCheckpoint,
    completeWeek,
    reset,
  };
}
