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
  isAnalyzing: boolean;
  isGenerating: boolean;
  isSaved: boolean;
  hasUnsavedChanges: boolean;
  todoList: string[];
  generatedProject: any;
  generatedApp: string | null;
  projectFiles: ProjectFile[] | null;
  webAppPreviewUrl: string | null;
  isGeneratingWebApp: boolean;
  analyzeWorkflow: () => Promise<void>;
  generateApp: () => Promise<void>;
  saveWorkflow: () => void;
  loadWorkflow: () => boolean;
  generateNodeCode: (nodeId: string) => Promise<void>;
  generateAllNodes: () => Promise<void>;
  exportProject: () => void;
  deleteNode: (nodeId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [todoList, setTodoList] = useState<string[]>([]);
  const [generatedProject, setGeneratedProject] = useState<any>(null);
  const [generatedApp, setGeneratedApp] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[] | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [webAppPreviewUrl, setWebAppPreviewUrl] = useState<string | null>(null);
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

    // Mark initial load as complete
    setIsInitialLoad(false);
  }, []);

  // Track changes to nodes and edges (skip initial load and empty states)
  useEffect(() => {
    if (!isInitialLoad && (nodes.length > 0 || edges.length > 0)) {
      setHasUnsavedChanges(true);
      setIsSaved(false);
    }
  }, [nodes, edges, isInitialLoad]);

  // Prevent page unload with unsaved changes
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
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remove any connected edges
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  }, []);

  // Function to find the execution order of nodes based on their connections
  const getNodeExecutionOrder = useCallback(() => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const visited = new Set<string>();
    const executionOrder: WorkflowNode[] = [];
    
    // Find nodes with no incoming edges (start nodes)
    const incomingCount = new Map<string, number>();
    nodes.forEach(node => incomingCount.set(node.id, 0));
    edges.forEach(edge => {
      const count = incomingCount.get(edge.target) || 0;
      incomingCount.set(edge.target, count + 1);
    });
    
    // Topological sort
    const queue: string[] = [];
    incomingCount.forEach((count, nodeId) => {
      if (count === 0) queue.push(nodeId);
    });
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodeMap.get(nodeId);
      if (node) {
        executionOrder.push(node);
        visited.add(nodeId);
        
        // Update incoming counts for connected nodes
        edges.forEach(edge => {
          if (edge.source === nodeId) {
            const currentCount = incomingCount.get(edge.target) || 0;
            const newCount = currentCount - 1;
            incomingCount.set(edge.target, newCount);
            if (newCount === 0 && !visited.has(edge.target)) {
              queue.push(edge.target);
            }
          }
        });
      }
    }
    
    return executionOrder;
  }, [nodes, edges]);

  const generateApp = useCallback(async () => {
    if (nodes.length === 0) {
      alert('Please add nodes to your workflow before generating the app.');
      return;
    }

    // Check if all nodes have descriptions
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

      // Generate both HTML and project files
      const result = await webAppGenerator.generateFromWorkflow(nodes, edges);
      
      if (result.success) {
        // Set both HTML content and project files
        if (result.htmlContent) {
          setGeneratedApp(result.htmlContent);
        }
        
        if (result.projectFiles) {
          setProjectFiles(result.projectFiles);
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
  }, [nodes, edges]);

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
      
      // Success feedback
      console.log('Workflow saved successfully at', new Date().toLocaleTimeString());
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

  const analyzeWorkflow = useCallback(async () => {
    // Note: Workflow analysis feature deprecated
    // AI service now directly generates complete apps from workflow
    console.log('Workflow analysis deprecated. Use generateWebApp() for complete app generation.');
    setTodoList(['Use "Generate App" to create your complete application']);
  }, []);

  const generateNodeCode = useCallback(async (nodeId: string) => {
    // Note: Individual node code generation is no longer used
    // The app now generates complete integrated applications via AI service
    console.log('Individual node generation deprecated. Use generateWebApp() for complete app generation.');
  }, []);

  const generateAllNodes = useCallback(async () => {
    const nodesWithDescriptions = nodes.filter(n => n.data.description);
    
    for (const node of nodesWithDescriptions) {
      await generateNodeCode(node.id);
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [nodes, generateNodeCode]);

  const exportProject = useCallback(() => {
    if (!generatedApp) {
      alert('No generated app to export. Please generate an app first.');
      return;
    }

    // Export the generated HTML app
    const blob = new Blob([generatedApp], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muxflow-app.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generatedApp]);

  return (
    <WorkflowContext.Provider value={{
      nodes,
      edges,
      setNodes,
      setEdges,
      isAnalyzing,
      isGenerating,
      isSaved,
      hasUnsavedChanges,
      todoList,
      generatedProject,
      generatedApp,
      projectFiles,
      webAppPreviewUrl,
      isGeneratingWebApp,
      analyzeWorkflow,
      generateApp,
      saveWorkflow,
      loadWorkflow,
      generateNodeCode,
      generateAllNodes,
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
