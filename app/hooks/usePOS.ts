"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  CartItem,
  CartLine,
  Notice,
  PaymentMethod,
  POSController,
  Product,
  ProductForm,
  ProductSalesRank,
  Sale,
  SaleItem,
  TabItem,
  TabKey,
} from "../types/pos";

const STORAGE_KEY = "serbajaya-pos-local-v1";

const initialProducts: Product[] = [
  {
    id: "prd-remote-universal",
    name: "Remote TV Universal",
    sku: "ELK-001",
    barcode: "",
    category: "Remote",
    unit: "pcs",
    price: 35000,
    cost: 22000,
    stock: 18,
    minStock: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-stop-kontak-4",
    name: "Stop Kontak 4 Lubang 3 Meter",
    sku: "ELK-002",
    barcode: "",
    category: "Kelistrikan",
    unit: "pcs",
    price: 68000,
    cost: 47000,
    stock: 12,
    minStock: 4,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-kabel-hdmi",
    name: "Kabel HDMI 1.5 Meter",
    sku: "ELK-003",
    barcode: "",
    category: "Aksesoris TV",
    unit: "pcs",
    price: 28000,
    cost: 17000,
    stock: 25,
    minStock: 6,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-set-top-box",
    name: "Set Top Box DVB-T2",
    sku: "ELK-004",
    barcode: "",
    category: "Aksesoris TV",
    unit: "pcs",
    price: 185000,
    cost: 148000,
    stock: 7,
    minStock: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-steker",
    name: "Steker Arde",
    sku: "ELK-005",
    barcode: "",
    category: "Kelistrikan",
    unit: "pcs",
    price: 12000,
    cost: 7000,
    stock: 38,
    minStock: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-lampu-led-12",
    name: "Lampu LED 12W",
    sku: "ELK-006",
    barcode: "",
    category: "Lampu",
    unit: "pcs",
    price: 26000,
    cost: 18000,
    stock: 16,
    minStock: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-antena-digital",
    name: "Antena TV Digital Indoor",
    sku: "ELK-007",
    barcode: "",
    category: "Aksesoris TV",
    unit: "pcs",
    price: 75000,
    cost: 52000,
    stock: 9,
    minStock: 3,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-baterai-aaa",
    name: "Baterai AAA Isi 2",
    sku: "ELK-008",
    barcode: "",
    category: "Baterai",
    unit: "pack",
    price: 14000,
    cost: 8500,
    stock: 30,
    minStock: 8,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prd-saklar-tunggal",
    name: "Saklar Tunggal Tanam",
    sku: "ELK-009",
    barcode: "",
    category: "Kelistrikan",
    unit: "pcs",
    price: 18000,
    cost: 11500,
    stock: 20,
    minStock: 6,
    updatedAt: new Date().toISOString(),
  },
];

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

const tabs: TabItem[] = [
  { key: "kasir", label: "Kasir" },
  { key: "produk", label: "Produk" },
  { key: "riwayat", label: "Riwayat" },
  { key: "laporan", label: "Laporan" },
  { key: "backup", label: "Backup" },
];

