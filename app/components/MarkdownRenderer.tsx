'use client';

import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

// Max nodes any single text section can produce — used to space out React keys
const TEXT_SECTION_KEY_STRIDE = 200;

const HEADING_CLASS: Record<number, string> = {
  1: 'text-[15px] font-semibold text-gray-900 mt-4 mb-1',
  2: 'text-[14px] font-semibold text-gray-900 mt-3 mb-1',
  3: 'text-[13px] font-semibold text-gray-800 mt-2 mb-0.5',
};

const HEADING_TAG: Record<number, keyof React.JSX.IntrinsicElements> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
};

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="bg-gray-100 text-[#c7254e] px-1.5 py-0.5 rounded text-[0.8em] font-mono border border-gray-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopyState('copied');
        setTimeout(() => setCopyState('idle'), 2000);
      },
      () => {
        setCopyState('error');
        setTimeout(() => setCopyState('idle'), 2000);
      }
    );
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#F8F8FA] border-b border-gray-200">
        <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wide">
          {lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          title={copyState === 'error' ? 'Copy failed' : 'Copy code'}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
        >
          {copyState === 'copied' ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : copyState === 'error' ? (
            <X className="w-3 h-3 text-red-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          <span>{copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Failed' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 bg-[#1C1C28] text-[#E2E8F0] text-[13px] font-mono overflow-x-auto leading-[1.7]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function parseTextSection(text: string, keyOffset: number): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = keyOffset;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const Tag = HEADING_TAG[level];
      nodes.push(
        <Tag key={key++} className={HEADING_CLASS[level]}>
          {parseInline(headingMatch[2])}
        </Tag>
      );
      i++;
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      nodes.push(
        <ul key={key++} className="space-y-1.5 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="mt-[9px] w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      const start = parseInt(line.match(/^(\d+)\./)![1]);
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      nodes.push(
        <ol key={key++} className="space-y-1.5 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="text-gray-400 text-[12px] mt-px min-w-[18px] font-mono">
                {start + j}.
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    nodes.push(
      <p key={key++} className="leading-relaxed">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

interface MarkdownRendererProps {
  content: string;
  isStreaming: boolean;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const nodes: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyOffset = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...parseTextSection(content.slice(lastIndex, match.index), keyOffset));
      keyOffset += TEXT_SECTION_KEY_STRIDE;
    }
    nodes.push(
      <CodeBlock key={`code-${match.index}`} lang={match[1]} code={match[2].trim()} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    nodes.push(...parseTextSection(content.slice(lastIndex), keyOffset));
  }

  return (
    <div className="text-[14px] text-gray-800 leading-relaxed space-y-2">
      {nodes}
      {isStreaming && (
        <span className="cursor-blink inline-block w-[2px] h-[1em] bg-gray-600 ml-0.5 align-middle" />
      )}
    </div>
  );
}
