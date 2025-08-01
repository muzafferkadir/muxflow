// AI service for OpenRouter integration
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  error?: string;
}

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';
    this.defaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'google/gemini-flash-1.5';
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found. Please set NEXT_PUBLIC_OPENROUTER_API_KEY');
    }
  }

  async generateContent(messages: AIMessage[], model?: string): Promise<AIResponse> {
    if (!this.apiKey) {
      return { content: '', error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://muxflow.dev',
          'X-Title': 'MuxFlow Workflow App Builder'
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from AI service');
      }

      return {
        content: data.choices[0].message.content
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Analyze workflow and generate integrated web application
  async generateIntegratedWebApp(nodes: any[]): Promise<AIResponse> {
    const inputNodes = nodes.filter(n => n.data.nodeType === 'input');
    const actionNodes = nodes.filter(n => n.data.nodeType === 'action');
    const showNodes = nodes.filter(n => n.data.nodeType === 'show');

    const workflowDescription = this.createWorkflowDescription(inputNodes, actionNodes, showNodes);

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert full-stack developer specializing in creating complete static web applications.

Your task is to analyze a workflow and generate a single, complete, functional web application that implements the entire workflow logic.

CRITICAL TECHNICAL REQUIREMENTS:
- Generate a STATIC web application using only HTML, CSS, and vanilla JavaScript
- NO external URLs, NO blob URLs, NO file:// protocols
- ALL resources must be inline or from trusted CDNs (Tailwind CSS)
- Use only localStorage for data persistence (NO databases, NO backend)
- Use vanilla JavaScript ES6+ (NO React, NO frameworks)
- Make it work offline once loaded
- All interactions must be client-side only

CRITICAL OUTPUT RULES:
- Return ONLY raw HTML code, no markdown code blocks
- Do NOT wrap your response in \`\`\`html or \`\`\` tags
- Do NOT include any explanations or comments outside the HTML
- Start directly with <!DOCTYPE html>
- Generate ONE complete HTML file with embedded CSS and JavaScript
- Use Tailwind CSS via CDN for styling
- Include proper form validation and error handling
- Include workflow progress indicators
- Make it responsive and modern
- The app should work as a complete single-page application

SECURITY & COMPATIBILITY:
- Use data URLs for any images if needed (or use emoji/icons)
- No external file references
- No blob URLs or local resources
- Compatible with iframe sandbox restrictions
- All functionality must work in a secure context

Think of this like a complete static website generator - create a fully functional, self-contained application.`
      },
      {
        role: 'user',
        content: `Workflow Analysis:
${workflowDescription}

Generate a complete, static web application that implements this entire workflow. The app should:
1. Handle all input collection with proper validation
2. Process the data according to the workflow logic using vanilla JavaScript
3. Display results with modern UI components
4. Show workflow progress/status indicators
5. Store ALL data in localStorage (no external storage)
6. Be responsive and user-friendly
7. Work completely offline
8. Be compatible with iframe sandbox restrictions

CRITICAL: Return only the raw HTML code with inline CSS and JavaScript. No external file references except Tailwind CDN.`
      }
    ];

    return this.generateContent(messages);
  }

  // Generate complete project structure with multiple files
  async generateProjectStructure(nodes: any[]): Promise<AIResponse> {
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
- index.html (main HTML file)
- styles.css (custom styles if needed, minimal since using Tailwind)
- app.js (main application logic)
- components.js (reusable UI components if needed)
- utils.js (utility functions if needed)

CRITICAL OUTPUT FORMAT:
- Return ONLY a JSON object with file structure
- Do NOT include markdown code blocks or explanations
- JSON format: {"files": [{"name": "filename.ext", "content": "file content"}]}
- Each file content should be complete and functional
- HTML should include Tailwind CDN
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
2. Use modern JavaScript modules and classes where appropriate
3. Implement all workflow logic with localStorage persistence
4. Be responsive and user-friendly
5. Include proper error handling and validation
6. Work as a complete static web application

CRITICAL: Return only a JSON object with the file structure. No explanations or markdown.`
      }
    ];

    return this.generateContent(messages);
  }

  private createWorkflowDescription(inputNodes: any[], actionNodes: any[], showNodes: any[]): string {
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

    // Add workflow logic inference
    description += "WORKFLOW LOGIC:\n";
    description += "The application should connect these components in a logical flow:\n";
    description += "1. Collect input from users\n";
    description += "2. Process the input according to the defined actions\n";
    description += "3. Display the results to users\n";
    description += "4. Maintain state and persistence as needed\n";

    return description;
  }

  // Analyze workflow and create todo list
  async analyzeWorkflow(nodes: any[], edges: any[]): Promise<AIResponse> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are a workflow analysis expert. Analyze the given workflow and create a prioritized todo list for implementation.

Rules:
- Focus only on client-side, browser-compatible solutions
- Ignore any server-side requirements (databases, backend APIs)
- Prioritize tasks based on dependency order
- Each task should be specific and actionable
- Consider data flow between nodes
- Suggest localStorage for data persistence
- Return a numbered list of tasks

Format your response as a simple numbered list of tasks.`
      },
      {
        role: 'user',
        content: `Analyze this workflow:

Nodes: ${JSON.stringify(nodes, null, 2)}

Edges (connections): ${JSON.stringify(edges, null, 2)}

Create a todo list for implementing this workflow as a browser-based SPA.`
      }
    ];

    return this.generateContent(messages);
  }
}

// Export singleton instance
export const aiService = new AIService();
