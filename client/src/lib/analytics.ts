export type EnvLike = { [key: string]: unknown };

export function shouldInjectAnalytics(env?: EnvLike) {
  const _env = env ?? (import.meta as any).env ?? {};
  const analyticsEndpoint = String(_env.VITE_ANALYTICS_ENDPOINT ?? "");
  const websiteId = String(_env.VITE_ANALYTICS_WEBSITE_ID ?? "");
  return analyticsEndpoint.length > 0 && websiteId.length > 0;
}

export function injectUmamiIfConfigured(options?: { env?: EnvLike; doc?: Document }) {
  const env = options?.env ?? (import.meta as any).env ?? {};
  const doc = options?.doc ?? document;

  if (!shouldInjectAnalytics(env)) return null;

  const analyticsEndpoint = String(env.VITE_ANALYTICS_ENDPOINT);
  const websiteId = String(env.VITE_ANALYTICS_WEBSITE_ID);

  const s = doc.createElement("script");
  s.defer = true;
  s.src = analyticsEndpoint + "/umami";
  s.setAttribute("data-website-id", websiteId);
  doc.body.appendChild(s);
  return s;
}

export default injectUmamiIfConfigured;
