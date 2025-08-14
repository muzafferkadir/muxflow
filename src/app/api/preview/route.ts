export const runtime = 'nodejs';

import type { StoredFile } from '@/types';

declare global {
  // eslint-disable-next-line no-var
  var __appletflow_preview_store: Map<string, Record<string, StoredFile>> | undefined;
}

function getStore() {
  if (!globalThis.__appletflow_preview_store) {
    globalThis.__appletflow_preview_store = new Map();
  }
  return globalThis.__appletflow_preview_store;
}

function guessContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.html')) return 'text/html; charset=utf-8';
  if (lower.endsWith('.css')) return 'text/css; charset=utf-8';
  if (lower.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (lower.endsWith('.json')) return 'application/json; charset=utf-8';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function isS3Enabled() {
  return Boolean(
    process.env.S3_BUCKET &&
    process.env.S3_REGION &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET
  );
}

function getS3ClientConfig(): {
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string };
  endpoint?: string;
  forcePathStyle?: boolean;
} {
  const region = process.env.S3_REGION as string;
  const accessKeyId = process.env.S3_ACCESS_KEY as string;
  const secretAccessKey = process.env.S3_SECRET as string;
  const endpoint = process.env.S3_ENDPOINT as string | undefined;
  const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE || 'true').toLowerCase() === 'true';
  const config: {
    region: string;
    credentials: { accessKeyId: string; secretAccessKey: string };
    endpoint?: string;
    forcePathStyle?: boolean;
  } = {
    region,
    credentials: { accessKeyId, secretAccessKey }
  };
  if (endpoint) {
    config.endpoint = endpoint;
  }
  if (forcePathStyle) {
    config.forcePathStyle = true;
  }
  return config;
}

function getPublicBaseUrl(): string | null {
  // Prefer explicit public base
  if (process.env.S3_PUBLIC_BASE_URL) {
    return process.env.S3_PUBLIC_BASE_URL.replace(/\/$/, '');
  }
  // Fallback: derive from endpoint and bucket (works for MinIO; for R2 prefer S3_PUBLIC_BASE_URL)
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  if (endpoint && bucket) {
    return `${endpoint.replace(/\/$/, '')}/${bucket}`;
  }
  return null;
}

async function uploadToS3(id: string, files: Array<{ name: string; content: string; type?: string }>) {
  const bucket = process.env.S3_BUCKET as string;

  // Dynamic import to avoid bundling when not used
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client(getS3ClientConfig());

  for (const f of files) {
    const Key = `${id}/${f.name}`;
    const ContentType = f.type || guessContentType(f.name);
    const Body = typeof f.content === 'string' ? new TextEncoder().encode(f.content) : f.content;
    await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body, ContentType }));
  }
}

export async function POST(request: Request) {
  // Accept both { id, files: [...] } and raw array [...] bodies
  const raw = await request.text();
  if (!raw || !raw.trim()) {
    return new Response(JSON.stringify({ error: 'Empty body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Derive id and files
  type BodyWithFiles = { id?: string; files?: Array<{ name: string; content: unknown; type?: string }> };
  const hasObject = typeof body === 'object' && body !== null && !Array.isArray(body);
  const idProvided = hasObject && typeof (body as BodyWithFiles).id === 'string';
  const baseId: string = idProvided
    ? (body as BodyWithFiles).id as string
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  // In development, ensure a unique id per upload to avoid CDN cache collisions when clients reuse ids
  const id: string = (process.env.NODE_ENV !== 'production' && idProvided)
    ? `${baseId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    : baseId;

  const filesInput: unknown = Array.isArray(body) ? body : (hasObject ? (body as BodyWithFiles).files : []);
  const files: Array<{ name: string; content: string; type?: string }> = [];
  if (Array.isArray(filesInput)) {
    for (const f of filesInput) {
      const file = f as { name?: unknown; content?: unknown; type?: unknown };
      if (typeof file?.name === 'string' && typeof file?.content !== 'undefined') {
        files.push({ name: file.name, content: String(file.content), type: typeof file.type === 'string' ? file.type : undefined });
      }
    }
  }

  if (files.length === 0) {
    return new Response(JSON.stringify({ error: 'No files provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let publicUrl: string | null = null;
  if (isS3Enabled()) {
    await uploadToS3(id, files);
    const base = getPublicBaseUrl();
    if (base) {
      publicUrl = `${base}/${id}/index.html`;
    }
  } else {
    const store = getStore();
    const fileMap: Record<string, StoredFile> = {};
    for (const f of files) {
      const type = f.type || guessContentType(f.name);
      const content = typeof f.content === 'string' ? f.content : String(f.content ?? '');
      fileMap[f.name] = { content, type };
    }
    const existing = store.get(id) || {};
    store.set(id, { ...existing, ...fileMap });
  }

  return new Response(JSON.stringify({ id, url: publicUrl }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}


