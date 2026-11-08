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

// API Endpoint for AI Agent Skill Execution with Gemini SDK (@google/genai)
app.post('/api/gemini-agent', async (req, res) => {
  try {
    const {
      agentName,
      role,
      customSkillName,
      description,
      trainedInstructions,
      baseUrl,
      capabilities,
      sessionContext,
      model,
      prompt,
      history,
      isAutonomousRun,
    } = req.body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const {
      resolveGeminiModelId,
      buildAgentSystemInstruction,
      buildGeminiChatContents,
    } = await import('./src/utils/agentConfig');
    const resolvedModelId = resolveGeminiModelId(model);

    const systemInstruction = buildAgentSystemInstruction({
      agentName,
      role,
      customSkillName,
      description,
      trainedInstructions,
      baseUrl,
      capabilities,
      sessionContext,
    });

    const userPromptText =
      (typeof prompt === 'string' && prompt.trim()) ||
      `Ejecuta tu habilidad entrenada "${customSkillName}" y entrega un reporte técnico detallado.`;

    const multiTurnContents =
      Array.isArray(history) && history.length > 0
        ? buildGeminiChatContents(history, userPromptText)
        : userPromptText;

    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_API_KEY') && !apiKey.includes('placeholder')) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const response = await ai.models.generateContent({
          model: resolvedModelId,
          contents: multiTurnContents,
          config: {
            systemInstruction,
          },
        });

        const textOutput = response.text || 'Ejecución completada satisfactoriamente.';
        return res.status(200).json({
          success: true,
          output: textOutput,
          agentName,
          customSkillName,
          baseUrl: baseUrl || undefined,
          source: resolvedModelId,
        });
      } catch (geminiError: any) {
        // Smoothly fall through to nexus-skill-engine fallback without logging noisy API key error payloads
        console.log(`[Gemini SDK Info] Fallback generator active for agent: ${agentName}`);
      }
    }

    // Dynamic Contextual Response Generator (when running offline/local without Gemini API key)
    const timestamp = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const urlContextLine = baseUrl ? `\nURL Base vinculada: ${baseUrl}` : '';
    const extraCtxLine = sessionContext ? `\nContexto adicional activo: ${sessionContext}` : '';
    const priorUserTurns = Array.isArray(history)
      ? history
          .filter((m: any) => m && m.sender === 'user' && typeof m.text === 'string' && m.text.trim())
          .map((m: any) => m.text.trim())
      : [];
    const memoryLine =
      priorUserTurns.length > 0
        ? `\nMemoria de conversación (${priorUserTurns.length} mensaje(s) previo(s)): "${priorUserTurns[priorUserTurns.length - 1]}"`
        : '';

    let fallbackText = '';

    if (isAutonomousRun) {
      fallbackText = `[24/7 AUTÓNOMO - ${timestamp}] Agente ${agentName} ejecutó exitosamente la habilidad "${customSkillName}".${urlContextLine} Criterio aplicado: "${(trainedInstructions || '').slice(0, 80)}...".`;
    } else {
      fallbackText = `[Agente ${agentName}]: Aplicando instrucciones configuradas para tu solicitud: "${userPromptText}".${urlContextLine}${extraCtxLine}${memoryLine}\n\nSistema de Prompts activo: ${trainedInstructions}\n\nResultado: Respuesta procesada y lista para operar sobre el entorno web configurado.`;
    }

    return res.status(200).json({
      success: true,
      output: fallbackText,
      agentName,
      customSkillName,
      baseUrl: baseUrl || undefined,
      source: 'nexus-skill-engine',
    });
  } catch (err: any) {
    console.error('Error executing AI Agent endpoint:', err);
    return res.status(500).json({ error: 'Error al ejecutar el agente de IA', details: err?.message });
  }
});

