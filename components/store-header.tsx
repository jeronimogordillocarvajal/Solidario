"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function StoreHeader() {
  const { count } = useCart();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" className="shrink-0 font-display text-xl leading-none text-primary sm:text-2xl">
          Feria <span className="text-secondary">Go</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-3">
          <Link href="/guia" className="hidden sm:inline">
            Guía
          </Link>
          <Link href="/soporte" className="hidden min-[420px]:inline">
            Soporte
          </Link>
          <Link href="/ingreso">Ingreso</Link>
          <Link
            href="/carrito"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-label={count > 0 ? `Carrito, ${count} productos` : "Carrito"}
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-secondary px-1 text-[11px] font-bold text-secondary-foreground">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function StoreFooter() {
  return (
    <footer className="no-print border-t border-border px-4 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:justify-between">
        <p>Feria Go · reserva con tu familia y recoge en el stand.</p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/soporte" className="underline">
            Soporte
          </Link>
          <Link href="/guia" className="underline">
            Guía para estudiantes
          </Link>
          <Link href="/ingreso" className="underline">
            Panel del equipo
          </Link>
        </p>
      </div>
    </footer>
  );
}
