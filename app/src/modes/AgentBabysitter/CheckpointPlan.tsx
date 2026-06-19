import { AgentStep, RiskLevel } from '../../store/types';
import styles from './CheckpointPlan.module.css';

const RISK_LABELS: Record<RiskLevel, string> = {
  low:         'LOW',
  medium:      'MED',
  high:        'HIGH',
  irreversible: 'IRREVERSIBLE',
};

const RISK_ICONS: Record<RiskLevel, string> = {
  low:         '',
  medium:      '',
  high:        '',
  irreversible: '🔒',
};

interface CheckpointPlanProps {
  steps: AgentStep[];
  taskDescription: string;
  onApprove: () => void;
}

export default function CheckpointPlan({ steps, taskDescription, onApprove }: CheckpointPlanProps) {
  const irreversibleCount = steps.filter((s) => s.risk_level === 'irreversible').length;

  return (
    <div className={styles.container}>
      <div className={styles.modePanel}>
        <h2 className={styles.title}>Checkpoint Plan</h2>
        <p className={styles.task}>{taskDescription}</p>

        <div className={styles.steps}>
          {steps.map((step) => (
            <div key={step.step_number} className={styles.step}>
              <span className={styles.stepNum}>Step {step.step_number}</span>
              <div className={styles.stepContent}>
                <span className={styles.stepDesc}>{step.description}</span>
                {step.risk_level === 'irreversible' && (
                  <div className={styles.irreversibleExplanation}>
                    This action cannot be undone — Mirror will require your approval before proceeding
                  </div>
                )}
              </div>
              <span className={`${styles.riskBadge} ${styles[`risk_${step.risk_level}`]}`}>
                {RISK_ICONS[step.risk_level] ? `${RISK_ICONS[step.risk_level]} ` : ''}{RISK_LABELS[step.risk_level]}
              </span>
            </div>
          ))}
        </div>

        {irreversibleCount > 0 && (
          <div className={styles.warning}>
            <span className={styles.warningIcon}>🔒</span>
            <p className={styles.warningText}>
              <strong>{irreversibleCount} irreversible action{irreversibleCount !== 1 ? 's' : ''}</strong> detected.
              Mirror will pause and require your approval before the agent executes each one.
            </p>
          </div>
        )}

        <button
          className={styles.btnApprove}
          onClick={onApprove}
          id="approve-plan-btn"
        >
          Approve Plan &amp; Start Monitoring
        </button>
      </div>
    </div>
  );
}
