import React, { useState } from 'react';
import { Issue, BrutalistSession } from '../../store/types';
import styles from './DocBrutalist.module.css';

interface ExportViewProps {
  originalScore: number;
  finalScore: number;
  issues: Issue[];
  confirmedIssues: string[];
  rejectedIssues: string[];
  rewriteContent: string;
  targetUser: string;
  onSaveToProfile: () => Promise<void>;
}

export default function ExportView({
  originalScore,
  finalScore,
  issues,
  confirmedIssues,
  rejectedIssues,
  rewriteContent,
  targetUser,
  onSaveToProfile,
}: ExportViewProps) {
  const [copiedRewrite, setCopiedRewrite] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  const delta = finalScore - originalScore;
  const issuesFound = issues.length;
  const issuesFixed = confirmedIssues.length;
  const issuesRejected = rejectedIssues.length;

  // Calculate estimated users saved
  const calculateEstimatedUsersSaved = () => {
    let totalWeight = 0;
    const confirmedList = issues.filter((i) => confirmedIssues.includes(i.id));
    for (const i of confirmedList) {
      if (i.type === 'MISSING_PREREQ' || i.type === 'BROKEN_COMMAND' || i.type === 'FIRST_PARAGRAPH') {
        totalWeight += 2.5;
      } else if (i.type === 'WRONG_ORDER' || i.type === 'ASSUMPTION' || i.type === 'MISSING_SECTION') {
        totalWeight += 1.6;
      } else {
        totalWeight += 0.8;
      }
    }
    const count = Math.min(9, Math.max(1, Math.round(totalWeight)));
    if (count <= 1) return "estimated 0-1 out of 10 first-timers";
    return `estimated ${count - 1}-${count} out of 10 first-timers`;
  };

  const handleDownload = () => {
    const blob = new Blob([rewriteContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRewrite = () => {
    navigator.clipboard.writeText(rewriteContent);
    setCopiedRewrite(true);
    setTimeout(() => setCopiedRewrite(false), 2000);
  };

  const handleCopyReport = () => {
    const reportText = `# Doc Brutalist Report
Generated: ${new Date().toLocaleDateString()}

## Scores
Original Clarity: ${originalScore}/100
After Fixes: ${finalScore}/100
Improvement: +${delta} points

## Issues Found (${issuesFound} total)
${issues.map((i, idx) => {
  const isConfirmed = confirmedIssues.includes(i.id);
  return `
### Issue ${idx + 1}: ${i.type} [${i.severity}]
Location: "${i.location}"
Problem: ${i.problem}
Fix: ${i.fix}
Drop-off weight: ${i.drop_off_weight}/10
Status: ${isConfirmed ? '✓ Confirmed' : '✗ Not applicable'}`;
}).join('\n')}
`;
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleSaveProfile = async () => {
    await onSaveToProfile();
    setSavedProfile(true);
  };

  return (
    <div className={styles.exportContainer}>
      <div className={styles.exportStats}>
        <h3 className={styles.statsTitle}>Brutality Metrics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Clarity Score</span>
            <span className={styles.statVal}>
              {originalScore}/100 → {finalScore}/100{' '}
              <span className={styles.scoreDeltaHighlight}>↑ +{delta} points</span>
            </span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>Issues Found</span>
            <span className={styles.statVal}>{issuesFound}</span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>Issues Fixed (Confirmed)</span>
            <span className={styles.statVal}>{issuesFixed}</span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>Marked Not Applicable</span>
            <span className={styles.statVal}>{issuesRejected}</span>
          </div>

          <div className={styles.statRow}>
            <span className={styles.statLabel}>Users Saved</span>
            <span className={styles.statVal} style={{ color: 'var(--color-valid)' }}>
              {calculateEstimatedUsersSaved()}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.actionCards}>
        <div className={styles.exportActionCard} onClick={handleDownload}>
          <div className={styles.exportCardInfo}>
            <span className={styles.exportCardTitle}>Download README.md</span>
            <span className={styles.exportCardDesc}>Download approved rewrite documentation.</span>
          </div>
          <button className={styles.exportIconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>

        <div className={styles.exportActionCard} onClick={handleCopyRewrite}>
          <div className={styles.exportCardInfo}>
            <span className={styles.exportCardTitle}>
              {copiedRewrite ? 'Copied!' : 'Copy to Clipboard'}
            </span>
            <span className={styles.exportCardDesc}>Copy the full rewritten text to clipboard.</span>
          </div>
          <button className={styles.exportIconBtn} style={{ backgroundColor: copiedRewrite ? 'var(--color-valid)' : 'var(--brutalist)' }}>
            {copiedRewrite ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>

        <div className={styles.exportActionCard} onClick={handleCopyReport}>
          <div className={styles.exportCardInfo}>
            <span className={styles.exportCardTitle}>
              {copiedReport ? 'Copied Report!' : 'Copy Issues Report'}
            </span>
            <span className={styles.exportCardDesc}>Copy issue descriptions for task tracking.</span>
          </div>
          <button className={styles.exportIconBtn} style={{ backgroundColor: copiedReport ? 'var(--color-valid)' : 'var(--brutalist)' }}>
            {copiedReport ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            )}
          </button>
        </div>

        <button
          className={`${styles.saveProfileBtn} ${savedProfile ? styles.saveProfileBtnSuccess : ''}`}
          onClick={savedProfile ? undefined : handleSaveProfile}
        >
          {savedProfile ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Saved to Intelligence Profile</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save to Profile</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
