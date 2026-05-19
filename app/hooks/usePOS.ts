"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CartItem,
  CartLine,
  Notice,
  PaymentMethod,
  POSController,
  Product,
  ProductForm,
  ProductPagination,
  ProductSalesRank,
  ProductSort,
  ProductSortDirection,
  ProductSummary,
  Sale,
  TabItem,
  TabKey,
} from "../types/pos";

const STORAGE_KEY = "serbajaya-pos-local-v1";
const PRODUCT_LIMIT = 20;

const emptyProductForm: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "Kelistrikan",
  unit: "pcs",
  price: "",
  cost: "",
  stock: "",
  minStock: "3",
};

const emptyPagination: ProductPagination = {
  page: 1,
  limit: PRODUCT_LIMIT,
  total: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false,
};

const emptySummary: ProductSummary = {
  totalProducts: 0,
  totalStock: 0,
  lowStockCount: 0,
};

const tabs: TabItem[] = [
  { key: "kasir", label: "Kasir" },
  { key: "produk", label: "Produk" },
  { key: "riwayat", label: "Riwayat" },
  { key: "laporan", label: "Laporan" },
  { key: "backup", label: "Backup" },
];

const paymentMethods: PaymentMethod[] = ["Tunai", "QRIS Manual", "Transfer"];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getLocalDateKey(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parseMoney(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    typeof product.category === "string" &&
    typeof product.unit === "string" &&
    typeof product.price === "number" &&
    typeof product.cost === "number" &&
    typeof product.stock === "number" &&
    typeof product.minStock === "number"
  );
}

