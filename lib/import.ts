// 导入功能：表头映射、字段校验、自定义扩展字段识别。供客户端导入弹窗复用。

import {
  CustomField,
  PRIORITIES,
  Priority,
  TEMP_LAYERS,
  TempLayer,
  Waybill,
} from "./types";

// 表头别名 -> 运单字段（支持中文/英文/常见别名）
const HEADER_MAP: Record<string, keyof Waybill> = {
  运单号: "id",
  单号: "id",
  id: "id",
  仓库: "warehouse",
  warehouse: "warehouse",
  货主: "shipper",
  shipper: "shipper",
  收件人: "recipient",
  recipient: "recipient",
  电话: "phone",
  联系电话: "phone",
  phone: "phone",
  收件地址: "address",
  地址: "address",
  address: "address",
  温层: "tempLayer",
  templayer: "tempLayer",
  temp_layer: "tempLayer",
  重量: "weight",
  重量kg: "weight",
  重量(kg): "weight",
  重量（kg）: "weight",
  重量千克: "weight",
  重量(千克): "weight",
  weight: "weight",
  kg: "weight",
  物品类型: "itemType",
  物品: "itemType",
  itemtype: "itemType",
  item_type: "itemType",
  件数: "pieces",
  pieces: "pieces",
  路线: "route",
  配送路线: "route",
  route: "route",
  区域: "route",
  优先级: "priority",
  priority: "priority",
  备注: "remark",
  remark: "remark",
};

/** 表头归一化：去 BOM、去空白、去括号内单位（如 (kg)/(千克)），统一小写 */
export function normHeader(h: string): string {
  return h
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase()
    .replace(/[（(][^）)]*[)）]/g, "") // 去掉 (kg) / （千克） 等单位说明
    .replace(/\s+/g, "");
}

// 预构建归一化后的查找表
const HEADER_LOOKUP: Record<string, keyof Waybill> = {};
for (const [k, v] of Object.entries(HEADER_MAP)) {
  HEADER_LOOKUP[normHeader(k)] = v;
}

// 用于识别文件编码是否为预期（含至少一个已知表头）的签名词
const HEADER_SIGNATURES = ["运单号", "货主", "收件人", "shipper", "warehouse", "id", "phone"];

/** 判断文本首行是否包含可识别的运单表头（用于编码探测） */
export function hasKnownHeaders(text: string): boolean {
  const firstLine = text.replace(/\r\n/g, "\n").split("\n")[0]?.toLowerCase() ?? "";
  return HEADER_SIGNATURES.some((s) => firstLine.includes(s.toLowerCase()));
}

export const IMPORT_TEMPLATE_HEADERS = [
  "运单号",
  "仓库",
  "货主",
  "收件人",
  "电话",
  "收件地址",
  "温层",
  "重量(kg)",
  "物品类型",
  "件数",
  "路线",
  "优先级",
  "备注",
];

export interface ParsedRow {
  data: Partial<Waybill>;
  errors: string[];
  valid: boolean;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
function num(v: unknown): number {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

/** 把任意原始记录规整为运单数据并做校验 */
export function normalizeRow(raw: Record<string, unknown>): ParsedRow {
  const tempLayer = str(raw.tempLayer) as TempLayer;
  const priority = str(raw.priority) as Priority;

  const custom: CustomField[] = Array.isArray(raw.custom)
    ? (raw.custom as CustomField[])
    : [];

  const data: Partial<Waybill> = {
    id: str(raw.id),
    warehouse: str(raw.warehouse),
    shipper: str(raw.shipper),
    recipient: str(raw.recipient),
    phone: str(raw.phone),
    address: str(raw.address),
    tempLayer: (TEMP_LAYERS.includes(tempLayer) ? tempLayer : "常温") as TempLayer,
    weight: num(raw.weight),
    itemType: str(raw.itemType),
    pieces: num(raw.pieces),
    route: str(raw.route),
    priority: (PRIORITIES.includes(priority) ? priority : "普通") as Priority,
    remark: str(raw.remark),
    custom,
  };

  const errors: string[] = [];
  if (!data.shipper) errors.push("缺少货主");
  if (!data.recipient) errors.push("缺少收件人");
  if (!data.address) errors.push("缺少收件地址");

  return { data, errors, valid: errors.length === 0 };
}

/** 将 CSV 二维行（带表头）解析为可导入的记录（含自定义扩展字段） */
export function mapCsvRow(headers: string[], row: string[]): ParsedRow {
  const raw: Record<string, unknown> = {};
  const custom: CustomField[] = [];

  headers.forEach((h, i) => {
    const key = HEADER_LOOKUP[normHeader(h)];
    const value = (row[i] ?? "").trim();
    if (key) {
      raw[key] = value;
    } else if (h.trim()) {
      // 未识别的表头 -> 视为自定义扩展字段
      custom.push({ key: `c_${h.trim()}`, label: h.trim(), value });
    }
  });

  if (custom.length) raw.custom = custom;
  return normalizeRow(raw);
}

/** 将 CSV 文本解析为可预览/校验的行数组 */
export function parseCsvImport(text: string, parsed: { headers: string[]; rows: string[][] }): ParsedRow[] {
  return parsed.rows.map((r) => mapCsvRow(parsed.headers, r));
}
