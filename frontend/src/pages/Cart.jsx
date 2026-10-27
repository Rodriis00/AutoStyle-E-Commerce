import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../ctx';
import { brand, fmt, luhn } from '../lib';
export default function Cart() {
  const { cart, setQty, removeFromCart, loadUserData, toast } = useApp(), nav = useNavigate();
  const [m, setM] = useState('card'), [ph, setPh] = useState(''), [ad, setAd] = useState(''), [c, setC] = useState({ n: '', x: '', v: '' }), [e, setE] = useState({}), [busy, setBusy] = useState(false);
  if (!cart.length) return <p className="mut">Tu carrito está vacío.</p>;
  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const E = k => e[k] && <p className="err" role="alert">{e[k]}</p>;
  async function confirm() {
    const er = {}, n = c.n.replace(/\s/g, '');
    if (!/^\d{10}$/.test(ph)) er.ph = 'El teléfono debe tener 10 dígitos.';
    if (ad.trim().length < 10) er.ad = 'Ingresa una dirección completa.';
    const body = { method: m, phone: ph, address: ad };
    if (m === 'card') {
      if (!brand(n) || !luhn(n)) er.n = 'Tarjeta inválida (VISA, Mastercard o AMEX con Luhn).';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(c.x)) er.x = 'Formato MM/AA.';
      if (!/^\d{3,4}$/.test(c.v)) er.v = 'CVV inválido.';
      body.card = { number: n, exp: c.x, cvv: c.v };
    }
    setE(er); if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (m !== 'card') { await new Promise(r => setTimeout(r, 1200)); body.paymentToken = `tok_sim_${m}_${crypto.randomUUID().slice(0, 8)}`; }  // biometría simulada
      const order = await api('/checkout', { method: 'POST', body });
      setC({ n: '', x: '', v: '' }); await loadUserData(); nav('/comprobante', { state: { order } });
    } catch (x) { toast(`HTTP ${x.status}: ${x.message}`); if (x.status === 409) loadUserData(); } finally { setBusy(false); }
  }
  return (<><h1 className="mb-3 text-2xl font-extrabold">Carrito y checkout</h1><div className="grid gap-6 lg:grid-cols-2"><div>
    {cart.map(i => <div key={i.productId} className="card mb-2 flex items-center gap-3 p-3"><span className="text-4xl" aria-hidden="true">{i.emoji}</span><div className="flex-1"><b>{i.name}</b><div>{fmt(i.price)}</div></div>
      <div className="flex items-center gap-1"><button className="btn2" aria-label="Menos" disabled={i.qty <= 1} onClick={() => setQty(i.productId, i.qty - 1)}>−</button><b>{i.qty}</b><button className="btn2" aria-label="Más" disabled={i.qty >= i.stock} onClick={() => setQty(i.productId, i.qty + 1)}>+</button></div>
      <button className="btn2" onClick={() => removeFromCart(i.productId)}>Eliminar</button></div>)}
    <p className="mt-3 text-xl font-extrabold">Total: {fmt(total)}</p></div>
    <div className="card grid gap-3 p-4"><h2 className="font-bold">Datos de despacho</h2>
      <div><label htmlFor="ph">Teléfono (10 dígitos)</label><input id="ph" inputMode="numeric" maxLength={10} value={ph} aria-invalid={!!e.ph} onChange={x => setPh(x.target.value.replace(/\D/g, ''))} />{E('ph')}</div>
      <div><label htmlFor="ad">Dirección completa</label><input id="ad" autoComplete="street-address" value={ad} aria-invalid={!!e.ad} onChange={x => setAd(x.target.value)} />{E('ad')}</div>
      <fieldset><legend className="font-bold">Método de pago (simulado)</legend>{[['card', 'Tarjeta'], ['applepay', 'Apple Pay'], ['googlepay', 'Google Pay']].map(([k, t]) => <label key={k} className="mr-3"><input type="radio" name="pm" checked={m === k} onChange={() => setM(k)} /> {t}</label>)}</fieldset>
      {m === 'card' ? <><div><label htmlFor="cn">Número de tarjeta</label><input id="cn" inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" value={c.n} aria-invalid={!!e.n} onChange={x => setC({ ...c, n: x.target.value })} />{E('n')}</div>
        <div className="grid grid-cols-2 gap-2"><div><label htmlFor="cx">Vence (MM/AA)</label><input id="cx" placeholder="12/28" value={c.x} aria-invalid={!!e.x} onChange={x => setC({ ...c, x: x.target.value })} />{E('x')}</div>
          <div><label htmlFor="cv">CVV</label><input id="cv" type="password" maxLength={4} autoComplete="off" value={c.v} aria-invalid={!!e.v} onChange={x => setC({ ...c, v: x.target.value })} />{E('v')}</div></div>
        <p className="text-xs mut">Prueba: 4242 4242 4242 4242 (aprobada) · terminada en 0002: declinada (402).</p></> : <p className="text-sm mut">Biometría simulada (1.2 s) y token ficticio.</p>}
      <button className="btn" disabled={busy} onClick={confirm}>{busy ? 'Procesando…' : 'Confirmar compra'}</button><p className="text-xs mut">Transacción 100% simulada; sin cargos reales.</p></div></div></>);
}
