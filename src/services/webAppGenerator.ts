// Modern Web App Generator Service - AI-Powered
// Generates both HTML and project files simultaneously

export interface ProjectFile {
  name: string;
  content: string;
}

export class WebAppGeneratorService {
  // Single method - generates both HTML and project files
  async generateFromWorkflow(nodes: any[], edges: any[]): Promise<{
    success: boolean;
    htmlContent?: string;
    projectFiles?: ProjectFile[];
    error?: string;
  }> {
    try {
      // Use AI service to generate both formats simultaneously
      const { aiService } = await import('./aiService');
      
      // Generate single HTML app
      const htmlResponse = await aiService.generateIntegratedWebApp(nodes);
      
      // Generate project structure 
      const projectResponse = await aiService.generateProjectStructure(nodes);
      
      // Check for errors
      if (htmlResponse.error && projectResponse.error) {
        return {
          success: false,
          error: `HTML Generation: ${htmlResponse.error}; Project Generation: ${projectResponse.error}`
        };
      }

      let htmlContent = undefined;
      let projectFiles = undefined;

      // Process HTML if successful
      if (!htmlResponse.error && htmlResponse.content) {
        htmlContent = this.parseHtmlFromResponse(htmlResponse.content);
      }

      // Process project files if successful  
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

  private parseHtmlFromResponse(content: string): string {
    // Remove markdown code blocks and any wrapper formatting
    let cleaned = content
      // Remove ```html and ``` blocks
      .replace(/```html\s*/gi, '')
      .replace(/```\s*$/g, '')
      // Remove any other markdown code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Remove common AI response prefixes
      .replace(/^Here's.*?:/i, '')
      .replace(/^The.*?application.*?:/i, '')
      .replace(/^I'll.*?:/i, '')
      // Remove leading/trailing whitespace
      .trim();
    
    // Find HTML content if it's buried in text
    const htmlMatch = cleaned.match(/<!DOCTYPE[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      cleaned = htmlMatch[0];
    } else {
      // Look for just <html> tag
      const htmlTagMatch = cleaned.match(/<html[\s\S]*?<\/html>/i);
      if (htmlTagMatch) {
        cleaned = '<!DOCTYPE html>\n' + htmlTagMatch[0];
      }
    }
    
    // If it still doesn't look like proper HTML, wrap it
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
      // Parse the JSON response
      let projectData;
      const cleanedResponse = content.trim();
      
      try {
        projectData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
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