const paymentMethods: PaymentMethod[] = ["Tunai", "QRIS Manual", "Transfer"];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function makeInvoice(sequence: number) {
  const now = new Date();
  const date = getLocalDateKey(now).replaceAll("-", "");
  const suffix = String(sequence + 1).padStart(4, "0");

  return `SJ-${date}-${suffix}`;
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
    typeof product.price === "number" &&
    typeof product.cost === "number" &&
    typeof product.stock === "number"
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function usePOS(): POSController {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("kasir");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
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

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- Local POS data is hydrated from localStorage after mount. */
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          products?: unknown[];
          sales?: unknown[];
        };
        const storedProducts = Array.isArray(parsed.products)
          ? parsed.products.filter(isProduct)
          : [];
        const storedSales = Array.isArray(parsed.sales)
          ? parsed.sales.filter(isSale).map((sale) => ({
              ...sale,
              status: sale.status ?? "completed",
              paymentMethod: sale.paymentMethod ?? "Tunai",
              note: sale.note ?? "",
            }))
          : [];

        if (storedProducts.length > 0) {
          setProducts(storedProducts);
        }
        setSales(storedSales);
      } catch {
        setNotice({
          tone: "error",
          message: "Data lokal tidak bisa dibaca. Data contoh tetap dipakai.",
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ products, sales }));
  }, [products, ready, sales]);

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

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(products.map((product) => product.category).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b));

    return ["Semua", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = normalize(query);

    return products
      .filter((product) => {
        const matchesCategory =
          categoryFilter === "Semua" || product.category === categoryFilter;
        const matchesTerm =
          !term ||
          normalize(
            `${product.name} ${product.sku} ${product.barcode} ${product.category}`,
          ).includes(term);

        return matchesCategory && matchesTerm;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryFilter, products, query]);

  const cartItems = useMemo(
    () =>
      cart
        .map((line) => {
          const product = products.find((item) => item.id === line.productId);

          if (!product) {
            return null;
          }

          return {
            ...line,
            product,
            subtotal: product.price * line.qty,
          };
        })
        .filter((line): line is CartItem => Boolean(line)),
    [cart, products],
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

  function showNotice(tone: NonNullable<Notice>["tone"], message: string) {
    setNotice({ tone, message });
  }

  function addToCart(product: Product) {
    if (product.stock <= 0) {
      showNotice("warning", `${product.name} sedang kosong.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);

      if (!existing) {
        return [...current, { productId: product.id, qty: 1 }];
      }

      if (existing.qty >= product.stock) {
        showNotice("warning", `Stok ${product.name} hanya ${product.stock}.`);
        return current;
      }

      return current.map((line) =>
        line.productId === product.id ? { ...line, qty: line.qty + 1 } : line,
      );
    });
  }

  function updateCartQty(productId: string, nextQty: number) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    const boundedQty = Math.max(0, Math.min(nextQty, product.stock));

    setCart((current) =>
      boundedQty === 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId ? { ...line, qty: boundedQty } : line,
          ),
    );
  }

  function clearCart() {
    setCart([]);
  }

  function completeSale() {
    if (!canCompleteSale) {
      showNotice("warning", "Periksa keranjang, stok, dan nominal bayar.");
      return;
    }

    const now = new Date().toISOString();
    const saleItems: SaleItem[] = cartItems.map((line) => ({
      productId: line.product.id,
      name: line.product.name,
      sku: line.product.sku,
      qty: line.qty,
      price: line.product.price,
      cost: line.product.cost,
      subtotal: line.subtotal,
    }));
    const sale: Sale = {
      id: createId("sale"),
      invoice: makeInvoice(sales.length),
      soldAt: now,
      items: saleItems,
      subtotal: cartSubtotal,
      discount: discountValue,
      total: saleTotal,
      paid: paidValue,
      change: changeValue,
      paymentMethod,
      note: saleNote.trim(),
      status: "completed",
    };

    setProducts((current) =>
      current.map((product) => {
        const soldItem = saleItems.find((item) => item.productId === product.id);

        if (!soldItem) {
          return product;
        }

        return {
          ...product,
          stock: product.stock - soldItem.qty,
          updatedAt: now,
        };
      }),
    );
    setSales((current) => [sale, ...current]);
    setCart([]);
    setDiscount("");
    setPaid("");
    setSaleNote("");
    showNotice("success", `Transaksi ${sale.invoice} tersimpan.`);
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productForm.name.trim();
    const sku =
      productForm.sku.trim() ||
      `ELK-${String(products.length + 1).padStart(3, "0")}`;
    const category = productForm.category.trim() || "Umum";
    const unit = productForm.unit.trim() || "pcs";
    const price = parseMoney(productForm.price);
    const cost = parseMoney(productForm.cost);
    const stock = Number(productForm.stock) || 0;
    const minStock = Number(productForm.minStock) || 0;

    if (!name || price <= 0) {
      showNotice("warning", "Nama produk dan harga jual wajib diisi.");
      return;
    }

    const skuAlreadyUsed = products.some(
      (product) =>
        normalize(product.sku) === normalize(sku) &&
        product.id !== editingProductId,
    );

    if (skuAlreadyUsed) {
      showNotice("warning", "SKU sudah dipakai produk lain.");
      return;
    }

    const nextProduct: Product = {
      id: editingProductId ?? createId("prd"),
      name,
      sku,
      barcode: productForm.barcode.trim(),
      category,
      unit,
      price,
      cost,
      stock,
      minStock,
      updatedAt: new Date().toISOString(),
    };

    setProducts((current) =>
      editingProductId
        ? current.map((product) =>
            product.id === editingProductId ? nextProduct : product,
          )
        : [...current, nextProduct],
    );
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    showNotice(
      "success",
      editingProductId ? "Produk diperbarui." : "Produk ditambahkan.",
    );
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

  function deleteProduct(productId: string) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    const ok = window.confirm(
      `Hapus produk ${product.name}? Riwayat transaksi tetap tersimpan.`,
    );

    if (!ok) {
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== productId));
    setCart((current) => current.filter((item) => item.productId !== productId));
    showNotice("success", "Produk dihapus.");
  }

  function voidSale(sale: Sale) {
    if (sale.status === "voided") {
      return;
    }

    const ok = window.confirm(
      `Batalkan transaksi ${sale.invoice} dan kembalikan stok?`,
    );

    if (!ok) {
      return;
    }

    const now = new Date().toISOString();
    setSales((current) =>
      current.map((item) =>
        item.id === sale.id ? { ...item, status: "voided", voidedAt: now } : item,
      ),
    );
    setProducts((current) =>
      current.map((product) => {
        const returnedItem = sale.items.find(
          (item) => item.productId === product.id,
        );

        if (!returnedItem) {
          return product;
        }

        return {
          ...product,
          stock: product.stock + returnedItem.qty,
          updatedAt: now,
        };
      }),
    );
    showNotice("success", `Transaksi ${sale.invoice} dibatalkan.`);
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
      { exportedAt: new Date().toISOString(), products, sales },
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
        products?: unknown[];
        sales?: unknown[];
      };
      const importedProducts = Array.isArray(parsed.products)
        ? parsed.products.filter(isProduct)
        : [];
      const importedSales = Array.isArray(parsed.sales)
        ? parsed.sales.filter(isSale)
        : [];

      if (importedProducts.length === 0) {
        showNotice("error", "File backup tidak punya data produk yang valid.");
        return;
      }

      setProducts(importedProducts);
      setSales(
        importedSales.map((sale) => ({
          ...sale,
          status: sale.status ?? "completed",
          paymentMethod: sale.paymentMethod ?? "Tunai",
          note: sale.note ?? "",
        })),
      );
      setCart([]);
      showNotice("success", "Backup berhasil dipulihkan.");
    } catch {
      showNotice("error", "File backup tidak bisa dibaca.");
    } finally {
      event.target.value = "";
    }
  }

  function resetDemoData() {
    const ok = window.confirm("Ganti semua data dengan data contoh awal?");

    if (!ok) {
      return;
    }

    setProducts(initialProducts);
    setSales([]);
    setCart([]);
    showNotice("success", "Data contoh dipasang ulang.");
  }

  function updateProductForm(field: keyof ProductForm, value: string) {
    setProductForm((current) => ({ ...current, [field]: value }));
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
    filteredProducts,
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
  };
}
