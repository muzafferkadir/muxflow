'use client';

import React, { useState, useEffect } from 'react';
import WorkflowEditor from '@/components/WorkflowEditor';
import PreviewPanel from '@/components/PreviewPanel';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Save, Play, Loader2, AlertCircle, Download } from 'lucide-react';

export default function Layout() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState('workflow');
  
  const { 
    nodes,
    saveWorkflow, 
    generateApp, 
    exportProject,
    hasUnsavedChanges,
    isSaved,
    isGenerating 
  } = useWorkflow();

  // Check if all nodes have descriptions
  const allNodesHaveDescriptions = nodes.length > 0 && nodes.every(node => node.data.description?.trim());
  const nodesWithoutDescription = nodes.filter(node => !node.data.description?.trim()).length;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut for saving (Ctrl+S / Cmd+S)
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
    <main className="h-screen w-screen bg-gray-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">MuxFlow</h1>
            <span className="text-sm text-gray-500">AI Micro App Builder</span>
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 flex items-center space-x-1">
                <AlertCircle size={12} />
                <span>Unsaved changes</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Save Workflow Button */}
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

            {/* Generate App Button */}
            <button 
              onClick={generateApp}
              disabled={isGenerating || nodes.length === 0 || !allNodesHaveDescriptions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              title={
                nodes.length === 0 
                  ? "Add nodes to your workflow" 
                  : !allNodesHaveDescriptions 
                    ? `${nodesWithoutDescription} node(s) missing description`
                    : "Generate your application"
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Generate App</span>
                  {!allNodesHaveDescriptions && nodes.length > 0 && (
                    <span className="text-xs opacity-75">({nodesWithoutDescription} missing desc.)</span>
                  )}
                </>
              )}
            </button>
          </div>
        </header>

        {/* Tab Navigation - N8n Style Centered */}
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
              Workflow Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-2 font-medium text-sm rounded-r-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative">
          {activeTab === 'workflow' ? (
            <div className="h-full">
              <WorkflowEditor />
            </div>
          ) : (
            <div className="h-full overflow-hidden">
              <PreviewPanel />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
