import { useEffect, useState } from 'react';
import styles from './StepReveal.module.css';
import LoadingOrb from './LoadingOrb';

export interface Step {
  id: string;
  label: string;
  content?: string;
}

interface StepRevealProps {
  steps: Step[];
  currentStep: number;   // 0-indexed; steps[0..currentStep-1] are complete
  isAnalyzing: boolean;
  accentColor?: string;
}

export default function StepReveal({ steps, currentStep, isAnalyzing, accentColor = 'var(--color-signal)' }: StepRevealProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    setVisibleSteps(currentStep);
  }, [currentStep]);

  return (
    <div className={styles.container}>
      {steps.map((step, idx) => {
        const isComplete = idx < currentStep;
        const isActive = idx === currentStep && isAnalyzing;
        const isPending = idx > currentStep;
        const isVisible = idx <= currentStep || (isAnalyzing && idx === currentStep);

        return (
          <div
            key={step.id}
            className={`${styles.step} ${isVisible ? styles.stepVisible : ''}`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Dot */}
            <div className={styles.stepLeft}>
              <span
                className={`${styles.dot} ${isComplete ? styles.dotComplete : ''} ${isActive ? styles.dotActive : ''} ${isPending ? styles.dotPending : ''}`}
                style={isComplete || isActive ? { background: accentColor } : undefined}
              />
              {idx < steps.length - 1 && (
                <span className={`${styles.connector} ${isComplete ? styles.connectorComplete : ''}`} />
              )}
            </div>

            {/* Content */}
            <div className={styles.stepBody}>
              <div className={styles.stepHeader}>
                <span
                  className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''} ${isComplete ? styles.stepLabelComplete : ''} ${isPending ? styles.stepLabelPending : ''}`}
                  style={isActive ? { color: accentColor } : undefined}
                >
                  {step.label}
                </span>
                {isActive && <LoadingOrb size={16} />}
                {isComplete && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-valid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              {isComplete && step.content && (
                <p className={styles.stepContent}>{step.content}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
