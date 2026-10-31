import { getSession } from "@/lib/auth";
import { suscribirPedidos } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "emprendedor" || !session.emprendimientoId) {
    return new Response("No autorizado", { status: 401 });
  }
  const emprendimientoId = session.emprendimientoId;
  const encoder = new TextEncoder();
  let cerrar = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const enviar = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      enviar({ type: "listo" });
      const quitar = suscribirPedidos((evento) => {
        if (evento.emprendimientoId === emprendimientoId) enviar(evento);
      });
      const pulso = setInterval(() => {
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 15000);
      cerrar = () => {
        clearInterval(pulso);
        quitar();
      };
    },
    cancel() {
      cerrar();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
