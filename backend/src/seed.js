import fs from 'fs';
import bcrypt from 'bcrypt';
import { pool, q } from './db.js';
await q(fs.readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
await q(`INSERT INTO users(name,email,password_hash,role) VALUES ('Administrador','admin@autostyle.mx',$1,'adm'),('Cliente Demo','cliente@autostyle.mx',$2,'cli')`,
  [await bcrypt.hash('Admin1234', 12), await bcrypt.hash('Cliente1234', 12)]);
const P = [['Iluminación LED','Tira LED interior RGB 5m','Lumix',349,25,'💡'],['Iluminación LED','Faros LED H7 (par)','Lumix',899,12,'🔦'],['Iluminación LED','Luces de piso ambientales','NeonCar',529,0,'✨'],
 ['Tapetes','Tapetes uso rudo 4 pzas','RudoMat',799,18,'🟫'],['Tapetes','Tapete de cajuela 3D','RudoMat',459,9,'🧰'],['Organizadores','Organizador de cajuela plegable','TrunkPro',389,30,'📦'],
 ['Organizadores','Organizador de asiento trasero','TrunkPro',299,14,'🎒'],['Fundas','Funda ergonómica de volante','ComfyDrive',219,40,'🛞'],['Fundas','Fundas de asiento universales','ComfyDrive',1190,7,'💺'],['Fundas','Cubre auto impermeable','ShieldX',649,5,'🚗']];
for (const c of new Set(P.map(p => p[0]))) await q('INSERT INTO categories(name) VALUES($1)', [c]);
for (const [c, n, b, pr, s, e] of P) await q('INSERT INTO products(category_id,name,brand,price,stock,emoji) VALUES((SELECT id FROM categories WHERE name=$1),$2,$3,$4,$5,$6)', [c, n, b, pr, s, e]);
const { rows: [o] } = await q(`INSERT INTO orders(user_id,status,total,phone,address,payment_method,payment_ref) VALUES(2,'ENTREGADO',799,'5512345678','Av. Té 950, Iztacalco, CDMX','card','VISA •••• 4242') RETURNING id`);
await q(`INSERT INTO order_items(order_id,product_id,name,unit_price,qty) VALUES($1,4,'Tapetes uso rudo 4 pzas',799,1)`, [o.id]);
console.log('Base de datos lista. Admin: admin@autostyle.mx / Admin1234 · Cliente: cliente@autostyle.mx / Cliente1234');
await pool.end();
