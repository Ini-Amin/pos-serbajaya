"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import type { POSController } from "../types/pos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ScanProps = {
  pos: POSController;
};

export function Scan({ pos }: ScanProps) {
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBarcode = barcode.trim();

    if (!trimmedBarcode) {
      setMessage("Masukkan barcode atau SKU terlebih dulu.");
      return;
    }

    setLoading(true);
    const result = await pos.lookupBarcode(trimmedBarcode);
    setLoading(false);
    setMessage(result.message);

    if (result.ok) {
      setBarcode("");
    }
  }

  return (
    <Card size="sm" className="shadow-none">
      <CardHeader className="grid-cols-[1fr_auto] items-center">
        <CardTitle>Scan Barcode</CardTitle>
        {message ? (
          <p className="max-w-[52vw] truncate text-sm font-semibold text-muted-foreground">
            {message}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="grid gap-2 sm:grid-cols-[1fr_auto]"
        >
          <Input
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            placeholder="Scan atau ketik barcode"
            autoFocus
            className="h-10 min-w-0"
          />
          <Button type="submit" disabled={loading} className="h-10">
            {loading ? "Cari..." : "Tambah"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
