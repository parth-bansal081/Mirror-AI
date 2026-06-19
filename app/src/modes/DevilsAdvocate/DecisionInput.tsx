import { useState } from 'react';
import styles from './DecisionInput.module.css';

interface DecisionInputProps {
  onChallenge: (decision: string) => void;
  isLoading: boolean;
}

export default function DecisionInput({ onChallenge, isLoading }: DecisionInputProps) {
  const [decision, setDecision] = useState('');
  const canSubmit = decision.trim().length > 0 && !isLoading;

  return (
    <div className="glass-panel" data-mode="advocate" style={{ padding: 'var(--space-6)' }}>
      <label className={styles.label} htmlFor="decision-input">Describe your decision:</label>
      <textarea
        id="decision-input"
        className={styles.textarea}
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        placeholder={'e.g. "I\'m switching from React to Vue for our 50k user app because Vue is simpler"'}
        rows={6}
        disabled={isLoading}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>Be specific — include your reasoning, not just the decision.</span>
        <button
          className={styles.btnChallenge}
          onClick={() => onChallenge(decision)}
          disabled={!canSubmit}
          id="challenge-me-btn"
        >
          Challenge Me
        </button>
      </div>
    </div>
  );
}
