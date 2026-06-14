import { NextResponse, type NextRequest } from "next/server";
import { disableTwoFactor } from "@/lib/mock/data";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = disableTwoFactor(Number(id));
  if (!user) return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
  return NextResponse.json(user);
}
