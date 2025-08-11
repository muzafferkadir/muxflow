// AI service for OpenRouter integration
import type { AIMessage, AIResponse } from '@/types';

export class AIService {
  private defaultModel: string;

  constructor() {
    this.defaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'google/gemini-2.5-flash-lite';
  }

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

  async generateProjectStructure(nodes: Array<{ data: { nodeType: string; label: string; description?: string } }>): Promise<AIResponse> {
    const inputNodes = nodes.filter(n => n.data.nodeType === 'input');
    const actionNodes = nodes.filter(n => n.data.nodeType === 'action');
    const showNodes = nodes.filter(n => n.data.nodeType === 'show');

    const workflowDescription = this.createWorkflowDescription(inputNodes, actionNodes, showNodes);

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert full-stack developer specializing in creating complete static web projects.

Your task is to analyze a workflow and generate a complete project structure with multiple files (HTML, CSS, JS) that implements the entire workflow logic.

CRITICAL TECHNICAL REQUIREMENTS:
- Generate a complete project with separate HTML, CSS, and JavaScript files
- Use modern vanilla JavaScript ES6+ (NO frameworks)
- Use Tailwind CSS for styling
- All data persistence through localStorage only
- Make it work offline once loaded
- No external dependencies except Tailwind CDN

PROJECT STRUCTURE REQUIREMENTS:
- index.html (main HTML file with proper ES6 module support)
- styles.css (custom styles if needed, minimal since using Tailwind)
- app.js (main application logic)
- components.js (reusable UI components if needed)
- utils.js (utility functions if needed)

CRITICAL MODULE REQUIREMENTS:
- HTML file MUST include <script type="module" src="app.js"></script> for main script
- ALL JavaScript files with imports/exports MUST be loaded with type="module"
- Use proper ES6 import/export syntax
- Ensure all module dependencies are correctly linked

CRITICAL OUTPUT FORMAT:
- Return ONLY a JSON object with file structure
- Do NOT include markdown code blocks or explanations
- JSON format: {"files": [{"name": "filename.ext", "content": "file content"}]}
- Each file content should be complete and functional
- HTML should include Tailwind CDN and proper module script tags
- All files should work together as a cohesive application

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
3. Implement all workflow logic with localStorage persistence
4. Be responsive and user-friendly
5. Include proper error handling and validation
6. Work as a complete static web application

CRITICAL MODULE SETUP EXAMPLE:
HTML should include: <script type="module" src="app.js"></script>
JavaScript files should use: 
- export { functionName, className } from './utils.js';
- import { functionName } from './utils.js';

CRITICAL: Return only a JSON object with the file structure. No explanations or markdown.`
      }
    ];

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
