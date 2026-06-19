import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import styles from './ProjectGenesis.module.css';

interface BriefInputProps {
  onSubmit: (brief: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  {
    title: "AI-Powered Flashcard App",
    text: "A flashcard app that uses Gemini to generate adaptive questions based on user topics, schedules reminders via local notification APIs, and saves card progress to SQLite/IndexedDB."
  },
  {
    title: "Lightweight Server Telemetry Monitor",
    text: "A web dashboard that polls Express endpoints for server health, cpu utilization, and disk speed, rendering live charts with Recharts and logging critical system warnings."
  }
];

export default function BriefInput({ onSubmit, loading }: BriefInputProps) {
  const [brief, setBrief] = useState('');

  const handleSubmit = () => {
    onSubmit(brief);
  };

  return (
    <div className={styles.briefBox}>
      <div className={styles.label}>Describe your project idea in a few sentences</div>
      
      <textarea
        className={styles.textarea}
        placeholder="e.g. Build a task manager extension for Chrome that tracks developer context..."
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        disabled={loading}
      />

      <div className={styles.examplesSection}>
        <div className={styles.examplesHeader}>Inspiration / Examples</div>
        <div className={styles.exampleGrid}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              className={styles.exampleChip}
              onClick={() => setBrief(ex.text)}
              disabled={loading}
              type="button"
            >
              <strong>{ex.title}</strong>
              <div style={{ marginTop: '4px', opacity: 0.8 }}>{ex.text}</div>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          className={styles.btn}
          onClick={handleSubmit}
          disabled={loading || !brief.trim()}
          type="button"
        >
          <Sparkles size={16} />
          {loading ? 'Analyzing Brief...' : 'Assess & Begin'}
        </button>
      </div>
    </div>
  );
}
