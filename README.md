# MuxFlow

**Build AI-Powered Mini Apps with Visual Workflows**

MuxFlow is an open-source workflow builder for creating AI-powered mini applications. Connect prompts, AI models, and tools to create powerful, interactive workflows that can be deployed as standalone applications.

## ✨ Features

- **Visual Workflow Editor**: Intuitive drag-and-drop interface built with React Flow
- **AI-First Design**: AI-powered app generation from workflow descriptions
- **Live Preview**: Real-time preview of your generated applications
- **Complete App Generation**: Single HTML files or multi-file project structures
- **Modern Stack**: Built with Next.js, TypeScript, and Tailwind CSS
- **OpenRouter Integration**: Seamless AI model integration

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/muzafferkadir/muxflow.git
cd muxflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenRouter API key to .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## � Environment Setup

Create a `.env.local` file with your OpenRouter API key:

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_DEFAULT_MODEL=google/gemini-flash-1.5
```

## �📋 Usage Guide

### Basic Workflow Creation

1. **Workflow Tab**: Build your workflow using the visual editor
2. **Preview Tab**: See your generated application in real-time
3. **Files Tab**: Download complete project structures

### Node Types

- **Input Node**: AI-designed form components (text, select, checkbox, etc.)
- **Show/Display Node**: Content display pages designed by AI
- **Action Node**: Processing functions, calculations, client-side operations

### Workflow to App Process

1. **Design Workflow**: Add nodes and connect them in logical order
2. **Add Descriptions**: Describe what each node should do
3. **Generate App**: Single button creates both HTML preview and project files
4. **Preview & Export**: Test in preview tab, download files from files tab

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
