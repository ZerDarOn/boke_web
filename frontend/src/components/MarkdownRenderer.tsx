import React, { lazy, Suspense } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';

/** 按需加载语言定义，避免打包全部 Prism 语言 */
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter/dist/esm/prism-async-light').then((mod) => ({
    default: mod.default,
  }))
);

const oneDarkPromise = import('react-syntax-highlighter/dist/esm/styles/prism/one-dark').then(
  (mod) => mod.default
);

type MarkdownRendererProps = {
  content: string;
  onCopyCode?: (code: string, language: string) => void;
  copiedCode?: string | null;
  components?: Components;
  rehypePlugins?: React.ComponentProps<typeof ReactMarkdown>['rehypePlugins'];
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onCopyCode,
  copiedCode,
  components: extraComponents,
  rehypePlugins = [rehypeRaw, rehypeSlug],
}) => {
  const { code: customCode, ...restComponents } = extraComponents ?? {};
  const [codeStyle, setCodeStyle] = React.useState<Record<string, React.CSSProperties>>();

  React.useEffect(() => {
    oneDarkPromise.then(setCodeStyle);
  }, []);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins}
      components={{
        ...restComponents,
        code({ className, children, ...props }) {
          if (typeof customCode === 'function') {
            const Code = customCode as React.FC<{
              className?: string;
              children?: React.ReactNode;
            }>;
            return <Code className={className} {...props}>{children}</Code>;
          }
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          const inline = !match;

          if (inline) {
            return (
              <code
                className={`px-2 py-1 bg-gray-100 dark:bg-white/10 text-neon font-mono text-sm rounded border border-gray-200 dark:border-white/20 ${className ?? ''}`}
                {...props}
              >
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
                      {copiedCode === match[1] ? '已复制' : '复制'}
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
