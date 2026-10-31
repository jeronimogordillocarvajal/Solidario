"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductoEditor } from "./formularios-equipo";

export function ProductosCliente() {
  const [abierto, setAbierto] = useState(false);
  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl">Nuevo producto</h2>
        <Button type="button" variant="outline" onClick={() => setAbierto((value) => !value)}>
          {abierto ? "Cerrar" : "Agregar"}
        </Button>
      </div>
      {abierto ? (
        <div className="mt-4">
          <ProductoEditor onClose={() => setAbierto(false)} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Nombre, precio, categoría, stock y una foto desde la cámara o la galería.
        </p>
      )}
    </section>
  );
}
