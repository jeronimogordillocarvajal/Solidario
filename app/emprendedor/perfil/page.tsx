import { PerfilForm } from "@/components/formularios-equipo";
import { requireEmprendedor } from "@/lib/auth";
import { obtenerPerfilNegocio } from "@/lib/catalogo";

export default async function PerfilPage() {
  const session = await requireEmprendedor();
  const perfil = await obtenerPerfilNegocio(session.emprendimientoId);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-4xl">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">
          {perfil.nombre} · {perfil.codigo} · stand {perfil.stand} · {perfil.grado}
        </p>
      </div>
      <PerfilForm
        descripcion={perfil.descripcion}
        color={perfil.color}
        integrantes={perfil.integrantes}
        logoUrl={perfil.logoUrl}
        codigo={perfil.codigo}
      />
    </div>
  );
}
