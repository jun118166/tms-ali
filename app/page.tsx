"use client";

import { useEffect, useState } from "react";
import { Waybill, WaybillStatus } from "@/lib/types";

const STATUS_COLOR: Record<WaybillStatus, string> = {
  待分单: "bg-slate-100 text-slate-600",
  已分单: "bg-blue-100 text-blue-700",
  配送中: "bg-amber-100 text-amber-700",
  已签收: "bg-green-100 text-green-700",
  异常: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const [list, setList] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waybills")
      .then((r) => r.json())
      .then((d) => setList(d))
      .finally(() => setLoading(false));
  }, []);

  const count = (s: WaybillStatus) => list.filter((w) => w.status === s).length;
  const byShipper: Record<string, number> = {};
  const byTemp: Record<string, number> = {};
  list.forEach((w) => {
    byShipper[w.shipper] = (byShipper[w.shipper] || 0) + 1;
    byTemp[w.tempLayer] = (byTemp[w.tempLayer] || 0) + 1;
  });

  const stats: { label: string; value: number; text: string }[] = [
    { label: "运单总数", value: list.length, text: "text-brand-600" },
    { label: "待分单", value: count("待分单"), text: "text-slate-600" },
    { label: "已分单", value: count("已分单"), text: "text-blue-600" },
    { label: "配送中", value: count("配送中"), text: "text-amber-600" },
    { label: "已签收", value: count("已签收"), text: "text-green-600" },
    { label: "异常", value: count("异常"), text: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded shadow p-5">
        <h1 className="text-xl font-bold">城配末端分单配送系统 · 概览看板</h1>
        <p className="text-sm text-slate-500 mt-2">
          场景：2B 仓（长沙雨花网点）末端存在多个货主，发城配，但承运商无系统、无面单。
          本系统帮助网点人员管理运单、智能分单并打印派车单；司机无需 App，凭纸质派车单 + 二维码即可作业与签收。
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded shadow p-4">
            <div className={`text-2xl font-bold ${s.text}`}>
              {loading ? "…" : s.value}
            </div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-5">
          <h3 className="font-semibold mb-3">按货主分布</h3>
          {Object.keys(byShipper).length === 0 ? (
            <p className="text-sm text-slate-400">暂无数据</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {Object.entries(byShipper).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-slate-500">{v} 单</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded shadow p-5">
          <h3 className="font-semibold mb-3">按温层分布</h3>
          {Object.keys(byTemp).length === 0 ? (
            <p className="text-sm text-slate-400">暂无数据</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {Object.entries(byTemp).map(([k, v]) => (
                <li key={k} className="flex justify-between">
                  <span>{k}</span>
                  <span className="text-slate-500">{v} 单</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded shadow p-5">
        <h3 className="font-semibold mb-2">本方案如何解决核心诉求</h3>
        <ol className="list-decimal list-inside text-sm space-y-1 text-slate-600">
          <li>
            <b>无面单 → 生成派车单/面单：</b>
            网点一键将运单按路线/货主分组，打印带二维码的纸质派车单，司机直接拿单作业。
          </li>
          <li>
            <b>无系统 → 司机端免 App：</b>
            司机用任意手机扫运单二维码，打开 H5 页面查看详情、确认签收（POD），无需安装软件。
          </li>
          <li>
            <b>加快分单配送：</b>
            分单时按优先级+路线排序，给出配送顺序；温层、件数、重量一目了然，便于装车与交接。
          </li>
          <li>
            <b>可扩展：</b>
            运单支持自定义扩展字段（温控要求、代收金额、证照随货等），并支持异常/拒收处理与实时看板。
          </li>
        </ol>
      </div>
    </div>
  );
}
