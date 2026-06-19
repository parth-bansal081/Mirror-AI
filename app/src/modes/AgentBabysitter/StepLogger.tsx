import { useState } from 'react';
import { AgentStep } from '../../store/types';
import styles from './StepLogger.module.css';
import LoadingOrb from '../../components/UI/LoadingOrb';

const STATUS_COLORS: Record<string, string> = {
  pending:                 'var(--rim)',
  coherent:                'var(--success)',
  drifting:                'var(--warning)',
  irreversible_detected:   'var(--danger)',
  approved:                'var(--success)',
  rejected:                'var(--danger)',
};

const STATUS_LABELS: Record<string, string> = {
  pending:               '● PENDING',
  coherent:              '● COHERENT',
  drifting:              '⚠ DRIFTING',
  irreversible_detected: '🔒 APPROVAL REQUIRED',
  approved:              '● APPROVED',
  rejected:              '● REJECTED',
};

interface StepLoggerProps {
  steps: AgentStep[];
  taskDescription: string;
  isAssessing: boolean;
  onSubmitStep: (stepNumber: number, output: string) => void;
  onCompleteRun: () => void;
  isSummarizing: boolean;
}

export default function StepLogger({
  steps,
  taskDescription,
  isAssessing,
  onSubmitStep,
  onCompleteRun,
  isSummarizing,
}: StepLoggerProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [outputs, setOutputs] = useState<Record<number, string>>({});

  const currentStep = steps[activeStep - 1];
  const loggedSteps = steps.filter((s) => s.status !== 'pending');
  const allDone = steps.every((s) => s.status !== 'pending');

  return (
    <div className={styles.container}>
      {/* Live status header */}
      <div className={styles.liveHeader}>
        <span className={styles.liveDot} />
        <span className={styles.liveLabel}>LIVE MONITOR</span>
        <span className={styles.stepProgress}>Step {activeStep} of {steps.length}</span>
      </div>

      {/* Step history */}
      {loggedSteps.length > 0 && (
        <div className={styles.history}>
          {loggedSteps.map((s) => (
            <div key={s.step_number} className={styles.historyItem}>
              <span className={styles.historyNum}>Step {s.step_number}</span>
              <span
                className={styles.historyStatus}
                style={{ color: STATUS_COLORS[s.status] }}
              >
                {STATUS_LABELS[s.status]}
                {s.confidence_score != null && ` — ${s.confidence_score}% confidence`}
              </span>
              {s.drift_reason && (
                <span className={styles.historyDrift}>{s.drift_reason}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Current step input */}
      {!allDone && currentStep && (
        <div className={styles.modePanel}>
          <div className={styles.stepHeader}>
            <div className={styles.stepInfo}>
              <span className={styles.historyNum}>Step {currentStep.step_number}</span>
              <span className={styles.stepDesc}>{currentStep.description}</span>
            </div>
            <span className={`${styles.riskBadge} ${styles[`risk_${currentStep.risk_level}`]}`}>
              {currentStep.risk_level.toUpperCase()}
            </span>
          </div>

          <label className={styles.outputLabel} htmlFor={`step-output-${activeStep}`}>
            Log step output:
          </label>
          <textarea
            id={`step-output-${activeStep}`}
            className={styles.outputTextarea}
            value={outputs[activeStep] ?? ''}
            onChange={(e) => setOutputs({ ...outputs, [activeStep]: e.target.value })}
            placeholder="Paste the agent's output for this step…"
            rows={5}
            disabled={isAssessing}
          />

          <div className={styles.stepFooter}>
            <button
              className={styles.btnSubmit}
              onClick={() => {
                onSubmitStep(activeStep, outputs[activeStep] ?? '');
                if (activeStep < steps.length) setActiveStep(activeStep + 1);
              }}
              disabled={!(outputs[activeStep] ?? '').trim() || isAssessing}
              id={`submit-step-${activeStep}`}
            >
              {isAssessing ? <><LoadingOrb size={14} /> Assessing…</> : 'Submit Step'}
            </button>
          </div>
        </div>
      )}

      {/* Complete run */}
      {allDone && !isSummarizing && (
        <div className={styles.completeSection}>
          <p className={styles.completeText}>All {steps.length} steps logged. Ready to generate run summary.</p>
          <button className={styles.btnComplete} onClick={onCompleteRun} id="complete-run-btn">
            Complete Run &amp; Save
          </button>
        </div>
      )}

      {isSummarizing && (
        <div className={styles.summarizing}>
          <LoadingOrb size={24} />
          <span>Generating run summary…</span>
        </div>
      )}
    </div>
  );
}
