import React, { useEffect, useState } from 'react';
import styles from './DocBrutalist.module.css';

interface AnalysisProgressProps {
  onComplete: () => void;
}

const STEPS = [
  "First paragraph test...",
  "Time to first success audit...",
  "Assumption scanner...",
  "Jargon detector...",
  "Copy-paste failure check...",
  "Missing sections audit...",
  "Generating rewrite...",
];

const QUOTES = [
  "Reading your docs as a confused developer would...",
  "Finding every assumption you made...",
  "Counting how many users this loses you...",
  "Locating the commands that will fail...",
  "Building the honest version...",
];

export default function AnalysisProgress({ onComplete }: AnalysisProgressProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);

  useEffect(() => {
    // Increment analysis step index every 1100ms
    const stepInterval = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(stepInterval);
          // Wait slightly before completing to let the user see 100% progress
          setTimeout(onComplete, 600);
          return STEPS.length;
        }
        return prev + 1;
      });
    }, 1100);

    return () => clearInterval(stepInterval);
  }, [onComplete]);

  useEffect(() => {
    // Rotate quote index every 1600ms
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 1600);

    return () => clearInterval(quoteInterval);
  }, []);

  const progressPercentage = Math.min(100, Math.round((currentStepIdx / STEPS.length) * 100));

  return (
    <div className={styles.progressCard}>
      <div className={styles.progressHeader}>
        <div className={styles.progressSpinner} />
        <h2 className={styles.title} style={{ fontSize: '1.4rem', margin: 0 }}>
          BRUTALIZING YOUR DOCS...
        </h2>
      </div>

      <div className={styles.progressSteps}>
        {STEPS.map((step, idx) => {
          let statusClass = '';
          if (idx < currentStepIdx) statusClass = styles.stepCompleted;
          else if (idx === currentStepIdx) statusClass = styles.stepActive;

          return (
            <div key={step} className={`${styles.stepRow} ${statusClass}`}>
              <div className={styles.stepDot} />
              <span className={styles.stepLabel}>{step}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: 'var(--space-4)' }}>
        <span>Analyzing issues...</span>
        <span>{progressPercentage}%</span>
      </div>

      <div className={styles.rotatingQuote}>
        "{QUOTES[currentQuoteIdx]}"
      </div>
    </div>
  );
}
