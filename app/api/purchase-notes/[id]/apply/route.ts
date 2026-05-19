import { NextResponse } from "next/server";
import { mapPurchaseNote, PURCHASE_NOTE_COLUMNS } from "@/lib/pos/purchase-notes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.rpc("apply_purchase_note", {
      p_purchase_note_id: id,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 },
      );
    }

    const { data, error: noteError } = await supabase
      .from("purchase_notes")
      .select(PURCHASE_NOTE_COLUMNS)
      .eq("id", id)
      .single();

    if (noteError) {
      return NextResponse.json(
        { ok: false, message: noteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, item: mapPurchaseNote(data) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal menerapkan nota ke stok.",
      },
      { status: 500 },
    );
  }
}
