const csrf = () => document.cookie.match(/(?:^|; )as_csrf=([^;]*)/)?.[1] ?? '';
/** Cliente REST: cookies HttpOnly (credentials) + doble envío CSRF. */
export async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch('/api/v1' + path, { method, credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() }, body: body && JSON.stringify(body) });
  const d = r.status === 204 ? null : await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d?.error || 'Error de servidor'), { status: r.status });
  return d;
}
