import { NextRequest, NextResponse } from "next/server";
import { bulkCreateWaybills } from "@/lib/store";

// 批量导入运单（已在校验过的合法数据）
export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows = body?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows 不能为空" }, { status: 400 });
  }
  const { created } = bulkCreateWaybills(rows);
  return NextResponse.json({ created });
}
