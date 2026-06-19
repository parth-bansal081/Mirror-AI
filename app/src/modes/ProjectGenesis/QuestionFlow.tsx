import { useState, useEffect } from 'react';
import { ArrowRight, CornerDownRight } from 'lucide-react';
import { GenesisQuestion } from '../../hooks/useProjectGenesis';
import styles from './ProjectGenesis.module.css';

interface QuestionFlowProps {
  questions: GenesisQuestion[];
  currentQuestionIndex: number;
  onSubmitAnswer: (answer: string) => void;
  loading: boolean;
}

export default function QuestionFlow({
  questions,
  currentQuestionIndex,
  onSubmitAnswer,
  loading,
}: QuestionFlowProps) {
  const [answer, setAnswer] = useState('');
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    setAnswer('');
  }, [currentQuestionIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || loading) return;
    onSubmitAnswer(answer);
  };

  if (!currentQuestion) return null;

  const progressPct = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className={styles.qaBox}>
      {/* Progress */}
      <div className={styles.progressContainer}>
        <div className={styles.progressLabel}>
          <span>CLARIFYING PROJECT PARAMETERS</span>
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.qaContent}>
        <div className={styles.questionCard}>
          <div className={styles.questionContext}>
            Dimension: {currentQuestion.dimension}
          </div>
          <div className={styles.questionText}>
            {currentQuestion.question}
          </div>
          {currentQuestion.why_asking && (
            <div className={styles.whyAsking}>
              <CornerDownRight size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              <strong>Why we ask:</strong> {currentQuestion.why_asking}
            </div>
          )}
        </div>

        <div className={styles.label} style={{ marginTop: '10px' }}>Your Answer</div>
        <textarea
          className={styles.textarea}
          placeholder="Type your clarification here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={loading}
          required
        />

        <div className={styles.actionRow}>
          <button
            className={styles.btn}
            type="submit"
            disabled={loading || !answer.trim()}
          >
            <span>{currentQuestionIndex === questions.length - 1 ? 'Build Spec Summary' : 'Next Question'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
