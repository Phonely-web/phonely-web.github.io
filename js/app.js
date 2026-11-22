/* Phonely · interfaz (diseño Premium) */
const $ = s => document.querySelector(s);
const state = { view:'hero', step:0, ans:{}, recs:null };
let lang = 'es', T = STRINGS.es;

/* ---------- idioma ---------- */
function pickInitialLang(){
  const url = new URLSearchParams(location.search).get('lang');
  let saved = null; try { saved = localStorage.getItem('phonely-lang'); } catch(e){}
  const nav = (navigator.language||'es').slice(0,2);
  return [url, saved, nav, 'es'].find(c => c && STRINGS[c]);
}
function setLang(code){
  lang = code; T = STRINGS[code];
  try { localStorage.setItem('phonely-lang', code); } catch(e){}
  document.documentElement.lang = code;
  document.title = T.metaTitle;
  document.querySelector('meta[name="description"]').setAttribute('content', T.metaDesc);
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = T[el.dataset.t]);
  document.getElementById('amazonNote').hidden = !AFFILIATE.amazonTag;
  document.querySelectorAll('[data-tp]').forEach(el => el.placeholder = T[el.dataset.tp]);
  $('#langCode').textContent = code.toUpperCase();
  $('#langList').innerHTML = LANGS.map(l => `<li><button type="button" role="option" data-code="${l.code}" aria-current="${l.code===code}">${l.name}<small>${l.code}</small></button></li>`).join('');
  $('#langList').querySelectorAll('button').forEach(b => b.onclick = () => { setLang(b.dataset.code); closeMenu(); });
  if (state.view==='quiz') renderQuestion();
  if (state.view==='results') renderResults();
  if (state.view==='model') renderModel();
}
const closeMenu = () => { $('#lang').classList.remove('open'); $('#langBtn').setAttribute('aria-expanded','false'); };
$('#langBtn').onclick = (e) => { e.stopPropagation(); const o = $('#lang').classList.toggle('open'); $('#langBtn').setAttribute('aria-expanded', o); };
document.addEventListener('click', e => { if (!$('#lang').contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key==='Escape') closeMenu(); });

const fmtDate = iso => new Date(iso+'T12:00:00').toLocaleDateString(lang, {day:'numeric', month:'short', year:'numeric'});

/* ---------- vistas ---------- */
function show(id){
  state.view = id;
  ['hero','quiz','results','model'].forEach(x => $('#'+x).style.display = x===id ? (x==='hero'?'grid':'block') : 'none');
}
let timer;
function startShowcase(){
  const names = ['iPhone 17 Pro','Pixel 10 Pro','Galaxy S25 Ultra','Nothing Phone (3)','Galaxy Z Flip7'];
  const list = names.map(n => PHONES.find(p => p.name===n)).filter(Boolean);
  let i = 0;
  const paint = () => { const p = list[i++ % list.length]; $('#heroDevice').innerHTML = phoneSVG(p); $('#pill').textContent = p.name; };
  paint(); timer = setInterval(paint, 2600);
}
function tilt(el){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches) return;
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX-r.left)/r.width-.5, y = (e.clientY-r.top)/r.height-.5; el.style.transform = `rotateY(${x*10}deg) rotateX(${-y*10}deg) translateZ(6px)`; });
  el.addEventListener('pointerleave', () => el.style.transform = '');
}

/* ---------- test ---------- */
const Q = () => QUESTIONS[state.step];
const visible = () => QUESTIONS.map((q,i)=>i).filter(i => !QUESTIONS[i].showIf || QUESTIONS[i].showIf(state.ans));
const isOn = v => { const s = state.ans[Q().key]; return Q().multi ? (s||[]).includes(v) : s===v; };
// Opciones visibles: en «¿Algo especial?» solo las que tiene algún móvil del sistema elegido (p. ej. nada de «Android limpio» con iPhone)
const optsFor = q => q.vals.map((v,i)=>i).filter(i => q.key!=='extra' || q.vals[i]===q.exclusive
  || PHONES.some(p => (state.ans.os==='any' || !state.ans.os || p.os===state.ans.os) && (p.feat||[]).includes(q.vals[i])));
const canNext = () => { const s = state.ans[Q().key]; return Q().multi ? (s||[]).length>0 : s!==undefined; };

function startQuiz(){ clearInterval(timer); $('#pill').textContent = T.pill; state.step = 0; state.ans = {}; show('quiz'); renderQuestion(); }

