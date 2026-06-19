import { useState, useEffect } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useLearningPath } from '../../hooks/useLearningPath';
import CurriculumRoadmap from './CurriculumRoadmap';
import LoadingOrb from '../../components/UI/LoadingOrb';
import StepReveal from '../../components/UI/StepReveal';
import Toast from '../../components/UI/Toast';
import styles from './index.module.css';
import { EvaluateCheckpointResult, LearningProgress } from '../../store/types';

type View = 'input' | 'analyzing' | 'assessment' | 'roadmap' | 'checkpoint' | 'complete';

export default function LearningPath() {
  const { isAnalyzing, analysisStep, error, setError, profile, setCurrentLearningSession } = useProfileStore();
  const {
    assessmentSteps,
    session,
    startAssessment,
    submitBaseline,
    updateCurriculum,
    getCheckpointQuestions,
    evaluateCheckpoint,
    completeWeek,
    reset,
  } = useLearningPath();

  const [view, setView] = useState<View>('input');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('Pure curiosity');

  // Baseline questions state
  const [baselineQuestions, setBaselineQuestions] = useState<string[]>([]);
  const [baselineAnswers, setBaselineAnswers] = useState<string[]>([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);

  // Checkpoint quiz state
  const [checkpointQuestions, setCheckpointQuestions] = useState<string[]>([]);
  const [checkpointAnswers, setCheckpointAnswers] = useState<string[]>([]);
  const [currentCheckpointQIdx, setCurrentCheckpointQIdx] = useState(0);
  const [checkpointEvals, setCheckpointEvals] = useState<EvaluateCheckpointResult[]>([]);
  const [activeCheckpointEval, setActiveCheckpointEval] = useState<EvaluateCheckpointResult | null>(null);
  const [activeCheckpointAnswer, setActiveCheckpointAnswer] = useState('');
  const [currentQuizWeek, setCurrentQuizWeek] = useState(1);

  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);

  // Resume active session on load
  useEffect(() => {
    if (profile.learning_progress && profile.learning_progress.topic) {
      setCurrentLearningSession(profile.learning_progress);
      setView('roadmap');
    }
  }, [profile.learning_progress, setCurrentLearningSession]);

  // Handle starting assessment
  async function handleStartAssessment() {
    if (!topic.trim()) {
      setError('Please tell us what you want to learn.');
      return;
    }
    setView('analyzing');
    const questions = await startAssessment(topic, goal);
    if (questions && questions.length > 0) {
      setBaselineQuestions(questions);
      setBaselineAnswers(new Array(questions.length).fill(''));
      setCurrentQIdx(0);
      setView('assessment');
    } else {
      setView('input');
    }
  }

  // Handle next baseline question
  async function handleNextQuestion(skip = false) {
    const answers = [...baselineAnswers];
    answers[currentQIdx] = skip ? "I don't know this concept yet." : baselineAnswers[currentQIdx];
    setBaselineAnswers(answers);

    if (currentQIdx < baselineQuestions.length - 1) {
      setCurrentQIdx(currentQIdx + 1);
    } else {
      // Finished all 5 questions -> Submit baseline & generate curriculum
      setView('analyzing');
      const progress = await submitBaseline(topic, goal, baselineQuestions, answers);
      if (progress) {
        setView('roadmap');
        setToast({ message: 'Curriculum path successfully negotiated!', kind: 'success' });
      } else {
        setView('input');
      }
    }
  }

  // Start week checkpoint quiz
  async function handleStartWeek(weekNum: number) {
    const weeks = session?.curriculum ?? [];
    const weekData = weeks.find((w) => w.week === weekNum);
    if (!weekData) return;

    setCurrentQuizWeek(weekNum);
    setView('analyzing');

    const questions = await getCheckpointQuestions(weekData.title);
    if (questions && questions.length > 0) {
      setCheckpointQuestions(questions);
      setCheckpointAnswers(new Array(questions.length).fill(''));
      setCheckpointEvals([]);
      setCurrentCheckpointQIdx(0);
      setActiveCheckpointEval(null);
      setActiveCheckpointAnswer('');
      setView('checkpoint');
    } else {
      setView('roadmap');
    }
  }

  // Submit single checkpoint question response
  async function handleSubmitCheckpointAnswer() {
    if (!activeCheckpointAnswer.trim()) return;

    setView('analyzing');
    const result = await evaluateCheckpoint(
      checkpointQuestions[currentCheckpointQIdx],
      activeCheckpointAnswer
    );
    setView('checkpoint');

    if (result) {
      setActiveCheckpointEval(result);
      const updatedAnswers = [...checkpointAnswers];
      updatedAnswers[currentCheckpointQIdx] = activeCheckpointAnswer;
      setCheckpointAnswers(updatedAnswers);
    }
  }

  // Go to next checkpoint question
  function handleNextCheckpoint() {
    if (activeCheckpointEval) {
      const updatedEvals = [...checkpointEvals, activeCheckpointEval];
      setCheckpointEvals(updatedEvals);

      if (currentCheckpointQIdx < checkpointQuestions.length - 1) {
        setCurrentCheckpointQIdx(currentCheckpointQIdx + 1);
        setActiveCheckpointEval(null);
        setActiveCheckpointAnswer('');
      } else {
        // Evaluate overall results and save gaps
        const gapsFound: string[] = [];
        updatedEvals.forEach((ev, idx) => {
          if (ev.evaluation !== 'correct') {
            gapsFound.push(`${checkpointQuestions[idx]}: ${ev.what_to_review}`);
          }
        });

        finishCheckpoint(gapsFound);
      }
    }
  }

  async function finishCheckpoint(gaps: string[]) {
    setView('analyzing');
    const finishedAll = await completeWeek(currentQuizWeek, gaps);
    if (finishedAll) {
      setView('complete');
    } else {
      setView('roadmap');
      setToast({
        message: `Week ${currentQuizWeek} Checkpoint complete! ${
          gaps.length > 0 ? `Identified ${gaps.length} gaps to review.` : 'Perfect score!'
        }`,
        kind: gaps.length > 0 ? 'info' : 'success',
      });
    }
  }

  function handleReset() {
    reset();
    setTopic('');
    setGoal('Pure curiosity');
    setView('input');
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            Learning Path Negotiator
          </h1>
          <p className={styles.subtitle}>
            Baseline your knowledge. Co-create your educational syllabus. Track your progress.
          </p>
        </div>
        {session?.topic && (
          <div className={styles.headerActions}>
            <span className={styles.sessionBadge}>Active Path: {session.topic}</span>
            {view !== 'input' && (
              <button className={styles.btnSecondary} style={{ marginLeft: 'var(--space-3)' }} onClick={handleReset}>
                New Path
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorDismiss}>✕</button>
        </div>
      )}

      {/* 1. Topic Input Form */}
      {view === 'input' && (
        <div className={styles.modePanel}>
          <div className={styles.inputForm}>
            <div>
              <label className={styles.formLabel} htmlFor="learn-topic">
                What do you want to learn?
              </label>
              <textarea
                id="learn-topic"
                className={styles.textarea}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Kubernetes, machine learning, options trading, React hooks, system design..."
                rows={3}
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <span className={styles.formLabel}>Why do you need to learn this?</span>
              <div className={styles.radioGroup}>
                {[
                  'Job interview prep',
                  'Side project',
                  'Work requirement',
                  'Pure curiosity',
                  'Career switch',
                ].map((option) => (
                  <label
                    key={option}
                    className={`${styles.radioOption} ${goal === option ? styles.radioOptionActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="learning-goal"
                      className={styles.radioInput}
                      checked={goal === option}
                      onChange={() => setGoal(option)}
                      disabled={isAnalyzing}
                    />
                    <span className={styles.radioLabel}>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <button
                className={styles.btnPrimary}
                onClick={handleStartAssessment}
                disabled={!topic.trim() || isAnalyzing}
                id="start-assessment-btn"
              >
                Start Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Analyzing loader */}
      {view === 'analyzing' && (
        <div className={styles.modePanel} style={{ padding: 'var(--space-6)' }}>
          <div className={styles.analyzingHeader}>
            <LoadingOrb size={28} />
            <p className={styles.analyzingText}>Consulting syllabus guidelines…</p>
          </div>
          <StepReveal
            steps={assessmentSteps}
            currentStep={analysisStep}
            isAnalyzing={isAnalyzing}
            accentColor="var(--mode-primary)"
          />
        </div>
      )}

      {/* 3. Baseline assessment questionnaire */}
      {view === 'assessment' && baselineQuestions.length > 0 && (
        <div className={styles.assessmentContainer}>
          <div className={styles.assessmentCard}>
            <div className={styles.cardHeader}>
              <span className={styles.progressText}>
                Question {currentQIdx + 1} of {baselineQuestions.length}
              </span>
              <div className={styles.sessionBadge}>Baseline Assessment</div>
            </div>

            <p className={styles.questionText}>{baselineQuestions[currentQIdx]}</p>

            <textarea
              className={styles.textarea}
              value={baselineAnswers[currentQIdx] ?? ''}
              onChange={(e) => {
                const answers = [...baselineAnswers];
                answers[currentQIdx] = e.target.value;
                setBaselineAnswers(answers);
              }}
              placeholder="Provide a short answer details..."
              rows={4}
            />

            <div className={styles.cardFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => handleNextQuestion(true)}
                id="skip-question-btn"
              >
                Skip — I don't know this
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => handleNextQuestion(false)}
                disabled={!(baselineAnswers[currentQIdx] ?? '').trim()}
                id="next-question-btn"
              >
                {currentQIdx < baselineQuestions.length - 1 ? 'Next Question' : 'Finish Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Curriculum roadmap viewer */}
      {view === 'roadmap' && session && (
        <CurriculumRoadmap
          progress={session as LearningProgress}
          onUpdateWeeks={updateCurriculum}
          onStartWeek={handleStartWeek}
        />
      )}

      {/* 5. Checkpoint Assessment quiz */}
      {view === 'checkpoint' && checkpointQuestions.length > 0 && (
        <div className={styles.checkpointContainer}>
          <div className={styles.checkpointCard}>
            <div className={styles.cardHeader}>
              <span className={styles.progressText}>
                Checkpoint Question {currentCheckpointQIdx + 1} of {checkpointQuestions.length}
              </span>
              <div className={styles.sessionBadge}>Week {currentQuizWeek} Checkpoint</div>
            </div>

            <p className={styles.questionText}>{checkpointQuestions[currentCheckpointQIdx]}</p>

            {!activeCheckpointEval ? (
              <>
                <textarea
                  className={styles.textarea}
                  value={activeCheckpointAnswer}
                  onChange={(e) => setActiveCheckpointAnswer(e.target.value)}
                  placeholder="Explain in your own words..."
                  rows={4}
                />
                <div className={styles.cardFooter}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleSubmitCheckpointAnswer}
                    disabled={!activeCheckpointAnswer.trim()}
                    id="submit-checkpoint-btn"
                  >
                    Submit Answer
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.checkpointGrid}>
                {/* User Answer Readonly */}
                <textarea
                  className={styles.textarea}
                  value={checkpointAnswers[currentCheckpointQIdx]}
                  readOnly
                  rows={3}
                  style={{ opacity: 0.7, background: 'var(--void)' }}
                />

                {/* Evaluation Feedback Panel */}
                <div
                  className={`${styles.evalPanel} ${
                    activeCheckpointEval.evaluation === 'correct'
                      ? styles.evalCorrect
                      : activeCheckpointEval.evaluation === 'partial'
                      ? styles.evalPartial
                      : styles.evalIncorrect
                  }`}
                >
                  <div className={styles.evalStatus}>
                    {activeCheckpointEval.evaluation.toUpperCase()}
                  </div>
                  <div className={styles.evalExplanation}>
                    {activeCheckpointEval.explanation}
                  </div>
                  {activeCheckpointEval.what_to_review && (
                    <div className={styles.evalReview}>
                      <strong>Review guidance: </strong>
                      {activeCheckpointEval.what_to_review}
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={styles.btnPrimary}
                    onClick={handleNextCheckpoint}
                    id="next-checkpoint-btn"
                  >
                    {currentCheckpointQIdx < checkpointQuestions.length - 1
                      ? 'Next Question'
                      : 'Complete Checkpoint'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Graduation Complete View */}
      {view === 'complete' && session && (
        <div className={styles.summaryPanel}>
          <h2 className={styles.summaryTitle}>🎉 CURRICULUM GRADUATION!</h2>
          <p className={styles.summaryText}>
            Outstanding job! You have fully completed the curriculum roadmaps designed for{' '}
            <strong>{session.topic}</strong>.
          </p>
          <div className={styles.summaryList}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemDot}>✓</span>
              <span>Baseline Level: {(session.level || '').toUpperCase()}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryItemDot}>✓</span>
              <span>Total weeks completed: {(session.curriculum || []).length}</span>
            </div>
            {(session.knowledge_gaps || []).length > 0 && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryItemDot}>⚠</span>
                <span>Review Gaps: {(session.knowledge_gaps || []).length} areas need ongoing focus.</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <button className={styles.btnPrimary} onClick={handleReset} id="start-new-path-btn">
              Start New Learning Path
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} kind={toast.kind} onDismiss={() => setToast(null)} />}
    </div>
  );
}
