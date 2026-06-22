export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
