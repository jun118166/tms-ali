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

export default function WaybillsPage() {
  const [list, setList] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/waybills")
      .then((r) => r.json())
      .then((d) => setList(d))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function del(id: string) {
    if (!confirm("确认删除该运单？")) return;
    await fetch(`/api/waybills/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = list.filter(
    (w) =>
      w.id.includes(q) ||
      w.shipper.includes(q) ||
      w.recipient.includes(q) ||
      w.address.includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">运单管理</h1>
        <Link
          href="/waybills/new"
          className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700"
        >
          + 新建运单
        </Link>
      </div>

      <input
        className="border rounded px-3 py-2 text-sm w-full max-w-sm"
        placeholder="搜索运单号 / 货主 / 收件人 / 地址"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left">运单号</th>
              <th className="px-3 py-2 text-left">货主</th>
              <th className="px-3 py-2 text-left">收件人</th>
              <th className="px-3 py-2 text-left">温层</th>
              <th className="px-3 py-2 text-left">件数</th>
              <th className="px-3 py-2 text-left">路线</th>
              <th className="px-3 py-2 text-left">状态</th>
              <th className="px-3 py-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  加载中…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  暂无运单
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{w.id}</td>
                  <td className="px-3 py-2">{w.shipper}</td>
                  <td className="px-3 py-2">{w.recipient}</td>
                  <td className="px-3 py-2">{w.tempLayer}</td>
                  <td className="px-3 py-2">{w.pieces}</td>
                  <td className="px-3 py-2">{w.route}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[w.status]}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/waybills/${w.id}`} className="text-brand-600 hover:underline mr-3">
                      编辑
                    </Link>
                    <button onClick={() => del(w.id)} className="text-red-500 hover:underline">
                      删除
                    </button>
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
