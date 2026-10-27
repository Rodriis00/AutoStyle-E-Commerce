import { Router } from 'express';
import express from 'express';
import xss from 'xss';
import multer from 'multer';
import { q } from '../db.js';
import { h, HttpError } from '../util.js';
import { need } from '../middleware.js';
import { BASE } from './catalog.js';

const r = Router();

// 1. Servir las imágenes PÚBLICAMENTE (Antes de proteger con need('adm'))
r.use('/uploads', express.static('uploads'));

r.use(need('adm')); // RN-06

// 2. Configurar multer para guardar archivos locales
const upload = multer({ dest: 'uploads/' });

const txt = s => xss(String(s ?? ''), { whiteList: {}, stripIgnoreTag: true }).trim();

async function fields(b, file) {
  const f = { 
    name: txt(b.name), 
    category: txt(b.category), 
    brand: txt(b.brand), 
    price: +b.price, 
    stock: Number.parseInt(b.stock), 
    // 3. Si subieron foto, guardamos la ruta. Si no, conservamos el emoji previo.
    emoji: file ? `/api/v1/admin/uploads/${file.filename}` : (txt(b.emoji) || '🚗') 
  };
  
  if (!f.name || !f.category || !(f.price > 0) || !(f.stock >= 0)) 
    throw new HttpError(400, 'Completa nombre, categoría, precio (>0) y stock (≥0).');
  
  const { rows: [c] } = await q('INSERT INTO categories(name) VALUES($1) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [f.category]);
  return { ...f, cid: c.id };
}

r.get('/products', h(async (_req, res) => res.json((await q(`${BASE} ORDER BY p.id`)).rows)));

// 4. Inyectar multer usando .single('image')
r.post('/products', upload.single('image'), h(async (req, res) => {
  const f = await fields(req.body, req.file);
  const { rows: [p] } = await q('INSERT INTO products(category_id,name,brand,price,stock,emoji) VALUES($1,$2,$3,$4,$5,$6) RETURNING id', [f.cid, f.name, f.brand, f.price, f.stock, f.emoji]);
  res.status(201).json(p);
}));

r.put('/products/:id(\\d+)', upload.single('image'), h(async (req, res) => {
  const f = await fields(req.body, req.file);
  const { rowCount } = await q('UPDATE products SET category_id=$1,name=$2,brand=$3,price=$4,stock=$5,emoji=$6 WHERE id=$7', [f.cid, f.name, f.brand, f.price, f.stock, f.emoji, req.params.id]);
  if (!rowCount) throw new HttpError(404, 'Producto no encontrado.');
  res.json({ ok: true });
}));

r.delete('/products/:id(\\d+)', h(async (req, res) => {
  await q('UPDATE products SET is_active=false WHERE id=$1', [req.params.id]); res.json({ ok: true, softDeleted: true });
}));
r.post('/products/:id(\\d+)/restore', h(async (req, res) => { await q('UPDATE products SET is_active=true WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

r.get('/orders', h(async (_req, res) => res.json((await q(`SELECT o.id,o.status,o.total,o.created_at,u.name AS customer FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC`)).rows)));
r.patch('/orders/:id(\\d+)/status', h(async (req, res) => {
  if (!['PENDIENTE', 'ENVIADO', 'ENTREGADO', 'CANCELADO'].includes(req.body?.status)) throw new HttpError(400, 'Estado inválido.');
  await q('UPDATE orders SET status=$1 WHERE id=$2', [req.body.status, req.params.id]); res.json({ ok: true });
}));
r.get('/reviews', h(async (_req, res) => res.json((await q(`SELECT r.id,r.stars,r.comment,u.name AS author,p.name AS product FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id ORDER BY r.id DESC`)).rows)));
r.delete('/reviews/:id(\\d+)', h(async (req, res) => { await q('DELETE FROM reviews WHERE id=$1', [req.params.id]); res.json({ ok: true }); }));

export default r;
