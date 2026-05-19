import { NextResponse } from "next/server";
import type { PaymentMethod } from "@/app/types/pos";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paymentMethods: PaymentMethod[] = ["Tunai", "QRIS Manual", "Transfer"];

function parseMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d]/g, "")) || 0;
  }

  return 0;
}

function parsePayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return { error: "Payload transaksi tidak valid." };
  }

  const record = value as Record<string, unknown>;
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const itemRecord = item as Record<string, unknown>;
      const productId =
        typeof itemRecord.productId === "string"
          ? itemRecord.productId.trim()
          : "";
      const qty = Number(itemRecord.qty);

      if (!productId || !Number.isInteger(qty) || qty <= 0) {
        return null;
      }

      return { productId, qty };
    })
    .filter((item): item is { productId: string; qty: number } => Boolean(item));

  const paymentMethod =
    typeof record.paymentMethod === "string" &&
    paymentMethods.includes(record.paymentMethod as PaymentMethod)
      ? (record.paymentMethod as PaymentMethod)
      : null;

  if (items.length === 0) {
    return { error: "Keranjang masih kosong." };
  }

  if (!paymentMethod) {
    return { error: "Metode pembayaran tidak valid." };
  }

  return {
    data: {
      items,
      discount: parseMoney(record.discount),
      paymentMethod,
      paid: parseMoney(record.paid),
      note: typeof record.note === "string" ? record.note.trim() : "",
    },
  };
}

export async function POST(request: Request) {
  try {
    const payload = parsePayload(await request.json());

    if ("error" in payload) {
      return NextResponse.json(
        { ok: false, message: payload.error },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.rpc("checkout_sale", {
      p_items: payload.data.items,
      p_discount: payload.data.discount,
      p_payment_method: payload.data.paymentMethod,
      p_paid: payload.data.paid,
      p_note: payload.data.note,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, sale: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Gagal menyimpan transaksi.",
      },
      { status: 500 },
    );
  }
}
