'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold mb-4 tracking-tighter">
          500
        </h1>
        <h2 className="text-3xl font-bold mb-4">
          Algo salió mal
        </h2>
        <p className="text-gray-400 mb-8">
          Ocurrió un error inesperado. Podés intentarlo de nuevo o volver al inicio.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-transparent text-white border border-white/20 px-6 py-3 rounded-lg font-medium hover:border-white/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
