import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { useProfileStore } from './store/profileStore';
import { loadProfile, loadPromptLibrary, loadSessionCount } from './hooks/useProfile';
import { isAnnaConnected, setWindowTitle } from './hooks/useAnna';

export default function App() {
  const { setProfile, setProfileLoaded, setPromptLibrary, setSessionCount } = useProfileStore();

  useEffect(() => {
    async function init() {
      // Signal ready to Anna runtime
      if (isAnnaConnected()) {
        try { await window.anna.window.ready(); } catch { /* non-fatal */ }
        await setWindowTitle('Mirror');
      }

      // Load persistent profile from APS
      try {
        const [profile, library, count] = await Promise.all([
          loadProfile(),
          loadPromptLibrary(),
          loadSessionCount(),
        ]);
        setProfile(profile);
        setPromptLibrary(library);
        setSessionCount(count);
      } catch (err) {
        console.error('[mirror] Failed to load profile:', err);
        // Continue with empty profile — non-fatal
      } finally {
        setProfileLoaded(true);
      }
    }
    init();
  }, [setProfile, setProfileLoaded, setPromptLibrary, setSessionCount]);

  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
}
