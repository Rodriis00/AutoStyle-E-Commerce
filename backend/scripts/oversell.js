// Prueba de concurrencia (RNF-05): N clientes compran a la vez la ÚLTIMA unidad → debe haber exactamente 1 éxito.
// Uso: con la API corriendo y la BD sembrada → API=http://localhost:4000 node scripts/oversell.js
const API = process.env.API ?? 'http://localhost:4000', N = 8, pid = 10;
const call = async (path, { method = 'GET', body, jar } = {}) => {
  const r = await fetch(API + '/api/v1' + path, { method, headers: { 'Content-Type': 'application/json', ...(jar?.token ? { Authorization: 'Bearer ' + jar.token } : {}) }, body: body && JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => ({})), cookie: r.headers.getSetCookie?.() ?? [] };
};
const admin = { jar: {} };
const cookies = (await call('/auth/login', { method: 'POST', body: { email: 'admin@autostyle.mx', password: 'Admin1234' } })).cookie;
const adminToken = cookies.find(c => c.startsWith('as_session='))?.split(';')[0].slice(11);
admin.jar.token = adminToken;
const p = (await call('/products/' + pid)).data;
await call('/admin/products/' + pid, { method: 'PUT', jar: admin.jar, body: { name: p.name, category: p.category, brand: p.brand, price: p.price, stock: 1, emoji: p.emoji } });
const users = await Promise.all(Array.from({ length: N }, async (_, i) => {
  const email = `race${Date.now()}_${i}@test.mx`;
  await call('/auth/register', { method: 'POST', body: { name: 'Race ' + i, email, password: 'Password123' } });
  const l = await call('/auth/login', { method: 'POST', body: { email, password: 'Password123' } });
  const jar = { token: l.cookie.find(c => c.startsWith('as_session='))?.split(';')[0].slice(11) };
  await call(`/cart/items/${pid}`, { method: 'PUT', jar, body: { qty: 1 } });
  return jar;
}));
const res = await Promise.all(users.map(jar => call('/checkout', { method: 'POST', jar, body: { method: 'card', card: { number: '4242424242424242', exp: '12/30', cvv: '123' }, phone: '5512345678', address: 'Calle Falsa 123, Col. Centro, CDMX' } })));
const ok = res.filter(r => r.status === 201).length, rej = res.filter(r => r.status === 409).length;
console.log({ ok, rechazados409: rej, otros: res.length - ok - rej });
process.exit(ok === 1 ? 0 : 1);
