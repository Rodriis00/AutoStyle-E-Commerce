import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';
import { fmt } from '../lib';
const blank = { name: '', category: '', brand: '', price: '', stock: 15, emoji: '🚗' };
export default function Admin() {
  const { toast } = useApp(), [tab, setTab] = useState('p'), [rows, setRows] = useState([]), [f, setF] = useState(blank), [edit, setEdit] = useState(null);
  const load = useCallback(() => api({ p: '/admin/products', o: '/admin/orders', r: '/admin/reviews' }[tab]).then(setRows), [tab]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn, ok) => { try { await fn(); if (ok) toast(ok); load(); } catch (e) { toast(`HTTP ${e.status}: ${e.message}`); } };
  const save = () => run(async () => { await api(edit ? `/admin/products/${edit}` : '/admin/products', { method: edit ? 'PUT' : 'POST', body: f }); setEdit(null); setF(blank); }, edit ? 'Producto actualizado.' : 'HTTP 201 Created. Visible en catálogo y Home.');
  const I = (k, label, cls = '', type = 'text') => <div className={cls}><label htmlFor={'f' + k}>{label}</label><input id={'f' + k} type={type} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} /></div>;
  return (<><h1 className="mb-3 text-2xl font-extrabold">Panel de administración</h1>
    <div className="mb-3 flex gap-2">{[['p', 'Productos'], ['o', 'Pedidos'], ['r', 'Reseñas']].map(([k, t]) => <button key={k} className={tab === k ? 'btn' : 'btn2'} onClick={() => { setTab(k); setRows([]); }}>{t}</button>)}</div>
    {tab === 'p' && <><div className="card mb-3 grid grid-cols-2 gap-2 p-3 md:grid-cols-6">{I('name', 'Nombre', 'col-span-2')}{I('category', 'Categoría')}{I('brand', 'Marca')}{I('price', 'Precio', '', 'number')}{I('stock', 'Stock', '', 'number')}{I('emoji', 'Emoji')}
      <div className="col-span-2 flex items-end gap-2"><button className="btn" onClick={save}>{edit ? 'Actualizar' : 'Crear'}</button>{edit && <button className="btn2" onClick={() => { setEdit(null); setF(blank); }}>Cancelar</button>}</div></div>
      <div className="overflow-x-auto"><table className="card w-full text-sm"><thead><tr className="text-left"><th className="p-2">Producto</th><th>Precio</th><th>Stock</th><th>Estado</th><th /></tr></thead><tbody>{rows.map(p => <tr key={p.id} className="border-t border-slate-300 dark:border-slate-700"><td className="p-2">{p.emoji} {p.name}</td><td>{fmt(p.price)}</td><td>{p.stock || '0 (Agotado)'}</td><td>{p.is_active ? 'Activo' : 'Inactivo'}</td>
        <td className="space-x-1 p-1"><button className="btn2" onClick={() => { setEdit(p.id); setF({ name: p.name, category: p.category, brand: p.brand, price: p.price, stock: p.stock, emoji: p.emoji }); }}>Editar</button>
          <button className="btn2" onClick={() => run(() => p.is_active ? api(`/admin/products/${p.id}`, { method: 'DELETE' }) : api(`/admin/products/${p.id}/restore`, { method: 'POST' }), p.is_active ? 'Soft delete aplicado (is_active = false); historial conservado.' : 'Producto reactivado.')}>{p.is_active ? 'Eliminar' : 'Reactivar'}</button></td></tr>)}</tbody></table></div></>}
    {tab === 'o' && <div className="overflow-x-auto"><table className="card w-full text-sm"><thead><tr className="text-left"><th className="p-2">#</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>{rows.map(o => <tr key={o.id} className="border-t border-slate-300 dark:border-slate-700"><td className="p-2">{o.id}</td><td>{o.customer}</td><td>{fmt(o.total)}</td>
      <td><select aria-label="Estado" value={o.status} onChange={e => run(() => api(`/admin/orders/${o.id}/status`, { method: 'PATCH', body: { status: e.target.value } }))}>{['PENDIENTE', 'ENVIADO', 'ENTREGADO', 'CANCELADO'].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>}
    {tab === 'r' && (rows.length ? rows.map(x => <div key={x.id} className="card mb-2 flex justify-between gap-2 p-3"><div><b>{x.product}</b> {'★'.repeat(x.stars)}<br />{x.author}: {x.comment}</div><button className="btn2" onClick={() => run(() => api(`/admin/reviews/${x.id}`, { method: 'DELETE' }), 'Reseña eliminada.')}>Moderar</button></div>) : <p className="mut">Sin reseñas.</p>)}</>);
}
