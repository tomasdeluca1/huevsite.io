"use client";

import { useTranslations } from "next-intl";

interface Props {
  /** Ruta pública del perfil (`/usuario` o `/usuario/slug`), sin query. */
  path: string;
  /** Cambia cuando se guarda: fuerza la recarga del iframe. */
  reloadKey: string | number;
}

/**
 * Previsualización de celular: un <iframe> al perfil real a 390px.
 *
 * Tiene que ser un iframe y no un div: las media queries (`max-width: 767px`)
 * miran el ancho de la ventana, no el del contenedor. Un div de 390px dentro de
 * un escritorio seguiría mostrando el layout de escritorio. El iframe tiene su
 * propia ventana de 390px, así que ahí aplican las reglas de celular de verdad
 * (incluido `order: var(--mo)`).
 *
 * El reordenamiento no se hace acá adentro: el drag no cruza el borde del
 * iframe. Se hace en la lista lateral (MobileOrderList).
 */
export function MobilePreviewFrame({ path, reloadKey }: Props) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
        {t("page.mobilePreviewTitle")}
      </p>
      <div
        className="rounded-[2.25rem] border border-white/15 bg-black p-2 shadow-2xl"
        style={{ width: 390 + 16, maxWidth: "100%" }}
      >
        <iframe
          key={reloadKey}
          src={`${path}?embed=1`}
          title={t("page.mobilePreviewTitle")}
          className="block rounded-[1.75rem] bg-black"
          style={{ width: "100%", maxWidth: 390, height: 720, border: 0 }}
        />
      </div>
      <p className="text-[11px] text-white/30 font-medium text-center">
        {t("page.mobilePreviewHint")}
      </p>
    </div>
  );
}
