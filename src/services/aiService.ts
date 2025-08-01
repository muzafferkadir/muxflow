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
          'X-Title': 'MuxFlow AI Workflow Builder'
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

  // Generate HTML form based on description
  async generateInputForm(description: string, prompt: string): Promise<AIResponse> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert frontend developer. Generate clean, modern HTML form components based on user requirements. 
        
Rules:
- Use Tailwind CSS classes for styling
- Include proper input validation
- Use semantic HTML
- Add localStorage integration to save form data
- Return only the HTML code, no explanations
- Make it responsive and accessible
- Use modern form patterns

The form should be a complete, ready-to-use HTML component.`
      },
      {
        role: 'user',
        content: `Description: ${description}

Detailed Prompt: ${prompt}

Generate a beautiful, functional HTML form component.`
      }
    ];

    return this.generateContent(messages);
  }

  // Generate display page based on description
  async generateDisplayPage(description: string, prompt: string): Promise<AIResponse> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert frontend developer. Generate clean, modern HTML page layouts based on user requirements.

Rules:
- Use Tailwind CSS classes for styling
- Create responsive, beautiful layouts
- Include proper data display components
- Use localStorage to read and display data
- Return only the HTML code, no explanations
- Make it accessible and user-friendly
- Use modern design patterns

The page should be a complete, ready-to-use HTML component.`
      },
      {
        role: 'user',
        content: `Description: ${description}

Detailed Prompt: ${prompt}

Generate a beautiful, functional HTML display page component.`
      }
    ];

    return this.generateContent(messages);
  }

  // Generate JavaScript function based on description
  async generateActionFunction(description: string, prompt: string): Promise<AIResponse> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `You are an expert JavaScript developer. Generate clean, efficient JavaScript functions based on user requirements.

Rules:
- Write modern ES6+ JavaScript
- Include proper error handling
- Use localStorage for data persistence when needed
- Add input validation
- Return only the JavaScript code, no explanations
- Make functions reusable and well-structured
- Include comments for complex logic
- Handle async operations properly

The function should be complete and ready to use.`
      },
      {
        role: 'user',
        content: `Description: ${description}

Detailed Prompt: ${prompt}

Generate a functional JavaScript code block.`
      }
    ];

    return this.generateContent(messages);
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
