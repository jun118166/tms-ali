import fs from "fs";
import path from "path";
import type { Client } from "@libsql/client";
import { Waybill } from "./types";
import { seedWaybills } from "./seed";

// ============================================================================
// 存储抽象：
//  - 配置了 TURSO_DATABASE_URL + TURSO_AUTH_TOKEN 时，使用 Turso（libSQL，Serverless 版 SQLite），
//    可在 Vercel 等只读文件系统环境持久化。
//  - 否则回落到本地 data/waybills.json（本地开发、离线演示）。
// 所有对外函数均为 async，调用方需 await。
// ============================================================================

// ---------- Turso / libSQL 后端 ----------
let client: Client | null = null;
let dbReady = false;

async function getClient(): Promise<Client | null> {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  if (!client) {
    const { createClient } = await import("@libsql/client");
    client = createClient({ url, authToken: token });
  }
  return client;
}

async function ensureTable(c: Client) {
  if (dbReady) return;
  await c.execute(
    `CREATE TABLE IF NOT EXISTS waybills (id TEXT PRIMARY KEY, data TEXT NOT NULL)`
  );
  dbReady = true;
}

async function upsertTurso(c: Client, w: Waybill) {
  await ensureTable(c);
  await c.execute(
    `INSERT INTO waybills (id, data) VALUES (?, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
    [w.id, JSON.stringify(w)]
  );
}

async function fromTurso(c: Client): Promise<Waybill[]> {
  await ensureTable(c);
  const res = await c.execute(`SELECT data FROM waybills`);
  const list: Waybill[] = [];
  for (const row of res.rows) {
    try {
      list.push(JSON.parse(String(row.data)) as Waybill);
    } catch {
      /* 跳过损坏行 */
    }
  }
  if (list.length === 0) {
    const seed = seedWaybills();
    for (const w of seed) await upsertTurso(c, w);
    return seed;
  }
  return list;
}

// ---------- 本地 JSON 后端 ----------
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waybills.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedWaybills(), null, 2), "utf-8");
  }
}

function readLocal(): Waybill[] {
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const list = JSON.parse(raw) as Waybill[];
    return Array.isArray(list) ? list : seedWaybills();
  } catch {
    return seedWaybills();
  }
}

function writeLocal(list: Waybill[]) {
  try {
    ensureFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    /* 只读文件系统静默失败 */
  }
}

// ---------- 统一异步接口 ----------
export async function readAll(): Promise<Waybill[]> {
  const c = await getClient();
  if (c) return fromTurso(c);
  return readLocal();
}

export async function saveAll(list: Waybill[]): Promise<void> {
  const c = await getClient();
  if (c) {
    for (const w of list) await upsertTurso(c, w);
    return;
  }
  writeLocal(list);
}

export async function getWaybill(id: string): Promise<Waybill | undefined> {
  const list = await readAll();
  return list.find((w) => w.id === id);
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

export function buildWaybill(input: Partial<Waybill>): Waybill {
  const now = new Date().toISOString();
  return {
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
}

export async function createWaybill(input: Partial<Waybill>): Promise<Waybill> {
  const list = await readAll();
  const wb = buildWaybill(input);
  list.push(wb);
  await saveAll(list);
  return wb;
}

/** 批量导入：一次性写入，避免逐条写盘 */
export async function bulkCreateWaybills(
  inputs: Partial<Waybill>[]
): Promise<{ created: number }> {
  const list = await readAll();
  let created = 0;
  for (const input of inputs) {
    list.push(buildWaybill(input));
    created++;
  }
  await saveAll(list);
  return { created };
}

export async function updateWaybill(
  id: string,
  patch: Partial<Waybill>
): Promise<Waybill | undefined> {
  const list = await readAll();
  const idx = list.findIndex((w) => w.id === id);
  if (idx === -1) return undefined;
  const merged: Waybill = { ...list[idx], ...patch, id };
  list[idx] = merged;
  await saveAll(list);
  return merged;
}

export async function deleteWaybill(id: string): Promise<boolean> {
  const list = await readAll();
  const next = list.filter((w) => w.id !== id);
  if (next.length === list.length) return false;
  await saveAll(next);
  return true;
}
