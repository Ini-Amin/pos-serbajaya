"use client";

import { Scan } from "./Scan";
import type { POSController } from "../types/pos";

type KasirProps = {
  pos: POSController;
};

export function Kasir({ pos }: KasirProps) {
  return (
    <section className="grid gap-3 lg:h-[calc(100vh-210px)] lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="flex min-h-0 flex-col gap-3">
        <Scan pos={pos} />

        <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Cari produk
              </span>
              <input
                value={pos.query}
                onChange={(event) => pos.setQuery(event.target.value)}
                placeholder="Nama, SKU, barcode"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Kategori
              </span>
              <select
                value={pos.categoryFilter}
                onChange={(event) => pos.setCategoryFilter(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              >
                {pos.categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_108px_128px_92px] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold uppercase text-zinc-500 max-md:hidden">
            <span>Produk</span>
            <span>Stok</span>
            <span>Harga</span>
            <span className="text-right">Aksi</span>
          </div>

          <div className="max-h-[62vh] divide-y divide-zinc-200 overflow-y-auto lg:max-h-full">
            {pos.filteredProducts.map((product) => {
              const cartQty =
                pos.cart.find((line) => line.productId === product.id)?.qty ?? 0;
              const isLow = product.stock <= product.minStock;
              const canAdd = product.stock > 0 && cartQty < product.stock;

              return (
                <article
                  key={product.id}
                  className="grid gap-3 px-4 py-3 transition hover:bg-zinc-50 md:grid-cols-[1fr_108px_128px_92px] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3 md:block">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold leading-5">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-zinc-500">
                          {product.sku} / {product.category}
                          {product.barcode ? ` / ${product.barcode}` : ""}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold md:hidden ${
                          isLow
                            ? "bg-amber-100 text-amber-900"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        isLow
                          ? "bg-amber-100 text-amber-900"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {product.stock} {product.unit}
                    </span>
                  </div>

                  <p className="text-lg font-bold text-emerald-800 md:text-base">
                    {pos.formatRupiah(product.price)}
                  </p>

                  <button
                    type="button"
                    onClick={() => pos.addToCart(product)}
                    disabled={!canAdd}
                    className="h-9 rounded-md bg-zinc-950 px-3 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  >
                    {cartQty > 0 ? `+${cartQty}` : "Tambah"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col rounded-md border border-zinc-200 bg-white p-4 shadow-sm lg:h-full">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Keranjang</h2>
            <p className="text-xs font-semibold uppercase text-zinc-500">
              {pos.cartItems.length} item
            </p>
          </div>
          <button
            type="button"
            onClick={pos.clearCart}
            disabled={pos.cart.length === 0}
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm font-semibold text-zinc-700 hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            Kosongkan
          </button>
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {pos.cartItems.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-300 p-5 text-center text-sm font-semibold text-zinc-500">
              Belum ada item
            </div>
          ) : (
            pos.cartItems.map((line) => (
              <div
                key={line.product.id}
                className="rounded-md border border-zinc-200 p-3"
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold leading-snug">
                      {line.product.name}
                    </p>
                    <p className="text-sm font-semibold text-zinc-500">
                      {pos.formatRupiah(line.product.price)}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold">
                    {pos.formatRupiah(line.subtotal)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex h-9 items-center overflow-hidden rounded-md border border-zinc-300">
                    <button
                      type="button"
                      onClick={() =>
                        pos.updateCartQty(line.product.id, line.qty - 1)
                      }
                      className="h-9 w-9 bg-zinc-50 text-lg font-bold hover:bg-zinc-100"
                    >
                      -
                    </button>
                    <input
                      value={line.qty}
                      onChange={(event) =>
                        pos.updateCartQty(
                          line.product.id,
                          Number(event.target.value),
                        )
                      }
                      className="h-9 w-12 border-x border-zinc-300 text-center font-bold outline-none"
                      inputMode="numeric"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        pos.updateCartQty(line.product.id, line.qty + 1)
                      }
                      className="h-9 w-9 bg-zinc-50 text-lg font-bold hover:bg-zinc-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    stok {line.product.stock}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
          <div className="flex justify-between text-sm font-semibold">
            <span>Subtotal</span>
            <span>{pos.formatRupiah(pos.cartSubtotal)}</span>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-500">
              Diskon
            </span>
            <input
              value={pos.discount}
              onChange={(event) => pos.setDiscount(event.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              inputMode="numeric"
            />
          </label>

          <div className="grid grid-cols-3 overflow-hidden rounded-md border border-zinc-300">
            {pos.paymentMethods.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => pos.setPaymentMethod(method)}
                className={`min-h-10 px-2 text-xs font-bold transition ${
                  pos.paymentMethod === method
                    ? "bg-emerald-700 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {pos.paymentMethod === "Tunai" ? (
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Uang diterima
              </span>
              <input
                value={pos.paid}
                onChange={(event) => pos.setPaid(event.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
              />
            </label>
          ) : null}

          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-500">
              Catatan
            </span>
            <input
              value={pos.saleNote}
              onChange={(event) => pos.setSaleNote(event.target.value)}
              placeholder="Opsional"
              className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <div className="rounded-md bg-zinc-950 p-4 text-white">
            <div className="flex justify-between text-sm font-semibold text-zinc-300">
              <span>Total</span>
              <span>{pos.formatRupiah(pos.saleTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm font-semibold text-zinc-300">
              <span>Kembali</span>
              <span>{pos.formatRupiah(pos.changeValue)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={pos.completeSale}
            disabled={!pos.canCompleteSale}
            className="h-11 w-full rounded-md bg-emerald-700 px-4 text-base font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Simpan Transaksi
          </button>
        </div>
      </aside>
    </section>
  );
}
