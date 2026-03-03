import React, { useState, useEffect } from 'react';
import { api, FileItem, FileContent } from '../../lib/api';
import {
  FileText,
  File,
  Folder,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  X,
  Save,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';

interface FileEditorData {
  path: string;
  name: string;
  content: string;
}

const AdminFiles: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create-file' | 'create-dir' | 'edit' | 'delete'>('create-file');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [formData, setFormData] = useState<FileEditorData>({ path: '', name: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.files.getAll(currentPath);
      if (result.success && result.data) {
        setFiles(result.data);
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalType('create-file');
    setSelectedFile(null);
    setFormData({
      path: currentPath ? `${currentPath}/` : '',
      name: '',
      content: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateDir = () => {
    setModalType('create-dir');
    setSelectedFile(null);
    setFormData({
      path: currentPath ? `${currentPath}/` : '',
      name: '',
      content: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = async (file: FileItem) => {
    if (file.type === 'directory') return;

    try {
      const result = await api.files.getContent(file.path);
      if (result.success && result.data) {
        setModalType('edit');
        setSelectedFile(file);
        setFormData({
          path: file.path,
          name: file.name,
          content: result.data.content,
        });
        setIsModalOpen(true);
      } else {
        setError(result.error || 'Failed to load file content');
      }
    } catch (error) {
      console.error('Failed to load file:', error);
      setError('Failed to load file');
    }
  };

  const handleDelete = (file: FileItem) => {
    setModalType('delete');
    setSelectedFile(file);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;

    try {
      setIsSubmitting(true);
      const result = await api.files.delete(selectedFile.path);
      if (result.success) {
        await loadFiles();
        setIsModalOpen(false);
      } else {
        setError(result.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (modalType === 'create-file') {
        const fullPath = formData.path + formData.name;
        const result = await api.files.create(fullPath, 'file', formData.content);
        if (result.success) {
          await loadFiles();
          setIsModalOpen(false);
        } else {
          setError(result.error || 'Failed to create file');
        }
      } else if (modalType === 'create-dir') {
        const fullPath = formData.path + formData.name;
        const result = await api.files.create(fullPath, 'directory');
        if (result.success) {
          await loadFiles();
          setIsModalOpen(false);
        } else {
          setError(result.error || 'Failed to create directory');
        }
      } else if (modalType === 'edit') {
        const result = await api.files.updateContent(formData.path, formData.content);
        if (result.success) {
          await loadFiles();
          setIsModalOpen(false);
        } else {
          setError(result.error || 'Failed to update file');
        }
      }
    } catch (error) {
      console.error('Failed to save:', error);
      setError('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (path: string) => {
    await api.files.download(path);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadFiles(files);
    setIsUploading(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const result = await api.files.upload(formData);
      if (result.success) {
        await loadFiles();
      } else {
        setError(result.error || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      setError('Failed to upload files');
    } finally {
      setIsUploading(false);
      setUploadFiles(null);
      e.target.value = '';
    }
  };

  const handleNavigate = (path: string) => {
    if (currentPath) {
      setCurrentPath(`${currentPath}/${path}`);
    } else {
      setCurrentPath(path);
    }
  };

  const handleBack = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder className="text-yellow-500" size={20} />;
    }
    const ext = file.path.split('.').pop()?.toLowerCase();
    if (ext === 'md') return <FileText className="text-blue-500" size={20} />;
    if (ext === 'pdf') return <File className="text-red-500" size={20} />;
    if (ext === 'json') return <File className="text-green-500" size={20} />;
    return <File className="text-gray-500" size={20} />;
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const directories = filteredFiles.filter(f => f.type === 'directory');
  const regularFiles = filteredFiles.filter(f => f.type === 'file');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">File Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage files and directories in your content folder</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <File size={16} />
              New File
            </button>
            <button
              onClick={handleCreateDir}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Folder size={16} />
              New Directory
            </button>
            <label className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 cursor-pointer">
              {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              Upload Files
              <input
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setCurrentPath('')}
            className={`hover:text-blue-600 dark:hover:text-blue-400 ${!currentPath ? 'font-bold' : ''}`}
          >
            Root
          </button>
          {currentPath && (
            <>
              <ChevronRight size={14} />
              <button
                onClick={handleBack}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                ..
              </button>
              {currentPath.split('/').map((part, index) => (
                <React.Fragment key={index}>
                  <ChevronRight size={14} />
                  <span className="text-gray-900 dark:text-white font-medium">{part}</span>
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
            {/* Directories */}
            {directories.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-white/10">
                {directories.map((file) => (
                  <div
                    key={file.path}
                    onClick={() => handleNavigate(file.name)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(file.modifiedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" size={16} />
                  </div>
                ))}
              </div>
            )}

            {/* Files */}
            {regularFiles.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-white/10">
                {regularFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {file.size ? `${(file.size / 1024).toFixed(1)}KB` : '0KB'} • {new Date(file.modifiedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(file.path)}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(file)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {directories.length === 0 && regularFiles.length === 0 && (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                <Folder size={48} className="mx-auto mb-4 opacity-50" />
                <p>No files or directories in this location</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0a0a0a] rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {modalType === 'create-file' && 'Create New File'}
                {modalType === 'create-dir' && 'Create New Directory'}
                {modalType === 'edit' && 'Edit File'}
                {modalType === 'delete' && 'Delete Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              {modalType === 'delete' && selectedFile ? (
                <div>
                  <p className="text-gray-900 dark:text-white mb-4">
                    Are you sure you want to delete <strong>{selectedFile.name}</strong>?
                    {selectedFile.type === 'directory' && (
                      <span className="block mt-2 text-sm text-red-600 dark:text-red-400">
                        Warning: This will delete all contents inside the directory.
                      </span>
                    )}
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter name..."
                      disabled={modalType === 'edit'}
                    />
                  </div>

                  {(modalType === 'create-file' || modalType === 'edit') && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Content
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        rows={12}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Enter content..."
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting || !formData.name}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFiles;
