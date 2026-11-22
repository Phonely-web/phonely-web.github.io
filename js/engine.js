/* Phonely · motor de recomendación (independiente del idioma) */
let PHONES = [], REVIEWED = '';

const QUESTIONS = [
  {key:'budget', vals:[300, 600, 900, 5000]},
  {key:'os',     vals:['ios', 'android', 'any']},
  {key:'brand',  vals:['any', 'Samsung', 'Xiaomi', 'Google', 'Motorola', 'OnePlus', 'other'], multi:3, exclusive:'any', showIf: a => a.os==='android'},
  {key:'prio',   vals:['cam', 'bat', 'perf', 'years'], multi:2},
  {key:'cond',   vals:['new', 'refurb', 'any']},
  {key:'size',   vals:['small', 'mid', 'big', 'fold']},
  {key:'extra',  vals:['design', 'clean', 'charge', 'jack', 'repair', 'pen', 'none'], multi:2, exclusive:'none'},
  {key:'keep',   vals:[2, 4, 6]},
];

async function loadPhones(){
  const res = await fetch('data/phones.json');
  const data = await res.json();
  REVIEWED = data.reviewed;
  PHONES = data.phones.map(p => ({...p, fold: /Fold|Flip|Razr|Magic V|Duo/.test(p.name)}));
}

const range = v => { const lo = Math.floor(v/50)*50; return lo + '–' + (lo+50) + ' €'; };

function priceFor(p, cond){
  const n = p.priceNew && {v:p.priceNew, t:'new'}, r = p.priceRefurb && {v:p.priceRefurb, t:'refurb'};
  if (cond==='new') return n || null;
  if (cond==='refurb') return r || null;
  if (n && r) return (n.v - r.v < 90) ? n : r;
  return n || r || null;
}

/* Encaje de tamaño: 2 = encaja, 1 = se acerca, 0 = no encaja.
   compact: 1 = gigante (Max/Ultra), 2-3 = grande habitual (6,6-6,8"), 6-8 = normal (6,1-6,3"), 9-10 = pequeño / plegable de concha */
function sizeFit(p, size){
  if (size==='small') return p.compact>=7 && !p.fold ? 2 : (p.compact>=6 || p.fold && p.compact>=9) ? 1 : 0;
  if (size==='mid')   return p.compact===1 || p.fold ? 0 : p.compact>=9 ? 1 : 2;
  if (size==='big')   return p.compact<=3 && !p.fold ? 2 : p.compact<=6 ? 1 : 0;
  return p.fold ? 2 : 0;
}
function scorePhone(p, a, pr){
  const w = {cam:1, bat:1, perf:1, years:1, compact:0};
  (a.prio||[]).forEach(k => w[k] = 4.5);
  if (a.size==='small') w.compact = 3;
  if (a.keep===6) w.years += 1.5;
  if (a.keep===2) w.years = Math.max(.5, w.years-.5);
  let num=0, den=0;
  for (const k in w){ if (k==='compact' && a.size!=='small') continue; num += p[k]*w[k]; den += 10*w[k]; }
  let s = num/den;
  // el tamaño pedido manda: lo que no encaja cae al final
  if (a.size==='fold') s += p.fold ? .25 : -.35;
  else { const f = sizeFit(p, a.size); s -= f===0 ? .5 : f===1 ? .08 : 0; }
  if (a.size==='big') s += (10-p.compact)/10*0.05;
  if (a.size==='mid' && p.compact<=4) s -= .02; // a igualdad, mejor el de tamaño normal de verdad
  if (pr.v > a.budget*1.08) s -= .7 + (pr.v/a.budget - 1);
  else if (pr.v > a.budget) s -= .03;
  // «algo especial» desempata entre parecidos, no pasa por encima de lo importante
  (a.extra||[]).forEach(f => { if (f!=='none') s += (p.feat||[]).includes(f) ? .1 : 0; });
  return s - pr.v*1e-6; // solo desempata: a igualdad exacta, el más barato
}

/* Razones en el idioma activo (T = textos del idioma) */
function reasonsFor(p, a, pr, T){
  const tier = (k) => {
    const v = p[k], R = T.r[k];
    if (k==='cam') return v>=9?R[0]:v>=8?R[1]:v>=6?R[2]:R[3];
    return v>=9?R[0]:v>=7?R[1]:R[2];
  };
  const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
  const out = [], pri = a.prio||[];
  pri.forEach(k => out.push({t:cap(tier(k)), con:p[k]<6}));
  if (a.size==='small' && p.compact>=8) out.push({t: p.fold ? T.r.smallFold : T.r.small});
  if (a.size==='big' && p.compact<=3) out.push({t:T.r.big});
  if (a.size==='fold' && p.fold) out.push({t:T.r.fold});
  (a.extra||[]).forEach(f => { if ((p.feat||[]).includes(f)) out.splice(pri.length, 0, {t:T.r.feat[f]}); });
  const weak = ['bat','cam','perf','years'].filter(k=>!pri.includes(k)).sort((x,y)=>p[x]-p[y])[0];
  if (weak && p[weak] <= 6){ const s = tier(weak); out.push({t:T.r.watch + s.charAt(0).toLowerCase() + s.slice(1), con:true}); }
  if (pr.v > a.budget) out.push({t:T.r.over, con:true});
  return out.slice(0,4);
}

/* % de encaje absoluto: refleja lo bien que cumple lo pedido, no la posición */
const fitPct = s => Math.max(30, Math.min(99, Math.round(30 + (s - .3) / (1.25 - .3) * 69)));

