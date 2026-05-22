"use client";

import { Pencil } from "lucide-react";
import type { POSController, StatTone } from "../types/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type LaporanProps = {
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

export function Laporan({ pos }: LaporanProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Item terjual hari ini"
          value={`${pos.todayItemCount} item`}
        />
        <StatTile
          label="Rata-rata nota"
          value={pos.formatRupiah(pos.averageBasket)}
        />
        <StatTile
          label="Total stok"
          value={`${pos.productSummary.totalStock} item`}
          tone="green"
        />
        <StatTile
          label="Produk aktif"
          value={`${pos.productSummary.totalProducts} produk`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Produk Terlaris</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pos.productSalesRanking.length === 0 ? (
              <p className="text-sm font-semibold text-muted-foreground">
                Belum ada data penjualan.
              </p>
            ) : (
              pos.productSalesRanking.map((item, index) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-lg border p-3"
                >
                  <Badge variant="secondary" className="justify-center">
                    {index + 1}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.qty} item / laba {pos.formatRupiah(item.profit)}
                    </p>
                  </div>
                  <p className="font-semibold">{pos.formatRupiah(item.revenue)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Stok Menipis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pos.lowStockProducts.length === 0 ? (
              <p className="text-sm font-semibold text-muted-foreground">
                Semua stok masih aman.
              </p>
            ) : (
              pos.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{product.name}</p>
                    <p className="text-sm font-medium text-amber-900">
                      Minimal {product.minStock} {product.unit}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pos.editProduct(product)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
