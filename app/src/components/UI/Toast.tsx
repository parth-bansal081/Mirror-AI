import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Toast.module.css';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  kind?: ToastKind;
  duration?: number;
  onDismiss: () => void;
}

export default function Toast({ message, kind = 'info', duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return createPortal(
    <div
      className={`${styles.toast} ${styles[kind]}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.dot} />
      <span className={styles.message}>{message}</span>
      <button className={styles.close} onClick={onDismiss} aria-label="Dismiss notification">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>,
    document.body
  );
}
