"use client";

import { Backup } from "./components/Backup";
import { Kasir } from "./components/Kasir";
import { Laporan } from "./components/Laporan";
import { Produk } from "./components/Produk";
import { Riwayat } from "./components/Riwayat";
import { usePOS } from "./hooks/usePOS";
import type { POSController, StatTone } from "./types/pos";

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
    <div className={`rounded-md border px-4 py-2.5 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold leading-tight">{value}</p>
    </div>
  );
}

function Header({ pos }: { pos: POSController }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-2 px-3 py-2.5 lg:px-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Serbajaya Elektronik
            </p>
            <h1 className="text-xl font-bold leading-tight">
              POS Toko Elektronik Rumah
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {pos.tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => pos.setActiveTab(tab.key)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    pos.activeTab === tab.key
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Omzet hari ini"
            value={pos.formatRupiah(pos.todayRevenue)}
            tone="green"
          />
          <StatTile label="Transaksi" value={`${pos.todaySales.length} nota`} />
          <StatTile
            label="Estimasi laba"
            value={pos.formatRupiah(pos.todayProfit)}
          />
          <StatTile
            label="Stok menipis"
            value={`${pos.lowStockProducts.length} produk`}
            tone={pos.lowStockProducts.length > 0 ? "amber" : "neutral"}
          />
        </div>

        {pos.notice ? (
          <div
            className={`rounded-md border px-4 py-3 text-sm font-semibold ${
              pos.notice.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : pos.notice.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {pos.notice.message}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ActiveScreen({ pos }: { pos: POSController }) {
  if (pos.activeTab === "produk") {
    return <Produk pos={pos} />;
  }

  if (pos.activeTab === "riwayat") {
    return <Riwayat pos={pos} />;
  }

  if (pos.activeTab === "laporan") {
    return <Laporan pos={pos} />;
  }

  if (pos.activeTab === "backup") {
    return <Backup pos={pos} />;
  }

  return <Kasir pos={pos} />;
}

export default function Home() {
  const pos = usePOS();

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <Header pos={pos} />
      <div className="mx-auto max-w-[1480px] px-3 py-3 lg:px-4">
        <ActiveScreen pos={pos} />
      </div>
    </main>
  );
}
