'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { aiService, AIResponse } from '@/services/aiService';

interface WorkflowNode extends Node {
  data: {
    label: string;
    nodeType: string;
    prompt?: string;
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
  todoList: string[];
  analyzeWorkflow: () => Promise<void>;
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
  const [todoList, setTodoList] = useState<string[]>([]);

  const deleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remove any connected edges
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
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
            node.data.prompt || ''
          );
          break;
        case 'show':
          response = await aiService.generateDisplayPage(
            node.data.description, 
            node.data.prompt || ''
          );
          break;
        case 'action':
          response = await aiService.generateActionFunction(
            node.data.description, 
            node.data.prompt || ''
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
      todoList,
      analyzeWorkflow,
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
