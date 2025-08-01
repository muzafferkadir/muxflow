'use client';

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  MessageSquare, 
  Zap, 
  FileText, 
  Edit3,
  Trash2,
  Loader2
} from 'lucide-react';
import { useWorkflow } from '@/contexts/WorkflowContext';

interface CustomNodeData {
  label: string;
  nodeType: string;
  description?: string;
  generatedCode?: string;
  isProcessing?: boolean;
  error?: string;
}

const nodeIcons = {
  input: MessageSquare,
  show: FileText,
  action: Zap,
};

const nodeColors = {
  input: 'bg-blue-500',
  show: 'bg-green-500',
  action: 'bg-purple-500',
};

function CustomNode({ data, id, selected }: NodeProps<CustomNodeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(data.description || '');
  const { setNodes, deleteNode } = useWorkflow();

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
      deleteNode(id);
    }
  }, [deleteNode, id]);

  const IconComponent = nodeIcons[data.nodeType as keyof typeof nodeIcons] || MessageSquare;
  const nodeColor = nodeColors[data.nodeType as keyof typeof nodeColors] || 'bg-gray-500';

  const handleSave = () => {
    // Update node data in context
    setNodes(prev => prev.map(node => 
      node.id === id 
        ? { ...node, data: { ...node.data, description } }
        : node
    ));
    setIsEditing(false);
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  return (
    <div 
      className={`relative bg-white border-2 rounded-lg shadow-sm min-w-[200px] select-none ${
        selected ? 'border-blue-400 shadow-md' : 'border-gray-200'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      {/* Node Header */}
      <div className={`${nodeColor} text-white p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent size={16} />
            <span className="font-semibold text-sm">{data.label}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3">
        {isEditing ? (
          <div className="space-y-3" onDoubleClick={(e) => e.stopPropagation()}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (Required)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this node should do..."
                className="w-full h-20 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 select-text"
                onMouseDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                style={{ userSelect: 'text' }}
                autoFocus
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={!description.trim()}
                className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-gray-600 space-y-2 select-none">
              {data.description ? (
                <div>
                  <p className="font-medium text-gray-800 mb-1">Description:</p>
                  <p className="text-gray-600 text-xs leading-relaxed cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors" 
                     title="Double-click to edit"
                     onDoubleClick={handleDoubleClick}>
                    {data.description}
                  </p>
                </div>
              ) : (
                <p className="text-red-500 font-medium cursor-pointer hover:bg-red-50 p-1 rounded transition-colors" 
                   title="Double-click to add description"
                   onDoubleClick={handleDoubleClick}>
                  ⚠️ Description required (double-click to add)
                </p>
              )}
            </div>

            {/* Status Display */}
            {data.isProcessing && (
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <Loader2 size={12} className="animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {/* Error Display */}
            {data.error && (
              <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
                Error: {data.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />

      {/* Node Status Indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
    </div>
  );
}

export default memo(CustomNode); 