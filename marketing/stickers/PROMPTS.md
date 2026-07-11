# Calcos huevsite.io — pack de prompts (IA) + pliego para cortar

Personaje = **el huevo de tu referencia** (`reference.png` en esta carpeta): huevo
blanco cartoon, contorno negro grueso, ojitos negros + sonrisa, bracitos cortos,
estilo sticker die-cut. 15 calcos cuadrados (1:1), listos para imprimir en grilla
y cortar recto.

---

## 0) Cómo usarlo (leé esto primero)

1. **Referencia de personaje (clave para consistencia).** Cargá `reference.png`
   como *image reference* en tu herramienta para que el huevo salga igual en los 15:
   - **Midjourney:** `--cref <url de reference.png> --cw 100` (character reference).
   - **GPT-Image / ChatGPT:** adjuntá `reference.png` y pedí "mismo personaje, mismo estilo".
   - **Flux / Nano-Banana (Gemini):** usá reference.png como imagen de entrada / IP-adapter.
2. **Pegá el BLOQUE DE ESTILO** (sección 1) al principio de **cada** prompt, después
   la escena puntual (sección 3).
3. **Formato:** cuadrado **1:1**, exportá a **≥1500 px** (ideal 2048) para imprimir
   nítido a 300 DPI en 5×5 cm.
4. **Guardá** cada resultado como `sticker-01.png` … `sticker-15.png` en esta carpeta
   y renderizá el pliego (`sheet.html` → PDF, sección 4).

> ⚠️ **El texto es el punto débil de la IA.** Suele escribir mal. Dos caminos:
> **(a)** generá 3-4 variantes por calco y elegí la que deletree bien; o
> **(b) recomendado:** generá el huevo/escena **sin texto** y avisame — te compongo
> el texto (Bricolage/JetBrains reales) + el wordmark encima, nítido, en el pliego.
> Así el huevo lo pone la IA y el texto lo pongo yo perfecto.

---

## 1) BLOQUE DE ESTILO (pegar en todos los prompts)

```
Flat 2D vector sticker illustration, die-cut style, thick clean black outlines,
minimal flat shading, high contrast. Mascot character: a cute plump EGG — smooth
matte WHITE egg body (wide rounded bottom, tapered top), bold even black outline,
two simple black dot eyes and a small friendly curved smile, tiny short
black-outlined stub arms. Kawaii, friendly, modern tech-startup mascot, same
character as the reference. Palette = only 3 colors: white, black, and bright lime
green #C8FF00 (huevsite brand accent). No gradients, no photorealism, no 3D, no
noise. Clean, playful, premium sticker. Small 4-point lime sparkles as accents.
Square 1:1, centered, generous padding, thin rounded sticker border.
```

**Negativos (si tu tool los soporta):**
`photorealistic, 3D render, gradients, drop shadows overload, clutter, blurry,
extra/garbled text, misspelling, watermark, low contrast`

**Nota de color:** el verde de marca es **lima `#C8FF00`**. Tu referencia usaba un
verde pasto más suave (~`#35A935`); si el lima te sale demasiado neón al imprimir,
cambiá el hex por ese verde en el bloque de estilo. El huevo va **blanco** siempre.

**Wordmark:** cuando el calco lo pida, "huevsite.io" en sans-serif bold, con
`huevsite` en negro (o blanco sobre fondo oscuro) y `.io` en lima.

---

## 2) Fondos por calco (para que el pliego respire)

Mezcla de fondo **blanco** (mayoría) y **negro** (los "dark"): así en la hoja se
alternan y quedan lindos. Cada prompt aclara su fondo.

---

## 3) Los 15 prompts

> Formato de cada uno: `[BLOQUE DE ESTILO] +` la escena. El **texto entre comillas
> es literal** (respetá tildes y mayúsculas).

