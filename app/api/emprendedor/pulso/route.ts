import { getSession } from "@/lib/auth";
import { ultimoPedidoId } from "@/lib/pedidos";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "emprendedor" || !session.emprendimientoId) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  const pulso = await ultimoPedidoId(session.emprendimientoId);
  return Response.json(pulso);
}
