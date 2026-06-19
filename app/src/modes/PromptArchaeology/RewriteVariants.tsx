import { useState } from 'react';
import { PromptSession, PromptRewrite } from '../../store/types';
import styles from './RewriteVariants.module.css';

interface RewriteVariantsProps {
  session: Partial<PromptSession>;
  onSelect: (id: 'A' | 'B' | 'C' | 'blend', text: string) => void;
  onSave: () => Promise<void>;
  onBack: () => void;
}

export default function RewriteVariants({ session, onSelect, onSave, onBack }: RewriteVariantsProps) {
  const [selected, setSelected] = useState<'A' | 'B' | 'C' | null>(null);
  const [blendText, setBlendText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const rewrites = session.rewrites ?? [];

  function handleSelect(id: 'A' | 'B' | 'C') {
    setSelected(id);
    const rw = rewrites.find((r) => r.id === id);
    if (rw) {
      setBlendText(rw.rewritten_prompt);
      onSelect(id, rw.rewritten_prompt);
    }
  }

  async function handleSave() {
    onSelect('blend', blendText);
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Three Fixes</h2>
        <button className={styles.btnBack} onClick={onBack}>← Back to analysis</button>
      </div>

      {/* Rewrite cards */}
      <div className={styles.cards}>
        {rewrites.map((rw: PromptRewrite) => (
          <div
            key={rw.id}
            className={`glass-panel ${styles.card} ${selected === rw.id ? styles.cardSelected : ''}`}
            data-mode="archaeology"
            style={selected === rw.id ? { borderColor: 'var(--mode-archaeology)' } : undefined}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardId}>FIX {rw.id}</span>
              <span className={styles.cardStrategy}>{rw.strategy}</span>
            </div>

            <div className={styles.fixesList}>
              {rw.fixes.map((fix, i) => (
                <span key={i} className={styles.fixTag}>{fix}</span>
              ))}
            </div>

            <pre className={styles.rewriteText}>{rw.rewritten_prompt}</pre>

            <div className={styles.prediction}>
              <span className={styles.predLabel}>Predicted output:</span>
              <p className={styles.predText}>{rw.predicted_output}</p>
            </div>

            <button
              className={`${styles.btnSelect} ${selected === rw.id ? styles.btnSelected : ''}`}
              onClick={() => handleSelect(rw.id)}
              id={`select-rewrite-${rw.id}`}
            >
              {selected === rw.id ? '✓ Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      {/* Blend editor */}
      {selected && (
        <div className={styles.blendSection}>
          <label className={styles.blendLabel} htmlFor="blend-editor">
            Or blend manually — edit the selected rewrite:
          </label>
          <textarea
            id="blend-editor"
            className={styles.blendEditor}
            value={blendText}
            onChange={(e) => {
              setBlendText(e.target.value);
              onSelect('blend', e.target.value);
            }}
            rows={6}
          />
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={!blendText.trim() || isSaving}
            id="save-to-library-btn"
          >
            {isSaving ? 'Saving…' : '↗ Save to Library'}
          </button>
        </div>
      )}
    </div>
  );
}
