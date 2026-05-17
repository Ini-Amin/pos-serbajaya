"use client";

import type { POSController } from "../types/pos";

type ProdukProps = {
  pos: POSController;
};

export function Produk({ pos }: ProdukProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <form
        onSubmit={pos.saveProduct}
        className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">
            {pos.editingProductId ? "Edit Produk" : "Tambah Produk"}
          </h2>
          {pos.editingProductId ? (
            <button
              type="button"
              onClick={pos.cancelEditProduct}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-semibold"
            >
              Batal
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-500">
              Nama produk
            </span>
            <input
              value={pos.productForm.name}
              onChange={(event) =>
                pos.updateProductForm("name", event.target.value)
              }
              className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                SKU
              </span>
              <input
                value={pos.productForm.sku}
                onChange={(event) =>
                  pos.updateProductForm("sku", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Barcode
              </span>
              <input
                value={pos.productForm.barcode}
                onChange={(event) =>
                  pos.updateProductForm("barcode", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Kategori
              </span>
              <input
                value={pos.productForm.category}
                onChange={(event) =>
                  pos.updateProductForm("category", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Satuan
              </span>
              <input
                value={pos.productForm.unit}
                onChange={(event) =>
                  pos.updateProductForm("unit", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Harga jual
              </span>
              <input
                value={pos.productForm.price}
                onChange={(event) =>
                  pos.updateProductForm("price", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Harga modal
              </span>
              <input
                value={pos.productForm.cost}
                onChange={(event) =>
                  pos.updateProductForm("cost", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Stok
              </span>
              <input
                value={pos.productForm.stock}
                onChange={(event) =>
                  pos.updateProductForm("stock", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Min stok
              </span>
              <input
                value={pos.productForm.minStock}
                onChange={(event) =>
                  pos.updateProductForm("minStock", event.target.value)
                }
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                inputMode="numeric"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="mt-4 h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
        >
          {pos.editingProductId ? "Simpan Perubahan" : "Tambah Produk"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-4">
          <h2 className="text-lg font-bold">Daftar Produk</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga</th>
                <th className="px-4 py-3">Modal</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {pos.products
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold">{product.name}</p>
                      <p className="text-xs font-semibold text-zinc-500">
                        {product.sku}
                        {product.barcode ? ` / ${product.barcode}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3 font-semibold">
                      {pos.formatRupiah(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      {pos.formatRupiah(product.cost)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                          product.stock <= product.minStock
                            ? "bg-amber-100 text-amber-900"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => pos.editProduct(product)}
                          className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-bold hover:border-emerald-300 hover:text-emerald-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => pos.deleteProduct(product.id)}
                          className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-bold hover:border-red-300 hover:text-red-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
