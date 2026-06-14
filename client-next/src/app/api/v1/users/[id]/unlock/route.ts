import { NextResponse, type NextRequest } from "next/server";
import { unlockUser } from "@/lib/mock/data";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = unlockUser(Number(id));
  if (!user) return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
  return NextResponse.json(user);
}
