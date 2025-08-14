'use client';

import React, { useState, useEffect } from 'react';
import WorkflowEditor from '@/components/WorkflowEditor';
import PreviewPanel from '@/components/PreviewPanel';
import { useWorkflow } from '@/contexts/WorkflowContext';
import ProjectFiles from '@/components/ProjectFiles';
import { Save, Globe, Loader2, AlertCircle, X, History, Trash2 } from 'lucide-react';

export default function Layout() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState('workflow');
  const [showHistory, setShowHistory] = useState(false);
  
  const { 
    nodes,
    saveWorkflow, 
    generateApp,
    hasUnsavedChanges,
    isSaved,
    isGeneratingWebApp,
    history,
    clearHistory
  } = useWorkflow();

  const isProcessing = isGeneratingWebApp;
  const allNodesHaveDescriptions = nodes.every(node => node.data.description?.trim());
  const nodesWithoutDescription = nodes.filter(node => !node.data.description?.trim()).length;

  const handleGenerateApp = async () => {
    await generateApp();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isSaved) {
          saveWorkflow();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveWorkflow, isSaved]);

  if (!mounted) {
    return null;
  }

  return (
    <main className="h-screen w-screen min-w-[900px] bg-gray-50 overflow-visible">
      <div className="h-full flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">MuxFlow</h1>
            <span className="text-sm text-gray-500">AI Mini App Builder</span>
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>Unsaved changes</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={saveWorkflow}
              disabled={isSaved}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                hasUnsavedChanges 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save size={16} />
              <span>{hasUnsavedChanges ? 'Save Workflow' : 'Workflow Saved'}</span>
              <span className="text-xs opacity-75">(Ctrl+S)</span>
            </button>

            <button 
              onClick={handleGenerateApp}
              disabled={isProcessing || nodes.length === 0 || !isSaved || !allNodesHaveDescriptions}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              title={
                nodes.length === 0 
                  ? "Add nodes to your workflow" 
                  : !isSaved
                    ? "Save workflow first"
                  : !allNodesHaveDescriptions
                    ? `Add descriptions to all nodes (${nodesWithoutDescription} missing)`
                  : "Generate complete app with both HTML and project files"
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {isGeneratingWebApp ? 'Creating App...' : 'Processing...'}
                  </span>
                </>
              ) : (
                <>
                  <Globe size={16} />
                  <span>Generate App</span>
                  {!isSaved && nodes.length > 0 && (
                    <span className="text-xs opacity-75">(Save first)</span>
                  )}
                  {!allNodesHaveDescriptions && isSaved && nodes.length > 0 && (
                    <span className="text-xs opacity-75">({nodesWithoutDescription} need descriptions)</span>
                  )}
                </>
              )}
            </button>
          </div>
        </header>

        <div className="absolute top-[52px] left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-6 py-2 font-medium text-sm rounded-l-lg transition-colors ${
                activeTab === 'workflow'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Workflow
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-2 font-medium text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-6 py-2 font-medium text-sm rounded-r-lg transition-colors ${
                activeTab === 'files'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Files
            </button>
          </div>
        </div>

        <div className="flex-1 flex relative overflow-hidden">
          {activeTab === 'workflow' && (
            <div className="w-full h-full">
              <WorkflowEditor onToggleHistory={() => setShowHistory((s) => !s)} />
            </div>
          )}
          
          {activeTab === 'preview' && (
            <div className="w-full h-full">
              <PreviewPanel />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="w-full h-full">
              <ProjectFiles />
            </div>
          )}
        </div>

        {showHistory && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute z-[11] right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl pointer-events-auto flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History size={16} className="text-gray-600" />
                  <span className="text-sm font-semibold text-gray-800">Generation History</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => clearHistory()}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Clear history"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="p-1 text-gray-500 hover:text-gray-700"><X size={16} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {history.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No history yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {history.map((h, idx) => {
                      const prev = history[idx + 1];
                      let changeSummary: string | null = null;
                      if (prev && h.nodesSnapshot && prev.nodesSnapshot && h.edgesSnapshot && prev.edgesSnapshot) {
                        try {
                          const currNodes = new Map(h.nodesSnapshot.map(n => [n.id, n]));
                          const prevNodes = new Map(prev.nodesSnapshot.map(n => [n.id, n]));
                          const currEdges = new Set(h.edgesSnapshot.map(e => `${e.source}->${e.target}`));
                          const prevEdges = new Set(prev.edgesSnapshot.map(e => `${e.source}->${e.target}`));

                          let addedNodes = 0, removedNodes = 0, modifiedNodes = 0;
                          for (const id of currNodes.keys()) {
                            if (!prevNodes.has(id)) addedNodes++;
                            else {
                              const a = currNodes.get(id)!;
                              const b = prevNodes.get(id)!;
                              if (
                                a.label !== b.label ||
                                a.nodeType !== b.nodeType ||
                                (a.description || '') !== (b.description || '') ||
                                (a.prompt || '') !== (b.prompt || '') ||
                                (a.generatedCode || '') !== (b.generatedCode || '')
                              ) {
                                modifiedNodes++;
                              }
                            }
                          }
                          for (const id of prevNodes.keys()) {
                            if (!currNodes.has(id)) removedNodes++;
                          }

                          let addedEdges = 0, removedEdges = 0;
                          for (const e of currEdges) if (!prevEdges.has(e)) addedEdges++;
                          for (const e of prevEdges) if (!currEdges.has(e)) removedEdges++;

                          const parts: string[] = [];
                          if (addedNodes) parts.push(`+${addedNodes} node`);
                          if (removedNodes) parts.push(`-${removedNodes} node`);
                          if (modifiedNodes) parts.push(`~${modifiedNodes} node changed`);
                          if (addedEdges) parts.push(`+${addedEdges} edge`);
                          if (removedEdges) parts.push(`-${removedEdges} edge`);
                          changeSummary = parts.length ? parts.join(', ') : 'No changes from previous';
                        } catch {}
                      }

                      return (
                        <li key={h.id} className="p-4">
                          <div className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</div>
                          <div className="text-sm font-medium text-gray-800 mt-1">{h.totalNodes} nodes, {h.totalEdges} edges</div>
                          {changeSummary && (
                            <div className="text-xs text-gray-600 mt-1">{changeSummary}</div>
                          )}
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{h.nodeLabels.join(', ')}</div>
                          {h.mermaid && (
                            <pre className="mt-2 p-2 bg-gray-50 text-[10px] text-gray-700 rounded border border-gray-100 overflow-auto">
{h.mermaid}
                            </pre>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
