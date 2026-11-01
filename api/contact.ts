import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers for Vercel Serverless Function
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const { name, email, phone, projectType, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nombre, correo y mensaje son obligatorios.' });
    }

    // Read Vercel Environment Variables or use default active credentials
    const smtpUser = (process.env.SMTP_USER || 'nexuswebstudio2026@gmail.com').trim();
    const smtpPass = (process.env.SMTP_PASS || 'souqnarnxoueoiyz').replace(/\s+/g, '').trim();
    const targetEmail = (process.env.SMTP_TO || 'nexuswebstudio2026@gmail.com').trim();

    // Create Nodemailer Transporter with Gmail service
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"${name}" <${smtpUser}>`,
      replyTo: `"${name}" <${email}>`,
      to: targetEmail,
      subject: `📥 Nuevo Mensaje del Sitio Web: ${name} (${projectType})`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 28px; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #334155;">
          <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
            <h1 style="color: #818cf8; margin: 0; font-size: 22px;">Nexus Web Studio</h1>
            <p style="color: #38bdf8; margin: 4px 0 0 0; font-size: 13px;">Nuevo Requerimiento de Proyecto Recibido</p>
          </div>

          <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <p style="margin: 6px 0;"><strong>Remitente / Cliente:</strong> <span style="color: #ffffff; font-weight: bold; font-size: 15px;">${name}</span></p>
            <p style="margin: 6px 0;"><strong>Correo del Cliente:</strong> <a href="mailto:${email}" style="color: #38bdf8; font-weight: bold;">${email}</a></p>
            <p style="margin: 6px 0;"><strong>Teléfono / WhatsApp:</strong> <span style="color: #4ade80;">${phone || 'No especificado'}</span></p>
            <p style="margin: 6px 0;"><strong>Tipo de Proyecto:</strong> <span style="color: #a855f7; font-weight: bold;">${projectType}</span></p>
          </div>

          <div style="background-color: #020617; padding: 20px; border-radius: 12px; border: 1px solid #1e293b;">
            <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px; font-weight: bold; text-transform: uppercase;">Descripción / Requerimientos:</p>
            <p style="margin: 0; color: #f1f5f9; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
            <p style="margin: 0;">Nexus Web Studio © 2026 | Línea Directa WhatsApp: +57 3043470984</p>
            <p style="margin: 4px 0 0 0; color: #38bdf8;">💡 Haz clic en "Responder" en Gmail para escribirle directamente a ${name} (${email})</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Correo despachado mostrando a ${name} como remitente.`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('❌ Error en Vercel Serverless Function /api/contact:', err);
    return res.status(500).json({
      error: 'Ocurrió un error al despachar el correo SMTP desde Vercel.',
      details: err?.message || String(err),
    });
  }
}
