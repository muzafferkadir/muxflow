'use client';

import React from 'react';
import { Download, File, Folder, FolderOpen } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

export default function ProjectFiles() {
  const [mounted, setMounted] = React.useState(false);
  const { projectFiles } = useWorkflow();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFiles = () => {
    if (!projectFiles || projectFiles.length === 0) return;

    // Create a zip-like structure by downloading each file
    projectFiles.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file.name, file.content);
      }, index * 500); // Stagger downloads
    });
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      case 'js':
        return '⚡';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Folder size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Project Files</h2>
            {projectFiles && (
              <span className="text-sm text-gray-500">
                ({projectFiles.length} files)
              </span>
            )}
          </div>
          {projectFiles && projectFiles.length > 0 && (
            <button
              onClick={downloadAllFiles}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              <span>Download All</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {projectFiles && projectFiles.length > 0 ? (
          <div className="h-full flex">
            {/* File Tree */}
            <div className="w-80 border-r border-gray-200 bg-gray-50">
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Project Structure</div>
                <div className="space-y-1">
                  {projectFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer group"
                      onClick={() => downloadFile(file.name, file.content)}
                    >
                      <span className="text-lg">{getFileIcon(file.name)}</span>
                      <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file.name, file.content);
                        }}
                        title="Download file"
                      >
                        <Download size={14} className="text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* File Preview */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Click on any file to download it, or use "Download All" to get the complete project.
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-auto">
                <div className="space-y-6">
                  {projectFiles.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getFileIcon(file.name)}</span>
                          <span className="font-medium text-gray-900">{file.name}</span>
                        </div>
                        <button
                          onClick={() => downloadFile(file.name, file.content)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Download file"
                        >
                          <Download size={16} className="text-gray-500" />
                        </button>
                      </div>
                      <div className="p-4">
                        <pre className="text-xs text-gray-700 overflow-x-auto bg-gray-50 p-3 rounded border max-h-60">
                          {file.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Empty state
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Files</h3>
              <p className="text-gray-500 mb-4">
                Generate a project structure first to see your files here.
              </p>
              <div className="text-sm text-gray-400">
                Use the "Generate Project" button in the header to create a complete project with separate HTML, CSS, and JS files.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
