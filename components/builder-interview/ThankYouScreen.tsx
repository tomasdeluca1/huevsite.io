"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface ThankYouScreenProps {
  builderName: string;
  builderUsername: string;
}

export function ThankYouScreen({ builderName, builderUsername }: ThankYouScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-lg mx-auto"
    >
      <div className="text-6xl mb-6">🏆</div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-4">
        ¡Gracias, {builderName}!
      </h1>
      <p className="text-zinc-400 text-lg leading-relaxed mb-8">
        Tu entrevista fue enviada. Estamos generando tu blog post y los posts
        para redes sociales. Tomas lo va a revisar y publicar pronto.
      </p>

      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
        <p className="text-sm text-zinc-500 mb-2">Tu perfil en huevsite.io</p>
        <Link
          href={`/${builderUsername}`}
          className="text-[#C8FF00] font-bold text-lg hover:underline"
        >
          huevsite.io/{builderUsername}
        </Link>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-sm font-medium hover:text-white hover:bg-white/10 transition-colors"
      >
        Volver a huevsite.io
      </Link>
    </motion.div>
  );
}
