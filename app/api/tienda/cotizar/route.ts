import { cotizar } from "@/lib/catalogo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids") ?? "";
  const lista = ids.split(",").map((id) => id.trim()).filter(Boolean);
  const data = await cotizar(lista);
  return Response.json(data);
}
