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


