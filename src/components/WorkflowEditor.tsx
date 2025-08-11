'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  BackgroundVariant,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodeToolbar from './NodeToolbar';
import CustomNode from './nodes/CustomNode';
import { useWorkflow } from '@/contexts/WorkflowContext';
import type { NodeInputData } from '@/types/workflow';
import { History } from 'lucide-react';

const nodeTypes = {
  custom: CustomNode,
};

type WorkflowEditorProps = {
  onToggleHistory?: () => void;
};

export default function WorkflowEditor({ onToggleHistory }: WorkflowEditorProps) {
  const { nodes, edges, setNodes, setEdges, deleteNode } = useWorkflow();
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => {
      return applyNodeChanges(changes, nds);
    });
  }, [setNodes]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => {
      return applyEdgeChanges(changes, eds);
    });
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(async (nodeData: NodeInputData) => {
    const newNode = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { 
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 200 
      },
      data: {
        ...nodeData,
        description: '',
        generatedCode: '',
        isProcessing: false,
        error: ''
      }
    };

    setNodes((nds) => [...nds, newNode]);
    
  }, [setNodes]);

  return (
    <div className="h-full flex relative">
      <div className="absolute left-4 top-12 w-64 bg-white border border-gray-200 rounded-lg shadow-sm z-10">
        <NodeToolbar onAddNode={handleAddNode} />
      </div>

      {onToggleHistory && (
        <div className="absolute right-2 top-2 z-10">
          <button
            onClick={onToggleHistory}
            className="px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-colors flex items-center space-x-2"
            title="Toggle history"
          >
            <History size={16} />
          </button>
        </div>
      )}

      <div className="w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          onNodesDelete={(nodesToDelete) => {
            nodesToDelete.forEach(node => {
              deleteNode(node.id);
            });
          }}
          className="bg-gray-50"
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
} 