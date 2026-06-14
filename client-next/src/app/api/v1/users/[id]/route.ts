import { NextResponse, type NextRequest } from "next/server";
import { deleteUser, upsertUser } from "@/lib/mock/data";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const updated = upsertUser({ ...body, id: Number(id) });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ title: "Not found", status: 404 }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  deleteUser(Number(id));
  return new NextResponse(null, { status: 204 });
}
