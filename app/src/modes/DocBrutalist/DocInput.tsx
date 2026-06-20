import React, { useRef } from 'react';
import styles from './DocBrutalist.module.css';

interface DocInputProps {
  docContent: string;
  setDocContent: (content: string) => void;
  targetUser: string;
  setTargetUser: (user: string) => void;
  fiveMinuteGoal: string;
  setFiveMinuteGoal: (goal: string) => void;
  onSubmit: () => void;
}

export default function DocInput({
  docContent,
  setDocContent,
  targetUser,
  setTargetUser,
  fiveMinuteGoal,
  setFiveMinuteGoal,
  onSubmit,
}: DocInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocContent(content);
    };
    reader.readAsText(file);
  };

  const audiences = [
    { value: 'Developer (technical, knows code)', label: 'Developer', desc: 'Technical, knows code' },
    { value: 'Technical but not a developer (understands concepts)', label: 'Technical Context', desc: 'Concepts only, no code' },
    { value: 'Non-technical (business user, no code knowledge)', label: 'Non-Technical', desc: 'Business user, no code' },
    { value: 'Mixed audience', label: 'Mixed Audience', desc: 'All reader profiles' },
  ];

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const isFormValid = docContent.trim().length > 10 && targetUser && fiveMinuteGoal.trim().length > 5;

  return (
    <div className={styles.inputCard}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>✂ DOC BRUTALIST</h1>
        <p className={styles.subtitle}>Your docs are losing you users. Find out exactly why.</p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>Who is your target user?</label>
        <div className={styles.radioGrid}>
          {audiences.map((aud) => {
            const active = targetUser === aud.value;
            return (
              <div
                key={aud.value}
                className={`${styles.radioOption} ${active ? styles.radioActive : ''}`}
                onClick={() => setTargetUser(aud.value)}
              >
                <div className={styles.radioDot}>
                  <div className={styles.radioDotInner} />
                </div>
                <div className={styles.radioLabel}>
                  <div style={{ fontWeight: 600 }}>{aud.label}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{aud.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>What should they accomplish in their first 5 minutes?</label>
        <input
          type="text"
          className={styles.textInput}
          placeholder='e.g., "Install the package and run their first query" or "Sign up and create a project"'
          value={fiveMinuteGoal}
          onChange={(e) => setFiveMinuteGoal(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <label className={styles.label} style={{ margin: 0 }}>Your documentation (README or setup guide)</label>
          <button className={styles.uploadBtn} onClick={handleTriggerUpload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload .md file
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className={styles.fileInput}
            accept=".md,text/plain,text/markdown"
            onChange={handleFileUpload}
          />
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Paste your README or documentation here..."
          value={docContent}
          onChange={(e) => setDocContent(e.target.value)}
        />
      </div>

      <button
        className={styles.submitBtn}
        disabled={!isFormValid}
        onClick={onSubmit}
      >
        <span>Brutalize It</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="16" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="12" />
        </svg>
      </button>
    </div>
  );
}
