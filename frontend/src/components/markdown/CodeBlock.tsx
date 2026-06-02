import React, { useEffect, useState } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import { hasPrismLanguage, loadPrismLanguage } from '../../lib/prismLanguages';

const oneDarkPromise = import('react-syntax-highlighter/dist/esm/styles/prism/one-dark').then(
  (mod) => mod.default
);

type CodeBlockProps = {
  language: string;
  code: string;
  onCopy?: () => void;
  copied?: boolean;
};

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, onCopy, copied }) => {
  const [codeStyle, setCodeStyle] = useState<Record<string, React.CSSProperties>>();
  const [prismLang, setPrismLang] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPrismLanguage(language)) {
      setPrismLang(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const [style, loaded] = await Promise.all([
        oneDarkPromise,
        loadPrismLanguage(SyntaxHighlighter, language),
      ]);
      if (cancelled) return;
      setCodeStyle(style);
      setPrismLang(loaded);
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const fallback = (
    <pre className="p-4 bg-gray-900 text-gray-100 rounded text-sm overflow-x-auto">
      <code>{code}</code>
    </pre>
  );

  if (!prismLang || !codeStyle) {
    return fallback;
  }

  return (
    <div className="relative group">
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-white/10 rounded"
        >
          {copied ? '已复制' : '复制'}
        </button>
      )}
      <SyntaxHighlighter style={codeStyle} language={prismLang} PreTag="div">
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
