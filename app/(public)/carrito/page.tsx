import type { Metadata } from "next";
import { CarritoLista } from "@/components/carrito-lista";

export const metadata: Metadata = { title: "Carrito" };

export default function CarritoPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Tu reserva</h1>
      <CarritoLista />
    </div>
  );
}
