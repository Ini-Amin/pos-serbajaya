"use client";

import type { POSController, StatTone } from "../types/pos";

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

export function Laporan({ pos }: LaporanProps) {
  const totalStock = pos.products.reduce(
    (total, product) => total + product.stock,
    0,
  );

  return (
    <section className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Item terjual hari ini"
          value={`${pos.todayItemCount} item`}
        />
        <StatTile
          label="Rata-rata nota"
          value={pos.formatRupiah(pos.averageBasket)}
        />
        <StatTile label="Total stok" value={`${totalStock} item`} tone="green" />
        <StatTile label="Produk aktif" value={`${pos.products.length} produk`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">Produk Terlaris</h2>
          <div className="mt-4 space-y-3">
            {pos.productSalesRanking.length === 0 ? (
              <p className="text-sm font-semibold text-zinc-500">
                Belum ada data penjualan.
              </p>
            ) : (
              pos.productSalesRanking.map((item, index) => (
                <div
                  key={item.name}
                  className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md border border-zinc-200 p-3"
                >
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm font-semibold text-zinc-500">
                      {item.qty} item / laba {pos.formatRupiah(item.profit)}
                    </p>
                  </div>
                  <p className="font-bold">{pos.formatRupiah(item.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold">Stok Menipis</h2>
          <div className="mt-4 space-y-3">
            {pos.lowStockProducts.length === 0 ? (
              <p className="text-sm font-semibold text-zinc-500">
                Semua stok masih aman.
              </p>
            ) : (
              pos.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3"
                >
                  <div>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-sm font-semibold text-amber-900">
                      Minimal {product.minStock} {product.unit}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => pos.editProduct(product)}
                    className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-900"
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
