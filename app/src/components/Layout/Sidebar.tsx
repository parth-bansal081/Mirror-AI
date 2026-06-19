import { NavLink } from 'react-router-dom';
import { useProfileStore } from '../../store/profileStore';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  );
}

function ArchaeologyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
      <path d="M11 8v6M8 11h6"/>
    </svg>
  );
}

function AdvocateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  );
}

function BabysitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 5V3"/>
      <path d="M12 21v-2"/>
    </svg>
  );
}

function LearningPathIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <circle cx="12" cy="12" r="7"/>
      <circle cx="12" cy="12" r="11"/>
    </svg>
  );
}

function GenesisIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 3.886 4.288.625-3.1 3.023.732 4.274L12 14.796l-3.832 2.012.732-4.274-3.1-3.023 4.288-.625z"/>
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',   label: 'Dashboard',           icon: <DashboardIcon /> },
  { path: '/genesis',     label: 'Project Genesis',     icon: <GenesisIcon /> },
  { path: '/archaeology', label: 'Prompt Archaeology', icon: <ArchaeologyIcon /> },
  { path: '/advocate',    label: "Devil's Advocate",    icon: <AdvocateIcon /> },
  { path: '/babysitter',  label: 'Agent Babysitter',    icon: <BabysitterIcon /> },
  { path: '/learning',    label: 'Learning Path',       icon: <LearningPathIcon /> },
];

export default function Sidebar() {
  const { sessionCount } = useProfileStore();

  return (
    <aside className={styles.sidebar}>
      {/* Animated logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.logoMark}>
          <div className={`${styles.logoOrb} ${styles.logoOrb1}`} />
          <div className={`${styles.logoOrb} ${styles.logoOrb2}`} />
        </div>
        <span className={styles.logoText}>MIRROR</span>
        <div className={styles.liveDot} />
      </div>

      {/* Nav Section */}
      <nav className={styles.navSection} aria-label="Mirror navigation">
        <div className={styles.navLabelHeader}>MODES</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => {
              let classes = `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;
              if (item.path === '/genesis') {
                classes += ` ${styles.genesisNavItem} ${isActive ? styles.genesisNavItemActive : ''}`;
              }
              return classes;
            }}
            id={`nav-${item.path === '/dashboard' ? 'dashboard' : item.path.slice(1)}`}
          >
            <span className={styles.navIcon}>
              {item.icon}
            </span>
            <span className={styles.navItemLabel}>{item.label}</span>
            <span className={styles.navModeDot} />
          </NavLink>
        ))}
      </nav>


      {/* Divider */}
      <div className={styles.divider} />

      {/* Profile link */}
      <NavLink
        to="/profile"
        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
        id="nav-profile"
        style={{ margin: '0 12px 12px' }}
      >
        <span className={styles.navIcon}>
          <ProfileIcon />
        </span>
        <span className={styles.navItemLabel}>Profile</span>
        <span className={styles.navModeDot} />
      </NavLink>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <span className={styles.sessionCount}>{sessionCount} sessions</span>
      </div>
    </aside>
  );
}
