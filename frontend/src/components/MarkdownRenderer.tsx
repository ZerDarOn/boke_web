import React, { lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then((mod) => ({ default: mod.Prism }))
);

const oneDarkPromise = import('react-syntax-highlighter/dist/esm/styles/prism').then(
  (mod) => mod.oneDark
);

type MarkdownRendererProps = {
  content: string;
  onCopyCode?: (code: string, language: string) => void;
  copiedCode?: string | null;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCopyCode,
  copiedCode,
}) => {
  const [codeStyle, setCodeStyle] = React.useState<Record<string, React.CSSProperties>>();

  React.useEffect(() => {
    oneDarkPromise.then(setCodeStyle);
  }, []);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          const inline = !match;

          if (inline) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }

          return (
            <Suspense
              fallback={
                <pre className="p-4 bg-gray-900 text-gray-100 rounded text-sm overflow-x-auto">
                  <code>{codeString}</code>
                </pre>
              }
            >
              {codeStyle && (
                <div className="relative group">
                  {onCopyCode && (
                    <button
                      type="button"
                      onClick={() => onCopyCode(codeString, match[1])}
                      className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-white/10 rounded"
                    >
                      {copiedCode === match[1] ? 'Copied' : 'Copy'}
                    </button>
                  )}
                  <SyntaxHighlighter
                    style={codeStyle}
                    language={match[1]}
                    PreTag="motionless"
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              )}
            </Suspense>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
