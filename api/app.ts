import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request, Response } from 'express';
import { createApp } from '../server.ts';

type ExpressApp = Awaited<ReturnType<typeof createApp>>;
type VercelLikeRequest = IncomingMessage & Partial<Request> & {
  query?: Record<string, string | string[] | undefined>;
  _body?: boolean;
};
type VercelLikeResponse = ServerResponse & Partial<Response>;

let appPromise: Promise<ExpressApp> | undefined;

function sendJson(res: VercelLikeResponse, statusCode: number, body: Record<string, string>): void {
  if (res.writableEnded) return;
  res.statusCode = statusCode;
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  res.end(JSON.stringify(body));
}

function resolveApiPath(req: VercelLikeRequest, parsedUrl: URL): string | null {
  const queryPath = req.query?.__path ?? parsedUrl.searchParams.get('__path') ?? undefined;
  const rawPath = Array.isArray(queryPath) ? queryPath[0] : queryPath;

  if (typeof rawPath === 'string' && rawPath.trim()) {
    return rawPath.trim();
  }

  if (parsedUrl.pathname.startsWith('/api/') && parsedUrl.pathname !== '/api/app') {
    return parsedUrl.pathname.slice('/api/'.length);
  }

  return null;
}

/**
 * Vercel's Vite preset serves the frontend as static files and does not route
 * an Express catch-all automatically. `vercel.json` rewrites every `/api/*`
 * request here; restore the original path before passing it to Express and
 * await response completion so async handlers finish before Vercel exits.
 */
export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse): Promise<void> {
  const parsedUrl = new URL(req.url || '/api/app', 'http://vercel.local');
  const routePath = resolveApiPath(req, parsedUrl);

  if (!routePath) {
    sendJson(res, 400, { error: 'La ruta de API solicitada no es válida.' });
    return;
  }

  const normalizedPath = routePath.replace(/^\/+/, '');
  if (!normalizedPath || normalizedPath.split('/').some((segment) => segment === '.' || segment === '..')) {
    sendJson(res, 400, { error: 'La ruta de API solicitada no es válida.' });
    return;
  }

  parsedUrl.searchParams.delete('__path');
  const targetUrl = `/api/${normalizedPath}${parsedUrl.search}`;
  req.url = targetUrl;
  (req as { originalUrl?: string }).originalUrl = targetUrl;

  if (req.body !== undefined && req._body === undefined) {
    req._body = true;
  }

  try {
    appPromise ??= createApp({ includeFrontend: false });
    const app = await appPromise;
    await new Promise<void>((resolve) => {
      const finish = () => {
        res.off('finish', finish);
        res.off('close', finish);
        resolve();
      };
      res.once('finish', finish);
      res.once('close', finish);
      app(req as Request, res as Response, (err?: unknown) => {
        if (err) {
          console.error('Error procesando la API en Vercel:', err);
          sendJson(res, 500, { error: 'No fue posible procesar la solicitud.' });
        } else if (!res.writableEnded) {
          sendJson(res, 404, { error: 'Ruta de API no encontrada.' });
        }
        finish();
      });
    });
  } catch (error) {
    appPromise = undefined;
    console.error('Error inicializando la API en Vercel:', error);
    sendJson(res, 500, { error: 'No fue posible iniciar el servidor de la aplicación.' });
  }
}
