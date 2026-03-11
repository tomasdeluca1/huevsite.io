# Huevsite AI Block Guidelines

Este documento define el propósito, la estructura y las mejores prácticas de uso para los bloques visuales dentro de **huevsite.io**. 
Cualquier Agente IA (como Antigravity o la API de generación de sub-sites) debe usar este contexto para estructurar y extraer información correctamente, garantizando una estética **premium**, concisa y "hacker".

## Filosofía de Diseño
Huevsite no es un currículum aburrido. Es una grilla estilo bento, dinámica y accionable.
- Menos texto, más impacto.
- Usa jerarquía visual: Un bloque gigante atrae más atención que 4 bloques chicos.
- Siempre que sea posible, prefiere métricas crudas (`metric`) o recursos accionables (`project`) por sobre bloques de texto genéricos (`custom`).

---

## Tipos de Bloques y Cuándo Usarlos

### 1. `hero` (La Portada)
- **Propósito**: Es el "Header" del sub-site. Debe contener el nombre del producto/empresa y una propuesta de valor brutal (máximo 2 líneas).
- **Mejores Prácticas**:
  - `title`: Únicamente el nombre principal (ej. "Antigravity").
  - `description`: Tagline certero, no un párrafo de PR (ej. "La IA que programa portfolios en la terminal.").
  - **Ubicación obligatoria**: Debe ser siempre el PRIMER bloque indexado (`order: 0`) para ocupar el top.

### 2. `metric` (Los Números que Hablan)
- **Propósito**: Resaltar estadísticas clave extraídas de la página. (ej. Usuarios activos, Estrellas de GitHub, MRR).
- **Mejores Prácticas**:
  - `label`: Una palabra corta en mayúsculas (ej. "USERS", "STARS", "UPTIME").
  - `value`: El número con impacto visual altísimo (ej. "40k+", "$5M", "99.9%").
  - **Uso Crítico**: Jamás uses un `metric` de relleno o con texto largo.

### 3. `custom` (Información Relevante Compacta)
- **Propósito**: Bloque comodín para Features principales, FAQs, Avisos o Misión.
- **Mejores Prácticas**:
  - `label`: Categoría en mayúsculas (ej. "FEATURE", "FAQ").
  - `title`: Un título muy corto, gancho puro.
  - `description`: Tienen que ser directos. Puedes usar emojis si suma al ambiente "hacker", pero no exageres.
  - `link` (opcional): Si hay un CTA que derive al detalle del feature, agrégalo.

### 4. `building` (Roadmap y Stack)
- **Propósito**: Contarle a la comunidad el proceso técnico o qué se viene. Ideal para productos de software.
- **Mejores Prácticas**:
  - `title`: Usar el nombre de la feature futura o "Tech Stack".
  - `description`: "¿Qué tecnologías usamos bajo el capó?"
  - `stack`: Array de tecnologías. Súper importante poblarlo si la web fuente menciona "React, Tailwind, Supabase", etc.

### 5. `project` (El Call to Action Visual)
- **Propósito**: Destacar un caso de estudio, un link a GitHub interactivo, o un screenshot de la UI con un hipervínculo.
- **Mejores Prácticas**:
  - `title`: Nombre de la acción o proyecto interno.
  - `description`: Qué logra este proyecto.
  - `imageUrl`: **CRÍTICO PARA IAs**: Si de la extracción Jina obtienes formato Markdown `![alt text](https://url-de-imagen.jpg)`, **debes** llenar el parámetro `imageUrl` con esa URL absoluta. Esto es fundamental para darle vida visual al portfolio.
  - `link`: Debe ir a la preview o demo.

---

## Prompt Engineering Tips para LLMs

Si vas a generar un array de bloques en JSON, sigue esta composición ganadora ("Golden Path" de 5-6 bloques):
1. [ `hero` ] (col_span: 2, row_span: 2) -> Fija la identidad.
2. [ `project` ] -> Inyectando la imagen primordial del producto.
3. [ `metric` ] + [ `metric` ] -> Dos cuadritos al lado destacando validación social o performance.
4. [ `custom` ] -> El super-feature que separa a este producto de la competencia.
5. [ `building` ] -> Demostrando a los desarrolladores con qué tecnologías está construido.

**Regla de Oro**: Ningún bloque debe verse sobrecargado. Limita descripciones a máximo 150 caracteres para preservar el formato *bento box*.
