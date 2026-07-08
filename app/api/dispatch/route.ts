import { NextRequest, NextResponse } from "next/server";
import { buildDispatch, resetDispatch } from "@/lib/dispatch";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === "reset") {
    const count = resetDispatch();
    return NextResponse.json({ ok: true, reset: count });
  }

  const groupBy: "route" | "shipper" = body.groupBy === "shipper" ? "shipper" : "route";
  const batches = buildDispatch(groupBy);
  return NextResponse.json({ batches });
}
