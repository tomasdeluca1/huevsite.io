import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";

// Borrador interno. No está linkeado desde el sitio y no tiene que indexarse.
export const metadata: Metadata = {
  title: "Lab: opciones de layout del perfil",
  description: "Borrador interno para comparar layouts del perfil público.",
  robots: PRIVATE_ROBOTS,
  alternates: {},
};

export default function LabPerfilLayout({ children }: { children: React.ReactNode }) {
  return children;
}
