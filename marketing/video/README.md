# Video promocional

Pieza de 45 segundos para la nominación a PremiosTech.la (Comunidad). No forma parte de la app: tiene su propio `package.json` y no se despliega.

Dos composiciones Remotion, el mismo guion:

- `Vertical` — 1080×1920
- `Landscape` — 1920×1080

Sin audio.

## Datos

`scripts/snapshot.mjs` lee solo páginas públicas:

- `GET https://huevsite.io/api/explore` (directorio, 316 perfiles con username)
- `GET https://huevsite.io/{username}` (proyectos, stack, ubicación)
- `GET https://huevsite.io/builders-de-la-semana`
- `GET https://huevsite.io/api/launches`

Escribe `data/snapshot.json` y avatares en `public/avatars`. No toca la base.

El conteo en pantalla es **+300 builders**. El pie mono muestra el total real del directorio.

La semana en curso del feed (`/api/launches`) volvió vacía. Builders Hunt usa la última semana que el endpoint público todavía devuelve, con la semana escrita en pantalla.

## Render

```bash
cd marketing/video
npm install
npm run snapshot   # opcional, refresca el JSON
npm run render:vertical
npm run render:landscape
```

Tipografía embebida (SIL Open Font License): Bricolage Grotesque 800 y JetBrains Mono. El logo, el isotipo y los laureles son los archivos de marca, no se redibujan.
