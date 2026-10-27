import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import { Ctx, useApp } from './ctx';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import { Login, Register } from './pages/Auth';
import Cart from './pages/Cart';
import { Orders, Receipt, Wishlist } from './pages/Orders';
import Admin from './pages/Admin';

function Header() {
  const { user, cart, logout } = useApp(); const [open, setOpen] = useState(false);
  const n = cart.reduce((a, i) => a + i.qty, 0), L = ({ to, children }) => <Link to={to} onClick={() => setOpen(false)} className="block rounded px-3 py-2 hover:underline">{children}</Link>;
  return (<header className="sticky top-0 z-40 bg-[#1E3A8A] text-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
    <Link to="/" className="text-xl font-extrabold">🚗 AutoStyle</Link>
    <button className="btn2 border-white md:hidden" aria-label="Menú" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
    <nav className={`${open ? '' : 'hidden'} absolute left-0 right-0 top-full items-center gap-1 bg-[#1E3A8A] p-3 md:static md:flex md:p-0`}>
      <L to="/">Catálogo</L>
      {user?.role === 'cli' && <><L to="/carrito">Carrito ({n})</L><L to="/favoritos">Favoritos</L><L to="/pedidos">Mis pedidos</L></>}
      {user?.role === 'adm' && <L to="/admin">Panel Admin</L>}
      {user ? <><span className="px-3 text-sm">{user.name} · {user.role === 'adm' ? 'Administrador' : 'Cliente'}</span><button className="btn2 border-white" onClick={logout}>Salir</button></> : <><span className="px-3 text-sm">Invitado</span><L to="/login">Ingresar</L></>}
    </nav></div></header>);
}
function Guard({ role, children }) { const { user, ready } = useApp(); if (!ready) return null; return user?.role === role ? children : <Navigate to="/login" replace />; }

function Shell() {
  const nav = useNavigate();
  const [user, setUser] = useState(null), [ready, setReady] = useState(false), [cart, setCart] = useState([]), [wish, setWish] = useState([]), [t, setT] = useState(null);
  const toast = (m, undo) => { setT({ m, undo }); clearTimeout(toast.id); toast.id = setTimeout(() => setT(null), 5000); };
  const loadUserData = useCallback(async () => { setCart(await api('/cart').catch(() => [])); setWish((await api('/wishlist').catch(() => [])).map(p => p.id)); }, []);
  useEffect(() => { api('/auth/me').then(async u => { if (u.role !== 'inv') { setUser(u); if (u.role === 'cli') await loadUserData(); } }).catch(() => {}).finally(() => setReady(true)); }, [loadUserData]);
  const guard = () => { if (!user) { toast('Inicia sesión para comprar (invitados solo visualizan).'); nav('/login'); return false; } if (user.role !== 'cli') { toast('Solo los clientes pueden comprar.'); return false; } return true; };
  const setQty = async (id, qty) => { try { setCart(await api(`/cart/items/${id}`, { method: 'PUT', body: { qty } })); return true; } catch (e) { toast(e.message); return false; } };
  const addToCart = async id => { if (guard() && await setQty(id, (cart.find(i => i.productId === id)?.qty ?? 0) + 1)) toast('Añadido al carrito.'); };
  const removeFromCart = async id => { const prev = cart.find(i => i.productId === id)?.qty; await setQty(id, 0); toast('Producto eliminado.', () => setQty(id, prev)); };   // CP-MSG-01
  const toggleWish = async id => { if (!user || user.role !== 'cli') return toast('Inicia sesión como cliente para usar favoritos.'); const on = wish.includes(id); await api(`/wishlist/${id}`, { method: on ? 'DELETE' : 'PUT' }); setWish(on ? wish.filter(x => x !== id) : [...wish, id]); };
  const login = async u => { setUser(u); if (u.role === 'cli') await loadUserData(); nav(u.role === 'adm' ? '/admin' : '/'); };
  const logout = async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); setCart([]); setWish([]); nav('/'); };
  const v = { user, ready, cart, wish, toast, addToCart, removeFromCart, setQty, toggleWish, login, logout, loadUserData };
  return (<Ctx.Provider value={v}><Header /><main className="mx-auto max-w-6xl px-4 py-6">
    <Routes><Route path="/" element={<Catalog />} /><Route path="/producto/:id" element={<Product />} /><Route path="/login" element={<Login />} /><Route path="/registro" element={<Register />} />
      <Route path="/carrito" element={<Guard role="cli"><Cart /></Guard>} /><Route path="/comprobante" element={<Guard role="cli"><Receipt /></Guard>} />
      <Route path="/pedidos" element={<Guard role="cli"><Orders /></Guard>} /><Route path="/favoritos" element={<Guard role="cli"><Wishlist /></Guard>} />
      <Route path="/admin" element={<Guard role="adm"><Admin /></Guard>} /><Route path="*" element={<Navigate to="/" />} /></Routes></main>
    <div aria-live="polite" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">{t && <div className="card flex items-center gap-3 px-4 py-3 shadow-lg" role="status">{t.m}{t.undo && <button className="btn2 underline" onClick={() => { t.undo(); setT(null); }}>Deshacer acción</button>}</div>}</div>
    <footer className="mx-auto max-w-6xl px-4 pb-8 text-sm mut">AutoStyle — UPIICSA IPN · v2.1</footer></Ctx.Provider>);
}
export default function App() { return <BrowserRouter><Shell /></BrowserRouter>; }
