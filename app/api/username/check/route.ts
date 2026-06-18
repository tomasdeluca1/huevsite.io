import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isReservedUsername } from '@/lib/reserved-usernames'

export const dynamic = 'force-dynamic'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const username = searchParams.get('u')

    // Validación básica
    if (!username) {
      return NextResponse.json(
        { error: 'Username es requerido' },
        { status: 400 }
      )
    }

    // Validación de regex
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        {
          available: false,
          error: 'Username inválido. Solo minúsculas, números y guiones bajos (3-20 caracteres)',
        },
        { status: 200 }
      )
    }

    // Bloquear usernames reservados (rutas del sistema, marca, etc.) antes de
    // tocar la DB. Un perfil vive en huevsite.io/[username]; estos nombres
    // colisionarían con rutas existentes.
    if (isReservedUsername(username)) {
      return NextResponse.json(
        {
          available: false,
          reserved: true,
          error: 'Ese username está reservado por el sistema. Probá otro.',
        },
        { status: 200 }
      )
    }

    // Chequear disponibilidad en la DB
    const supabase = createClient()
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (error) {
      console.error('Error checking username:', error)
      return NextResponse.json(
        { error: 'Error al verificar username' },
        { status: 500 }
      )
    }

    const available = !existingProfile

    // Si está tomado, sugerir alternativas
    if (!available) {
      const suggestions = [
        `${username}_dev`,
        `${username}_builder`,
        `${username}${Math.floor(Math.random() * 100)}`,
      ]

      return NextResponse.json({
        available: false,
        suggestions,
      })
    }

    return NextResponse.json({
      available: true,
    })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { error: 'Algo falló. Nos pasa a todos. Reintentá.' },
      { status: 500 }
    )
  }
}
