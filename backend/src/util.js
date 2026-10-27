export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export function luhn(n) {
  if (!/^\d{12,19}$/.test(n)) return false;
  let s = 0, dbl = false;
  for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (dbl) { d *= 2; if (d > 9) d -= 9; } s += d; dbl = !dbl; }
  return s % 10 === 0;
}
export const cardBrand = n =>
  /^4\d{12}(\d{3})?$/.test(n) ? 'VISA' :
  /^(5[1-5]\d{4}|2(2[2-9]\d|[3-6]\d\d|7[01]\d|720)\d{2})\d{10}$/.test(n) ? 'Mastercard' :
  /^3[47]\d{13}$/.test(n) ? 'AMEX' : null;
