'use client';

import React, { useState } from 'react';
import { Eye, Code, Download, Globe, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

export default function PreviewPanel() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState<'webapp' | 'logs'>('webapp');
  const { 
    nodes, 
    edges, 
    isAnalyzing,
    isGenerating,
    hasUnsavedChanges,
    isSaved,
    todoList, 
    generatedProject,
    webAppProject,
    webAppPreviewUrl,
    isGeneratingWebApp,
    generateWebApp,
    exportProject 
  } = useWorkflow();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const completedNodes = nodes.filter(n => n.data.generatedCode).length;
  const totalNodes = nodes.length;

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Application Preview</h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => setActiveTab('webapp')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'webapp' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Web Application"
            >
              <Globe size={18} />
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`p-2 rounded-lg transition-colors ${
                activeTab === 'logs' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              title="Logs & Generated Code"
            >
              <Eye size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={exportProject}
            disabled={completedNodes === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Export Project"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'webapp' ? (
          <div className="space-y-4">
            {/* Web App Preview */}
            {webAppPreviewUrl ? (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Globe size={16} className="mr-2 text-purple-600" />
                  Live Web Application
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Preview URL:</span>
                    <a 
                      href={webAppPreviewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 text-sm"
                    >
                      <span>Open App</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <div className="bg-white rounded border-2 border-gray-200 min-h-[400px]">
                    <iframe 
                      src={webAppPreviewUrl}
                      className="w-full h-[400px] rounded"
                      title="Generated Web App Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                  {webAppProject && (
                    <div className="text-xs text-gray-500">
                      Framework: {webAppProject.framework} | Files: {webAppProject.files.length}
                    </div>
                  )}
                </div>
              </div>
            ) : isGeneratingWebApp ? (
              <div className="bg-purple-50 rounded-lg p-6 text-center border border-purple-200">
                <div className="text-purple-600 mb-2">
                  <Globe size={32} className="mx-auto animate-pulse" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Generating Web App...</h4>
                <p className="text-sm text-gray-600">
                  Creating your live web application with WebContainer
                </p>
              </div>
            ) : completedNodes > 0 ? (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <Globe size={32} className="mx-auto" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">Ready to Generate Web App</h4>
                <p className="text-sm text-gray-600">
                  Use the "Generate Web App" button in the main layout to create a live preview
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <Globe size={32} className="mx-auto" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">No Generated Code</h4>
                <p className="text-sm text-gray-600">
                  Generate code for your nodes first to create a web application
                </p>
              </div>
            )}

            {/* Web App Project Info */}
            {webAppProject && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Project Structure</h4>
                <div className="space-y-2">
                  {webAppProject.files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-400">📄</span>
                      <span className="font-mono text-gray-800">{file.path}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Framework: <span className="font-medium">{webAppProject.framework}</span> | 
                    Entry: <span className="font-mono">{webAppProject.entryPoint}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-3">Workflow Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{completedNodes}</div>
                  <div className="text-xs text-gray-600">Generated Nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{totalNodes}</div>
                  <div className="text-xs text-gray-600">Total Nodes</div>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Nodes:</span>
                  <span className="font-medium">{totalNodes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Generated Nodes:</span>
                  <span className="font-medium">{completedNodes}/{totalNodes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Connections:</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Workflow Saved:</span>
                  <span className={`font-medium ${isSaved ? 'text-green-600' : 'text-orange-600'}`}>
                    {isSaved ? 'Yes' : 'Unsaved changes'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Web App Status:</span>
                  <span className={`font-medium ${webAppPreviewUrl ? 'text-green-600' : 'text-gray-500'}`}>
                    {webAppPreviewUrl ? 'Generated' : 'Not generated'}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated Code Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Generated Code Preview</h4>
              {completedNodes > 0 ? (
                <div className="space-y-3">
                  {nodes
                    .filter(node => node.data.generatedCode)
                    .map((node, index) => (
                      <div key={node.id} className="bg-white rounded border border-gray-200">
                        <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-800">
                            {node.data.label} ({node.data.nodeType})
                          </span>
                          <span className="text-xs text-green-600">✓ Generated</span>
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-gray-600 mb-2">{node.data.description}</div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32 text-gray-800">
                            {node.data.generatedCode}
                          </pre>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Code size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No generated code yet</p>
                  <p className="text-xs">Add nodes and generate code to see results here</p>
                </div>
              )}
            </div>

            {/* Todo List */}
            {todoList.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Analysis Results</h4>
                <ul className="space-y-1 text-sm">
                  {todoList.map((task, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-500 font-medium">{index + 1}.</span>
                      <span className="text-gray-700">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Generation Status */}
            {isGenerating && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Zap size={16} className="mr-2 text-blue-600 animate-pulse" />
                  Generating Application...
                </h4>
                <div className="text-sm text-gray-600">
                  Please wait while we generate your application components.
                </div>
              </div>
            )}

            {/* Analysis Status */}
            {isAnalyzing && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <AlertCircle size={16} className="mr-2 text-yellow-600 animate-pulse" />
                  Analyzing Workflow...
                </h4>
                <div className="text-sm text-gray-600">
                  AI is analyzing your workflow structure and connections.
                </div>
              </div>
            )}

            {/* Workflow JSON */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Workflow JSON</h4>
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Nodes</h5>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-48">
                    {JSON.stringify(nodes, null, 2)}
                  </pre>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Edges</h5>
                  <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-auto max-h-48">
                    {JSON.stringify(edges, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}