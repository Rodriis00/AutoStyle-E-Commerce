import pg from 'pg';
pg.types.setTypeParser(1700, parseFloat); // NUMERIC -> number
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const q = (text, params) => pool.query(text, params);
/** Transacción ACID: BEGIN / COMMIT / ROLLBACK con el mismo cliente. */
export async function tx(fn) {
  const c = await pool.connect();
  try { await c.query('BEGIN'); const out = await fn(c); await c.query('COMMIT'); return out; }
  catch (e) { await c.query('ROLLBACK'); throw e; }
  finally { c.release(); }
}
