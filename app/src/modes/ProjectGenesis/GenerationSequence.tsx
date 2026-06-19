import { useState, useEffect } from 'react';
import styles from './ProjectGenesis.module.css';

interface GenerationSequenceProps {
  loading: boolean;
  onComplete: () => void;
}

const DOCS_LIST = [
  { key: 'PRD', label: '1. Product Requirements Document (PRD)' },
  { key: 'TECH_SPEC', label: '2. Technical Specification (TECH_SPEC)' },
  { key: 'APP_FLOW', label: '3. Navigation & User App Flow (APP_FLOW)' },
  { key: 'DESIGN', label: '4. CSS Theme & Design Specs (DESIGN)' },
  { key: 'SCHEMA', label: '5. TypeScript types & Data Schema (SCHEMA)' },
  { key: 'IMPLEMENTATION_PLAN', label: '6. Detailed Build phases (IMPLEMENTATION_PLAN)' },
  { key: 'TRACKER', label: '7. Build Tracker Task Checklist (TRACKER)' },
  { key: 'RULES', label: '8. Agent Code Enforcement Rules (RULES)' },
];

export default function GenerationSequence({ loading, onComplete }: GenerationSequenceProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => {
        if (prev < DOCS_LIST.length) {
          return prev + 1;
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 800);

    return () => clearInterval(timer);
  }, []);

  // When both the background call is done AND the animation list has finished showing
  useEffect(() => {
    if (!loading && activeIdx >= DOCS_LIST.length) {
      const delay = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(delay);
    }
  }, [loading, activeIdx, onComplete]);

  return (
    <div className={styles.genBox}>
      <div className={styles.spinnerOrb}>
        <div className={styles.spinnerOrbInner} />
      </div>

      <div className={styles.genStatusText}>
        {activeIdx < DOCS_LIST.length ? 'Sequencing Project DNA...' : 'Packaging build bundle...'}
      </div>

      <div className={styles.genTimeline}>
        {DOCS_LIST.map((doc, i) => {
          let status: 'pending' | 'generating' | 'complete' = 'pending';
          if (i === activeIdx) {
            status = 'generating';
          } else if (i < activeIdx) {
            status = 'complete';
          }

          return (
            <div
              key={doc.key}
              className={`${styles.genTimelineItem} ${
                status === 'generating'
                  ? styles.genTimelineItemActive
                  : status === 'complete'
                  ? styles.genTimelineItemComplete
                  : ''
              }`}
            >
              <span>{doc.label}</span>
              <div className={styles.genTimelineIndicator}>
                {status === 'pending' && (
                  <span className={`${styles.genBadge} ${styles.genBadgePending}`}>Pending</span>
                )}
                {status === 'generating' && (
                  <span className={`${styles.genBadge} ${styles.genBadgeActive}`}>Generating</span>
                )}
                {status === 'complete' && (
                  <span className={`${styles.genBadge} ${styles.genBadgeComplete}`}>Complete</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
