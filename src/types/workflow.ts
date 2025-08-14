export interface WorkflowNodeData {
  label: string;
  nodeType: string;
  description?: string;
  generatedCode?: string;
  isProcessing?: boolean;
  error?: string;
  prompt?: string;
}

export interface WorkflowNodeLike {
  id: string;
  data: WorkflowNodeData;
}

export interface WorkflowEdgeLike {
  id?: string;
  source: string;
  target: string;
}

export interface NodeInputData {
  label: string;
  nodeType: string;
  prompt?: string;
  description?: string;
}

export interface GenerationHistoryNodeSnapshot {
  id: string;
  label: string;
  nodeType: string;
  description?: string;
  prompt?: string;
  generatedCode?: string;
}

export interface GenerationHistoryItem {
  id: string;
  createdAt: string;
  nodeLabels: string[];
  nodeTypes: string[];
  totalNodes: number;
  totalEdges: number;
  mermaid: string;
  // Optional extended snapshot data for change detection
  nodesSnapshot?: GenerationHistoryNodeSnapshot[];
  edgesSnapshot?: WorkflowEdgeLike[];
  snapshotHash?: string;
}


