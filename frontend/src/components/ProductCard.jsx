import { Link } from 'react-router-dom';
import { useApp } from '../ctx';
import { fmt, stars } from '../lib';
export default function ProductCard({ p }) {
  const { addToCart, wish, toggleWish } = useApp(), w = wish.includes(p.id);
  return (<article className="card flex flex-col gap-2 p-4">
    <div className="rounded-lg bg-slate-200/60 py-4 text-center text-6xl dark:bg-slate-700/40" aria-hidden="true">{p.emoji}</div>
    <span className="text-xs mut">{p.category} · {p.brand}</span><h3 className="font-bold">{p.name}</h3>
    <div className="text-sm text-amber-600" aria-label={`Rating ${p.rating.toFixed(1)} de 5`}>{stars(p.rating)}</div>
    <div className="text-lg font-extrabold">{fmt(p.price)}</div>
    {p.stock <= 0 ? <b className="text-red-600">Agotado</b> : p.stock < 6 && <span className="text-sm text-amber-600">¡Solo quedan {p.stock}!</span>}
    <div className="mt-auto flex gap-2"><Link className="btn2 flex-1 text-center" to={`/producto/${p.id}`}>Ver</Link>
      <button className="btn flex-1" disabled={p.stock <= 0} onClick={() => addToCart(p.id)}>{p.stock <= 0 ? 'Agotado' : 'Añadir'}</button>
      <button className="btn2" aria-label="Favorito" aria-pressed={w} onClick={() => toggleWish(p.id)}>{w ? '♥' : '♡'}</button></div></article>);
}
