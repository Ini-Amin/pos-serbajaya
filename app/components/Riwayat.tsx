"use client";

import { Printer, XCircle } from "lucide-react";
import type { POSController } from "../types/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RiwayatProps = {
  pos: POSController;
};

export function Riwayat({ pos }: RiwayatProps) {
  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-none">
      <div className="grid gap-3 border-b p-4 md:grid-cols-[1fr_320px] md:items-center">
        <div>
          <h2 className="text-lg font-semibold">Riwayat Transaksi</h2>
          <p className="text-sm font-medium text-muted-foreground">
            {pos.sales.length} transaksi tersimpan
          </p>
        </div>
        <Input
          value={pos.historyQuery}
          onChange={(event) => pos.setHistoryQuery(event.target.value)}
          placeholder="Cari invoice, produk, metode"
          className="h-10"
        />
      </div>

      <div className="divide-y">
        {pos.filteredSales.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
            Belum ada transaksi
          </div>
        ) : (
          pos.filteredSales.map((sale) => (
            <article
              key={sale.id}
              className={`grid gap-4 p-4 lg:grid-cols-[1fr_180px_220px] lg:items-center ${
                sale.status === "voided" ? "bg-red-50/70" : "bg-card"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{sale.invoice}</h3>
                  <Badge
                    variant={sale.status === "voided" ? "destructive" : "default"}
                  >
                    {sale.status === "voided" ? "Batal" : "Selesai"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {pos.formatDateTime(sale.soldAt)} / {sale.paymentMethod}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {sale.items
                    .map((item) => `${item.name} (${item.qty})`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Total
                </p>
                <p className="text-lg font-semibold">
                  {pos.formatRupiah(sale.total)}
                </p>
              </div>
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pos.printSale(sale)}
                >
                  <Printer className="size-3.5" />
                  Cetak
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => pos.voidSale(sale)}
                  disabled={sale.status === "voided"}
                >
                  <XCircle className="size-3.5" />
                  Batalkan
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
