import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  try {
    const { message, botToken, chatId } = req.body || {};
    const token = botToken || process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    const targetChat = chatId || process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;

    if (!token || !targetChat) {
      return res.status(400).json({
        error: 'Faltan parámetros de Telegram: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID',
      });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat.trim(),
        text: message || '🚨 [ALERTA URGENTE NEXUS AGENTE IA]',
        parse_mode: 'Markdown',
      }),
    });

    const tgData = await tgRes.json();
    if (tgRes.ok && tgData.ok) {
      return res.status(200).json({
        success: true,
        provider: 'telegram_vercel',
        message: 'Alerta push de Telegram enviada exitosamente en tiempo real.',
      });
    } else {
      return res.status(400).json({
        error: 'Error al enviar mensaje por Telegram API',
        details: tgData?.description || 'Token o Chat ID no válido.',
      });
    }
  } catch (err: any) {
    console.error('Error in Vercel Telegram endpoint:', err);
    return res.status(500).json({ error: 'Error en servicio de Telegram', details: err?.message });
  }
}
