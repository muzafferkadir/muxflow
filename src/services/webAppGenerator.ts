import { WebContainer } from '@webcontainer/api';
import { fallbackPreview } from './fallbackPreview';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface WebAppProject {
  files: GeneratedFile[];
  entryPoint: string;
  framework: 'react' | 'vanilla' | 'vue' | 'html';
  dependencies: Record<string, string>;
}

class WebAppGeneratorService {
  private webcontainer: WebContainer | null = null;
  private isInitializing = false;
  private fallbackUrls: string[] = [];

  async initializeWebContainer(): Promise<WebContainer> {
    if (this.webcontainer) {
      return this.webcontainer;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.webcontainer) {
        return this.webcontainer;
      }
    }

    this.isInitializing = true;
    try {
      // Check if WebContainer is supported
      if (typeof window === 'undefined') {
        throw new Error('WebContainer is only supported in browser environment');
      }

      // Check for required features
      if (!window.isSecureContext) {
        throw new Error('WebContainer requires a secure context (HTTPS)');
      }

      this.webcontainer = await WebContainer.boot();
      return this.webcontainer;
    } catch (error) {
      console.error('Failed to initialize WebContainer:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async generateWebAppFromNodes(nodes: any[]): Promise<WebAppProject> {
    // Analyze nodes to determine the type of web app
    const appType = this.determineAppType(nodes);
    
    switch (appType) {
      case 'react':
        return this.generateReactApp(nodes);
      case 'vanilla':
        return this.generateVanillaApp(nodes);
      case 'html':
        return this.generateHTMLApp(nodes);
      default:
        return this.generateDefaultApp(nodes);
    }
  }

  private determineAppType(nodes: any[]): 'react' | 'vanilla' | 'vue' | 'html' {
    const nodeTypes = nodes.map(n => n.data.nodeType?.toLowerCase() || '');
    const nodeLabels = nodes.map(n => n.data.label?.toLowerCase() || '');
    const allText = [...nodeTypes, ...nodeLabels].join(' ');

    if (allText.includes('react') || allText.includes('component')) {
      return 'react';
    }
    if (allText.includes('vue')) {
      return 'vue';
    }
    if (allText.includes('html') || allText.includes('webpage')) {
      return 'html';
    }
    return 'vanilla';
  }

  private generateReactApp(nodes: any[]): WebAppProject {
    const components = nodes
      .filter(n => n.data.generatedCode)
      .map((node, index) => {
        const componentName = this.sanitizeComponentName(node.data.label) || `Component${index + 1}`;
        return {
          name: componentName,
          code: node.data.generatedCode,
          description: node.data.description
        };
      });

    const mainComponent = this.generateMainReactComponent(components);
    
    return {
      files: [
        {
          path: 'package.json',
          content: JSON.stringify({
            name: 'generated-web-app',
            version: '1.0.0',
            dependencies: {
              'react': '^18.0.0',
              'react-dom': '^18.0.0'
            },
            devDependencies: {
              '@vitejs/plugin-react': '^4.0.0',
              'vite': '^4.0.0'
            },
            scripts: {
              'dev': 'vite',
              'build': 'vite build',
              'preview': 'vite preview'
            }
          }, null, 2)
        },
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Web App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
        },
        {
          path: 'vite.config.js',
          content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`
        },
        {
          path: 'src/main.jsx',
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        },
        {
          path: 'src/App.jsx',
          content: mainComponent
        },
        {
          path: 'src/index.css',
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.component {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.component h2 {
  margin-top: 0;
  color: #333;
}

.button {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.button:hover {
  background: #0056b3;
}`
        },
        ...components.map(comp => ({
          path: `src/components/${comp.name}.jsx`,
          content: this.wrapReactComponent(comp.name, comp.code, comp.description)
        }))
      ],
      entryPoint: 'src/main.jsx',
      framework: 'react',
      dependencies: {
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        'vite': '^4.0.0'
      }
    };
  }

