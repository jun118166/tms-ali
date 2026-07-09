import { DispatchBatch, Waybill } from "./types";
import { readAll, saveAll } from "./store";

const PRIORITY_WEIGHT: Record<string, number> = {
  VIP: 0,
  加急: 1,
  普通: 2,
};

function sortWaybills(list: Waybill[]): Waybill[] {
  return [...list].sort((a, b) => {
    const p = (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
    if (p !== 0) return p;
    return a.id.localeCompare(b.id);
  });
}

/**
 * 智能分单：把"待分单"运单按 路线/货主 分组，组内按优先级+运单号排序，
 * 生成派车单批次并写回状态。司机无需 App，靠纸质派车单 + 二维码作业。
 */
export async function buildDispatch(groupBy: "route" | "shipper"): Promise<DispatchBatch[]> {
  const all = await readAll();
  const candidates = all.filter((w) => w.status === "待分单");
  const groups = new Map<string, Waybill[]>();

  for (const w of candidates) {
    const key = groupBy === "route" ? w.route || "未分配" : w.shipper || "未知货主";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(w);
  }

  const batches: DispatchBatch[] = [];
  const updated = new Map(all.map((w) => [w.id, { ...w }]));

  for (const [groupKey, items] of groups.entries()) {
    const sorted = sortWaybills(items);
    const batchId = `PC${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const now = new Date().toISOString();
    sorted.forEach((w, i) => {
      const ref = updated.get(w.id)!;
      ref.status = "已分单";
      ref.batchId = batchId;
      ref.sequence = i + 1;
      ref.dispatchedAt = now;
      ref.dispatchGroupBy = groupBy;
    });
    batches.push({
      batchId,
      groupKey,
      groupBy,
      count: sorted.length,
      waybills: sorted.map((w) => updated.get(w.id)!),
    });
  }

  await saveAll(Array.from(updated.values()));
  return batches;
}

/** 重置分单：把已分单但未配送/签收的运单退回待分单 */
export async function resetDispatch(): Promise<number> {
  const all = await readAll();
  let count = 0;
  const next = all.map((w) => {
    if (w.status === "已分单") {
      count++;
      return {
        ...w,
        status: "待分单" as const,
        batchId: undefined,
        sequence: undefined,
        dispatchedAt: undefined,
        dispatchGroupBy: undefined,
      };
    }
    return w;
  });
  if (count > 0) await saveAll(next);
  return count;
}
