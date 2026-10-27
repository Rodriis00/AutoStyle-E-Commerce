export const fmt = n => '$' + Number(n).toLocaleString('es-MX') + ' MXN';
export const stars = n => n ? '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)) + ' ' + n.toFixed(1) : 'Sin reseñas';
export const luhn = n => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return n.length >= 12 && s % 10 === 0; };
export const brand = n => /^4\d{12}(\d{3})?$/.test(n) ? 'VISA' : /^(5[1-5]\d{4}|2(2[2-9]\d|[3-6]\d\d|7[01]\d|720)\d{2})\d{10}$/.test(n) ? 'Mastercard' : /^3[47]\d{13}$/.test(n) ? 'AMEX' : null;
/** Cookie as_nav_pref (RN-08): últimas 5 categorías, SameSite=Lax; Secure; SIN HttpOnly (la lee el cliente). */
export function getPref() {
  try { const m = document.cookie.match(/(?:^|; )as_nav_pref=([^;]*)/); if (m) return JSON.parse(decodeURIComponent(m[1])); } catch {}
  try { return JSON.parse(localStorage.getItem('as_nav_pref')) ?? []; } catch { return []; }
}
export function setPref(cat) {
  const a = [cat, ...getPref().filter(x => x !== cat)].slice(0, 5), v = JSON.stringify(a);
  document.cookie = `as_nav_pref=${encodeURIComponent(v)};path=/;max-age=2592000;SameSite=Lax;Secure`;
  try { localStorage.setItem('as_nav_pref', v); } catch {}
}
