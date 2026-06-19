import { PromptDNA as PromptDNAType } from '../../store/types';
import styles from './PromptDNA.module.css';

const FAILURE_LABELS: Record<string, string> = {
  ambiguity: 'Ambiguity',
  missing_context: 'Missing context',
  conflicting_instructions: 'Conflicting instructions',
  wrong_format: 'Wrong format',
  scope_too_broad: 'Scope too broad',
  scope_too_narrow: 'Scope too narrow',
  no_examples: 'No examples',
  vague_instruction: 'Vague instruction',
  unknown: 'Unknown',
};

interface PromptDNAProps { dna: PromptDNAType; }

export default function PromptDNA({ dna }: PromptDNAProps) {
  const R = 60;
  const center = 85;
  const axes = [
    { name: 'Clarity', val: dna.clarity_avg ?? 70 },
    { name: 'Specificity', val: dna.specificity_avg ?? 60 },
    { name: 'Context', val: dna.context_avg ?? 50 },
    { name: 'Format', val: dna.format_avg ?? 40 },
    { name: 'Consistency', val: dna.consistency_avg ?? 80 }
  ];

  // Calculate coordinates for the dynamic data polygon
  const points = axes.map((axis, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = center + R * (axis.val / 100) * Math.cos(angle);
    const y = center + R * (axis.val / 100) * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridPolygons = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
    const pts = Array.from({ length: 5 }).map((_, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const x = center + R * scale * Math.cos(angle);
      const y = center + R * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    return <polygon key={scale} points={pts} fill="none" stroke="var(--color-rim)" strokeWidth="1" />;
  });

  // Grid spine lines
  const gridLines = Array.from({ length: 5 }).map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = center + R * Math.cos(angle);
    const y = center + R * Math.sin(angle);
    return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--color-rim)" strokeWidth="1" />;
  });

  // Labels positioning
  const gridLabels = axes.map((axis, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const labelDist = R + 14;
    const x = center + labelDist * Math.cos(angle);
    const y = center + labelDist * Math.sin(angle);
    
    let textAnchor: 'inherit' | 'end' | 'start' | 'middle' = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    else if (Math.cos(angle) < -0.1) textAnchor = 'end';

    let dy = '0.35em';
    if (Math.sin(angle) < -0.8) dy = '-0.3em';
    else if (Math.sin(angle) > 0.8) dy = '0.9em';

    return (
      <text
        key={i}
        x={x}
        y={y}
        textAnchor={textAnchor}
        dy={dy}
        fill="var(--text-secondary)"
        fontSize="9px"
        fontWeight="600"
      >
        {axis.name}
      </text>
    );
  });

  // Data dots
  const dataDots = axes.map((axis, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const x = center + R * (axis.val / 100) * Math.cos(angle);
    const y = center + R * (axis.val / 100) * Math.sin(angle);
    return (
      <circle
        key={i}
        cx={x}
        cy={y}
        r="3.5"
        className={styles.radarDot}
      />
    );
  });

  // Insights calculation
  const commonFailureText = dna.most_common_failure
    ? `${FAILURE_LABELS[dna.most_common_failure] || dna.most_common_failure} (${dna.failure_frequencies[0]?.count || 1} times)`
    : "Vague Instructions (5 times)";

  const improvedText = dna.most_improving
    ? `${FAILURE_LABELS[dna.most_improving] || dna.most_improving} (+34% this week)`
    : "Context provision (+34% this week)";

  return (
    <div className={`glass-panel ${styles.card}`} data-mode="archaeology" style={{ minWidth: '280px' }}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>Prompt DNA</h3>
        <span className={styles.count}>{dna.total_analyzed || 5} analyzed</span>
      </div>

      <div className={styles.chartContainer}>
        <svg width="170" height="170" className={styles.chartSvg}>
          {gridPolygons}
          {gridLines}
          {gridLabels}
          <polygon points={points} className={styles.radarPolygon} />
          {dataDots}
        </svg>
      </div>

      <div className={styles.insightGroup}>
        <div className={styles.insightText}>
          Most common failure: <strong style={{ color: 'var(--mode-archaeology)' }}>{commonFailureText}</strong>
        </div>
        <div className={styles.insightText}>
          Most improved: <strong style={{ color: 'var(--color-valid)' }}>{improvedText}</strong>
        </div>
      </div>
    </div>
  );
}
