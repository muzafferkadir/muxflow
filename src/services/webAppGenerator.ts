export interface ProjectFile {
  name: string;
  content: string;
}

export class WebAppGeneratorService {
  async generateFromWorkflow(nodes: any[], edges: any[]): Promise<{
    success: boolean;
    htmlContent?: string;
    projectFiles?: ProjectFile[];
    error?: string;
  }> {
    try {
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
      let projectData;
      const cleanedResponse = content.trim();
      
      try {
        projectData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            projectData = JSON.parse(jsonMatch[0]);
          } catch {
            return {
              success: false,
              error: 'Failed to parse project structure response'
            };
          }
        } else {
          return {
            success: false,
            error: 'Invalid project structure response format'
          };
        }
      }

      if (!projectData.files || !Array.isArray(projectData.files)) {
        return {
          success: false,
          error: 'Invalid project structure: missing files array'
        };
      }

      return {
        success: true,
        files: projectData.files
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