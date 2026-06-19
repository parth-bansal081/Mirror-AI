import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useAgentSupervisor } from '../../hooks/useAgentSupervisor';
import WorkflowInput from './WorkflowInput';
import CheckpointPlan from './CheckpointPlan';
import StepLogger from './StepLogger';
import RunSummary from './RunSummary';
import IrreversibleGate from '../../components/IrreversibleGate';
import Toast from '../../components/UI/Toast';
import StepReveal from '../../components/UI/StepReveal';
import LoadingOrb from '../../components/UI/LoadingOrb';
import styles from './index.module.css';
import { AssessStepResult } from '../../store/types';

type View = 'input' | 'planning' | 'checkpoint' | 'monitor' | 'complete';

export default function AgentBabysitter() {
  const { isAnalyzing, analysisStep, error, setError } = useProfileStore();
  const {
    planSteps,
    session,
    isAssessing,
    isSummarizing,
    analyzeWorkflow,
    approvePlan,
    assessStep,
    resolveIrreversible,
    completeRun,
    reset,
  } = useAgentSupervisor();

  const [view, setView] = useState<View>('input');
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [gateStep, setGateStep] = useState<{ stepNumber: number; action: string; description: string; driftStatus: 'coherent' | 'drifting' | null } | null>(null);
  const [lastAssessment, setLastAssessment] = useState<AssessStepResult | null>(null);

  const totalRuns = useProfileStore((s) => s.profile.agent_log.total_runs);

  async function handleAnalyze(task: string) {
    setView('planning');
    await analyzeWorkflow(task);
    if (!useProfileStore.getState().error) {
      setView('checkpoint');
    } else {
      setView('input');
    }
  }

  function handleApprovePlan() {
    approvePlan();
    setView('monitor');
  }

  async function handleSubmitStep(stepNumber: number, output: string) {
    const result = await assessStep(stepNumber, output);
    if (!result) return;

    setLastAssessment(result);

    if (result.status === 'irreversible_detected') {
      const step = session?.steps?.find((s) => s.step_number === stepNumber);
      setGateStep({
        stepNumber,
        action: result.irreversible_action ?? step?.irreversible_action ?? 'Unknown action',
        description: step?.description ?? `Step ${stepNumber}`,
        driftStatus: null,
      });
    } else if (result.status === 'drifting') {
      setToast({ message: `⚠ Drift detected at step ${stepNumber}: ${result.drift_reason}`, kind: 'error' });
    } else {
      setToast({ message: `Step ${stepNumber} assessed: Coherent (${result.confidence_score}% confidence)`, kind: 'success' });
    }
  }

  function handleApproveIrreversible() {
    if (!gateStep) return;
    resolveIrreversible(gateStep.stepNumber, 'approved');
    setGateStep(null);
    setToast({ message: 'Action approved. Agent may continue.', kind: 'info' });
  }

  function handleRejectIrreversible() {
    if (!gateStep) return;
    resolveIrreversible(gateStep.stepNumber, 'rejected');
    setGateStep(null);
    setToast({ message: 'Action rejected. Agent should stop here.', kind: 'error' });
  }

  async function handleCompleteRun() {
    await completeRun();
    setView('complete');
    setToast({ message: 'Run complete. Summary saved to Agent Log.', kind: 'success' });
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Agent Babysitter</h1>
          <p className={styles.subtitle}>Supervise AI agent runs. Gate every irreversible action.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sessionBadge}>{totalRuns} runs logged</span>
          {(view !== 'input') && (
            <button className={styles.btnSecondary} onClick={() => { reset(); setView('input'); }}>
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorDismiss}>✕</button>
        </div>
      )}

      {/* Input */}
      {view === 'input' && (
        <WorkflowInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
      )}

      {/* Planning */}
      {view === 'planning' && (
        <div className={styles.modePanel} style={{ padding: 'var(--space-6)' }}>
          <div className={styles.analyzingHeader}>
            <LoadingOrb size={28} />
            <p className={styles.analyzingText}>Mapping your workflow…</p>
          </div>
          <StepReveal
            steps={planSteps}
            currentStep={analysisStep}
            isAnalyzing={isAnalyzing}
            accentColor="var(--mode-primary)"
          />
        </div>
      )}

      {/* Checkpoint plan */}
      {view === 'checkpoint' && session?.steps && (
        <CheckpointPlan
          steps={session.steps}
          taskDescription={session.task_description ?? ''}
          onApprove={handleApprovePlan}
        />
      )}

      {/* Live monitor */}
      {view === 'monitor' && session?.steps && (
        <StepLogger
          steps={session.steps}
          taskDescription={session.task_description ?? ''}
          isAssessing={isAssessing}
          onSubmitStep={handleSubmitStep}
          onCompleteRun={handleCompleteRun}
          isSummarizing={isSummarizing}
        />
      )}

      {/* Run complete */}
      {view === 'complete' && session && (
        <RunSummary
          session={session}
          onNew={() => { reset(); setView('input'); }}
        />
      )}

      {/* Irreversible gate — full screen, cannot be bypassed */}
      {gateStep && (
        <IrreversibleGate
          action={gateStep.action}
          stepDescription={gateStep.description}
          driftStatus={lastAssessment?.status === 'drifting' ? 'drifting' : 'coherent'}
          onApprove={handleApproveIrreversible}
          onReject={handleRejectIrreversible}
        />
      )}

      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={() => setToast(null)} />}
    </div>
  );
}
