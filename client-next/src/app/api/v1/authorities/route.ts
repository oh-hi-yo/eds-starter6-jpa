import { NextResponse } from "next/server";
import { AUTHORITIES } from "@/lib/mock/data";

export async function GET() {
  return NextResponse.json(AUTHORITIES);
}
