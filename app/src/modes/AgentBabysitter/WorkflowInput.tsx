import { useState } from 'react';
import styles from './WorkflowInput.module.css';

interface WorkflowInputProps {
  onAnalyze: (task: string) => void;
  isLoading: boolean;
}

export default function WorkflowInput({ onAnalyze, isLoading }: WorkflowInputProps) {
  const [task, setTask] = useState('');

  return (
    <div className={styles.modePanel}>
      <div className={styles.helpBlock}>
        <div className={styles.helpTitle}>How to use Agent Babysitter:</div>
        <ol className={styles.helpList}>
          <li>Describe the full multi-step task your AI agent will run</li>
          <li>Mirror maps which steps are risky or irreversible</li>
          <li>As your agent runs (in Cursor, Claude Code, etc.), paste each step's output here</li>
          <li>Mirror monitors for drift and gates irreversible actions</li>
          <li>You stay in control — the agent can't do something permanent without your approval</li>
        </ol>
      </div>

      <label className={styles.label} htmlFor="task-input">
        What task is your agent running?
      </label>
      <textarea
        id="task-input"
        className={styles.textarea}
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder={'e.g. "Research 10 competitors, summarize each, write a comparison report, then email it to the team"'}
        rows={5}
        disabled={isLoading}
      />
      <div className={styles.footer}>
        <span className={styles.hint}>
          Describe the full multi-step task. Mirror will map the risk of each step.
        </span>
        <button
          className={styles.btnDefine}
          onClick={() => onAnalyze(task)}
          disabled={!task.trim() || isLoading}
          id="define-checkpoints-btn"
        >
          Define Checkpoints
        </button>
      </div>
    </div>
  );
}
