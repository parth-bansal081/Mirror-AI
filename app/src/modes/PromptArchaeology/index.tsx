import { useState, useEffect } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { usePromptAnalysis } from '../../hooks/usePromptAnalysis';
import PromptInput from './PromptInput';
import AnalysisSteps from './AnalysisSteps';
import PromptLibrary from './PromptLibrary';
import Toast from '../../components/UI/Toast';
import ScoreRing from '../../components/UI/ScoreRing';
import styles from './index.module.css';

type View = 'input' | 'analyzing' | 'review' | 'library';

export default function PromptArchaeology() {
  const { isAnalyzing, analysisStep, error, setError, currentPromptSession } = useProfileStore();
  const { analysisSteps, session, analyze, confirmDiagnosis, selectRewrite, saveSession, reset } = usePromptAnalysis();
  const [view, setView] = useState<View>('input');
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [subView, setSubView] = useState<'library' | null>(null);

  // Section C States
  const [selectedRewriteId, setSelectedRewriteId] = useState<'A' | 'B' | 'C' | null>(null);
  const [blendText, setBlendText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [diagnosisReviewed, setDiagnosisReviewed] = useState(false);

  // Sync state with active session
  useEffect(() => {
    if (!session) {
      setDiagnosisReviewed(false);
    }
  }, [session]);

  const sessionCount = useProfileStore((s) => s.profile.prompt_dna.total_analyzed);

  async function handleAnalyze(prompt: string, badOutput: string) {
    setSelectedRewriteId(null);
    setBlendText('');
    setDiagnosisReviewed(false);
    setView('analyzing');
    await analyze(prompt, badOutput);
    if (!useProfileStore.getState().error) {
      setView('review');
    } else {
      setView('input');
    }
  }

  function handleSelectRewrite(id: 'A' | 'B' | 'C') {
    setSelectedRewriteId(id);
    const rw = session?.rewrites?.find((r) => r.id === id);
    if (rw) {
      setBlendText(rw.rewritten_prompt);
      selectRewrite(id, rw.rewritten_prompt);
    }
  }

  async function handleSave() {
    if (!blendText.trim()) return;
    selectRewrite(selectedRewriteId ?? 'blend', blendText);
    setIsSaving(true);
    const ok = await saveSession();
    setIsSaving(false);
    if (ok) {
      setToast({ message: 'Session saved to your Intelligence Profile.', kind: 'success' });
      setView('input');
      setDiagnosisReviewed(false);
      reset();
    }
  }

  if (subView === 'library') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title} style={{ color: 'var(--mode-primary)' }}>Prompt Library</h1>
            <p className={styles.subtitle}>Your improved prompts, saved for reuse.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnSecondary} onClick={() => setSubView(null)}>← Back</button>
          </div>
        </div>
        <PromptLibrary />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ color: 'var(--mode-primary)' }}>Prompt Archaeology</h1>
          <p className={styles.subtitle}>Forensically analyze why your prompt failed.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.sessionBadge}>Sessions: {sessionCount}</span>
          <button className={styles.btnSecondary} onClick={() => setSubView('library')} id="open-library-btn">
            Library
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.errorDismiss}>✕</button>
        </div>
      )}

      {/* Content */}
      {(view === 'input' || !session) && (
        <PromptInput onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
      )}

      {view === 'analyzing' && (
        <AnalysisSteps
          steps={analysisSteps}
          currentStep={analysisStep}
          isAnalyzing={isAnalyzing}
        />
      )}

      {view === 'review' && session?.failure_type && (
        <div className={styles.reviewSection}>
          <AnalysisSteps
            steps={analysisSteps}
            currentStep={4}
            isAnalyzing={false}
          />

          {/* Forensic analysis card */}
          <div className={styles.modePanel}>
            <div className={styles.forensicHeader}>
              <span className={styles.forensicIcon}>✦</span>
              <span className={styles.forensicLabel}>FORENSIC ANALYSIS</span>
            </div>

            <div className={styles.failureType}>
              <span className={styles.ftLabel}>Failure Type:</span>
              <span className={styles.ftValue}>{session.failure_type?.toUpperCase().replace('_', ' ')}</span>
            </div>

            <p className={styles.failureExplanation}>{session.failure_explanation}</p>

            {!diagnosisReviewed ? (
              <div className={styles.reviewGate}>
                <p className={styles.reviewQuestion}>Does this match what you experienced?</p>
                <div className={styles.reviewButtons}>
                  <button
                    className={styles.btnValid}
                    onClick={() => {
                      console.log('[PromptArchaeology] Clicking Yes, accurate');
                      try {
                        confirmDiagnosis(true);
                        setDiagnosisReviewed(true);
                        console.log('[PromptArchaeology] Yes, accurate click handled successfully');
                      } catch (e) {
                        console.error('[PromptArchaeology] Error in Yes, accurate click handler:', e);
                      }
                    }}
                    id="confirm-diagnosis-yes"
                  >✓ Yes, accurate</button>
                  <button
                    className={styles.btnReject}
                    onClick={() => {
                      console.log('[PromptArchaeology] Clicking Partially wrong');
                      try {
                        confirmDiagnosis(false);
                        setDiagnosisReviewed(true);
                        console.log('[PromptArchaeology] Partially wrong click handled successfully');
                      } catch (e) {
                        console.error('[PromptArchaeology] Error in Partially wrong click handler:', e);
                      }
                    }}
                    id="confirm-diagnosis-partial"
                  >✗ Partially wrong</button>
                </div>
              </div>
            ) : (
              <div className={styles.reviewGate}>
                <p className={styles.reviewQuestion} style={{
                  color: session.diagnosis_confirmed ? 'var(--success)' : 'var(--warning)',
                  fontWeight: 600
                }}>
                  {session.diagnosis_confirmed ? '✓ Diagnosis Confirmed' : '✗ Diagnosis Rejected'}
                </p>
              </div>
            )}
          </div>

          {/* Render Sections A, B, C, D only after diagnosis is reviewed */}
          {diagnosisReviewed && (
            <div className={styles.resultsWrapper}>
              
              {/* Section A — Prompt Integrity Score */}
              <div className={styles.modePanel} style={{ padding: 0 }}>
                <div className={styles.scorePanel}>
                  <ScoreRing score={session.integrity_score ?? 0} size={150} strokeWidth={8} label="INTEGRITY" />
                  
                  {session.sub_scores && (
                    <div className={styles.metricGrid}>
                      <div className={styles.metricRow}>
                        <span className={styles.metricName}>Clarity</span>
                        <div className={styles.metricTrack}>
                          <div className={styles.metricFill} style={{ width: `${session.sub_scores.clarity}%` }} />
                        </div>
                        <span className={styles.metricVal}>{session.sub_scores.clarity}%</span>
                      </div>
                      
                      <div className={styles.metricRow}>
                        <span className={styles.metricName}>Specificity</span>
                        <div className={styles.metricTrack}>
                          <div className={styles.metricFill} style={{ width: `${session.sub_scores.specificity}%` }} />
                        </div>
                        <span className={styles.metricVal}>{session.sub_scores.specificity}%</span>
                      </div>

                      <div className={styles.metricRow}>
                        <span className={styles.metricName}>Context</span>
                        <div className={styles.metricTrack}>
                          <div className={styles.metricFill} style={{ width: `${session.sub_scores.context}%` }} />
                        </div>
                        <span className={styles.metricVal}>{session.sub_scores.context}%</span>
                      </div>

                      <div className={styles.metricRow}>
                        <span className={styles.metricName}>Format Guidance</span>
                        <div className={styles.metricTrack}>
                          <div className={styles.metricFill} style={{ width: `${session.sub_scores.format_guidance}%` }} />
                        </div>
                        <span className={styles.metricVal}>{session.sub_scores.format_guidance}%</span>
                      </div>
                    </div>
                  )}

                  {session.diagnosis_summary && (
                    <p className={styles.diagnosisSummary}>
                      "{session.diagnosis_summary}"
                    </p>
                  )}
                </div>
              </div>

              {/* Section B — AI Assumptions Panel */}
              {session.assumptions && session.assumptions.length > 0 && (
                <div>
                  <h3 className={styles.sectionTitle}>
                    AI Assumptions
                  </h3>
                  <div className={styles.assumptionsGrid}>
                    {session.assumptions.map((a, i) => (
                      <div key={i} className={styles.assumptionCard}>
                        <div className={styles.cardIcon}>⚠</div>
                        <div className={styles.cardBody}>
                          <span className={styles.assumptionNumber}>Assumption #{i + 1}</span>
                          <div className={styles.comparisonColumns}>
                            <div>
                              <div className={styles.columnHeader}>What AI Heard / Assumed</div>
                              <p className={styles.columnText}>{a.assumption}</p>
                            </div>
                            <div>
                              <div className={styles.columnHeader}>What You Meant</div>
                              <p className={styles.columnTextStrong}>{a.reality}</p>
                            </div>
                          </div>
                          {a.impact && (
                            <p className={styles.impactText}>
                              <strong>Impact:</strong> {a.impact}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section C — Three Rewrite Variants */}
              {session.rewrites && session.rewrites.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                  <h3 className={styles.sectionTitle}>
                    Three Rewrite Variants
                  </h3>
                  <div className={styles.rewriteGrid}>
                    {session.rewrites.map((rw) => (
                      <div
                        key={rw.id}
                        className={`${styles.rewriteCard} ${selectedRewriteId === rw.id ? styles.selected : ''}`}
                      >
                        <div className={styles.variantHeader}>
                          <span className={styles.rewriteStrategyBadge}>FIX {rw.id}</span>
                          <span className={styles.variantStrategy}>{rw.strategy}</span>
                        </div>

                        <div className={styles.fixesPills}>
                          {rw.fixes.map((f, idx) => (
                            <span key={idx} className={styles.pill}>{f.replace('_', ' ')}</span>
                          ))}
                        </div>

                        <pre className={styles.rewritePromptBox}>{rw.rewritten_prompt}</pre>

                        <div className={styles.rewritePredicted}>
                          <strong>Predicted Output</strong>
                          {rw.predicted_output}
                        </div>

                        <button
                          className={styles.btnSelectFix}
                          onClick={() => handleSelectRewrite(rw.id)}
                          id={`select-rewrite-${rw.id}`}
                        >
                          {selectedRewriteId === rw.id ? '✓ Selected' : 'Select This Fix'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedRewriteId && (
                    <div className={styles.modePanel} style={{ padding: 'var(--space-6)' }}>
                      <label className={styles.blendLabel} htmlFor="blend-editor">
                        Blend manually — edit the selected rewrite:
                      </label>
                      <textarea
                        id="blend-editor"
                        className={styles.blendEditor}
                        value={blendText}
                        onChange={(e) => setBlendText(e.target.value)}
                        rows={6}
                      />
                      <button
                        className={styles.btnSave}
                        onClick={handleSave}
                        disabled={!blendText.trim() || isSaving}
                        id="save-to-library-btn"
                      >
                        {isSaving ? 'Saving…' : '↗ Save to Library'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section D — Pattern Warning */}
              {session.pattern_warning && (
                <div className={styles.patternWarning}>
                  <div className={styles.warningIcon}>⚠</div>
                  <div className={styles.warningBody}>
                    <span className={styles.warningTitle}>Pattern Detected</span>
                    <p className={styles.warningText}>{session.pattern_warning}</p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          kind={toast.kind}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
