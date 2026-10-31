import { Badge } from "@/components/ui/badge";
import { ESTADO_LABEL, type Estado } from "@/lib/constants";

const STYLE: Record<Estado, string> = {
  por_cobrar: "bg-secondary text-secondary-foreground",
  pago_reportado: "bg-[#1D4E89] text-white",
  pagado: "bg-primary text-primary-foreground",
  entregado: "bg-[#245C48] text-white",
  cancelado: "bg-muted text-muted-foreground",
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  return <Badge className={STYLE[estado]}>{ESTADO_LABEL[estado]}</Badge>;
}
