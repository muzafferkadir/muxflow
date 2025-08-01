'use client';

import React, { useState } from 'react';
import { Play, Settings, Eye, Code, Download, Zap } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

export default function PreviewPanel() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const { 
    nodes, 
    edges, 
    isAnalyzing, 
    todoList, 
    analyzeWorkflow, 
    generateAllNodes,
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
  const nodesWithDescriptions = nodes.filter(n => n.data.description).length;

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <button 
            onClick={() => setActiveTab(activeTab === 'preview' ? 'code' : 'preview')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {activeTab === 'preview' ? <Code size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={analyzeWorkflow}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={16} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>
          <button
            onClick={generateAllNodes}
            disabled={nodesWithDescriptions === 0}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap size={16} />
            <span>Generate All</span>
          </button>
          <button
            onClick={exportProject}
            disabled={completedNodes === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4">
        {activeTab === 'preview' ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
              {todoList.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 mb-2">Todo List:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {todoList.map((task, index) => (
                      <div key={index} className="flex items-start space-x-2 text-xs">
                        <span className="text-blue-600 font-medium">{index + 1}.</span>
                        <span className="text-gray-700">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Click "Analyze" to analyze your workflow and get a todo list.
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">AI Agent Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Analysis:</span>
                  <span className={`font-medium ${isAnalyzing ? 'text-blue-600' : 'text-green-600'}`}>
                    {isAnalyzing ? 'Running...' : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Todo Tasks:</span>
                  <span className="font-medium">{todoList.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Generated:</span>
                  <span className="font-medium">{completedNodes}/{totalNodes}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Workflow Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Nodes:</span>
                  <span className="font-medium">{totalNodes}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Connections:</span>
                  <span className="font-medium">{edges.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Validation:</span>
                  <span className={`font-medium ${nodesWithDescriptions === totalNodes ? 'text-green-600' : 'text-orange-600'}`}>
                    {nodesWithDescriptions === totalNodes ? 'All nodes ready' : `${nodesWithDescriptions}/${totalNodes} have descriptions`}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Generated Code Preview</h4>
              <div className="bg-white border rounded-lg p-4 min-h-[200px]">
                {completedNodes > 0 ? (
                  <div className="space-y-4">
                    {nodes.filter(n => n.data.generatedCode).map(node => (
                      <div key={node.id} className="border-b border-gray-200 pb-2 last:border-b-0">
                        <div className="text-sm font-medium text-gray-800 mb-1">
                          {node.data.label}
                        </div>
                        <div className="bg-gray-900 text-green-400 p-2 rounded text-xs font-mono max-h-24 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">
                            {node.data.generatedCode?.substring(0, 150)}...
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm text-center">
                      Generate code for your nodes to see preview<br />
                      Add descriptions and click "Generate" on nodes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
                     <div className="space-y-4">
             <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400">
               <div className="mb-2 text-gray-300">{`// Generated workflow code`}</div>
               <div>{'{'}</div>
               <div className="ml-4">&quot;nodes&quot;: [</div>
               <div className="ml-8">{'{'}</div>
               <div className="ml-12">&quot;id&quot;: &quot;1&quot;,</div>
               <div className="ml-12">&quot;type&quot;: &quot;input&quot;,</div>
               <div className="ml-12">&quot;prompt&quot;: &quot;Enter your input...&quot;</div>
               <div className="ml-8">{'}'}</div>
               <div className="ml-4">],</div>
               <div className="ml-4">&quot;edges&quot;: []</div>
               <div>{'}'}</div>
             </div>
           </div>
        )}
      </div>
    </div>
  );
} 