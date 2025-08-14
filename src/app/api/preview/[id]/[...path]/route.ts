export const runtime = 'nodejs';

declare global {
  // eslint-disable-next-line no-var
  var __appletflow_preview_store: Map<string, Record<string, { content: string; type: string }>> | undefined;
}

function getStore() {
  if (!globalThis.__appletflow_preview_store) {
    globalThis.__appletflow_preview_store = new Map();
  }
  return globalThis.__appletflow_preview_store;
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
  if (endpoint) config.endpoint = endpoint;
  if (forcePathStyle) config.forcePathStyle = true;
  return config;
}

async function getFromS3(id: string, relativePath: string) {
  const bucket = process.env.S3_BUCKET as string;

  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client(getS3ClientConfig());
  const Key = `${id}/${relativePath}`;
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key }));
    // The SDK returns a runtime-specific stream; we access method reflectively
    const body = res.Body as unknown as { transformToByteArray?: () => Promise<Uint8Array> } | undefined;
    const arrayBuffer = typeof body?.transformToByteArray === 'function' ? await body.transformToByteArray() : null;
    const contentType = (res.ContentType as string) || 'text/plain; charset=utf-8';
    if (!arrayBuffer) return null;
    return new Response(new Uint8Array(arrayBuffer), { headers: { 'Content-Type': contentType } });
  } catch {
    return null;
  }
}

function notFound() {
  return new Response('Not found', { status: 404 });
}

import type { PreviewRouteParams } from '@/types';

export async function GET(request: Request, context: { params: PreviewRouteParams }) {
  const { id, path = [] } = context.params || ({} as unknown as PreviewRouteParams);
  // If no path provided, default to index.html
  const relativePath = path.length === 0 ? 'index.html' : path.join('/');

  if (isS3Enabled()) {
    const res = await getFromS3(id, relativePath);
    if (res) return res;
    return notFound();
  }

  const store = getStore();
  if (!store) return notFound();
  const files = store.get(id);
  if (!files) return notFound();
  const file = files[relativePath];
  if (!file) return notFound();

  return new Response(file.content, { headers: { 'Content-Type': file.type, 'Cache-Control': 'no-store' } });
}


