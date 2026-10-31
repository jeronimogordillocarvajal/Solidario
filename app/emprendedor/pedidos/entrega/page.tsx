import Link from "next/link";
import { ImprimirButton } from "@/components/imprimir";
import { ScrollTable } from "@/components/scroll-table";
import { EstadoBadge } from "@/components/estado-badge";
import { requireEmprendedor } from "@/lib/auth";
import { listarDelEmprendimiento } from "@/lib/pedidos";

export default async function EntregaPage() {
  const session = await requireEmprendedor();
  const pedidos = (await listarDelEmprendimiento(session.emprendimientoId)).filter(
    (pedido) => pedido.estado !== "cancelado",
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Qué entregar</h1>
          <p className="text-sm text-muted-foreground">Lista del día de la feria. Deslízala en el celular o imprímela.</p>
        </div>
        <ImprimirButton />
      </div>
      <ScrollTable label="Lista de entrega">
        <table className="w-full min-w-[760px] text-left text-sm print:min-w-0">
          <thead className="border-b border-border text-xs uppercase">
            <tr>
              <th className="sticky-col px-3 py-3">Estudiante</th>
              <th className="px-3 py-3">Curso</th>
              <th className="px-3 py-3">Código</th>
              <th className="px-3 py-3">Productos</th>
              <th className="px-3 py-3">Pago</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Acudiente</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="border-b border-border">
                <td className="sticky-col px-3 py-3 font-medium">{pedido.estudiante}</td>
                <td className="px-3 py-3">{pedido.curso}</td>
                <td className="px-3 py-3 whitespace-nowrap">{pedido.codigo}</td>
                <td className="px-3 py-3">
                  {pedido.items.map((item) => `${item.nombre} × ${item.cantidad}`).join(", ")}
                </td>
                <td className="px-3 py-3 uppercase">{pedido.metodo}</td>
                <td className="px-3 py-3">
                  <EstadoBadge estado={pedido.estado} />
                </td>
                <td className="px-3 py-3">{pedido.acudiente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
      {pedidos.length === 0 ? <p className="text-sm text-muted-foreground">No hay pedidos por entregar.</p> : null}
      <Link href="/emprendedor/pedidos" className="no-print text-sm underline">
        Volver a pedidos
      </Link>
    </div>
  );
}
