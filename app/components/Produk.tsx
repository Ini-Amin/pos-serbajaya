"use client";

import JsBarcode from "jsbarcode";
import type { POSController, Product } from "../types/pos";

type ProdukProps = {
  pos: POSController;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pageButtons(current: number, total: number) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const visible = Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result: Array<number | "..."> = [];

  visible.forEach((page, index) => {
    const previous = visible[index - 1];

    if (previous && page - previous > 1) {
      result.push("...");
    }

    result.push(page);
  });

  return result;
}

export function Produk({ pos }: ProdukProps) {
  function createBarcodeSvg(value: string) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    JsBarcode(svg, value, {
      format: "CODE128",
      width: 1.4,
      height: 42,
      margin: 0,
      displayValue: false,
    });

    return new XMLSerializer().serializeToString(svg);
  }

  function printBarcodeLabels(product: Product) {
    const code = product.barcode.trim() || product.sku.trim();

    if (!code) {
      window.alert("Produk ini belum punya barcode atau SKU.");
      return;
    }

    const copiesInput = window.prompt(
      `Jumlah label untuk ${product.name}`,
      "12",
    );
    const copies = Number(copiesInput);

    if (!Number.isInteger(copies) || copies <= 0) {
      return;
    }

    const barcodeSvg = createBarcodeSvg(code);
    const labels = Array.from({ length: copies }, () => {
      return `
        <article class="label">
          <p class="name">${escapeHtml(product.name)}</p>
          <div class="barcode">${barcodeSvg}</div>
          <p class="code">${escapeHtml(code)}</p>
          <p class="price">${escapeHtml(pos.formatRupiah(product.price))}</p>
        </article>
      `;
    }).join("");
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      window.alert("Popup print diblokir browser.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Barcode ${escapeHtml(product.name)}</title>
          <style>
            @page { margin: 8mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111; font-family: Arial, sans-serif; }
            .sheet {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(46mm, 1fr));
              gap: 3mm;
              padding: 0;
            }
            .label {
              width: 46mm;
              min-height: 30mm;
              overflow: hidden;
              break-inside: avoid;
              border: 1px dashed #bbb;
              padding: 2.5mm;
              text-align: center;
            }
            .name {
              height: 8mm;
              margin: 0;
              overflow: hidden;
              font-size: 9px;
              font-weight: 700;
              line-height: 1.2;
            }
            .barcode svg {
              width: 100%;
              height: 13mm;
            }
            .code {
              margin: 1mm 0 0;
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .price {
              margin: 1mm 0 0;
              font-size: 10px;
              font-weight: 700;
            }
            @media print {
              .label { border-color: transparent; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">${labels}</main>
          <script>
            window.addEventListener("load", () => {
              window.print();
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

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
          disabled={pos.savingProduct}
          className="mt-4 h-11 w-full rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {pos.savingProduct
            ? "Menyimpan..."
            : pos.editingProductId
              ? "Simpan Perubahan"
              : "Tambah Produk"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-zinc-200 p-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h2 className="text-lg font-bold">Daftar Produk</h2>
            <p className="text-sm font-semibold text-zinc-500">
              {pos.productPagination.total} produk aktif
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_150px_120px] xl:min-w-[720px]">
            <input
              value={pos.productSearch}
              onChange={(event) => pos.setProductSearch(event.target.value)}
              placeholder="Cari nama, SKU, barcode"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            />
            <select
              value={pos.productCategory}
              onChange={(event) => pos.setProductCategory(event.target.value)}
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            >
              {pos.categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select
              value={pos.productSort}
              onChange={(event) =>
                pos.setProductSort(
                  event.target.value as typeof pos.productSort,
                )
              }
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="name">Nama</option>
              <option value="price">Harga jual</option>
              <option value="cost">Harga modal</option>
              <option value="stock">Stok</option>
              <option value="updated_at">Terbaru</option>
            </select>
            <select
              value={pos.productDir}
              onChange={(event) =>
                pos.setProductDir(event.target.value as typeof pos.productDir)
              }
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="asc">A-Z / kecil</option>
              <option value="desc">Z-A / besar</option>
            </select>
          </div>
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
              {pos.loadingProducts ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm font-semibold text-zinc-500"
                  >
                    Memuat produk...
                  </td>
                </tr>
              ) : pos.products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm font-semibold text-zinc-500"
                  >
                    Produk tidak ditemukan.
                  </td>
                </tr>
              ) : (
                pos.products.map((product) => (
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
                          onClick={() => printBarcodeLabels(product)}
                          className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-bold hover:border-blue-300 hover:text-blue-700"
                        >
                          Barcode
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-zinc-500">
            Halaman {pos.productPagination.page} dari{" "}
            {pos.productPagination.totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => pos.setProductPage((page) => Math.max(1, page - 1))}
              disabled={!pos.productPagination.hasPrev || pos.loadingProducts}
              className="h-9 rounded-md border border-zinc-200 px-3 text-sm font-bold disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Previous
            </button>
            {pageButtons(
              pos.productPagination.page,
              pos.productPagination.totalPages,
            ).map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm font-bold text-zinc-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => pos.setProductPage(page)}
                  disabled={pos.loadingProducts}
                  className={`h-9 min-w-9 rounded-md border px-3 text-sm font-bold ${
                    page === pos.productPagination.page
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() =>
                pos.setProductPage((page) =>
                  Math.min(pos.productPagination.totalPages, page + 1),
                )
              }
              disabled={!pos.productPagination.hasNext || pos.loadingProducts}
              className="h-9 rounded-md border border-zinc-200 px-3 text-sm font-bold disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
