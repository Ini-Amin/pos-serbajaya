"use client";

import { RotateCcw, Upload } from "lucide-react";
import type { POSController, StatTone } from "../types/pos";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    neutral: "border-border bg-card",
    green: "border-emerald-200 bg-emerald-50 text-emerald-950",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-red-200 bg-red-50 text-red-950",
  }[tone];

  return (
    <Card className={`gap-1 p-4 shadow-none ${toneClass}`} size="sm">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-xl font-semibold leading-tight">{value}</p>
    </Card>
  );
}

export function Backup({ pos }: BackupProps) {
  const voidedSales = pos.sales.filter((sale) => sale.status === "voided");

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Backup Data Lokal</CardTitle>
          <p className="text-sm font-medium text-muted-foreground">
            Simpan file backup transaksi lokal secara rutin.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" onClick={pos.exportBackup}>
            <Upload className="size-4" />
            Export JSON
          </Button>
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={pos.importBackup}
                className="sr-only"
              />
            </label>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Data Aplikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Produk"
              value={String(pos.productSummary.totalProducts)}
            />
            <StatTile label="Transaksi" value={String(pos.sales.length)} />
            <StatTile label="Batal" value={String(voidedSales.length)} tone="red" />
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={pos.resetDemoData}
            className="mt-5"
          >
            <RotateCcw className="size-4" />
            Reset Data Lokal
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
