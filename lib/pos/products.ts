import "server-only";

import type { Product } from "@/app/types/pos";

export const PRODUCT_COLUMNS =
  "id,name,sku,barcode,category,unit,price,cost,stock,min_stock,is_active,updated_at";

export const PRODUCT_SORT_COLUMNS = {
  name: "name",
  price: "price",
  cost: "cost",
  stock: "stock",
  updated_at: "updated_at",
} as const;

export type ProductSortKey = keyof typeof PRODUCT_SORT_COLUMNS;
export type ProductSortDirection = "asc" | "desc";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  category: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  updated_at: string;
};

export type ProductWritePayload = {
  name?: string;
  sku?: string;
  barcode?: string | null;
  category?: string;
  unit?: string;
  price?: number;
  cost?: number;
  stock?: number;
  min_stock?: number;
};

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value.trim() : "";
}

function readMoney(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d]/g, "")) || 0;
  }

  return 0;
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode ?? "",
    category: row.category,
    unit: row.unit,
    price: row.price,
    cost: row.cost,
    stock: row.stock,
    minStock: row.min_stock,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

export function normalizeProductPayload(
  value: unknown,
  options: { partial?: boolean; fallbackSku?: string } = {},
): { data: ProductWritePayload; error: string | null } {
  const record = asRecord(value);

  if (!record) {
    return { data: {}, error: "Payload produk tidak valid." };
  }

  const data: ProductWritePayload = {};
  const name = readString(record, "name");
  const sku = readString(record, "sku") || options.fallbackSku || "";
  const barcode = readString(record, "barcode");
  const category = readString(record, "category");
  const unit = readString(record, "unit");
  const price = readMoney(record, "price");
  const cost = readMoney(record, "cost");
  const stock = readMoney(record, "stock");
  const minStock = readMoney(record, "minStock");

  if (!options.partial || "name" in record) {
    if (!name) {
      return { data: {}, error: "Nama produk wajib diisi." };
    }
    data.name = name;
  }

  if (!options.partial || "sku" in record) {
    data.sku = sku;
  }

  if (!options.partial || "barcode" in record) {
    data.barcode = barcode || null;
  }

  if (!options.partial || "category" in record) {
    data.category = category || "Umum";
  }

  if (!options.partial || "unit" in record) {
    data.unit = unit || "pcs";
  }

  if (!options.partial || "price" in record) {
    if (price <= 0) {
      return { data: {}, error: "Harga jual wajib lebih dari 0." };
    }
    data.price = price;
  }

  if (!options.partial || "cost" in record) {
    data.cost = cost;
  }

  if (!options.partial || "stock" in record) {
    data.stock = stock;
  }

  if (!options.partial || "minStock" in record) {
    data.min_stock = minStock;
  }

  return { data, error: null };
}

export function normalizeSearchTerm(value: string) {
  return value.trim().replaceAll(",", " ").slice(0, 80);
}

export function toPositiveInteger(
  value: string | null,
  fallback: number,
  options: { min?: number; max?: number } = {},
) {
  const parsed = Number(value);
  const min = options.min ?? 1;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
