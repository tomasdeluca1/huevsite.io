import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { rateLimit, getIdentifier } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// La entrevista de builders entra con un token y sin sesión, así que este endpoint no puede
// pedir login. Lo que sí puede es dejar de ser un proxy abierto a Whisper: tope por IP,
// tope de tamaño y sólo audio.
const limiter = rateLimit({ interval: 10 * 60_000, uniqueTokenPerInterval: 2000 });
const MAX_PER_WINDOW = 12;
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const limit = limiter.check(MAX_PER_WINDOW, getIdentifier(request));
  if (!limit.success) {
    return NextResponse.json(
      { error: "Demasiados audios seguidos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.reset - Date.now()) / 1000)) } }
    );
  }

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) {
    return NextResponse.json({ error: "El audio es demasiado largo." }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || typeof audio === "string") {
      return NextResponse.json({ error: "No audio file." }, { status: 400 });
    }
    if (audio.size === 0 || audio.size > MAX_BYTES) {
      return NextResponse.json({ error: "El audio es demasiado largo." }, { status: 413 });
    }
    if (audio.type && !/^(audio\/|video\/(webm|mp4)$)/i.test(audio.type.split(";")[0].trim())) {
      return NextResponse.json({ error: "Formato de audio no soportado." }, { status: 415 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "es",
      response_format: "text",
    });

    return NextResponse.json({ text: transcription });
  } catch (error) {
    // El mensaje del proveedor no sale al cliente: puede traer detalles de la cuenta.
    console.error("Transcription error:", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "Error transcribiendo audio." }, { status: 500 });
  }
}
