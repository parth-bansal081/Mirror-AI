import { DecisionSession } from '../../store/types';
import ScoreRing from '../../components/UI/ScoreRing';
import styles from './ReadinessScore.module.css';

interface ReadinessScoreProps {
  session: Partial<DecisionSession>;
  onNew: () => void;
  onSave?: () => void;
}

export default function ReadinessScore({ session, onNew, onSave }: ReadinessScoreProps) {
  const score = session.readiness_score ?? 0;
  const breakdown = session.score_breakdown;
  const challenges = session.challenges ?? [];
  const unaddressed = challenges.filter((c) => c.mark === 'valid');

  return (
    <div className={styles.container}>
      <div className={styles.modePanel}>
        <h2 className={styles.title}>Decision Readiness</h2>

        <div className={styles.scoreRow}>
          <ScoreRing score={score} size={160} />

          <div className={styles.breakdown}>
            {breakdown && (
              <>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownDot} style={{ background: 'var(--success)' }} />
                  <span className={styles.breakdownText}>
                    <strong>{breakdown.valid_count}</strong> challenges valid — you acknowledged real risks
                  </span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownDot} style={{ background: 'var(--warning)' }} />
                  <span className={styles.breakdownText}>
                    <strong>{breakdown.overblown_count}</strong> challenge{breakdown.overblown_count !== 1 ? 's' : ''} overblown — good skepticism
                  </span>
                </div>
                <div className={styles.breakdownItem}>
                  <span className={styles.breakdownDot} style={{ background: 'var(--neutral)' }} />
                  <span className={styles.breakdownText}>
                    <strong>{breakdown.not_applicable_count}</strong> not applicable
                  </span>
                </div>
              </>
            )}

            {unaddressed.length > 0 && (
              <div className={styles.unaddressed}>
                <p className={styles.unaddressedLabel}>Strongest unaddressed risk:</p>
                <p className={styles.unaddressedText}>{unaddressed[0]?.title}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {!session.saved && onSave && (
            <button className={styles.btnSave} onClick={onSave} id="save-decision-btn">
              ✓ Save Decision
            </button>
          )}
          <button className={styles.btnNew} onClick={onNew} id="new-decision-btn">
            New Decision
          </button>
          <button
            className={styles.btnReconsider}
            onClick={() => window.history.back()}
            id="reconsider-btn"
          >
            ← Reconsider
          </button>
        </div>
      </div>
    </div>
  );
}
