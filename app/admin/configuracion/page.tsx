import { ConfigForm } from "@/components/admin-forms";
import { requireAdmin } from "@/lib/auth";
import { obtenerConfig } from "@/lib/catalogo";
import { ZONA } from "@/lib/format";

function cierreLocal(iso: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export default async function ConfigPage() {
  await requireAdmin();
  const config = await obtenerConfig();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="font-display text-4xl">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          El color principal y el secundario se usan en toda la feria. El cierre automático es el 19 de noviembre a
          medianoche, hora de Bogotá.
        </p>
      </div>
      <ConfigForm
        nombre={config.nombre}
        colorPrincipal={config.colorPrincipal}
        colorSecundario={config.colorSecundario}
        cierreLocal={cierreLocal(config.cierre)}
      />
    </div>
  );
}
