import Link from "next/link";
import { PedidosTabla } from "@/components/pedidos-tabla";
import { requireEmprendedor } from "@/lib/auth";
import { listarDelEmprendimiento } from "@/lib/pedidos";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireEmprendedor();
  const { tab } = await searchParams;
  const pedidos = await listarDelEmprendimiento(session.emprendimientoId);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl">Mis pedidos</h1>
          <p className="text-sm text-muted-foreground">
            En el celular, desliza la tabla para ver todas las columnas.
          </p>
        </div>
        <Link href="/emprendedor/pedidos/entrega" className="text-sm font-semibold underline">
          Lista para entregar
        </Link>
      </div>
      <PedidosTabla pedidos={pedidos} modo="equipo" tabInicial={tab} />
    </div>
  );
}
