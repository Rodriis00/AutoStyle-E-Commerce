import app from './app.js';
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) { console.error('Faltan JWT_SECRET o DATABASE_URL (copia .env.example a .env).'); process.exit(1); }
app.listen(process.env.PORT || 4000, () => console.log(`AutoStyle API en http://localhost:${process.env.PORT || 4000}`));