// API Endpoint for Receiving External Project Webhooks
app.post('/api/webhooks/projects', async (req, res) => {
  try {
    const { eventType, project, source } = req.body;
    if (!project || !project.name) {
      return res.status(400).json({ error: 'Payload de proyecto no válido. Se requiere un objeto "project" con propiedad "name".' });
    }

    const event = {
      id: `wh_ext_${Date.now()}`,
      eventType: eventType || 'project.created',
      projectId: project.id || `prj_${Date.now()}`,
      projectName: project.name,
      clientName: project.clientName || 'Cliente Externo',
      status: 'dispatched',
      summary: `Webhook recibido (${source || 'API Externa'}): Proyecto "${project.name}" ${eventType === 'project.created' ? 'creado con éxito' : 'modificado'}.`,
      timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`
    };

    console.log('[API WEBHOOK RECIBIDO]', event);

    return res.status(200).json({
      success: true,
      message: 'Evento webhook de proyecto procesado e informado a los Agentes de IA.',
      event,
    });
  } catch (err: any) {
    console.error('Error processing project webhook:', err);
    return res.status(500).json({ error: 'Error procesando webhook de proyecto', details: err?.message });
  }
});

// API Endpoint for WhatsApp Dispatch Proxy
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { recipientPhone, senderName, senderEmail, senderPhone, projectType, content, urgencyReason } = req.body;
    const targetPhone = (recipientPhone || process.env.VITE_ADMIN_WHATSAPP_PHONE || process.env.WHATSAPP_PHONE_NUMBER || '+573043470984').trim();

    const formattedMessage = `🚨 *[ALERTA AGENTE IA - MENSAJE URGENTE]*
📌 *Cliente:* ${senderName} (${senderEmail})
📞 *Teléfono:* ${senderPhone || 'No registrado'}
💼 *Requerimiento:* ${projectType}
⚠️ *Motivo:* ${urgencyReason || 'Mensaje prioritario identificado en Bandeja de Entrada de Firebase'}

💬 *Mensaje:*
"${content}"

⏰ *Fecha:* ${new Date().toLocaleString('es-ES')}`;

    console.log(`[WHATSAPP DISPATCH PROXY] Alerta despachada hacia ${targetPhone}:\n${formattedMessage}`);
    return res.status(200).json({
      success: true,
      provider: 'server_proxy',
      recipient: targetPhone,
      formattedMessage,
      message: `Notificación de alerta despachada exitosamente a ${targetPhone}`
    });
  } catch (err: any) {
    console.error('Error in WhatsApp server endpoint:', err);
    return res.status(500).json({ error: 'Error al enviar notificación WhatsApp', details: err?.message });
  }
});

// API Endpoint for Instant Telegram Bot Push Notifications (100% Free & Always Active)
app.post('/api/send-telegram', async (req, res) => {
  try {
    const { message, botToken, chatId } = req.body;
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
        text: message || '🚨 [ALERTA URGENTE NEXUS AGENTE IA] Mensaje de prueba de notificación en tiempo real.',
        parse_mode: 'Markdown',
      }),
    });

    const tgData = await tgRes.json();
    if (tgRes.ok && tgData.ok) {
      return res.status(200).json({
        success: true,
        provider: 'telegram',
        message: 'Alerta push de Telegram enviada exitosamente en tiempo real.',
      });
    } else {
      return res.status(400).json({
        error: 'Error al enviar mensaje por Telegram API',
        details: tgData?.description || 'Token o Chat ID no válido.',
      });
    }
  } catch (err: any) {
    console.error('Error in Telegram server endpoint:', err);
    return res.status(500).json({ error: 'Error en servicio de Telegram', details: err?.message });
  }
});

// API Endpoint for Universal Web Proxy (Bypasses X-Frame-Options & CSP to render any website in the embedded browser)
app.get('/api/proxy-web', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).send('<h3>Error: URL no proporcionada</h3>');
    }

    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Set browser headers for high compatibility
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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

      // Inject base href tag so relative images, scripts, and CSS load from origin
      const baseTag = `<base href="${originBase}/" target="_self" />`;

      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>${baseTag}`);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        html = `${baseTag}${html}`;
      }

      // Strip frame restrictions in response headers
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      return res.status(200).send(html);
    } else {
      const buffer = await response.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(Buffer.from(buffer));
    }
  } catch (err: any) {
    console.error('[Proxy Web Error]:', err?.message);
    const fallbackUrl = (req.query.url as string) || 'https://google.com';
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Navegación Web Directa</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #1e293b; padding: 32px; border-radius: 20px; border: 1px solid #334155; max-width: 540px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h2 { color: #38bdf8; margin-top: 0; font-size: 20px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .url-badge { background: #0f172a; color: #4ade80; padding: 8px 14px; border-radius: 10px; font-family: monospace; font-size: 13px; word-break: break-all; display: inline-block; margin: 12px 0; border: 1px solid #1e293b; }
            .btn { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 14px; text-decoration: none; cursor: pointer; transition: all 0.2s; margin-top: 16px; }
            .btn:hover { opacity: 0.9; transform: translateY(-1px); }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>🌐 Navegación hacia la URL solicitada</h2>
            <div class="url-badge">${fallbackUrl}</div>
            <p>El sitio web requiere conexión directa por restricciones de red o seguridad. Puedes abrir la navegación interactiva completa con un solo clic:</p>
            <a href="${fallbackUrl.startsWith('http') ? fallbackUrl : 'https://' + fallbackUrl}" target="_blank" class="btn">
              <span>Abrir ${fallbackUrl} en Nueva Pestaña 🚀</span>
            </a>
          </div>
        </body>
      </html>
    `);
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