function renderQuestion(){
  const q = Q(), tq = T.q[state.step], vis = visible(), n = vis.indexOf(state.step);
  $('#prog').style.width = ((n+1)/vis.length*100)+'%';
  $('#qbody').innerHTML = `<div class="qwrap rise">
    <div><div class="step">${T.stepOf.replace('{n}', n+1).replace('{t}', vis.length)}</div><h2>${tq.title}</h2><p class="hint">${tq.hint}</p></div>
    <div><div class="grid">${optsFor(q).map((i,k)=>[q.vals[i],i,k]).map(([v,i,k])=>`<button class="tile opt" data-i="${i}" aria-pressed="${isOn(v)}"><span class="n">0${k+1}</span><b>${tq.opts[i][0]}</b><small>${tq.opts[i][1]}</small><span class="ck"></span></button>`).join('')}</div>
    <div class="nav">${n>0?`<button class="ghost" id="back">${T.back}</button>`:'<span></span>'}${q.multi?`<button class="go" id="next" ${canNext()?'':'disabled'}>${T.cont}</button>`:''}</div></div></div>`;
  document.querySelectorAll('.tile').forEach(b => { b.onclick = () => pick(+b.dataset.i); tilt(b); });
  if ($('#back')) $('#back').onclick = () => { const v = visible(); state.step = v[v.indexOf(state.step)-1]; renderQuestion(); };
  if ($('#next')) $('#next').onclick = next;
}
function pick(i){
  const q = Q(), v = q.vals[i];
  if (q.multi){
    let a = state.ans[q.key]||[];
    if (v===q.exclusive) a = a.includes(v) ? [] : [v];
    else { a = a.filter(x=>x!==q.exclusive); a = a.includes(v) ? a.filter(x=>x!==v) : [...a, v]; if (a.length>q.multi) a.shift(); }
    state.ans[q.key] = a; refreshPicks();
  }
  else {
    if (state.moving) return; state.moving = true;
    state.ans[q.key] = v; refreshPicks();
    if (q.key==='os' && state.ans.extra){ const ok = optsFor(QUESTIONS.find(x=>x.key==='extra')).map(j=>QUESTIONS.find(x=>x.key==='extra').vals[j]); state.ans.extra = state.ans.extra.filter(x=>ok.includes(x)); if (!state.ans.extra.length) delete state.ans.extra; }
    setTimeout(() => { state.moving = false; next(); }, 180);
  }
}
// Marca la selección sin volver a pintar la pregunta (evita el parpadeo)
function refreshPicks(){
  const q = Q();
  document.querySelectorAll('#qbody .tile').forEach(b => b.setAttribute('aria-pressed', isOn(q.vals[+b.dataset.i])));
  if ($('#next')) $('#next').disabled = !canNext();
}
function next(){
  if (!canNext()) return;
  const v = visible(), at = v.indexOf(state.step);
  if (at < v.length-1){ state.step = v[at+1]; renderQuestion(); }
  else { state.seen = []; state.recs = recommend(state.ans); show('results'); renderResults(); window.scrollTo({top:0}); }
}

/* ---------- resultados ---------- */
function profileTags(){
  const tags = [];
  QUESTIONS.forEach((q,i) => {
    const a = state.ans[q.key];
    if (q.key==='keep') return;
    if (q.key==='extra' && (a||[]).includes('none')) return;
    if (q.key==='brand' && (state.ans.os!=='android' || (a||[]).includes('any'))) return;
    (Array.isArray(a) ? a : [a]).forEach(v => { const j = q.vals.indexOf(v); if (j>=0) tags.push(T.q[i].opts[j][0]); });
  });
  return tags;
}
function shop(p, t){
  const L = shopLinks(p, state.storage);
  return `<div class="shop" data-n="${p.name}" data-t="${t||''}">${L.refurb?`<a class="${t==='refurb'?'main':''}" href="${L.refurb}" target="_blank" rel="noopener sponsored">${T.seeRefurb}</a>`:''}${L.amazon?`<a class="${t==='new'?'main':''}" href="${L.amazon}" target="_blank" rel="noopener sponsored">${T.seeAmazon}</a>`:''}</div>`;
}
const cond = t => t==='new' ? T.isNew : `${T.isRefurb} · ${T.from} · ${T.refurbBase}`;
// Selector de capacidad: solo cambia los enlaces de compra (sin volver a pintar nada)
function storagePicker(){
  const opts = [['', T.storageMin], ['256','256 GB'], ['512','512 GB']];
  return `<div class="stor" role="group" aria-label="${T.storage}"><span>${T.storage}</span>${opts.map(([v,l])=>`<button type="button" data-s="${v}" aria-pressed="${(state.storage||'')===v}">${l}</button>`).join('')}</div>`;
}
function bindStorage(root){
  root.querySelectorAll('.stor button').forEach(b => b.onclick = () => {
    state.storage = b.dataset.s;
    root.querySelectorAll('.stor button').forEach(x => x.setAttribute('aria-pressed', x===b));
    root.querySelectorAll('.shop[data-n]').forEach(s => { const p = PHONES.find(x=>x.name===s.dataset.n); if (p) s.outerHTML = shop(p, s.dataset.t); });
  });
}

