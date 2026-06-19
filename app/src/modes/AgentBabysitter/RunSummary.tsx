import { AgentSession } from '../../store/types';
import styles from './RunSummary.module.css';

interface RunSummaryProps {
  session: Partial<AgentSession>;
  onNew: () => void;
}

export default function RunSummary({ session, onNew }: RunSummaryProps) {
  const steps = session.steps ?? [];
  const coherentCount = steps.filter((s) => s.status === 'coherent' || s.status === 'approved').length;

  return (
    <div className={styles.container}>
      <div className="glass-panel" data-mode="babysitter" style={{ padding: 'var(--space-8)' }}>
        <div className={styles.badge}>RUN COMPLETE</div>
        <h2 className={styles.title}>{steps.length} steps · {session.irreversible_count ?? 0} approval gate{(session.irreversible_count ?? 0) !== 1 ? 's' : ''} · {session.drift_events ?? 0} drift event{(session.drift_events ?? 0) !== 1 ? 's' : ''}</h2>

        {session.plain_summary && (
          <div className={styles.summaryBlock}>
            <p className={styles.summaryText}>{session.plain_summary}</p>
          </div>
        )}

        {/* Stats row */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: 'var(--color-valid)' }}>{coherentCount}</span>
            <span className={styles.statLabel}>Steps coherent</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: 'var(--color-warn)' }}>{session.drift_events ?? 0}</span>
            <span className={styles.statLabel}>Drift events</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: 'var(--mode-babysitter)' }}>{session.approved_count ?? 0}</span>
            <span className={styles.statLabel}>Approved</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue} style={{ color: 'var(--color-danger)' }}>{session.rejected_count ?? 0}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnNew} onClick={onNew} id="new-task-btn">
            Monitor Another Task
          </button>
        </div>
      </div>
    </div>
  );
}
