import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Layout.module.css';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BackgroundOrbs from './BackgroundOrbs';
import { useProfileStore } from '../../store/profileStore';
import Dashboard from '../../modes/Dashboard';
import ProjectGenesis from '../../modes/ProjectGenesis';
import PromptArchaeology from '../../modes/PromptArchaeology';
import DevilsAdvocate from '../../modes/DevilsAdvocate';
import AgentBabysitter from '../../modes/AgentBabysitter';
import LearningPath from '../../modes/LearningPath';
import Profile from '../../modes/Profile';
import LoadingOrb from '../UI/LoadingOrb';

const PATH_TO_MODE: Record<string, string> = {
  '/':            'genesis',
  '/dashboard':   'dashboard',
  '/genesis':     'genesis',
  '/archaeology': 'archaeology',
  '/advocate':    'advocate',
  '/babysitter':  'babysitter',
  '/learning':    'learning',
  '/profile':     'profile',
};

export default function Layout() {
  const { profileLoaded } = useProfileStore();
  const location = useLocation();

  // Set the body data-mode attribute immediately on route changes
  useEffect(() => {
    const mode = PATH_TO_MODE[location.pathname] || 'dashboard';
    document.body.setAttribute('data-mode', mode);
  }, [location.pathname]);

  if (!profileLoaded) {
    return (
      <div className={styles.splash}>
        <LoadingOrb size={56} />
        <p className={styles.splashText}>Loading Mirror…</p>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <BackgroundOrbs />
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <div className={styles.content}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/genesis" replace />} />
                <Route path="/genesis" element={<ProjectGenesis />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/archaeology" element={<PromptArchaeology />} />
                <Route path="/advocate" element={<DevilsAdvocate />} />
                <Route path="/babysitter" element={<AgentBabysitter />} />
                <Route path="/learning" element={<LearningPath />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
