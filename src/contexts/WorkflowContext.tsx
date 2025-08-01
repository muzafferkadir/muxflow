'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { aiService, AIResponse } from '@/services/aiService';

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load project from localStorage on mount
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

    // Load workflow from localStorage on mount
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
    } else {
      // No saved workflow, start with empty state as saved
      setIsSaved(true);
      setHasUnsavedChanges(false);
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

    setIsGenerating(true);
    
    try {
      // Get execution order
      const executionOrder = getNodeExecutionOrder();
      
      // Analyze workflow requirements
      const requirements = executionOrder.map(node => ({
        id: node.id,
        type: node.data.nodeType,
        description: node.data.description || '',
        label: node.data.label
      }));

      // Save project to localStorage
      const projectData = {
        nodes: requirements,
        edges: edges,
        timestamp: new Date().toISOString(),
        requirements: requirements.map(req => `${req.type}: ${req.description}`).join('\n')
      };
      
      localStorage.setItem('muxflow_project', JSON.stringify(projectData));
      setGeneratedProject(projectData);

      // Mark all nodes as processing
      setNodes(prev => prev.map(node => ({
        ...node,
        data: { ...node.data, isProcessing: true, error: '' }
      })));

      // Generate code for each node in order
      for (const node of executionOrder) {
        await generateNodeCode(node.id);
      }

      alert('App generation completed! Check the preview panel.');
      
    } catch (error) {
      console.error('Error generating app:', error);
      alert('Error generating app. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [nodes, edges, getNodeExecutionOrder]);

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
    if (nodes.length === 0) {
      setTodoList(['Add nodes to your workflow to begin analysis']);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await aiService.analyzeWorkflow(nodes, edges);
      if (response.error) {
        throw new Error(response.error);
      }

      // Parse the response into a todo list
      const tasks = response.content
        .split('\n')
        .filter(line => line.trim() && /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());

      setTodoList(tasks);
    } catch (error) {
      console.error('Analysis failed:', error);
      setTodoList(['Failed to analyze workflow. Please check your API configuration.']);
    } finally {
      setIsAnalyzing(false);
    }
  }, [nodes, edges]);

  const generateNodeCode = useCallback(async (nodeId: string) => {
    const nodeIndex = nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = nodes[nodeIndex];
    if (!node.data.description) {
      alert('Please add a description to the node before generating code.');
      return;
    }

    // Update node to show processing state
    setNodes(prevNodes => 
      prevNodes.map(n => 
        n.id === nodeId 
          ? { ...n, data: { ...n.data, isProcessing: true, error: undefined } }
          : n
      )
    );

    try {
      let response: AIResponse;

      switch (node.data.nodeType) {
        case 'input':
          response = await aiService.generateInputForm(
            node.data.description, 
            node.data.description || ''
          );
          break;
        case 'show':
          response = await aiService.generateDisplayPage(
            node.data.description, 
            node.data.description || ''
          );
          break;
        case 'action':
          response = await aiService.generateActionFunction(
            node.data.description, 
            node.data.description || ''
          );
          break;
        default:
          throw new Error('Unknown node type');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      // Update node with generated code
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === nodeId 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  generatedCode: response.content,
                  isProcessing: false,
                  error: undefined
                } 
              }
            : n
        )
      );
    } catch (error) {
      console.error('Code generation failed:', error);
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === nodeId 
            ? { 
                ...n, 
                data: { 
                  ...n.data, 
                  isProcessing: false,
                  error: error instanceof Error ? error.message : 'Unknown error'
                } 
              }
            : n
        )
      );
    }
  }, [nodes]);

  const generateAllNodes = useCallback(async () => {
    const nodesWithDescriptions = nodes.filter(n => n.data.description);
    
    for (const node of nodesWithDescriptions) {
      await generateNodeCode(node.id);
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [nodes, generateNodeCode]);

  const exportProject = useCallback(() => {
    const generatedNodes = nodes.filter(n => n.data.generatedCode);
    
    if (generatedNodes.length === 0) {
      alert('No generated code to export. Please generate code for your nodes first.');
      return;
    }

    // Create HTML file with all generated components
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MuxFlow Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .node-section { margin: 2rem 0; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; }
        .node-title { font-weight: bold; margin-bottom: 1rem; padding: 0.5rem; background: #f3f4f6; border-radius: 0.25rem; }
    </style>
</head>
<body class="bg-gray-50 p-4">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Generated by MuxFlow</h1>
        
        ${generatedNodes.map(node => `
        <div class="node-section">
            <div class="node-title">${node.data.label} - ${node.data.description}</div>
            ${node.data.generatedCode}
        </div>
        `).join('')}
        
        <script>
            // Initialize the application
            console.log('MuxFlow App Initialized');
            
            // Add any initialization code here
            ${generatedNodes
              .filter(n => n.data.nodeType === 'action')
              .map(n => n.data.generatedCode)
              .join('\n\n')
            }
        </script>
    </div>
</body>
</html>`;

    // Download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muxflow-app.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes]);

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
