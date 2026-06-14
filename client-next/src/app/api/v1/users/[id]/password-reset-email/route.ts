import { NextResponse, type NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  await params; // mock：實際寄信由 Phase 2 MailService 處理
  return NextResponse.json({ ok: true, message: "密碼重設信件已寄出" });
}
