"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Waybill } from "@/lib/types";

export default function PrintPage() {
  const params = useParams();
  const batchId = Array.isArray(params.batch) ? params.batch[0] : params.batch;
  const [items, setItems] = useState<Waybill[]>([]);
  const [groupKey, setGroupKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/waybills")
      .then((r) => r.json())
      .then((d: Waybill[]) => {
        const f = d
          .filter((w) => w.batchId === batchId)
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        setItems(f);
        setGroupKey(
          f[0]?.dispatchGroupBy === "shipper"
            ? f[0]?.shipper || "未知货主"
            : f[0]?.route || "未分配"
        );
      })
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) return <p className="text-slate-400">加载中…</p>;
  if (items.length === 0)
    return <p className="text-red-500">未找到该派车单</p>;

  const today = new Date().toLocaleDateString("zh-CN");

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end gap-2">
        <button
          onClick={() => window.print()}
          className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700"
        >
          打印 / 导出 PDF
        </button>
      </div>

      <div className="print-sheet bg-white p-6 border rounded shadow max-w-3xl mx-auto">
        <div className="flex justify-between items-end border-b pb-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">城配派车单</h1>
            <p className="text-sm text-slate-500">
              长沙雨花网点 · {groupKey} · {today}
            </p>
          </div>
          <div className="text-right text-sm">
            <div>批次：{batchId}</div>
            <div>合计：{items.length} 单</div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-3">
          司机作业说明：按序号顺序配送；到客户处扫码（二维码）打开页面 → 确认签收。
          无需安装任何 App，任意手机浏览器/微信扫码即可。
        </p>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border px-2 py-1">序</th>
              <th className="border px-2 py-1">收件人/电话</th>
              <th className="border px-2 py-1">地址</th>
              <th className="border px-2 py-1">温层</th>
              <th className="border px-2 py-1">件/重</th>
              <th className="border px-2 py-1">物品</th>
              <th className="border px-2 py-1">扫码签收</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.id} className="align-top">
                <td className="border px-2 py-1 font-bold">{w.sequence}</td>
                <td className="border px-2 py-1">
                  <div>{w.recipient}</div>
                  <div className="text-slate-500">{w.phone}</div>
                  <div className="text-slate-400 text-xs">{w.shipper}</div>
                </td>
                <td className="border px-2 py-1 max-w-[200px]">{w.address}</td>
                <td className="border px-2 py-1">{w.tempLayer}</td>
                <td className="border px-2 py-1">
                  {w.pieces}件 / {w.weight}kg
                </td>
                <td className="border px-2 py-1">
                  {w.itemType}
                  {w.custom.length > 0 && (
                    <div className="text-xs text-slate-400">
                      {w.custom.map((c) => `${c.label}:${c.value}`).join("；")}
                    </div>
                  )}
                </td>
                <td className="border px-2 py-1 text-center">
                  {origin && <QRCodeSVG value={`${origin}/driver/${w.id}`} size={72} />}
                  <div className="text-[10px] text-slate-400 mt-1">扫码签收</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-xs text-slate-500">
          司机签字：____________________ 出车时间：__________ 回单时间：__________
        </div>
      </div>
    </div>
  );
}
