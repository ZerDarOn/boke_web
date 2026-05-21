import React, { useState } from 'react';
import { api, type FileItem } from '../lib/api';
import { useFilesList, useFileContent } from '../hooks/queries/files';
import { FileText, Download, Eye, File, Folder, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AboutFileExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const { data: files = [], isLoading: loading, error: filesError } = useFilesList(currentPath);

  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [contentPassword, setContentPassword] = useState<string>('');
  const [passwordRequired, setPasswordRequired] = useState<FileItem | null>(null);
  const [password, setPassword] = useState<string>('');

  const {
    data: fileContent,
    isLoading: loadingContent,
    error: contentError,
  } = useFileContent(
    selectedFilePath || undefined,
    contentPassword || undefined
  );

  const error =
    filesError?.message ??
    (selectedFilePath ? contentError?.message ?? '' : '');

  const handleFileClick = (file: FileItem) => {
    if (file.protected) {
      setPasswordRequired(file);
      setPassword('');
    } else {
      setContentPassword('');
      setSelectedFilePath(file.path);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordRequired) {
      setSelectedFilePath(passwordRequired.path);
      setContentPassword(password);
      setPasswordRequired(null);
    }
  };

  const handleDownload = async (file: FileItem) => {
    if (file.protected) {
      setPasswordRequired(file);
      setPassword('');
    } else {
      await api.files.download(file.path);
    }
  };

  const handlePathClick = (path: string) => {
    setCurrentPath(path);
    setSelectedFilePath('');
    setContentPassword('');
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

  return (
    <div className="w-full h-[600px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 shadow-sm flex rounded-lg overflow-hidden font-mono transition-colors">
      <div className="w-1/3 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] flex flex-col">
        <div className="p-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex items-center gap-2 text-xs">
          <button
            onClick={() => handlePathClick('')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 ${!currentPath ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Root
          </button>
          {currentPath &&
            currentPath.split('/').map((part, index, array) => (
              <React.Fragment key={index}>
                <ChevronRight size={12} className="text-gray-400" />
                <button
                  onClick={() => handlePathClick(array.slice(0, index + 1).join('/'))}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 ${index === array.length - 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
        </div>
        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase flex items-center gap-2">
            <Folder size={14} /> /CONTENT
          </h3>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">No files found</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {files.map((file) => {
              const fileType = getFileType(file);
              const isSelected = selectedFilePath === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() =>
                    file.type === 'directory' ? handlePathClick(file.path) : handleFileClick(file)
                  }
                  className={`px-4 py-3 cursor-pointer border-l-2 transition-all duration-200 flex items-center justify-between group ${
                    isSelected
                      ? 'bg-white dark:bg-[#0a0a0a] border-neon text-ink dark:text-white shadow-sm'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-ink dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {file.type === 'directory' ? (
                      <Folder size={16} className="text-yellow-500" />
                    ) : fileType === 'markdown' ? (
                      <FileText size={16} />
                    ) : (
                      <File size={16} />
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold flex items-center gap-1">
                        {file.name}
                        {file.protected && <Lock size={12} className="text-red-500" />}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">
                        {file.size ? `${(file.size / 1024).toFixed(1)}KB` : '0KB'} ·{' '}
                        {new Date(file.modifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.type === 'directory' ? (
                      <ChevronRight size={14} className="text-gray-400" />
                    ) : fileType === 'markdown' ? (
                      <Eye size={14} className="text-neon" />
                    ) : (
                      <Download
                        size={14}
                        className="text-gray-400 hover:text-ink dark:hover:text-white cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 bg-white dark:bg-[#0a0a0a] overflow-y-auto relative">
        {passwordRequired && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-xl w-96">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={24} className="text-neon" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {passwordRequired.type === 'directory'
                    ? 'Enter Directory Password'
                    : 'Enter File Password'}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                This {passwordRequired.type} is password protected. Please enter the password to continue.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neon mb-4"
                placeholder="Enter password..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPasswordRequired(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={!password}
                  className="px-4 py-2 bg-neon text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
        {loadingContent ? (
          <div className="h-full flex items-center justify-center text-gray-400">Loading...</div>
        ) : fileContent?.path ? (
          (() => {
            const fileType = getFileType({
              ...fileContent,
              path: fileContent.path,
              type: 'file',
              name: selectedFile?.name ?? '',
              size: fileContent.size ?? 0,
              modifiedAt: fileContent.modifiedAt ?? '',
            } as FileItem);
            if (fileType === 'markdown') {
              return (
                <div className="p-8 max-w-2xl mx-auto overflow-auto">
                  <div className="prose prose-sm prose-slate dark:prose-invert font-serif max-w-none text-ink dark:text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent.content || ''}</ReactMarkdown>
                  </div>
                </div>
              );
            }
            if (fileType === 'text') {
              return (
                <div className="p-8 max-w-2xl mx-auto overflow-auto">
                  <pre className="font-mono text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {fileContent.content || ''}
                  </pre>
                </div>
              );
            }
            return (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <File size={48} className="mb-4 opacity-20" />
                <p className="font-mono text-sm">BINARY FILE PREVIEW NOT AVAILABLE</p>
                <button
                  onClick={() => api.files.download(fileContent.path)}
                  className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:border-neon hover:text-neon transition-colors text-xs font-mono flex items-center gap-2"
                >
                  <Download size={14} /> DOWNLOAD FILE
                </button>
              </div>
            );
          })()
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
            SELECT A FILE
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutFileExplorer;
