"use client";

import {
  Archive,
  BarChart3,
  ClipboardList,
  History,
  LogOut,
  Package,
  ReceiptText,
  ShoppingCart,
} from "lucide-react";
import type { ComponentType } from "react";
import { Backup } from "./components/Backup";
import { Kasir } from "./components/Kasir";
import { Laporan } from "./components/Laporan";
import { Nota } from "./components/Nota";
import { Produk } from "./components/Produk";
import { Riwayat } from "./components/Riwayat";
import { usePOS } from "./hooks/usePOS";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { POSController, StatTone, TabKey } from "./types/pos";

const tabIcons: Record<TabKey, ComponentType<{ className?: string }>> = {
  kasir: ShoppingCart,
  produk: Package,
  nota: ClipboardList,
  riwayat: History,
  laporan: BarChart3,
  backup: Archive,
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
    neutral: "border-border bg-card",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
  }[tone];

  return (
    <Card className={`gap-1 px-3 py-2 shadow-none ${toneClass}`} size="sm">
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
    </Card>
  );
}

function NavButton({ pos, tabKey }: { pos: POSController; tabKey: TabKey }) {
  const tab = pos.tabs.find((item) => item.key === tabKey);

  if (!tab) {
    return null;
  }

  const Icon = tabIcons[tab.key];
  const active = pos.activeTab === tab.key;

  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      className={`h-9 w-full justify-start gap-2 ${active ? "" : "text-muted-foreground"}`}
      onClick={() => pos.setActiveTab(tab.key)}
    >
      <Icon className="size-4" />
      {tab.label}
    </Button>
  );
}

function Sidebar({ pos }: { pos: POSController }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="hidden min-h-screen border-r bg-card lg:block">
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ReceiptText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">
              Serbajaya Elektronik
            </p>
            <h1 className="truncate text-base font-semibold leading-tight">
              POS Toko Rumah
            </h1>
          </div>
        </div>

        <Separator className="my-4" />

        <nav className="grid gap-1">
          {pos.tabs.map((tab) => (
            <NavButton key={tab.key} pos={pos} tabKey={tab.key} />
          ))}
        </nav>

        <div className="mt-auto space-y-3">
          <Separator />
          <Button
            type="button"
            variant="destructive"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ pos }: { pos: POSController }) {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-3 py-3 lg:px-5">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="lg:hidden">
            <p className="text-sm font-semibold text-primary">
              Serbajaya Elektronik
            </p>
            <h1 className="text-xl font-semibold leading-tight">
              POS Toko Elektronik Rumah
            </h1>
          </div>
          <div className="hidden lg:block">
            <Badge variant="outline">Dashboard operasional</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:hidden">
            {pos.tabs.map((tab) => {
              const Icon = tabIcons[tab.key];
              const active = pos.activeTab === tab.key;

              return (
                <Button
                  key={tab.key}
                  type="button"
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => pos.setActiveTab(tab.key)}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </Button>
              );
            })}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={handleLogout}
            >
              <LogOut className="size-3.5" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
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
            value={`${pos.productSummary.lowStockCount} produk`}
            tone={pos.productSummary.lowStockCount > 0 ? "amber" : "neutral"}
          />
        </div>

        {pos.notice ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
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

  if (pos.activeTab === "nota") {
    return <Nota pos={pos} />;
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
  const contentOverflow =
    pos.activeTab === "kasir" ? "lg:overflow-hidden" : "lg:overflow-auto";

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:h-screen lg:grid-cols-[232px_minmax(0,1fr)] lg:overflow-hidden">
      <Sidebar pos={pos} />
      <div className="min-w-0 lg:flex lg:min-h-0 lg:flex-col">
        <TopBar pos={pos} />
        <div
          className={`mx-auto w-full max-w-[1500px] px-3 py-3 lg:min-h-0 lg:flex-1 lg:px-5 ${contentOverflow}`}
        >
          <ActiveScreen pos={pos} />
        </div>
      </div>
    </main>
  );
}
