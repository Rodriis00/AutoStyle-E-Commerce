import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET;
export const cookieOpts = { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true', sameSite: 'lax', maxAge: 2 * 3600e3, path: '/' };
export const sign = u => jwt.sign({ sub: u.id, role: u.role, name: u.name }, SECRET, { expiresIn: '2h' });

/** Lee el JWT desde Authorization: Bearer o desde la cookie HttpOnly as_session. */
export function auth(req, _res, next) {
  const h = req.headers.authorization; let token, viaCookie = false;
  if (h?.startsWith('Bearer ')) token = h.slice(7);
  else if (req.cookies.as_session) { token = req.cookies.as_session; viaCookie = true; }
  if (token) try { const p = jwt.verify(token, SECRET); req.user = { id: p.sub, role: p.role, name: p.name }; req.viaCookie = viaCookie; } catch {}
  next();
}
/** CSRF por doble envío: la cookie as_csrf debe coincidir con el header X-CSRF-Token (solo sesiones por cookie). */
export function csrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.viaCookie) return next();
  const t = req.get('x-csrf-token');
  return t && t === req.cookies.as_csrf ? next() : res.status(403).json({ error: 'Token CSRF inválido.' });
}
/** RBAC: Invitado (sin sesión) → 401; rol insuficiente → 403. */
export const need = (...roles) => (req, res, next) =>
  !req.user ? res.status(401).json({ error: 'Inicia sesión para continuar.' })
  : roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'No tienes permisos para esta acción.' });
