import { PRIVATE_ROBOTS } from "@/lib/seo";
import { LabClient } from "./LabClient";
import { loadLabProfile } from "./load-profile";
import { isLabOption, type LabOptionId } from "./options";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lab: opciones de layout del perfil",
  robots: PRIVATE_ROBOTS,
};

const USERNAME = /^[a-z0-9_]{3,20}$/;

interface Props {
  searchParams?: { u?: string; opcion?: string; shot?: string; abierto?: string };
}

export default async function LabPerfilPage({ searchParams }: Props) {
  const params = await Promise.resolve(searchParams);
  const requested = (params?.u || "tomidelu").trim().toLowerCase();
  const option: LabOptionId = isLabOption(params?.opcion) ? params.opcion : "a";
  const shot = params?.shot === "1";
  const abierto = params?.abierto === "1";

  if (!USERNAME.test(requested)) {
    return <LabMessage>Ese usuario no es válido.</LabMessage>;
  }

  const profile = await loadLabProfile(requested);
  if (!profile) {
    return <LabMessage>No encontré el perfil @{requested}.</LabMessage>;
  }

  return <LabClient profile={profile} option={option} shot={shot} abierto={abierto} />;
}

function LabMessage({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-center text-white">
      <p className="max-w-sm text-sm text-white/70">{children}</p>
    </main>
  );
}
