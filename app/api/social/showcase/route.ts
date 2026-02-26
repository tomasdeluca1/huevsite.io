import { NextRequest, NextResponse } from "next/server";
import { getShowcaseData } from "@/lib/showcase-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedWeek = searchParams.get("week");
  
  try {
    const data = await getShowcaseData(requestedWeek);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Showcase GET error:", error);
    return NextResponse.json({ error: "Algo salió mal." }, { status: 500 });
  }
}
