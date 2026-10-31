import type { Metadata } from "next";
import { Checkout } from "@/components/checkout";

export const metadata: Metadata = { title: "Confirmar reserva" };

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-display text-4xl">Datos de la familia</h1>
      <p className="text-sm text-muted-foreground">
        No necesitas cuenta. Con estos datos el stand sabe a quién entregar.
      </p>
      <Checkout />
    </div>
  );
}
