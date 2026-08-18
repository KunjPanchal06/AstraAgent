// ════════════════════════════════════════════════════════════════
// FILE: components/agent/markdown.jsx
// PURPOSE: Renders markdown content safely with syntax highlighting,
//          custom link handling, and copy-to-clipboard support.
// EXPORTS: Markdown
// DEPENDS ON: react-markdown, remark-gfm, lucide-react
// ════════════════════════════════════════════════════════════════

import ReactMarkdown from 'react-markdown';
import { memo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy';
import { cn } from '@/lib/utils';

/**
 * Markdown renderer for agent messages.
 * Supports: headings, bold/italic, lists, links, inline/block code,
 * tables, blockquotes. Code blocks get a copy button + language label.
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content
}) {
  return <div className="markdown-body text-sm leading-relaxed">
      <ReactMarkdown components={{
      // Headings
      h1: ({
        children
      }) => <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h3>,
      h2: ({
        children
      }) => <h3 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h3>,
      h3: ({
        children
      }) => <h4 className="mb-1.5 mt-2 text-sm font-semibold first:mt-0">{children}</h4>,
      h4: ({
        children
      }) => <h4 className="mb-1.5 mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
              {children}
            </h4>,
      // Paragraph
      p: ({
        children
      }) => <p className="mb-2 last:mb-0">{children}</p>,
      // Bold / italic
      strong: ({
        children
      }) => <strong className="font-semibold">{children}</strong>,
      em: ({
        children
      }) => <em className="italic">{children}</em>,
      // Links
      a: ({
        href,
        children
      }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-500 dark:text-emerald-400">
              {children}
            </a>,
      // Lists
      ul: ({
        children
      }) => <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>,
      ol: ({
        children
      }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
      li: ({
        children
      }) => <li className="leading-relaxed">{children}</li>,
      // Blockquote
      blockquote: ({
        children
      }) => <blockquote className="my-2 border-l-2 border-emerald-500/40 bg-muted/30 py-1 pl-3 text-muted-foreground">
              {children}
            </blockquote>,
      // Horizontal rule
      hr: () => <hr className="my-3 border-border/60" />,
      // Inline code
      code: ({
        className,
        children,
        ...props
      }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
          return <CodeBlock lang={className?.replace('language-', '') ?? ''} code={String(children).replace(/\n$/, '')} />;
        }
        return <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-emerald-600 dark:text-emerald-400" {...props}>
                {children}
              </code>;
      },
      // Code block wrapper
      pre: ({
        children
      }) => <>{children}</>,
      // Table
      table: ({
        children
      }) => <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>,
      thead: ({
        children
      }) => <thead className="border-b border-border/60">{children}</thead>,
      th: ({
        children
      }) => <th className="px-2 py-1 text-left font-semibold">{children}</th>,
      td: ({
        children
      }) => <td className="border-t border-border/40 px-2 py-1">{children}</td>
    }}>
        {content}
      </ReactMarkdown>
    </div>;
});
function CodeBlock({
  lang,
  code
}) {
  const {
    copied,
    copy
  } = useCopyToClipboard();
  const [expanded, setExpanded] = useState(true);
  const isLong = code.split('\n').length > 20;
  if (isLong && !expanded) {
    return <div className="my-2 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
        <div className="flex items-center justify-between border-b border-border/40 px-2 py-1">
          <span className="font-mono text-[10px] text-muted-foreground">{lang || 'code'}</span>
          <button onClick={() => setExpanded(true)} className="text-[10px] text-emerald-600 hover:underline dark:text-emerald-400">
            show {code.split('\n').length} lines
          </button>
        </div>
      </div>;
  }
  return <div className="scroll-thin my-2 overflow-hidden rounded-lg border border-border/60 bg-muted/40">
      <div className="flex items-center justify-between border-b border-border/40 px-2 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {lang || 'code'}
        </span>
        <button onClick={() => copy(code)} className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Copy code">
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre className="scroll-thin max-h-[300px] overflow-auto p-2.5 font-mono text-[11px] leading-relaxed">
        <code>{code}</code>
      </pre>
      {isLong && <button onClick={() => setExpanded(false)} className="w-full border-t border-border/40 py-1 text-[10px] text-muted-foreground hover:bg-muted/40">
          collapse
        </button>}
    </div>;
}