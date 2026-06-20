import React, { useEffect, useRef, useState } from 'react';
import styles from './DocBrutalist.module.css';

interface RewriteViewProps {
  rewriteContent: string;
  onContentChange: (content: string) => void;
  onReset: () => void;
}

export default function RewriteView({
  rewriteContent,
  onContentChange,
  onReset,
}: RewriteViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [localContent, setLocalContent] = useState(rewriteContent);
  const [wordCount, setWordCount] = useState(0);

  // Calculate word count
  const calculateWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  useEffect(() => {
    setLocalContent(rewriteContent);
    setWordCount(calculateWords(rewriteContent));
    if (editorRef.current && editorRef.current.innerText !== rewriteContent) {
      editorRef.current.innerText = rewriteContent;
    }
  }, [rewriteContent]);

  // Debouncing changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localContent !== rewriteContent) {
        onContentChange(localContent);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localContent, rewriteContent, onContentChange]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = editorRef.current?.innerText || '';
    setLocalContent(text);
    setWordCount(calculateWords(text));
  };

  return (
    <div className={styles.rewriteContainer}>
      <div className={styles.editorTools}>
        <div className={styles.wordCount}>
          Word Count: <strong>{wordCount}</strong>
        </div>
        <button className={styles.resetBtn} onClick={onReset}>
          Reset to Generated
        </button>
      </div>

      <div
        ref={editorRef}
        className={styles.editableArea}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        {...{ placeholder: "Rewritten documentation will appear here. Edit it directly..." }}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
