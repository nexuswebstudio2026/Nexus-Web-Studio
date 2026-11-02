import express from 'express';
import { createServer as createViteServer } from 'vite';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Endpoint for Contact Form Email Dispatch via Gmail SMTP
app.post('/api/contact', async (req, res) => {
  console.log('[API /api/contact] Solicitud recibida:', req.body);

  try {
    const { name, email, phone, projectType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nombre, correo y mensaje son obligatorios.' });
    }

    const smtpUser = (process.env.SMTP_USER || 'nexuswebstudio2026@gmail.com').trim();
    const smtpPass = (process.env.SMTP_PASS || 'souqnarnxoueoiyz').replace(/\s+/g, '').trim();
    const targetEmail = (process.env.SMTP_TO || 'nexuswebstudio2026@gmail.com').trim();

    console.log(`[SMTP Intent] Intentando enviar correo desde ${name} (${email}) hacia ${targetEmail}`);

    // Create Gmail-optimized Nodemailer Transporter using SSL port 465
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true, // SSL port 465
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Configure 'from' with the Client's Name so Gmail Recibidos shows the Client's Name as the Sender
    const mailOptions = {
      from: `"${name}" <${smtpUser}>`,
      replyTo: `"${name}" <${email}>`,
      to: targetEmail,
      subject: `📩 Mensaje de ${name} (${email}) - ${projectType}`,
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
    console.log('[GMAIL SMTP EXITOSO] Remitente mostrado:', name, 'MessageId:', info.messageId);

    return res.status(200).json({
      success: true,
      message: `Correo despachado mostrando a ${name} como remitente.`,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error('❌ Error al enviar correo vía Gmail SMTP:', err);
    return res.status(500).json({
      error: 'Ocurrió un error al despachar el correo SMTP.',
      details: err?.message || String(err),
    });
  }
});

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
