'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { webAppGenerator } from '@/services/webAppGenerator';
import { buildSnapshotFromNodesEdges, diffAgainstHistory, buildMermaidFromSnapshot } from '@/services/workflowDiff';
import type { ProjectFile } from '@/types';
import type { GenerationHistoryItem } from '@/types/workflow';
import toast from 'react-hot-toast';

interface WorkflowNode extends Node {
  data: {
    label: string;
    nodeType: string;
    description?: string;
    prompt?: string;
    generatedCode?: string;
    isProcessing?: boolean;
    error?: string;
  };
}

interface WorkflowContextType {
  nodes: WorkflowNode[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  isSaved: boolean;
  hasUnsavedChanges: boolean;
  generatedApp: string | null;
  projectFiles: ProjectFile[] | null;
  webAppPreviewUrl: string | null;
  isGeneratingWebApp: boolean;
  generateApp: () => Promise<void>;
  saveWorkflow: () => void;
  loadWorkflow: () => boolean;
  exportProject: () => void;
  deleteNode: (nodeId: string) => void;
  history: GenerationHistoryItem[];
  clearHistory: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [generatedApp, setGeneratedApp] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[] | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [webAppPreviewUrl, setWebAppPreviewUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isGeneratingWebApp, setIsGeneratingWebApp] = useState(false);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const saveTimeoutRef = React.useRef<number | null>(null);

  useEffect(() => {
    const savedWorkflow = localStorage.getItem('muxflow_workflow');
    if (savedWorkflow) {
      try {
        const workflowData = JSON.parse(savedWorkflow);
        setNodes(workflowData.nodes || []);
        setEdges(workflowData.edges || []);
        setIsSaved(true);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error loading saved workflow:', error);
      }
    }

    setIsInitialLoad(false);
    try {
      const savedPreviewId = localStorage.getItem('muxflow_preview_id');
      if (savedPreviewId) {
        setPreviewId(savedPreviewId);
      } else {
        const newId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem('muxflow_preview_id', newId);
        setPreviewId(newId);
      }
    } catch {}

    try {
      const savedHistory = localStorage.getItem('muxflow_history');
      if (savedHistory) {
        const parsed: GenerationHistoryItem[] = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    const last = history[0];
    const diff = diffAgainstHistory(nodes, edges, last);
    const changed = !!diff;
    if (changed) {
      setHasUnsavedChanges(true);
      setIsSaved(false);
    } else {
      setHasUnsavedChanges(false);
      setIsSaved(true);
    }
  }, [nodes, edges, isInitialLoad, history]);

  useEffect(() => {
    if (isInitialLoad) return;
    if (!hasUnsavedChanges) return;
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const workflowData = {
          nodes: nodes,
          edges: edges,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        localStorage.setItem('muxflow_workflow', JSON.stringify(workflowData));
        setIsSaved(true);
        setHasUnsavedChanges(false);
        toast.success('Workflow saved');
      } catch (e) {
        console.error('Auto-save error:', e);
        toast.error('Auto-save failed');
      }
    }, 5000);
    return () => {
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    };
  }, [nodes, edges, hasUnsavedChanges, isInitialLoad]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  }, []);

