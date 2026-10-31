import { exportarExcel } from "@/lib/admin";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "admin") {
    return new Response("No autorizado", { status: 401 });
  }
  const buffer = await exportarExcel();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="pedidos-feria-go.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