const MAIN_BRANDS = ['Samsung', 'Xiaomi', 'Google', 'Motorola', 'OnePlus'];
/* Marcas elegidas (solo cuentan si eligió Android). Devuelve null si le da igual. */
function chosenBrands(a){
  if (a.os!=='android') return null;
  const b = (a.brand||[]).filter(x => x!=='any');
  return b.length ? b : null;
}
const inBrands = (p, b) => !b || b.includes(p.brand) || (b.includes('other') && !MAIN_BRANDS.includes(p.brand));

/* Siempre devuelve 3 recomendaciones:
   1 y 2 = las que mejor encajan (de sus marcas, si ha elegido) · 3 = "opción ahorro" (casi igual de buena y bastante más barata, de cualquier marca)
   Máximo 2 de la misma marca, salvo si eligió iPhone o una sola marca. */
function hasMore(a, exclude){
  const r = recommend(a, exclude);
  return r.length===3 && r.slice(0,2).every(x => x.pr.v <= a.budget*1.08 && (a.size==='fold' ? x.p.fold : sizeFit(x.p, a.size) === 2) && (a.os==='any' || x.p.os===a.os));
}
// exclude: nombres ya enseñados (botón «Enséñame otros 3»)
function recommend(a, exclude = []){
  const pool = (cond, os) => PHONES.filter(p => (os==='any' || p.os===os) && !exclude.includes(p.name))
    .map(p => { const pr = priceFor(p, cond); return pr && {p, pr, s:scorePhone(p, a, pr)}; }).filter(Boolean);
  const fits = pl => pl.filter(r => r.pr.v <= a.budget*1.08).length >= 3;
  let note = '', list = pool(a.cond, a.os);
  if (!fits(list)){ const alt = pool('any', a.os); if (fits(alt) || list.length < 3){ list = alt; note = a.cond==='new' ? 'noteNoNew' : a.cond==='refurb' ? 'noteNoRefurb' : ''; } }
  if (list.length < 3) list = pool('any', 'any');
  if (list.length < 3) return Object.assign([], {note:'', brandNote:''});
  list.sort((x,y)=>y.s-x.s);

  const b = chosenBrands(a);
  const mine = list.filter(r => inBrands(r.p, b));
  let brandNote = '';
  if (b && mine.filter(r => r.pr.v <= a.budget*1.08).length < 2) brandNote = 'noteBrand';

  const cap = (a.os==='ios' || (b && b.length===1 && b[0]!=='other')) ? 3 : 2, brands = {}, picked = [];
  const ok = r => (brands[r.p.brand]||0) < cap;
  const take = r => { brands[r.p.brand] = (brands[r.p.brand]||0)+1; picked.push(r); };
  // 1 y 2: de sus marcas y dentro de presupuesto si es posible
  const first = brandNote ? list : mine;
  for (const r of first){ if (picked.length===2) break; if (ok(r)) take(r); }
  for (const r of list){ if (picked.length===2) break; if (!picked.includes(r) && ok(r)) take(r); }
  // 3: opción ahorro (cualquier marca)
  const ref = picked[0];
  const savers = list.filter(r => !picked.includes(r) && ok(r) && r.s >= ref.s - .15 && r.pr.v <= ref.pr.v*.85 && r.pr.v <= a.budget*1.08)
                     .sort((x,y)=> (y.s + .3*(1 - y.pr.v/ref.pr.v) + (inBrands(y.p,b)?.04:0)) - (x.s + .3*(1 - x.pr.v/ref.pr.v) + (inBrands(x.p,b)?.04:0)));
  if (savers.length){ const sv = savers[0]; sv.saver = ref.pr.v - sv.pr.v; take(sv); }
  for (const r of mine){ if (picked.length===3) break; if (!picked.includes(r) && ok(r)) take(r); }
  for (const r of list){ if (picked.length===3) break; if (!picked.includes(r) && ok(r)) take(r); }
  for (const r of list){ if (picked.length===3) break; if (!picked.includes(r)) take(r); }

  const out = picked.map((r,i) => ({...r,
    outside: !!b && !inBrands(r.p, b),
    pct: fitPct(r.s),
    saving: (r.p.priceNew && r.p.priceRefurb) ? Math.round((r.p.priceNew - r.p.priceRefurb)/10)*10 : 0 }));
  out.note = note; out.brandNote = brandNote;
  return out;
}

/* Buscador: móviles parecidos (mismo sistema, precio cercano, mejor equilibrados) */
function similarTo(p){
  const price = x => Math.min(...[x.priceNew, x.priceRefurb].filter(Boolean));
  const base = price(p), tot = x => x.cam + x.bat + x.perf + x.years;
  return PHONES.filter(q => q!==p && q.os===p.os && Math.abs(price(q)-base) <= base*.3)
    .sort((x,y)=> tot(y)-tot(x) || price(x)-price(y)).slice(0,3);
}

/* Enlaces de tienda (añadir aquí el tag de afiliado cuando lo tengas) */
const AFFILIATE = { amazonTag: '' };
// storage: '' = la más barata; '256' / '512' = busca directamente esa capacidad
function shopLinks(p, storage){
  const q = encodeURIComponent(p.name + (storage ? ' ' + storage + ' GB' : ''));
  return {
    refurb: p.priceRefurb ? 'https://www.backmarket.es/es-es/search?q='+q : null,
    amazon: p.priceNew ? 'https://www.amazon.es/s?k='+q + (AFFILIATE.amazonTag ? '&tag='+AFFILIATE.amazonTag : '') : null,
  };
}
