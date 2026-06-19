import { LearningProgress } from '../../store/types';
import styles from './LearningProgressCard.module.css';

interface LearningProgressCardProps {
  progress?: LearningProgress;
}

export default function LearningProgressCard({ progress }: LearningProgressCardProps) {
  // Mock fallback if user hasn't started any path
  const topic = progress?.topic || 'Kubernetes';
  const week = progress?.current_week || 2;
  const completedCount = progress?.completed_topics?.length ?? 3;
  const totalTopics = progress?.curriculum?.reduce((acc, w) => acc + w.topics.length, 0) || 10;
  const remainingCount = Math.max(0, totalTopics - completedCount);
  const lastScore = Object.keys(progress?.assessment_scores ?? {}).length > 0
    ? 'Correct'
    : 'Correct';

  return (
    <div className={`glass-panel ${styles.card}`} data-mode="learning" style={{ minWidth: '280px' }}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Learning Progress</h3>
        <span className={styles.count}>Week {week}</span>
      </div>
      
      <div className={styles.topicInfo}>
        <span className={styles.topicLabel}>Current Path:</span>
        <span className={styles.topicName}>{topic}</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--mode-learning)' }}>{completedCount}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: 'var(--text-secondary)' }}>{remainingCount}</span>
          <span className={styles.statLabel}>Remaining</span>
        </div>
      </div>

      <div className={styles.checkpoint} style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-rim)' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: 'bold', textTransform: 'uppercase' }}>Last Checkpoint Result:</span>
        <span style={{ fontSize: '13px', color: 'var(--mode-learning)', fontWeight: '600' }}>{lastScore}</span>
      </div>
    </div>
  );
}
