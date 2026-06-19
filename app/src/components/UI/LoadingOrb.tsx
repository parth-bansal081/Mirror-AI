import styles from './LoadingOrb.module.css';

interface LoadingOrbProps {
  size?: number;
}

export default function LoadingOrb({ size = 48 }: LoadingOrbProps) {
  return (
    <div
      className={styles.orb}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <span className={`${styles.particle} ${styles.p1}`} />
      <span className={`${styles.particle} ${styles.p2}`} />
      <span className={`${styles.particle} ${styles.p3}`} />
    </div>
  );
}
