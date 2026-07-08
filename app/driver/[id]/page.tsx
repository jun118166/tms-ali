"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Waybill } from "@/lib/types";

export default function DriverPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [wb, setWb] = useState<Waybill | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  function load() {
    if (!id) return;
    fetch(`/api/waybills/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWb(d))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  }

  async function act(patch: Partial<Waybill>) {
    setBusy(true);
    const res = await fetch(`/api/waybills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (res.ok) {
      flash("操作成功");
      load();
    } else {
      flash("操作失败");
    }
  }

  if (loading) return <p className="text-slate-400 p-4">加载中…</p>;
  if (!wb)
    return (
      <div className="p-4 text-center text-red-500">
        运单不存在或已删除
      </div>
    );

  const done = wb.status === "已签收";

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="bg-brand-700 text-white rounded p-4">
        <div className="text-xs opacity-80">城配末端 · 司机送达确认</div>
        <div className="text-lg font-bold mt-1">{wb.shipper}</div>
        <div className="text-xs opacity-80 font-mono mt-1">{wb.id}</div>
      </div>

      <div className="bg-white rounded shadow divide-y">
        <Row label="配送顺序" value={wb.sequence ? `#${wb.sequence}` : "-"} />
        <Row label="收件人" value={wb.recipient} />
        <Row label="电话" value={wb.phone} />
        <Row label="地址" value={wb.address} />
        <Row label="温层" value={wb.tempLayer} />
        <Row label="件数 / 重量" value={`${wb.pieces} 件 / ${wb.weight} kg`} />
        <Row label="物品类型" value={wb.itemType} />
        <Row label="优先级" value={wb.priority} />
        {wb.remark && <Row label="备注" value={wb.remark} />}
        {wb.custom.map((c) => (
          <Row key={c.key} label={c.label} value={c.value} />
        ))}
      </div>

      <div className="text-center">
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm ${
            done
              ? "bg-green-100 text-green-700"
              : wb.status === "异常"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          状态：{wb.status}
        </span>
      </div>

      {done ? (
        <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-800">
          ✓ 已完成签收
          <div className="mt-1 text-green-700">签收人：{wb.signedBy}</div>
          <div className="text-green-700">
            签收时间：{wb.deliveredAt ? new Date(wb.deliveredAt).toLocaleString("zh-CN") : ""}
          </div>
          {wb.podNote && <div className="text-green-700">备注：{wb.podNote}</div>}
        </div>
      ) : (
        <div className="space-y-2">
          {wb.status === "已分单" && (
            <button
              onClick={() => act({ status: "配送中" })}
              disabled={busy}
              className="w-full bg-amber-500 text-white py-3 rounded font-medium disabled:opacity-50"
            >
              开始配送
            </button>
          )}
          <button
            onClick={() => {
              const name = prompt("请输入签收人姓名：", wb.recipient);
              if (name === null) return;
              const note = prompt("签收备注（可选）：", "") || "";
              act({
                status: "已签收",
                signedBy: name,
                podNote: note,
                deliveredAt: new Date().toISOString(),
              });
            }}
            disabled={busy}
            className="w-full bg-green-600 text-white py-3 rounded font-medium disabled:opacity-50"
          >
            确认签收（POD）
          </button>
          <button
            onClick={() => {
              const note = prompt("异常原因：", "");
              if (note === null) return;
              act({ status: "异常", podNote: note });
            }}
            disabled={busy}
            className="w-full bg-red-500 text-white py-3 rounded font-medium disabled:opacity-50"
          >
            标记异常 / 拒收
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-2 text-sm">
      <div className="w-24 text-slate-400 shrink-0">{label}</div>
      <div className="flex-1 break-words">{value}</div>
    </div>
  );
}
