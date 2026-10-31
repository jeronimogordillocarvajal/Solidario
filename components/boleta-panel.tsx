"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cancelarBoleta, reportarPago } from "@/lib/actions";
import { cop } from "@/lib/format";
import type { BoletaSubpedido } from "@/lib/types";
import { EstadoBadge } from "./estado-badge";
import { FotoCampo } from "./foto-campo";

export function BoletaCard({
  pedidoCodigo,
  sub,
}: {
  pedidoCodigo: string;
  sub: BoletaSubpedido;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const puedeCancelar = sub.estado === "por_cobrar" || sub.estado === "pago_reportado";
  const puedeReportar = sub.metodo === "qr" && sub.estado === "por_cobrar";

  return (
    <article className="overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10">
      <div className="h-3" style={{ background: sub.color }} />
      <div className="space-y-3 p-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Boleta</p>
        <h2 className="font-display text-3xl leading-none">{sub.codigo}</h2>
        <p className="text-sm">
          {sub.emprendimientoNombre} · stand {sub.stand} · {sub.grado}
        </p>
        <EstadoBadge estado={sub.estado} />
        <ul className="space-y-1 text-sm">
          {sub.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.nombre} × {item.cantidad}
              </span>
              <span>{cop(item.precio * item.cantidad)}</span>
            </li>
          ))}
        </ul>
        <p className="text-lg font-semibold">{cop(sub.subtotal)}</p>
        {sub.metodo === "efectivo" ? (
          <p className="rounded-xl bg-muted px-3 py-3 text-sm">
            Paga en efectivo en el stand el día de la feria. El equipo marca cuando lo recibe.
          </p>
        ) : (
          <div className="space-y-2 rounded-xl bg-muted px-3 py-3">
            <p className="text-sm font-medium">Paga con el QR de {sub.emprendimientoNombre}</p>
            <p className="text-sm">
              {sub.banco} · {sub.numeroCuenta}
              <br />
              Titular: {sub.titular}
            </p>
            {sub.qrUrl ? (
              <img
                src={sub.qrUrl}
                alt={`QR de pago de ${sub.emprendimientoNombre}`}
                className="h-52 w-52 rounded-xl bg-white object-contain"
              />
            ) : (
              <p className="text-sm text-destructive">Este emprendimiento todavía no publica su QR.</p>
            )}
          </div>
        )}
        {sub.estado === "pago_reportado" ? (
          <p className="text-sm text-primary">
            Pago reportado{sub.comprobanteNumero ? ` con el comprobante ${sub.comprobanteNumero}` : ""}. El equipo lo confirma.
          </p>
        ) : null}
        {puedeReportar ? (
          <form
            className="space-y-2"
            action={async (formData) => {
              const resultado = await reportarPago(formData);
              if (resultado?.error) setError(resultado.error);
              else router.refresh();
            }}
          >
            <input type="hidden" name="codigo" value={pedidoCodigo} />
            <input type="hidden" name="subpedidoId" value={sub.id} />
            <Label htmlFor={`numero-${sub.id}`}>Número de comprobante</Label>
            <Input id={`numero-${sub.id}`} name="numero" required placeholder="88421" />
            <FotoCampo name="foto" texto="Sube la captura del pago. Se reduce a máximo 800 px." />
            <Button type="submit">Reportar pago por QR</Button>
          </form>
        ) : null}
        {puedeCancelar ? (
          <form
            action={async (formData) => {
              const resultado = await cancelarBoleta(formData);
              if (resultado?.error) setError(resultado.error);
              else router.refresh();
            }}
          >
            <input type="hidden" name="codigo" value={pedidoCodigo} />
            <input type="hidden" name="subpedidoId" value={sub.id} />
            <Button type="submit" variant="outline">
              Cancelar esta boleta
            </Button>
          </form>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </article>
  );
}
