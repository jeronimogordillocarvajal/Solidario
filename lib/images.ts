import { AppError } from "./errors";

const MAX_BYTES = 2_500_000;

export function detectarImagen(buffer: Buffer) {
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new AppError(
      "La foto pesa demasiado. En el celular se reduce sola a 800 px; intenta otra.",
    );
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg" as const;
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png" as const;
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp" as const;
  }
  throw new AppError("Usa una foto JPG, PNG o WebP.");
}

export async function archivoABuffer(file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectarImagen(buffer);
  return { buffer, ext };
}
