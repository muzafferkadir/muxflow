'use client';

import React from 'react';
import { 
  MessageSquare, 
  Zap, 
  Database, 
  FileText, 
  Image, 
  Globe,
  Settings,
  Brain
} from 'lucide-react';

interface NodeData {
  label: string;
  nodeType: string;
  prompt?: string;
  description?: string;
}

interface NodeToolbarProps {
  onAddNode: (nodeData: NodeData) => void;
}

const nodeTemplates = [
  {
    type: 'input',
    label: 'Input Node',
    icon: MessageSquare,
    description: 'AI-designed form components (text, select, checkbox, etc.)',
    data: {
      label: 'Input Node',
      nodeType: 'input',
      prompt: 'Design a form with specific inputs (e.g., "Create a user registration form with name, email, and password fields")',
      description: ''
    }
  },
  {
    type: 'show',
    label: 'Show/Display Node',
    icon: FileText,
    description: 'Content display pages designed by AI based on prompt',
    data: {
      label: 'Show/Display Node',
      nodeType: 'show',
      prompt: 'Design a page layout to display content (e.g., "Show user profile with avatar, bio, and contact info")',
      description: ''
    }
  },
  {
    type: 'action',
    label: 'Action Node',
    icon: Zap,
    description: 'Processing functions, calculations, client-side API calls',
    data: {
      label: 'Action Node',
      nodeType: 'action',
      prompt: 'Define an action or function (e.g., "Calculate BMI from height and weight" or "Fetch weather data from API")',
      description: ''
    }
  }
];

export default function NodeToolbar({ onAddNode }: NodeToolbarProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Nodes</h3>
        <p className="text-sm text-gray-600">Drag nodes to the canvas</p>
      </div>

      {/* Node List */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {nodeTemplates.map((template) => {
          const IconComponent = template.icon;
          return (
            <div
              key={template.type}
              className="group cursor-pointer border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              onClick={() => onAddNode(template.data)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow', JSON.stringify(template.data));
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                  <IconComponent size={16} className="text-gray-600 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                    {template.label}
                  </h4>
                  <p className="text-xs text-gray-500 group-hover:text-blue-700 mt-1">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Click to add • Drag to position
        </p>
      </div>
    </div>
  );
} 