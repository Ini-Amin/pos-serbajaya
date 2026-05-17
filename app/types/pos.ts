import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from "react";

export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  updatedAt: string;
};

export type SaleItem = {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  price: number;
  cost: number;
  subtotal: number;
};

export type PaymentMethod = "Tunai" | "QRIS Manual" | "Transfer";

export type Sale = {
  id: string;
  invoice: string;
  soldAt: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: PaymentMethod;
  note: string;
  status: "completed" | "voided";
  voidedAt?: string;
};

export type CartLine = {
  productId: string;
  qty: number;
};

export type CartItem = CartLine & {
  product: Product;
  subtotal: number;
};

export type ProductForm = {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
};

export type TabKey = "kasir" | "produk" | "riwayat" | "laporan" | "backup";

export type Notice = {
  tone: "success" | "warning" | "error";
  message: string;
} | null;

export type TabItem = {
  key: TabKey;
  label: string;
};

export type ProductSalesRank = {
  name: string;
  qty: number;
  revenue: number;
  profit: number;
};

export type StatTone = "neutral" | "green" | "amber" | "red";

export type POSController = {
  products: Product[];
  sales: Sale[];
  activeTab: TabKey;
  setActiveTab: Dispatch<SetStateAction<TabKey>>;
  cart: CartLine[];
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  categoryFilter: string;
  setCategoryFilter: Dispatch<SetStateAction<string>>;
  discount: string;
  setDiscount: Dispatch<SetStateAction<string>>;
  paid: string;
  setPaid: Dispatch<SetStateAction<string>>;
  paymentMethod: PaymentMethod;
  setPaymentMethod: Dispatch<SetStateAction<PaymentMethod>>;
  saleNote: string;
  setSaleNote: Dispatch<SetStateAction<string>>;
  notice: Notice;
  productForm: ProductForm;
  editingProductId: string | null;
  historyQuery: string;
  setHistoryQuery: Dispatch<SetStateAction<string>>;
  tabs: TabItem[];
  paymentMethods: PaymentMethod[];
  todaySales: Sale[];
  lowStockProducts: Product[];
  categories: string[];
  filteredProducts: Product[];
  cartItems: CartItem[];
  cartSubtotal: number;
  discountValue: number;
  saleTotal: number;
  paidValue: number;
  changeValue: number;
  hasStockProblem: boolean;
  canCompleteSale: boolean;
  todayRevenue: number;
  todayProfit: number;
  todayItemCount: number;
  averageBasket: number;
  productSalesRanking: ProductSalesRank[];
  filteredSales: Sale[];
  formatRupiah: (value: number) => string;
  formatDateTime: (value: string) => string;
  addToCart: (product: Product) => void;
  updateCartQty: (productId: string, nextQty: number) => void;
  clearCart: () => void;
  completeSale: () => void;
  saveProduct: (event: FormEvent<HTMLFormElement>) => void;
  editProduct: (product: Product) => void;
  cancelEditProduct: () => void;
  deleteProduct: (productId: string) => void;
  voidSale: (sale: Sale) => void;
  printSale: (sale: Sale) => void;
  exportBackup: () => void;
  importBackup: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  resetDemoData: () => void;
  updateProductForm: (field: keyof ProductForm, value: string) => void;
};
