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
  isActive: boolean;
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
  product: Product;
  qty: number;
};

export type CartItem = CartLine & {
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

export type ProductSort = "name" | "price" | "cost" | "stock" | "updated_at";
export type ProductSortDirection = "asc" | "desc";

export type ProductPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export type ProductSummary = {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
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
  productSearch: string;
  setProductSearch: Dispatch<SetStateAction<string>>;
  productCategory: string;
  setProductCategory: Dispatch<SetStateAction<string>>;
  productSort: ProductSort;
  setProductSort: Dispatch<SetStateAction<ProductSort>>;
  productDir: ProductSortDirection;
  setProductDir: Dispatch<SetStateAction<ProductSortDirection>>;
  productPage: number;
  setProductPage: Dispatch<SetStateAction<number>>;
  productLimit: number;
  setProductLimit: Dispatch<SetStateAction<number>>;
  productPagination: ProductPagination;
  productSummary: ProductSummary;
  loadingProducts: boolean;
  loadingCashierProducts: boolean;
  savingProduct: boolean;
  checkingOut: boolean;
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
  completeSale: () => Promise<void>;
  saveProduct: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  editProduct: (product: Product) => void;
  cancelEditProduct: () => void;
  deleteProduct: (productId: string) => Promise<void>;
  voidSale: (sale: Sale) => void;
  printSale: (sale: Sale) => void;
  exportBackup: () => void;
  importBackup: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  resetDemoData: () => void;
  updateProductForm: (field: keyof ProductForm, value: string) => void;
  lookupBarcode: (code: string) => Promise<{ ok: boolean; message: string }>;
  refreshProducts: () => Promise<void>;
  refreshCashierProducts: () => Promise<void>;
};
