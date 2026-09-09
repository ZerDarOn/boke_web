import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, type FileItem } from '../lib/api';
import {
  fileContentQueryOptions,
  useFilesList,
  useFileContent,
} from '../hooks/queries/files';
import { FileText, Download, Eye, File, Folder, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AboutFileExplorer: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState<string>('');
  const { data: files = [], isLoading: loading, error: filesError, refetch } = useFilesList(currentPath);

  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [contentPassword, setContentPassword] = useState<string>('');
  const [passwordRequired, setPasswordRequired] = useState<FileItem | null>(null);
  const [password, setPassword] = useState<string>('');
  const [passwordIntent, setPasswordIntent] = useState<'preview' | 'download'>('preview');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string>('');

  const {
    data: fileContent,
    isLoading: loadingContent,
    error: contentError,
  } = useFileContent(
    selectedFilePath || undefined,
    contentPassword || undefined
  );

  const listError = filesError?.message || '';
  const viewerError = (selectedFilePath ? contentError?.message || '' : '') || actionError;

  const openPasswordPrompt = (file: FileItem, intent: 'preview' | 'download') => {
    setActionError('');
    setPasswordIntent(intent);
    setPasswordRequired(file);
    setPassword('');
    setPasswordError('');
  };

  const handleFileClick = (file: FileItem) => {
    if (file.protected) {
      openPasswordPrompt(file, 'preview');
    } else {
      setActionError('');
      setContentPassword('');
      setSelectedFilePath(file.path);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordRequired || !password || passwordSubmitting) return;

    const targetFile = passwordRequired;
    const suppliedPassword = password;
    setPasswordError('');
    setActionError('');
    setPasswordSubmitting(true);

    try {
      if (passwordIntent === 'download') {
        const result = await api.files.download(targetFile.path, suppliedPassword);
        if (!result.success) {
          throw new Error(result.error || 'Download failed');
        }
      } else {
        await queryClient.fetchQuery(
          fileContentQueryOptions(targetFile.path, suppliedPassword)
        );
        setSelectedFilePath(targetFile.path);
        setContentPassword(suppliedPassword);
      }

      setPasswordRequired(null);
      setPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Unable to access this file');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (file.protected) {
      openPasswordPrompt(file, 'download');
    } else {
      setActionError('');
      try {
        const result = await api.files.download(file.path);
        if (!result.success) setActionError(result.error || 'Download failed');
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Download failed');
      }
    }
  };

  const handleContentDownload = async () => {
    if (!fileContent?.path) return;

    setActionError('');
    try {
      const result = await api.files.download(
        fileContent.path,
        contentPassword || undefined
      );
      if (!result.success) setActionError(result.error || 'Download failed');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Download failed');
    }
  };

  const handlePathClick = (path: string) => {
    setPasswordRequired(null);
    setPassword('');
    setPasswordError('');
    setCurrentPath(path);
    setSelectedFilePath('');
    setContentPassword('');
    setActionError('');
  };

  const selectedFile = files.find((f) => f.path === selectedFilePath);

  const getFileType = (file: FileItem) => {
    if (!file?.path) return 'binary';
    const ext = file.path.split('.').pop()?.toLowerCase();
    const textExtensions = ['md', 'txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'yaml', 'yml', 'xml', 'csv'];
    if (ext === 'md') return 'markdown';
    if (textExtensions.includes(ext || '')) return 'text';
    return 'binary';
  };

  return <div className="about-library">
    <nav className="about-file-path" aria-label="文件路径"><button type="button" onClick={() => handlePathClick('')}>全部文件</button>{currentPath && currentPath.split('/').map((part, index, parts) => <React.Fragment key={index}><ChevronRight size={13} /><button type="button" onClick={() => handlePathClick(parts.slice(0, index + 1).join('/'))}>{part}</button></React.Fragment>)}</nav>
    {listError && <div className="about-file-error" role="alert"><AlertCircle size={16} /><span>{files.length ? '刷新失败，暂时显示上次加载的文件。' : '文件暂时无法加载。'}</span><button type="button" onClick={() => refetch()}>重试</button></div>}
    {loading && !files.length ? <p className="about-file-empty" role="status">正在整理文件列表…</p> : !listError && !files.length ? <div className="about-file-empty"><Folder size={30} /><p>这里暂时还没有文件。</p><small>有新文档时，会陆续放在这里。</small></div> : <div className="about-file-grid">
      {files.map(file => <article className={'about-file-card' + (file.path === selectedFilePath ? ' is-selected' : '')} key={file.path}>
        <span className="about-file-icon">{file.type === 'directory' ? <Folder size={23} /> : getFileType(file) === 'markdown' ? <FileText size={23} /> : <File size={23} />}</span>
        <div className="about-file-copy"><h3>{file.name}{file.protected && <Lock size={12} aria-label="需要密码" />}</h3><small>{file.type === 'directory' ? '文件夹' : ((file.size ?? 0) / 1024).toFixed(1) + ' KB'}</small></div>
        <div className="about-file-actions"><button type="button" disabled={passwordSubmitting} onClick={() => file.type === 'directory' ? handlePathClick(file.path) : handleFileClick(file)} aria-label={(file.type === 'directory' ? '打开 ' : '阅读 ') + file.name}>{file.type === 'directory' ? <ChevronRight size={15} /> : <Eye size={15} />}{file.type === 'directory' ? '打开' : '查看'}</button>{file.type === 'file' && <button type="button" disabled={passwordSubmitting} onClick={() => void handleDownload(file)} aria-label={'下载 ' + file.name}><Download size={15} />下载</button>}</div>
      </article>)}
    </div>}
    {viewerError && <div className="about-file-error" role="alert"><AlertCircle size={16} /><span>{viewerError}</span></div>}
    {passwordRequired && <form className="about-file-password" onSubmit={event => { event.preventDefault(); void handlePasswordSubmit(); }} aria-label="文件访问密码">
      <h3><Lock size={18} />访问加锁文件</h3><p>{passwordRequired.name} 需要密码才能{passwordIntent === 'download' ? '下载' : '阅读'}。</p>
      <label htmlFor="about-file-password">访问密码</label><input id="about-file-password" type="password" value={password} onChange={event => { setPassword(event.target.value); setPasswordError(''); }} disabled={passwordSubmitting} autoFocus autoComplete="off" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'about-password-error' : undefined} />
      {passwordError && <p id="about-password-error" role="alert">{passwordError}</p>}
      <div><button type="button" disabled={passwordSubmitting} onClick={() => { setPasswordRequired(null); setPassword(''); setPasswordError(''); }}>取消</button><button type="submit" disabled={!password || passwordSubmitting}>{passwordSubmitting ? '正在验证…' : '验证并继续'}</button></div>
    </form>}
    {selectedFilePath && <section className="about-file-reader" aria-label="文件阅读区">
      <header><h3>{selectedFile?.name || selectedFilePath.split('/').pop()}</h3><button type="button" onClick={() => { setSelectedFilePath(''); setContentPassword(''); setActionError(''); }}>收起阅读</button><button type="button" onClick={() => void handleContentDownload()} disabled={!fileContent?.path}><Download size={14} />下载</button></header>
      {loadingContent ? <p role="status">正在读取…</p> : fileContent?.path ? (() => {
        const fileType = getFileType({ path: fileContent.path } as FileItem);
        if (fileType === 'markdown') return <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent.content || ''}</ReactMarkdown></div>;
        if (fileType === 'text') return <pre>{fileContent.content || ''}</pre>;
        return <div className="about-file-empty"><File size={30} /><p>这类附件暂不支持在线预览，请下载后查看。</p></div>;
      })() : null}
    </section>}
  </div>;
};

export default AboutFileExplorer;
