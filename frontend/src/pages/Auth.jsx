import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../ctx';
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function Form({ reg }) {
  const { login, toast } = useApp(), nav = useNavigate(), [v, setV] = useState({ name: '', email: '', password: '' }), [e, setE] = useState({});
  const F = ({ k, label, type = 'text', ac }) => <div><label htmlFor={k}>{label}</label><input id={k} type={type} autoComplete={ac} value={v[k]} aria-invalid={!!e[k]} onChange={x => setV({ ...v, [k]: x.target.value })} />{e[k] && <p className="err" role="alert">{e[k]}</p>}</div>;
  async function submit(ev) {
    ev.preventDefault(); const er = {};
    if (reg && !v.name.trim()) er.name = 'Este campo es obligatorio.';
    if (!v.email.trim()) er.email = 'Este campo es obligatorio.'; else if (!EMAIL.test(v.email)) er.email = 'Ingresa un correo electrónico válido.';   // CP-AUTH01/02
    if (!v.password) er.password = 'Este campo es obligatorio.'; else if (reg && v.password.length < 8) er.password = 'Mínimo 8 caracteres.';
    setE(er); if (Object.keys(er).length) return;
    try { if (reg) { await api('/auth/register', { method: 'POST', body: v }); toast('Cuenta creada. Inicia sesión.'); nav('/login'); } else login(await api('/auth/login', { method: 'POST', body: v })); }
    catch (x) { setE({ [x.status === 409 ? 'email' : 'password']: x.message }); }
  }
  return (<div className="card mx-auto max-w-md p-6"><h1 className="mb-3 text-xl font-extrabold">{reg ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
    <form onSubmit={submit} noValidate className="grid gap-3">{reg && <F k="name" label="Nombre" ac="name" />}<F k="email" label="Correo electrónico" type="email" ac="email" /><F k="password" label="Contraseña" type="password" ac={reg ? 'new-password' : 'current-password'} /><button className="btn">{reg ? 'Registrarme' : 'Ingresar'}</button></form>
    <p className="mt-3 text-sm"><Link className="underline" to={reg ? '/login' : '/registro'}>{reg ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}</Link></p></div>);
}
export const Login = () => <Form />; export const Register = () => <Form reg />;
