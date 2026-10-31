import { PagosForm } from "@/components/formularios-equipo";
import { requireEmprendedor } from "@/lib/auth";
import { obtenerPagos } from "@/lib/catalogo";

export default async function PagosPage() {
  const session = await requireEmprendedor();
  const pagos = await obtenerPagos(session.emprendimientoId);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-4xl">Mis pagos</h1>
        <p className="text-sm text-muted-foreground">
          El QR que subas es el que ve el acudiente en su factura. El dinero llega directo a la cuenta del equipo.
        </p>
      </div>
      <PagosForm {...pagos} />
    </div>
  );
}
