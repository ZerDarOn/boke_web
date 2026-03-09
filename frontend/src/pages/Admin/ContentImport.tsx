import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Folder,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  File,
  Trash2
} from 'lucide-react';

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  details?: Array<{
    file: string;
    type?: string;
    saved?: any;
    message: string;
  }>;
}

const ContentImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importMode, setImportMode] = useState<'single' | 'batch' | 'folder' | 'zip'>('batch');
  const [results, setResults] = useState<ImportResult>({
    success: 0,
    failed: 0,
    skipped: 0
  });
  const [conflictResolution, setConflictResolution] = useState<'overwrite' | 'skip'>('skip');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDropSingle = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setImporting(true);
    setProgress(0);
    setImportMode('single');
    setResults({ success: 0, failed: 0, skipped: 0, details: [] });

    try {
      const file = acceptedFiles[0];
      const content = await file.text();

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/content/import/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          content,
          conflictResolution
        })
      });

      const result = await response.json();

      setProgress(100);

      if (result.success) {
        if (result.data.skipped) {
          setResults({
            success: 0,
            failed: 0,
            skipped: 1,
            details: [{ file: file.name, message: '内容已存在' }]
          });
        } else {
          setResults({
            success: 1,
            failed: 0,
            skipped: 0,
            details: [{ file: file.name, saved: result.data }]
          });
        }
      } else {
        setResults({
          success: 0,
          failed: 1,
          skipped: 0,
          details: [{ file: file.name, message: result.error || '导入失败' }]
        });
      }
    } catch (error: any) {
      console.error('导入失败:', error);
      setResults({
        success: 0,
        failed: 1,
        skipped: 0,
        details: [{ file: selectedFile?.name || '未知', message: error.message || '导入失败' }]
      });
    } finally {
      setImporting(false);
    }
  }, [conflictResolution, selectedFile]);

  const onDropBatch = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (acceptedFiles.length > 10) {
      alert('一次最多上传 10 个文件');
      return;
    }

    setImporting(true);
    setImportMode('batch');
    setProgress(0);
    setResults({ success: 0, failed: 0, skipped: 0, details: [] });

    try {
      // 读取所有文件内容
      const filesWithContent = await Promise.all(
        acceptedFiles.map(async (file) => ({
          name: file.name,
          size: file.size,
          content: await file.text(),
          lastModified: file.lastModified
        }))
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/content/import/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          files: filesWithContent,
          conflictResolution
        })
      });

      const result = await response.json();

      setProgress(100);

      if (result.success) {
        setResults({
          success: result.data.success.length,
          failed: result.data.failed.length,
          skipped: result.data.skipped.length,
          details: [
            ...result.data.success.map((item: any) => ({
              file: item.file,
              saved: item.saved
            })),
            ...result.data.failed.map((item: any) => ({
              file: item.file,
              message: item.message
            })),
            ...result.data.skipped.map((item: any) => ({
              file: item.file,
              message: item.message
            }))
          ]
        });
      } else {
        setResults({
          success: 0,
          failed: acceptedFiles.length,
          skipped: 0,
          details: [{ file: '批量导入', message: result.error || '导入失败' }]
        });
      }
    } catch (error: any) {
      console.error('批量导入失败:', error);
      setResults({
        success: 0,
        failed: acceptedFiles.length,
        skipped: 0,
        details: [{ file: '批量导入', message: error.message || '导入失败' }]
      });
    } finally {
      setImporting(false);
    }
  }, [conflictResolution]);

  const onDropFolder = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;

    setImporting(true);
    setImportMode('folder');
    setProgress(0);
    setResults({ success: 0, failed: 0, skipped: 0, details: [] });

    try {
      const filesWithContent = await Promise.all(
        files
          .filter(file => file.name.endsWith('.md'))
          .map(async (file) => ({
            name: file.name,
            path: (file as any).webkitRelativePath || file.name,
            size: file.size,
            content: await file.text(),
            lastModified: file.lastModified
          }))
      );

      if (filesWithContent.length === 0) {
        setResults({
          success: 0,
          failed: files.length,
          skipped: 0,
          details: [{ file: '文件夹', message: '未找到 Markdown 文件' }]
        });
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/content/import/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          files: filesWithContent,
          conflictResolution
        })
      });

      const result = await response.json();

      setProgress(100);

      if (result.success) {
        setResults({
          success: result.data.success.length,
          failed: result.data.failed.length,
          skipped: result.data.skipped.length,
          details: [
            ...result.data.success.map((item: any) => ({
              file: item.file,
              type: item.type,
              saved: item.saved
            })),
            ...result.data.failed.map((item: any) => ({
              file: item.file,
              message: item.message
            })),
            ...result.data.skipped.map((item: any) => ({
              file: item.file,
              message: item.message
            }))
          ]
        });
      } else {
        setResults({
          success: 0,
          failed: filesWithContent.length,
          skipped: 0,
          details: [{ file: '文件夹', message: result.error || '导入失败' }]
        });
      }
    } catch (error: any) {
      console.error('文件夹导入失败:', error);
      setResults({
        success: 0,
        failed: files.length,
        skipped: 0,
        details: [{ file: '文件夹', message: error.message || '导入失败' }]
      });
    } finally {
      setImporting(false);
    }
  }, [conflictResolution]);

  const onDropZip = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.zip')) {
      alert('只支持 ZIP 文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('ZIP 文件大小不能超过 10MB');
      return;
    }

    setImporting(true);
    setImportMode('zip');
    setProgress(0);
    setResults({ success: 0, failed: 0, skipped: 0, details: [] });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(',')[1];

          setProgress(30);

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/content/import/zip`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              zipData: base64,
              conflictResolution
            })
          });

          const result = await response.json();

          setProgress(100);

          if (result.success) {
            setResults({
              success: result.data.success.length,
              failed: result.data.failed.length,
              skipped: result.data.skipped.length,
              details: [
                ...result.data.success.map((item: any) => ({
                  file: item.file,
                  type: item.type,
                  saved: item.saved
                })),
                ...result.data.failed.map((item: any) => ({
                  file: item.file,
                  message: item.message
                })),
                ...result.data.skipped.map((item: any) => ({
                  file: item.file,
                  message: item.message
                }))
              ]
            });
          } else {
            setResults({
              success: 0,
              failed: 1,
              skipped: 0,
              details: [{ file: file.name, message: result.error || '导入失败' }]
            });
          }
        } catch (error: any) {
          console.error('ZIP 导入失败:', error);
          setResults({
            success: 0,
            failed: 1,
            skipped: 0,
            details: [{ file: file.name, message: error.message || '导入失败' }]
          });
        } finally {
          setImporting(false);
        }
      };

      reader.onerror = () => {
        setResults({
          success: 0,
          failed: 1,
          skipped: 0,
          details: [{ file: file.name, message: '读取文件失败' }]
        });
        setImporting(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('ZIP 导入失败:', error);
      setResults({
        success: 0,
        failed: 1,
        skipped: 0,
        details: [{ file: file.name, message: error.message || '导入失败' }]
      });
      setImporting(false);
    }
  }, [conflictResolution]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 1 && acceptedFiles[0].name.endsWith('.zip')) {
        onDropZip(acceptedFiles);
      } else if (acceptedFiles.length === 1) {
        onDropSingle(acceptedFiles);
      } else {
        onDropBatch(acceptedFiles);
      }
    },
    accept: {
      'text/markdown': ['.md'],
      'application/zip': ['.zip']
    },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024 // 10MB for ZIP, 1MB for MD files
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      alert('只支持 Markdown 文件');
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      alert('文件大小不能超过 1MB');
      return;
    }

    setSelectedFile(file);
    onDrop([file]);
  };

  const handleReset = () => {
    setResults({ success: 0, failed: 0, skipped: 0 });
    setShowDetails(false);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink dark:text-paper">内容初始化</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            通过上传 Markdown 文件来初始化博客内容
          </p>
        </div>
        {results.success > 0 || results.failed > 0 && (
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-ink dark:text-paper rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            <span>清空记录</span>
          </button>
        )}
      </div>

      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragActive ? 'border-neon bg-neon/5' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-700'}
          ${importing ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-neon/50'}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="flex justify-center">
            {importing ? (
              <Loader2 className="w-16 h-16 text-neon animate-spin" />
            ) : isDragActive ? (
              <Upload className="w-16 h-16 text-neon" />
            ) : isDragReject ? (
              <AlertCircle className="w-16 h-16 text-red-500" />
            ) : (
              <Upload className="w-16 h-16 text-gray-400 dark:text-gray-600" />
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-ink dark:text-paper">
              {isDragActive ? '释放文件以上传' : importMode === 'single' ? '拖拽单个文件到此处' : importMode === 'batch' ? '拖拽多个文件到此处（最多10个）' : importMode === 'folder' ? '拖拽文件夹到此处' : '拖拽 ZIP 文件到此处'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              支持 .md 文件，每个文件最大 1MB
              {importMode === 'batch' && '，一次最多导入 10 个文件'}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <label className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <FileText size={18} />
              <span>选择单个文件</span>
              <input
                type="file"
                accept=".md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 1 * 1024 * 1024) {
                      alert('文件大小不能超过 1MB');
                      return;
                    }
                    onDropSingle([file]);
                  }
                }}
                disabled={importing}
                className="hidden"
              />
            </label>

            <label className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
              <FileText size={18} />
              <span>选择多个文件（最多 10 个）</span>
              <input
                type="file"
                multiple
                accept=".md"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 10) {
                    alert('一次最多上传 10 个文件');
                    return;
                  }
                  const oversized = files.filter(f => f.size > 1 * 1024 * 1024);
                  if (oversized.length > 0) {
                    alert('有文件大小超过 1MB');
                    return;
                  }
                  onDropBatch(files);
                }}
                disabled={importing}
                className="hidden"
              />
            </label>

            <label className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Folder size={18} />
              <span>选择文件夹</span>
              <input
                type="file"
                webkitdirectory
                directory
                disabled={importing}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    onDropFolder(files);
                  }
                }}
                className="hidden"
              />
            </label>

            <label className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <Package size={18} />
              <span>选择 ZIP</span>
              <input
                type="file"
                accept=".zip"
                disabled={importing}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert('ZIP 文件大小不能超过 10MB');
                      return;
                    }
                    onDropZip([file]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 导入选项 */}
      <div className="bg-white dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-bold text-ink dark:text-paper mb-4 flex items-center gap-2">
          <File size={18} />
          导入选项
        </h3>

        <div className="space-y-4">
          {/* 冲突处理 */}
          <div>
            <label className="text-sm font-medium text-ink dark:text-paper mb-3 block">
              冲突处理
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="conflict"
                  value="skip"
                  checked={conflictResolution === 'skip'}
                  onChange={() => setConflictResolution('skip')}
                  className="mr-2"
                />
                <span className="text-sm text-ink dark:text-paper">跳过已存在的内容（推荐）</span>
              </label>

              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="conflict"
                  value="overwrite"
                  checked={conflictResolution === 'overwrite'}
                  onChange={() => setConflictResolution('overwrite')}
                  className="mr-2"
                />
                <span className="text-sm text-ink dark:text-paper">覆盖已存在的内容</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 导入进度 */}
      {importing && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                {importMode === 'single' ? '正在导入...' : 
                 importMode === 'batch' ? `正在批量导入 ${results.success + results.failed + results.skipped}/10 个文件...` :
                 importMode === 'folder' ? `正在导入文件夹...` :
                 `正在解压 ZIP 并导入...`}
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 导入结果 */}
      {!importing && (results.success > 0 || results.failed > 0 || results.skipped > 0) && (
        <div className="space-y-4">
          {/* 汇总 */}
          <div className="bg-white dark:bg-black/30 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-ink dark:text-paper mb-4 flex items-center justify-between">
              <span>导入结果</span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showDetails ? '隐藏详情' : '显示详情'}
              </button>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle size={20} />
                <div>
                  <div className="text-2xl font-bold">{results.success}</div>
                  <div className="text-xs">成功</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-400">
                <AlertCircle size={20} />
                <div>
                  <div className="text-2xl font-bold">{results.skipped}</div>
                  <div className="text-xs">跳过</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertCircle size={20} />
                <div>
                  <div className="text-2xl font-bold">{results.failed}</div>
                  <div className="text-xs">失败</div>
                </div>
              </div>
            </div>
          </div>

          {/* 详情 */}
          {showDetails && results.details && results.details.length > 0 && (
            <div className="bg-white dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-ink dark:text-paper">详细记录</h4>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {results.details.map((detail, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      detail.saved
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : detail.message === '内容已存在'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    {detail.saved ? (
                      <CheckCircle size={18} className="mt-0.5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle size={18} className="mt-0.5 text-yellow-600 dark:text-yellow-400" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm text-ink dark:text-paper">
                        {detail.file}
                      </div>
                      {detail.type && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          类型: {detail.type}
                        </div>
                      )}
                      {detail.message && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                          {detail.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentImport;
