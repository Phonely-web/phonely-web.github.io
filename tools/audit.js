// Auditoría del test: simula TODAS las combinaciones y busca resultados que no tengan sentido.
// Uso: node tools/audit.js [--examples]
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(root, 'js/engine.js'), 'utf8').replace('let PHONES', 'var PHONES').replace(/^const (MAIN_BRANDS|inBrands|fitPct) =/gm, 'var $1 ='));
PHONES = JSON.parse(fs.readFileSync(path.join(root, 'data/phones.json'))).phones.map(p => ({ ...p, fold: /Fold|Flip|Razr|Magic V|Duo/.test(p.name) }));
const EX = process.argv.includes('--examples');

const P2 = arr => { const o = arr.map(x => [x]); for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) o.push([arr[i], arr[j]]); return o; };
const prios = P2(['cam', 'bat', 'perf', 'years']);
const feats = os => ['design', 'clean', 'charge', 'jack', 'repair', 'pen'].filter(f => PHONES.some(p => (os === 'any' || p.os === os) && (p.feat || []).includes(f)));
const brandOpts = [['any'], ['Samsung'], ['Xiaomi'], ['Google'], ['Motorola'], ['OnePlus'], ['other'], ['Samsung', 'Xiaomi'], ['Samsung', 'Google']];
const sizeOK = (p, s) => sizeFit(p, s);

const C = { total: 0, results: 0, notThree: 0, dup: 0, size: 0, budget: 0, dominated: 0, prioGap: 0, cond: 0, os: 0, nondet: 0 };
const ex = {}; const note = (k, a, msg) => { C[k]++; if (EX && (ex[k] = ex[k] || []).length < (k === 'dominated' ? 400 : 6)) ex[k].push(JSON.stringify(a) + ' → ' + msg); };
const seen = {}, PAIRS = {};

for (const budget of [300, 600, 900, 5000]) for (const os of ['ios', 'android', 'any']) for (const brand of (os === 'android' ? brandOpts : [['any']]))
for (const prio of prios) for (const cond of ['new', 'refurb', 'any']) for (const size of ['small', 'mid', 'big', 'fold'])
for (const extra of [['none'], ...P2(feats(os))]) for (const keep of [2, 4, 6]) {
  const a = { budget, os, brand, prio, cond, size, extra, keep };
  const r = recommend(a); C.total++; C.results += r.length;
  if (r.length !== 3) { note('notThree', a, r.length); continue; }
  const r2 = recommend(a); if (r2.map(x => x.p.name).join() !== r.map(x => x.p.name).join()) note('nondet', a, 'distinto en la 2.ª llamada');
  if (new Set(r.map(x => x.p.name)).size !== 3) note('dup', a, 'repetidos');
  if (os !== 'any' && r.some(x => x.p.os !== os)) note('os', a, r.map(x => x.p.name).join(' | '));
  // pool de candidatos posibles con estas respuestas
  const pool = PHONES.filter(p => os === 'any' || p.os === os).map(p => ({ p, pr: priceFor(p, cond) })).filter(x => x.pr);
  const inBudget = pool.filter(x => x.pr.v <= budget * 1.08);
  // tamaño: los 2 primeros deben encajar si hay al menos 2 que encajan y entran en presupuesto
  const fitsSize = inBudget.filter(x => sizeOK(x.p, size) === 2 && (!chosenBrands(a) || inBrands(x.p, chosenBrands(a))));
  if (size !== 'fold' && fitsSize.length >= 2) r.slice(0, 2).forEach(x => { if (sizeOK(x.p, size) === 0) note('size', a, x.p.name + ' (compact ' + x.p.compact + ')'); });
  // presupuesto
  const inBudB = inBudget.filter(x => !chosenBrands(a) || inBrands(x.p, chosenBrands(a)));
  if (inBudget.length >= 3 && inBudB.length >= 2) r.slice(0, inBudB.length >= 3 ? 3 : 2).forEach(x => { if (x.pr.v > budget * 1.08) note('budget', a, x.p.name + ' ' + x.pr.v + ' €'); });
  // dominado: hay otro móvil en el pool, no elegido, igual o mejor en TODO, igual o más barato y del tamaño igual o mejor
  const b = chosenBrands(a);
  if (size !== 'fold') r.slice(0, 2).forEach(x => {
    const q = pool.find(y => !r.some(z => z.p === y.p) && (!b || inBrands(y.p, b) || !inBrands(x.p, b)) && y.pr.v <= x.pr.v && sizeOK(y.p, size) >= sizeOK(x.p, size)
      && ['cam', 'bat', 'perf', 'years'].every(k => y.p[k] >= x.p[k]) && (size !== 'small' || y.p.compact >= x.p.compact) && (size !== 'big' || y.p.compact <= x.p.compact) && (size !== 'mid' || x.p.compact < 6 || y.p.compact >= 6) && extra.every(f => f === 'none' || !(x.p.feat || []).includes(f) || (y.p.feat || []).includes(f))
      && (['cam', 'bat', 'perf', 'years'].some(k => y.p[k] > x.p[k]) || y.pr.v < x.pr.v - 30) && !(x.p.fold && size === 'fold' && !y.p.fold));
    if (q) { note('dominated', a, `${x.p.name} (${x.pr.v} €) superado por ${q.p.name} (${q.pr.v} €)`); PAIRS[x.p.name + ' < ' + q.p.name] = (PAIRS[x.p.name + ' < ' + q.p.name] || 0) + 1; }
  });
  // prioridad: el 1.º no puede estar muy por debajo del mejor disponible en lo que se pidió
  const ps = x => prio.reduce((s, k) => s + x.p[k], 0) / prio.length;
  const cand = inBudget.filter(x => sizeOK(x.p, size) === 2 && (!b || inBrands(x.p, b)));
  if (cand.length >= 3 && extra[0] === 'none') { const best = Math.max(...cand.map(ps)); if (best - ps(r[0]) >= 2) note('prioGap', a, `${r[0].p.name} ${ps(r[0])} vs mejor ${best}`); }
  r.forEach(x => seen[x.p.name] = (seen[x.p.name] || 0) + 1);
}
console.log('Combinaciones', C.total);
for (const k of ['nondet', 'notThree', 'dup', 'os', 'size', 'budget', 'dominated', 'prioGap']) console.log(k.padEnd(10), C[k], ((C[k] / C.total) * 100).toFixed(2) + ' %');
console.log('nunca salen:', PHONES.filter(p => !seen[p.name]).map(p => p.name).join(', ') || 'ninguno');
if (EX) for (const k in ex) { console.log('\n# ' + k); ex[k].forEach(l => console.log('  ' + l)); }

if (EX) console.log('\n# pares dominados más frecuentes\n' + Object.entries(PAIRS).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => '  ' + v + '  ' + k).join('\n'));
