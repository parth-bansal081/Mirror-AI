import { useProjectGenesis } from '../../hooks/useProjectGenesis';
import BriefInput from './BriefInput';
import QuestionFlow from './QuestionFlow';
import SpecConfirmation from './SpecConfirmation';
import GenerationSequence from './GenerationSequence';
import DocumentWorkspace from './DocumentWorkspace';
import styles from './ProjectGenesis.module.css';

export default function ProjectGenesis() {
  const {
    stage,
    setStage,
    questions,
    currentQuestionIndex,
    spec,
    documents,
    loading,
    error,
    submitBrief,
    submitAnswer,
    confirmSpec,
    saveWorkspaceDoc,
    reset,
  } = useProjectGenesis();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 className={styles.title} style={{ color: 'var(--genesis-primary)' }}>
          Project Genesis
        </h1>
        <p className={styles.subtitle}>
          Turn vague ideas into 8 production-ready build documents sequentially.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stage Router */}
      {stage === 'brief' && (
        <BriefInput onSubmit={submitBrief} loading={loading} />
      )}

      {stage === 'questions' && (
        <QuestionFlow
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          onSubmitAnswer={submitAnswer}
          loading={loading}
        />
      )}

      {stage === 'spec_confirm' && (
        <SpecConfirmation
          initialSpec={spec}
          onSubmit={confirmSpec}
          loading={loading}
        />
      )}

      {stage === 'generating' && (
        <GenerationSequence
          loading={loading}
          onComplete={() => setStage('workspace')}
        />
      )}

      {stage === 'workspace' && (
        <DocumentWorkspace
          spec={spec}
          documents={documents || {}}
          onSaveDoc={saveWorkspaceDoc}
          onReset={reset}
        />
      )}
    </div>
  );
}
