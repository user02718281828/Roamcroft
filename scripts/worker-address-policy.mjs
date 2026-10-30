// Apply after generation as well as at Vite input: generated files are disposable.
export function applyWorkerAddressPolicy(wrangler, policy) {
  if (policy.workers_dev !== false || policy.preview_urls !== false) {
    throw new Error('Roamcroft yalnız custom domain üzerinden yayımlanır: workers_dev ve preview_urls false olmalı.');
  }
  for (const settings of [wrangler, ...Object.values(wrangler.env ?? {})]) {
    settings.workers_dev = false;
    settings.preview_urls = false;
  }
}
