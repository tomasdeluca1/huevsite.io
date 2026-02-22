import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold mb-4 tracking-tighter">
          404
        </h1>
        <h2 className="text-3xl font-bold mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-400 mb-8">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}