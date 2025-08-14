import type { AIMessage, AIResponse } from '@/types';
import type { GenerationHistoryItem } from '@/types/workflow';
import { buildMermaidFromSnapshot } from '@/services/workflowDiff';

export class AIService {
  constructor() {}

  async generateContent(messages: AIMessage[]): Promise<AIResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Invalid response format from AI service');
      return { content };
    } catch (error) {
      console.error('AI Service Error:', error);
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  async generateProjectStructure(
    nodes: Array<{ data: { nodeType: string; label: string; description?: string } }>,
    recentHistory?: GenerationHistoryItem[],
    diffSummary?: string
  ): Promise<AIResponse> {
    const inputNodes = nodes.filter(n => n.data.nodeType === 'input');
    const actionNodes = nodes.filter(n => n.data.nodeType === 'action');
    const showNodes = nodes.filter(n => n.data.nodeType === 'show');

    const workflowDescription = this.createWorkflowDescription(inputNodes, actionNodes, showNodes);

    const historySummary = (() => {
      try {
        if (!recentHistory || recentHistory.length === 0) return '';
        const items = recentHistory.map((h, i) => {
          const title = `${new Date(h.createdAt).toISOString()} — ${h.totalNodes} nodes / ${h.totalEdges} edges`;
          const labels = h.nodeLabels.join(', ');
          const mermaid = h.nodesSnapshot && h.edgesSnapshot ? `\n${buildMermaidFromSnapshot(h.nodesSnapshot, h.edgesSnapshot)}` : (h.mermaid ? `\n${h.mermaid}` : '');
          return `#${i + 1}) ${title}\nLabels: ${labels}${mermaid}`;
        });
        return `\n\nRECENT HISTORY (last ${recentHistory.length}):\n${items.join('\n\n')}`;
      } catch { return ''; }
    })();

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert full‑stack web engineer and UI designer. Build production‑ready, accessible, static web applications from a provided workflow.

Your task is to analyze the workflow and generate a complete, cohesive project with multiple files (HTML, CSS, JS). The output should be polished, responsive, and usable by end users without further changes.

CRITICAL TECHNICAL REQUIREMENTS:
- Generate a complete project with separate HTML, CSS, and JavaScript files
- Use modern vanilla JavaScript ES6+ (NO frameworks)
- Use Tailwind CSS via CDN for styling
- Persist all data with localStorage only (no remote APIs)
- Offline‑first: register a service worker to cache core assets so the app works offline after first load
- No external dependencies except Tailwind CDN

UI/UX AND DESIGN REQUIREMENTS (TASTEFUL, MINIMAL):
- Minimalist visual design with neutral surfaces and a single primary accent color
  - Status colors used sparingly: red-600, amber-600, emerald-600 for error/warn/success backgrounds/text/borders
- TYPOGRAPHY: system-ui/Inter; base text-sm; headings with clear scale (e.g., text-2xl font-semibold for section titles, text-lg font-medium for subheads)
- DENSITY: use consistent spacing scale (4/6/8); container widths max-w-3xl md:max-w-5xl mx-auto px-4 md:px-6
- COMPONENTS:
  - Buttons: rounded-lg shadow-sm border border-slate-200 bg-white text-slate-800 hover:bg-slate-50; primary uses bg-indigo-600 text-white
  - Inputs: rounded-md border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
  - Cards: rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900
- STATES: Inline validation near inputs; non‑blocking banners for feedback. Provide empty, loading, and error states.
- MOTION: Use only subtle transitions (transition-colors duration-200). Avoid animations that distract.
- AVOID: gradients, heavy shadows, excessive rounding, glassmorphism/neumorphism, neon or overly pastel palettes
- ACCESSIBILITY: Use semantic HTML5 landmarks, ARIA where appropriate, keyboard navigation, and meet WCAG AA contrast
- No alert(), confirm(), prompt(), or browser chat/window‑style UIs; build in‑app UI for feedback (banners/modals)

PROJECT STRUCTURE REQUIREMENTS:
- index.html (main HTML with proper ES6 module support, Tailwind CDN, meta tags, manifest link, and service worker registration hook)
- styles.css (custom styles, minimal; can define CSS variables/tokens)
- app.js (bootstrapping, event wiring, routing/state glue, service worker registration)
- components.js (reusable UI components and view renderers)
- utils.js (storage, validation, formatting, helpers)
- manifest.json (PWA manifest for icons/name/theme; keep small and local)
- service-worker.js (cache core files and handle offline; keep simple and safe)

CRITICAL MODULE REQUIREMENTS:
- HTML MUST include <script type="module" src="app.js"></script> as the main script
- ALL JavaScript files with imports/exports MUST be loaded with type="module"
- Use proper ES6 import/export syntax; ensure module paths are correct
- Register the service worker in app.js if supported (navigator.serviceWorker)

CRITICAL OUTPUT FORMAT:
- Return ONLY a JSON object with file structure
- Do NOT include markdown code blocks or explanations
- JSON format: {"files": [{"name": "filename.ext", "content": "file content"}]}
- Each file content must be complete and functional
- HTML must include Tailwind CDN and proper module script tag(s)
- All files must work together as a cohesive, production‑ready application

SECURITY & COMPATIBILITY:
- No external file references except Tailwind CDN
- Compatible with modern browsers
- All functionality must work in a secure context`
      },
      {
        role: 'user',
        content: `Workflow Analysis:
${workflowDescription}

Generate a complete project structure that implements this entire workflow. The project should:
1. Have proper file separation (HTML, CSS, JS)
2. Use modern JavaScript modules with proper import/export syntax
3. Implement all workflow logic with localStorage persistence (no remote APIs)
4. Be responsive, accessible, and user-friendly with a minimalist, neutral design and a single indigo accent; avoid gradients, heavy shadows, and excessive rounding
5. Avoid using alert(), confirm(), prompt(), or browser chat/window-style UIs; use inline validation and in-app non-blocking banners or modals
6. Include empty/loading/error states and clear inline validation for inputs
7. Provide offline support with a service worker and a minimal manifest.json
8. Prefer semantic HTML5 landmarks and aria attributes; ensure keyboard navigation works

CRITICAL MODULE SETUP EXAMPLE:
HTML should include: <script type="module" src="app.js"></script>
JavaScript files should use: 
- export { functionName, className } from './utils.js';
- import { functionName } from './utils.js';

CRITICAL: Return only a JSON object with the file structure. No explanations or markdown.`
      }
    ];

    if (historySummary || diffSummary) {
      const last = messages[messages.length - 1];
      const extras = `${historySummary ? `\nLAST 5 GENERATIONS REQUESTS:\n${historySummary}` : ''}${diffSummary ? `\nDIFF SINCE LAST GENERATION: ${diffSummary}` : ''}`;
      messages[messages.length - 1] = { ...last, content: `${last.content}${extras}` };
    }

    return this.generateContent(messages);
  }

  private createWorkflowDescription(
    inputNodes: Array<{ data: { label: string; description?: string } }>,
    actionNodes: Array<{ data: { label: string; description?: string } }>,
    showNodes: Array<{ data: { label: string; description?: string } }>
  ): string {
    let description = "Workflow Components:\n\n";
    
    if (inputNodes.length > 0) {
      description += "INPUT NODES:\n";
      inputNodes.forEach((node, index) => {
        description += `${index + 1}. ${node.data.label}: ${node.data.description}\n`;
      });
      description += "\n";
    }

    if (actionNodes.length > 0) {
      description += "ACTION NODES:\n";
      actionNodes.forEach((node, index) => {
        description += `${index + 1}. ${node.data.label}: ${node.data.description}\n`;
      });
      description += "\n";
    }

    if (showNodes.length > 0) {
      description += "DISPLAY NODES:\n";
      showNodes.forEach((node, index) => {
        description += `${index + 1}. ${node.data.label}: ${node.data.description}\n`;
      });
      description += "\n";
    }

    description += "WORKFLOW LOGIC:\n";
    description += "The application should connect these components in a logical flow:\n";
    description += "1. Collect input from users\n";
    description += "2. Process the input according to the defined actions\n";
    description += "3. Display the results to users\n";
    description += "4. Maintain state and persistence as needed\n";

    return description;
  }
}

export const aiService = new AIService();
