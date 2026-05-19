import { NextResponse } from "next/server";
import { normalizeProductPayload, PRODUCT_COLUMNS, mapProduct, type ProductRow } from "@/lib/pos/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createSupabaseServerClient();
    const { data: payload, error: payloadError } = normalizeProductPayload(
      await request.json(),
      { partial: true },
    );

    if (payloadError) {
      return NextResponse.json(
        { ok: false, message: payloadError },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .eq("is_active", true)
      .select(PRODUCT_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: error.code === "23505" ? 409 : 500 },
      );
    }

    return NextResponse.json({ ok: true, item: mapProduct(data as ProductRow) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui produk.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id)
      .eq("is_active", true)
      .select(PRODUCT_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, item: mapProduct(data as ProductRow) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Gagal menghapus produk.",
      },
      { status: 500 },
    );
  }
}
