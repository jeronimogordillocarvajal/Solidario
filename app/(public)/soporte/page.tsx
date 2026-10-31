import type { Metadata } from "next";
import { SoporteForm } from "@/components/admin-forms";

export const metadata: Metadata = { title: "Soporte" };

export default function SoportePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-display text-4xl">Soporte</h1>
      <p className="text-sm text-muted-foreground">
        Si una reserva, un pago o un producto no cuadra, escríbenos. No necesitas iniciar sesión.
      </p>
      <SoporteForm />
    </div>
  );
}
