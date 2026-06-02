import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import CodeBlock from './markdown/CodeBlock';

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
            return (
              <Code className={className} {...props}>
                {children}
              </Code>
            );
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

          const lang = match[1];
          return (
            <CodeBlock
              language={lang}
              code={codeString}
              onCopy={onCopyCode ? () => onCopyCode(codeString, lang) : undefined}
              copied={copiedCode === lang}
            />
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
