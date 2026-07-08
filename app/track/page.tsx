"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Waybill, WaybillStatus } from "@/lib/types";

const STATUS_COLOR: Record<WaybillStatus, string> = {
  待分单: "bg-slate-100 text-slate-600",
  已分单: "bg-blue-100 text-blue-700",
  配送中: "bg-amber-100 text-amber-700",
  已签收: "bg-green-100 text-green-700",
  异常: "bg-red-100 text-red-700",
};

const FILTERS: (WaybillStatus | "全部")[] = [
  "全部",
  "待分单",
  "已分单",
  "配送中",
  "已签收",
  "异常",
];

export default function TrackPage() {
  const [list, setList] = useState<Waybill[]>([]);
  const [filter, setFilter] = useState<WaybillStatus | "全部">("全部");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waybills")
      .then((r) => r.json())
      .then((d) => setList(d))
      .finally(() => setLoading(false));
  }, []);

  const shown = list
    .filter((w) => (filter === "全部" ? true : w.status === filter))
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  const progress = (w: Waybill) => {
    const map: Record<WaybillStatus, number> = {
      待分单: 10,
      已分单: 40,
      配送中: 70,
      已签收: 100,
      异常: 50,
    };
    return map[w.status];
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">配送跟踪看板</h1>

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-sm border ${
              filter === f
                ? "bg-brand-600 text-white border-brand-600"
                : "text-slate-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">运单号</th>
              <th className="px-3 py-2 text-left">货主/收件人</th>
              <th className="px-3 py-2 text-left">状态</th>
              <th className="px-3 py-2 text-left">进度</th>
              <th className="px-3 py-2 text-left">司机扫码</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  加载中…
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              shown.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{w.id}</td>
                  <td className="px-3 py-2">
                    <div>{w.shipper}</div>
                    <div className="text-slate-500">{w.recipient}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[w.status]}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 w-40">
                    <div className="h-2 bg-slate-100 rounded">
                      <div
                        className={`h-2 rounded ${
                          w.status === "异常" ? "bg-red-400" : "bg-brand-500"
                        }`}
                        style={{ width: `${progress(w)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/driver/${w.id}`}
                      className="text-brand-600 hover:underline text-xs"
                    >
                      打开司机页
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
