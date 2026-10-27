import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../ctx';
import { fmt, setPref, stars } from '../lib';
export default function Product() {
  const { id } = useParams(), { addToCart, toggleWish, wish, toast } = useApp();
  const [p, setP] = useState(null), [rv, setRv] = useState({ items: [], canReview: false }), [f, setF] = useState({ stars: 5, comment: '' }), [err, setErr] = useState('');
  const load = () => { api('/products/' + id).then(x => { setP(x); setPref(x.category); }).catch(() => setP(false)); api(`/products/${id}/reviews`).then(setRv); };
  useEffect(load, [id]);
  const send = async () => { if (!f.comment.trim()) return setErr('Este campo es obligatorio.'); try { await api(`/products/${id}/reviews`, { method: 'POST', body: f }); toast('Reseña publicada.'); setErr(''); setF({ stars: 5, comment: '' }); load(); } catch (e) { setErr(e.message); } };
  if (p === false) return <p>Producto no disponible. <Link className="underline" to="/">Volver al catálogo</Link></p>;
  if (!p) return null;
  return (<><Link className="btn2 mb-3 inline-block" to="/">← Catálogo</Link>
    <div className="grid gap-6 md:grid-cols-2"><div className="card py-16 text-center text-9xl" aria-hidden="true">{p.emoji}</div>
      <div className="flex flex-col gap-3"><span className="mut">{p.category} · {p.brand}</span><h1 className="text-2xl font-extrabold">{p.name}</h1><div className="text-amber-600">{stars(p.rating)} ({p.reviews})</div>
        <div className="text-2xl font-extrabold">{fmt(p.price)}</div><p>{p.stock > 0 ? `Disponible (${p.stock} en stock)` : <b className="text-red-600">Agotado</b>}</p>
        <div className="flex gap-2"><button className="btn" disabled={p.stock <= 0} onClick={() => addToCart(p.id)}>{p.stock <= 0 ? 'Agotado' : 'Añadir al carrito'}</button><button className="btn2" onClick={() => toggleWish(p.id)}>{wish.includes(p.id) ? '♥ Quitar' : '♡ Favorito'}</button></div></div></div>
    <section className="mt-8"><h2 className="mb-2 text-lg font-bold">Reseñas de compradores verificados</h2>
      {rv.items.map(x => <div key={x.id} className="card mb-2 p-3"><b>{x.name}</b> <span className="text-amber-600">{'★'.repeat(x.stars)}</span><p>{x.comment}</p></div>)}{!rv.items.length && <p className="mut">Aún no hay reseñas.</p>}
      {rv.canReview ? <div className="card mt-3 grid gap-2 p-3"><label htmlFor="rs">Calificación</label><select id="rs" value={f.stars} onChange={e => setF({ ...f, stars: +e.target.value })}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}★</option>)}</select>
        <label htmlFor="rt">Tu reseña</label><textarea id="rt" rows="3" value={f.comment} aria-invalid={!!err} onChange={e => setF({ ...f, comment: e.target.value })} />{err && <p className="err" role="alert">{err}</p>}<button className="btn" onClick={send}>Publicar reseña</button></div>
        : <p className="mt-2 text-sm mut">Solo clientes con pedido entregado pueden calificar este producto.</p>}</section></>);
}
