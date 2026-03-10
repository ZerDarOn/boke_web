import React, { useState, useEffect } from 'react';
import { api, FileItem, FileContent } from '../lib/api';
import { FileText, Download, Eye, File, Folder, AlertCircle, ChevronRight, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AboutFileExplorer: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [fileContent, setFileContent] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [passwordRequired, setPasswordRequired] = useState<FileItem | null>(null);
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await api.files.getAll(currentPath);
      if (result.success && Array.isArray(result.data)) {
        setFiles(result.data);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadFileContent = async (path: string, pwd?: string) => {
    try {
      setLoadingContent(true);
      setError('');
      const result = await api.files.getContent(path, pwd);
      if (result.success && result.data) {
        setFileContent(result.data);
      } else {
        setError(result.error || 'Failed to load file content');
        setFileContent(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFileContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.protected) {
      setPasswordRequired(file);
      setPassword('');
    } else {
      setSelectedFilePath(file.path);
      loadFileContent(file.path);
    }
  };

  const handlePasswordSubmit = () => {
    if (passwordRequired) {
      setSelectedFilePath(passwordRequired.path);
      loadFileContent(passwordRequired.path, password);
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
  };

  const selectedFile = files.find(f => f.path === selectedFilePath);

  const getFileType = (file: FileItem) => {
    if (!file?.path) return 'binary';
    const ext = file.path.split('.').pop()?.toLowerCase();
    // 支持 Markdown 和纯文本文件
    const textExtensions = ['md', 'txt', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html', 'yaml', 'yml', 'xml', 'csv'];
    if (ext === 'md') return 'markdown';
    if (textExtensions.includes(ext || '')) return 'text';
    return 'binary';
  };

  return (
    <div className="w-full h-[600px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 shadow-sm flex rounded-lg overflow-hidden font-mono transition-colors">
      {/* Left Panel: File List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] flex flex-col">
        {/* Breadcrumb */}
        <div className="p-3 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex items-center gap-2 text-xs">
          <button
            onClick={() => handlePathClick('')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 ${!currentPath ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Root
          </button>
          {currentPath && (
            <>
              <ChevronRight size={12} className="text-gray-400" />
              {currentPath.split('/').map((part, index, array) => (
                <React.Fragment key={index}>
                  <button
                    onClick={() => handlePathClick(array.slice(0, index + 1).join('/'))}
                    className={`hover:text-blue-600 dark:hover:text-blue-400 ${index === array.length - 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}
                  >
                    {part}
                  </button>
                  {index < array.length - 1 && <ChevronRight size={12} className="text-gray-400" />}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase flex items-center gap-2">
            <Folder size={14} /> /CONTENT
          </h3>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Loading...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : files.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            No files found
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {files.map((file) => {
              const fileType = getFileType(file);
              const isSelected = selectedFilePath === file.path;
              return (
                <div
                  key={file.path}
                  onClick={() => file.type === 'directory' ? handlePathClick(file.path) : handleFileClick(file)}
                  className={`
                    px-4 py-3 cursor-pointer border-l-2 transition-all duration-200 flex items-center justify-between group
                    ${isSelected
                      ? 'bg-white dark:bg-[#0a0a0a] border-neon text-ink dark:text-white shadow-sm'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-ink dark:hover:text-white'}
                  `}
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
                        {file.size ? `${(file.size / 1024).toFixed(1)}KB` : '0KB'} • {new Date(file.modifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Icon */}
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity`}>
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

      {/* Right Panel: Content Reader */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0a] overflow-y-auto relative">
        {/* Password Modal */}
        {passwordRequired && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-xl w-96">
              <div className="flex items-center gap-3 mb-4">
                <Lock size={24} className="text-neon" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {passwordRequired.type === 'directory' ? 'Enter Directory Password' : 'Enter File Password'}
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
          <div className="h-full flex items-center justify-center text-gray-400">
            Loading...
          </div>
        ) : fileContent?.path ? (
          (() => {
            const fileType = getFileType({ ...fileContent, path: fileContent.path, type: 'file' });
            if (fileType === 'markdown') {
              return (
                <div className="p-8 max-w-2xl mx-auto overflow-auto">
                  {/* Markdown Rendering */}
                  <div className="prose prose-sm prose-slate dark:prose-invert font-serif max-w-none text-ink dark:text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {fileContent.content || ''}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            } else if (fileType === 'text') {
              return (
                <div className="p-8 max-w-2xl mx-auto overflow-auto">
                  {/* Plain Text Rendering */}
                  <pre className="font-mono text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {fileContent.content || ''}
                  </pre>
                </div>
              );
            } else {
              return (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <File size={48} className="mb-4 opacity-20" />
                  <p className="font-mono text-sm">BINARY FILE PREVIEW NOT AVAILABLE</p>
                  <button
                    onClick={() => handleDownload(fileContent.path)}
                    className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:border-neon hover:text-neon transition-colors text-xs font-mono flex items-center gap-2"
                  >
                    <Download size={14} /> DOWNLOAD FILE
                  </button>
                </div>
              );
            }
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