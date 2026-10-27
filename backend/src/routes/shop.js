import { Router } from 'express';
import xss from 'xss';
import { q, tx } from '../db.js';
import { h, HttpError, luhn, cardBrand } from '../util.js';
import { need } from '../middleware.js';
import { BASE } from './catalog.js';
const r = Router();
const clean = s => xss(String(s), { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] }).trim();
const getCart = async uid => (await q(`SELECT ci.product_id AS "productId",ci.qty,p.name,p.price,p.stock,p.emoji FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=$1 AND p.is_active ORDER BY p.id`, [uid])).rows;

// ---- RF-04 Carrito persistente en BD (RN-01: invitados → 401) ----
r.get('/cart', need('cli'), h(async (req, res) => res.json(await getCart(req.user.id))));
r.put('/cart/items/:pid(\\d+)', need('cli'), h(async (req, res) => {
  const pid = +req.params.pid, qty = +req.body?.qty;
  if (!Number.isInteger(qty) || qty < 0) throw new HttpError(400, 'Cantidad inválida.');
  if (qty === 0) await q('DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2', [req.user.id, pid]);
  else {
    const { rows: [p] } = await q('SELECT stock FROM products WHERE id=$1 AND is_active', [pid]);
    if (!p) throw new HttpError(404, 'Producto no encontrado.');
    if (p.stock <= 0) throw new HttpError(409, 'Producto agotado.');           // RN-07
    if (qty > p.stock) throw new HttpError(409, `Máximo según stock real: ${p.stock}.`);
    await q(`INSERT INTO cart_items(user_id,product_id,qty) VALUES($1,$2,$3) ON CONFLICT(user_id,product_id) DO UPDATE SET qty=EXCLUDED.qty`, [req.user.id, pid, qty]);
  }
  res.json(await getCart(req.user.id));
}));
// ---- Wishlist ----
r.get('/wishlist', need('cli'), h(async (req, res) =>
  res.json((await q(`${BASE} JOIN wishlist w ON w.product_id=p.id AND w.user_id=$1 WHERE p.is_active ORDER BY p.id`, [req.user.id])).rows)));
r.put('/wishlist/:pid(\\d+)', need('cli'), h(async (req, res) => { await q('INSERT INTO wishlist VALUES($1,$2) ON CONFLICT DO NOTHING', [req.user.id, req.params.pid]); res.status(204).end(); }));
r.delete('/wishlist/:pid(\\d+)', need('cli'), h(async (req, res) => { await q('DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2', [req.user.id, req.params.pid]); res.status(204).end(); }));

