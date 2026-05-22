"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Scan } from "./Scan";
import type { POSController } from "../types/pos";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KasirProps = {
  pos: POSController;
};

export function Kasir({ pos }: KasirProps) {
  return (
    <section className="grid gap-3 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="flex min-h-0 flex-col gap-3">
        <Scan pos={pos} />

        <Card size="sm" className="shadow-none">
          <CardContent>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-1.5">
                <Label>Cari produk</Label>
                <Input
                  value={pos.query}
                  onChange={(event) => pos.setQuery(event.target.value)}
                  placeholder="Nama, SKU, barcode"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select
                  value={pos.categoryFilter}
                  onValueChange={pos.setCategoryFilter}
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
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-0 flex-1 gap-0 overflow-hidden py-0 shadow-none">
          <div className="grid grid-cols-[1fr_96px_120px_88px] gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase text-muted-foreground max-md:hidden">
            <span>Produk</span>
            <span>Stok</span>
            <span>Harga</span>
            <span className="text-right">Aksi</span>
          </div>

          <ScrollArea className="h-[62vh] min-h-0 xl:h-auto xl:flex-1">
            <div className="divide-y">
              {pos.loadingCashierProducts ? (
                <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
                  Memuat produk...
                </div>
              ) : pos.filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-muted-foreground">
                  Produk tidak ditemukan.
                </div>
              ) : (
                pos.filteredProducts.map((product) => {
                  const cartQty =
                    pos.cart.find((line) => line.product.id === product.id)
                      ?.qty ?? 0;
                  const isLow = product.stock <= product.minStock;
                  const canAdd = product.stock > 0 && cartQty < product.stock;

                  return (
                    <article
                      key={product.id}
                      className="grid gap-3 px-4 py-3 transition hover:bg-muted/40 md:grid-cols-[1fr_96px_120px_88px] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3 md:block">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold leading-5">
                              {product.name}
                            </h3>
                            <p className="truncate text-xs font-medium text-muted-foreground">
                              {product.sku} / {product.category}
                              {product.barcode ? ` / ${product.barcode}` : ""}
                            </p>
                          </div>
                          <Badge
                            variant={isLow ? "destructive" : "secondary"}
                            className="md:hidden"
                          >
                            {product.stock} {product.unit}
                          </Badge>
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <Badge variant={isLow ? "destructive" : "secondary"}>
                          {product.stock} {product.unit}
                        </Badge>
                      </div>

                      <p className="text-base font-semibold text-emerald-800">
                        {pos.formatRupiah(product.price)}
                      </p>

                      <Button
                        type="button"
                        onClick={() => pos.addToCart(product)}
                        disabled={!canAdd}
                        size="sm"
                      >
                        {cartQty > 0 ? `+${cartQty}` : "Tambah"}
                      </Button>
                    </article>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      <Card className="flex min-h-0 flex-col py-4 shadow-none xl:h-full">
        <CardHeader className="grid-cols-[1fr_auto] items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Keranjang
            </CardTitle>
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {pos.cartItems.length} item
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={pos.clearCart}
            disabled={pos.cart.length === 0}
          >
            <Trash2 className="size-3.5" />
            Kosongkan
          </Button>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-[180px] flex-1 pr-2">
            <div className="space-y-3">
              {pos.cartItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm font-semibold text-muted-foreground">
                  Belum ada item
                </div>
              ) : (
                pos.cartItems.map((line) => (
                  <div key={line.product.id} className="rounded-lg border p-3">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-snug">
                          {line.product.name}
                        </p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {pos.formatRupiah(line.product.price)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold">
                        {pos.formatRupiah(line.subtotal)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex h-8 items-center overflow-hidden rounded-lg border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() =>
                            pos.updateCartQty(line.product.id, line.qty - 1)
                          }
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <Input
                          value={line.qty}
                          onChange={(event) =>
                            pos.updateCartQty(
                              line.product.id,
                              Number(event.target.value),
                            )
                          }
                          className="h-8 w-12 rounded-none border-y-0 text-center font-semibold"
                          inputMode="numeric"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-none"
                          onClick={() =>
                            pos.updateCartQty(line.product.id, line.qty + 1)
                          }
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        stok {line.product.stock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="mt-4 space-y-3">
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Subtotal</span>
              <span>{pos.formatRupiah(pos.cartSubtotal)}</span>
            </div>
            <div className="space-y-1.5">
              <Label>Diskon</Label>
              <Input
                value={pos.discount}
                onChange={(event) => pos.setDiscount(event.target.value)}
                placeholder="0"
                className="h-10"
                inputMode="numeric"
              />
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-lg border">
              {pos.paymentMethods.map((method) => (
                <Button
                  key={method}
                  type="button"
                  variant={pos.paymentMethod === method ? "default" : "ghost"}
                  className="h-10 rounded-none text-xs"
                  onClick={() => pos.setPaymentMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>

            {pos.paymentMethod === "Tunai" ? (
              <div className="space-y-1.5">
                <Label>Uang diterima</Label>
                <Input
                  value={pos.paid}
                  onChange={(event) => pos.setPaid(event.target.value)}
                  placeholder="0"
                  className="h-10"
                  inputMode="numeric"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Input
                value={pos.saleNote}
                onChange={(event) => pos.setSaleNote(event.target.value)}
                placeholder="Opsional"
                className="h-10"
              />
            </div>

            <div className="rounded-lg bg-zinc-950 p-4 text-white">
              <div className="flex justify-between text-sm font-semibold text-zinc-300">
                <span>Total</span>
                <span>{pos.formatRupiah(pos.saleTotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm font-semibold text-zinc-300">
                <span>Kembali</span>
                <span>{pos.formatRupiah(pos.changeValue)}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={pos.completeSale}
              disabled={!pos.canCompleteSale}
              className="h-11 w-full text-base"
            >
              {pos.checkingOut ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
