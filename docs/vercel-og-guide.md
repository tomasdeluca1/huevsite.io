# Vercel OG — Condiciones y Límites

## Instalación

- **Next.js App Router**: ya incluye `@vercel/og`. Importar desde `next/og`.
- **Otros frameworks**: instalar `@vercel/og` manualmente y usar Node.js 22+.

```ts
import { ImageResponse } from 'next/og' // App Router
import { ImageResponse } from '@vercel/og' // otros
```

---

## Tamaño de imagen (defaults)

| Propiedad | Valor por defecto |
|-----------|-------------------|
| `width`   | `1200`            |
| `height`  | `630`             |

El output siempre es **PNG**.

---

## Límites

| Límite | Valor |
|--------|-------|
| Bundle máximo (JSX + CSS + fuentes + imágenes) | **500 KB** |
| Runtime soportado | Edge Runtime y Node.js Runtime |

> Si superas los 500 KB, mueve assets a URLs externas y cárgalos en runtime con `fetch`.

---

## CSS soportado

- ✅ `display: flex` (flexbox completo)
- ✅ `position: absolute`
- ✅ Propiedades básicas: `color`, `background`, `padding`, `margin`, `border`, `fontSize`, `fontWeight`, `textAlign`, etc.
- ✅ CSS variables (custom properties) con herencia y fallback
- ✅ Unidades: `px`, `em`, `rem`, `%`
- ❌ `display: grid` — **no soportado**
- ❌ CSS selectors — los estilos deben aplicarse directo al elemento (`style={{ ... }}`)
- ❌ OpenType features avanzadas (kerning, ligatures, `font-feature-settings`)
- ❌ RTL (idiomas de derecha a izquierda)

---

## Fuentes

- **Fuente por defecto incluida**: Noto Sans únicamente.
- **Formatos soportados**: `TTF`, `OTF`, `WOFF` — ❌ WOFF2 no soportado.
- Se pasan como `ArrayBuffer` (web) o `Buffer` (Node.js).
- Soporta múltiples pesos/estilos del mismo nombre para formar una familia tipográfica.

```ts
new ImageResponse(element, {
  fonts: [
    {
      name: 'Inter',
      data: interArrayBuffer,
      weight: 400,
      style: 'normal',
    },
  ],
})
```

---

## JSX / React

- Solo JSX **puro y sin estado**.
- ❌ No se pueden usar: `useState`, `useEffect`, `dangerouslySetInnerHTML`.
- ✅ Se pueden usar componentes funcionales de React sin hooks.

---

## Emojis

Opciones disponibles para el parámetro `emoji`:

```
'twemoji' (default) | 'blobmoji' | 'noto' | 'openmoji' | 'fluent' | 'fluentFlat'
```

---

## Caché (producción)

En producción, `@vercel/og` agrega automáticamente:

```
content-type: image/png
cache-control: public, immutable, no-transform, max-age=31536000
```

En desarrollo usa `no-cache, no-store`.

---

## Caveats por runtime

| Combinación | Limitación |
|---|---|
| Pages Router + Node.js | No soporta `return new Response(...)` |
| App Router + cualquier runtime | Sin restricciones |

---

## robots.txt recomendado

Para que redes sociales puedan indexar la imagen:

```
Allow: /api/og/*
```

---

## API — constructor completo

```ts
new ImageResponse(
  element: ReactElement,
  {
    width?: number          // default: 1200
    height?: number         // default: 630
    emoji?: string          // default: 'twemoji'
    fonts?: FontOption[]
    debug?: boolean         // default: false
    status?: number         // default: 200
    statusText?: string
    headers?: Record<string, string>
  }
)
```
