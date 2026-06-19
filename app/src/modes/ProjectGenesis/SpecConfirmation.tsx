import { useState } from 'react';
import { Play } from 'lucide-react';
import styles from './ProjectGenesis.module.css';

interface SpecConfirmationProps {
  initialSpec: any;
  onSubmit: (spec: any) => void;
  loading: boolean;
}

export default function SpecConfirmation({
  initialSpec,
  onSubmit,
  loading,
}: SpecConfirmationProps) {
  const [spec, setSpec] = useState({
    product_name: initialSpec?.product_name || 'My Project',
    one_liner: initialSpec?.one_liner || '',
    users: initialSpec?.users || '',
    platform: initialSpec?.platform || '',
    core_action: initialSpec?.core_action || '',
    tech_stack: Array.isArray(initialSpec?.tech_stack)
      ? initialSpec.tech_stack.join(', ')
      : (initialSpec?.tech_stack || ''),
    has_backend: initialSpec?.has_backend ?? false,
    has_database: initialSpec?.has_database ?? false,
    has_ai: initialSpec?.has_ai ?? false,
    ai_details: initialSpec?.ai_details || '',
    out_of_scope: Array.isArray(initialSpec?.out_of_scope)
      ? initialSpec.out_of_scope.join(', ')
      : (initialSpec?.out_of_scope || ''),
    done_when: initialSpec?.done_when || '',
    deployment: initialSpec?.deployment || '',
    solo_or_team: initialSpec?.solo_or_team || 'solo',
  });

  const handleChange = (key: string, value: any) => {
    setSpec((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Convert comma-separated strings back to arrays
    const formattedSpec = {
      ...spec,
      tech_stack: spec.tech_stack.split(',').map((s: string) => s.trim()).filter(Boolean),
      out_of_scope: spec.out_of_scope.split(',').map((s: string) => s.trim()).filter(Boolean),
    };
    onSubmit(formattedSpec);
  };

  return (
    <div className={styles.specBox}>
      <div className={styles.label}>Review & Refine Validated Specification</div>
      
      <form onSubmit={handleSubmit} className={styles.specGrid}>
        
        {/* Name */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Product Name</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.product_name}
            onChange={(e) => handleChange('product_name', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Platform */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Platform</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.platform}
            onChange={(e) => handleChange('platform', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* One Liner */}
        <div className={`${styles.specItem} ${styles.specFullWidth}`}>
          <label className={styles.specItemLabel}>One-Sentence Description</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.one_liner}
            onChange={(e) => handleChange('one_liner', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Core Users */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Primary Users</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.users}
            onChange={(e) => handleChange('users', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Core Action */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Core v1 Action</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.core_action}
            onChange={(e) => handleChange('core_action', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Tech Stack */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Tech Stack (comma separated)</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.tech_stack}
            onChange={(e) => handleChange('tech_stack', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Deployment */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Target Deployment</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.deployment}
            onChange={(e) => handleChange('deployment', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className={styles.specDivider} />

        {/* Architecture Flags */}
        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Has Dedicated Backend?</label>
          <select
            className={styles.specSelect}
            value={String(spec.has_backend)}
            onChange={(e) => handleChange('has_backend', e.target.value === 'true')}
            disabled={loading}
          >
            <option value="false">No (Frontend-only / Serverless)</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Requires Database?</label>
          <select
            className={styles.specSelect}
            value={String(spec.has_database)}
            onChange={(e) => handleChange('has_database', e.target.value === 'true')}
            disabled={loading}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>Has AI Integrations?</label>
          <select
            className={styles.specSelect}
            value={String(spec.has_ai)}
            onChange={(e) => handleChange('has_ai', e.target.value === 'true')}
            disabled={loading}
          >
            <option value="false">No AI features</option>
            <option value="true">Yes</option>
          </select>
        </div>

        <div className={styles.specItem}>
          <label className={styles.specItemLabel}>AI Model Details (if any)</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.ai_details}
            placeholder="e.g. Gemini 1.5 Flash via API"
            onChange={(e) => handleChange('ai_details', e.target.value)}
            disabled={loading || !spec.has_ai}
          />
        </div>

        <div className={styles.specDivider} />

        {/* Done condition */}
        <div className={`${styles.specItem} ${styles.specFullWidth}`}>
          <label className={styles.specItemLabel}>Definition of Done (when is v1 finished?)</label>
          <textarea
            className={`${styles.textarea} ${styles.specTextarea}`}
            value={spec.done_when}
            onChange={(e) => handleChange('done_when', e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Out of scope */}
        <div className={`${styles.specItem} ${styles.specFullWidth}`}>
          <label className={styles.specItemLabel}>Out of Scope for v1 (comma separated)</label>
          <input
            type="text"
            className={styles.specInput}
            value={spec.out_of_scope}
            onChange={(e) => handleChange('out_of_scope', e.target.value)}
            disabled={loading}
          />
        </div>

        <div className={`${styles.actionRow} ${styles.specFullWidth}`} style={{ marginTop: '20px' }}>
          <button
            className={styles.btn}
            type="submit"
            disabled={loading}
          >
            <Play size={16} />
            {loading ? 'Building Workspace...' : 'Generate 8 Build Documents'}
          </button>
        </div>
      </form>
    </div>
  );
}