function isSale(value: unknown): value is Sale {
  if (!value || typeof value !== "object") {
    return false;
  }

  const sale = value as Sale;

  return (
    typeof sale.id === "string" &&
    typeof sale.invoice === "string" &&
    typeof sale.soldAt === "string" &&
    Array.isArray(sale.items) &&
    typeof sale.total === "number"
  );
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

async function readApiJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function normalizeSale(value: unknown): Sale | null {
  if (!isSale(value)) {
    return null;
  }

  return {
    ...value,
    status: value.status ?? "completed",
    paymentMethod: value.paymentMethod ?? "Tunai",
    note: value.note ?? "",
  };
}

export function usePOS(): POSController {
  const [products, setProducts] = useState<Product[]>([]);
  const [cashierProducts, setCashierProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("kasir");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [cashierSearch, setCashierSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("Semua");
  const [productSort, setProductSort] = useState<ProductSort>("name");
  const [productDir, setProductDir] = useState<ProductSortDirection>("asc");
  const [productPage, setProductPage] = useState(1);
  const [productLimit, setProductLimit] = useState(PRODUCT_LIMIT);
  const [productPagination, setProductPagination] =
    useState<ProductPagination>(emptyPagination);
  const [productSummary, setProductSummary] =
    useState<ProductSummary>(emptySummary);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCashierProducts, setLoadingCashierProducts] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [discount, setDiscount] = useState("");
  const [paid, setPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Tunai");
  const [saleNote, setSaleNote] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [ready, setReady] = useState(false);
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [historyQuery, setHistoryQuery] = useState("");

  function showNotice(tone: NonNullable<Notice>["tone"], message: string) {
    setNotice({ tone, message });
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCashierSearch(query);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedProductSearch(productSearch);
      setProductPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [productSearch]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Product query controls intentionally reset pagination. */
    setProductPage(1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [productCategory, productDir, productLimit, productSort]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Sales history is hydrated from localStorage after mount. */
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          sales?: unknown[];
        };
        const storedSales = Array.isArray(parsed.sales)
          ? parsed.sales
              .map(normalizeSale)
              .filter((sale): sale is Sale => Boolean(sale))
          : [];

        setSales(storedSales);
      } catch {
        setNotice({
          tone: "error",
          message: "Data transaksi lokal tidak bisa dibaca.",
        });
      }
    }

    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sales }));
  }, [ready, sales]);

  const refreshProducts = useCallback(async () => {
    setLoadingProducts(true);

    try {
      const params = new URLSearchParams({
        page: String(productPage),
        limit: String(productLimit),
        search: debouncedProductSearch,
        category: productCategory,
        sort: productSort,
        dir: productDir,
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Gagal memuat produk."));
      }

      const result = payload as {
        items?: unknown[];
        pagination?: ProductPagination;
        categories?: string[];
        summary?: ProductSummary;
      };

      setProducts(Array.isArray(result.items) ? result.items.filter(isProduct) : []);
      setProductPagination(result.pagination ?? emptyPagination);
      setCategories(
        Array.isArray(result.categories) && result.categories.length > 0
          ? result.categories
          : ["Semua"],
      );
      setProductSummary(result.summary ?? emptySummary);
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "Gagal memuat produk.",
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [
    debouncedProductSearch,
    productCategory,
    productDir,
    productLimit,
    productPage,
    productSort,
  ]);

  const refreshCashierProducts = useCallback(async () => {
    setLoadingCashierProducts(true);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        search: cashierSearch,
        category: categoryFilter,
        sort: "name",
        dir: "asc",
      });
      const response = await fetch(`/api/products?${params.toString()}`);
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Gagal memuat produk kasir."));
      }

      const result = payload as { items?: unknown[]; categories?: string[] };

      setCashierProducts(
        Array.isArray(result.items) ? result.items.filter(isProduct) : [],
      );
      setCategories((current) =>
        Array.isArray(result.categories) && result.categories.length > current.length
          ? result.categories
          : current,
      );
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "Gagal memuat produk kasir.",
      );
    } finally {
      setLoadingCashierProducts(false);
    }
  }, [cashierSearch, categoryFilter]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Fetching from the products API synchronizes server data into UI state. */
    void refreshProducts();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refreshProducts]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Fetching from the products API synchronizes server data into UI state. */
    void refreshCashierProducts();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refreshCashierProducts]);

  const completedSales = useMemo(
    () => sales.filter((sale) => sale.status !== "voided"),
    [sales],
  );

  const todaySales = useMemo(() => {
    const today = getLocalDateKey();

    return completedSales.filter(
      (sale) => getLocalDateKey(new Date(sale.soldAt)) === today,
    );
  }, [completedSales]);

  const lowStockProducts = useMemo(
    () => products.filter((product) => product.stock <= product.minStock),
    [products],
  );

  const cartItems = useMemo<CartItem[]>(
    () =>
      cart.map((line) => ({
        ...line,
        subtotal: line.product.price * line.qty,
      })),
    [cart],
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((total, line) => total + line.subtotal, 0),
    [cartItems],
  );
  const discountValue = Math.min(parseMoney(discount), cartSubtotal);
  const saleTotal = Math.max(0, cartSubtotal - discountValue);
  const paidValue = paymentMethod === "Tunai" ? parseMoney(paid) : saleTotal;
  const changeValue = Math.max(0, paidValue - saleTotal);
  const hasStockProblem = cartItems.some((line) => line.qty > line.product.stock);
  const canCompleteSale =
    cartItems.length > 0 &&
    !hasStockProblem &&
    !checkingOut &&
    (paymentMethod !== "Tunai" || paidValue >= saleTotal);

  const todayRevenue = todaySales.reduce((total, sale) => total + sale.total, 0);
  const todayProfit = todaySales.reduce((total, sale) => {
    const gross = sale.items.reduce(
      (itemTotal, item) => itemTotal + (item.price - item.cost) * item.qty,
      0,
    );

    return total + gross - sale.discount;
  }, 0);
  const todayItemCount = todaySales.reduce(
    (total, sale) =>
      total + sale.items.reduce((itemTotal, item) => itemTotal + item.qty, 0),
    0,
  );
  const averageBasket =
    todaySales.length > 0 ? Math.round(todayRevenue / todaySales.length) : 0;

  const productSalesRanking = useMemo<ProductSalesRank[]>(() => {
    const totals = new Map<string, ProductSalesRank>();

    completedSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const current = totals.get(item.productId) ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
          profit: 0,
        };

        current.qty += item.qty;
        current.revenue += item.subtotal;
        current.profit += (item.price - item.cost) * item.qty;
        totals.set(item.productId, current);
      });
    });

    return Array.from(totals.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [completedSales]);

  const filteredSales = useMemo(() => {
    const term = normalize(historyQuery);

    return [...sales]
      .filter((sale) => {
        if (!term) {
          return true;
        }

        const haystack = normalize(
          `${sale.invoice} ${sale.paymentMethod} ${sale.note} ${sale.items
            .map((item) => `${item.name} ${item.sku}`)
            .join(" ")}`,
        );

        return haystack.includes(term);
      })
      .sort(
        (a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime(),
      );
  }, [historyQuery, sales]);

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      showNotice("warning", `${product.name} sedang kosong.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);

      if (!existing) {
        return [...current, { product, qty: 1 }];
      }

      if (existing.qty >= product.stock) {
        showNotice("warning", `Stok ${product.name} hanya ${product.stock}.`);
        return current;
      }

      return current.map((line) =>
        line.product.id === product.id
          ? { product, qty: line.qty + 1 }
          : line,
      );
    });
  }

  function updateCartQty(productId: string, nextQty: number) {
    const line = cart.find((item) => item.product.id === productId);

    if (!line) {
      return;
    }

    const boundedQty = Math.max(0, Math.min(nextQty, line.product.stock));

    setCart((current) =>
      boundedQty === 0
        ? current.filter((item) => item.product.id !== productId)
        : current.map((item) =>
            item.product.id === productId ? { ...item, qty: boundedQty } : item,
          ),
    );
  }

  function clearCart() {
    setCart([]);
  }

  async function completeSale() {
    if (!canCompleteSale) {
      showNotice("warning", "Periksa keranjang, stok, dan nominal bayar.");
      return;
    }

    setCheckingOut(true);

    try {
      const response = await fetch("/api/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((line) => ({
            productId: line.product.id,
            qty: line.qty,
          })),
          discount: discountValue,
          paymentMethod,
          paid: paidValue,
          note: saleNote.trim(),
        }),
      });
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Transaksi gagal disimpan."));
      }

      const sale = normalizeSale((payload as { sale?: unknown }).sale);

      if (!sale) {
        throw new Error("Response transaksi tidak valid.");
      }

      setSales((current) => [sale, ...current]);
      setCart([]);
      setDiscount("");
      setPaid("");
      setSaleNote("");
      showNotice("success", `Transaksi ${sale.invoice} tersimpan.`);
      await Promise.all([refreshProducts(), refreshCashierProducts()]);
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "Transaksi gagal disimpan.",
      );
    } finally {
      setCheckingOut(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productForm.name.trim();
    const price = parseMoney(productForm.price);

    if (!name || price <= 0) {
      showNotice("warning", "Nama produk dan harga jual wajib diisi.");
      return;
    }

    setSavingProduct(true);

    try {
      const response = await fetch(
        editingProductId ? `/api/products/${editingProductId}` : "/api/products",
        {
          method: editingProductId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productForm),
        },
      );
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Produk gagal disimpan."));
      }

      const savedProduct = (payload as { item?: unknown }).item;

      if (isProduct(savedProduct)) {
        setCart((current) =>
          current.map((line) =>
            line.product.id === savedProduct.id
              ? { ...line, product: savedProduct }
              : line,
          ),
        );
      }

      setProductForm(emptyProductForm);
      setEditingProductId(null);
      showNotice(
        "success",
        editingProductId ? "Produk diperbarui." : "Produk ditambahkan.",
      );
      await Promise.all([refreshProducts(), refreshCashierProducts()]);
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "Produk gagal disimpan.",
      );
    } finally {
      setSavingProduct(false);
    }
  }

  function editProduct(product: Product) {
    setActiveTab("produk");
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      unit: product.unit,
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      minStock: String(product.minStock),
    });
  }

  function cancelEditProduct() {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
  }

  async function deleteProduct(productId: string) {
    const product =
      products.find((item) => item.id === productId) ??
      cashierProducts.find((item) => item.id === productId) ??
      cart.find((item) => item.product.id === productId)?.product;

    if (!product) {
      return;
    }

    const ok = window.confirm(
      `Nonaktifkan produk ${product.name}? Riwayat transaksi tetap tersimpan.`,
    );

    if (!ok) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      const payload = await readApiJson(response);

      if (!response.ok) {
        throw new Error(readApiMessage(payload, "Produk gagal dihapus."));
      }

      setCart((current) =>
        current.filter((item) => item.product.id !== productId),
      );
      showNotice("success", "Produk dinonaktifkan.");
      await Promise.all([refreshProducts(), refreshCashierProducts()]);
    } catch (error) {
      showNotice(
        "error",
        error instanceof Error ? error.message : "Produk gagal dihapus.",
      );
    }
  }

  function voidSale(sale: Sale) {
    if (sale.status === "voided") {
      return;
    }

    const ok = window.confirm(`Batalkan transaksi ${sale.invoice}?`);

    if (!ok) {
      return;
    }

    const now = new Date().toISOString();
    setSales((current) =>
      current.map((item) =>
        item.id === sale.id ? { ...item, status: "voided", voidedAt: now } : item,
      ),
    );
    showNotice("success", `Transaksi ${sale.invoice} dibatalkan di riwayat lokal.`);
  }

  function printSale(sale: Sale) {
    const printWindow = window.open("", "_blank", "width=360,height=640");

    if (!printWindow) {
      showNotice("warning", "Popup struk diblokir browser.");
      return;
    }

    const rows = sale.items
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${escapeHtml(item.name)}</strong><br />
              <span>${item.qty} x ${formatRupiah(item.price)}</span>
            </td>
            <td style="text-align:right">${formatRupiah(item.subtotal)}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(sale.invoice)}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 280px; color: #111; margin: 16px; }
            h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
            p { margin: 2px 0; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            td { border-top: 1px dashed #aaa; padding: 7px 0; font-size: 12px; vertical-align: top; }
            .total td { font-weight: 700; border-top: 1px solid #111; }
            .center { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Serbajaya Elektronik</h1>
          <p class="center">POS Lokal</p>
          <p>No: ${escapeHtml(sale.invoice)}</p>
          <p>${formatDateTime(sale.soldAt)}</p>
          <table>
            ${rows}
            <tr><td>Subtotal</td><td style="text-align:right">${formatRupiah(sale.subtotal)}</td></tr>
            <tr><td>Diskon</td><td style="text-align:right">${formatRupiah(sale.discount)}</td></tr>
            <tr class="total"><td>Total</td><td style="text-align:right">${formatRupiah(sale.total)}</td></tr>
            <tr><td>Bayar</td><td style="text-align:right">${formatRupiah(sale.paid)}</td></tr>
            <tr><td>Kembali</td><td style="text-align:right">${formatRupiah(sale.change)}</td></tr>
          </table>
          <p class="center">Terima kasih</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function exportBackup() {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        note: "Produk utama tersimpan di Supabase. Backup ini menyimpan transaksi lokal dan halaman produk yang sedang tampil.",
        products,
        sales,
      },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-pos-serbajaya-${getLocalDateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        sales?: unknown[];
      };
      const importedSales = Array.isArray(parsed.sales)
        ? parsed.sales
            .map(normalizeSale)
            .filter((sale): sale is Sale => Boolean(sale))
        : [];

      if (importedSales.length === 0) {
        showNotice("error", "File backup tidak punya data transaksi yang valid.");
        return;
      }

      setSales(importedSales);
      setCart([]);
      showNotice("success", "Transaksi lokal berhasil dipulihkan.");
    } catch {
      showNotice("error", "File backup tidak bisa dibaca.");
    } finally {
      event.target.value = "";
    }
  }

  function resetDemoData() {
    const ok = window.confirm("Hapus transaksi lokal dan kosongkan keranjang?");

    if (!ok) {
      return;
    }

    setSales([]);
    setCart([]);
    showNotice("success", "Transaksi lokal dikosongkan. Produk tetap dari Supabase.");
  }

  function updateProductForm(field: keyof ProductForm, value: string) {
    setProductForm((current) => ({ ...current, [field]: value }));
  }

  async function lookupBarcode(code: string) {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      return { ok: false, message: "Masukkan barcode atau SKU terlebih dulu." };
    }

    try {
      const params = new URLSearchParams({ code: trimmedCode });
      const response = await fetch(`/api/products/lookup?${params.toString()}`);
      const payload = await readApiJson(response);

      if (!response.ok || !payload || typeof payload !== "object") {
        throw new Error(readApiMessage(payload, "Barcode belum terdaftar."));
      }

      const product = (payload as { item?: unknown }).item;

      if (!isProduct(product)) {
        throw new Error("Response barcode tidak valid.");
      }

      addToCart(product);

      return {
        ok: true,
        message: `${product.name} ditambahkan ke keranjang.`,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Barcode belum terdaftar.",
      };
    }
  }

  return {
    products,
    sales,
    activeTab,
    setActiveTab,
    cart,
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    productSearch,
    setProductSearch,
    productCategory,
    setProductCategory,
    productSort,
    setProductSort,
    productDir,
    setProductDir,
    productPage,
    setProductPage,
    productLimit,
    setProductLimit,
    productPagination,
    productSummary,
    loadingProducts,
    loadingCashierProducts,
    savingProduct,
    checkingOut,
    discount,
    setDiscount,
    paid,
    setPaid,
    paymentMethod,
    setPaymentMethod,
    saleNote,
    setSaleNote,
    notice,
    productForm,
    editingProductId,
    historyQuery,
    setHistoryQuery,
    tabs,
    paymentMethods,
    todaySales,
    lowStockProducts,
    categories,
    filteredProducts: cashierProducts,
    cartItems,
    cartSubtotal,
    discountValue,
    saleTotal,
    paidValue,
    changeValue,
    hasStockProblem,
    canCompleteSale,
    todayRevenue,
    todayProfit,
    todayItemCount,
    averageBasket,
    productSalesRanking,
    filteredSales,
    formatRupiah,
    formatDateTime,
    addToCart,
    updateCartQty,
    clearCart,
    completeSale,
    saveProduct,
    editProduct,
    cancelEditProduct,
    deleteProduct,
    voidSale,
    printSale,
    exportBackup,
    importBackup,
    resetDemoData,
    updateProductForm,
    lookupBarcode,
    refreshProducts,
    refreshCashierProducts,
  };
}
