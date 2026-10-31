"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reservar } from "@/lib/actions";
import { cop, textoCierre } from "@/lib/format";
import { useCart } from "./cart-provider";

type Linea = {
  productoId: string;
  nombre: string;
  precio: number;
  stock: number;
  codigo: string;
  emprendimientoId: string;
  emprendimientoCodigo: string;
  emprendimientoNombre: string;
  aceptaEfectivo: boolean;
  aceptaQr: boolean;
  ofreceQr: boolean;
  tieneQr: boolean;
};

export function Checkout() {
  const { items } = useCart();
  const [lineas, setLineas] = useState<Linea[] | null>(null);
  const [abiertas, setAbiertas] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [acudiente, setAcudiente] = useState("");
  const [estudiante, setEstudiante] = useState("");
  const [curso, setCurso] = useState("");
  const [pagos, setPagos] = useState<Record<string, "efectivo" | "qr">>({});

  useEffect(() => {
    if (items.length === 0) return;
    const ids = items.map((item) => item.productoId).join(",");
    let cancelado = false;
    fetch(`/api/tienda/cotizar?ids=${encodeURIComponent(ids)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("carga");
        return (await response.json()) as { abiertas: boolean; lineas: Linea[] };
      })
      .then((data) => {
        if (cancelado) return;
        setLineas(data.lineas);
        setAbiertas(data.abiertas);
        setPagos((actual) => {
          const next = { ...actual };
          for (const linea of data.lineas) {
            if (next[linea.emprendimientoId]) continue;
            next[linea.emprendimientoId] = linea.aceptaEfectivo ? "efectivo" : "qr";
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelado) setErrorCarga("No pudimos revisar el stock. Revisa tu conexión e intenta otra vez.");
      });
    return () => {
      cancelado = true;
    };
  }, [items]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, { nombre: string; codigo: string; filas: Array<Linea & { cantidad: number }> }>();
    if (!lineas) return [];
    for (const item of items) {
      const linea = lineas.find((row) => row.productoId === item.productoId);
      if (!linea) continue;
      const grupo = mapa.get(linea.emprendimientoId) ?? {
        nombre: linea.emprendimientoNombre,
        codigo: linea.emprendimientoCodigo,
        filas: [],
      };
      grupo.filas.push({ ...linea, cantidad: item.cantidad });
      mapa.set(linea.emprendimientoId, grupo);
    }
    return [...mapa.entries()].map(([id, grupo]) => ({ id, ...grupo }));
  }, [items, lineas]);

  const faltantes = items.filter((item) => lineas && !lineas.some((linea) => linea.productoId === item.productoId));
  const excede = grupos.some((grupo) => grupo.filas.some((fila) => fila.cantidad > fila.stock));

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/10">
        <p className="font-display text-3xl">El carrito está vacío</p>
        <Link href="/" className={buttonVariants({ className: "mt-4" })}>
          Ver emprendimientos
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (!abiertas) {
          setError("Las reservas ya cerraron.");
          return;
        }
        if (excede || faltantes.length > 0 || !lineas) {
          setError("Revisa las cantidades: no se puede reservar más de lo que hay.");
          return;
        }
        setPending(true);
        const resultado = await reservar({
          acudiente,
          estudiante,
          curso,
          items: grupos.flatMap((grupo) =>
            grupo.filas.map((fila) => ({ productoId: fila.productoId, cantidad: fila.cantidad })),
          ),
          pagos: grupos.map((grupo) => ({
            emprendimientoId: grupo.id,
            metodo: pagos[grupo.id] ?? "efectivo",
          })),
        });
        if (resultado?.error) {
          setError(resultado.error);
          setPending(false);
        }
      }}
    >
      <div className="grid gap-3">
        <Label htmlFor="acudiente">Nombre del acudiente</Label>
        <Input id="acudiente" value={acudiente} onChange={(event) => setAcudiente(event.target.value)} required />
        <Label htmlFor="estudiante">Nombre del estudiante</Label>
        <Input id="estudiante" value={estudiante} onChange={(event) => setEstudiante(event.target.value)} required />
        <Label htmlFor="curso">Curso</Label>
        <Input id="curso" value={curso} onChange={(event) => setCurso(event.target.value)} placeholder="8B" required />
      </div>

      {errorCarga ? <p className="text-sm text-destructive">{errorCarga}</p> : null}
      {!lineas && !errorCarga ? <p className="text-sm text-muted-foreground">Revisando precios y stock…</p> : null}

      {faltantes.map((item) => (
        <p key={item.productoId} className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {item.nombre} ya no está disponible.
        </p>
      ))}

      {grupos.map((grupo) => {
        const subtotal = grupo.filas.reduce((sum, fila) => sum + fila.precio * fila.cantidad, 0);
        const muestra = grupo.filas[0];
        return (
          <section key={grupo.id} className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="font-display text-2xl">
              {grupo.nombre} <span className="text-base text-muted-foreground">{grupo.codigo}</span>
            </h2>
            <ul className="space-y-1 text-sm">
              {grupo.filas.map((fila) => (
                <li key={fila.productoId} className="flex justify-between gap-3">
                  <span>
                    {fila.nombre} × {fila.cantidad}
                    {fila.cantidad > fila.stock ? (
                      <span className="block text-destructive">Solo quedan {fila.stock}.</span>
                    ) : null}
                  </span>
                  <span>{cop(fila.precio * fila.cantidad)}</span>
                </li>
              ))}
            </ul>
            <p className="font-semibold">Subtotal {cop(subtotal)}</p>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Cómo pagan esta boleta</legend>
              {muestra.aceptaEfectivo ? (
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={grupo.id}
                    checked={pagos[grupo.id] === "efectivo"}
                    onChange={() => setPagos((actual) => ({ ...actual, [grupo.id]: "efectivo" }))}
                  />
                  Efectivo en el stand
                </label>
              ) : null}
              {muestra.aceptaQr ? (
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={grupo.id}
                    checked={pagos[grupo.id] === "qr"}
                    onChange={() => setPagos((actual) => ({ ...actual, [grupo.id]: "qr" }))}
                  />
                  QR de {grupo.nombre}
                </label>
              ) : muestra.ofreceQr ? (
                <p className="text-sm text-destructive">
                  Este emprendimiento acepta QR, pero todavía no publica la imagen.
                </p>
              ) : null}
            </fieldset>
          </section>
        );
      })}

      {!abiertas ? (
        <p className="rounded-xl bg-secondary/30 px-3 py-2 text-sm">
          Las reservas cerraron el {textoCierre()}.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Puedes reservar hasta el {textoCierre()}.</p>
      )}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending || !abiertas || !lineas || excede}>
        {pending ? "Reservando…" : "Confirmar reserva"}
      </Button>
    </form>
  );
}
