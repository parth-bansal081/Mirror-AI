import React from 'react';
import { Issue } from '../../store/types';
import styles from './DocBrutalist.module.css';

interface IssueCardProps {
  issue: Issue;
  index: number;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  status: 'unreviewed' | 'confirmed' | 'rejected';
}

const ISSUE_COLORS: Record<string, string> = {
  FIRST_PARAGRAPH:   '#EF4444',  // red — critical
  MISSING_PREREQ:    '#EF4444',  // red — critical
  BROKEN_COMMAND:    '#EF4444',  // red — critical
  WRONG_ORDER:       '#F59E0B',  // amber — high
  ASSUMPTION:        '#F59E0B',  // amber — high
  MISSING_SECTION:   '#F59E0B',  // amber — high
  JARGON:            '#6B7280',  // gray — medium
  CONFUSING_LABEL:   '#6B7280',  // gray — medium
  NO_EXPECTED_OUTPUT:'#6B7280',  // gray — medium
  TOO_LONG:          '#3B82F6',  // blue — low
};

export default function IssueCard({
  issue,
  index,
  onConfirm,
  onReject,
  status,
}: IssueCardProps) {
  const badgeColor = ISSUE_COLORS[issue.type] || '#6B7280';

  let cardClass = styles.issueCard;
  if (status === 'confirmed') cardClass += ` ${styles.issueCardConfirmed}`;
  if (status === 'rejected') cardClass += ` ${styles.issueCardRejected}`;

  return (
    <div className={cardClass} id={`issue-card-${issue.id}`}>
      <div className={styles.cardHead}>
        <span className={styles.issueNumber}>ISSUE #{index + 1}</span>
        <span
          className={styles.issueBadge}
          style={{ backgroundColor: badgeColor }}
        >
          {issue.type.replace('_', ' ')}
        </span>
      </div>

      <div className={styles.problemText}>
        ⚠ {issue.problem}
      </div>

      <div className={styles.locationQuote}>
        "{issue.location}"
      </div>

      <div className={styles.fixText}>
        <strong>Fix:</strong> {issue.fix}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Severity: <strong style={{ color: issue.severity === 'HIGH' ? '#EF4444' : issue.severity === 'MEDIUM' ? '#F59E0B' : '#3B82F6' }}>{issue.severity}</strong>
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
          Drop-off: <strong>{issue.drop_off_weight}/10</strong>
        </span>
      </div>

      <div className={styles.actionButtons}>
        <button
          className={`${styles.actionBtn} ${styles.confirmBtn} ${status === 'confirmed' ? styles.confirmBtnActive : ''}`}
          onClick={() => onConfirm(issue.id)}
        >
          <span>✓ Real issue</span>
        </button>
        <button
          className={`${styles.actionBtn} ${styles.rejectBtn} ${status === 'rejected' ? styles.rejectBtnActive : ''}`}
          onClick={() => onReject(issue.id)}
        >
          <span>✗ Not applicable</span>
        </button>
      </div>
    </div>
  );
}
