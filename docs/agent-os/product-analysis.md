### MuxFlow — Product Analysis (Agent OS)

#### What it is
- Visual workflow builder that generates fully client-side mini web apps (HTML/CSS/JS) from node-based workflows.

#### Core user flows
- Build workflow with nodes and edges in UI (`React Flow`).
- Save/load workflow to `localStorage` (auto-save with debounce).
- Generate app via AI → returns either single HTML or multi-file project.
- Preview via in-memory store or S3; open in new tab; export as ZIP.

#### Architecture
- Framework: Next.js App Router (TypeScript, Tailwind)
- Client state: `WorkflowContext` manages nodes/edges, history, persistence
- AI pipeline:
  - Client calls `aiService.generateProjectStructure(messages)` → POST `/api/ai`
  - `/api/ai` proxies to OpenRouter (default model via env)
  - Response expected as strict JSON: `{ files: [{ name, content }] }`
  - `webAppGenerator` parses response; extracts `index.html` for preview
- Preview pipeline:
  - Client POSTs files to `/api/preview` → stored in memory map or uploaded to S3
  - Files read via `/api/preview/[id]/[...path]`
  - Service worker route at `/service-worker.js` (Edge), simple install/activate

#### Key modules and responsibilities
- `src/contexts/WorkflowContext.tsx`: primary app state, generation flow, history tracking, preview publishing, export
- `src/services/webAppGenerator.ts`: orchestrates AI call, diff summary, response parsing
- `src/services/aiService.ts`: builds messages and system prompt; calls `/api/ai`
- `src/app/api/ai/route.ts`: server-side OpenRouter proxy
- `src/app/api/preview/route.ts`: accepts uploads (memory or S3), returns public URL
- `src/app/api/preview/[id]/[...path]/route.ts`: serves stored preview files
- `src/app/service-worker.js/route.ts`: serves minimal SW script

#### Environment & configuration
- OpenRouter: `OPENROUTER_API_KEY` or `NEXT_PUBLIC_OPENROUTER_API_KEY`, model via `DEFAULT_MODEL` or `NEXT_PUBLIC_DEFAULT_MODEL`
- Optional S3/R2/MinIO for preview hosting: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET`, optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`, `S3_PUBLIC_BASE_URL`

#### Data persistence
- App data and workflows: `localStorage`
- Preview artifacts: in-memory store (dev) or S3 (prod)

#### Notable constraints
- Generated apps are static; no server-side features beyond preview hosting
- Strict JSON contract from AI; parser includes fallback slice/brace matching
- Service worker kept minimal; offline support primarily for generated apps

#### Risks / edge cases
- AI output not valid JSON → parser attempts recovery but can fail
- Missing `index.html` → code attempts to infer; may open wrong file as index
- Absolute paths in generated files → rewritten to relative for preview subpaths
- History dedupe via snapshot hash; changes outside node data not tracked

#### Agent OS integration notes (Cursor)
- Installed commands: `@plan-product`, `@analyze-product`, `@create-spec`, `@execute-tasks` in `.cursor/rules/`
- Use these during development to: plan features, create concise specs, generate edits, and analyze regressions.
- Recommended standards to customize in `~/.agent-os/standards/`:
  - tech-stack.md: Next.js App Router, React Flow, OpenRouter, optional S3
  - code-style.md: TypeScript conventions, React hooks, error handling, naming
  - best-practices.md: strict JSON responses, preview path rewriting, SW registration

#### Suggested next steps with Agent OS
- @create-spec: “Add Settings UI to configure OpenRouter model and key (with client-side storage).”
- @execute-tasks: Implement settings panel + validation + safe key handling UI.
- @create-spec: “Add S3 settings form and runtime checks in preview upload path.”
- @plan-product: Roadmap for improved AI retries and validation of JSON schema.

#### Quick operational checklist
- Ensure `.env.local` has OpenRouter key and default model
- For S3 previews, set S3 env vars and verify `S3_PUBLIC_BASE_URL`
- Test app generation on a sample workflow; verify preview and export
- Validate generated files include `app.js` as module and SW registration


