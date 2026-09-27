import { env } from 'cloudflare:workers';
import { routeRealtime } from '@/worker/realtime';
import { guardOnline } from '@/lib/server/diagnostics';
export async function POST(request: Request) {
  return guardOnline('shared', () =>
    routeRealtime(request, env as unknown as Parameters<typeof routeRealtime>[1]),
  );
}
