import React, { useState } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { invokeAnna, TOOLS } from '../../hooks/useAnna';
import { saveBrutalistSession, uuidv4 } from '../../hooks/useProfile';
import { Issue, BrutalistSession } from '../../store/types';
import DocInput from './DocInput';
import AnalysisProgress from './AnalysisProgress';
import ResultsWorkspace from './ResultsWorkspace';
import styles from './DocBrutalist.module.css';

type StageType = 'input' | 'analyzing' | 'results';

export default function DocBrutalist() {
  const { setError, incrementSessionCount } = useProfileStore();

  // Inputs state
  const [docContent, setDocContent] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [fiveMinuteGoal, setFiveMinuteGoal] = useState('');

  // Session stage state
  const [stage, setStage] = useState<StageType>('input');

  // Analysis result state
  const [clarityScore, setClarityScore] = useState(0);
  const [clarityVerdict, setClarityVerdict] = useState('');
  const [estimatedFailureRate, setEstimatedFailureRate] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [missingSections, setMissingSections] = useState<string[]>([]);
  const [topThreeFixes, setTopThreeFixes] = useState<string[]>([]);
  const [timeToFirstSuccess, setTimeToFirstSuccess] = useState('');

  // Human review decisions
  const [confirmedIssues, setConfirmedIssues] = useState<string[]>([]);
  const [rejectedIssues, setRejectedIssues] = useState<string[]>([]);
  const [acceptedImprovements, setAcceptedImprovements] = useState<string[]>([]);
  const [rejectedImprovements, setRejectedImprovements] = useState<string[]>([]);

  // Rewrite state
  const [rewriteContent, setRewriteContent] = useState('');

  const handleStartAnalysis = async () => {
    setError(null);
    setStage('analyzing');

    try {
      const result = await invokeAnna<{
        clarity_score: number;
        clarity_verdict: string;
        estimated_user_failure_rate: string;
        issues: Issue[];
        missing_sections: string[];
        top_3_fixes: string[];
        time_to_first_success: string;
      }>(
        TOOLS.DOC_BRUTALIST,
        'analyze_docs',
        {
          doc_content: docContent,
          target_user: targetUser,
          five_minute_goal: fiveMinuteGoal,
        }
      );

      setClarityScore(result.clarity_score);
      setClarityVerdict(result.clarity_verdict);
      setEstimatedFailureRate(result.estimated_user_failure_rate);
      setIssues(result.issues);
      setMissingSections(result.missing_sections);
      setTopThreeFixes(result.top_3_fixes);
      setTimeToFirstSuccess(result.time_to_first_success);

      // Default all issues to confirmed initially
      setConfirmedIssues(result.issues.map((i) => i.id));
      setRejectedIssues([]);
      setAcceptedImprovements([]);
      setRejectedImprovements([]);
      setRewriteContent('');
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze documentation.');
      setStage('input');
    }
  };

  const handleGenerateRewrite = async () => {
    setError(null);
    try {
      const confirmedList = issues.filter((i) => confirmedIssues.includes(i.id));
      const rewrite = await invokeAnna<string>(
        TOOLS.DOC_BRUTALIST,
        'generate_rewrite',
        {
          original_doc: docContent,
          target_user: targetUser,
          five_minute_goal: fiveMinuteGoal,
          confirmed_issues: confirmedList,
          accepted_improvements: acceptedImprovements,
        }
      );
      setRewriteContent(rewrite);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate rewritten documentation.');
    }
  };

  const handleSaveToProfile = async (finalScore: number) => {
    // Extract document title from first header or default
    const headingMatch = docContent.match(/^#\s+(.+)$/m);
    const docTitle = headingMatch ? headingMatch[1].trim() : 'Untitled Documentation';

    const session: BrutalistSession = {
      id: uuidv4(),
      date: new Date().toISOString(),
      doc_title: docTitle,
      target_user: targetUser,
      original_clarity_score: clarityScore,
      final_clarity_score: finalScore,
      issues_found: issues.length,
      issues_confirmed: confirmedIssues.length,
      issues_fixed: confirmedIssues.length,
      downloaded: false,
    };

    try {
      await saveBrutalistSession(session);
      incrementSessionCount();
    } catch (err: any) {
      setError('Failed to save session to profile.');
    }
  };

  const handleAnalysisComplete = () => {
    setStage('results');
  };

  return (
    <div className={styles.container}>
      {stage === 'input' && (
        <DocInput
          docContent={docContent}
          setDocContent={setDocContent}
          targetUser={targetUser}
          setTargetUser={setTargetUser}
          fiveMinuteGoal={fiveMinuteGoal}
          setFiveMinuteGoal={setFiveMinuteGoal}
          onSubmit={handleStartAnalysis}
        />
      )}

      {stage === 'analyzing' && (
        <AnalysisProgress onComplete={handleAnalysisComplete} />
      )}

      {stage === 'results' && (
        <ResultsWorkspace
          originalDoc={docContent}
          baseScore={clarityScore}
          clarityVerdict={clarityVerdict}
          estimatedFailureRate={estimatedFailureRate}
          issues={issues}
          confirmedIssues={confirmedIssues}
          setConfirmedIssues={setConfirmedIssues}
          rejectedIssues={rejectedIssues}
          setRejectedIssues={setRejectedIssues}
          acceptedImprovements={acceptedImprovements}
          setAcceptedImprovements={setAcceptedImprovements}
          rejectedImprovements={rejectedImprovements}
          setRejectedImprovements={setRejectedImprovements}
          rewriteContent={rewriteContent}
          setRewriteContent={setRewriteContent}
          targetUser={targetUser}
          onSaveToProfile={handleSaveToProfile}
          onGenerateRewrite={handleGenerateRewrite}
        />
      )}
    </div>
  );
}
