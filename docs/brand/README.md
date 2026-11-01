# La marca de huevsite.io

El momento que la marca tiene que ganar es un link pasando por el timeline de
alguien que no conoce el producto: en segundo y medio tiene que entenderse qué
es huevsite y dar ganas de entrar. Todo lo que está acá abajo existe para eso.

huevsite son dos caras del mismo producto: una **red de builders** donde se
hacen contactos, y un **link in bio lindo que puede usar cualquiera** —no solo
devs—. El score es lo único del mundo builder que ven los dos públicos.

La dirección visual es **aire editorial con señales de consola**: una frase
grande, nada de cajas, mucho negro, y el mono y el lima ácido como puntuación.

## Dónde viven los valores

`lib/brand.ts` es la fuente de verdad. El CSS no puede importar TypeScript, así
que `app/globals.css` repite los mismos valores como custom properties y
`scripts/verify-brand-tokens.js` falla si las dos caras se separan. Las imágenes
OG (`lib/og/shared.tsx`) importan la tabla directamente.

Para cambiar un valor: se cambia en `lib/brand.ts`, se cambia en `:root` de
`app/globals.css`, y `npm run verify` dice si quedó algo suelto.

## Color

| Token | Valor | Para qué |
|---|---|---|
| `--bg` | `#050505` | El fondo de todo. El negro de la marca. |
| `--surface` | `#0E0E0F` | Tarjetas y bloques sobre el fondo. |
| `--surface2` | `#171718` | Lo que se apoya sobre una tarjeta. |
| `--border` | `#202022` | La línea de 1px. Nunca una sombra. |
| `--border-bright` | `#303033` | El borde cuando algo está activo o en hover. |
| `--accent` | `#C8FF00` | El lima. Uno solo, y nada más que uno. |
| `--accent-dim` | `rgba(200, 255, 0, 0.12)` | Fondo de una pastilla de acento. |
| `--accent-mid` | `rgba(200, 255, 0, 0.3)` | Su borde. |
| `--slate` | `#4A4949` | El gris del isotipo. Lo que evita que el lima grite solo. |
| `--text` | `#f0f0f0` | Texto normal. |
| `--text-strong` | `#ffffff` | Titulares. |
| `--text-dim` | `#D1D1D1` | Texto secundario. |
| `--text-muted` | `#888888` | Etiquetas y metadatos. |
| `--red` | `#FF3B3B` | Error. Semántico, no decorativo. |
| `--blue` | `#4D9FFF` | Información. |
| `--purple` | `#A855F7` | Categorías del producto. |
| `--orange` | `#FF7A00` | Aviso. |

La rampa de grises sube parejo: 9, 9, 9 y 16 puntos. Si se agrega un escalón,
mantiene el paso.

**El acento del usuario.** Adentro de su perfil, el color que eligió el usuario
pisa `--accent`, `--accent-dim` y `--accent-mid` con un `<style>` por página. Eso
es deliberado y no se toca: la marca manda en todo lo que es huevsite (home, OG
de la home, mails, loader, pie de los perfiles), y el usuario manda adentro de lo
suyo.

## Tipografía

**Bricolage Grotesque** para todo lo que se lee, **JetBrains Mono** para
etiquetas. El mono se usa de `--fs-label` para abajo —eyebrows, URLs, métricas— y
nunca para texto corrido: eso es lo que hace que la marca se lea "solo para
devs".

| Token | Valor | Para qué |
|---|---|---|
| `--fs-display` | `clamp(40px, 7vw, 72px)` | La frase de una pieza: hero, OG. |
| `--fs-h1` | `clamp(30px, 5vw, 46px)` | Título de página. |
| `--fs-h2` | `clamp(22px, 3.4vw, 30px)` | Título de sección. |
| `--fs-h3` | `20px` | Título de tarjeta. |
| `--fs-body` | `16px` | Texto. |
| `--fs-sm` | `14px` | Texto secundario. |
| `--fs-label` | `12px` | Etiquetas. Acá empieza el mono. |
| `--fs-micro` | `10px` | Metadatos, URLs al pie. |

## Radios y ritmo

`--radius-sm: 8px`, `--radius: 14px`, `--radius-lg: 20px`, `--radius-xl: 28px`.
El ritmo de las secciones de la landing sale de `--section-y` y `--section-x`,
que ya son responsivos: no se escriben paddings a mano.

## El logo

| Archivo | Qué es |
|---|---|
| `public/logo-huevsite.png` | El lockup: isotipo + wordmark, 983×240, con alfa. |
| `public/icons/icon-32.png` | El isotipo cuadrado, para la pestaña del navegador. |
| `public/icons/icon-192.png`, `icon-512.png` | El isotipo cuadrado, para la PWA. |
| `app/icon.png` | Lo mismo, por la convención de archivos de Next. |

Reglas:

- **Se mide por el alto** (`h-6 w-auto`), nunca por el ancho.
- **Siempre el mismo archivo**: se usa `components/brand/Logo.tsx`, no se escribe
  el nombre con la fuente.
- **Siempre en el mismo lugar** dentro de cada tipo de pieza, para que dos links
  seguidos se reconozcan como de la misma casa.
- En los mails va como `<img>` con URL absoluta y `alt`, que es lo que se lee
  cuando el cliente bloquea imágenes.

No hay vector. Todos los archivos salen de `scripts/build-brand-assets.js`, que
rasteriza el lockup. Si algún día aparece el SVG, se cambia el script.

## Las siete reglas

1. **Un acento y uno solo.** `#C8FF00` sobre negro. El acento del usuario manda
   adentro de su perfil; la marca manda en todo lo demás. En la OG de un perfil,
   el color del usuario entra como detalle, nunca como fondo.
2. **Cero glow en las superficies de marca.** Sin halos, sin sombras de color,
   sin degradés radiales. Adentro del perfil publicado de un usuario no se toca
   nada.
3. **El mono es para etiquetas.** Nunca texto corrido.
4. **Una frase por pieza.** Un titular grande, un subtítulo y un pie. Lo que no
   entra en esa estructura es otra pieza.
5. **El logo siempre en el mismo lugar y siempre el mismo archivo.**
6. **Negro `#050505`.** Las superficies suben de a un escalón; los bordes son
   línea, no sombra.
7. **Nada de íconos como contenido en piezas generadas.** Si la pieza se
   rasteriza (OG, badges), el texto tiene que ser texto con fuente embebida.
