import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

export const metadata = {
    title: "¡Ya sos PRO! | huevsite.io",
};

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <Suspense fallback={<div className="animate-pulse text-zinc-500">Cargando...</div>}>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
