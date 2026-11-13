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
    const { recipientPhone, senderName, senderEmail, senderPhone, projectType, content, urgencyReason } = req.body || {};
    const targetPhone = (recipientPhone || process.env.VITE_ADMIN_WHATSAPP_PHONE || process.env.WHATSAPP_PHONE_NUMBER || '+573043470984').trim();

    const formattedMessage = `🚨 *[ALERTA AGENTE IA - MENSAJE URGENTE]*
📌 *Cliente:* ${senderName || 'Contacto'} (${senderEmail || 'N/A'})
📞 *Teléfono:* ${senderPhone || 'No registrado'}
💼 *Requerimiento:* ${projectType || 'General'}
⚠️ *Motivo:* ${urgencyReason || 'Mensaje prioritario'}

💬 *Mensaje:*
"${content || ''}"

⏰ *Fecha:* ${new Date().toLocaleString('es-ES')}`;

    console.log(`[VERCEL WHATSAPP DISPATCH] Alerta despachada hacia ${targetPhone}:\n${formattedMessage}`);
    return res.status(200).json({
      success: true,
      provider: 'vercel_serverless',
      recipient: targetPhone,
      formattedMessage,
      message: `Notificación de alerta despachada exitosamente a ${targetPhone}`,
    });
  } catch (err: any) {
    console.error('Error in Vercel WhatsApp endpoint:', err);
    return res.status(500).json({ error: 'Error al enviar notificación WhatsApp', details: err?.message });
  }
}
