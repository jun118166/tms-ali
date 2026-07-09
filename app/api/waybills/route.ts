import { NextRequest, NextResponse } from "next/server";
import { readAll, createWaybill } from "@/lib/store";

export async function GET() {
  const list = await readAll();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const wb = await createWaybill(body);
  return NextResponse.json(wb, { status: 201 });
}
