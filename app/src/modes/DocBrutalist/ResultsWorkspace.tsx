import React, { useState } from 'react';
import { Issue } from '../../store/types';
import AnnotatedView from './AnnotatedView';
import SideBySideView from './SideBySideView';
import RewriteView from './RewriteView';
import ExportView from './ExportView';
import styles from './DocBrutalist.module.css';

interface ResultsWorkspaceProps {
  originalDoc: string;
  baseScore: number;
  clarityVerdict: string;
  estimatedFailureRate: string;
  issues: Issue[];
  confirmedIssues: string[];
  setConfirmedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  rejectedIssues: string[];
  setRejectedIssues: React.Dispatch<React.SetStateAction<string[]>>;
  acceptedImprovements: string[];
  setAcceptedImprovements: React.Dispatch<React.SetStateAction<string[]>>;
  rejectedImprovements: string[];
  setRejectedImprovements: React.Dispatch<React.SetStateAction<string[]>>;
  rewriteContent: string;
  setRewriteContent: (content: string) => void;
  targetUser: string;
  onSaveToProfile: (finalScore: number) => Promise<void>;
  onGenerateRewrite: () => void;
}

export default function ResultsWorkspace({
  originalDoc,
  baseScore,
  clarityVerdict,
  estimatedFailureRate,
  issues,
  confirmedIssues,
  setConfirmedIssues,
  rejectedIssues,
  setRejectedIssues,
  acceptedImprovements,
  setAcceptedImprovements,
  rejectedImprovements,
  setRejectedImprovements,
  rewriteContent,
  setRewriteContent,
  targetUser,
  onSaveToProfile,
  onGenerateRewrite,
}: ResultsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'annotated' | 'sidebyside' | 'rewrite' | 'export'>('annotated');

  // Recalculate score based on confirmed issues vs total issues
  const calculateFinalScore = () => {
    const totalWeight = issues.reduce((sum, i) => sum + i.drop_off_weight, 0);
    const confirmedIssuesList = issues.filter((i) => confirmedIssues.includes(i.id));
    const confirmedWeight = confirmedIssuesList.reduce((sum, i) => sum + i.drop_off_weight, 0);

    const improvement = (confirmedWeight / Math.max(totalWeight, 1)) * (100 - baseScore);
    return Math.min(100, Math.round(baseScore + improvement));
  };

  const finalScore = calculateFinalScore();

  // Color helper for clarity score
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'var(--color-valid)'; // green
    if (score >= 41) return 'var(--color-warn)';  // amber
    return 'var(--brutalist)';                    // harsh red
  };

  const handleConfirmIssue = (id: string) => {
    setConfirmedIssues((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setRejectedIssues((prev) => prev.filter((i) => i !== id));
  };

  const handleRejectIssue = (id: string) => {
    setRejectedIssues((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setConfirmedIssues((prev) => prev.filter((i) => i !== id));
  };

  const handleAcceptImprovement = (sectionTitle: string) => {
    setAcceptedImprovements((prev) => {
      if (prev.includes(sectionTitle)) return prev;
      return [...prev, sectionTitle];
    });
    setRejectedImprovements((prev) => prev.filter((t) => t !== sectionTitle));
  };

  const handleRejectImprovement = (sectionTitle: string) => {
    setRejectedImprovements((prev) => {
      if (prev.includes(sectionTitle)) return prev;
      return [...prev, sectionTitle];
    });
    setAcceptedImprovements((prev) => prev.filter((t) => t !== sectionTitle));
  };

  const handleTabClick = (tab: 'annotated' | 'sidebyside' | 'rewrite' | 'export') => {
    if (tab === 'rewrite' && !rewriteContent) {
      // Trigger rewrite generation if not generated yet
      onGenerateRewrite();
    }
    setActiveTab(tab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Workspace Header */}
      <div className={styles.workspaceHeader}>
        <div>
          <h2 className={styles.title} style={{ fontSize: '1.6rem', margin: 0 }}>
            ✂ DOC BRUTALIST — Results
          </h2>
          <div className={styles.verdictBox}>
            {clarityVerdict} <br />
            <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>
              {estimatedFailureRate}
            </span>
          </div>
        </div>

        <div className={styles.scoreContainer}>
          <span className={styles.scoreLabel}>Clarity</span>
          <span className={styles.scoreVal} style={{ color: getScoreColor(finalScore) }}>
            {finalScore}/100
          </span>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabButton} ${activeTab === 'annotated' ? styles.activeTabButton : ''}`}
          onClick={() => handleTabClick('annotated')}
        >
          Annotated Original
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'sidebyside' ? styles.activeTabButton : ''}`}
          onClick={() => handleTabClick('sidebyside')}
        >
          Side by Side
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'rewrite' ? styles.activeTabButton : ''}`}
          onClick={() => handleTabClick('rewrite')}
        >
          Full Rewrite
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'export' ? styles.activeTabButton : ''}`}
          onClick={() => handleTabClick('export')}
        >
          Export
        </button>
      </div>

      {/* Workspace Content */}
      <div className={styles.workspaceContent}>
        {activeTab === 'annotated' && (
          <AnnotatedView
            originalDoc={originalDoc}
            issues={issues}
            confirmedIssues={confirmedIssues}
            rejectedIssues={rejectedIssues}
            onConfirmIssue={handleConfirmIssue}
            onRejectIssue={handleRejectIssue}
          />
        )}

        {activeTab === 'sidebyside' && (
          <SideBySideView
            originalDoc={originalDoc}
            issues={issues}
            acceptedImprovements={acceptedImprovements}
            rejectedImprovements={rejectedImprovements}
            onAcceptImprovement={handleAcceptImprovement}
            onRejectImprovement={handleRejectImprovement}
          />
        )}

        {activeTab === 'rewrite' && (
          <RewriteView
            rewriteContent={rewriteContent}
            onContentChange={setRewriteContent}
            onReset={onGenerateRewrite}
          />
        )}

        {activeTab === 'export' && (
          <ExportView
            originalScore={baseScore}
            finalScore={finalScore}
            issues={issues}
            confirmedIssues={confirmedIssues}
            rejectedIssues={rejectedIssues}
            rewriteContent={rewriteContent}
            targetUser={targetUser}
            onSaveToProfile={async () => {
              await onSaveToProfile(finalScore);
            }}
          />
        )}
      </div>
    </div>
  );
}
