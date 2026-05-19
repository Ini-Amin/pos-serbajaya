import { NextResponse } from "next/server";
import {
  mapPurchaseNote,
  normalizePurchaseNotePayload,
  PURCHASE_NOTE_COLUMNS,
  purchaseNoteTotal,
  type PurchaseNoteStatus,
} from "@/lib/pos/purchase-notes";
import { toPositiveInteger } from "@/lib/pos/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const statuses: PurchaseNoteStatus[] = ["draft", "reviewed", "applied"];

function makeIlikePattern(value: string) {
  return `%${value
    .replace(/[()]/g, " ")
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .trim()}%`;
}

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const url = new URL(request.url);
    const page = toPositiveInteger(url.searchParams.get("page"), 1);
    const limit = toPositiveInteger(url.searchParams.get("limit"), DEFAULT_LIMIT, {
      max: MAX_LIMIT,
    });
    const status = url.searchParams.get("status")?.trim() ?? "";
    const search = url.searchParams.get("search")?.trim() ?? "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("purchase_notes")
      .select(PURCHASE_NOTE_COLUMNS, { count: "exact" });

    if (statuses.includes(status as PurchaseNoteStatus)) {
      query = query.eq("status", status);
    }

    if (search) {
      const pattern = makeIlikePattern(search);

      query = query.or(
        `supplier_name.ilike.${pattern},invoice_number.ilike.${pattern},note.ilike.${pattern}`,
      );
    }

    const { data, error, count } = await query
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      );
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      ok: true,
      items: (data ?? []).map(mapPurchaseNote),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal memuat nota.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const payload = normalizePurchaseNotePayload(await request.json());

    if (!payload.data) {
      return NextResponse.json(
        { ok: false, message: payload.error },
        { status: 400 },
      );
    }

    const total = purchaseNoteTotal(payload.data.items);
    const noteResult = await supabase
      .from("purchase_notes")
      .insert({
        supplier_name: payload.data.supplierName,
        note_date: payload.data.noteDate,
        invoice_number: payload.data.invoiceNumber,
        image_url: payload.data.imageUrl,
        note: payload.data.note,
        total,
        status: "draft",
      })
      .select("id")
      .single();

    if (noteResult.error) {
      return NextResponse.json(
        { ok: false, message: noteResult.error.message },
        { status: 500 },
      );
    }

    const noteId = noteResult.data.id as string;
    const itemResult = await supabase.from("purchase_note_items").insert(
      payload.data.items.map((item) => ({
        purchase_note_id: noteId,
        product_name: item.productName,
        matched_product_id: item.matchedProductId,
        qty: item.qty,
        price: item.price,
        subtotal: item.qty * item.price,
      })),
    );

    if (itemResult.error) {
      await supabase.from("purchase_notes").delete().eq("id", noteId);

      return NextResponse.json(
        { ok: false, message: itemResult.error.message },
        { status: 500 },
      );
    }

    const { data, error } = await supabase
      .from("purchase_notes")
      .select(PURCHASE_NOTE_COLUMNS)
      .eq("id", noteId)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, item: mapPurchaseNote(data) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal menyimpan nota.",
      },
      { status: 500 },
    );
  }
}
