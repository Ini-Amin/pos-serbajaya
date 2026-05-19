import { NextResponse } from "next/server";
import {
  mapPurchaseNote,
  normalizePurchaseNotePayload,
  PURCHASE_NOTE_COLUMNS,
  purchaseNoteTotal,
} from "@/lib/pos/purchase-notes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createSupabaseServerClient();
    const payload = normalizePurchaseNotePayload(await request.json());

    if (!payload.data) {
      return NextResponse.json(
        { ok: false, message: payload.error },
        { status: 400 },
      );
    }

    const existing = await supabase
      .from("purchase_notes")
      .select("id,status")
      .eq("id", id)
      .single();

    if (existing.error) {
      return NextResponse.json(
        { ok: false, message: existing.error.message },
        { status: 404 },
      );
    }

    if (existing.data.status === "applied") {
      return NextResponse.json(
        { ok: false, message: "Nota yang sudah diterapkan tidak bisa diedit." },
        { status: 400 },
      );
    }

    const total = purchaseNoteTotal(payload.data.items);
    const noteResult = await supabase
      .from("purchase_notes")
      .update({
        supplier_name: payload.data.supplierName,
        note_date: payload.data.noteDate,
        invoice_number: payload.data.invoiceNumber,
        image_url: payload.data.imageUrl,
        note: payload.data.note,
        total,
        status: "draft",
      })
      .eq("id", id);

    if (noteResult.error) {
      return NextResponse.json(
        { ok: false, message: noteResult.error.message },
        { status: 500 },
      );
    }

    const deleteResult = await supabase
      .from("purchase_note_items")
      .delete()
      .eq("purchase_note_id", id);

    if (deleteResult.error) {
      return NextResponse.json(
        { ok: false, message: deleteResult.error.message },
        { status: 500 },
      );
    }

    const itemResult = await supabase.from("purchase_note_items").insert(
      payload.data.items.map((item) => ({
        purchase_note_id: id,
        product_name: item.productName,
        matched_product_id: item.matchedProductId,
        qty: item.qty,
        price: item.price,
        subtotal: item.qty * item.price,
      })),
    );

    if (itemResult.error) {
      return NextResponse.json(
        { ok: false, message: itemResult.error.message },
        { status: 500 },
      );
    }

    const { data, error } = await supabase
      .from("purchase_notes")
      .select(PURCHASE_NOTE_COLUMNS)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, item: mapPurchaseNote(data) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui nota.",
      },
      { status: 500 },
    );
  }
}
