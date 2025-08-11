import type { ProjectFile } from '@/types';

import type { WorkflowNodeLike, WorkflowEdgeLike } from '@/types/workflow';

export class WebAppGeneratorService {
  async generateFromWorkflow(nodes: WorkflowNodeLike[], _edges: WorkflowEdgeLike[]): Promise<{
    success: boolean;
    htmlContent?: string;
    projectFiles?: ProjectFile[];
    error?: string;
  }> {
    try {
      void _edges;
      const { aiService } = await import('./aiService');
      const htmlResponse = await aiService.generateIntegratedWebApp(nodes);
      const projectResponse = await aiService.generateProjectStructure(nodes);
      
      if (htmlResponse.error && projectResponse.error) {
        return {
          success: false,
          error: `HTML Generation: ${htmlResponse.error}; Project Generation: ${projectResponse.error}`
        };
      }

      let htmlContent = undefined;
      let projectFiles = undefined;

      if (!htmlResponse.error && htmlResponse.content) {
        htmlContent = this.parseHtmlFromResponse(htmlResponse.content);
      }

      if (!projectResponse.error && projectResponse.content) {
        const parsedProject = this.parseProjectFromResponse(projectResponse.content);
        if (parsedProject.success) {
          projectFiles = parsedProject.files;
        }
      }

      return {
        success: true,
        htmlContent,
        projectFiles
      };
    } catch (error) {
      console.error('Error generating app:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate app'
      };
    }
  }

// Remove markdown code blocks and any wrapper formatting
  private parseHtmlFromResponse(content: string): string {
    let cleaned = content
      .replace(/```html\s*/gi, '')
      .replace(/```\s*$/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^Here's.*?:/i, '')
      .replace(/^The.*?application.*?:/i, '')
      .replace(/^I'll.*?:/i, '')
      .trim();
    
    const htmlMatch = cleaned.match(/<!DOCTYPE[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      cleaned = htmlMatch[0];
    } else {
      const htmlTagMatch = cleaned.match(/<html[\s\S]*?<\/html>/i);
      if (htmlTagMatch) {
        cleaned = '<!DOCTYPE html>\n' + htmlTagMatch[0];
      }
    }
    
    if (!cleaned.toLowerCase().includes('<!doctype') && !cleaned.toLowerCase().includes('<html')) {
      cleaned = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${cleaned}
</body>
</html>`;
    }
    
    return cleaned;
  }

  private parseProjectFromResponse(content: string): {
    success: boolean;
    files?: ProjectFile[];
    error?: string;
  } {
    try {
      const cleanedResponse = content.trim();
      let projectData: unknown;

      const tryParse = (text: string) => {
        try { return JSON.parse(text); } catch { return undefined; }
      };

      projectData = tryParse(cleanedResponse);

      if (!projectData) {
        // Attempt to extract the shortest valid JSON object using bracket counting
        const start = cleanedResponse.indexOf('{');
        const end = cleanedResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const slice = cleanedResponse.slice(start, end + 1);
          // Balance braces progressively to avoid greedy over-capture issues
          let depth = 0;
          let finalEnd = -1;
          for (let i = 0; i < slice.length; i++) {
            const ch = slice[i];
            if (ch === '{') depth++;
            else if (ch === '}') {
              depth--;
              if (depth === 0) { finalEnd = i; break; }
            }
          }
          if (finalEnd !== -1) {
            projectData = tryParse(slice.slice(0, finalEnd + 1));
          }
        }
      }

      if (!projectData || typeof projectData !== 'object' || projectData === null) {
        return { success: false, error: 'Invalid project structure response format' };
      }

      const files = (projectData as { files?: ProjectFile[] }).files;
      if (!files || !Array.isArray(files)) {
        return {
          success: false,
          error: 'Invalid project structure: missing files array'
        };
      }

      return {
        success: true,
        files
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse project response'
      };
    }
  }
}

export const webAppGenerator = new WebAppGeneratorService();