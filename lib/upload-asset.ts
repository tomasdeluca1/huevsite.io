import { optimizeImage } from "@/lib/image-utils";

// Tope de tamaño. La UI dice "5MB" pero las fotos de celular suelen pesar más;
// 15MB cubre fotos grandes y videos cortos sin dejar pasar archivos enormes.
const MAX_BYTES = 15 * 1024 * 1024;

// Formatos de imagen que el browser SÍ renderiza tal cual (si falla la
// optimización a webp, podemos subir el original sin que quede invisible).
const RENDERABLE_IMAGE = /^image\/(jpeg|jpg|png|webp|gif|avif)$/i;

/**
 * Sube un archivo al bucket `assets` y devuelve su public URL.
 *
 * - Imágenes (no gif): se optimizan a webp. Si la optimización falla (HEIC u
 *   otro formato que el browser no decodifica), caemos al archivo original si es
 *   renderable; si no, tiramos un error claro para que el usuario lo vea.
 * - Videos / PDFs / gif: se suben tal cual.
 * - Tira Error con mensaje legible en castellano ante cualquier fallo, así el
 *   componente lo muestra en vez de tragárselo en silencio.
 */
export async function uploadAsset(
  supabase: any,
  file: File,
  folder = "general"
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB. El máximo es 15MB.`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Tu sesión expiró. Recargá la página e iniciá sesión de nuevo.");
  }

  let uploadData: Blob | File = file;
  let contentType = file.type || "application/octet-stream";
  let finalName = file.name || "archivo";

  const isImage = file.type.startsWith("image/");
  const isGif = file.type.includes("gif");

  if (isImage && !isGif) {
    try {
      uploadData = await optimizeImage(file);
      contentType = "image/webp";
      const base = file.name.split(".").slice(0, -1).join(".") || "img";
      finalName = `${base}.webp`;
    } catch (err) {
      // No se pudo optimizar. Si el original es un formato renderable, lo subimos
      // igual; si no (HEIC/HEIF), avisamos para que convierta.
      if (!RENDERABLE_IMAGE.test(file.type)) {
        throw new Error(
          "No pudimos procesar esa imagen. Probá con un JPG o PNG (el HEIC del iPhone no siempre funciona)."
        );
      }
      uploadData = file;
      contentType = file.type;
      finalName = file.name;
    }
  }

  const safeName = finalName.replace(/[^\w.\-]/g, "_");
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}-${safeName}`;
  const filePath = `${user.id}/${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(filePath, uploadData, { contentType, upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message || "No se pudo subir el archivo. Intentá de nuevo.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("assets").getPublicUrl(filePath);

  return publicUrl;
}
