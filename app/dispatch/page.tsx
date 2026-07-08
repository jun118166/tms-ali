"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Waybill } from "@/lib/types";

export default function DispatchPage() {
  const [list, setList] = useState<Waybill[]>([]);
  const [groupBy, setGroupBy] = useState<"route" | "shipper">("route");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function load() {
    fetch("/api/waybills")
      .then((r) => r.json())
      .then((d) => setList(d));
  }
  useEffect(load, []);

  // 已分单/配送中的运单按批次分组展示
  const batches = useMemo(() => {
    const map = new Map<string, Waybill[]>();
    list
      .filter((w) => w.batchId && (w.status === "已分单" || w.status === "配送中"))
      .forEach((w) => {
        if (!map.has(w.batchId!)) map.set(w.batchId!, []);
        map.get(w.batchId!)!.push(w);
      });
    return Array.from(map.entries()).map(([batchId, items]) => ({
      batchId,
      groupKey: items[0]?.route || items[0]?.shipper || "",
      items: items.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
    }));
  }, [list]);

  const pending = list.filter((w) => w.status === "待分单").length;

  async function generate() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupBy }),
    });
    const data = await res.json();
    setBusy(false);
    const n = data.batches?.length || 0;
    const total = data.batches?.reduce((s: number, b: any) => s + b.count, 0) || 0;
    setMsg(`已生成 ${n} 个派车单，共 ${total} 单`);
    load();
  }

  async function reset() {
    if (!confirm("确认将所有已分单运单退回待分单？")) return;
    setBusy(true);
    await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    setBusy(false);
    setMsg("已重置分单");
    load();
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded shadow p-5">
        <h1 className="text-xl font-bold">智能分单 / 派车单生成</h1>
        <p className="text-sm text-slate-500 mt-2">
          将“待分单”运单按 <b>路线</b> 或 <b>货主</b> 分组，组内按优先级与运单号排序，
          生成带配送顺序的派车单。司机无需 App，凭打印的纸质派车单 + 二维码作业。
        </p>
        <p className="text-sm mt-2">
          当前待分单：<b className="text-brand-600">{pending}</b> 单
        </p>
      </div>

      <div className="bg-white rounded shadow p-5 flex flex-wrap items-center gap-4">
        <div className="flex gap-3 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={groupBy === "route"}
              onChange={() => setGroupBy("route")}
            />
            按路线分单
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={groupBy === "shipper"}
              onChange={() => setGroupBy("shipper")}
            />
            按货主分单
          </label>
        </div>
        <button
          onClick={generate}
          disabled={busy || pending === 0}
          className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "处理中…" : "生成派车单"}
        </button>
        <button
          onClick={reset}
          disabled={busy}
          className="px-4 py-2 rounded text-sm border text-slate-600 disabled:opacity-50"
        >
          重置分单
        </button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold">已生成派车单 ({batches.length})</h2>
        {batches.length === 0 ? (
          <p className="text-sm text-slate-400">暂无派车单，点击上方“生成派车单”开始。</p>
        ) : (
          batches.map((b) => (
            <div key={b.batchId} className="bg-white rounded shadow p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-medium">
                    {groupBy === "shipper" ? "货主" : "路线"}：{b.groupKey}
                  </span>
                  <span className="text-slate-400 text-sm ml-3">
                    {b.items.length} 单 · 批次 {b.batchId}
                  </span>
                </div>
                <Link
                  href={`/print/${b.batchId}`}
                  className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 no-print"
                >
                  打印派车单
                </Link>
              </div>
              <ol className="mt-3 space-y-1 text-sm">
                {b.items.map((w) => (
                  <li key={w.id} className="flex gap-2">
                    <span className="text-slate-400 w-6">{w.sequence}.</span>
                    <span>
                      {w.recipient} · {w.address} · {w.tempLayer} · {w.pieces}件
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
