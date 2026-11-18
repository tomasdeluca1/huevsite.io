// Recortes a mano para fotos de perfil que se muestran en la landing, cuando la
// cara queda chica o fuera del cuadrado (fotos verticales de cuerpo entero).
// Rect en píxeles de la imagen original; se aplica con el precrop del proxy.
export const LANDING_AVATAR_CROP: Record<string, { x: number; y: number; size: number }> = {
  raafaromera: { x: 10, y: 5, size: 110 },
};

export function proxiedAvatar(src: string, username: string, px: number): string {
  const crop = LANDING_AVATAR_CROP[username.toLowerCase()];
  const rect = crop ? `&cx=${crop.x}&cy=${crop.y}&cw=${crop.size}&ch=${crop.size}&precrop=true` : "";
  return `https://images.weserv.nl/?url=${encodeURIComponent(src)}${rect}&w=${px}&h=${px}&fit=cover&output=webp`;
}
