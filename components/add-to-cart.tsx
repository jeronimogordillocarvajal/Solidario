"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProductoVista } from "@/lib/types";
import { useCart } from "./cart-provider";

export function AddToCart({
  producto,
  negocio,
  abierto,
}: {
  producto: ProductoVista;
  negocio: { id: string; nombre: string; codigo: string };
  abierto: boolean;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [cantidad, setCantidad] = useState(1);
  const [aviso, setAviso] = useState("");
  const agotado = producto.stock < 1;

  if (!abierto) {
    return <p className="text-sm text-muted-foreground">Las reservas ya cerraron.</p>;
  }
  if (agotado) {
    return <p className="text-sm font-medium text-destructive">Agotado</p>;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-11 w-11 rounded-full bg-muted text-lg"
          onClick={() => setCantidad((value) => Math.max(1, value - 1))}
          aria-label="Disminuir cantidad"
        >
          −
        </button>
        <span className="w-8 text-center font-semibold" aria-live="polite">
          {cantidad}
        </span>
        <button
          type="button"
          className="h-11 w-11 rounded-full bg-muted text-lg"
          onClick={() => setCantidad((value) => Math.min(producto.stock, value + 1))}
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>
      <Button
        type="button"
        className="w-full"
        onClick={() => {
          if (cantidad > producto.stock) {
            setAviso(`Solo quedan ${producto.stock}.`);
            return;
          }
          add(
            {
              productoId: producto.id,
              nombre: producto.nombre,
              precio: producto.precio,
              emprendimientoId: negocio.id,
              emprendimientoNombre: negocio.nombre,
              emprendimientoCodigo: negocio.codigo,
              fotoUrl: producto.fotoUrl,
            },
            cantidad,
            producto.stock,
          );
          setAviso("Listo, quedó en el carrito.");
          router.push("/carrito");
        }}
      >
        Agregar
      </Button>
      {aviso ? <p className="text-xs text-muted-foreground">{aviso}</p> : null}
    </div>
  );
}
