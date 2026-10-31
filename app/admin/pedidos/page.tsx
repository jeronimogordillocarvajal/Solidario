import { PedidosTabla } from "@/components/pedidos-tabla";
import { requireAdmin } from "@/lib/auth";
import { listarTodos } from "@/lib/pedidos";

export default async function AdminPedidosPage() {
  await requireAdmin();
  const pedidos = await listarTodos();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Todos los pedidos</h1>
          <p className="text-sm text-muted-foreground">
            En el celular, desliza la tabla para ver todas las columnas. El Excel incluye todo.
          </p>
        </div>
        <a href="/api/admin/pedidos/excel" className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Exportar Excel
        </a>
      </div>
      <PedidosTabla pedidos={pedidos} modo="admin" />
    </div>
  );
}
