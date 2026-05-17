"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { POSController } from "../types/pos";

type ScanProps = {
  pos: POSController;
};

export function Scan({ pos }: ScanProps) {
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBarcode = barcode.trim();

    if (!trimmedBarcode) {
      setMessage("Masukkan barcode atau SKU terlebih dulu.");
      return;
    }

    const value = trimmedBarcode.toLowerCase();
    const product = pos.products.find(
      (item) =>
        (item.barcode.trim() && item.barcode.trim().toLowerCase() === value) ||
        item.sku.trim().toLowerCase() === value,
    );

    if (product) {
      pos.addToCart(product);
      setBarcode("");
      setMessage(`${product.name} ditambahkan ke keranjang.`);
      return;
    }

    setMessage(`Barcode/SKU "${trimmedBarcode}" belum terdaftar.`);
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Scan Barcode</h2>
        {message ? (
          <p className="truncate text-sm font-semibold text-zinc-600">
            {message}
          </p>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          placeholder="Scan atau ketik barcode"
          autoFocus
          className="h-10 min-w-0 rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-bold text-white hover:bg-zinc-800"
        >
          Tambah
        </button>
      </form>
    </section>
  );
}
