type Route = 'shared' | 'lobby' | 'world';
// Do not log bodies, cookies, invite codes, player names, exception messages or stacks.
export async function guardOnline(
  route: Route,
  run: () => Promise<Response>,
  report: (line: string) => void = (line) => console.error(line),
) {
  let response: Response,
    kind = 'response';
  try {
    response = await run();
  } catch (error) {
    kind =
      error instanceof TypeError
        ? 'TypeError'
        : error instanceof SyntaxError
          ? 'SyntaxError'
          : 'internal';
    response = Response.json(
      {
        error:
          'Sunucuya şu anda ulaşılamıyor. İşlem onaylanmadı; bağlantı yeniden denenecek.',
      },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '2' },
      },
    );
  }
  if (response.status < 500) return response;
  const requestId = crypto.randomUUID();
  report(
    JSON.stringify({
      event: 'online_api_failure',
      route,
      requestId,
      status: response.status,
      kind,
    }),
  );
  const headers = new Headers(response.headers);
  headers.set('X-Roamcroft-Request-Id', requestId);
  return new Response(response.body, { status: response.status, headers });
}
