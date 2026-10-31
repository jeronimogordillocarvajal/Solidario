"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  productoId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  emprendimientoId: string;
  emprendimientoNombre: string;
  emprendimientoCodigo: string;
  fotoUrl: string | null;
};

const KEY = "feria-go-cart";

function subscribe(callback: () => void) {
  window.addEventListener("feria-cart", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("feria-cart", callback);
    window.removeEventListener("storage", callback);
  };
}

function snapshot() {
  return localStorage.getItem(KEY) ?? "[]";
}

function read(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("feria-cart"));
}

type CartApi = {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, "cantidad">, cantidad: number, stock: number) => void;
  setCantidad: (productoId: string, cantidad: number) => void;
  remove: (productoId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const items = useMemo(() => {
    try {
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);

  const api = useMemo<CartApi>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.cantidad, 0),
      add(item, cantidad, stock) {
        const next = read();
        const found = next.find((row) => row.productoId === item.productoId);
        const cupo = Math.max(1, Math.min(99, stock));
        if (found) found.cantidad = Math.min(cupo, found.cantidad + cantidad);
        else next.push({ ...item, cantidad: Math.min(cupo, cantidad) });
        write(next);
      },
      setCantidad(productoId, cantidad) {
        const next = read()
          .map((item) =>
            item.productoId === productoId
              ? { ...item, cantidad: Math.max(1, Math.min(99, cantidad)) }
              : item,
          );
        write(next);
      },
      remove(productoId) {
        write(read().filter((item) => item.productoId !== productoId));
      },
      clear() {
        write([]);
      },
    }),
    [items],
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("El carrito no está disponible.");
  return cart;
}
