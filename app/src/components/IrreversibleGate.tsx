import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './IrreversibleGate.module.css';

interface IrreversibleGateProps {
  action: string;          // The specific action about to happen
  stepDescription: string; // What step this is
  driftStatus?: 'coherent' | 'drifting' | null;
  onApprove: () => void;
  onReject: () => void;
}

export default function IrreversibleGate({
  action,
  stepDescription,
  driftStatus,
  onApprove,
  onReject,
}: IrreversibleGateProps) {
  const approveRef = useRef<HTMLButtonElement>(null);

  // Trap focus — do not allow Escape to dismiss
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    approveRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      // Block Escape — IrreversibleGate can ONLY be dismissed via Approve/Reject
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      prev?.focus();
    };
  }, []);

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="irr-title"
      aria-describedby="irr-desc"
      // Clicking outside does NOTHING — must use buttons
    >
      <div className={styles.modal}>
        {/* Icon */}
        <div className={styles.icon} aria-hidden="true" style={{ color: 'var(--color-danger)', background: 'rgba(255, 92, 92, 0.1)', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ⛔
        </div>

        <h2 id="irr-title" className={styles.title} style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
          ⛔ IRREVERSIBLE ACTION DETECTED
        </h2>

        <p id="irr-desc" className={styles.subtitle}>
          The agent is about to perform an action that <strong>cannot be undone</strong>.
        </p>

        {/* Step context */}
        <div className={styles.contextBlock}>
          <span className={styles.contextLabel}>Step</span>
          <span className={styles.contextValue}>{stepDescription}</span>
        </div>

        {/* The action */}
        <div className={styles.actionBlock}>
          <span className={styles.actionLabel}>Action</span>
          <p className={styles.actionText}>{action}</p>
        </div>

        {/* Drift status */}
        {driftStatus && (
          <div className={`${styles.driftStatus} ${driftStatus === 'drifting' ? styles.driftStatusWarn : styles.driftStatusOk}`}>
            <span className={styles.driftDot} />
            {driftStatus === 'coherent'
              ? 'Drift check: No issues — content matches original goal'
              : 'Warning: Drift detected — review carefully before approving'}
          </div>
        )}

        {/* Warning */}
        <p className={styles.warning}>This CANNOT be undone. Review carefully.</p>

        {/* Actions */}
        <div className={styles.buttons}>
          <button
            className={styles.btnReject}
            onClick={onReject}
            id="irr-reject-btn"
          >
            ✗ Reject &amp; Stop
          </button>
          <button
            ref={approveRef}
            className={styles.btnApprove}
            onClick={onApprove}
            id="irr-approve-btn"
          >
            ✓ Approve &amp; Continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
