# MuxFlow

**Build AI-Powered Micro Apps with Visual Workflows**

MuxFlow is an open-source workflow builder for creating AI-powered micro applications, inspired by Google Opal. Connect prompts, AI models, and tools to create powerful, interactive workflows that can be deployed as standalone applications.

## ✨ Features

- **Visual Workflow Editor**: Intuitive drag-and-drop interface similar to n8n
- **AI-First Design**: Integrated AI nodes for prompts, transformations, and processing
- **Live Preview**: Real-time preview of your micro apps as you build
- **Component Library**: AI-generated UI components that adapt to your needs
- **Modern Stack**: Built with Next.js, TypeScript, and Tailwind CSS
- **React Flow Engine**: Robust workflow visualization and management

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/user/muxflow.git
cd muxflow

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Usage Guide

### Basic Workflow Creation

1. **Left Panel**: Toolbar containing different node types
2. **Main Canvas**: Area where you build your workflow
3. **Right Panel**: Workflow preview and code view

### Node Types

- **Input Node**: AI-designed form components (text, select, checkbox, etc.) - Data stored in localStorage
- **Show/Display Node**: Content display pages - AI generates page layout based on prompts
- **Action Node**: Processing node - Functions, calculations, client-side API requests

### Adding Nodes

You can add nodes in two ways:
1. Click on a node in the left panel
2. Drag and drop a node from the panel to the canvas

### AI Agent System

After creating your workflow in MuxFlow:

1. **Required Description**: Enter a descriptive explanation for each node
2. **AI Analysis**: Artificial intelligence analyzes your workflow and creates a todo list
3. **Sequential Execution**: AI executes tasks in sequence
4. **Browser-Only**: Uses only client-side technologies (HTML, CSS, JS)
5. **Static Export**: Produces deployable static files as output

### AI Integration (OpenRouter)

MuxFlow uses the Google Gemini Flash 1.5 model via OpenRouter API:

1. **API Configuration**: Set your OpenRouter token in the `.env.local` file
2. **Node Generation**: Optimized AI prompts for each node type
3. **Code Generation**: HTML, CSS, JavaScript code generation
4. **Error Handling**: Catch API errors and notify users
5. **Export System**: Combine all generated code into a single HTML file

#### Setup
```bash
# Create .env.local file
NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-token-here
NEXT_PUBLIC_DEFAULT_MODEL=google/gemini-flash-1.5
```

### Limitations and Focus

- ❌ Server-side operations (databases, backend APIs)
- ❌ Complex authentication systems
- ✅ Data storage with localStorage
- ✅ Client-side API requests
- ✅ SPA (Single Page Application) approach
- ✅ Static files for quick deployment

## 🎯 Inspired by Google Opal

- ✅ Visual workflow creation
- ✅ AI-powered processing steps
- ✅ No-code approach
- ✅ Real-time preview
- ✅ Shareable workflows

## 🛠 Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Workflow Engine**: React Flow
- **Icons**: Lucide React
- **UI Components**: Custom React components

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page
│   └── layout.tsx        # Root layout
├── components/
│   ├── WorkflowEditor.tsx    # Main workflow editor
│   ├── PreviewPanel.tsx      # Preview panel
│   ├── NodeToolbar.tsx       # Node toolbar
│   └── nodes/
│       └── CustomNode.tsx    # Custom node component
└── ...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Google Opal Blog Post](https://developers.googleblog.com/en/introducing-opal/)
- [React Flow Documentation](https://reactflow.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

---

**MuxFlow** - Visualize and automate your AI workflows!
