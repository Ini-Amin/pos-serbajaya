"use client";

import JsBarcode from "jsbarcode";
import { Barcode, Pencil, Trash2 } from "lucide-react";
import type { POSController, Product } from "../types/pos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="shadow-none">
        <CardHeader className="grid-cols-[1fr_auto] items-center">
          <CardTitle>
            {pos.editingProductId ? "Edit Produk" : "Tambah Produk"}
          </CardTitle>
          {pos.editingProductId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={pos.cancelEditProduct}
            >
              Batal
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <form onSubmit={pos.saveProduct} className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Nama produk</Label>
              <Input
                value={pos.productForm.name}
                onChange={(event) =>
                  pos.updateProductForm("name", event.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input
                  value={pos.productForm.sku}
                  onChange={(event) =>
                    pos.updateProductForm("sku", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Barcode</Label>
                <Input
                  value={pos.productForm.barcode}
                  onChange={(event) =>
                    pos.updateProductForm("barcode", event.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Input
                  value={pos.productForm.category}
                  onChange={(event) =>
                    pos.updateProductForm("category", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Satuan</Label>
                <Input
                  value={pos.productForm.unit}
                  onChange={(event) =>
                    pos.updateProductForm("unit", event.target.value)
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Harga jual</Label>
                <Input
                  value={pos.productForm.price}
                  onChange={(event) =>
                    pos.updateProductForm("price", event.target.value)
                  }
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Harga modal</Label>
                <Input
                  value={pos.productForm.cost}
                  onChange={(event) =>
                    pos.updateProductForm("cost", event.target.value)
                  }
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stok</Label>
                <Input
                  value={pos.productForm.stock}
                  onChange={(event) =>
                    pos.updateProductForm("stock", event.target.value)
                  }
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min stok</Label>
                <Input
                  value={pos.productForm.minStock}
                  onChange={(event) =>
                    pos.updateProductForm("minStock", event.target.value)
                  }
                  inputMode="numeric"
                />
              </div>
            </div>

            <Button type="submit" disabled={pos.savingProduct} className="h-10">
              {pos.savingProduct
                ? "Menyimpan..."
                : pos.editingProductId
                  ? "Simpan Perubahan"
                  : "Tambah Produk"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <div className="grid gap-3 border-b p-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <h2 className="text-lg font-semibold">Daftar Produk</h2>
            <p className="text-sm font-medium text-muted-foreground">
              {pos.productPagination.total} produk aktif
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_150px_120px] xl:min-w-[720px]">
            <Input
              value={pos.productSearch}
              onChange={(event) => pos.setProductSearch(event.target.value)}
              placeholder="Cari nama, SKU, barcode"
              className="h-10"
            />
            <Select
              value={pos.productCategory}
              onValueChange={pos.setProductCategory}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pos.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={pos.productSort}
              onValueChange={(value) =>
                pos.setProductSort(value as typeof pos.productSort)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="price">Harga jual</SelectItem>
                <SelectItem value="cost">Harga modal</SelectItem>
                <SelectItem value="stock">Stok</SelectItem>
                <SelectItem value="updated_at">Terbaru</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={pos.productDir}
              onValueChange={(value) =>
                pos.setProductDir(value as typeof pos.productDir)
              }
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">A-Z / kecil</SelectItem>
                <SelectItem value="desc">Z-A / besar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Produk</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Modal</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead className="pr-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pos.loadingProducts ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center font-semibold text-muted-foreground"
                >
                  Memuat produk...
                </TableCell>
              </TableRow>
            ) : pos.products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center font-semibold text-muted-foreground"
                >
                  Produk tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              pos.products.map((product) => {
                const isLow = product.stock <= product.minStock;

                return (
                  <TableRow key={product.id}>
                    <TableCell className="px-4">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs font-medium text-muted-foreground">
                        {product.sku}
                        {product.barcode ? ` / ${product.barcode}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-semibold">
                      {pos.formatRupiah(product.price)}
                    </TableCell>
                    <TableCell>{pos.formatRupiah(product.cost)}</TableCell>
                    <TableCell>
                      <Badge variant={isLow ? "destructive" : "secondary"}>
                        {product.stock} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => pos.editProduct(product)}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => printBarcodeLabels(product)}
                        >
                          <Barcode className="size-3.5" />
                          Label
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => pos.deleteProduct(product.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t px-4 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            Halaman {pos.productPagination.page} dari{" "}
            {pos.productPagination.totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => pos.setProductPage((page) => Math.max(1, page - 1))}
              disabled={!pos.productPagination.hasPrev || pos.loadingProducts}
            >
              Previous
            </Button>
            {pageButtons(
              pos.productPagination.page,
              pos.productPagination.totalPages,
            ).map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm font-bold text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  type="button"
                  variant={
                    page === pos.productPagination.page ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => pos.setProductPage(page)}
                  disabled={pos.loadingProducts}
                  className="min-w-9"
                >
                  {page}
                </Button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                pos.setProductPage((page) =>
                  Math.min(pos.productPagination.totalPages, page + 1),
                )
              }
              disabled={!pos.productPagination.hasNext || pos.loadingProducts}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
