import { useState } from 'react';
import styles from './PromptInput.module.css';
import LoadingOrb from '../../components/UI/LoadingOrb';

interface PromptInputProps {
  onAnalyze: (prompt: string, badOutput: string) => void;
  isLoading: boolean;
}

export default function PromptInput({ onAnalyze, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [badOutput, setBadOutput] = useState('');

  const canSubmit = prompt.trim().length > 0 && badOutput.trim().length > 0 && !isLoading;

  return (
    <div className={styles.container}>
      <p className={styles.stepLabel}>STEP 1 — What failed?</p>

      <div className={styles.columns}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="prompt-input">Your Prompt</label>
          <textarea
            id="prompt-input"
            className={styles.textarea}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste the prompt you sent to the AI…"
            rows={8}
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="bad-output-input">Bad Output Received</label>
          <textarea
            id="bad-output-input"
            className={styles.textarea}
            value={badOutput}
            onChange={(e) => setBadOutput(e.target.value)}
            placeholder="Paste the output that didn't meet your expectations…"
            rows={8}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.btnAnalyze}
          onClick={() => onAnalyze(prompt, badOutput)}
          disabled={!canSubmit}
          id="analyze-failure-btn"
        >
          {isLoading ? (
            <>
              <LoadingOrb size={16} />
              Analyzing…
            </>
          ) : (
            'Analyze Failure'
          )}
        </button>
      </div>
    </div>
  );
}
