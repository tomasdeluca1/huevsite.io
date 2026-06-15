/**
 * Optimiza una imagen antes de subirla a Supabase.
 * Reduce el tamaño (máximo 1200px) y comprime a WebP.
 *
 * Notas de robustez (fix 2026-06-15):
 *  - Los handlers (onload/onerror) se asignan ANTES de setear src. Al revés
 *    podía perderse el evento y la promesa quedaba colgada para siempre
 *    (spinner infinito, upload que "no pasa nada").
 *  - Usa objectURL en vez de un dataURL gigante (más liviano para fotos grandes).
 *  - Timeout: si el decode se cuelga, rechaza en vez de colgar la UI, así el
 *    caller puede caer al archivo original o mostrar un error.
 *  - Si el formato no lo puede decodificar el browser (típico HEIC de iPhone),
 *    img.onerror dispara y rechazamos con un mensaje claro.
 */
export async function optimizeImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("La imagen tardó demasiado en procesarse."));
    }, 20000);

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (!width || !height) {
          cleanup();
          reject(new Error("La imagen parece estar vacía o dañada."));
          return;
        }

        // Calcular nuevas dimensiones manteniendo el aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("No se pudo obtener el contexto del canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("No se pudo convertir la imagen."));
            }
          },
          "image/webp",
          quality
        );
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error("Error al procesar la imagen."));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("No se pudo leer la imagen (¿formato no soportado, como HEIC?)."));
    };

    // src DESPUÉS de los handlers, a propósito.
    img.src = objectUrl;
  });
}
