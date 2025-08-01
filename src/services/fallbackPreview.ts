export class FallbackPreviewService {
  generateStaticPreview(nodes: any[]): string {
    const timestamp = Date.now();
    const nodesWithCode = nodes.filter(n => n.data.generatedCode);
    
    if (nodesWithCode.length === 0) {
      return this.generateEmptyPreview();
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MuxFlow Generated App</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 2.5em;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            color: #666;
            margin: 10px 0 0 0;
            font-size: 1.1em;
        }
        .node-section {
            margin: 30px 0;
            padding: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            background: #fafafa;
            transition: all 0.3s ease;
        }
        .node-section:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .node-title {
            font-weight: 600;
            margin-bottom: 15px;
            padding: 12px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            font-size: 1.1em;
        }
        .node-description {
            color: #666;
            margin-bottom: 15px;
            font-style: italic;
            padding: 0 16px;
        }
        .node-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            font-family: 'Monaco', 'Consolas', monospace;
            line-height: 1.6;
        }
        .generated-info {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            color: #666;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #4CAF50;
            color: white;
            border-radius: 20px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .preview-controls {
            text-align: center;
            margin: 30px 0;
        }
        .refresh-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        .refresh-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        #react-content {
            margin: 20px 0;
            padding: 20px;
            border: 2px dashed #ddd;
            border-radius: 8px;
            min-height: 100px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Generated Web App</h1>
            <p class="subtitle">Created by MuxFlow • ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="preview-controls">
            <button class="refresh-btn" onclick="window.location.reload()">
                🔄 Refresh Preview
            </button>
        </div>

        <div id="react-content">
            <div style="text-align: center; color: #666;">
                Loading React components...
            </div>
        </div>
        
        ${nodesWithCode.map((node, index) => `
        <div class="node-section">
            <div class="node-title">
                ${node.data.label || `Component ${index + 1}`}
                <span class="status-badge">Generated</span>
            </div>
            ${node.data.description ? `<div class="node-description">${node.data.description}</div>` : ''}
            <div class="node-content">
                <div id="node-${node.id}"></div>
                <script type="text/babel">
                    try {
                        ${this.wrapCodeForExecution(node.data.generatedCode, node.id)}
                    } catch (error) {
                        document.getElementById('node-${node.id}').innerHTML = 
                            '<div style="color: red; padding: 10px; background: #ffe6e6; border-radius: 4px;">' +
                            '<strong>Error:</strong> ' + error.message + 
                            '</div>';
                    }
                </script>
            </div>
        </div>
        `).join('')}
        
        <div class="generated-info">
            <p><strong>Generated:</strong> ${nodesWithCode.length} components from ${nodes.length} nodes</p>
            <p><small>This is a live preview of your generated application. Components are rendered using React.</small></p>
        </div>

        <script type="text/babel">
            // Main React App
            function GeneratedApp() {
                const [count, setCount] = React.useState(0);
                
                return React.createElement('div', {
                    style: { 
                        padding: '20px', 
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: '8px',
                        margin: '20px 0'
                    }
                }, [
                    React.createElement('h2', { key: 'title' }, 'Interactive Demo'),
                    React.createElement('p', { key: 'desc' }, 'This is your generated web application running live!'),
                    React.createElement('button', {
                        key: 'btn',
                        style: {
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        },
                        onClick: () => setCount(count + 1)
                    }, \`Clicked \${count} times\`)
                ]);
            }

            // Render the main app
            const rootElement = document.getElementById('react-content');
            const root = ReactDOM.createRoot(rootElement);
            root.render(React.createElement(GeneratedApp));
        </script>
    </div>
</body>
</html>`;

    return htmlContent;
  }

  private wrapCodeForExecution(code: string, nodeId: string): string {
    // Try to determine if it's React code
    if (code.includes('React') || code.includes('jsx') || code.includes('<') && code.includes('>')) {
      return `
        // React component code
        try {
          ${code}
        } catch (e) {
          document.getElementById('node-${nodeId}').innerHTML = 
            '<pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; white-space: pre-wrap;">' + 
            \`${code.replace(/`/g, '\\`')}\` + '</pre>';
        }
      `;
    } else {
      // Regular JavaScript or HTML
      return `
        const targetElement = document.getElementById('node-${nodeId}');
        try {
          // Try to execute as JavaScript
          const result = (function() {
            ${code}
          })();
          
          if (result !== undefined) {
            targetElement.innerHTML = '<div><strong>Result:</strong> ' + result + '</div>';
          } else {
            targetElement.innerHTML = '<pre style="background: #f0f0f0; padding: 10px; border-radius: 4px; white-space: pre-wrap;">' + \`${code.replace(/`/g, '\\`')}\` + '</pre>';
          }
        } catch (e) {
          // If JavaScript fails, treat as HTML
          targetElement.innerHTML = \`${code.replace(/`/g, '\\`')}\`;
        }
      `;
    }
  }

  private generateEmptyPreview(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MuxFlow - No Content</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 60px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        p {
            color: #666;
            font-size: 1.2em;
            line-height: 1.6;
        }
        .icon {
            font-size: 4em;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🎯</div>
        <h1>Ready to Generate</h1>
        <p>Create nodes in your workflow and generate code to see your web application preview here.</p>
    </div>
</body>
</html>`;
  }

  createBlobUrl(htmlContent: string): string {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }

  revokeBlobUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const fallbackPreview = new FallbackPreviewService();
