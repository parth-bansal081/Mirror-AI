import { Challenge, ReviewMark } from '../../store/types';
import styles from './ChallengeCards.module.css';

const TYPE_LABELS: Record<string, string> = {
  opposition:  '⚔ STRONGEST OPPOSITION',
  blind_spot:  '🕳 BLIND SPOT DETECTED',
  stress_test: '💥 WORST CASE',
  historical:  '📜 HISTORICAL MATCH',
};

const TYPE_COLORS: Record<string, string> = {
  opposition:  'var(--mode-advocate)',
  blind_spot:  'var(--warning)',
  stress_test: 'var(--danger)',
  historical:  'var(--mode-primary)',
};

interface ChallengeCardsProps {
  challenges: Challenge[];
  counterQuestions: string[];
  onMark: (id: string, mark: ReviewMark) => void;
}

export default function ChallengeCards({ challenges, counterQuestions, onMark }: ChallengeCardsProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>Challenges</h2>

      <div className={styles.cards}>
        {challenges.map((ch, idx) => {
          const color = TYPE_COLORS[ch.type] ?? 'var(--mode-advocate)';
          const label = TYPE_LABELS[ch.type] ?? ch.type.toUpperCase();

          return (
            <div
              key={ch.id}
              className={styles.modePanel}
              style={{
                borderLeft: `3px solid ${color}`,
                animationDelay: `${idx * 150}ms`,
              }}
            >
              <div className={styles.cardType} style={{ color }}>
                {label}
              </div>
              <p className={styles.cardTitle}>{ch.title}</p>
              <p className={styles.cardContent}>{ch.content}</p>

              {/* Review actions */}
              <div className={styles.reviewActions} role="group" aria-label={`Mark challenge: ${ch.title}`}>
                <button
                  className={`${styles.reviewBtn} ${styles.reviewBtnValid} ${ch.mark === 'valid' ? styles.selected : ''}`}
                  onClick={() => onMark(ch.id, 'valid')}
                  id={`mark-valid-${ch.id}`}
                  aria-pressed={ch.mark === 'valid'}
                >✓ Valid</button>
                <button
                  className={`${styles.reviewBtn} ${styles.reviewBtnOverblown} ${ch.mark === 'overblown' ? styles.selected : ''}`}
                  onClick={() => onMark(ch.id, 'overblown')}
                  id={`mark-overblown-${ch.id}`}
                  aria-pressed={ch.mark === 'overblown'}
                >~ Overblown</button>
                <button
                  className={`${styles.reviewBtn} ${styles.reviewBtnNa} ${ch.mark === 'not_applicable' ? styles.selected : ''}`}
                  onClick={() => onMark(ch.id, 'not_applicable')}
                  id={`mark-na-${ch.id}`}
                  aria-pressed={ch.mark === 'not_applicable'}
                >✗ Not Applicable</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Counter questions */}
      {counterQuestions.length > 0 && (
        <div className={styles.questions}>
          <h3 className={styles.questionsTitle}>— Counter-Questions</h3>
          <p className={styles.questionsSubtitle}>Before deciding, can you answer these?</p>
          <ol className={styles.questionsList}>
            {counterQuestions.map((q, i) => (
              <li key={i} className={styles.question}>{q}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
