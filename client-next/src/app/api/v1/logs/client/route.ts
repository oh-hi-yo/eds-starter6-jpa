import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Phase 1：僅 console 記錄；Phase 2 由後端 LogController 落地。
  console.error("[client-error]", JSON.stringify(body));
  return new NextResponse(null, { status: 204 });
}
