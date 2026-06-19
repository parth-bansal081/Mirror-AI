import { useState, useEffect } from 'react';
import styles from './ScoreRing.module.css';

interface ScoreRingProps {
  score: number;        // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 41) return 'var(--warning)';
  return 'var(--danger)';
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'READY';
  if (score >= 41) return 'PARTIAL';
  return 'NOT READY';
}

export default function ScoreRing({ score, size = 160, strokeWidth = 8, label }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200;
    setIsComplete(false);

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = eased * score;
      setDisplayScore(currentVal);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayScore(score);
        setIsComplete(true);
      }
    };

    requestAnimationFrame(step);
  }, [score]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div
      className={`${styles.container} ${isComplete ? styles.complete : ''}`}
      style={{ width: size, height: size, '--score-color': color } as React.CSSProperties}
    >
      <svg
        className={styles.svg}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-label={`Score: ${score}%`}
      >
        {/* Glowing track background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-hi)"
          strokeWidth={strokeWidth}
          className={styles.track}
        />
        {/* Progress fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={styles.fill}
          style={{ transition: 'stroke 400ms' }}
        />
      </svg>

      <div className={styles.center}>
        <div className={styles.numberWrapper}>
          <span className={styles.value} style={{ color }}>{Math.round(displayScore)}</span>
          <span className={styles.percent}>%</span>
        </div>
        <span className={styles.status} style={{ color }}>{label ?? scoreLabel(score)}</span>
      </div>
    </div>
  );
}
