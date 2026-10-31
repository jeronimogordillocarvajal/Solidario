"use client";

import { useRef, useState } from "react";
import { Camera, ImageIcon } from "lucide-react";

async function fileToJpeg(file: File, max = 800) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("blob"))),
      "image/jpeg",
      0.82,
    );
  });
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}

export function FotoCampo({
  name,
  texto,
}: {
  name: string;
  texto?: string;
}) {
  const hidden = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function elegir(file: File | undefined) {
    if (!file) return;
    try {
      const jpeg = await fileToJpeg(file);
      const url = URL.createObjectURL(jpeg);
      setPreview((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior);
        return url;
      });
      const transfer = new DataTransfer();
      transfer.items.add(jpeg);
      if (hidden.current) hidden.current.files = transfer.files;
      setError("");
    } catch {
      setError("No pudimos leer esa foto. Tómala de nuevo o elige otra de la galería.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium">
          <Camera className="size-4" />
          Tomar foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => void elegir(event.target.files?.[0])}
          />
        </label>
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium">
          <ImageIcon className="size-4" />
          Galería
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void elegir(event.target.files?.[0])}
          />
        </label>
      </div>
      <input ref={hidden} type="file" name={name} accept="image/jpeg" className="hidden" />
      {preview ? (
        <img src={preview} alt="Vista previa" className="h-36 w-36 rounded-xl object-cover" />
      ) : null}
      <p className="text-xs text-muted-foreground">
        {texto ?? "La foto se reduce a máximo 800 px antes de subirse."}
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
