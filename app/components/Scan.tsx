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

    const value = barcode.trim().toLowerCase();
    const product = pos.products.find(
      (item) =>
        item.barcode.toLowerCase() === value || item.sku.toLowerCase() === value,
    );

    if (product) {
      pos.addToCart(product);
      setBarcode("");
      setMessage(`${product.name} ditambahkan ke keranjang.`);
      return;
    }

    setMessage(`Barcode/SKU "${barcode.trim()}" belum terdaftar.`);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold">Scan Barcode</h2>
        <span className="text-xs font-semibold uppercase text-zinc-500">
          Scanner HID tekan Enter
        </span>
      </div>
      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={barcode}
          onChange={(event) => setBarcode(event.target.value)}
          placeholder="Scan atau ketik barcode"
          autoFocus
          className="h-10 min-w-0 flex-1 rounded-md border border-zinc-300 px-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-950 px-4 text-sm font-bold text-white hover:bg-zinc-800"
        >
          Tambah
        </button>
      </form>
      {message ? (
        <p className="mt-3 text-sm font-semibold text-zinc-600">{message}</p>
      ) : null}
    </section>
  );
}
