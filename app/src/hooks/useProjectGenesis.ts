import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { invokeAnna, TOOLS, storageSet } from './useAnna';
import { saveGenesisSession } from './useProfile';
import { useProfileStore } from '../store/profileStore';
import { GenesisSession } from '../store/types';

export interface GenesisQuestion {
  id: string;
  question: string;
  dimension: string;
  why_asking: string;
}

export type GenesisStage = 'brief' | 'questions' | 'spec_confirm' | 'generating' | 'workspace';

export function useProjectGenesis() {
  const {
    profile,
    setProfile,
    incrementSessionCount,
    setError,
    error,
    currentGenesisSession,
    setCurrentGenesisSession,
  } = useProfileStore();

  const [sessionId, setSessionId] = useState<string>('');
  const [stage, setStage] = useState<GenesisStage>('brief');
  const [brief, setBrief] = useState<string>('');
  const [vaguenessScore, setVaguenessScore] = useState<number>(0);
  const [missingDimensions, setMissingDimensions] = useState<string[]>([]);
  const [questions, setQuestions] = useState<GenesisQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [spec, setSpec] = useState<any>(null);
  const [documents, setDocuments] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load session from store if present on mount/change
  useEffect(() => {
    if (currentGenesisSession && currentGenesisSession.id && currentGenesisSession.id !== sessionId) {
      setSessionId(currentGenesisSession.id);
      setBrief(currentGenesisSession.brief || '');
      setAnswers(currentGenesisSession.answers || {});
      setSpec(currentGenesisSession.spec || null);
      setDocuments(currentGenesisSession.documents || null);
      setStage('workspace');
    }
  }, [currentGenesisSession, sessionId]);

  // Restart flow
  const reset = useCallback(() => {
    setSessionId('');
    setStage('brief');
    setBrief('');
    setVaguenessScore(0);
    setMissingDimensions([]);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSpec(null);
    setDocuments(null);
    setLoading(false);
    setError(null);
    setCurrentGenesisSession(null);
  }, [setError, setCurrentGenesisSession]);

  // Load a past session
  const loadSession = useCallback((session: GenesisSession) => {
    setSessionId(session.id);
    setBrief(session.brief);
    setAnswers(session.answers);
    setSpec(session.spec);
    setDocuments(session.documents);
    setStage('workspace');
    setCurrentGenesisSession(session);
  }, [setCurrentGenesisSession]);


  // Stage 1: Submit Brief
  const submitBrief = useCallback(async (inputBrief: string) => {
    if (!inputBrief.trim()) {
      setError('Please provide a brief description of your project.');
      return;
    }
    setLoading(true);
    setError(null);
    setBrief(inputBrief);
    setSessionId(uuidv4());

    try {
      // 1. Analyze depth
      const depthResult = await invokeAnna<any>(
        TOOLS.PROJECT_GENESIS,
        'assess_brief_depth',
        { brief: inputBrief }
      );

      setVaguenessScore(depthResult.vagueness_score);
      setMissingDimensions(depthResult.missing_dimensions);

      // 2. Generate questions
      const qResult = await invokeAnna<any>(
        TOOLS.PROJECT_GENESIS,
        'generate_questions',
        {
          brief: inputBrief,
          missing_dimensions: depthResult.missing_dimensions,
          count: depthResult.question_count_needed || 5
        }
      );

      setQuestions(qResult.questions || []);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setStage('questions');
    } catch (err: any) {
      setError(err.message || 'Failed to assess project brief.');
    } finally {
      setLoading(false);
    }
  }, [setError]);

  // Stage 2: Question Q&A loop
  const submitAnswer = useCallback(async (currentAnswer: string) => {
    if (!currentAnswer.trim()) {
      setError('Please provide an answer before continuing.');
      return;
    }
    setError(null);

    const questionId = questions[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: currentAnswer };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Completed all questions, generate spec validation
      setLoading(true);
      try {
        const specResult = await invokeAnna<any>(
          TOOLS.PROJECT_GENESIS,
          'validate_spec',
          { brief, answers: newAnswers }
        );
        setSpec(specResult);
        setStage('spec_confirm');
      } catch (err: any) {
        setError(err.message || 'Failed to validate project specification.');
      } finally {
        setLoading(false);
      }
    }
  }, [questions, currentQuestionIndex, answers, brief, setError]);

  // Stage 2.5: Confirm & edit spec
  const confirmSpec = useCallback(async (confirmedSpec: any) => {
    setLoading(true);
    setError(null);
    setSpec(confirmedSpec);
    setStage('generating');

    try {
      const docsResult = await invokeAnna<any>(
        TOOLS.PROJECT_GENESIS,
        'generate_documents',
        { spec: confirmedSpec }
      );

      setDocuments(docsResult.documents);
      setStage('workspace');

      // Save session to APS
      const session: GenesisSession = {
        id: sessionId || uuidv4(),
        date: new Date().toISOString(),
        brief,
        answers,
        spec: confirmedSpec,
        documents: docsResult.documents,
        product_name: confirmedSpec.product_name || 'My Project',
      };

      const updatedSessions = await saveGenesisSession(session);
      
      // Update global session count
      const newCount = useProfileStore.getState().sessionCount + 1;
      await storageSet('mirror:meta:session_count', String(newCount));
      incrementSessionCount();
    } catch (err: any) {
      setError(err.message || 'Failed to generate project documents.');
      setStage('spec_confirm');
    } finally {
      setLoading(false);
    }
  }, [brief, answers, sessionId, incrementSessionCount, setError]);

  // Save manual modifications back to session
  const saveWorkspaceDoc = useCallback(async (docKey: string, content: string) => {
    if (!documents || !spec) return;
    const updatedDocs = { ...documents, [docKey]: content };
    setDocuments(updatedDocs);

    const session: GenesisSession = {
      id: sessionId,
      date: new Date().toISOString(),
      brief,
      answers,
      spec,
      documents: updatedDocs,
      product_name: spec.product_name || 'My Project',
    };
    await saveGenesisSession(session);
  }, [sessionId, brief, answers, spec, documents]);

  return {
    sessionId,
    stage,
    setStage,
    brief,
    setBrief,
    vaguenessScore,
    missingDimensions,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    spec,
    setSpec,
    documents,
    loading,
    error,
    setError,
    submitBrief,
    submitAnswer,
    confirmSpec,
    saveWorkspaceDoc,
    loadSession,
    reset,
  };
}
