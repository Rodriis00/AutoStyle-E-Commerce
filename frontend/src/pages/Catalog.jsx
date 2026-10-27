import { useEffect, useState } from 'react';
import { api } from '../api';
import { getPref } from '../lib';
import ProductCard from '../components/ProductCard';
const grid = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';
export default function Catalog() {
  const [f, setF] = useState({ q: '', category: '', brand: '', maxPrice: '', minRating: '' }), [list, setList] = useState([]), [recs, setRecs] = useState([]), [meta, setMeta] = useState({ categories: [], brands: [] }), [sug, setSug] = useState([]);
  useEffect(() => { api('/filters').then(setMeta); api('/recommendations?cats=' + encodeURIComponent(getPref().join(','))).then(setRecs).catch(() => {}); }, []);
  useEffect(() => { const id = setTimeout(() => { api('/products?' + new URLSearchParams(Object.entries(f).filter(([, v]) => v))).then(setList); api('/products/suggest?q=' + encodeURIComponent(f.q)).then(setSug); }, 250); return () => clearTimeout(id); }, [f]);
  const set = k => e => setF({ ...f, [k]: e.target.value }), recTitle = getPref().length ? 'Recomendados para ti' : 'Mejor calificados';
  const S = ({ k, label, opts }) => <div><label className="text-sm" htmlFor={k}>{label}</label><select id={k} value={f[k]} onChange={set(k)}>{opts}</select></div>;
  return (<>
    <h1 className="text-2xl font-extrabold">Accesorios para personalizar y proteger tu auto</h1>
    <section className="my-6"><h2 className="mb-2 font-bold">{recTitle}</h2><div className={grid}>{recs.map(p => <ProductCard key={p.id} p={p} />)}</div></section>
    <section className="card mb-4 grid grid-cols-2 gap-3 p-4 md:grid-cols-5">
      <div className="col-span-2 md:col-span-1"><label className="text-sm" htmlFor="q">Buscar</label><input id="q" list="dl" value={f.q} onChange={set('q')} placeholder="Ej. tapetes" /><datalist id="dl">{sug.map(s => <option key={s} value={s} />)}</datalist></div>
      <S k="category" label="Categoría" opts={<><option value="">Todas</option>{meta.categories.map(c => <option key={c}>{c}</option>)}</>} />
      <S k="brand" label="Marca" opts={<><option value="">Todas</option>{meta.brands.map(c => <option key={c}>{c}</option>)}</>} />
      <S k="maxPrice" label="Precio máx." opts={[['', 'Sin límite'], [300, '$300'], [500, '$500'], [800, '$800']].map(([v, t]) => <option key={v} value={v}>{t}</option>)} />
      <S k="minRating" label="Rating mín." opts={[['', 'Cualquiera'], [3, '3★ o más'], [4, '4★ o más'], [5, '5★']].map(([v, t]) => <option key={v} value={v}>{t}</option>)} />
    </section>
    <section className={grid}>{list.map(p => <ProductCard key={p.id} p={p} />)}{!list.length && <p className="mut">Sin resultados para tu búsqueda.</p>}</section></>);
}
