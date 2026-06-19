import { useState } from 'react';
import { LearningProgress, StudyWeek, StudyTopic } from '../../store/types';
import styles from './CurriculumRoadmap.module.css';

interface CurriculumRoadmapProps {
  progress: LearningProgress;
  onUpdateWeeks: (weeks: StudyWeek[]) => void;
  onStartWeek: (weekNum: number) => void;
}

export default function CurriculumRoadmap({
  progress,
  onUpdateWeeks,
  onStartWeek,
}: CurriculumRoadmapProps) {
  const [isReordering, setIsReordering] = useState(false);
  const [isMarkingKnown, setIsMarkingKnown] = useState(false);

  const weeks = progress.curriculum ?? [];
  const currentWeekNum = progress.current_week;

  // Reorder topics within or across weeks
  function moveTopic(weekIdx: number, topicIdx: number, direction: 'up' | 'down') {
    const updatedWeeks = JSON.parse(JSON.stringify(weeks)) as StudyWeek[];
    const week = updatedWeeks[weekIdx];
    const targetIdx = direction === 'up' ? topicIdx - 1 : topicIdx + 1;

    // Shift within the same week
    if (targetIdx >= 0 && targetIdx < week.topics.length) {
      const temp = week.topics[topicIdx];
      week.topics[topicIdx] = week.topics[targetIdx];
      week.topics[targetIdx] = temp;
      onUpdateWeeks(updatedWeeks);
      return;
    }

    // Shift across weeks
    if (direction === 'up' && weekIdx > 0) {
      // Move to end of previous week
      const item = week.topics.splice(topicIdx, 1)[0];
      updatedWeeks[weekIdx - 1].topics.push(item);
      onUpdateWeeks(updatedWeeks);
    } else if (direction === 'down' && weekIdx < updatedWeeks.length - 1) {
      // Move to start of next week
      const item = week.topics.splice(topicIdx, 1)[0];
      updatedWeeks[weekIdx + 1].topics.unshift(item);
      onUpdateWeeks(updatedWeeks);
    }
  }

  // Toggle "Already know this" state
  function toggleTopicKnown(weekIdx: number, topicIdx: number) {
    const updatedWeeks = JSON.parse(JSON.stringify(weeks)) as StudyWeek[];
    const topic = updatedWeeks[weekIdx].topics[topicIdx];
    topic.known = !topic.known;
    onUpdateWeeks(updatedWeeks);
  }

  return (
    <div className={styles.container}>
      {/* Header Info Panel */}
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          YOUR {progress.topic.toUpperCase()} LEARNING PATH
        </h2>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Difficulty Level</span>
            <span className={styles.metaValue}>{progress.level.toUpperCase() || 'Negotiated'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Goal</span>
            <span className={styles.metaValue}>{progress.goal || 'General Knowledge'}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Duration</span>
            <span className={styles.metaValue}>{weeks.length} Weeks</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className={styles.actionBar}>
        <button
          className={styles.btnPrimary}
          onClick={() => onStartWeek(currentWeekNum)}
          id={`start-week-${currentWeekNum}-btn`}
        >
          Start Week {currentWeekNum}
        </button>
        <button
          className={`${styles.btnSecondary} ${isReordering ? styles.btnActive : ''}`}
          onClick={() => {
            setIsReordering(!isReordering);
            setIsMarkingKnown(false);
          }}
          id="reorder-topics-btn"
        >
          {isReordering ? '✓ Finish Reordering' : ' Reorder Topics'}
        </button>
        <button
          className={`${styles.btnSecondary} ${isMarkingKnown ? styles.btnActive : ''}`}
          onClick={() => {
            setIsMarkingKnown(!isMarkingKnown);
            setIsReordering(false);
          }}
          id="mark-known-topics-btn"
        >
          {isMarkingKnown ? '✓ Done Marking' : '💡 Mark topics I know'}
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className={styles.timeline}>
        {weeks.map((weekData, weekIdx) => {
          const isCurrentWeek = weekData.week === currentWeekNum;
          const isPastWeek = weekData.week < currentWeekNum;
          const isFutureWeek = weekData.week > currentWeekNum;

          // Determine node completion state
          const allTopicsCompleted = weekData.topics.every((t) => t.known);

          let nodeClass = styles.lineNode;
          if (isCurrentWeek) {
            nodeClass += ` ${styles.lineNodeActive}`;
          } else if (isPastWeek || allTopicsCompleted) {
            nodeClass += ` ${styles.lineNodeCompleted}`;
          }

          return (
            <div key={weekData.week} className={styles.weekGroup}>
              {/* Week Label (Left) */}
              <div className={styles.weekLabelCol}>
                <span className={`${styles.weekLabel} ${isCurrentWeek ? styles.weekLabelActive : ''}`}>
                  Week {weekData.week}
                </span>
              </div>

              {/* Timeline dot (Center) */}
              <div className={styles.lineCol}>
                <span className={nodeClass} />
              </div>

              {/* Topic cards list (Right) */}
              <div className={styles.cardsCol}>
                <div className={styles.weekTitle}>{weekData.title}</div>
                {weekData.topics.map((topic, topicIdx) => {
                  let cardClass = styles.topicCard;
                  if (isCurrentWeek && !topic.known) {
                    cardClass += ` ${styles.topicCardActive}`;
                  } else if (topic.known) {
                    cardClass += ` ${styles.topicCardCompleted}`;
                  }

                  return (
                    <div key={topic.key} className={cardClass}>
                      <div className={styles.topicContent}>
                        <span className={`${styles.topicTitle} ${topic.known ? styles.topicTitleCompleted : ''}`}>
                          {topic.title}
                        </span>
                        <div className={styles.topicMeta}>
                          {topic.known && <span className={`${styles.badge} ${styles.badgeKnown}`}>✓ Already Know</span>}
                          {isCurrentWeek && !topic.known && <span className={`${styles.badge} ${styles.badgeCurrent}`}>Current</span>}
                        </div>
                      </div>

                      {/* Interactive Controls */}
                      <div className={styles.topicActions}>
                        {isReordering && (
                          <div className={styles.reorderControls}>
                            <button
                              className={styles.actionBtn}
                              title="Move Up"
                              onClick={() => moveTopic(weekIdx, topicIdx, 'up')}
                              disabled={weekIdx === 0 && topicIdx === 0}
                            >
                              ▲
                            </button>
                            <button
                              className={styles.actionBtn}
                              title="Move Down"
                              onClick={() => moveTopic(weekIdx, topicIdx, 'down')}
                              disabled={weekIdx === weeks.length - 1 && topicIdx === weekData.topics.length - 1}
                            >
                              ▼
                            </button>
                          </div>
                        )}

                        {isMarkingKnown && (
                          <button
                            className={`${styles.actionBtn} ${topic.known ? styles.actionBtnActive : ''}`}
                            onClick={() => toggleTopicKnown(weekIdx, topicIdx)}
                            title="Toggle Known"
                          >
                            {topic.known ? '✓' : '💡'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
