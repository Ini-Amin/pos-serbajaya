import { NextResponse } from "next/server";
import { mapProduct, PRODUCT_COLUMNS, type ProductRow } from "@/lib/pos/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";

    if (!code) {
      return NextResponse.json(
        { ok: false, message: "Masukkan barcode atau SKU terlebih dulu." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const barcodeResult = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_active", true)
      .eq("barcode", code)
      .maybeSingle();

    if (barcodeResult.error) {
      return NextResponse.json(
        { ok: false, message: barcodeResult.error.message },
        { status: 500 },
      );
    }

    if (barcodeResult.data) {
      return NextResponse.json({
        ok: true,
        item: mapProduct(barcodeResult.data as ProductRow),
      });
    }

    const skuResult = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("is_active", true)
      .eq("sku", code)
      .maybeSingle();

    if (skuResult.error) {
      return NextResponse.json(
        { ok: false, message: skuResult.error.message },
        { status: 500 },
      );
    }

    if (!skuResult.data) {
      return NextResponse.json(
        { ok: false, message: `Barcode/SKU "${code}" belum terdaftar.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      item: mapProduct(skuResult.data as ProductRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Gagal mencari barcode.",
      },
      { status: 500 },
    );
  }
}
