import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  mapProduct,
  normalizeProductPayload,
  normalizeSearchTerm,
  PRODUCT_COLUMNS,
  PRODUCT_SORT_COLUMNS,
  toPositiveInteger,
  type ProductRow,
  type ProductSortDirection,
  type ProductSortKey,
} from "@/lib/pos/products";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function getSort(value: string | null): ProductSortKey {
  if (value && value in PRODUCT_SORT_COLUMNS) {
    return value as ProductSortKey;
  }

  return "name";
}

function getDirection(value: string | null): ProductSortDirection {
  return value === "desc" ? "desc" : "asc";
}

function makeIlikePattern(value: string) {
  return `%${value
    .replace(/[()]/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .trim()}%`;
}

function uniqueCategoryList(values: unknown) {
  if (!Array.isArray(values)) {
    return ["Semua"];
  }

  const categories = values
    .map((item) =>
      item && typeof item === "object" && "category" in item
        ? String((item as { category: unknown }).category)
        : "",
    )
    .map((item) => item.trim())
    .filter(Boolean);

  return ["Semua", ...categories];
}

function normalizeSummary(value: unknown, fallbackTotal: number) {
  if (!value || typeof value !== "object") {
    return {
      totalProducts: fallbackTotal,
      totalStock: 0,
      lowStockCount: 0,
    };
  }

  const summary = value as Record<string, unknown>;

  return {
    totalProducts: Number(summary.total_products) || fallbackTotal,
    totalStock: Number(summary.total_stock) || 0,
    lowStockCount: Number(summary.low_stock_count) || 0,
  };
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const url = new URL(request.url);
    const page = toPositiveInteger(url.searchParams.get("page"), 1);
    const limit = toPositiveInteger(url.searchParams.get("limit"), DEFAULT_LIMIT, {
      max: MAX_LIMIT,
    });
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const search = normalizeSearchTerm(url.searchParams.get("search") ?? "");
    const category = (url.searchParams.get("category") ?? "").trim();
    const sort = getSort(url.searchParams.get("sort"));
    const dir = getDirection(url.searchParams.get("dir"));
    const sortColumn = PRODUCT_SORT_COLUMNS[sort];

    let query = supabase
      .from("products")
      .select(PRODUCT_COLUMNS, { count: "exact" })
      .eq("is_active", true);

    if (category && category !== "Semua") {
      query = query.eq("category", category);
    }

    if (search) {
      const pattern = makeIlikePattern(search);

      query = query.or(
        `name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern},category.ilike.${pattern}`,
      );
    }

    const { data, error, count } = await query
      .order(sortColumn, { ascending: dir === "asc" })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      );
    }

    const [{ data: categoriesData }, { data: summaryData }] =
      await Promise.all([
        supabase.rpc("product_categories"),
        supabase.rpc("product_summary").single(),
      ]);
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      ok: true,
      items: ((data ?? []) as ProductRow[]).map(mapProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
      categories: uniqueCategoryList(categoriesData),
      summary: normalizeSummary(summaryData, total),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Gagal memuat produk.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const fallbackSku = `ELK-${Date.now().toString().slice(-6)}`;
    const { data: payload, error: payloadError } = normalizeProductPayload(
      await request.json(),
      { fallbackSku },
    );

    if (payloadError) {
      return NextResponse.json(
        { ok: false, message: payloadError },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select(PRODUCT_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.code === "23505" ? 409 : 500 },
      );
    }

    return NextResponse.json(
      { ok: true, item: mapProduct(data as ProductRow) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal menyimpan produk.",
      },
      { status: 500 },
    );
  }
}
