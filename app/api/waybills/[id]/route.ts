import { NextRequest, NextResponse } from "next/server";
import { getWaybill, updateWaybill, deleteWaybill } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const wb = await getWaybill(params.id);
  if (!wb) return NextResponse.json({ error: "运单不存在" }, { status: 404 });
  return NextResponse.json(wb);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const wb = await updateWaybill(params.id, body);
  if (!wb) return NextResponse.json({ error: "运单不存在" }, { status: 404 });
  return NextResponse.json(wb);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ok = await deleteWaybill(params.id);
  if (!ok) return NextResponse.json({ error: "运单不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
