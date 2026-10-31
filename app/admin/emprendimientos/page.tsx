import { NuevoEquipoForm } from "@/components/admin-forms";
import { ScrollTable } from "@/components/scroll-table";
import { listarEmprendimientosAdmin } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

export default async function EmprendimientosPage() {
  await requireAdmin();
  const equipos = await listarEmprendimientosAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Emprendimientos</h1>
        <p className="text-sm text-muted-foreground">
          Crea el equipo y la cuenta con la que entran los estudiantes.
        </p>
      </div>
      <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 font-display text-2xl">Nuevo equipo</h2>
        <NuevoEquipoForm />
      </section>
      <ScrollTable label="Emprendimientos">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase">
            <tr>
              <th className="sticky-col px-3 py-3">Código</th>
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">Grado</th>
              <th className="px-3 py-3">Stand</th>
              <th className="px-3 py-3">Correo</th>
              <th className="px-3 py-3">QR y cuenta</th>
            </tr>
          </thead>
          <tbody>
            {equipos.map((equipo) => (
              <tr key={equipo.id} className="border-b border-border">
                <td className="sticky-col px-3 py-3 font-semibold">{equipo.codigo}</td>
                <td className="px-3 py-3">{equipo.nombre}</td>
                <td className="px-3 py-3">{equipo.grado}</td>
                <td className="px-3 py-3">{equipo.stand}</td>
                <td className="px-3 py-3">{equipo.email ?? "Sin usuario"}</td>
                <td className="px-3 py-3">
                  {equipo.aceptaQr
                    ? equipo.tieneQr && equipo.tieneCuenta
                      ? "Listo"
                      : "Falta imagen o cuenta"
                    : "No usa QR"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollTable>
    </div>
  );
}
