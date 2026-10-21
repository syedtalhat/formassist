import React from 'react';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Helper to format inline elements: **bold**, `code`, *italic*
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex splits by: **bold**, `code`, or *italic*
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-text-primary">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={match.index}
            className="px-1 py-0.5 rounded bg-surface-muted font-mono text-[11px] text-primary-container border border-border-subtle"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(
          <em key={match.index} className="italic text-text-primary">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Split content by lines
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      // Empty line -> small spacer
      elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      continue;
    }

    // Check for numbered list: e.g. "1. " or "2. "
    const numMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const indentLevel = Math.floor(numMatch[1].length / 2);
      const numberStr = numMatch[2];
      const textContent = numMatch[3];

      elements.push(
        <div
          key={`num-${i}`}
          style={{ paddingLeft: `${indentLevel * 12}px` }}
          className="flex gap-1.5 items-start my-0.5"
        >
          <span className="font-bold text-primary-container select-none shrink-0 text-xs mt-0.5">
            {numberStr}.
          </span>
          <div className="flex-1 leading-relaxed text-xs">
            {renderInline(textContent)}
          </div>
        </div>
      );
      continue;
    }

    // Check for bullet list: e.g. "* " or "- "
    const bulletMatch = rawLine.match(/^(\s*)[\*\-]\s+(.*)$/);
    if (bulletMatch) {
      const indentLevel = Math.max(1, Math.floor(bulletMatch[1].length / 2) + 1);
      const textContent = bulletMatch[2];

      elements.push(
        <div
          key={`bullet-${i}`}
          style={{ paddingLeft: `${indentLevel * 10}px` }}
          className="flex gap-1.5 items-start my-0.5"
        >
          <span className="text-primary-container select-none shrink-0 text-[10px] mt-1 leading-none">
            ●
          </span>
          <div className="flex-1 leading-relaxed text-xs">
            {renderInline(textContent)}
          </div>
        </div>
      );
      continue;
    }

    // Normal paragraph line
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-xs my-0.5">
        {renderInline(rawLine)}
      </p>
    );
  }

  return <div className={`formatted-markdown flex flex-col gap-0.5 ${className}`}>{elements}</div>;
};
