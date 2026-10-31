export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function mensajeError(error: unknown) {
  if (error instanceof AppError) return error.message;
  console.error(error);
  return "Algo salió mal. Intenta de nuevo.";
}