function renderResults(){
  const recs = state.recs, [r1, ...rest] = recs, a = state.ans; state.seen = state.seen || [];
  const more = hasMore(a, state.seen.concat(recs.map(r=>r.p.name)));
  const why = (r, n) => reasonsFor(r.p, a, r.pr, T).slice(0, n).map(x=>`<li class="${x.con?'con':''}">${x.t}</li>`).join('');
  $('#results').innerHTML = `
    <div class="rtop rise"><div class="eyebrow">${state.seen.length ? T.moreTitle : T.yourResult}</div><h2 style="margin-top:12px">${T.resA}<b>${T.resB}</b></h2>
      <div class="chips">${profileTags().map(t=>`<span>${t}</span>`).join('')}</div>${storagePicker()}${recs.note?`<p class="fb">${T[recs.note]}</p>`:''}${recs.brandNote?`<p class="fb">${T[recs.brandNote]}</p>`:''}</div>
    <div class="hero-r">
      <div class="stage rise"><div class="device" style="position:relative"><div class="halo" style="background:${r1.p.color}"></div>${phoneSVG(r1.p)}</div><div class="floor"></div></div>
      <article class="card rise" style="animation-delay:.1s">
        <div class="rank">${T.best} <span class="ring" style="--p:${r1.pct}"><span>${r1.pct}%</span></span></div>
        <h3>${r1.p.name}</h3>
        <div class="price"><b>${range(r1.pr.v)}</b><span>${cond(r1.pr.t)} · ${T.reviewed.replace('{d}', fmtDate(REVIEWED))}</span></div>
        <ul class="why">${why(r1, 4)}</ul>
        <div class="bars">${['cam','bat','perf','years'].map(k=>`<div>${T.labels[k]} · ${r1.p[k]}/10<i style="--w:${r1.p[k]*10}%"></i></div>`).join('')}</div>
        ${r1.saving?`<p class="save">${r1.pr.t==='new'?T.saveNew:T.saveRefurb} <b>${r1.saving} €</b></p>`:''}
        ${shop(r1.p, r1.pr.t)}
        ${r1.p.priceRefurb?`<p class="note">${T.refurbMore} ${T.simNote}</p>`:''}
      </article>
    </div>
    <div class="others">${rest.map((r,i)=>`<article class="card mini rise" style="animation-delay:${.2+i*.08}s">${phoneSVG(r.p)}<div>
      <div class="rank">${r.saver?T.saver:(i===0?T.alt:T.also)} · ${r.pct}%</div><h4>${r.p.name}</h4>
      ${r.saver?`<p class="saver">${T.saverTxt.replace('{x}', Math.round(r.saver/10)*10)}</p>`:''}${r.outside&&!recs.brandNote?`<p class="outside">${T.outside}</p>`:''}
      <div class="price"><b style="font-size:20px">${range(r.pr.v)}</b><span>${cond(r.pr.t)}</span></div>
      <ul class="why">${why(r, 2)}</ul>${shop(r.p, r.pr.t)}</div></article>`).join('')}</div>
    <div class="more">${more ? `<p>${T.moreHint}</p><button class="outline" id="more">${T.more}</button>` : `<p>${T.noMore}</p>`}${state.seen.length ? `<button class="link" id="first">${T.backFirst}</button>` : ''}</div>
    <div class="again"><button class="ghost" id="again">${T.again}</button></div>`;
  $('#again').onclick = startQuiz; bindStorage($('#results'));
  if ($('#more')) $('#more').onclick = () => { state.seen = state.seen.concat(recs.map(r=>r.p.name)); state.recs = recommend(a, state.seen); renderResults(); window.scrollTo({top:0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); };
  if ($('#first')) $('#first').onclick = () => { state.seen = []; state.recs = recommend(a); renderResults(); window.scrollTo({top:0}); };
}

/* ---------- buscador de modelo ---------- */
const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
function findPhone(q){
  const n = norm(q); if (!n) return null;
  return PHONES.find(p => norm(p.name)===n) || PHONES.find(p => norm(p.name).endsWith(n)) || PHONES.find(p => norm(p.name).includes(n));
}
function openModel(){
  const p = findPhone($('#find').value);
  if (!p){ $('#findMsg').textContent = T.notFound; return; }
  $('#findMsg').textContent = ''; state.model = p; clearInterval(timer); $('#pill').textContent = T.pill; show('model'); renderModel(); window.scrollTo({top:0});
}
function renderModel(){
  const p = state.model, tier = k => { const v=p[k], R=T.r[k]; if (k==='cam') return v>=9?R[0]:v>=8?R[1]:v>=6?R[2]:R[3]; return v>=9?R[0]:v>=7?R[1]:R[2]; };
  const cap = t => t.charAt(0).toUpperCase()+t.slice(1);
  const keys = ['cam','bat','perf','years'];
  const good = keys.filter(k => p[k]>=7).map(k => cap(tier(k))).concat((p.feat||[]).map(f => T.r.feat[f]));
  const bad = keys.filter(k => p[k]<=6).map(k => cap(tier(k)));
  const L = shopLinks(p);
  $('#model').innerHTML = `
    <button class="ghost" id="home">${T.home}</button>
    <div class="hero-r">
      <div class="stage rise"><div class="device" style="position:relative"><div class="halo" style="background:${p.color}"></div>${phoneSVG(p)}</div><div class="floor"></div></div>
      <article class="card rise">
        <div class="rank">${p.brand}</div><h3>${p.name}</h3>
        <div class="prices">${p.priceNew?`<div><span>${T.priceNew}</span><b>${range(p.priceNew)}</b></div>`:''}${p.priceRefurb?`<div><span>${T.priceRefurb} · ${T.from}</span><b>${range(p.priceRefurb)}</b><small>${T.refurbBase}</small></div>`:''}</div>
        <div class="bars">${keys.map(k=>`<div>${T.labels[k]} · ${p[k]}/10<i style="--w:${p[k]*10}%"></i></div>`).join('')}</div>
        <h5>${T.strengths}</h5><ul class="why">${good.map(t=>`<li>${t}</li>`).join('')}</ul>
        <h5>${T.weakTitle}</h5><ul class="why">${bad.length?bad.map(t=>`<li class="con">${t}</li>`).join(''):`<li class="con">${T.noWeak}</li>`}</ul>
        ${storagePicker()}
        ${shop(p, p.priceRefurb?'refurb':'new')}
        ${p.priceRefurb?`<p class="note">${T.refurbMore} ${T.simNote}</p>`:''}
      </article>
    </div>
    <h2 class="sim-t">${T.similar}</h2>
    <div class="others three">${similarTo(p).map(q=>`<button class="card mini pick" data-n="${q.name}">${phoneSVG(q)}<div><div class="rank">${q.brand}</div><h4>${q.name}</h4>
      <div class="price"><b style="font-size:18px">${range(Math.min(...[q.priceNew,q.priceRefurb].filter(Boolean)))}</b></div></div></button>`).join('')}</div>
    <div class="again"><button class="go" id="toTest">${T.takeTest}</button></div>`;
  $('#home').onclick = () => { show('hero'); startShowcase(); };
  $('#toTest').onclick = startQuiz; bindStorage($('#model'));
  document.querySelectorAll('.pick').forEach(b => b.onclick = () => { state.model = PHONES.find(x=>x.name===b.dataset.n); renderModel(); window.scrollTo({top:0}); });
}

/* ---------- arranque ---------- */
(async () => {
  setLang(pickInitialLang());
  await loadPhones();
  document.querySelectorAll('.n').forEach(e => e.textContent = PHONES.length);
  startShowcase();
  $('#start').onclick = startQuiz;
  $('#models').innerHTML = PHONES.map(p=>`<option value="${p.name}">`).join('');
  $('#findForm').onsubmit = e => { e.preventDefault(); openModel(); };
})();
