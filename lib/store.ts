import fs from "fs";
import path from "path";
import { Waybill } from "./types";
import { seedWaybills } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waybills.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedWaybills(), null, 2), "utf-8");
  }
}

export function readAll(): Waybill[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const list = JSON.parse(raw) as Waybill[];
    return Array.isArray(list) ? list : seedWaybills();
  } catch {
    return seedWaybills();
  }
}

export function writeAll(list: Waybill[]) {
  // 在只读文件系统（如部分 Serverless 环境）下静默失败，本地可正常持久化
  try {
    ensureFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    /* ignore persistence error */
  }
}

export function getWaybill(id: string): Waybill | undefined {
  return readAll().find((w) => w.id === id);
}

function genId(): string {
  const d = new Date();
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `YD${ymd}-${rand}`;
}

export function createWaybill(input: Partial<Waybill>): Waybill {
  const list = readAll();
  const now = new Date().toISOString();
  const wb: Waybill = {
    id: input.id?.trim() || genId(),
    warehouse: input.warehouse?.trim() || "长沙雨花仓",
    shipper: input.shipper?.trim() || "未知货主",
    recipient: input.recipient?.trim() || "",
    phone: input.phone?.trim() || "",
    address: input.address?.trim() || "",
    tempLayer: (input.tempLayer as Waybill["tempLayer"]) || "常温",
    weight: Number(input.weight) || 0,
    itemType: input.itemType?.trim() || "",
    pieces: Number(input.pieces) || 0,
    route: input.route?.trim() || "未分配",
    priority: (input.priority as Waybill["priority"]) || "普通",
    remark: input.remark?.trim() || "",
    custom: Array.isArray(input.custom) ? input.custom : [],
    status: "待分单",
    createdAt: now,
  };
  list.push(wb);
  writeAll(list);
  return wb;
}

export function updateWaybill(id: string, patch: Partial<Waybill>): Waybill | undefined {
  const list = readAll();
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) return undefined;
  const merged: Waybill = { ...list[idx], ...patch, id };
  list[idx] = merged;
  writeAll(list);
  return merged;
}

export function deleteWaybill(id: string): boolean {
  const list = readAll();
  const next = list.filter((w) => w.id !== id);
  if (next.length === list.length) return false;
  writeAll(next);
  return true;
}
