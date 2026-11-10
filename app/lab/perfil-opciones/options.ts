export const LAB_OPTIONS = [
  {
    id: "a",
    letra: "A",
    nombre: "Tira bajo el nombre",
    linea:
      "Seguidores, siguiendo, nominaciones y score en una sola línea bajo el nombre, con badges chicos de ícono y tooltip.",
  },
  {
    id: "b",
    letra: "B",
    nombre: "Cinta superior",
    linea:
      "Badges y Builder de la Semana suben a una cinta fina arriba del header, y las stats viajan en esa misma cinta.",
  },
  {
    id: "c",
    letra: "C",
    nombre: "Cajón Logros",
    linea:
      "Un chip Logros abre un panel con badges, la semana ganada, nominaciones y score. Cerrado, el perfil queda limpio.",
  },
  {
    id: "d",
    letra: "D",
    nombre: "Columna lateral",
    linea:
      "Stats y logros en una columna al costado en desktop, y en una sección debajo del perfil en el celular.",
  },
  {
    id: "e",
    letra: "E",
    nombre: "Sello y pie",
    linea:
      "Un sello chico de Builder de la Semana sobre el avatar, y la fila de badges con las stats en el pie del perfil.",
  },
  {
    id: "f",
    letra: "F",
    nombre: "Botón flotante",
    linea:
      "Un botón flotante Logros, sobre todo en el celular, que no le saca lugar al perfil hasta que lo tocás.",
  },
] as const;

export type LabOptionId = (typeof LAB_OPTIONS)[number]["id"];

export function isLabOption(value: string | undefined): value is LabOptionId {
  return LAB_OPTIONS.some((option) => option.id === value);
}
