import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Swords, Eye, BookOpen } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore';
import styles from './index.module.css';

interface QuickActionCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

function QuickActionCard({ label, description, icon, color, href }: QuickActionCardProps) {
  return (
    <Link
      to={href}
      className={styles.quickActionCard}
      style={{ '--card-color': color } as React.CSSProperties}
    >
      <div
        className={styles.quickActionIcon}
        style={{ backgroundColor: `${color}26` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className={styles.quickActionLabel}>{label}</div>
      <div className={styles.quickActionDesc}>{description}</div>
    </Link>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  trend?: string;
  color: string;
}

function StatCard({ label, value, suffix = '', trend, color }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <div className={styles.statCard} style={{ '--stat-color': color } as React.CSSProperties}>
      {trend && <span className={styles.statTrend}>{trend}</span>}
      <div className={styles.statValue}>
        {displayValue}
        {suffix}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

interface ActivityItemProps {
  mode: 'archaeology' | 'advocate' | 'babysitter' | 'learning';
  title: string;
  time: string;
  score?: string | number;
  style?: React.CSSProperties;
}

const MODE_COLORS = {
  archaeology: 'var(--arch-primary)',
  advocate: 'var(--devil-primary)',
  babysitter: 'var(--baby-primary)',
  learning: 'var(--learn-primary)',
};

const MODE_LABELS = {
  archaeology: 'Archaeology',
  advocate: 'Advocate',
  babysitter: 'Babysitter',
  learning: 'Learning',
};

function ActivityItem({ mode, title, time, score, style }: ActivityItemProps) {
  const formattedTime = new Date(time).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={styles.activityItem} style={style}>
      <div
        className={styles.activityModeDot}
        style={{ backgroundColor: MODE_COLORS[mode] }}
        title={MODE_LABELS[mode]}
      />
      <div className={styles.activityTitle}>{title}</div>
      <div className={styles.activityTime}>{formattedTime}</div>
      {score && <div className={styles.activityScore}>{score}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { profile, sessionCount } = useProfileStore();
  const [radarScale, setRadarScale] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setRadarScale(1), 100);
    return () => clearTimeout(t);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = 'Parth';

  const improvementScore = profile.improvement_score?.current ?? 75;

  // Compile stats
  const promptCount = profile.prompt_dna?.total_analyzed ?? 0;
  const decisionCount = profile.decision_map?.total_decisions ?? 0;
  const agentCount = profile.agent_log?.total_runs ?? 0;

  // DNA metrics for radar chart
  const clarity = profile.prompt_dna?.clarity_avg ?? 70;
  const specificity = profile.prompt_dna?.specificity_avg ?? 60;
  const context = profile.prompt_dna?.context_avg ?? 50;
  const format = profile.prompt_dna?.format_avg ?? 40;
  const consistency = profile.prompt_dna?.consistency_avg ?? 80;

  const metrics = [clarity, specificity, context, format, consistency];
  const labels = ['Clarity', 'Specificity', 'Context', 'Format', 'Consistency'];

  // Radar points helpers
  const getCoordinates = (value: number, index: number, scale = 1) => {
    const angle = index * (2 * Math.PI / 5) - Math.PI / 2;
    const radius = (value / 100) * 100 * scale;
    const x = 150 + radius * Math.cos(angle);
    const y = 150 + radius * Math.sin(angle);
    return { x, y };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = index * (2 * Math.PI / 5) - Math.PI / 2;
    const x = 150 + 124 * Math.cos(angle);
    const y = 150 + 124 * Math.sin(angle);
    return { x, y };
  };

  const levels = [20, 40, 60, 80, 100];

  // Aggregated activity feed
  const promptHistory = profile.prompt_dna?.prompt_history?.map(p => ({
    id: p.id,
    mode: 'archaeology' as const,
    title: p.original_prompt,
    date: p.date,
    score: p.failure_type === 'unknown' ? 'Excellent' : 'Need Fix',
  })) || [];

  const decisionHistory = profile.decision_map?.decision_history?.map(d => ({
    id: d.id,
    mode: 'advocate' as const,
    title: `Decision Challenge: ${d.decision_type.toUpperCase()}`,
    date: d.date,
    score: `${d.readiness_score}%`,
  })) || [];

  const agentHistory = profile.agent_log?.run_history?.map(r => ({
    id: r.id,
    mode: 'babysitter' as const,
    title: r.task_description,
    date: r.date,
    score: r.completed ? 'Pass' : 'Drifted',
  })) || [];

  const allSessions = [...promptHistory, ...decisionHistory, ...agentHistory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className={styles.dashboardContainer}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroGreeting}>
          <span className={styles.greetingText}>{greeting}, {name}.</span>
          <span className={styles.greetingSub}>
            You've completed {sessionCount} session{sessionCount !== 1 ? 's' : ''}. Your intelligence score is{' '}
            <strong style={{ color: 'var(--genesis-primary)' }}>{improvementScore}/100</strong>.
          </span>
        </div>

        {/* Project Genesis Large Hero Card */}
        <div className={styles.genesisHeroCard}>
          <div className={styles.genesisHeroGlow} />
          <div className={styles.genesisHeroContent}>
            <div className={styles.genesisHeroBadge}>Primary Feature</div>
            <h2 className={styles.genesisHeroTitle}>Launch Project Genesis</h2>
            <p className={styles.genesisHeroDescription}>
              Turn any vague developer idea or brief into 8 production-ready build documents sequentially. Assesses scope depth, generates clarifying questions, and validates specification.
            </p>
            <Link to="/genesis" className={styles.genesisHeroBtn}>
              Start New Build Spec
            </Link>
          </div>
        </div>

        {/* Other tools as secondary actions */}
        <div className={styles.secondaryHeader}>Analytics & Diagnostics</div>
        <div className={styles.heroActions}>
          <QuickActionCard
            label="Prompt Archaeology"
            description="Analyze and fix prompt failures"
            icon={<Search size={16} />}
            color="var(--arch-primary)"
            href="/archaeology"
          />
          <QuickActionCard
            label="Devil's Advocate"
            description="Challenge critical technical decisions"
            icon={<Swords size={16} />}
            color="var(--devil-primary)"
            href="/advocate"
          />
          <QuickActionCard
            label="Agent Babysitter"
            description="Supervise and gate autonomous agents"
            icon={<Eye size={16} />}
            color="var(--baby-primary)"
            href="/babysitter"
          />
          <QuickActionCard
            label="Learning Path"
            description="Negotiate adaptive technical curricula"
            icon={<BookOpen size={16} />}
            color="var(--learn-primary)"
            href="/learning"
          />
        </div>
      </div>


      {/* Stats row */}
      <div className={styles.statsRow}>
        <StatCard
          label="Intelligence Score"
          value={improvementScore}
          suffix="/100"
          trend="+4%"
          color="var(--profile-primary)"
        />
        <StatCard
          label="Prompts Analyzed"
          value={promptCount}
          color="var(--arch-primary)"
        />
        <StatCard
          label="Decisions Challenged"
          value={decisionCount}
          color="var(--devil-primary)"
        />
        <StatCard
          label="Agent Runs Supervised"
          value={agentCount}
          color="var(--baby-primary)"
        />
      </div>

      {/* Data panels */}
      <div className={styles.dataGrid}>
        {/* Radar DNA Chart */}
        <div className={styles.chartPanel}>
          <h3 className={styles.panelTitle}>Prompt DNA Profile</h3>
          <div className={styles.radarContainer}>
            <svg width="100%" height="100%" viewBox="0 0 300 300">
              {/* Outer boundary grid lines */}
              {levels.map((level) => (
                <polygon
                  key={level}
                  points={labels.map((_, i) => {
                    const { x, y } = getCoordinates(level, i);
                    return `${x},${y}`;
                  }).join(' ')}
                  className={styles.radarGrid}
                />
              ))}

              {/* Angle axis lines from center */}
              {labels.map((_, i) => {
                const outer = getCoordinates(100, i);
                return (
                  <line
                    key={i}
                    x1={150}
                    y1={150}
                    x2={outer.x}
                    y2={outer.y}
                    className={styles.radarAxis}
                  />
                );
              })}

              {/* Data area polygon */}
              <polygon
                points={metrics.map((m, i) => {
                  const { x, y } = getCoordinates(m, i, radarScale);
                  return `${x},${y}`;
                }).join(' ')}
                className={styles.radarArea}
              />

              {/* Data points */}
              {metrics.map((m, i) => {
                const { x, y } = getCoordinates(m, i, radarScale);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3.5}
                    className={styles.radarPoint}
                  />
                );
              })}

              {/* Labels */}
              {labels.map((lbl, i) => {
                const { x, y } = getLabelCoordinates(i);
                const angle = i * (2 * Math.PI / 5) - Math.PI / 2;
                const textAnchor = Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle';
                return (
                  <text
                    key={i}
                    x={x}
                    y={y + 4}
                    textAnchor={textAnchor}
                    className={styles.radarLabel}
                  >
                    {lbl}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Activity feed */}
        <div className={styles.feedPanel}>
          <h3 className={styles.panelTitle}>Recent Activity</h3>
          <div className={styles.feedList}>
            {allSessions.length === 0 ? (
              <div className={styles.emptyFeed}>No recent activity yet. Start a session to analyze your workflow.</div>
            ) : (
              allSessions.map((session, i) => (
                <ActivityItem
                  key={session.id}
                  mode={session.mode}
                  title={session.title}
                  time={session.date}
                  score={session.score}
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
