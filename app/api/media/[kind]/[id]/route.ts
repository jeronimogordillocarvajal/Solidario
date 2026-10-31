import { getSession } from "@/lib/auth";
import { archivoEmprendimiento, archivoProducto } from "@/lib/catalogo";
import { comprobanteDeEquipo } from "@/lib/pedidos";
import { contentType, readUpload, type MediaKind } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const PUBLICOS = new Set(["logos", "qrs", "productos"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  if (!["logos", "qrs", "productos", "comprobantes"].includes(kind)) {
    return new Response("No encontrado", { status: 404 });
  }
  const session = await getSession();
  let archivo: { id: string; ext: string } | null = null;
  if (kind === "productos") archivo = await archivoProducto(id, session);
  if (kind === "logos" || kind === "qrs") archivo = await archivoEmprendimiento(kind, id);
  if (kind === "comprobantes") {
    if (!session) return new Response("No autorizado", { status: 401 });
    archivo = await comprobanteDeEquipo(session, id);
  }
  if (!archivo) return new Response("No encontrado", { status: 404 });
  const bytes = readUpload(kind as MediaKind, archivo.id, archivo.ext);
  if (!bytes) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType(archivo.ext),
      "Cache-Control": PUBLICOS.has(kind) ? "public, max-age=60" : "private, no-store",
    },
  });
}
