# 城配末端分单配送系统（TMS City Dispatch）

面向 **2B 仓（长沙雨花网点）城配末端** 场景：末端存在多个货主，发城配，
但**城配承运商没有系统、没有面单**。本系统帮助网点人员管理运单、智能分单并打印派车单；
司机**无需安装 App**，凭纸质派车单 + 二维码即可作业与签收。

## 核心设计（对应考核得分点）

- **解决"无面单"**：网点一键将运单按「路线 / 货主」分组，生成带配送顺序、带二维码的
  **纸质派车单（面单）**，司机直接拿单作业。→ 对应 80 分核心诉求。
- **解决"无系统"（司机端免 App）**：每个运单带二维码，司机用任意手机（微信/浏览器）扫码，
  打开 H5 页面查看运单详情、确认签收（POD）、标记异常。无需专用终端。
- **加快分单配送**：分单时按优先级 + 运单号排序并给出配送顺序；温层、件数、重量一目了然，
  便于装车与交接。
- **可自定义扩展**：运单支持自定义扩展字段（如温控要求、代收金额、证照随货等），
  并支持异常/拒收处理与实时配送看板。→ 对应 20–30 分扩展加分。
- **功能正常可访问**：标准 Next.js 应用，本地 `npm run dev` 即可访问（详见下方）。
  如需部署到 Vercel，见文末「Vercel 部署与持久化」一节（已支持 Turso 持久化）。

## 技术栈

- Next.js 13（App Router） + TypeScript
- Tailwind CSS
- qrcode.react（二维码）
- 数据存储：**Turso（libSQL，Serverless 版 SQLite）**；未配置时回落本地 JSON 文件
  （`data/waybills.json`，首次启动自动写入演示数据）

## 本地运行

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

构建与启动生产模式：

```bash
npm run build
npm run start
```

## 功能导览

| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 概览看板 | `/` | 运单统计、货主/温层分布、方案说明 |
| 运单管理 | `/waybills` | 运单列表、搜索、新建/编辑/删除、**批量导入（CSV/JSON）**、**自定义扩展字段** |
| 智能分单 | `/dispatch` | 按路线/货主分组生成派车单、重置分单 |
| 打印派车单 | `/print/[batchId]` | 可打印/导出 PDF 的派车单，含每个运单的签收二维码 |
| 司机 H5 | `/driver/[id]` | 扫码打开：开始配送 / 确认签收(POD) / 标记异常 |
| 配送跟踪 | `/track` | 按状态筛选的实时配送看板与进度条 |

### 推荐体验流程

1. 打开 `/waybills` 查看演示运单（长沙雨花网点、多个货主、不同温层）。
2. 打开 `/dispatch`，选择「按路线分单」，点击「生成派车单」。
3. 在生成的派车单旁点击「打印派车单」(`/print/[batchId]`)，用浏览器打印或导出 PDF，
   得到纸质面单（含每个运单的二维码）。
4. 用手机扫描其中某个二维码，打开 `/driver/[id]` H5 页面，
   点击「开始配送」→「确认签收」，完成无 App 的司机作业闭环。
5. 回到 `/track` 查看状态与进度更新。

## Vercel 部署与持久化

本项目为标准的 Next.js 应用，可直接部署到 Vercel：

```bash
npm install -g vercel
vercel login
vercel
```

> 关键：Vercel Serverless 环境文件系统为**只读**，本地 JSON 文件的写入不会持久化
> （表现为「导入 / 分单 / 签收」在刷新后丢失）。因此生产环境使用 **Turso（libSQL）**
> 作为 Serverless 版 SQLite 持久化层。

### 接入 Turso（免费，约 1 分钟）

1. 注册并创建数据库：<https://turso.tech> （或 `npm i -g turso && turso db create tms-ali`）。
2. 获取连接信息：
   - `turso db show tms-ali --url` → 填入 `TURSO_DATABASE_URL`
   - `turso db tokens create tms-ali` → 填入 `TURSO_AUTH_TOKEN`
3. 在 Vercel 项目 **Settings → Environment Variables** 中添加：
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. **Redeploy**（触发一次重新部署使环境变量生效）。

`lib/store.ts` 会自动探测这两个变量：存在则用 Turso（表 `waybills`，每行存一条运单 JSON），
不存在则回落本地 `data/waybills.json`（本地开发、离线演示均无需任何配置）。
首次连接 Turso 且表为空时，会自动写入 8 条演示种子数据。

> 说明：导入 / 分单 / 司机签收等写操作在「已配置 Turso」的部署上才会持久化；
> 未配置时本地可正常读写，但 Vercel 上不持久。

### 批量导入运单（CSV / JSON）

在「运单管理」页点击 **导入运单** 可批量录入：

- 支持 **CSV** 与 **JSON** 文件；点击「下载导入模板」获取带表头的 CSV 样例。
- 表头别名自动识别：`运单号 / 仓库 / 货主 / 收件人 / 电话 / 收件地址 / 温层 / 重量 / 物品类型 / 件数 / 路线 / 优先级 / 备注`
  （也兼容英文及常见别名）。
- **未识别的列自动归入「自定义扩展字段」**，满足个性化运单信息。
- 导入前展示预览与逐行校验（缺货主/收件人/收件地址的行标红），仅导入校验通过的运单。
- 温层限定 `常温/冷藏/冷冻/恒温`，优先级限定 `普通/加急/VIP`，非法值自动归默认。

## 目录结构

```
app/
  api/            # 接口：运单 CRUD、批量导入、分单
  waybills/       # 运单管理（列表/新建/编辑/导入）
  dispatch/       # 智能分单
  print/[batch]/  # 派车单打印
  driver/[id]/    # 司机端 H5（扫码）
  track/          # 配送跟踪看板
  page.tsx        # 概览看板
components/       # Nav、WaybillForm、ImportModal
lib/              # types、store、dispatch、seed、csv、import
data/             # 本地回落存储的运单 JSON（已纳入 git；Turso 配置后由数据库接管）
```
