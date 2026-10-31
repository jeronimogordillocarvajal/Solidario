import { EmprendedorShell } from "@/components/shells";
import { LiveRefresh } from "@/components/live-refresh";
import { requireEmprendedor } from "@/lib/auth";
import { obtenerPerfilNegocio } from "@/lib/catalogo";
import { ultimoPedidoId } from "@/lib/pedidos";

export default async function EmprendedorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireEmprendedor();
  const [negocio, pulso] = await Promise.all([
    obtenerPerfilNegocio(session.emprendimientoId),
    ultimoPedidoId(session.emprendimientoId),
  ]);
  return (
    <EmprendedorShell nombre={negocio.nombre} codigo={negocio.codigo}>
      <div className="mb-4">
        <LiveRefresh ultimoId={pulso.ultimoId} />
      </div>
      {children}
    </EmprendedorShell>
  );
}
