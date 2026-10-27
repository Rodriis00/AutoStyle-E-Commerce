import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { fmt } from '../lib';
import ProductCard from '../components/ProductCard';
export function Orders() {
  const [l, setL] = useState([]); useEffect(() => { api('/orders').then(setL); }, []);
  return (<><h1 className="mb-3 text-2xl font-extrabold">Mis pedidos</h1>{l.map(o => <div key={o.id} className="card mb-2 p-3"><b>#{o.id}</b> · {o.created_at.slice(0, 10)} · <b>{o.status}</b> · {fmt(o.total)}
    <ul>{o.items.map(i => <li key={i.productId}>{i.qty} × {i.name} {o.status === 'ENTREGADO' && <Link className="underline" to={`/producto/${i.productId}`}>Calificar/ver</Link>}</li>)}</ul></div>)}{!l.length && <p className="mut">Sin pedidos.</p>}</>);
}
export function Receipt() {
  const o = useLocation().state?.order, nav = useNavigate(); if (!o) return <Navigate to="/pedidos" replace />;
  return (<div className="card mx-auto max-w-lg p-6"><h1 className="text-xl font-extrabold text-green-700 dark:text-green-400">✔ Compra confirmada</h1><p className="mut">Comprobante digital · Pedido #{o.id}</p>
    <ul className="my-3">{o.items.map(i => <li key={i.productId}>{i.qty} × {i.name} — {fmt(i.price * i.qty)}</li>)}</ul><p><b>Total: {fmt(o.total)}</b></p><p>Pago: {o.payment_ref}</p><p>Envío a: {o.address} · Tel. {o.phone}</p>
    <button className="btn mt-3" onClick={() => nav('/pedidos')}>Ver mis pedidos</button></div>);
}
export function Wishlist() {
  const [l, setL] = useState([]); useEffect(() => { api('/wishlist').then(setL); }, []);
  return (<><h1 className="mb-3 text-2xl font-extrabold">Favoritos</h1><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{l.map(p => <ProductCard key={p.id} p={p} />)}{!l.length && <p className="mut">Sin favoritos.</p>}</div></>);
}
