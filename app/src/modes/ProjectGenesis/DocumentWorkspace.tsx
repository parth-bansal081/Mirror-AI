import { useState } from 'react';
import { FileText, Download, RotateCcw, Eye, Edit3, CheckCircle } from 'lucide-react';
import JSZip from 'jszip';
import styles from './ProjectGenesis.module.css';

interface DocumentWorkspaceProps {
  spec: any;
  documents: Record<string, string>;
  onSaveDoc: (key: string, content: string) => void;
  onReset: () => void;
}

const DOC_METADATA: Record<string, { label: string }> = {
  'PRD': { label: 'Product Requirements (PRD)' },
  'TECH_SPEC': { label: 'Technical Spec (TECH_SPEC)' },
  'APP_FLOW': { label: 'App Flow Diagram (APP_FLOW)' },
  'DESIGN': { label: 'Design System (DESIGN)' },
  'SCHEMA': { label: 'Data Schema (SCHEMA)' },
  'IMPLEMENTATION_PLAN': { label: 'Implementation Plan' },
  'TRACKER': { label: 'Build Tracker (TRACKER)' },
  'RULES': { label: 'Agent Rules (RULES)' },
  'AGENT_PROMPT': { label: 'Agent Prompt Guide' },
};

export default function DocumentWorkspace({
  spec,
  documents,
  onSaveDoc,
  onReset,
}: DocumentWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>('PRD');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  // Compute AGENT_PROMPT content dynamically
  const getAgentPrompt = () => {
    return `# Developer Agent System Rules

You are a senior software development agent tasked with executing the build plan for **${spec?.product_name || 'My Project'}**.
Please read all the documents in this workspace before proceeding:
1. Product Requirements Document (PRD)
2. Technical Specification (TECH_SPEC)
3. App Flow Chart (APP_FLOW)
4. Design Style Sheet (DESIGN)
5. Database Schema & API Types (SCHEMA)
6. Step-by-Step Implementation Plan (IMPLEMENTATION_PLAN)
7. Build Tracker Checklist (TRACKER)
8. Agent System Rules (RULES)

Follow the implementation phase order exactly. Do not skip steps. Output strict TypeScript and modular CSS.

---

### Project Metadata
- **Product Name:** ${spec?.product_name}
- **One Liner:** ${spec?.one_liner}
- **Primary Users:** ${spec?.users}
- **Target Platform:** ${spec?.platform}
- **Core v1 Action:** ${spec?.core_action}
- **Tech Stack:** ${spec?.tech_stack?.join(', ')}
- **Definition of Done:** ${spec?.done_when}
- **Deployment Plan:** ${spec?.deployment}
`;
  };

  const currentContent = activeTab === 'AGENT_PROMPT' 
    ? (documents['AGENT_PROMPT'] || getAgentPrompt())
    : (documents[activeTab] || '');

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSaveDoc(activeTab, e.target.value);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();

      // Add 8 core documents
      Object.entries(documents).forEach(([key, content]) => {
        if (key !== 'AGENT_PROMPT') {
          zip.file(`${key}.md`, content);
        }
      });

      // Add the 9th AGENT_PROMPT.md
      const agentPromptText = documents['AGENT_PROMPT'] || getAgentPrompt();
      zip.file('AGENT_PROMPT.md', agentPromptText);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(spec?.product_name || 'project').toLowerCase().replace(/\s+/g, '-')}-build-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP bundle:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Custom regex markdown preview renderer
  const renderMarkdown = (content: string) => {
    if (!content) return null;
    const blocks: React.ReactNode[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeLines: string[] = [];

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          blocks.push(
            <pre key={`code-${idx}`}>
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
          codeLines = [];
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (line.startsWith('# ')) {
        blocks.push(<h1 key={idx}>{line.slice(2)}</h1>);
      } else if (line.startsWith('## ')) {
        blocks.push(<h2 key={idx}>{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        blocks.push(<h3 key={idx}>{line.slice(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        blocks.push(<li key={idx}>{line.slice(2)}</li>);
      } else if (line.trim() === '') {
        blocks.push(<div key={idx} style={{ height: '8px' }} />);
      } else {
        blocks.push(<p key={idx}>{line}</p>);
      }
    });

    return <div className={styles.previewPane}>{blocks}</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div className={styles.workspace}>
        {/* Sidebar tabs */}
        <div className={styles.workspaceSidebar}>
          <div className={styles.workspaceSidebarHeader}>Build Documents</div>
          {Object.keys(DOC_METADATA).map((key) => (
            <div
              key={key}
              className={`${styles.docTab} ${activeTab === key ? styles.docTabActive : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <FileText className={styles.docTabIcon} />
              <span>{DOC_METADATA[key].label}</span>
            </div>
          ))}
        </div>

        {/* Content Pane */}
        <div className={styles.workspaceContent}>
          <div className={styles.workspaceToolbar}>
            <span className={styles.docTitle}>{DOC_METADATA[activeTab].label}</span>
            
            <div className={styles.toolbarActions}>
              <button
                className={`${styles.toggleBtn} ${!editMode ? styles.toggleBtnActive : ''}`}
                onClick={() => setEditMode(false)}
                type="button"
              >
                <Eye size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
                Preview
              </button>
              <button
                className={`${styles.toggleBtn} ${editMode ? styles.toggleBtnActive : ''}`}
                onClick={() => setEditMode(true)}
                type="button"
              >
                <Edit3 size={12} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
                Edit Markdown
              </button>
            </div>
          </div>

          {editMode ? (
            <textarea
              className={styles.editorPane}
              value={currentContent}
              onChange={handleContentChange}
            />
          ) : (
            renderMarkdown(currentContent)
          )}
        </div>
      </div>

      {/* Footer / Toolbar */}
      <div className={styles.workspaceFooter}>
        <div className={styles.savedIndicator}>
          <div className={styles.savedDot} />
          <span>Autosaved to APS</span>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onReset}
            type="button"
          >
            <RotateCcw size={14} />
            Start New Project
          </button>
          
          <button
            className={styles.btn}
            onClick={handleDownloadZip}
            disabled={downloading}
            type="button"
          >
            <Download size={14} />
            {downloading ? 'Creating ZIP...' : 'Download Build Bundle'}
          </button>
        </div>
      </div>
    </div>
  );
}
