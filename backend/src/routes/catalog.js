import { Router } from 'express';
import { q } from '../db.js';
import { h, HttpError } from '../util.js';
const r = Router();
export const BASE = `SELECT p.id,p.name,p.brand,p.description,p.price,p.stock,p.emoji,p.is_active,c.name AS category,
  COALESCE(rv.avg,0)::float AS rating, COALESCE(rv.n,0)::int AS reviews
  FROM products p JOIN categories c ON c.id=p.category_id
  LEFT JOIN (SELECT product_id,AVG(stars) avg,COUNT(*) n FROM reviews GROUP BY 1) rv ON rv.product_id=p.id`;

r.get('/filters', h(async (_req, res) => {
  const [c, b] = await Promise.all([q('SELECT name FROM categories ORDER BY name'), q("SELECT DISTINCT brand FROM products WHERE is_active AND brand<>'' ORDER BY brand")]);
  res.json({ categories: c.rows.map(x => x.name), brands: b.rows.map(x => x.brand) });
}));
// RF-02: filtros multicriterio (categoría, marca, precio, rating) + búsqueda
r.get('/products', h(async (req, res) => {
  const { q: s, category, brand, maxPrice, minPrice, minRating } = req.query, w = ['p.is_active'], v = [];
  const add = (cond, val) => { v.push(val); w.push(cond.replaceAll('?', '$' + v.length)); };
  if (s) add('(p.name ILIKE ? OR p.brand ILIKE ? OR c.name ILIKE ?)', `%${s}%`);
  if (category) add('c.name = ?', category);
  if (brand) add('p.brand = ?', brand);
  if (maxPrice) add('p.price <= ?', +maxPrice);
  if (minPrice) add('p.price >= ?', +minPrice);
  if (minRating) add('COALESCE(rv.avg,0) >= ?', +minRating);
  res.json((await q(`${BASE} WHERE ${w.join(' AND ')} ORDER BY p.id LIMIT 100`, v)).rows);
}));
r.get('/products/suggest', h(async (req, res) => { // búsqueda predictiva
  const s = String(req.query.q ?? '').trim();
  if (s.length < 2) return res.json([]);
  res.json((await q(`SELECT DISTINCT name FROM products WHERE is_active AND name ILIKE $1 ORDER BY name LIMIT 6`, [`%${s}%`])).rows.map(x => x.name));
}));
r.get('/products/:id(\\d+)', h(async (req, res) => {
  const { rows: [p] } = await q(`${BASE} WHERE p.id=$1 AND p.is_active`, [req.params.id]);
  if (!p) throw new HttpError(404, 'Producto no encontrado.');
  res.json(p);
}));
// RF-03 / RN-08: el frontend envía las categorías de la cookie as_nav_pref; sin cookie → mejor calificados.
r.get('/recommendations', h(async (req, res) => {
  const cats = String(req.query.cats ?? '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 5);
  res.json((await q(`${BASE} WHERE p.is_active AND p.stock>0
    ORDER BY (c.name = ANY($1::text[])) DESC, COALESCE(array_position($1::text[], c.name::text), 99), rating DESC, p.id LIMIT 4`, [cats])).rows);
}));
export default r;