  const generateApp = useCallback(async () => {
    if (nodes.length === 0) {
      toast('Add nodes to your workflow before generating the app.', { icon: '⚠️' });
      return;
    }

    const nodesWithoutDescription = nodes.filter(node => !node.data.description?.trim());
    if (nodesWithoutDescription.length > 0) {
      toast(`${nodesWithoutDescription.length} node(s) missing descriptions. Add descriptions before generating.`, { icon: '⚠️' });
      return;
    }

    setIsGeneratingWebApp(true);
    
    try {
      const result = await webAppGenerator.generateFromWorkflow(nodes, edges, history);
      
      if (result.success) {
        if (result.htmlContent) {
          setGeneratedApp(result.htmlContent);
        }
        
        if (result.projectFiles) {
          setProjectFiles(result.projectFiles);
        }
        
        try {
          const filesForPreview: Array<{ name: string; content: string; type?: string }> = [];

          if (result.projectFiles && result.projectFiles.length > 0) {
            for (const f of result.projectFiles) {
              filesForPreview.push({ name: f.name, content: f.content });
            }
          } else if (result.htmlContent) {
            filesForPreview.push({ name: 'index.html', content: result.htmlContent });
          }

          if (filesForPreview.length > 0 && previewId) {
            const hasIndex = filesForPreview.some(f => f.name.toLowerCase() === 'index.html');
            if (!hasIndex) {
              const firstHtml = filesForPreview.find(f => f.name.toLowerCase().endsWith('.html'));
              if (firstHtml) {
                filesForPreview.push({ name: 'index.html', content: firstHtml.content });
              } else if (result.htmlContent) {
                filesForPreview.push({ name: 'index.html', content: result.htmlContent });
              }
            }

            const rewrittenFiles = filesForPreview.map((f) => {
              const isHtml = f.name.toLowerCase().endsWith('.html');
              const isJs = f.name.toLowerCase().endsWith('.js');
              const isCss = f.name.toLowerCase().endsWith('.css');
              if (isHtml) {
                const c = f.content
                  // href="/foo" -> href="./foo"
                  .replace(/href="\/(?!\/)/g, 'href="./')
                  // src="/foo" -> src="./foo"
                  .replace(/src="\/(?!\/)/g, 'src="./')
                  // navigator.serviceWorker.register('/service-worker.js') -> 'service-worker.js'
                  .replace(/serviceWorker\.register\(["']\/(?!\/)/g, "serviceWorker.register('");
                return { ...f, content: c };
              }
              if (isJs) {
                const c = f.content
                  // navigator.serviceWorker.register('/service-worker.js') -> 'service-worker.js'
                  .replace(/serviceWorker\.register\(["']\/(?!\/)/g, "serviceWorker.register('");
                return { ...f, content: c };
              }
              if (isCss) {
                const c = f.content
                  // url("/foo") -> url("./foo")
                  .replace(/url\(\s*"\/(?!\/)\s*/g, 'url("./')
                  // url('/foo') -> url('./foo')
                  .replace(/url\(\s*'\/(?!\/)\s*/g, "url('./")
                  // url(/foo) -> url(./foo)
                  .replace(/url\(\s*\/(?!\/)\s*/g, 'url(./');
                return { ...f, content: c };
              }
              return f;
            });

            const hasServiceWorkerFile = rewrittenFiles.some((f) => f.name.toLowerCase() === 'service-worker.js');
            const intendsToRegisterSW = rewrittenFiles.some((f) => /serviceWorker\.register\(\s*["']/.test(f.content));
            if (intendsToRegisterSW && !hasServiceWorkerFile) {
              rewrittenFiles.push({
                name: 'service-worker.js',
                content: `self.addEventListener('install', () => self.skipWaiting());\nself.addEventListener('activate', () => self.clients.claim());`,
              });
            }

            const res = await fetch('/api/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: previewId, files: rewrittenFiles })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.url) {
                setWebAppPreviewUrl(data.url);
              } else {
                setWebAppPreviewUrl(`/api/preview/${previewId}/index.html`);
              }
            } else {
              console.warn('Failed to publish preview');
              setWebAppPreviewUrl(null);
            }
          }
        } catch (e) {
          console.warn('Preview publish error', e);
          setWebAppPreviewUrl(null);
        }

        

        try {
          const snapshot = buildSnapshotFromNodesEdges(nodes, edges);
          const nodesSnapshot = snapshot.nodes;
          const edgesSnapshot = snapshot.edges;
          const snapshotHash = snapshot.hash;

          const newItem: GenerationHistoryItem = {
            id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            nodeLabels: nodes.map((n) => n.data.label),
            nodeTypes: nodes.map((n) => n.data.nodeType),
            totalNodes: nodes.length,
            totalEdges: edges.length,
            mermaid: buildMermaidFromSnapshot(nodesSnapshot, edgesSnapshot),
            nodesSnapshot,
            edgesSnapshot,
            snapshotHash,
          };
          setHistory((prev) => {
            if (prev.length > 0 && prev[0]?.snapshotHash && newItem.snapshotHash && prev[0].snapshotHash === newItem.snapshotHash) {
              return prev;
            }
            const updated = [newItem, ...prev].slice(0, 100);
            try {
              localStorage.setItem('muxflow_history', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        } catch {}
      } else {
        throw new Error(result.error || 'Failed to generate app');
      }
      
    } catch (error) {
      console.error('Error generating app:', error);
      toast.error('Error generating app. Please try again.');
    } finally {
      setIsGeneratingWebApp(false);
    }
  }, [nodes, edges, previewId, history]);

  const saveWorkflow = useCallback(() => {
    try {
      const workflowData = {
        nodes: nodes,
        edges: edges,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      localStorage.setItem('muxflow_workflow', JSON.stringify(workflowData));
      setIsSaved(true);
      setHasUnsavedChanges(false);
      toast.success('Workflow saved');
      } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Error saving workflow. Please try again.');
    }
  }, [nodes, edges]);

  const loadWorkflow = useCallback(() => {
    try {
      const savedWorkflow = localStorage.getItem('muxflow_workflow');
      if (savedWorkflow) {
        const workflowData = JSON.parse(savedWorkflow);
        setNodes(workflowData.nodes || []);
        setEdges(workflowData.edges || []);
        setIsSaved(true);
        setHasUnsavedChanges(false);
        toast.success('Workflow loaded');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading workflow:', error);
      toast.error('Error loading workflow.');
      return false;
    }
  }, []);


  const exportProject = useCallback(async () => {
    const files = projectFiles && projectFiles.length > 0
      ? projectFiles
      : (generatedApp ? [{ name: 'index.html', content: generatedApp }] : null);
    
    if (!files) {
      toast.error('No generated app to export. Please generate an app first.');
      return;
    }

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.html')) {
      const blob = new Blob([files[0].content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = files[0].name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.name, f.content));

    // Add README with local run instructions
    const readme = `MuxFlow Export\n\nHow to run locally (recommended):\n\n1) Python (built-in on macOS)\n   cd <unzipped-folder>\n   python3 -m http.server 5500\n   Open http://localhost:5500/index.html\n\n2) Node (http-server)\n   npx http-server -p 5500 --cors\n   Open http://localhost:5500/index.html\n\n3) Node (serve)\n   npx serve -l 5500\n   Open http://localhost:5500\n\nNotes:\n- Opening index.html via file:// causes CORS issues for ES modules, manifest and service worker.\n- Service Worker requires HTTPS or localhost. Use the Open button (new tab) or a local server.\n`;
    zip.file('README.txt', readme);
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muxflow-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [projectFiles, generatedApp]);

  return (
    <WorkflowContext.Provider value={{
      nodes,
      edges,
      setNodes,
      setEdges,
      isSaved,
      hasUnsavedChanges,
      generatedApp,
      projectFiles,
      webAppPreviewUrl,
      isGeneratingWebApp,
      generateApp,
      saveWorkflow,
      loadWorkflow,
      exportProject,
      deleteNode,
      history,
      clearHistory: () => {
        setHistory([]);
        try { localStorage.removeItem('muxflow_history'); } catch {}
      }
    }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
