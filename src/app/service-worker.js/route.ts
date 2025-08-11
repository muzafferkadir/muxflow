export const runtime = 'edge';

export function GET() {
  const js = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());`;
  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
      // Limit scope to root when registered at '/service-worker.js'
      'Service-Worker-Allowed': '/',
    },
  });
}


