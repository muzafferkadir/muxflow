import type { ProjectFile } from '@/types';

import type { WorkflowNodeLike, WorkflowEdgeLike } from '@/types/workflow';
import type { GenerationHistoryItem } from '@/types/workflow';
import { diffAgainstHistory } from '@/services/workflowDiff';

export class WebAppGeneratorService {
  async generateFromWorkflow(nodes: WorkflowNodeLike[], _edges: WorkflowEdgeLike[], _history?: GenerationHistoryItem[]): Promise<{
    success: boolean;
    htmlContent?: string;
    projectFiles?: ProjectFile[];
    error?: string;
  }> {
    try {
      const { aiService } = await import('./aiService');
      const lastFive = _history && Array.isArray(_history) ? _history.slice(0, 5) : undefined;
      const latest = lastFive && lastFive.length > 0 ? lastFive[0] : undefined;
      const diff = diffAgainstHistory(nodes, _edges, latest);
      const diffSummary = diff ? diff.summary : '';
      const projectResponse = await aiService.generateProjectStructure(nodes as Array<{ data: { nodeType: string; label: string; description?: string } }>, lastFive, diffSummary);

      let htmlContent: string | undefined = undefined;
      let projectFiles: ProjectFile[] | undefined = undefined;

      if (!projectResponse.error && projectResponse.content) {
        const parsedProject = this.parseProjectFromResponse(projectResponse.content);
        if (parsedProject.success && parsedProject.files) {
          projectFiles = parsedProject.files;
          const index = parsedProject.files.find(f => f.name.toLowerCase() === 'index.html') || parsedProject.files.find(f => f.name.toLowerCase().endsWith('.html')) || parsedProject.files[0];
          if (index) htmlContent = index.content;
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
        const start = cleanedResponse.indexOf('{');
        const end = cleanedResponse.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          const slice = cleanedResponse.slice(start, end + 1);
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
        return { success: false, error: 'Invalid project structure: missing files array' };
      }

      return { success: true, files };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to parse project response' };
    }
  }
}

export const webAppGenerator = new WebAppGeneratorService();