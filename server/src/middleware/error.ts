import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/** Error with an HTTP status and a stable machine-readable code for the client. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

/** 404 for any route not matched above it. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found' });
}

/** Central error handler: validation errors -> 400, HttpError -> its status, the rest -> 500. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'validation_error', issues: err.issues });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
}
