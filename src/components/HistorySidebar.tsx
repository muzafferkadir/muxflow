'use client';

import React from 'react';
import { History, Trash2, X } from 'lucide-react';
import type { GenerationHistoryItem } from '@/types/workflow';

interface HistorySidebarProps {
  history: GenerationHistoryItem[];
  onClose: () => void;
  onClearHistory: () => void;
}

export default function HistorySidebar({ history, onClose, onClearHistory }: HistorySidebarProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute z-[11] right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl pointer-events-auto flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History size={16} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-800">Generation History</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearHistory}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Clear history"
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {history.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No history yet.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((h, idx) => {
                const prev = history[idx + 1];
                let changeSummary: string | null = null;
                if (prev && h.nodesSnapshot && prev.nodesSnapshot && h.edgesSnapshot && prev.edgesSnapshot) {
                  try {
                    const currNodes = new Map(h.nodesSnapshot.map(n => [n.id, n]));
                    const prevNodes = new Map(prev.nodesSnapshot.map(n => [n.id, n]));
                    const currEdges = new Set(h.edgesSnapshot.map(e => `${e.source}->${e.target}`));
                    const prevEdges = new Set(prev.edgesSnapshot.map(e => `${e.source}->${e.target}`));

                    let addedNodes = 0, removedNodes = 0, modifiedNodes = 0;
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

                    let addedEdges = 0, removedEdges = 0;
                    for (const e of currEdges) if (!prevEdges.has(e)) addedEdges++;
                    for (const e of prevEdges) if (!currEdges.has(e)) removedEdges++;

                    const parts: string[] = [];
                    if (addedNodes) parts.push(`+${addedNodes} node`);
                    if (removedNodes) parts.push(`-${removedNodes} node`);
                    if (modifiedNodes) parts.push(`~${modifiedNodes} node changed`);
                    if (addedEdges) parts.push(`+${addedEdges} edge`);
                    if (removedEdges) parts.push(`-${removedEdges} edge`);
                    changeSummary = parts.length ? parts.join(', ') : 'No changes from previous';
                  } catch {}
                }

                return (
                  <li key={h.id} className="p-4">
                    <div className="text-xs text-gray-500">{new Date(h.createdAt).toLocaleString()}</div>
                    <div className="text-sm font-medium text-gray-800 mt-1">{h.totalNodes} nodes, {h.totalEdges} edges</div>
                    {changeSummary && (
                      <div className="text-xs text-gray-600 mt-1">{changeSummary}</div>
                    )}
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">{h.nodeLabels.join(', ')}</div>
                    {h.mermaid && (
                      <pre className="mt-2 p-2 bg-gray-50 text-[10px] text-gray-700 rounded border border-gray-100 overflow-auto">
{h.mermaid}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