// ---- RF-05 Checkout: pagos 100% simulados, transacción con bloqueo de filas ----
r.post('/checkout', need('cli'), h(async (req, res) => {
  const { method, card, paymentToken, phone, address } = req.body ?? {};
  if (!/^\d{10}$/.test(phone ?? '')) throw new HttpError(400, 'El teléfono debe tener 10 dígitos.');          // RN-03
  if ((address ?? '').trim().length < 10) throw new HttpError(400, 'Ingresa una dirección completa.');
  let ref;
  if (method === 'card') {
    const n = String(card?.number ?? '').replace(/\s/g, ''), brand = cardBrand(n);
    if (!brand || !luhn(n)) throw new HttpError(400, 'Tarjeta inválida (VISA, Mastercard o AMEX).');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.exp ?? '')) throw new HttpError(400, 'Fecha de vencimiento inválida (MM/AA).');
    if (!/^\d{3,4}$/.test(card.cvv ?? '')) throw new HttpError(400, 'CVV inválido.');                       // se valida y se descarta: RN-04
    if (n.endsWith('0002')) throw new HttpError(402, 'Transacción declinada. Selecciona otro método.');       // CP-MSG-02
    ref = `${brand} •••• ${n.slice(-4)}`;
  } else if (method === 'applepay' || method === 'googlepay') {
    if (!paymentToken?.startsWith(`tok_sim_${method}_`)) throw new HttpError(400, 'Token de pago simulado ausente o inválido.');
    ref = paymentToken;
  } else throw new HttpError(400, 'Método de pago no soportado.');

  const order = await tx(async c => {
    // SELECT ... FOR UPDATE ordenado por id: serializa compras concurrentes y evita deadlocks (RNF-05)
    const { rows: items } = await c.query(`SELECT ci.product_id,ci.qty,p.name,p.price,p.stock,p.is_active
      FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE ci.user_id=$1 ORDER BY p.id FOR UPDATE OF p`, [req.user.id]);
    if (!items.length) throw new HttpError(400, 'Tu carrito está vacío.');
    for (const i of items) if (!i.is_active || i.stock < i.qty) throw new HttpError(409, `Stock insuficiente para "${i.name}".`);
    for (const i of items) await c.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [i.qty, i.product_id]);
    const total = Math.round(items.reduce((a, i) => a + i.price * i.qty, 0) * 100) / 100;
    const { rows: [o] } = await c.query(`INSERT INTO orders(user_id,total,phone,address,payment_method,payment_ref) VALUES($1,$2,$3,$4,$5,$6)
      RETURNING id,status,total,phone,address,payment_method,payment_ref,created_at`, [req.user.id, total, phone, clean(address), method, ref]);
    for (const i of items) await c.query('INSERT INTO order_items(order_id,product_id,name,unit_price,qty) VALUES($1,$2,$3,$4,$5)', [o.id, i.product_id, i.name, i.price, i.qty]);
    await c.query('DELETE FROM cart_items WHERE user_id=$1', [req.user.id]);
    return { ...o, items: items.map(i => ({ productId: i.product_id, name: i.name, price: i.price, qty: i.qty })) };
  });
  res.status(201).json(order);
}));
r.get('/orders', need('cli'), h(async (req, res) => res.json((await q(`
  SELECT o.id,o.status,o.total,o.created_at,o.payment_ref,o.address,o.phone,
   COALESCE(json_agg(json_build_object('productId',i.product_id,'name',i.name,'price',i.unit_price,'qty',i.qty)) FILTER (WHERE i.id IS NOT NULL),'[]') AS items
  FROM orders o LEFT JOIN order_items i ON i.order_id=o.id WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.id DESC`, [req.user.id])).rows)));

// ---- RN-05 Reseñas certificadas ----
const eligible = async (uid, pid) => (await q(`
  SELECT o.id FROM orders o JOIN order_items i ON i.order_id=o.id
  WHERE o.user_id=$1 AND i.product_id=$2 AND o.status='ENTREGADO'
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.user_id=$1 AND r.product_id=$2) ORDER BY o.id LIMIT 1`, [uid, pid])).rows[0];
r.get('/products/:pid(\\d+)/reviews', h(async (req, res) => {
  const { rows } = await q(`SELECT r.id,r.stars,r.comment,r.created_at,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 ORDER BY r.id DESC`, [req.params.pid]);
  res.json({ items: rows, canReview: req.user?.role === 'cli' ? !!(await eligible(req.user.id, +req.params.pid)) : false });
}));
r.post('/products/:pid(\\d+)/reviews', need('cli'), h(async (req, res) => {
  const stars = +req.body?.stars, comment = clean(req.body?.comment ?? '');                 // CP-SEC-01: sanitización
  if (!(stars >= 1 && stars <= 5) || !Number.isInteger(stars)) throw new HttpError(400, 'La calificación debe ser de 1 a 5.');
  if (!comment) throw new HttpError(400, 'Este campo es obligatorio.');
  const o = await eligible(req.user.id, +req.params.pid);
  if (!o) throw new HttpError(403, 'Solo clientes con pedido entregado pueden calificar (una vez por producto).');
  await q('INSERT INTO reviews(product_id,user_id,order_id,stars,comment) VALUES($1,$2,$3,$4,$5)', [req.params.pid, req.user.id, o.id, stars, comment]);
  res.status(201).json({ ok: true });
}));
export default r;
