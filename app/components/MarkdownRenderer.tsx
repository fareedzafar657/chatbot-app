'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, X } from 'lucide-react';

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

interface MarkdownRendererProps {
  content: string;
  isStreaming: boolean;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  return (
    <div className="text-[14px] text-gray-800 leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-[15px] font-semibold text-gray-900 mt-4 mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-[14px] font-semibold text-gray-900 mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-[13px] font-semibold text-gray-800 mt-2 mb-0.5">{children}</h3>,
          p:  ({ children }) => <p className="leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em:     ({ children }) => <em className="italic">{children}</em>,
          code: ({ className, children, ...props }) => {
            // Block code is handled by the `pre` component — inline code lands here
            const isInline = !('data-language' in props);
            if (isInline) {
              return (
                <code className="bg-gray-100 text-[#c7254e] px-1.5 py-0.5 rounded text-[0.8em] font-mono border border-gray-200">
                  {children}
                </code>
              );
            }
            return <code className={className}>{children}</code>;
          },
          pre: ({ children }) => {
            // Extract lang and code from the nested <code> element react-markdown produces
            const child = React.Children.toArray(children)[0] as React.ReactElement<{ className?: string; children?: string }>;
            const lang  = child?.props?.className?.replace('language-', '') ?? '';
            const code  = String(child?.props?.children ?? '').trimEnd();
            return <CodeBlock lang={lang} code={code} />;
          },
          ul: ({ children }) => <ul className="space-y-1.5 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-1.5 my-2">{children}</ol>,
          li: ({ children }) => (
            <li className="flex items-start gap-2.5">
              <span className="mt-[9px] w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              <span>{children}</span>
            </li>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-gray-300 pl-3 text-gray-500 italic my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-[13px] border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 bg-gray-50">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-gray-600 border-b border-gray-100">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="cursor-blink inline-block w-[2px] h-[1em] bg-gray-600 ml-0.5 align-middle" />
      )}
    </div>
  );
}
