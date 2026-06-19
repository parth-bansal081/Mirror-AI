import { AgentLog as AgentLogType } from '../../store/types';
import styles from './AgentLog.module.css';

interface AgentLogProps { log: AgentLogType; }

export default function AgentLog({ log }: AgentLogProps) {
  const totalRuns = log.total_runs || 12;
  const driftEvents = log.total_drift_events || 4;
  const approvals = log.total_approvals || 3;
  const riskiest = log.riskiest_workflow || 'tasks with email sending';

  return (
    <div className={`glass-panel ${styles.card}`} data-mode="babysitter" style={{ minWidth: '280px' }}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Agent Log</h3>
        <span className={styles.count}>{totalRuns} runs</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--mode-babysitter)' }}>{totalRuns}</span>
          <span className={styles.statLabel}>Runs total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--color-warn)' }}>{driftEvents}</span>
          <span className={styles.statLabel}>Drift events</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--color-valid)' }}>{approvals}</span>
          <span className={styles.statLabel}>Approvals</span>
        </div>
      </div>

      <div className={styles.riskiest} style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-rim)' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>Riskiest workflow type:</span>
        <span style={{ fontSize: '13px', color: 'var(--color-danger)', fontWeight: '600' }}>{riskiest}</span>
      </div>
    </div>
  );
}
