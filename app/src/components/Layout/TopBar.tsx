import { useLocation, useNavigate } from 'react-router-dom';
import styles from './TopBar.module.css';

const ROUTE_LABELS: Record<string, string> = {
  '/':            'Dashboard',
  '/archaeology': 'Prompt Archaeology',
  '/advocate':    "Devil's Advocate",
  '/babysitter':  'Agent Babysitter',
  '/learning':    'Learning Path',
  '/profile':     'Intelligence Profile',
};

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className={styles.topbar}>
      <nav className={styles.breadcrumb} aria-label="Current mode">
        <span className={styles.breadRoot}>Mirror</span>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>{ROUTE_LABELS[location.pathname] ?? 'Mirror'}</span>
      </nav>

      <div className={styles.actions}>
        <button
          className={styles.profileOrb}
          onClick={() => navigate('/profile')}
          aria-label="Open Intelligence Profile"
          id="topbar-profile-btn"
          title="View your Intelligence Profile"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="12" cy="12" r="7"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
