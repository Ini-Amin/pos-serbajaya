"use client";

import Image from "next/image";
import {
  CheckCircle2,
  ClipboardList,
  FileImage,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { POSController, Product } from "../types/pos";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type NotaProps = {
  pos: POSController;
};

type PurchaseNoteItem = {
  id: string;
  productName: string;
  matchedProductId: string | null;
  qty: number;
  price: number;
  subtotal: number;
};

type PurchaseNote = {
  id: string;
  supplierName: string;
  noteDate: string;
  invoiceNumber: string;
  imageUrl: string;
  note: string;
  total: number;
  status: "draft" | "reviewed" | "applied";
  appliedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseNoteItem[];
};

type DraftItem = {
  id: string;
  productName: string;
  matchedProductId: string;
  qty: string;
  price: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

const emptyPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false,
};

function createDraftItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    productName: "",
    matchedProductId: "",
    qty: "1",
    price: "",
  };
}

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function parseMoney(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

async function readApiJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function readApiMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as Product;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.sku === "string" &&
    typeof product.price === "number" &&
    typeof product.cost === "number"
  );
}

function isPurchaseNote(value: unknown): value is PurchaseNote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as PurchaseNote;

  return (
    typeof note.id === "string" &&
    typeof note.supplierName === "string" &&
    typeof note.noteDate === "string" &&
    Array.isArray(note.items)
  );
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Foto nota tidak bisa dibaca."));
    reader.readAsDataURL(file);
  });
}

function statusLabel(status: PurchaseNote["status"]) {
  if (status === "applied") {
    return "Sudah masuk stok";
  }

  if (status === "reviewed") {
    return "Sudah dicek";
  }

  return "Draft";
}

