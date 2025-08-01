'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  BackgroundVariant,
  Node,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import NodeToolbar from './NodeToolbar';
import CustomNode from './nodes/CustomNode';
import { useWorkflow } from '@/contexts/WorkflowContext';

const nodeTypes = {
  custom: CustomNode,
};

export default function WorkflowEditor() {
  const { nodes, edges, setNodes, setEdges, deleteNode } = useWorkflow();
  
  const onNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      return applyNodeChanges(changes, nds);
    });
  }, [setNodes]);

  const onEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      return applyEdgeChanges(changes, eds);
    });
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    // Apply changes to our context state
    setNodes((nds) => {
      const updatedNodes = [...nds];
      changes.forEach((change: any) => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === change.id);
        if (nodeIndex !== -1) {
          switch (change.type) {
            case 'position':
              if (change.position) {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  position: change.position
                };
              }
              break;
            case 'remove':
              updatedNodes.splice(nodeIndex, 1);
              break;
            case 'select':
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                selected: change.selected
              };
              break;
          }
        }
      });
      return updatedNodes;
    });
  }, [onNodesChange, setNodes]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    // Apply changes to our context state
    setEdges((eds) => {
      const updatedEdges = [...eds];
      changes.forEach((change: any) => {
        const edgeIndex = updatedEdges.findIndex(e => e.id === change.id);
        if (edgeIndex !== -1 && change.type === 'remove') {
          updatedEdges.splice(edgeIndex, 1);
        }
      });
      return updatedEdges;
    });
  }, [onEdgesChange, setEdges]);

  const handleAddNode = useCallback((nodeData: any) => {
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
      {/* Node Toolbar - Absolute positioned */}
      <div className="absolute left-4 top-12 w-64 bg-white border border-gray-200 rounded-lg shadow-sm z-10">
        <NodeToolbar onAddNode={handleAddNode} />
      </div>

      {/* Flow Canvas - Full width */}
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