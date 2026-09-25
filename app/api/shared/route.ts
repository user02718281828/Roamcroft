import { env } from 'cloudflare:workers';
import { handleShared } from '@/lib/server/shared-api';
import { guardOnline } from '@/lib/server/diagnostics';
export async function POST(request: Request) {
  return guardOnline('shared', () =>
    handleShared(request, (env as unknown as { DB: D1Database }).DB),
  );
}
