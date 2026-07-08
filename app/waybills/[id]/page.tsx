"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WaybillForm from "@/components/WaybillForm";
import { Waybill } from "@/lib/types";

export default function EditWaybillPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [wb, setWb] = useState<Waybill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/waybills/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setWb(d))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-slate-400">加载中…</p>;
  if (!wb) return <p className="text-red-500">运单不存在</p>;
  return <WaybillForm mode="edit" initial={wb} />;
}
