import Image from "next/image";

/**
 * El logo de huevsite.io: la marca isométrica + el wordmark, en un solo archivo
 * (`public/logo-huevsite.png`, 983×240 ≈ 4,1:1). Reemplaza al logo de texto que
 * antes se escribía a mano en cada pantalla con la clase `.logo`.
 *
 * Se mide SIEMPRE por el alto (`h-6`, `h-8`…) y el ancho sale solo con `w-auto`:
 * así la proporción no se rompe aunque cambie el archivo. Como Tailwind pone las
 * imágenes en `display:block`, para centrarlo va `mx-auto`, no `text-center`.
 */
export function Logo({
  className = "h-6 w-auto",
  priority = false,
}: {
  /** Clases de Tailwind. Incluí el alto y `w-auto`. */
  className?: string;
  /** Para el logo que entra en el primer pintado (pantallas sin contenido arriba). */
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo-huevsite.png"
      alt="huevsite.io"
      width={983}
      height={240}
      priority={priority}
      className={className}
    />
  );
}
