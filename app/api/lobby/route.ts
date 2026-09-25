import { env } from 'cloudflare:workers';
import { handleLobby } from '@/lib/server/lobby';
import { guardOnline } from '@/lib/server/diagnostics';
export async function POST(request: Request) {
  return guardOnline('lobby', () =>
    handleLobby(request, (env as { DB: D1Database }).DB),
  );
}
