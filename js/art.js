/* Phonely · dibujo estilizado de cada móvil (vista trasera).
   Cada móvil tiene un "look" en data/phones.json que define la forma de su cámara.
   Modelos con el mismo diseño real comparten look. Estilo plano, no realista. */
function phoneSVG(p){
  const c = p.color;
  const lum = parseInt(c.slice(1,3),16)*.3 + parseInt(c.slice(3,5),16)*.59 + parseInt(c.slice(5,7),16)*.11;
  const light = lum > 150;
  const mod = light ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.08)';      // isla de cámara
  const modEdge = light ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.14)';
  const look = p.look || 'sq-grid';
  const fold = /Fold|Magic V|Duo/.test(p.name);
  const flip = look === 'flip-full';
  const brandR = {Apple:20, Google:24, Samsung: /Ultra/.test(p.name) ? 8 : 16}[p.brand] ?? 16;

  // cuerpo
  const W = fold ? 112 : 96, x0 = (120 - W)/2, x1 = x0 + W;
  let s = `<rect x="${x0}" y="8" width="${W}" height="204" rx="${flip ? 18 : brandR}" fill="${c}" stroke="#111" stroke-width="2"/>`;
  s += `<rect x="${x0+2}" y="10" width="${W-4}" height="200" rx="${(flip?18:brandR)-2}" fill="none" stroke="#fff" stroke-opacity="${light?.25:.14}" stroke-width="1.2"/>`;
  if (fold) s += `<line x1="60" y1="10" x2="60" y2="210" stroke="#000" stroke-opacity=".22" stroke-width="2"/>`;

  // piezas
  const lens = (x, y, r=9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#1b1b1d" stroke="#6f6f74" stroke-width="${r>7?2.5:2}"/><circle cx="${x-r*.3}" cy="${y-r*.3}" r="${r*.22}" fill="#fff" fill-opacity=".28"/>`;
  const dot = (x, y, r=3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${light?'#d9d2c0':'#e8e2cf'}" fill-opacity=".85"/>`;
  const box = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${mod}" stroke="${modEdge}" stroke-width="1.5"/>`;
  const L = x0 + 10; // margen izquierdo de la cámara

  switch (look){
    case 'apple-plateau':   // iPhone 17 Pro: meseta de lado a lado
      s += box(x0+4, 14, W-8, 64, 16) + lens(L+12, 30) + lens(L+12, 60) + lens(L+36, 45) + dot(x1-20, 30) + dot(x1-20, 58, 4); break;
    case 'apple-bar1':      // iPhone Air: barra horizontal, una cámara
      s += box(x0+4, 14, W-8, 34, 14) + lens(L+12, 31) + dot(L+36, 31) + dot(x1-20, 31, 2.5); break;
    case 'apple-pill2':     // iPhone 16 / 17: píldora vertical
      s += box(L, 14, 28, 62, 14) + lens(L+14, 30) + lens(L+14, 60) + dot(L+40, 26); break;
    case 'apple-tri':       // iPhone Pro (13–16): cuadrado con 3 en triángulo
      s += box(L-2, 14, 58, 58, 16) + lens(L+12, 29) + lens(L+12, 57) + lens(L+38, 43) + dot(L+38, 22, 3.5) + dot(L+38, 64, 3); break;
    case 'apple-diag2':     // iPhone 13–15: 2 en diagonal
      s += box(L-2, 14, 50, 50, 14) + lens(L+11, 27) + lens(L+35, 51) + dot(L+36, 26); break;
    case 'apple-sq2v':      // iPhone 12: 2 en vertical
      s += box(L-2, 14, 46, 52, 14) + lens(L+11, 28) + lens(L+11, 52) + dot(L+32, 28); break;
    case 'apple-single':    // iPhone 16e / SE: una cámara
      s += lens(L+10, 28, 10) + dot(L+28, 24, 2.5); break;
    case 'sam-ultra':       // Galaxy Ultra: 3 grandes en columna + 2 pequeñas
      s += lens(L+10, 28) + lens(L+10, 52) + lens(L+10, 76) + lens(L+32, 30, 6) + dot(L+32, 48) ; break;
    case 'sam-3v':          // Galaxy S: 3 cámaras sueltas en columna
      s += lens(L+10, 28) + lens(L+10, 52) + lens(L+10, 76) + dot(L+28, 28); break;
    case 'pill2v':          // píldora vertical con 2
      s += box(L, 14, 28, 64, 14) + lens(L+14, 30) + lens(L+14, 60) + dot(L+40, 26); break;
    case 'pill3v':          // píldora vertical con 3
      s += box(L, 14, 28, 88, 14) + lens(L+14, 30) + lens(L+14, 56) + lens(L+14, 82) + dot(L+40, 26); break;
    case 'pixel-oval':      // Pixel 9/10: barra ovalada horizontal, 3 cámaras
    case 'pixel-oval2':     // Pixel 9: igual con 2
      s += box(x0+8, 26, W-16, 30, 15) + lens(x0+26, 41, 8) + lens(x0+46, 41, 8) + (look==='pixel-oval'?lens(x0+66, 41, 8):'') + dot(x1-22, 41); break;
    case 'pixel-visor':     // Pixel 8 Pro: visera de lado a lado
    case 'pixel-visor2':
      s += `<rect x="${x0}" y="28" width="${W}" height="26" fill="#1c1c1e" fill-opacity=".85"/>` + lens(x0+22, 41, 8) + lens(x0+42, 41, 8) + (look==='pixel-visor'?lens(x0+62, 41, 8):'') + dot(x1-20, 41); break;
    case 'pixel-a':         // Pixel 9a/10a: plano, píldora pequeña
      s += box(L-2, 22, 46, 24, 12) + lens(L+10, 34, 7) + lens(L+30, 34, 7); break;
    case 'circle-big':      // isla circular grande centrada (Xiaomi Ultra, Vivo, Oppo X8…)
      s += `<circle cx="60" cy="58" r="36" fill="${mod}" stroke="${modEdge}" stroke-width="2"/>` + lens(46, 44) + lens(74, 44) + lens(46, 72) + lens(74, 72) + dot(60, 58, 2.5); break;
    case 'circle-left':     // isla circular a la izquierda (OnePlus 13…)
      s += `<circle cx="${L+26}" cy="46" r="30" fill="${mod}" stroke="${modEdge}" stroke-width="2"/>` + lens(L+14, 36) + lens(L+38, 36) + lens(L+26, 58) + dot(L+60, 26); break;
    case 'sq-grid':         // isla cuadrada con 3 cámaras + flash
      s += box(L-2, 14, 52, 52, 14) + lens(L+11, 28) + lens(L+35, 28) + lens(L+11, 52) + dot(L+35, 52, 4); break;
    case 'sq2':             // isla cuadrada con 2
      s += box(L-2, 14, 46, 52, 12) + lens(L+11, 28) + lens(L+11, 52) + dot(L+32, 28); break;
    case 'squircle-center': // Honor Magic: isla grande centrada
      s += box(30, 16, 60, 60, 24) + lens(46, 32) + lens(74, 32) + lens(46, 60) + lens(74, 60); break;
    case 'nothing-3':       // Nothing Phone (3): cámaras desordenadas + matriz de puntos
      s += lens(x1-22, 28) + lens(x1-44, 44) + lens(x1-20, 58) + Array.from({length:25},(_,i)=>dot(L+14+(i%5)*6, 160+Math.floor(i/5)*6, 1.6)).join(''); break;
    case 'nothing-pill':    // Nothing (3a): píldora horizontal centrada + luces
    case 'nothing-pill-pro':
      s += box(30, 26, 60, 26, 13) + lens(43, 39, 7) + (look==='nothing-pill-pro' ? lens(60, 39, 10) : lens(60, 39, 7)) + lens(77, 39, 7)
         + `<path d="M40 70 Q60 88 80 70" fill="none" stroke="${light?'#111':'#eee'}" stroke-opacity=".35" stroke-width="2"/><rect x="56" y="150" width="8" height="34" rx="4" fill="none" stroke="${light?'#111':'#eee'}" stroke-opacity=".3" stroke-width="2"/>`; break;
    case 'cmf':             // CMF Phone: aro de cámara + tornillos
      s += `<circle cx="${L+16}" cy="40" r="22" fill="${mod}" stroke="${modEdge}" stroke-width="2"/>` + lens(L+16, 30, 8) + lens(L+16, 52, 7)
         + [[x0+8,16],[x1-8,16],[x0+8,204],[x1-8,204]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.5" fill="#111" fill-opacity=".55"/>`).join('')
         + `<circle cx="${x1-18}" cy="194" r="8" fill="none" stroke="#111" stroke-opacity=".5" stroke-width="2"/>`; break;
    case 'sony-strip':      // Xperia 1: franja vertical estrecha
      s += box(L, 12, 18, 76, 9) + lens(L+9, 26, 6.5) + lens(L+9, 48, 6.5) + lens(L+9, 70, 6.5); break;
    case 'sony-strip-h':    // Xperia 10: franja horizontal
      s += box(L, 16, 46, 18, 9) + lens(L+11, 25, 6) + lens(L+33, 25, 6); break;
    case 'flip-full':       // plegables de concha: pantalla exterior grande
      s += `<line x1="${x0}" y1="110" x2="${x1}" y2="110" stroke="#000" stroke-opacity=".3" stroke-width="2"/><rect x="${x0+6}" y="14" width="${W-12}" height="88" rx="14" fill="#141416"/>`
         + lens(x0+20, 30, 8) + lens(x0+20, 54, 8) + `<rect x="${x0+34}" y="70" width="${W-48}" height="5" rx="2.5" fill="#fff" fill-opacity=".18"/><rect x="${x0+34}" y="80" width="${W-62}" height="5" rx="2.5" fill="#fff" fill-opacity=".12"/>`; break;
  }
  return `<svg viewBox="0 0 120 220" aria-hidden="true">${s}</svg>`;
}
