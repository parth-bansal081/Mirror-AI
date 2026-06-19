import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useDecisionCritic } from '../../hooks/useDecisionCritic';
import DecisionInput from './DecisionInput';
import ChallengeCards from './ChallengeCards';
import ReadinessScore from './ReadinessScore';
import Toast from '../../components/UI/Toast';
import StepReveal from '../../components/UI/StepReveal';
import LoadingOrb from '../../components/UI/LoadingOrb';
import styles from './index.module.css';

type View = 'input' | 'analyzing' | 'challenges' | 'score';

export default function DevilsAdvocate() {
  const { isAnalyzing, analysisStep, error, setError } = useProfileStore();
  const { analysisSteps, session, challenge, markChallenge, saveSession, reset } = useDecisionCritic();
  const [view, setView] = useState<View>('input');
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);

  const pastDecisions = useProfileStore((s) => s.profile.decision_map.total_decisions);
  const allMarked = session?.challenges?.every((c) => c.mark !== 'unreviewed') ?? false;

  async function handleChallenge(decision: string) {
    setView('analyzing');
    await challenge(decision);
    if (!useProfileStore.getState().error) {
      setView('challenges');
    } else {
      setView('input');
    }
  }

  async function handleSave() {
    const ok = await saveSession();
    if (ok) {
      setToast({ message: 'Decision saved to your Intelligence Profile.', kind: 'success' });
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Devil's Advocate</h1>
          <p className={styles.subtitle}>Challenge your decisions before you commit.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sessionBadge}>Past calls: {pastDecisions}</span>
          {(view === 'challenges' || view === 'score') && (
            <button className={styles.btnSecondary} onClick={() => { reset(); setView('input'); }}>
              New Decision
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorDismiss}>✕</button>
        </div>
      )}

      {/* Input */}
      {view === 'input' && (
        <DecisionInput onChallenge={handleChallenge} isLoading={isAnalyzing} />
      )}

      {/* Analyzing */}
      {view === 'analyzing' && (
        <div className={styles.modePanel} style={{ padding: 'var(--space-6)' }}>
          <div className={styles.analyzingHeader}>
            <LoadingOrb size={32} />
            <p className={styles.analyzingText}>Building your case against you…</p>
          </div>
          <StepReveal
            steps={analysisSteps}
            currentStep={analysisStep}
            isAnalyzing={isAnalyzing}
            accentColor="var(--mode-primary)"
          />
        </div>
      )}

      {/* Challenges */}
      {view === 'challenges' && session?.challenges && (
        <>
          <ChallengeCards
            challenges={session.challenges}
            counterQuestions={session.counter_questions ?? []}
            onMark={markChallenge}
          />
          {allMarked && (
            <div className={styles.scoreSection}>
              <button
                className={styles.btnGenerateScore}
                onClick={() => setView('score')}
                id="generate-readiness-score-btn"
              >
                Generate Readiness Score
              </button>
            </div>
          )}
        </>
      )}

      {/* Score */}
      {view === 'score' && session && (
        <ReadinessScore
          session={session}
          onNew={() => { reset(); setView('input'); }}
          onSave={handleSave}
        />
      )}

      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={() => setToast(null)} />}
    </div>
  );
}