**01 · Hero — thumbs up (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The egg smiling, giving a thumbs-up with one
little arm. Top: bold wordmark "huevsite.io" ('.io' in lime). Under it, smaller:
"Build in public." and below "Get recognized." with "Get recognized." in lime.
One lime sparkle top-right.
```

**02 · Terminal — Build/Ship/Share/Grow (fondo negro)**
```
[BLOQUE DE ESTILO] Black background, coding/terminal mood. The white egg sitting
next to a dark laptop that shows a tiny lime droplet logo. On the left, a monospace
list, each line starting with a lime ">": "> Build." "> Ship." "> Share." "> Grow.".
Bottom: "huevsite.io" ('.io' lime, rest white). Crisp, correctly spelled text.
```

**03 · Ship it — rocket (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The happy egg riding a lime-green cartoon
rocket with a small orange flame, motion streaks and lime sparkles. Big bold text
top-left: "Ship" in black and "it." in lime, stacked. Small "huevsite.io" bottom.
```

**04 · Verified Builder — badge (fondo negro)**
```
[BLOQUE DE ESTILO] Black background. A centered lime-green SHIELD badge with a white
circular checkmark at the top, a small ribbon banner reading "VERIFIED" and, big
under it, "BUILDER". Under the shield, "huevsite.io" in white. A tiny white egg
peeking from behind the bottom of the shield. Emblem, symmetric.
```

**05 · Mostrá lo que buildeás — sunglasses (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The cool egg wearing black sunglasses, doing a
thumbs-up. Bold text top-left, three lines: "Mostrá" "lo que" "buildeás." with
"buildeás." in lime. "huevsite.io" bottom-left. One lime sparkle.
```

**06 · Builder Score — dashboard card (fondo blanco)**
```
[BLOQUE DE ESTILO] White background, a clean minimal SaaS dashboard CARD with thin
light borders. Top row: small wordmark "huevsite.io" and a little white egg avatar
inside a lime rounded square. Label "Builder Score" and a big lime number "8,742",
with a rising lime line chart trending up to the right. No clutter.
```

**07 · Building my future — sign (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The egg holding a black rectangular sign over
its head with both little arms; the sign reads "BUILDING" (white) on top and
"MY FUTURE" (lime) below. Small motion lines around the egg. "huevsite.io" small
bottom.
```

**08 · From idea to impact — lightbulb (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The egg looking up at a glowing lime lightbulb
with little rays. Big bold text on the left, three lines: "From" "idea" "to impact."
with "impact." in lime. "huevsite.io" bottom-left.
```

**09 · Build today / legacy (fondo negro)**
```
[BLOQUE DE ESTILO] Black background. The egg in a thoughtful pose, tiny hand near its
chin, one lime sparkle. White bold text, three lines: "Build today." "Inspire
tomorrow." "Leave a legacy." with "legacy." in lime. "huevsite.io" bottom-left.
```

**10 · Less setup, more building — laptop </> (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The egg working at a dark laptop, with a small
lime speech bubble containing "</>". Bold text on the right/below: "Less setup."
and "More building.". "huevsite.io" bottom.
```

**11 · Top Builder of the Week — laurel (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. Two symmetric lime-green laurel branches framing
centered bold black text "Top" "Builder", and under it a lime pill with white text
"OF THE WEEK". Under the laurel, "huevsite.io". Award badge, symmetric, tiny egg
optional in a corner.
```

**12 · Keep building, keep growing — round seal (círculo)**
```
[BLOQUE DE ESTILO] A round lime-green circular seal/badge. In the center, the white
egg winking and doing a peace sign. Curved white text around the ring: "KEEP
BUILDING" on the top arc, "KEEP GROWING" on the bottom arc. Circular sticker.
```

**13 · Me dicen huevo — wink (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The egg winking and smiling, thumbs-up. Bold
text on the left, two lines: "Me dicen" (black) and "huevo." (lime). Small
"huevsite.io" bottom.
```

**14 · Build your world — globe (fondo lima/verde)**
```
[BLOQUE DE ESTILO] Solid lime-green (#C8FF00) background. The white egg winking and
pointing next to a stylized green-and-white planet/globe with a tiny white flag on
top. White bold text top-left, two lines: "Build your world." "Build in public.".
"huevsite.io" in white, bottom-left.
```

**15 · Seguimos buildeando — speech bubble (fondo blanco)**
```
[BLOQUE DE ESTILO] White background. The happy egg doing a thumbs-up next to a black
rounded speech bubble that reads "Seguimos" (white) and "buildeando." (lime).
"huevsite.io" bottom. One lime sparkle.
```

### Extras opcionales (por si querés más de 15)
- "Ideas + Acción = Reputación" (huevo señalando, `=` y "Reputación" en lima).
- "Construyendo en público. Para el futuro." (banderita verde pixel-art en una loma).
- "Leí hoy en el newsletter de huevsite." (huevo saliendo de un sobre verde;
  pie `huevsite.beehiiv.com`).
- Solo el **wordmark** `huevsite.io` grande (calco limpio de marca).
- Solo el **huevo** guiñando (die-cut del personaje, sin texto).

---

## 4) Pliego para imprimir y cortar recto

`sheet.html` arma una hoja **A4** con una grilla **3×5 de cuadrados de 5,5 cm**
(los 15), con **líneas de corte** rectas para guillotina/trincheta.

1. Guardá las imágenes como `sticker-01.png` … `sticker-15.png` en esta carpeta
   (cuadradas, ≥1500 px).
2. Renderizá el PDF listo para imprimir:
   ```bash
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless=new --disable-gpu --no-pdf-header-footer \
     --print-to-pdf="calcos-huevsite-A4.pdf" \
     "file://$PWD/sheet.html"
   ```
3. Imprimí en papel autoadhesivo A4 (mate o glossy), al **100% / tamaño real**
   (sin "ajustar a página"), y cortá por las líneas.

Mientras no existan las imágenes, el pliego muestra celdas numeradas (01–15) para
que veas el layout de corte. Cuando quieras te lo genero en otros tamaños (círculos
para los redondos, 4×4, etc.) o te compongo el texto encima de los huevos.
