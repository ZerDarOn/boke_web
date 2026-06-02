type PrismGrammar = object;

type PrismRegistrar = {
  registerLanguage: (name: string, grammar: PrismGrammar) => void;
};

const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
  html: 'markup',
  xml: 'markup',
};

const loaders: Record<string, () => Promise<{ default: PrismGrammar }>> = {
  javascript: () => import('refractor/javascript'),
  typescript: () => import('refractor/typescript'),
  tsx: () => import('refractor/tsx'),
  jsx: () => import('refractor/jsx'),
  json: () => import('refractor/json'),
  bash: () => import('refractor/bash'),
  css: () => import('refractor/css'),
  markup: () => import('refractor/markup'),
  markdown: () => import('refractor/markdown'),
  python: () => import('refractor/python'),
  java: () => import('refractor/java'),
  go: () => import('refractor/go'),
  rust: () => import('refractor/rust'),
  sql: () => import('refractor/sql'),
  yaml: () => import('refractor/yaml'),
  docker: () => import('refractor/docker'),
  csharp: () => import('refractor/csharp'),
  cpp: () => import('refractor/cpp'),
  c: () => import('refractor/c'),
};

const registered = new Set<string>();

export function resolvePrismLanguage(lang: string): string | null {
  const key = lang.toLowerCase().trim();
  const canonical = ALIASES[key] ?? key;
  return canonical in loaders ? canonical : null;
}

export async function loadPrismLanguage(
  highlighter: PrismRegistrar,
  language: string
): Promise<string | null> {
  const canonical = resolvePrismLanguage(language);
  if (!canonical) return null;

  if (!registered.has(canonical)) {
    const mod = await loaders[canonical]();
    highlighter.registerLanguage(canonical, mod.default);
    registered.add(canonical);
  }
  return canonical;
}

export function hasPrismLanguage(language: string): boolean {
  return resolvePrismLanguage(language) !== null;
}
