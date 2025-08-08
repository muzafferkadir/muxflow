'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { webAppGenerator } from '@/services/webAppGenerator';
import type { ProjectFile } from '@/services/webAppGenerator';

interface WorkflowNode extends Node {
  data: {
    label: string;
    nodeType: string;
    description?: string;
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
  generatedProject: Record<string, unknown> | null;
  generatedApp: string | null;
  projectFiles: ProjectFile[] | null;
  webAppPreviewUrl: string | null;
  isGeneratingWebApp: boolean;
  generateApp: () => Promise<void>;
  saveWorkflow: () => void;
  loadWorkflow: () => boolean;
  exportProject: () => void;
  deleteNode: (nodeId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<Record<string, unknown> | null>(null);
  const [generatedApp, setGeneratedApp] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[] | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [webAppPreviewUrl, setWebAppPreviewUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isGeneratingWebApp, setIsGeneratingWebApp] = useState(false);

  // Load workflow from localStorage on mount
  useEffect(() => {
    const savedProject = localStorage.getItem('muxflow_project');
    if (savedProject) {
      try {
        const projectData = JSON.parse(savedProject);
        setGeneratedProject(projectData);
      } catch (error) {
        console.error('Error loading saved project:', error);
      }
    }

    // Load workflow from localStorage
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
    // Ensure a stable preview id per browser/session
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
  }, []);

  useEffect(() => {
    if (!isInitialLoad && (nodes.length > 0 || edges.length > 0)) {
      setHasUnsavedChanges(true);
      setIsSaved(false);
    }
  }, [nodes, edges, isInitialLoad]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
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
      alert('Please add nodes to your workflow before generating the app.');
      return;
    }

    const nodesWithoutDescription = nodes.filter(node => !node.data.description?.trim());
    if (nodesWithoutDescription.length > 0) {
      alert(`${nodesWithoutDescription.length} node(s) are missing descriptions. Please add descriptions to all nodes before generating the app.`);
      return;
    }

    setIsGeneratingWebApp(true);
    
    try {
      // Save project to localStorage
      const projectData = {
        nodes: nodes,
        edges: edges,
        timestamp: new Date().toISOString(),
        workflowType: 'integrated-app'
      };
      
      localStorage.setItem('muxflow_project', JSON.stringify(projectData));
      setGeneratedProject(projectData);

      const result = await webAppGenerator.generateFromWorkflow(nodes, edges);
      
      if (result.success) {
        if (result.htmlContent) {
          setGeneratedApp(result.htmlContent);
        }
        
        if (result.projectFiles) {
          setProjectFiles(result.projectFiles);
        }
        
        // Publish preview files to in-memory store via API and set preview URL
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

            // Rewrite absolute root paths to relative for preview subpath compatibility
            const rewrittenFiles = filesForPreview.map((f) => {
              const isHtml = f.name.toLowerCase().endsWith('.html');
              const isJs = f.name.toLowerCase().endsWith('.js');
              if (isHtml) {
                const c = f.content
                  // href="/foo" -> href="./foo"
                  .replace(/href="\/(?!\/)/g, 'href="./')
                  // src="/foo" -> src="./foo"
                  .replace(/src="\/(?!\/)/g, 'src="./');
                return { ...f, content: c };
              }
              if (isJs) {
                const c = f.content
                  // navigator.serviceWorker.register('/service-worker.js') -> 'service-worker.js'
                  .replace(/serviceWorker\.register\(["']\/(?!\/)/g, "serviceWorker.register('");
                return { ...f, content: c };
              }
              return f;
            });

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

        console.log('App generated successfully');
      } else {
        throw new Error(result.error || 'Failed to generate app');
      }
      
    } catch (error) {
      console.error('Error generating app:', error);
      alert('Error generating app. Please try again.');
    } finally {
      setIsGeneratingWebApp(false);
    }
  }, [nodes, edges, previewId]);

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
      } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow. Please try again.');
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
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading workflow:', error);
      alert('Error loading workflow.');
      return false;
    }
  }, []);


  const exportProject = useCallback(async () => {
    const files = projectFiles && projectFiles.length > 0
      ? projectFiles
      : (generatedApp ? [{ name: 'index.html', content: generatedApp }] : null);
    
    if (!files) {
      alert('No generated app to export. Please generate an app first.');
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
      generatedProject,
      generatedApp,
      projectFiles,
      webAppPreviewUrl,
      isGeneratingWebApp,
      generateApp,
      saveWorkflow,
      loadWorkflow,
      exportProject,
      deleteNode
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
