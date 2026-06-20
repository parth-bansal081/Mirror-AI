import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useProfileStore } from '../../store/profileStore';
import { calculateImprovementScore, loadGenesisSessions, loadBrutalistSessions } from '../../hooks/useProfile';
import { GenesisSession, BrutalistSession } from '../../store/types';
import PromptDNA from './PromptDNA';
import DecisionMap from './DecisionMap';
import AgentLog from './AgentLog';
import ImprovementScore from './ImprovementScore';
import LearningProgressCard from './LearningProgressCard';
import styles from './index.module.css';

export default function Profile() {
  const { profile, sessionCount, setCurrentGenesisSession } = useProfileStore();
  const score = calculateImprovementScore(profile);
  const navigate = useNavigate();
  const [genesisSessions, setGenesisSessions] = useState<GenesisSession[]>([]);
  const [brutalistSessions, setBrutalistSessions] = useState<BrutalistSession[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const gs = await loadGenesisSessions();
        setGenesisSessions(gs);
        const bs = await loadBrutalistSessions();
        setBrutalistSessions(bs);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    }
    fetchSessions();
  }, []);

  const handleReopen = (session: GenesisSession) => {
    setCurrentGenesisSession(session);
    navigate('/genesis');
  };

  // Recent 10 sessions timeline across all modes
  const mockRecentSessions = [
    { mode: 'archaeology', label: 'Prompt', outcome: 'Fixed Wrong Format failure in API query prompt (Score 78)', date: 'Jun 15', path: '/archaeology' },
    { mode: 'advocate', label: 'Decision', outcome: 'Acknowledged Reversibility blind spot in framework migration (Score 82)', date: 'Jun 15', path: '/advocate' },
    { mode: 'learning', label: 'Learning', outcome: 'Completed Week 1 Checkpoint on Kubernetes (100% correct)', date: 'Jun 14', path: '/learning' },
    { mode: 'babysitter', label: 'Agent', outcome: 'Supervised deployment task: 4 steps, 1 drift event (Coherent)', date: 'Jun 14', path: '/babysitter' },
    { mode: 'archaeology', label: 'Prompt', outcome: 'Saved Format-First rewrite for competitor research layout (Score 65)', date: 'Jun 13', path: '/archaeology' },
    { mode: 'learning', label: 'Learning', outcome: 'Negotiated Learning Path for options trading (Intermediate)', date: 'Jun 13', path: '/learning' },
    { mode: 'advocate', label: 'Decision', outcome: 'Addressed Tech Debt blind spot in DB schema refactor (Score 58)', date: 'Jun 12', path: '/advocate' },
    { mode: 'babysitter', label: 'Agent', outcome: 'Gated DB write: 1 irreversible action approved (Coherent)', date: 'Jun 11', path: '/babysitter' },
    { mode: 'archaeology', label: 'Prompt', outcome: 'Identified Missing Context failure in unit test spec (Score 42)', date: 'Jun 10', path: '/archaeology' },
    { mode: 'learning', label: 'Learning', outcome: 'Completed baseline assessment on system design principles', date: 'Jun 10', path: '/learning' },
  ];

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ color: 'var(--color-signal)' }}>Intelligence Profile</h1>
          <p className={styles.subtitle}>Based on your prompting patterns, decision quality, and agent safety</p>
        </div>
        <div className={styles.scoreBox}>
          <div className={styles.scorePreview}>
            <span className={styles.scoreNumber} style={{
              color: score >= 70 ? 'var(--color-valid)' : score >= 41 ? 'var(--color-warn)' : 'var(--color-danger)'
            }}>
              {score}
            </span>
            <span className={styles.scoreLabel}>/ 100</span>
          </div>
          <div className={styles.scoreDelta}>↑ +12 this week</div>
        </div>
      </div>

      {/* Grid Layout of 5 Dashboard Panels */}
      <div className={styles.grid}>
        <PromptDNA dna={profile.prompt_dna} />
        <ImprovementScore score={score} profile={profile} />
        <DecisionMap map={profile.decision_map} />
        <AgentLog log={profile.agent_log} />
        <LearningProgressCard progress={profile.learning_progress} />
      </div>

      {/* Genesis Projects Section */}
      <div className={styles.recentSection}>
        <h2 className={styles.recentTitle}>Genesis Projects</h2>
        <div className={styles.recentList}>
          {genesisSessions.length === 0 ? (
            <div className={styles.empty} style={{ padding: 'var(--space-4) var(--space-8)' }}>
              <span className={styles.emptyTitle}>No Genesis Projects yet</span>
              <span className={styles.emptySubtitle}>Go to Project Genesis to generate your first set of build documents.</span>
            </div>
          ) : (
            genesisSessions.map((session) => (
              <div
                key={session.id}
                className={styles.recentItem}
                onClick={() => handleReopen(session)}
                style={{ cursor: 'pointer' }}
              >
                <span className={`${styles.recentType} ${styles.type_genesis}`}>
                  [Genesis]
                </span>
                <span className={styles.recentLabel}>
                  <strong>{session.product_name}</strong> — {session.spec?.one_liner}
                </span>
                <span className={styles.recentDate}>
                  {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <span className={styles.recentAction} style={{ marginLeft: 'var(--space-2)' }}>Re-open →</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Doc Brutalist Audits Section */}
      <div className={styles.recentSection}>
        <h2 className={styles.recentTitle}>Doc Brutalist Audits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Docs Audited</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brutalist)', marginTop: 'var(--space-1)' }}>{brutalistSessions.length}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Avg Improvement</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-valid)', marginTop: 'var(--space-1)' }}>
              +{brutalistSessions.length > 0 ? Math.round(brutalistSessions.reduce((sum, s) => sum + (s.final_clarity_score - s.original_clarity_score), 0) / brutalistSessions.length) : 0} pts
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Total Issues Audited</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-warn)', marginTop: 'var(--space-1)' }}>
              {brutalistSessions.reduce((sum, s) => sum + s.issues_found, 0)}
            </div>
          </div>
        </div>

        <div className={styles.recentList}>
          {brutalistSessions.length === 0 ? (
            <div className={styles.empty} style={{ padding: 'var(--space-4) var(--space-8)' }}>
              <span className={styles.emptyTitle}>No Brutalist Audits yet</span>
              <span className={styles.emptySubtitle}>Go to Doc Brutalist to subject your READMEs to an honest audit.</span>
            </div>
          ) : (
            brutalistSessions.map((session) => (
              <div
                key={session.id}
                className={styles.recentItem}
                style={{ cursor: 'default' }}
              >
                <span className={`${styles.recentType}`} style={{ color: 'var(--brutalist)', background: 'var(--brutalist-wash)', borderColor: 'var(--brutalist-glow)' }}>
                  [Brutalist]
                </span>
                <span className={styles.recentLabel}>
                  <strong>{session.doc_title}</strong> — Audience: {session.target_user.split(' ')[0]} | Score: {session.original_clarity_score}/100 → {session.final_clarity_score}/100
                </span>
                <span className={styles.recentDate}>
                  {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Sessions list of last 10 activities */}
      <div className={styles.recentSection}>
        <h2 className={styles.recentTitle}>Recent Sessions</h2>
        <div className={styles.recentList}>
          {mockRecentSessions.map((s, i) => (
            <NavLink
              key={i}
              to={s.path}
              className={styles.recentItem}
              id={`recent-session-${i}`}
            >
              <span className={`${styles.recentType} ${styles[`type_${s.mode}`]}`}>
                [{s.label}]
              </span>
              <span className={styles.recentLabel}>{s.outcome}</span>
              <span className={styles.recentDate}>{s.date}</span>
              <span className={styles.recentAction} style={{ marginLeft: 'var(--space-2)' }}>View →</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

