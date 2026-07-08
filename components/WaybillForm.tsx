"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CustomField,
  PRIORITIES,
  Priority,
  TEMP_LAYERS,
  TempLayer,
  Waybill,
} from "@/lib/types";

export default function WaybillForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Waybill;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    warehouse: initial?.warehouse || "长沙雨花仓",
    shipper: initial?.shipper || "",
    recipient: initial?.recipient || "",
    phone: initial?.phone || "",
    address: initial?.address || "",
    tempLayer: (initial?.tempLayer || "常温") as TempLayer,
    weight: initial?.weight?.toString() || "",
    itemType: initial?.itemType || "",
    pieces: initial?.pieces?.toString() || "",
    route: initial?.route || "",
    priority: (initial?.priority || "普通") as Priority,
    remark: initial?.remark || "",
  });
  const [custom, setCustom] = useState<CustomField[]>(initial?.custom || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addCustom() {
    setCustom((c) => [
      ...c,
      { key: `c${Date.now()}`, label: "", value: "" },
    ]);
  }
  function updateCustom(i: number, patch: Partial<CustomField>) {
    setCustom((c) => c.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  function removeCustom(i: number) {
    setCustom((c) => c.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      weight: Number(form.weight) || 0,
      pieces: Number(form.pieces) || 0,
      custom: custom.filter((c) => c.label.trim() || c.value.trim()),
    };
    try {
      const res = await fetch(
        mode === "edit" ? `/api/waybills/${initial!.id}` : "/api/waybills",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("保存失败");
      router.push("/waybills");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "保存失败");
      setSaving(false);
    }
  }

  const field = "border rounded px-3 py-2 w-full text-sm focus:outline-brand-500";
  const label = "block text-xs text-slate-500 mb-1";

  return (
    <div className="bg-white rounded shadow p-5 max-w-3xl">
      <h2 className="text-lg font-semibold mb-4">
        {mode === "edit" ? `编辑运单 ${initial?.id}` : "新建运单"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>仓库</label>
          <input className={field} value={form.warehouse} onChange={(e) => set("warehouse", e.target.value)} />
        </div>
        <div>
          <label className={label}>货主</label>
          <input className={field} value={form.shipper} onChange={(e) => set("shipper", e.target.value)} placeholder="如：绝味食品" />
        </div>
        <div>
          <label className={label}>收件人</label>
          <input className={field} value={form.recipient} onChange={(e) => set("recipient", e.target.value)} />
        </div>
        <div>
          <label className={label}>收件电话</label>
          <input className={field} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>收件地址</label>
          <input className={field} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div>
          <label className={label}>温层</label>
          <select className={field} value={form.tempLayer} onChange={(e) => set("tempLayer", e.target.value)}>
            {TEMP_LAYERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>物品类型</label>
          <input className={field} value={form.itemType} onChange={(e) => set("itemType", e.target.value)} placeholder="如：卤制食品" />
        </div>
        <div>
          <label className={label}>重量(kg)</label>
          <input className={field} type="number" value={form.weight} onChange={(e) => set("weight", e.target.value)} />
        </div>
        <div>
          <label className={label}>件数</label>
          <input className={field} type="number" value={form.pieces} onChange={(e) => set("pieces", e.target.value)} />
        </div>
        <div>
          <label className={label}>配送路线/区域</label>
          <input className={field} value={form.route} onChange={(e) => set("route", e.target.value)} placeholder="如：雨花-南部" />
        </div>
        <div>
          <label className={label}>优先级</label>
          <select className={field} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>备注</label>
          <input className={field} value={form.remark} onChange={(e) => set("remark", e.target.value)} />
        </div>
      </div>

      {/* 自定义扩展字段 */}
      <div className="mt-5 border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">自定义扩展字段（可增减，满足个性化需求）</span>
          <button type="button" onClick={addCustom} className="text-sm text-brand-600 hover:underline">
            + 添加字段
          </button>
        </div>
        {custom.length === 0 && (
          <p className="text-xs text-slate-400">暂无扩展字段</p>
        )}
        <div className="space-y-2">
          {custom.map((c, i) => (
            <div key={c.key} className="flex gap-2 items-center">
              <input
                className="border rounded px-2 py-1 text-sm w-1/3"
                placeholder="字段名（如：温控要求）"
                value={c.label}
                onChange={(e) => updateCustom(i, { label: e.target.value })}
              />
              <input
                className="border rounded px-2 py-1 text-sm flex-1"
                placeholder="字段值"
                value={c.value}
                onChange={(e) => updateCustom(i, { value: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeCustom(i)}
                className="text-red-500 text-sm px-2"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={submit}
          disabled={saving}
          className="bg-brand-600 text-white px-5 py-2 rounded text-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "保存中…" : mode === "edit" ? "保存修改" : "创建运单"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 rounded text-sm border text-slate-600"
        >
          取消
        </button>
      </div>
    </div>
  );
}
