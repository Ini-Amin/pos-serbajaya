import "server-only";

export const PURCHASE_NOTE_COLUMNS = `
  id,
  supplier_name,
  note_date,
  invoice_number,
  image_url,
  note,
  total,
  status,
  applied_at,
  created_at,
  updated_at,
  purchase_note_items (
    id,
    product_name,
    matched_product_id,
    qty,
    price,
    subtotal,
    created_at
  )
`;

export type PurchaseNoteStatus = "draft" | "reviewed" | "applied";

type PurchaseNoteItemRow = {
  id: string;
  product_name: string;
  matched_product_id: string | null;
  qty: number;
  price: number;
  subtotal: number;
  created_at: string;
};

type PurchaseNoteRow = {
  id: string;
  supplier_name: string;
  note_date: string;
  invoice_number: string;
  image_url: string | null;
  note: string;
  total: number;
  status: PurchaseNoteStatus;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
  purchase_note_items?: PurchaseNoteItemRow[];
};

export type PurchaseNotePayloadItem = {
  productName: string;
  matchedProductId: string | null;
  qty: number;
  price: number;
};

export type PurchaseNotePayload = {
  supplierName: string;
  noteDate: string;
  invoiceNumber: string;
  imageUrl: string | null;
  note: string;
  items: PurchaseNotePayloadItem[];
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

function readMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d]/g, "")) || 0;
  }

  return 0;
}

export function mapPurchaseNote(row: PurchaseNoteRow) {
  const items = Array.isArray(row.purchase_note_items)
    ? row.purchase_note_items.map((item) => ({
        id: item.id,
        productName: item.product_name,
        matchedProductId: item.matched_product_id,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        createdAt: item.created_at,
      }))
    : [];

  return {
    id: row.id,
    supplierName: row.supplier_name,
    noteDate: row.note_date,
    invoiceNumber: row.invoice_number,
    imageUrl: row.image_url ?? "",
    note: row.note,
    total: row.total,
    status: row.status,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
  };
}

export function normalizePurchaseNotePayload(value: unknown): {
  data: PurchaseNotePayload | null;
  error: string | null;
} {
  const record = asRecord(value);

  if (!record) {
    return { data: null, error: "Payload nota tidak valid." };
  }

  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems
    .map((item) => {
      const itemRecord = asRecord(item);

      if (!itemRecord) {
        return null;
      }

      const productName = readString(itemRecord, "productName");
      const matchedProductId = readString(itemRecord, "matchedProductId");
      const qty = readMoney(itemRecord.qty);
      const price = readMoney(itemRecord.price);

      if (!productName || qty <= 0) {
        return null;
      }

      return {
        productName,
        matchedProductId: matchedProductId || null,
        qty,
        price,
      };
    })
    .filter((item): item is PurchaseNotePayloadItem => Boolean(item));

  if (items.length === 0) {
    return { data: null, error: "Minimal isi satu item nota." };
  }

  const supplierName = readString(record, "supplierName");
  const noteDate = readString(record, "noteDate");

  if (!supplierName) {
    return { data: null, error: "Nama sales/supplier wajib diisi." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(noteDate)) {
    return { data: null, error: "Tanggal nota wajib diisi." };
  }

  return {
    data: {
      supplierName,
      noteDate,
      invoiceNumber: readString(record, "invoiceNumber"),
      imageUrl: readString(record, "imageUrl") || null,
      note: readString(record, "note"),
      items,
    },
    error: null,
  };
}

export function purchaseNoteTotal(items: PurchaseNotePayloadItem[]) {
  return items.reduce((total, item) => total + item.qty * item.price, 0);
}
