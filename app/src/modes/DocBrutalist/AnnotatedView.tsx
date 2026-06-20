import React from 'react';
import { Issue } from '../../store/types';
import IssueCard from './IssueCard';
import styles from './DocBrutalist.module.css';

interface AnnotatedViewProps {
  originalDoc: string;
  issues: Issue[];
  confirmedIssues: string[];
  rejectedIssues: string[];
  onConfirmIssue: (id: string) => void;
  onRejectIssue: (id: string) => void;
}

export default function AnnotatedView({
  originalDoc,
  issues,
  confirmedIssues,
  rejectedIssues,
  onConfirmIssue,
  onRejectIssue,
}: AnnotatedViewProps) {
  // Split original doc into paragraphs or lines to display inline annotations
  const paragraphs = originalDoc.split(/\n\n+/);

  // Helper to find issues belonging to a paragraph
  const getIssuesForParagraph = (pText: string) => {
    return issues.filter((issue) => {
      if (!issue.location) return false;
      return pText.toLowerCase().includes(issue.location.toLowerCase());
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.issueHeaderPanel}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>
          YOUR ORIGINAL DOCUMENT — {issues.length} issues found
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
          Review each issue inline. Confirmed issues will be addressed in the rewrite.
        </p>
      </div>

      <div className={styles.docScroller}>
        {paragraphs.map((pText, pIdx) => {
          const paragraphIssues = getIssuesForParagraph(pText);
          const hasIssues = paragraphIssues.length > 0;

          return (
            <div key={pIdx} style={{ marginBottom: 'var(--space-6)' }}>
              {/* Render paragraph text */}
              <p
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  color: hasIssues ? '#FFFFFF' : 'var(--color-text-secondary)',
                  background: hasIssues ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                  padding: hasIssues ? 'var(--space-2)' : 0,
                  borderRadius: hasIssues ? '4px' : 0,
                  borderLeft: hasIssues ? '2px solid var(--brutalist-glow)' : 'none',
                }}
              >
                {pText}
              </p>

              {/* Render matching issue cards inline directly under the paragraph */}
              {paragraphIssues.map((issue) => {
                const index = issues.findIndex((i) => i.id === issue.id);
                let status: 'unreviewed' | 'confirmed' | 'rejected' = 'unreviewed';
                if (confirmedIssues.includes(issue.id)) status = 'confirmed';
                if (rejectedIssues.includes(issue.id)) status = 'rejected';

                return (
                  <div key={issue.id} style={{ marginTop: 'var(--space-4)', maxWidth: '650px' }}>
                    <IssueCard
                      issue={issue}
                      index={index}
                      status={status}
                      onConfirm={onConfirmIssue}
                      onReject={onRejectIssue}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
