import type { GenerationHistoryItem, GenerationHistoryNodeSnapshot, WorkflowEdgeLike } from '@/types/workflow';

type MinimalNodeForDiff = {
  id: string;
  data: {
    label: string;
    nodeType: string;
    description?: string;
    prompt?: string;
    generatedCode?: string;
  };
};

type MinimalEdgeForDiff = {
  id?: string;
  source: string;
  target: string;
};

export type WorkflowDiffResult = {
  addedNodes: number;
  removedNodes: number;
  modifiedNodes: number;
  addedEdges: number;
  removedEdges: number;
  summary: string;
};

export function buildSnapshotFromNodesEdges<N extends MinimalNodeForDiff, E extends MinimalEdgeForDiff>(
  nodes: N[],
  edges: E[]
): {
  nodes: GenerationHistoryNodeSnapshot[];
  edges: WorkflowEdgeLike[];
  hash?: string;
} {
  const nodesSnapshot: GenerationHistoryNodeSnapshot[] = nodes
    .map((n) => ({
      id: n.id,
      label: n.data.label,
      nodeType: n.data.nodeType,
      description: n.data.description,
      prompt: n.data.prompt,
      generatedCode: n.data.generatedCode,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const edgesSnapshot: WorkflowEdgeLike[] = edges
    .map((e) => ({ id: e.id, source: e.source, target: e.target }))
    .sort((a, b) => `${a.source}:${a.target}`.localeCompare(`${b.source}:${b.target}`));

  const hash = computeSnapshotHash(nodesSnapshot, edgesSnapshot);

  return { nodes: nodesSnapshot, edges: edgesSnapshot, hash };
}

export function buildMermaidFromSnapshot(
  nodesSnapshot: GenerationHistoryNodeSnapshot[],
  edgesSnapshot: WorkflowEdgeLike[]
): string {
  try {
    const lines: string[] = ['graph TD'];
    nodesSnapshot.forEach((n) => {
      const safeLabel = (n.label || n.id).replace(/[\n\r]/g, ' ').replace(/"/g, '\\"');
      lines.push(`${n.id}["${safeLabel}"]`);
    });
    edgesSnapshot.forEach((e) => {
      lines.push(`${e.source}-->${e.target}`);
    });
    return lines.join('\n');
  } catch {
    return '';
  }
}

export function computeSnapshotHash(
  nodesSnapshot: GenerationHistoryNodeSnapshot[],
  edgesSnapshot: WorkflowEdgeLike[]
): string | undefined {
  try {
    const stable = JSON.stringify({ n: nodesSnapshot, e: edgesSnapshot });
    let h = 0;
    for (let i = 0; i < stable.length; i++) {
      h = (h * 31 + stable.charCodeAt(i)) | 0;
    }
    return `h${(h >>> 0).toString(16)}`;
  } catch {
    return undefined;
  }
}

export function diffAgainstHistory<N extends MinimalNodeForDiff, E extends MinimalEdgeForDiff>(
  nodes: N[],
  edges: E[],
  last?: GenerationHistoryItem
): WorkflowDiffResult | null {
  const current = buildSnapshotFromNodesEdges(nodes, edges);

  // No history: if empty snapshot, no diff; otherwise, everything is added
  if (!last || !last.nodesSnapshot || !last.edgesSnapshot) {
    const addedNodes = current.nodes.length;
    const addedEdges = current.edges.length;
    if (addedNodes === 0 && addedEdges === 0) return null;
    const summary = summarize(addedNodes, 0, 0, addedEdges, 0);
    return { addedNodes, removedNodes: 0, modifiedNodes: 0, addedEdges, removedEdges: 0, summary };
  }

  const prevNodes = new Map(last.nodesSnapshot.map((n) => [n.id, n]));
  const currNodes = new Map(current.nodes.map((n) => [n.id, n]));
  const prevEdges = new Set(last.edgesSnapshot.map((e) => `${e.source}->${e.target}`));
  const currEdges = new Set(current.edges.map((e) => `${e.source}->${e.target}`));

  let addedNodes = 0,
    removedNodes = 0,
    modifiedNodes = 0;
  for (const id of currNodes.keys()) {
    if (!prevNodes.has(id)) addedNodes++;
    else {
      const a = currNodes.get(id)!;
      const b = prevNodes.get(id)!;
      if (
        a.label !== b.label ||
        a.nodeType !== b.nodeType ||
        (a.description || '') !== (b.description || '') ||
        (a.prompt || '') !== (b.prompt || '') ||
        (a.generatedCode || '') !== (b.generatedCode || '')
      ) {
        modifiedNodes++;
      }
    }
  }
  for (const id of prevNodes.keys()) {
    if (!currNodes.has(id)) removedNodes++;
  }

  let addedEdges = 0,
    removedEdges = 0;
  for (const e of currEdges) if (!prevEdges.has(e)) addedEdges++;
  for (const e of prevEdges) if (!currEdges.has(e)) removedEdges++;

  if (addedNodes === 0 && removedNodes === 0 && modifiedNodes === 0 && addedEdges === 0 && removedEdges === 0) {
    return null;
  }

  const summary = summarize(addedNodes, removedNodes, modifiedNodes, addedEdges, removedEdges);
  return { addedNodes, removedNodes, modifiedNodes, addedEdges, removedEdges, summary };
}

function summarize(
  addedNodes: number,
  removedNodes: number,
  modifiedNodes: number,
  addedEdges: number,
  removedEdges: number
): string {
  const parts: string[] = [];
  if (addedNodes) parts.push(`+${addedNodes} node`);
  if (removedNodes) parts.push(`-${removedNodes} node`);
  if (modifiedNodes) parts.push(`~${modifiedNodes} node changed`);
  if (addedEdges) parts.push(`+${addedEdges} edge`);
  if (removedEdges) parts.push(`-${removedEdges} edge`);
  return parts.join(', ');
}


