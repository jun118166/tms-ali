"use client";

import { useRef, useState } from "react";
import { parseCSV } from "@/lib/csv";
import {
  IMPORT_TEMPLATE_HEADERS,
  ParsedRow,
  normalizeRow,
  parseCsvImport,
} from "@/lib/import";

export default function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const header = IMPORT_TEMPLATE_HEADERS.join(",");
    const sample = [
      "YD20260709-1001,长沙雨花仓,绝味食品,张三,13800000000,长沙市雨花区韶山中路1号,冷藏,12.5,卤制食品,3,雨花-南部,普通,易碎轻放",
      "YD20260709-1002,长沙雨花仓,盐津铺子,李四,13900000000,长沙市芙蓉区五一大道2号,常温,8,蜜饯,2,芙蓉-东部,加急,",
    ].join("\n");
    const csv = "﻿" + header + "\n" + sample + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "运单导入模板.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMsg("");
    const text = await file.text();

    let parsed: ParsedRow[] = [];
    if (file.name.toLowerCase().endsWith(".json")) {
      try {
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) throw new Error("JSON 需为对象数组");
        parsed = arr.map((o: Record<string, unknown>) => normalizeRow(o));
      } catch (err: any) {
        setMsg("JSON 解析失败：" + err.message);
        setRows([]);
        return;
      }
    } else {
      const { headers, rows: rawRows } = parseCSV(text);
      if (headers.length === 0) {
        setMsg("未识别到表头，请检查 CSV 格式");
        setRows([]);
        return;
      }
      parsed = parseCsvImport(text, { headers, rows: rawRows });
    }
    setRows(parsed);
  }

  const validRows = rows.filter((r) => r.valid);
  const errorCount = rows.length - validRows.length;

  async function confirmImport() {
    if (validRows.length === 0) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/waybills/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows.map((r) => r.data) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "导入失败");
      setMsg(`成功导入 ${d.created} 条运单`);
      setTimeout(() => {
        onDone();
      }, 800);
    } catch (err: any) {
      setMsg(err.message || "导入失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="font-semibold">导入运单</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 cursor-pointer">
              选择文件 (CSV / JSON)
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={handleFile}
              />
            </label>
            <button onClick={downloadTemplate} className="text-sm text-brand-600 hover:underline">
              下载导入模板
            </button>
            {fileName && <span className="text-xs text-slate-500">已选：{fileName}</span>}
          </div>

          <p className="text-xs text-slate-400">
            支持表头：运单号/仓库/货主/收件人/电话/收件地址/温层/重量/物品类型/件数/路线/优先级/备注。
            未识别的列将自动归入「自定义扩展字段」。温层限定：常温/冷藏/冷冻/恒温；优先级：普通/加急/VIP。
          </p>

          {msg && <p className="text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded px-3 py-2">{msg}</p>}

          {rows.length > 0 && (
            <div className="text-sm">
              <div className="mb-2">
                共解析 <b>{rows.length}</b> 行，可导入 <b className="text-green-600">{validRows.length}</b> 条
                {errorCount > 0 && <b className="text-red-500">，{errorCount} 条存在错误</b>}。
              </div>
              <div className="border rounded overflow-x-auto max-h-72">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-2 py-1">#</th>
                      <th className="px-2 py-1">运单号</th>
                      <th className="px-2 py-1">货主</th>
                      <th className="px-2 py-1">收件人</th>
                      <th className="px-2 py-1">温层</th>
                      <th className="px-2 py-1">件数</th>
                      <th className="px-2 py-1">校验</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className={r.valid ? "border-t" : "border-t bg-red-50"}>
                        <td className="px-2 py-1">{i + 1}</td>
                        <td className="px-2 py-1 font-mono">{r.data.id || "（自动生成）"}</td>
                        <td className="px-2 py-1">{r.data.shipper}</td>
                        <td className="px-2 py-1">{r.data.recipient}</td>
                        <td className="px-2 py-1">{r.data.tempLayer}</td>
                        <td className="px-2 py-1">{r.data.pieces}</td>
                        <td className="px-2 py-1">
                          {r.valid ? (
                            <span className="text-green-600">OK</span>
                          ) : (
                            <span className="text-red-500">{r.errors.join("；")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="border-t px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">仅导入校验通过的运单</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded text-sm border text-slate-600">
              取消
            </button>
            <button
              onClick={confirmImport}
              disabled={busy || validRows.length === 0}
              className="bg-brand-600 text-white px-4 py-2 rounded text-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "导入中…" : `确认导入 ${validRows.length} 条`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
