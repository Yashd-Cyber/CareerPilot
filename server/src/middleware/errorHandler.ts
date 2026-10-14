import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(error);

  if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ApiError') {
    const providerError = error as { status?: unknown; code?: unknown; message?: unknown };
    let status = Number(providerError.status ?? providerError.code);
    let message = typeof providerError.message === 'string' ? providerError.message : '';

    if (message.startsWith('{"error":')) {
      try {
        const parsed: unknown = JSON.parse(message);
        if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
          const details = parsed.error;
          if (typeof details === 'object' && details !== null) {
            if ('code' in details) status = Number(details.code);
            if ('message' in details && typeof details.message === 'string') message = details.message;
          }
        }
      } catch {
        // Keep the original provider message when its body is not parseable.
      }
    }

    if (status === 429 || /resource_exhausted|quota exceeded/i.test(message)) {
      return res.status(503).json({
        message: 'Gemini API quota is exhausted for this model. Check your quota or billing at https://ai.google.dev/gemini-api/docs/rate-limits, then retry.',
      });
    }
    if (status === 503) {
      return res.status(503).json({
        message: 'Gemini is temporarily unavailable. Please retry shortly.',
      });
    }
    return res.status(502).json({
      message: `Gemini API request failed (${Number.isFinite(status) ? status : 'unknown status'}). Check the configured model and API access.`,
    });
  }

  if (typeof error === 'object' && error && 'statusCode' in error && 'message' in error) {
    const err = error as { statusCode?: number; message?: string };
    return res.status(err.statusCode ?? 500).json({ message: err.message ?? 'Something went wrong.' });
  }

  if (
    typeof error === 'object'
    && error !== null
    && 'name' in error
    && error.name === 'ApiError'
    && 'status' in error
  ) {
    const status = Number(error.status);
    return res.status(status === 429 || status === 503 ? 503 : 502).json({
      message: status === 429 || status === 503
        ? 'Gemini is temporarily unavailable. Please try again shortly.'
        : `Gemini API request failed (${status}). Check the configured Gemini model and API access.`,
    });
  }

  return res.status(500).json({ message: 'Internal server error.' });
};
