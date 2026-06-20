import React from 'react';
import { Issue } from '../../store/types';
import styles from './DocBrutalist.module.css';

interface SideBySideViewProps {
  originalDoc: string;
  issues: Issue[];
  acceptedImprovements: string[]; // list of section titles that are accepted
  rejectedImprovements: string[]; // list of section titles that are rejected
  onAcceptImprovement: (sectionTitle: string) => void;
  onRejectImprovement: (sectionTitle: string) => void;
}

export default function SideBySideView({
  originalDoc,
  issues,
  acceptedImprovements,
  rejectedImprovements,
  onAcceptImprovement,
  onRejectImprovement,
}: SideBySideViewProps) {
  // Parse document into sections by headings
  const splitIntoSections = (doc: string) => {
    const lines = doc.split('\n');
    const sections: { title: string; content: string }[] = [];
    let currentTitle = 'Introduction';
    let currentContent: string[] = [];

    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentContent.length > 0 || currentTitle !== 'Introduction') {
          sections.push({ title: currentTitle, content: currentContent.join('\n') });
        }
        currentTitle = line.replace(/^#+\s+/, '').trim() || 'Heading';
        currentContent = [line];
      } else {
        currentContent.push(line);
      }
    }
    if (currentContent.length > 0) {
      sections.push({ title: currentTitle, content: currentContent.join('\n') });
    }
    return sections;
  };

  const sections = splitIntoSections(originalDoc);

  // Helper to match issues with section contents
  const getSectionIssues = (content: string) => {
    return issues.filter((issue) => {
      if (!issue.location) return false;
      return content.toLowerCase().includes(issue.location.toLowerCase());
    });
  };

  const getSectionImprovement = (content: string, sectionIssues: Issue[]) => {
    let originalHtml = content;
    let improvedHtml = content;
    let hasImprovement = false;

    // Escaping helper
    const escapeHtml = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    // Initialize with escaped text to avoid HTML injection except our custom highlight tags
    originalHtml = escapeHtml(originalHtml);
    improvedHtml = escapeHtml(improvedHtml);

    for (const issue of sectionIssues) {
      if (!issue.location) continue;
      const escapedLoc = escapeHtml(issue.location);
      const pos = originalHtml.indexOf(escapedLoc);
      if (pos >= 0) {
        hasImprovement = true;
        // original highlighting in red
        originalHtml = originalHtml.replace(
          escapedLoc,
          `<span class="${styles.highlightedProblem}">${escapedLoc}</span>`
        );

        // improved text replacements
        let fixReplacement = escapeHtml(issue.fix);
        if (issue.type === 'FIRST_PARAGRAPH') {
          fixReplacement = `${escapedLoc}\n\nRun and schedule terminal commands from a config file. No scripting.`;
        } else if (issue.type === 'MISSING_PREREQ') {
          fixReplacement = `### Before you start\n- Node.js 18.0 or higher\n\n${escapedLoc}`;
        } else if (issue.type === 'JARGON') {
          fixReplacement = `a tool that runs task automation`;
        }

        // improved highlighting in green
        improvedHtml = improvedHtml.replace(
          escapedLoc,
          `<span class="${styles.highlightedSolution}">${fixReplacement}</span>`
        );
      }
    }

    return { originalHtml, improvedHtml, hasImprovement };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.colHeader}>Original Content</div>
        <div className={styles.colHeader}>Brutalist Improvements</div>
      </div>

      <div className={styles.sideBySideContainer}>
        {sections.map((section, idx) => {
          const sectionIssues = getSectionIssues(section.content);
          const { originalHtml, improvedHtml, hasImprovement } = getSectionImprovement(
            section.content,
            sectionIssues
          );

          const isAccepted = acceptedImprovements.includes(section.title);
          const isRejected = rejectedImprovements.includes(section.title);
          const status: 'unreviewed' | 'accepted' | 'rejected' = isAccepted
            ? 'accepted'
            : isRejected
            ? 'rejected'
            : 'unreviewed';

          return (
            <div key={idx} className={styles.sectionRow}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brutalist-text)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>
                Section: {section.title}
              </div>

              <div className={styles.sectionGrid}>
                {/* Original Column */}
                <div
                  className={`${styles.pane} ${styles.paneOriginal}`}
                  dangerouslySetInnerHTML={{ __html: originalHtml }}
                />

                {/* Improved Column */}
                <div
                  className={styles.pane}
                  style={{ opacity: status === 'rejected' ? 0.35 : 1 }}
                  dangerouslySetInnerHTML={{
                    __html: status === 'rejected' ? originalHtml : improvedHtml,
                  }}
                />
              </div>

              {hasImprovement && (
                <div className={styles.sectionActions}>
                  <button
                    className={`${styles.useImprovementBtn} ${status === 'accepted' ? styles.useImprovementActive : ''}`}
                    onClick={() => onAcceptImprovement(section.title)}
                  >
                    ✓ Use improvement
                  </button>
                  <button
                    className={`${styles.keepOriginalBtn} ${status === 'rejected' ? styles.keepOriginalActive : ''}`}
                    onClick={() => onRejectImprovement(section.title)}
                  >
                    ✗ Keep original
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
