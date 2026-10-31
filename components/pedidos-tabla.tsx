"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ESTADO_LABEL, ESTADOS, type Estado } from "@/lib/constants";
import { cambiarEstadoPedido } from "@/lib/actions";
import { cop, fechaHora } from "@/lib/format";
import type { SubpedidoVista } from "@/lib/types";
import { EstadoBadge } from "./estado-badge";
import { ScrollTable } from "./scroll-table";

function Boton({ children, variant = "default" as const }: { children: React.ReactNode; variant?: "default" | "outline" | "destructive" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} className="w-full">
      {pending ? "Guardando…" : children}
    </Button>
  );
}

export function PedidosTabla({
  pedidos,
  modo,
  tabInicial,
}: {
  pedidos: SubpedidoVista[];
  modo: "equipo" | "admin";
  tabInicial?: string;
}) {
  const router = useRouter();
  const inicial: Estado | "todos" =
    tabInicial && ESTADOS.includes(tabInicial as Estado)
      ? (tabInicial as Estado)
      : modo === "admin"
        ? "todos"
        : "por_cobrar";
  const [tab, setTab] = useState<Estado | "todos">(inicial);
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<SubpedidoVista | null>(null);
  const [error, setError] = useState("");

  const conteos = useMemo(() => {
    const base = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<Estado, number>;
    for (const pedido of pedidos) base[pedido.estado] += 1;
    return base;
  }, [pedidos]);

  const visibles = useMemo(() => {
    const consulta = q.trim().toLowerCase();
    return pedidos.filter((pedido) => {
      const coincide =
        !consulta ||
        pedido.codigo.toLowerCase().includes(consulta) ||
        pedido.pedidoCodigo.toLowerCase().includes(consulta) ||
        pedido.estudiante.toLowerCase().includes(consulta) ||
        pedido.acudiente.toLowerCase().includes(consulta);
      if (!coincide) return false;
      if (consulta) return true;
      if (tab === "todos") return true;
      return pedido.estado === tab;
    });
  }, [pedidos, q, tab]);

  const pestanas = modo === "admin" ? (["todos", ...ESTADOS] as const) : ESTADOS;

  async function enviar(formData: FormData) {
    setError("");
    const resultado = await cambiarEstadoPedido(formData);
    if (resultado?.error) {
      setError(resultado.error);
      return;
    }
    setAbierto(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Buscar por código de pedido</span>
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="FG-4H8M o FG-4H8M-E01"
          inputMode="search"
        />
      </label>
      {q.trim() ? (
        <p className="text-sm text-muted-foreground">Buscando en todos los estados.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {pestanas.map((id) => {
            const label = id === "todos" ? "Todos" : ESTADO_LABEL[id];
            const count = id === "todos" ? pedidos.length : conteos[id];
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`h-11 shrink-0 rounded-full px-3 text-sm font-medium ${
                  on ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border"
                }`}
              >
                {label} {count}
              </button>
            );
          })}
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="rounded-2xl bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
          <p className="font-display text-2xl">No hay pedidos aquí</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {q.trim()
              ? "Prueba con el código completo de la boleta."
              : "Cuando un acudiente reserve, la boleta aparece en Por cobrar."}
          </p>
        </div>
      ) : (
        <ScrollTable label="Pedidos del emprendimiento">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="sticky-col px-3 py-3 font-medium">Código</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                {modo === "admin" ? <th className="px-3 py-3 font-medium">Emprendimiento</th> : null}
                <th className="px-3 py-3 font-medium">Acudiente</th>
                <th className="px-3 py-3 font-medium">Estudiante</th>
                <th className="px-3 py-3 font-medium">Curso</th>
                <th className="px-3 py-3 font-medium">Productos</th>
                <th className="px-3 py-3 font-medium">Subtotal</th>
                <th className="px-3 py-3 font-medium">Pago</th>
                <th className="px-3 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((pedido) => (
                <tr key={pedido.id} className="border-b border-border last:border-0">
                  <td className="sticky-col px-3 py-3 align-top">
                    <p className="font-semibold">{pedido.codigo}</p>
                    <button
                      type="button"
                      className="mt-1 text-sm font-medium text-primary underline"
                      onClick={() => {
                        setError("");
                        setAbierto(pedido);
                      }}
                    >
                      Ver
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">{fechaHora(pedido.createdAt)}</td>
                  {modo === "admin" ? (
                    <td className="px-3 py-3 align-top">
                      {pedido.emprendimientoNombre}
                      <span className="block text-xs text-muted-foreground">{pedido.emprendimientoCodigo}</span>
                    </td>
                  ) : null}
                  <td className="px-3 py-3 align-top">{pedido.acudiente}</td>
                  <td className="px-3 py-3 align-top">{pedido.estudiante}</td>
                  <td className="px-3 py-3 align-top">{pedido.curso}</td>
                  <td className="px-3 py-3 align-top">
                    {pedido.items.map((item) => (
                      <span key={item.id} className="block">
                        {item.nombre} × {item.cantidad}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-3 align-top whitespace-nowrap">{cop(pedido.subtotal)}</td>
                  <td className="px-3 py-3 align-top uppercase">{pedido.metodo}</td>
                  <td className="px-3 py-3 align-top">
                    <EstadoBadge estado={pedido.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      )}

      <Dialog open={Boolean(abierto)} onOpenChange={(open) => !open && setAbierto(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {abierto ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{abierto.codigo}</DialogTitle>
                <DialogDescription>
                  {abierto.estudiante} · {abierto.curso} · {fechaHora(abierto.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm">
                Acudiente: <strong>{abierto.acudiente}</strong>
              </p>
              <ul className="space-y-1 text-sm">
                {abierto.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>
                      {item.nombre} × {item.cantidad}
                    </span>
                    <span>{cop(item.precio * item.cantidad)}</span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold">
                {cop(abierto.subtotal)} · {abierto.metodo === "qr" ? "QR" : "Efectivo"}
              </p>
              <EstadoBadge estado={abierto.estado} />
              {abierto.metodo === "qr" && abierto.comprobanteNumero ? (
                <div className="space-y-2 rounded-xl bg-muted p-3">
                  <p className="text-sm">
                    Comprobante <strong>{abierto.comprobanteNumero}</strong>
                  </p>
                  {abierto.comprobanteUrl ? (
                    <img
                      src={abierto.comprobanteUrl}
                      alt={`Captura del comprobante ${abierto.comprobanteNumero}`}
                      className="max-h-72 w-full rounded-lg object-contain bg-card"
                    />
                  ) : null}
                </div>
              ) : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              {modo === "equipo" ? (
                <div className="grid gap-2">
                  {abierto.metodo === "qr" && abierto.estado === "pago_reportado" ? (
                    <>
                      <form action={enviar}>
                        <input type="hidden" name="id" value={abierto.id} />
                        <input type="hidden" name="accion" value="confirmar_qr" />
                        <Boton>Confirmar pago</Boton>
                      </form>
                      <form action={enviar}>
                        <input type="hidden" name="id" value={abierto.id} />
                        <input type="hidden" name="accion" value="rechazar_qr" />
                        <Boton variant="outline">No llegó el pago</Boton>
                      </form>
                    </>
                  ) : null}
                  {abierto.metodo === "efectivo" && abierto.estado === "por_cobrar" ? (
                    <form action={enviar}>
                      <input type="hidden" name="id" value={abierto.id} />
                      <input type="hidden" name="accion" value="recibi_efectivo" />
                      <Boton>Recibí el efectivo</Boton>
                    </form>
                  ) : null}
                  {abierto.estado === "pagado" ? (
                    <form action={enviar}>
                      <input type="hidden" name="id" value={abierto.id} />
                      <input type="hidden" name="accion" value="entregado" />
                      <Boton>Marcar entregado</Boton>
                    </form>
                  ) : null}
                  {abierto.estado === "por_cobrar" || abierto.estado === "pago_reportado" ? (
                    <form action={enviar}>
                      <input type="hidden" name="id" value={abierto.id} />
                      <input type="hidden" name="accion" value="cancelar" />
                      <Boton variant="destructive">Cancelar pedido</Boton>
                    </form>
                  ) : null}
                </div>
              ) : null}
              <div>
                <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Historial
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {abierto.historial.map((entrada) => (
                    <li key={entrada.id}>
                      {ESTADO_LABEL[entrada.estadoNuevo]} · {entrada.actor === "acudiente" ? "Acudiente" : entrada.actor} ·{" "}
                      {fechaHora(entrada.createdAt)}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
