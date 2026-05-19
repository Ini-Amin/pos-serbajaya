"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { POSController, Product } from "../types/pos";

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
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]">
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Nota / Pembelian</h2>
              <p className="text-sm font-semibold text-zinc-500">
                Arsip foto nota dan catat barang masuk manual.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold"
              >
                Batal Edit
              </button>
            ) : null}
          </div>

          {message ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {message}
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Sales / Supplier
              </span>
              <input
                value={supplierName}
                onChange={(event) => setSupplierName(event.target.value)}
                placeholder="Nama sales atau toko supplier"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Tanggal Nota
              </span>
              <input
                type="date"
                value={noteDate}
                onChange={(event) => setNoteDate(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Nomor Nota
              </span>
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                placeholder="Opsional"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Foto Nota
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
                className="block w-full text-sm font-semibold text-zinc-600 file:mr-3 file:h-10 file:rounded-md file:border-0 file:bg-zinc-950 file:px-3 file:text-sm file:font-bold file:text-white"
              />
            </label>
          </div>

          <label className="mt-3 block space-y-1">
            <span className="text-xs font-semibold uppercase text-zinc-500">
              Catatan
            </span>
            <input
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="Opsional"
              className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          {imageUrl ? (
            <div className="mt-4 overflow-hidden rounded-md border border-zinc-200">
              <Image
                src={imageUrl}
                alt="Preview nota"
                width={900}
                height={320}
                unoptimized
                className="max-h-72 w-full object-contain bg-zinc-50"
              />
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_260px] md:items-end">
            <div>
              <h3 className="font-bold">Isi Barang Nota</h3>
              <p className="text-sm font-semibold text-zinc-500">
                Hubungkan item ke produk sebelum diterapkan ke stok.
              </p>
            </div>
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase text-zinc-500">
                Cari Produk Link
              </span>
              <input
                value={productLookup}
                onChange={(event) => setProductLookup(event.target.value)}
                placeholder="Nama, SKU, barcode"
                className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-md border border-zinc-200 p-3 lg:grid-cols-[1.2fr_1.1fr_90px_130px_120px_auto]"
              >
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Nama di nota
                  </span>
                  <input
                    value={item.productName}
                    onChange={(event) =>
                      updateItem(item.id, { productName: event.target.value })
                    }
                    placeholder={`Barang ${index + 1}`}
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Produk terkait
                  </span>
                  <select
                    value={item.matchedProductId}
                    onChange={(event) => selectProduct(item.id, event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">
                      {loadingProducts ? "Memuat..." : "Belum dihubungkan"}
                    </option>
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} / {product.sku}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Qty
                  </span>
                  <input
                    value={item.qty}
                    onChange={(event) =>
                      updateItem(item.id, { qty: event.target.value })
                    }
                    inputMode="numeric"
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase text-zinc-500">
                    Harga Beli
                  </span>
                  <input
                    value={item.price}
                    onChange={(event) =>
                      updateItem(item.id, { price: event.target.value })
                    }
                    inputMode="numeric"
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <div>
                  <p className="text-xs font-semibold uppercase text-zinc-500">
                    Subtotal
                  </p>
                  <p className="mt-2 font-bold">
                    {pos.formatRupiah(Number(item.qty || 0) * parseMoney(item.price))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setItems((current) =>
                      current.length === 1
                        ? [createDraftItem()]
                        : current.filter((line) => line.id !== item.id),
                    )
                  }
                  className="h-10 self-end rounded-md border border-red-200 px-3 text-sm font-bold text-red-700"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setItems((current) => [...current, createDraftItem()])}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-bold"
            >
              Tambah Item
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-zinc-500">
                Total:{" "}
                <span className="text-base font-bold text-zinc-950">
                  {pos.formatRupiah(noteTotal)}
                </span>
              </p>
              <button
                type="button"
                onClick={saveNote}
                disabled={saving}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {saving ? "Menyimpan..." : editingId ? "Simpan Edit" : "Simpan Nota"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="space-y-3 border-b border-zinc-200 p-4">
          <div>
            <h2 className="text-lg font-bold">Riwayat Nota</h2>
            <p className="text-sm font-semibold text-zinc-500">
              {pagination.total} nota tersimpan
            </p>
          </div>
          <input
            value={noteSearch}
            onChange={(event) => setNoteSearch(event.target.value)}
            placeholder="Cari supplier, nomor nota, catatan"
            className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 w-full rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">Semua status</option>
            <option value="draft">Draft</option>
            <option value="applied">Sudah masuk stok</option>
          </select>
        </div>

        <div className="max-h-[calc(100dvh-310px)] min-h-[360px] space-y-3 overflow-y-auto p-4">
          {loadingNotes ? (
            <p className="py-8 text-center text-sm font-semibold text-zinc-500">
              Memuat nota...
            </p>
          ) : notes.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-zinc-500">
              Belum ada nota.
            </p>
          ) : (
            notes.map((purchaseNote) => (
              <article
                key={purchaseNote.id}
                className="rounded-md border border-zinc-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">
                      {purchaseNote.supplierName}
                    </h3>
                    <p className="text-sm font-semibold text-zinc-500">
                      {purchaseNote.noteDate}
                      {purchaseNote.invoiceNumber
                        ? ` / ${purchaseNote.invoiceNumber}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${
                      purchaseNote.status === "applied"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {statusLabel(purchaseNote.status)}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  {purchaseNote.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-zinc-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.productName}</p>
                        <p className="text-xs font-semibold text-zinc-500">
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
                  <a
                    href={purchaseNote.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-bold text-emerald-700"
                  >
                    Lihat foto nota
                  </a>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{pos.formatRupiah(purchaseNote.total)}</p>
                  <div className="flex flex-wrap gap-2">
                    {purchaseNote.status !== "applied" ? (
                      <button
                        type="button"
                        onClick={() => editNote(purchaseNote)}
                        className="rounded-md border border-zinc-200 px-3 py-2 text-xs font-bold"
                      >
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => applyNote(purchaseNote)}
                      disabled={
                        purchaseNote.status === "applied" ||
                        applyingId === purchaseNote.id
                      }
                      className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                    >
                      {applyingId === purchaseNote.id
                        ? "Menerapkan..."
                        : "Terapkan Stok"}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-zinc-200 p-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!pagination.hasPrev || loadingNotes}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            Previous
          </button>
          <p className="text-sm font-semibold text-zinc-500">
            {pagination.page} / {pagination.totalPages}
          </p>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            disabled={!pagination.hasNext || loadingNotes}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:text-zinc-300"
          >
            Next
          </button>
        </div>
      </aside>
    </section>
  );
}
