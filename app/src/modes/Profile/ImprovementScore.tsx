import { MirrorProfile } from '../../store/types';
import ScoreRing from '../../components/UI/ScoreRing';
import styles from './ImprovementScore.module.css';

interface ImprovementScoreProps {
  score: number;
  profile: MirrorProfile;
}

export default function ImprovementScore({ score, profile }: ImprovementScoreProps) {
  const { prompt_dna, decision_map, agent_log } = profile;

  const promptScore = prompt_dna.total_analyzed === 0
    ? 50 : Math.max(0, 100 - (prompt_dna.failure_frequencies[0]?.count ?? 0) * 5);
  const decisionScore = decision_map.total_decisions === 0
    ? 50 : decision_map.average_readiness_score;
  const agentScore = agent_log.total_runs === 0
    ? 50 : Math.max(0, 100 - (agent_log.total_drift_events / Math.max(agent_log.total_runs, 1)) * 20);

  return (
    <div className={`glass-panel ${styles.card}`}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Improvement Score</h3>
      </div>

      <div className={styles.body}>
        <ScoreRing score={score} size={100} strokeWidth={6} label="OVERALL" />

        <div className={styles.breakdown}>
          <div className={styles.bRow}>
            <span className={styles.bDot} style={{ background: 'var(--mode-archaeology)' }} />
            <span className={styles.bLabel}>Prompts</span>
            <span className={styles.bScore} style={{ color: 'var(--mode-archaeology)' }}>{Math.round(promptScore)}</span>
          </div>
          <div className={styles.bRow}>
            <span className={styles.bDot} style={{ background: 'var(--mode-advocate)' }} />
            <span className={styles.bLabel}>Decisions</span>
            <span className={styles.bScore} style={{ color: 'var(--mode-advocate)' }}>{Math.round(decisionScore)}</span>
          </div>
          <div className={styles.bRow}>
            <span className={styles.bDot} style={{ background: 'var(--mode-babysitter)' }} />
            <span className={styles.bLabel}>Agents</span>
            <span className={styles.bScore} style={{ color: 'var(--mode-babysitter)' }}>{Math.round(agentScore)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
