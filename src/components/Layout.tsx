'use client';

import React, { useState } from 'react';
import WorkflowEditor from '@/components/WorkflowEditor';
import PreviewPanel from '@/components/PreviewPanel';

export default function Layout() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState('workflow');

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
            <span className="text-sm text-gray-500">AI Workflow Builder</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Workflow
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Export App
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'workflow'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Workflow Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preview
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'workflow' ? (
            <div className="h-full">
              <WorkflowEditor />
            </div>
          ) : (
            <div className="h-full overflow-auto p-4">
              <PreviewPanel />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
