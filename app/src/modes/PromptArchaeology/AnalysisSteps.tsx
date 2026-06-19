import StepReveal, { Step } from '../../components/UI/StepReveal';
import styles from './AnalysisSteps.module.css';

interface AnalysisStepsProps {
  steps: Step[];
  currentStep: number;
  isAnalyzing: boolean;
}

export default function AnalysisSteps({ steps, currentStep, isAnalyzing }: AnalysisStepsProps) {
  const progress = Math.round((currentStep / steps.length) * 100);

  return (
    <div className={styles.container}>
      <div className="glass-panel" data-mode="archaeology" style={{ padding: 'var(--space-6)' }}>
        <p className={styles.headline}>
          {isAnalyzing ? 'Analyzing…' : 'Analysis Complete'}
        </p>

        <div className={styles.steps}>
          <StepReveal
            steps={steps}
            currentStep={currentStep}
            isAnalyzing={isAnalyzing}
            accentColor="var(--mode-archaeology)"
          />
        </div>

        {/* Progress bar */}
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
          <span className={styles.progressLabel}>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
