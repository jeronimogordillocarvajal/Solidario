import { ResolverForm } from "@/components/admin-forms";
import { listarSoporte } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { fechaHora } from "@/lib/format";

export default async function AdminSoportePage() {
  await requireAdmin();
  const solicitudes = await listarSoporte();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Soporte</h1>
      {solicitudes.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-sm ring-1 ring-foreground/10">
          No hay solicitudes. Cuando alguien escriba desde la tienda, aparece aquí.
        </p>
      ) : (
        <ul className="space-y-3">
          {solicitudes.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <p className="text-xs text-muted-foreground">
                {fechaHora(item.created_at)} · {item.estado}
              </p>
              <h2 className="font-display text-2xl">{item.nombre}</h2>
              <p className="text-sm">{item.correo}</p>
              <p className="mt-2 text-sm">{item.mensaje}</p>
              {item.estado === "resuelto" ? (
                <p className="mt-2 text-sm text-primary">Respuesta: {item.respuesta}</p>
              ) : (
                <ResolverForm id={item.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
