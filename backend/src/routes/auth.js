import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { q } from '../db.js';
import { h, HttpError } from '../util.js';
import { sign, cookieOpts } from '../middleware.js';
const r = Router(), EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DUMMY = bcrypt.hashSync('dummy-password', 12); // evita filtrar si el correo existe por tiempos

function startSession(res, u) {
  res.cookie('as_session', sign(u), cookieOpts);                                           // HttpOnly + Secure(prod) + SameSite=Lax
  res.cookie('as_csrf', crypto.randomBytes(24).toString('hex'), { ...cookieOpts, httpOnly: false });
}
r.post('/register', h(async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name?.trim() || !email || !password) throw new HttpError(400, 'Este campo es obligatorio.');
  if (!EMAIL.test(email)) throw new HttpError(400, 'Ingresa un correo electrónico válido.');
  if (password.length < 8) throw new HttpError(400, 'La contraseña debe tener mínimo 8 caracteres.');
  const hash = await bcrypt.hash(password, 12); // RNF-01: coste 12
  try {
    const { rows: [u] } = await q(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'cli') RETURNING id,name,email,role`, [name.trim(), email.trim(), hash]);
    res.status(201).json(u);
  } catch (e) { if (e.code === '23505') throw new HttpError(409, 'Este correo ya está registrado.'); throw e; }
}));
r.post('/login', h(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw new HttpError(400, 'Este campo es obligatorio.');
  const { rows: [u] } = await q('SELECT * FROM users WHERE lower(email)=lower($1)', [email]);
  const ok = await bcrypt.compare(password, u?.password_hash ?? DUMMY);
  if (!u || !ok) throw new HttpError(401, 'Credenciales incorrectas.');
  startSession(res, u);
  res.json({ id: u.id, name: u.name, email: u.email, role: u.role });
}));
r.post('/logout', (_req, res) => { res.clearCookie('as_session', cookieOpts); res.clearCookie('as_csrf', { path: '/' }); res.json({ ok: true }); });
r.get('/me', (req, res) => res.json(req.user ?? { role: 'inv' }));
export default r;
