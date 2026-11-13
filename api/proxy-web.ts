import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = (req.query.url as string) || '';
    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).send('<h3>Error: URL no proporcionada</h3>');
    }

    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';

    if (contentType.includes('text/html')) {
      let html = await response.text();
      const originUrl = new URL(response.url || targetUrl);
      const originBase = originUrl.origin;

      // Inject base tag to correctly resolve relative styles, images, and fonts
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head><base href="${originBase}/" target="_blank">`);
      } else if (html.includes('<head ')) {
        html = html.replace(/<head[^>]*>/i, `$&<base href="${originBase}/" target="_blank">`);
      } else {
        html = `<base href="${originBase}/" target="_blank">` + html;
      }

      // Remove restrictive headers via client script
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      return res.status(200).send(html);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      return res.status(200).send(Buffer.from(arrayBuffer));
    }
  } catch (proxyError: any) {
    return res.status(500).send(`
      <div style="font-family: system-ui, sans-serif; padding: 30px; text-align: center; background: #0f172a; color: #f8fafc; min-height: 100vh;">
        <h2 style="color: #f87171;">No se pudo cargar la vista previa directa</h2>
        <p style="color: #94a3b8; font-size: 14px; max-width: 500px; margin: 12px auto;">${proxyError?.message || 'Error de red o protección de origen.'}</p>
      </div>
    `);
  }
}