  private generateVanillaApp(nodes: any[]): WebAppProject {
    const jsCode = nodes
      .filter(n => n.data.generatedCode)
      .map(n => n.data.generatedCode)
      .join('\n\n');

    return {
      files: [
        {
          path: 'package.json',
          content: JSON.stringify({
            name: 'generated-vanilla-app',
            version: '1.0.0',
            scripts: {
              'dev': 'vite',
              'build': 'vite build',
              'preview': 'vite preview'
            },
            devDependencies: {
              'vite': '^4.0.0'
            }
          }, null, 2)
        },
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Web App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <h1>Generated Web Application</h1>
    <div id="content"></div>
  </div>
  <script src="main.js"></script>
</body>
</html>`
        },
        {
          path: 'main.js',
          content: jsCode || `// Generated JavaScript code
console.log('Web app is running!');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  const content = document.getElementById('content');
  content.innerHTML = '<p>Your web app has been generated successfully!</p>';
});`
        },
        {
          path: 'style.css',
          content: `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

#app {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

#content {
  margin-top: 30px;
}`
        },
        {
          path: 'vite.config.js',
          content: `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000
  }
})`
        }
      ],
      entryPoint: 'index.html',
      framework: 'vanilla',
      dependencies: {
        'vite': '^4.0.0'
      }
    };
  }

  private generateHTMLApp(nodes: any[]): WebAppProject {
    const htmlContent = nodes
      .filter(n => n.data.generatedCode)
      .map(n => n.data.generatedCode)
      .join('\n');

    return {
      files: [
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Web App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Generated Web Application</h1>
    ${htmlContent || '<p>Your web app has been generated successfully!</p>'}
  </div>
</body>
</html>`
        }
      ],
      entryPoint: 'index.html',
      framework: 'html',
      dependencies: {}
    };
  }

  private generateDefaultApp(nodes: any[]): WebAppProject {
    return this.generateVanillaApp(nodes);
  }

  private generateMainReactComponent(components: any[]): string {
    const imports = components.map(comp => 
      `import ${comp.name} from './components/${comp.name}.jsx';`
    ).join('\n');

    const componentRenders = components.map(comp => 
      `      <${comp.name} />`
    ).join('\n');

    return `import React from 'react';
${imports}

function App() {
  return (
    <div className="container">
      <h1>Generated Web Application</h1>
${componentRenders}
    </div>
  );
}

export default App;`;
  }

  private wrapReactComponent(name: string, code: string, description?: string): string {
    // Try to extract a React component from the generated code
    if (code.includes('function') || code.includes('const') || code.includes('class')) {
      return code;
    }

    // If it's not a proper component, wrap it
    return `import React from 'react';

function ${name}() {
  return (
    <div className="component">
      <h2>${name}</h2>
      ${description ? `<p>{/* ${description} */}</p>` : ''}
      <div>
        {/* Generated code: */}
        ${code}
      </div>
    </div>
  );
}

export default ${name};`;
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'Component$&')
      || 'GeneratedComponent';
  }

  async deployToWebContainer(project: WebAppProject): Promise<string> {
    try {
      const webcontainer = await this.initializeWebContainer();
      
      // Create file system structure
      const files: Record<string, any> = {};
      
      project.files.forEach(file => {
        const pathParts = file.path.split('/');
        let current = files;
        
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = { directory: {} };
          }
          current = current[part].directory;
        }
        
        const fileName = pathParts[pathParts.length - 1];
        current[fileName] = {
          file: {
            contents: file.content
          }
        };
      });

      // Mount the file system
      await webcontainer.mount(files);

      // Install dependencies if needed
      if (Object.keys(project.dependencies).length > 0) {
        const installProcess = await webcontainer.spawn('npm', ['install']);
        const exitCode = await installProcess.exit;
        if (exitCode !== 0) {
          console.warn('npm install completed with warnings');
        }
      }

      // Start the development server
      let serverUrl: string | null = null;
      
      // Listen for server ready event
      webcontainer.on('server-ready', (port, url) => {
        console.log(`Server ready at ${url}`);
        serverUrl = url;
      });

      // Start dev server
      const devProcess = await webcontainer.spawn('npm', ['run', 'dev']);

      // Wait for server to be ready or timeout after 30 seconds
      const timeout = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('Server start timeout')), 30000);
      });

      const serverReady = new Promise<string>((resolve) => {
        webcontainer.on('server-ready', (port, url) => {
          resolve(url);
        });
      });

      return await Promise.race([serverReady, timeout]);
      
    } catch (error) {
      console.error('Error deploying to WebContainer:', error);
      throw error;
    }
  }

  async generateWebAppWithFallback(nodes: any[]): Promise<string> {
    try {
      // Try WebContainer first
      const project = await this.generateWebAppFromNodes(nodes);
      return await this.deployToWebContainer(project);
    } catch (error) {
      console.warn('WebContainer failed, using fallback preview:', error);
      
      // Use fallback static preview
      const htmlContent = fallbackPreview.generateStaticPreview(nodes);
      const fallbackUrl = fallbackPreview.createBlobUrl(htmlContent);
      
      // Store for cleanup
      this.fallbackUrls.push(fallbackUrl);
      
      return fallbackUrl;
    }
  }

  async cleanup(): Promise<void> {
    if (this.webcontainer) {
      // WebContainer cleanup is handled automatically
      this.webcontainer = null;
    }
    
    // Clean up fallback URLs
    this.fallbackUrls.forEach(url => {
      fallbackPreview.revokeBlobUrl(url);
    });
    this.fallbackUrls = [];
  }
}

export const webAppGenerator = new WebAppGeneratorService();
