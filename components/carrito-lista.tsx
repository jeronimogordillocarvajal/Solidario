"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cop } from "@/lib/format";
import { useCart } from "./cart-provider";

export function CarritoLista() {
  const { items, setCantidad, remove } = useCart();
  const total = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <p className="font-display text-3xl">Todavía no hay productos</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Arma la reserva con varios emprendimientos. Cada uno entrega su propia boleta.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-4" })}>
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.productoId} className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
            {item.fotoUrl ? (
              <img src={item.fotoUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {item.emprendimientoNombre} · {item.emprendimientoCodigo}
              </p>
              <p className="font-medium">{item.nombre}</p>
              <p className="text-sm text-primary">{cop(item.precio)}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="h-11 w-11 rounded-full bg-muted"
                  onClick={() =>
                    item.cantidad === 1 ? remove(item.productoId) : setCantidad(item.productoId, item.cantidad - 1)
                  }
                  aria-label="Disminuir"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.cantidad}</span>
                <button
                  type="button"
                  className="h-11 w-11 rounded-full bg-muted"
                  onClick={() => setCantidad(item.productoId, item.cantidad + 1)}
                  aria-label="Aumentar"
                >
                  +
                </button>
                <button type="button" className="ml-auto text-sm underline" onClick={() => remove(item.productoId)}>
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-lg font-semibold">Total estimado {cop(total)}</p>
      <p className="text-xs text-muted-foreground">El precio final es el de la tienda al momento de reservar.</p>
      <Link href="/reservar" className={buttonVariants({ className: "w-full" })}>
        Continuar a la reserva
      </Link>
    </div>
  );
}

export function LimpiarCarrito({ activa }: { activa: boolean }) {
  const { clear } = useCart();
  const hecho = useRef(false);
  useEffect(() => {
    if (!activa || hecho.current) return;
    hecho.current = true;
    clear();
  }, [activa, clear]);
  return null;
}
