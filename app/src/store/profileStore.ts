import { create } from 'zustand';
import {
  AppState,
  MirrorProfile,
  ModeType,
  PromptSession,
  DecisionSession,
  AgentSession,
  PromptLibrary,
  LearningProgress,
  GenesisSession,
  BrutalistSession,
  emptyPromptDNA,
  emptyDecisionMap,
  emptyAgentLog,
} from './types';

const emptyProfile: MirrorProfile = {
  prompt_dna: emptyPromptDNA,
  decision_map: emptyDecisionMap,
  agent_log: emptyAgentLog,
  improvement_score: null,
};

const emptyLibrary: PromptLibrary = { prompts: [], total: 0 };

interface ProfileStore extends AppState {
  // Profile actions
  setProfile: (profile: MirrorProfile) => void;
  setProfileLoaded: (loaded: boolean) => void;

  // Session actions
  setCurrentPromptSession: (session: Partial<PromptSession> | null) => void;
  setCurrentDecisionSession: (session: Partial<DecisionSession> | null) => void;
  setCurrentAgentSession: (session: Partial<AgentSession> | null) => void;
  setCurrentLearningSession: (session: Partial<LearningProgress> | null) => void;
  setCurrentGenesisSession: (session: Partial<GenesisSession> | null) => void;
  setCurrentBrutalistSession: (session: Partial<BrutalistSession> | null) => void;

  // Mode navigation
  setActiveMode: (mode: ModeType) => void;

  // Analysis state
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisStep: (step: number) => void;
  incrementAnalysisStep: () => void;

  // Error
  setError: (error: string | null) => void;

  // Library
  setPromptLibrary: (library: PromptLibrary) => void;

  // Meta
  setSessionCount: (count: number) => void;
  incrementSessionCount: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  // Initial state
  profile: emptyProfile,
  profileLoaded: false,
  currentPromptSession: null,
  currentDecisionSession: null,
  currentAgentSession: null,
  currentLearningSession: null,
  currentGenesisSession: null,
  currentBrutalistSession: null,
  activeMode: 'genesis',
  isAnalyzing: false,
  analysisStep: 0,
  error: null,
  promptLibrary: emptyLibrary,
  sessionCount: 0,
  lastActive: new Date().toISOString(),

  // Profile
  setProfile: (profile) => set({ profile }),
  setProfileLoaded: (profileLoaded) => set({ profileLoaded }),

  // Sessions
  setCurrentPromptSession: (currentPromptSession) => set({ currentPromptSession }),
  setCurrentDecisionSession: (currentDecisionSession) => set({ currentDecisionSession }),
  setCurrentAgentSession: (currentAgentSession) => set({ currentAgentSession }),
  setCurrentLearningSession: (currentLearningSession) => set({ currentLearningSession }),
  setCurrentGenesisSession: (currentGenesisSession) => set({ currentGenesisSession }),
  setCurrentBrutalistSession: (currentBrutalistSession) => set({ currentBrutalistSession }),

  // Mode — clear current sessions when switching modes
  setActiveMode: (activeMode) =>
    set({
      activeMode,
      isAnalyzing: false,
      analysisStep: 0,
      error: null,
    }),

  // Analysis
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisStep: (analysisStep) => set({ analysisStep }),
  incrementAnalysisStep: () => set((s) => ({ analysisStep: s.analysisStep + 1 })),

  // Error
  setError: (error) => set({ error }),

  // Library
  setPromptLibrary: (promptLibrary) => set({ promptLibrary }),

  // Meta
  setSessionCount: (sessionCount) => set({ sessionCount }),
  incrementSessionCount: () => set((s) => ({ sessionCount: s.sessionCount + 1 })),
}));
