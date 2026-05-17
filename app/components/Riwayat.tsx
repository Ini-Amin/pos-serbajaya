"use client";

import type { POSController } from "../types/pos";

type RiwayatProps = {
  pos: POSController;
};

export function Riwayat({ pos }: RiwayatProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-[1fr_320px] md:items-center">
        <div>
          <h2 className="text-lg font-bold">Riwayat Transaksi</h2>
          <p className="text-sm font-semibold text-zinc-500">
            {pos.sales.length} transaksi tersimpan
          </p>
        </div>
        <input
          value={pos.historyQuery}
          onChange={(event) => pos.setHistoryQuery(event.target.value)}
          placeholder="Cari invoice, produk, metode"
          className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />
      </div>
      <div className="divide-y divide-zinc-200">
        {pos.filteredSales.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-zinc-500">
            Belum ada transaksi
          </div>
        ) : (
          pos.filteredSales.map((sale) => (
            <article
              key={sale.id}
              className={`grid gap-4 p-4 lg:grid-cols-[1fr_180px_220px] lg:items-center ${
                sale.status === "voided" ? "bg-red-50" : "bg-white"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{sale.invoice}</h3>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      sale.status === "voided"
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {sale.status === "voided" ? "Batal" : "Selesai"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-zinc-500">
                  {pos.formatDateTime(sale.soldAt)} / {sale.paymentMethod}
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  {sale.items
                    .map((item) => `${item.name} (${item.qty})`)
                    .join(", ")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  Total
                </p>
                <p className="text-lg font-bold">
                  {pos.formatRupiah(sale.total)}
                </p>
              </div>
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => pos.printSale(sale)}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold hover:border-emerald-300 hover:text-emerald-800"
                >
                  Cetak
                </button>
                <button
                  type="button"
                  onClick={() => pos.voidSale(sale)}
                  disabled={sale.status === "voided"}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:text-zinc-300"
                >
                  Batalkan
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