export function Nota({ pos }: NotaProps) {
  const [supplierName, setSupplierName] = useState("");
  const [noteDate, setNoteDate] = useState(todayKey());
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [items, setItems] = useState<DraftItem[]>([createDraftItem()]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [notes, setNotes] = useState<PurchaseNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [debouncedNoteSearch, setDebouncedNoteSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>(emptyPagination);

  const [productLookup, setProductLookup] = useState("");
  const [debouncedProductLookup, setDebouncedProductLookup] = useState("");
  const [productOptions, setProductOptions] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const noteTotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.qty || 0) * parseMoney(item.price),
        0,
      ),
    [items],
  );

  const loadNotes = useCallback(async () => {
    setLoadingNotes(true);

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        search: debouncedNoteSearch,
        status: statusFilter === "all" ? "" : statusFilter,
      });
      const response = await fetch(`/api/purchase-notes?${params.toString()}`);
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Gagal memuat nota."));
      }

      const result = payload as {
        items?: unknown[];
        pagination?: Pagination;
      };

      setNotes(
        Array.isArray(result.items)
          ? result.items.filter(isPurchaseNote)
          : [],
      );
      setPagination(result.pagination ?? emptyPagination);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal memuat nota.");
    } finally {
      setLoadingNotes(false);
    }
  }, [debouncedNoteSearch, page, statusFilter]);

  const loadProductOptions = useCallback(async () => {
    setLoadingProducts(true);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        search: debouncedProductLookup,
        category: "Semua",
        sort: "name",
        dir: "asc",
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Gagal memuat pilihan produk."));
      }

      const result = payload as { items?: unknown[] };
      setProductOptions(
        Array.isArray(result.items) ? result.items.filter(isProduct) : [],
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal memuat pilihan produk.",
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [debouncedProductLookup]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedNoteSearch(noteSearch);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [noteSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductLookup(productLookup);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [productLookup]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Query controls intentionally reset pagination. */
    setPage(1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [statusFilter]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Fetching server data into local UI state. */
    void loadNotes();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadNotes]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Fetching server data into local UI state. */
    void loadProductOptions();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [loadProductOptions]);

  function resetForm() {
    setSupplierName("");
    setNoteDate(todayKey());
    setInvoiceNumber("");
    setImageUrl("");
    setNoteText("");
    setItems([createDraftItem()]);
    setEditingId(null);
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function selectProduct(itemId: string, productId: string) {
    const product = productOptions.find((option) => option.id === productId);

    if (!product) {
      updateItem(itemId, { matchedProductId: "" });
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              matchedProductId: product.id,
              productName: item.productName.trim() || product.name,
              price: item.price || String(product.cost || product.price),
            }
          : item,
      ),
    );
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setImageUrl(await fileToDataUrl(file));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Foto nota tidak bisa dibaca.",
      );
    }
  }

  async function saveNote() {
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        supplierName,
        noteDate,
        invoiceNumber,
        imageUrl,
        note: noteText,
        items: items.map((item) => ({
          productName: item.productName,
          matchedProductId: item.matchedProductId || null,
          qty: Number(item.qty) || 0,
          price: parseMoney(item.price),
        })),
      };
      const response = await fetch(
        editingId ? `/api/purchase-notes/${editingId}` : "/api/purchase-notes",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await readApiJson(response);

      if (!response.ok) {
        throw new Error(readApiMessage(result, "Nota gagal disimpan."));
      }

      setMessage(editingId ? "Nota diperbarui." : "Nota disimpan.");
      resetForm();
      await loadNotes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nota gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  function editNote(note: PurchaseNote) {
    setEditingId(note.id);
    setSupplierName(note.supplierName);
    setNoteDate(note.noteDate);
    setInvoiceNumber(note.invoiceNumber);
    setImageUrl(note.imageUrl);
    setNoteText(note.note);
    setItems(
      note.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        matchedProductId: item.matchedProductId ?? "",
        qty: String(item.qty),
        price: String(item.price),
      })),
    );
  }

  async function applyNote(note: PurchaseNote) {
    const unlinkedItem = note.items.find((item) => !item.matchedProductId);

    if (unlinkedItem) {
      setMessage("Semua item harus dihubungkan ke produk sebelum masuk stok.");
      return;
    }

    const ok = window.confirm(`Terapkan nota dari ${note.supplierName} ke stok?`);

    if (!ok) {
      return;
    }

    setApplyingId(note.id);
    setMessage("");

    try {
      const response = await fetch(`/api/purchase-notes/${note.id}/apply`, {
        method: "POST",
      });
      const result = await readApiJson(response);

      if (!response.ok) {
        throw new Error(readApiMessage(result, "Nota gagal diterapkan."));
      }

      setMessage("Nota diterapkan ke stok.");
      await Promise.all([
        loadNotes(),
        pos.refreshProducts(),
        pos.refreshCashierProducts(),
      ]);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Nota gagal diterapkan.",
      );
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
      <div className="space-y-4">
        <Card className="shadow-none">
          <CardHeader className="grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="size-4 text-primary" />
                Nota / Pembelian
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground">
                Arsip foto nota dan catat barang masuk manual.
              </p>
            </div>
            {editingId ? (
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                size="sm"
              >
                Batal Edit
              </Button>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            {message ? (
              <Alert>
                <AlertDescription className="font-semibold text-foreground">
                  {message}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Sales / Supplier</Label>
                <Input
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="Nama sales atau toko supplier"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal Nota</Label>
                <Input
                  type="date"
                  value={noteDate}
                  onChange={(event) => setNoteDate(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nomor Nota</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  placeholder="Opsional"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Foto Nota</Label>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) =>
                    handleImageUpload(event.target.files?.[0])
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Opsional"
                className="min-h-20"
              />
            </div>

            {imageUrl ? (
              <div className="overflow-hidden rounded-lg border bg-muted/30">
                <Image
                  src={imageUrl}
                  alt="Preview nota"
                  width={900}
                  height={320}
                  unoptimized
                  className="max-h-72 w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm font-semibold text-muted-foreground">
                <FileImage className="mr-2 size-4" />
                Belum ada foto nota
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="gap-3 md:grid-cols-[1fr_280px] md:items-end">
            <div>
              <CardTitle>Isi Barang Nota</CardTitle>
              <p className="text-sm font-medium text-muted-foreground">
                Hubungkan item ke produk sebelum diterapkan ke stok.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Cari Produk Link</Label>
              <Input
                value={productLookup}
                onChange={(event) => setProductLookup(event.target.value)}
                placeholder="Nama, SKU, barcode"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[1.2fr_1.1fr_90px_130px_120px_auto]"
              >
                <div className="space-y-1.5">
                  <Label>Nama di nota</Label>
                  <Input
                    value={item.productName}
                    onChange={(event) =>
                      updateItem(item.id, { productName: event.target.value })
                    }
                    placeholder={`Barang ${index + 1}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Produk terkait</Label>
                  <Select
                    value={item.matchedProductId || "__none__"}
                    onValueChange={(value) =>
                      selectProduct(item.id, value === "__none__" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {loadingProducts ? "Memuat..." : "Belum dihubungkan"}
                      </SelectItem>
                      {productOptions.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} / {product.sku}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Qty</Label>
                  <Input
                    value={item.qty}
                    onChange={(event) =>
                      updateItem(item.id, { qty: event.target.value })
                    }
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Harga Beli</Label>
                  <Input
                    value={item.price}
                    onChange={(event) =>
                      updateItem(item.id, { price: event.target.value })
                    }
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <Label>Subtotal</Label>
                  <p className="mt-2 font-semibold">
                    {pos.formatRupiah(Number(item.qty || 0) * parseMoney(item.price))}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setItems((current) =>
                      current.length === 1
                        ? [createDraftItem()]
                        : current.filter((line) => line.id !== item.id),
                    )
                  }
                  className="h-10 self-end text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Hapus
                </Button>
              </div>
            ))}
            </div>

            <Separator />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setItems((current) => [...current, createDraftItem()])
                }
              >
                <Plus className="size-4" />
                Tambah Item
              </Button>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Total:{" "}
                <span className="text-base font-semibold text-foreground">
                  {pos.formatRupiah(noteTotal)}
                </span>
              </p>
              <Button
                type="button"
                onClick={saveNote}
                disabled={saving}
              >
                {saving ? "Menyimpan..." : editingId ? "Simpan Edit" : "Simpan Nota"}
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0 shadow-none">
        <div className="space-y-3 border-b p-4">
          <div>
            <CardTitle>Riwayat Nota</CardTitle>
            <p className="text-sm font-medium text-muted-foreground">
              {pagination.total} nota tersimpan
            </p>
          </div>
          <Input
            value={noteSearch}
            onChange={(event) => setNoteSearch(event.target.value)}
            placeholder="Cari supplier, nomor nota, catatan"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="reviewed">Sudah dicek</SelectItem>
              <SelectItem value="applied">Sudah masuk stok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[calc(100dvh-320px)] min-h-[360px]">
          <div className="space-y-3 p-4">
          {loadingNotes ? (
            <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
              Memuat nota...
            </p>
          ) : notes.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-muted-foreground">
              Belum ada nota.
            </p>
          ) : (
            notes.map((purchaseNote) => (
              <article
                key={purchaseNote.id}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {purchaseNote.supplierName}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground">
                      {purchaseNote.noteDate}
                      {purchaseNote.invoiceNumber
                        ? ` / ${purchaseNote.invoiceNumber}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      purchaseNote.status === "applied" ? "default" : "secondary"
                    }
                    className="shrink-0"
                  >
                    {statusLabel(purchaseNote.status)}
                  </Badge>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  {purchaseNote.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-muted/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.productName}</p>
                        <p className="text-xs font-medium text-muted-foreground">
                          {item.matchedProductId
                            ? "Terhubung ke produk"
                            : "Belum terhubung"}
                        </p>
                      </div>
                      <p className="font-bold">
                        {item.qty} x {pos.formatRupiah(item.price)}
                      </p>
                    </div>
                  ))}
                </div>

                {purchaseNote.imageUrl ? (
                  <Button asChild variant="link" className="mt-2 h-auto px-0">
                    <a
                      href={purchaseNote.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileImage className="size-4" />
                      Lihat foto nota
                    </a>
                  </Button>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {pos.formatRupiah(purchaseNote.total)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {purchaseNote.status !== "applied" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editNote(purchaseNote)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => applyNote(purchaseNote)}
                      disabled={
                        purchaseNote.status === "applied" ||
                        applyingId === purchaseNote.id
                      }
                    >
                      <CheckCircle2 className="size-3.5" />
                      {applyingId === purchaseNote.id
                        ? "Menerapkan..."
                        : "Terapkan Stok"}
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-3 border-t p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!pagination.hasPrev || loadingNotes}
          >
            Previous
          </Button>
          <p className="text-sm font-medium text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            disabled={!pagination.hasNext || loadingNotes}
          >
            Next
          </Button>
        </div>
      </Card>
    </section>
  );
}
