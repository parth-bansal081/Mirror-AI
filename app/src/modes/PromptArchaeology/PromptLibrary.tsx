import { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import styles from './PromptLibrary.module.css';

export default function PromptLibrary() {
  const { promptLibrary } = useProfileStore();
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* non-fatal */ }
  }

  if (promptLibrary.prompts.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <p className={styles.emptyTitle}>Your library is empty</p>
        <p className={styles.emptySubtitle}>Analyze a failed prompt and save the fix to build your library.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.count}>{promptLibrary.total} saved prompts</p>
      <div className={styles.list}>
        {promptLibrary.prompts.map((p) => (
          <div key={p.id} className={`glass-panel ${styles.item}`} data-mode="archaeology">
            <div className={styles.itemHeader}>
              <span className={styles.failureTag}>{p.failure_type_fixed.replace('_', ' ')}</span>
              <span className={styles.strategy}>{p.rewrite_strategy}</span>
              <span className={styles.date}>{new Date(p.date_saved).toLocaleDateString()}</span>
            </div>
            <pre className={styles.promptText}>{p.final_prompt}</pre>
            <div className={styles.itemFooter}>
              <button
                className={styles.btnCopy}
                onClick={() => handleCopy(p.id, p.final_prompt)}
                id={`copy-prompt-${p.id}`}
              >
                {copied === p.id ? '✓ Copied' : 'Copy prompt'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
