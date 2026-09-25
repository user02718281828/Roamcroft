import { env } from 'cloudflare:workers';
import { handleWorld } from '@/lib/server/api';
import { guardOnline } from '@/lib/server/diagnostics';
export async function POST(request: Request) {
  return guardOnline('world', () =>
    handleWorld(request, (env as unknown as { DB: D1Database }).DB),
  );
}
