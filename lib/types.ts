// 运单与系统核心数据模型

export type TempLayer = "常温" | "冷藏" | "冷冻" | "恒温";

export const TEMP_LAYERS: TempLayer[] = ["常温", "冷藏", "冷冻", "恒温"];

export type WaybillStatus =
  | "待分单"
  | "已分单"
  | "配送中"
  | "已签收"
  | "异常";

export const WAYBILL_STATUS: WaybillStatus[] = [
  "待分单",
  "已分单",
  "配送中",
  "已签收",
  "异常",
];

export type Priority = "普通" | "加急" | "VIP";

export const PRIORITIES: Priority[] = ["普通", "加急", "VIP"];

/**
 * 自定义扩展字段：满足"运单信息可自定义扩展"的要求。
 * key 为字段标识，label 为显示名，value 为值。
 */
export interface CustomField {
  key: string;
  label: string;
  value: string;
}

export interface Waybill {
  id: string; // 运单号
  warehouse: string; // 仓库
  shipper: string; // 货主
  recipient: string; // 收件人
  phone: string; // 收件人电话
  address: string; // 收件地址
  tempLayer: TempLayer; // 温层
  weight: number; // 重量(kg)
  itemType: string; // 物品类型
  pieces: number; // 件数
  route: string; // 配送路线/区域（用于分单排序）
  priority: Priority; // 优先级
  remark: string; // 备注
  custom: CustomField[]; // 自定义扩展字段
  status: WaybillStatus;
  createdAt: string;
  dispatchedAt?: string; // 分单时间
  deliveredAt?: string; // 签收时间
  signedBy?: string; // 签收人
  podNote?: string; // 签收/异常备注
  batchId?: string; // 所属派车单批次
  sequence?: number; // 批次内配送顺序
  dispatchGroupBy?: "route" | "shipper"; // 该运单被分单时的分组依据
}

export interface DispatchBatch {
  batchId: string;
  groupKey: string; // 分组依据的值（路线或货主）
  groupBy: "route" | "shipper";
  count: number;
  waybills: Waybill[];
}
