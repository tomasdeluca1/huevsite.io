# huevsite.io

**El portfolio que se arma solo y se ve como si lo hubiera hecho un diseñador caro.**

Red social/portfolio para builders de Argentina y LATAM. Pensado específicamente para devs, designers, founders e indie hackers.

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode, no `any`)
- **Tailwind CSS** (utility-first)
- **Framer Motion** (animaciones)
- **Supabase** (base de datos + auth + storage)
- **dnd-kit** (drag & drop en dashboard)
- **Vercel** (deploy target)

---

## Setup Local

### 1. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 2. Configurar Supabase

#### Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto
2. Anota la **URL** y **anon key** de tu proyecto

#### Aplicar schema de base de datos
Ejecutá el siguiente SQL en el SQL Editor de Supabase (Settings → Database → SQL Editor):

```sql
-- Ejecutar supabase/schema.sql
```

Copiá y pegá todo el contenido de `supabase/schema.sql`.

#### Configurar Storage
También ejecutá `supabase/storage.sql` en el SQL Editor para crear el bucket de assets.

### 3. Configurar variables de entorno

Creá un archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Configurar GitHub OAuth en Supabase

1. Ve a **Authentication** → **Providers** en Supabase
2. Habilitá el provider de **GitHub**
3. Creá una GitHub OAuth App en [github.com/settings/developers](https://github.com/settings/developers):
   - **Homepage URL**: `http://localhost:3000` (dev) o tu dominio (prod)
   - **Authorization callback URL**: `https://tu-proyecto.supabase.co/auth/v1/callback`
4. Copiá el **Client ID** y **Client Secret** en Supabase

### 5. Ejecutar migraciones (si ya tenés datos)

Si ya tenés una DB con datos viejos, ejecutá:

```sql
-- Ejecutar supabase/migrations/001_update_schema.sql
```

### 6. Correr el proyecto

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del proyecto

```
app/
├── (marketing)/
│   └── page.tsx          ← Landing page
├── login/page.tsx        ← Login con GitHub / Email
├── onboarding/page.tsx   ← Flujo de onboarding (5 pasos)
├── dashboard/page.tsx    ← Editor de perfil con drag & drop
├── [username]/page.tsx   ← Perfil público (SSR)
└── api/
    ├── username/check/   ← Verificar disponibilidad de username
    ├── github/import/    ← Importar datos de GitHub
    ├── profile/          ← CRUD de perfil
    └── blocks/           ← CRUD de bloques

components/
├── onboarding/           ← Componentes del onboarding (YA COMPLETOS)
├── blocks/               ← 9 tipos de bloques para el huevsite grid
├── dashboard/            ← UI del editor (drag & drop, modals, etc.)
└── profile/
    └── ProfileGrid.tsx   ← Renderiza el huevsite grid público

lib/
├── supabase/
│   ├── client.ts         ← Cliente de Supabase (browser)
│   └── server.ts         ← Cliente de Supabase (server components)
├── profile-types.ts      ← Tipos de bloques y perfil
├── profile-service.ts    ← Helpers para fetch de perfiles
└── onboarding-types.ts   ← Estado del onboarding

supabase/
├── schema.sql            ← Schema completo (profiles + blocks)
├── storage.sql           ← Configuración de Storage
└── migrations/
    └── 001_update_schema.sql  ← Migración para actualizar schema existente
```

---

## Flujo de usuario

### 1. **Login** (`/login`)
- GitHub OAuth o Email magic link
- Redirect a `/welcome` si no tiene perfil

### 2. **Onboarding** (`/onboarding`)
- 5 pasos:
  1. Elegir roles (developer, designer, founder, indie_hacker)
  2. Conectar GitHub (opcional, importa repos y actividad)
  3. Elegir layout del huevsite (dev_heavy, founder_heavy, minimal, creative)
  4. Elegir color de acento
  5. Elegir username (con validación real-time)
- Al finalizar → POST a `/api/profile/create`
- Redirect a `/dashboard`

### 3. **Dashboard** (`/dashboard`)
- Editor con drag & drop (dnd-kit)
- Sidebar con:
  - URL pública del perfil
  - Selector de color
  - Agregar bloques
- Canvas con huevsite grid editable
- **Autosave con debounce de 1.5s**
- Botón "Ver perfil" abre tab nueva con `/[username]`

### 4. **Perfil público** (`/[username]`)
- SSR con `generateStaticParams`
- ProfileGrid renderiza todos los bloques visibles
- OG image dinámica generada con Vercel OG
- No requiere autenticación

---

## Tipos de bloques

El huevsite grid soporta 9 tipos de bloques:

1. **hero** — Avatar, nombre, rol, tagline, tags
2. **building** — Proyecto actual que estás haciendo
3. **github** — Stats de GitHub (repos, commits, heatmap, top repos)
4. **project** — Proyecto destacado (imagen, descripción, métricas)
5. **stack** — Tecnologías que usás (grid de iconos)
6. **metric** — Métrica importante (GitHub stars, MRR, usuarios, etc.)
7. **social** — Links a redes sociales
8. **community** — Comunidades de las que participás
9. **writing** — Posts que escribiste (dev.to, Mirror, Substack, etc.)

Cada bloque tiene:
- `type`: uno de los 9 tipos
- `order`: posición en el grid
- `col_span`: 1-4 (ancho)
- `row_span`: 1-3 (alto)
- `data`: contenido específico del bloque (JSON)
- `visible`: boolean

---

## API Endpoints

### Authentication
- Manejado por Supabase Auth
- GitHub OAuth + Email magic link

### `/api/username/check?u=username`
- **GET** — Verifica disponibilidad de username
- Valida regex: `/^[a-z0-9_]{3,20}$/`
- Devuelve: `{ available: boolean, suggestions?: string[] }`

### `/api/github/import`
- **GET** — Importa datos de GitHub del usuario autenticado
- Usa `provider_token` de la sesión de Supabase
- Devuelve: repos, lenguajes, heatmap de commits, top repos

### `/api/profile/create`
- **POST** — Crea perfil después del onboarding
- Body: `{ username, accentColor, layout, roles, githubHandle?, blocks? }`
- Crea perfil + bloques iniciales si se proveen

### `/api/profile`
- **GET** — Obtiene perfil del usuario autenticado
- **PATCH** — Actualiza perfil (name, tagline, accent_color, layout, etc.)

### `/api/blocks`
- **POST** — Crea nuevo bloque

### `/api/blocks/[id]`
- **PATCH** — Actualiza bloque
- **DELETE** — Elimina bloque

### `/api/blocks/reorder`
- **POST** — Reordena múltiples bloques (usado por drag & drop)
- Body: `Array<{ id: string, order: number }>`

---

## Design System

### Color Tokens
```css
--bg: #080808;
--surface: #111111;
--surface2: #1a1a1a;
--border: #222222;
--border-bright: #333333;
--accent: #C8FF00;        /* default; cada usuario tiene el suyo */
--text: #f0f0f0;
--text-muted: #666666;
--text-dim: #999999;
```

### Radii
```css
--radius-sm: 8px;
--radius: 14px;
--radius-lg: 20px;
--radius-xl: 28px;
```

### Fonts
- **Display**: 'Bricolage Grotesque', sans-serif
- **Mono**: 'JetBrains Mono', monospace

### Grid
- **Huevsite Grid**: 4 columnas en desktop, 2 en tablet, 1 en mobile (< 640px)
- **Spacing**: Grid de 8pt

---

## Microcopy (español rioplatense)

Algunos ejemplos del microcopy usado:

- Empty state proyectos: _"Este bloque está más vacío que el INDEC."_
- Empty state GitHub: _"¿Estás buildando o pensando en buildear?"_
- Onboarding bienvenida: _"Buenas. Armémonos el perfil que merecés."_
- Username tomado: _"Ese ya lo agarraron. Probá {username}_dev"_
- Perfil publicado: _"¡Salió! Compartilo, twitealo, mandáselo a Palermo Valley."_
- 404 de perfil: _"Este username está más vacío que el INDEC."_
- Autosave: _"Guardado · hace un momento"_
- Error de red: _"Algo falló. Nos pasa a todos. Reintentá."_

---

## Deploy a Vercel

1. Push a GitHub
2. Importá el repo en Vercel
3. Configurá las **Environment Variables** (las 3 de `.env.local`)
4. Deploy!

Vercel va a detectar automáticamente Next.js y configurar todo.

---

## Features implementadas

✅ Autenticación con GitHub OAuth + Email
✅ Onboarding completo (5 pasos)
✅ Username check con validación real-time
✅ Importación de datos de GitHub (repos, stats, heatmap)
✅ Dashboard con drag & drop
✅ Autosave con debounce (1.5s)
✅ 9 tipos de bloques para el huevsite grid
✅ Perfiles públicos con SSR
✅ OG images dinámicas
✅ Responsive mobile (grid colapsa a 1 columna)
✅ TypeScript estricto (sin `any`)
✅ Animaciones con Framer Motion

---

## TODOs / Próximos pasos

- [ ] Error boundaries en componentes críticos
- [ ] Tests (Jest + React Testing Library)
- [ ] Implementar GitHub import real en StepGitHub (actualmente mock)
- [ ] Supabase Storage integration para upload de imágenes
- [ ] Rate limiting en API routes
- [ ] Analytics tracking
- [ ] SEO optimization
- [ ] PWA (manifest + service worker)
- [ ] Dark mode toggle (actualmente solo dark)
- [ ] Exportar perfil a PDF

---

## Contribuir

Pull requests bienvenidos. Para cambios grandes, abrí primero un issue para discutir.

---

## Licencia

MIT — Hacé lo que quieras con esto 🇦🇷
