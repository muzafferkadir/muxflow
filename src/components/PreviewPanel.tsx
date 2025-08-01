'use client';

import React from 'react';
import { Download, Globe, ExternalLink } from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

export default function PreviewPanel() {
  const [mounted, setMounted] = React.useState(false);
  
  const { 
    nodes, 
    generatedApp,
    isGeneratingWebApp,
    exportProject 
  } = useWorkflow();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const totalNodes = nodes.length;

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {generatedApp && (
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">Generated Application</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const blob = new Blob([generatedApp], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                className="flex items-center space-x-1 text-purple-600 hover:text-purple-800 text-xs px-2 py-1 rounded border border-purple-200 hover:bg-purple-50"
              >
                <ExternalLink size={12} />
                <span>Open</span>
              </button>
              <button
                onClick={exportProject}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Export"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {generatedApp ? (
          <iframe 
            srcDoc={generatedApp}
            className="w-full h-full border-0"
            title="Generated Web Application"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : isGeneratingWebApp ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Globe size={32} className="mx-auto animate-pulse text-purple-600 mb-3" />
              <div className="text-sm text-gray-600">Generating application...</div>
            </div>
          </div>
        ) : totalNodes > 0 ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Globe size={32} className="mx-auto text-gray-400 mb-3" />
              <div className="text-sm text-gray-600">Ready to generate your app</div>
              <div className="text-xs text-gray-500 mt-1">{totalNodes} nodes in workflow</div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Globe size={32} className="mx-auto text-gray-400 mb-3" />
              <div className="text-sm text-gray-600">Build your workflow first</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}