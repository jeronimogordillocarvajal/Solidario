import { comprobanteDeBoleta } from "@/lib/pedidos";
import { contentType, readUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ codigo: string; id: string }> },
) {
  const { codigo, id } = await params;
  const archivo = await comprobanteDeBoleta(codigo, id);
  if (!archivo) return new Response("No encontrado", { status: 404 });
  const bytes = readUpload("comprobantes", archivo.id, archivo.ext);
  if (!bytes) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType(archivo.ext),
      "Cache-Control": "private, no-store",
    },
  });
}
