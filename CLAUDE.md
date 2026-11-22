# Phonely

Recomendador de móviles: test de 7 preguntas → siempre 3 recomendaciones con enlaces de afiliado.
También tiene un buscador de modelo concreto (ficha + alternativas parecidas).
Web estática publicada con GitHub Pages en https://phonely-web.github.io/ (organización Phonely-web; sin build, sin dependencias).
Repositorio público y anónimo: nada de nombres, correos ni usuarios personales en archivos ni en los commits (se firman como «Phonely»). Los vídeos y el material de marketing están en un repositorio privado aparte.

## Estructura
- `index.html` — página principal.
- `legal.html` — aviso legal, privacidad, cookies y afiliados (solo en español). Versión sin datos personales (proyecto sin ingresos). Antes de activar afiliados o anuncios: el usuario consultará con un gestor y habrá que añadir los datos del titular que exige la LSSI y un correo de contacto.
- `fonts/dmsans.woff` — DM Sans alojada en la propia web (licencia OFL en `fonts/OFL.txt`). No cargar nada de terceros (fuentes, scripts, estadísticas) sin actualizar la política de privacidad y cookies.
- `css/style.css` — diseño Premium.
- `js/i18n.js` — todos los textos, por idioma (es por defecto, en, ca, fr, it, pt).
- `js/engine.js` — lógica de puntuación y recomendación (no tiene textos).
- `js/art.js` — dibujo estilizado de cada móvil según su campo `look` (forma de la cámara). Modelos con el mismo diseño real comparten look.
- `js/app.js` — interfaz, menú de idioma, vistas.
- `data/phones.json` — catálogo de móviles (puntuaciones 1-10, precios nuevo/reacondicionado, color, `look`, `feat`, `priceSource`).
  `priceSource`: `oficial` (PVP oficial en España), `tienda` (precio habitual en tiendas españolas) o `estimado` (sin verificar). Precios nuevos de la generación actual verificados el 21/11/2026.
  `priceRefurb` = precio «desde» de Back Market (estado correcto, capacidad más pequeña, versión más barata), revisado a mano en la web el día de `refurbChecked` (22/11/2026). Si no está en Back Market o sale igual o más caro que nuevo, `priceRefurb: null`. La web lo muestra como «desde · estado correcto, capacidad más pequeña».

## Diseño (no cambiar sin que lo pida el usuario)
- Estilo Premium oscuro: fondo #0A0B0D, texto #E9ECEF, secundario #8C929A, dorado #E3C27A / #B8934A.
- Tipografía DM Sans (300 para titulares grandes, 500-700 para énfasis).
- Móvil 3D flotando, tarjetas con borde fino y ligera inclinación 3D al pasar el ratón.
- Nada de morados/lilas, ni emojis como iconos.
- Respetar `prefers-reduced-motion`, contraste 4.5:1 y botones de 44 px mínimo.

## Reglas
- Cualquier texto nuevo se añade en **todos** los idiomas de `js/i18n.js`.
- Los precios se muestran como rangos de 50 € con la etiqueta «precio orientativo»; nunca precios exactos de Amazon copiados a mano. No afirmar «revisado» si no se ha comprobado.
- El % de encaje es absoluto (`fitPct` en engine.js): refleja lo bien que cumple lo pedido, no la posición.
- La franja «Más de 900 €» no tiene tope (valor 5000).
- No hacer scraping de tiendas. Precios automáticos solo vía APIs oficiales (Amazon Creators API cuando haya ventas) o feeds de redes de afiliados.
- Enlaces de compra con `rel="noopener sponsored"`. Tag de Amazon en `AFFILIATE.amazonTag` (engine.js). Al poner el tag aparece sola la frase obligatoria de Amazon en el pie y en legal.html.
- Siempre devolver 3 recomendaciones: 1 y 2 = las que mejor encajan; 3 = «opción ahorro» (casi igual de buena y ≥15 % más barata) si existe.
- Máximo 2 móviles de la misma marca en el resultado (salvo si eligen iPhone).
- No premiar la relación calidad-precio en la puntuación (decisión del usuario). La marca solo se pregunta a quien elige Android (opcional, hasta 3; los 2 primeros resultados son de esas marcas y la opción ahorro puede ser de otra, avisando).
- No quitar móviles antiguos del catálogo: hay gente que los compra. Cada móvil debe salir en al menos alguna combinación del test.
- Tras cambiar datos o pesos: `node tools/audit.js --examples`. Simula todas las combinaciones (~320.000) y comprueba: mismo resultado siempre, 3 resultados, sistema, tamaño (con `sizeFit`), presupuesto, que ningún resultado esté superado en todo por otro igual o más barato, y que el 1.º no esté muy por debajo en lo pedido. Objetivo: 0 en todo salvo casos límite explicables (marca elegida sin modelos en presupuesto).
  Excepciones conocidas (no salen nunca porque otro igual o más barato los supera en todo; siguen en el buscador): Nothing Phone (4b), Pixel 11 (el 10 Pro al mismo precio), Nothing Phone (3a) Pro.
- El tamaño manda: `sizeFit` (engine.js). «Normal» excluye Max/Ultra y plegables; «Pequeño» pide compact ≥ 7; «Grande», compact ≤ 3. Pasarse del presupuesto (+8 %) pesa aún más que el tamaño.
- «¿Algo especial?» suma poco (+0,1): desempata entre parecidos, no pasa por encima de la prioridad.
- Botón «Enséñame otros 3» en resultados: `recommend(a, exclude)` con los ya vistos; mismas respuestas y mismas reglas. Se ofrece mientras los 2 primeros de la siguiente tanda entren en presupuesto y tamaño (`hasMore`); si no, «No quedan más…». «Volver a los primeros» recupera la primera tanda.
- Selector de capacidad (la más barata / 256 / 512 GB) en resultados y ficha: solo cambia los enlaces de compra (búsqueda con «256 GB»). Nota de SIM física / eSIM junto al reacondicionado.
- En «¿Algo especial?» solo salen opciones que tiene algún móvil del sistema elegido (con iPhone: diseño o nada).
- `feat` de cada móvil (design, clean, charge, jack, repair, pen) alimenta la pregunta «¿Algo especial?».

## Pendiente
- La web aún no está lanzada: `index.html` lleva `noindex, nofollow` para que Google no la indexe. Quitarlo el día del lanzamiento.
- Revisar que cada `look` coincide con el diseño real del móvil al añadir modelos nuevos.
- Verificar precios nuevos con `priceSource: estimado` y repetir la revisión de reacondicionados en Back Market cada mes (los precios cambian a diario).
- Añadir modelos nuevos según salgan (Pixel, iPhone, Galaxy…).
- Darse de alta en Amazon Afiliados y Back Market y poner los enlaces propios.
- Dominio propio (phonely.es / getphonely.com).
- Páginas SEO de comparativas ("mejor móvil calidad-precio 2026", "X vs Y").
