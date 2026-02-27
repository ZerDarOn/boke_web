import React, { useState } from 'react';
import { ABOUT_FILES } from '../constants';
import { FileText, Download, Eye, File, Folder } from 'lucide-react';

const AboutFileExplorer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(ABOUT_FILES[0].id);

  const selectedFile = ABOUT_FILES.find(f => f.id === selectedFileId);

  return (
    <div className="w-full h-[600px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 shadow-sm flex rounded-lg overflow-hidden font-mono transition-colors">
      {/* Left Panel: File List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a]">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase flex items-center gap-2">
            <Folder size={14} /> /ROOT/SYSTEM/ABOUT
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {ABOUT_FILES.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedFileId(file.id)}
              className={`
                px-4 py-3 cursor-pointer border-l-2 transition-all duration-200 flex items-center justify-between group
                ${selectedFileId === file.id 
                  ? 'bg-white dark:bg-[#0a0a0a] border-neon text-ink dark:text-white shadow-sm' 
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-ink dark:hover:text-white'}
              `}
            >
              <div className="flex items-center gap-3">
                {file.type === 'markdown' ? <FileText size={16} /> : <File size={16} />}
                <div className="flex flex-col">
                    <span className="text-sm font-bold">{file.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-600">{file.size} • {file.date}</span>
                </div>
              </div>
              
              {/* Action Icon */}
              <div className={`opacity-0 group-hover:opacity-100 transition-opacity`}>
                 {file.type === 'markdown' ? (
                    <Eye size={14} className="text-neon" />
                 ) : (
                    <Download size={14} className="text-gray-400 hover:text-ink dark:hover:text-white" />
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Content Reader */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0a] overflow-y-auto relative">
        {selectedFile ? (
            selectedFile.type === 'markdown' ? (
                <div className="p-8 max-w-2xl mx-auto">
                    {/* Simulated Markdown Rendering */}
                    <div className="prose prose-sm prose-slate dark:prose-invert font-serif max-w-none text-ink dark:text-gray-300">
                        {selectedFile.content?.split('\n').map((line, i) => {
                            if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black mb-6 pb-2 border-b-2 border-neon inline-block text-ink dark:text-white">{line.replace('# ', '')}</h1>;
                            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-4 flex items-center gap-2 text-ink dark:text-white"><span className="text-neon">#</span> {line.replace('## ', '')}</h2>;
                            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc marker:text-neon mb-2">{line.replace('- ', '')}</li>;
                            if (line.trim() === '') return <br key={i} />;
                            
                            const parts = line.split(/(\*\*.*?\*\*)/);
                            return (
                                <p key={i} className="mb-2 leading-relaxed text-gray-800 dark:text-gray-300">
                                    {parts.map((part, idx) => 
                                        part.startsWith('**') 
                                        ? <span key={idx} className="font-bold text-black dark:text-white bg-neon/10 px-1">{part.replace(/\*\*/g, '')}</span> 
                                        : part
                                    )}
                                </p>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <File size={48} className="mb-4 opacity-20" />
                    <p className="font-mono text-sm">BINARY FILE PREVIEW NOT AVAILABLE</p>
                    <button className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:border-neon hover:text-neon transition-colors text-xs font-mono flex items-center gap-2">
                        <Download size={14} /> DOWNLOAD FILE
                    </button>
                </div>
            )
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