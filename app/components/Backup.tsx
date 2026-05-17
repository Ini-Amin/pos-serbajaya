"use client";

import type { POSController, StatTone } from "../types/pos";

type BackupProps = {
  pos: POSController;
};

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: StatTone;
}) {
  const toneClass = {
    neutral: "border-zinc-200 bg-white text-zinc-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-bold leading-tight">{value}</p>
    </div>
  );
}

export function Backup({ pos }: BackupProps) {
  const voidedSales = pos.sales.filter((sale) => sale.status === "voided");

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Backup Data Lokal</h2>
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          Simpan file backup secara rutin ke flashdisk atau folder lain.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={pos.exportBackup}
            className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800"
          >
            Export JSON
          </button>
          <label className="cursor-pointer rounded-md border border-zinc-300 px-4 py-3 text-sm font-bold hover:border-emerald-400 hover:text-emerald-800">
            Import JSON
            <input
              type="file"
              accept="application/json"
              onChange={pos.importBackup}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Data Aplikasi</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile label="Produk" value={String(pos.products.length)} />
          <StatTile label="Transaksi" value={String(pos.sales.length)} />
          <StatTile label="Batal" value={String(voidedSales.length)} tone="red" />
        </div>
        <button
          type="button"
          onClick={pos.resetDemoData}
          className="mt-5 rounded-md border border-red-200 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
        >
          Reset Data Contoh
        </button>
      </div>
    </section>
  );
}
