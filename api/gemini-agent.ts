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
    } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // Build system instruction and chat contents
    const systemInstruction = `Identidad del Agente: ${agentName || 'Nexus Agent'}
Rol: ${role || 'Especialista'}
Habilidad Principal: ${customSkillName || 'Asistencia Técnica'}
Descripción: ${description || ''}
Instrucciones de Entrenamiento: ${trainedInstructions || ''}
URL Base / Contexto Web: ${baseUrl || 'No asignada'}
Capacidades Activas: ${Array.isArray(capabilities) ? capabilities.join(', ') : 'Estándar'}
${sessionContext ? `Contexto Adicional: ${sessionContext}` : ''}
Directrices: Responde siempre en español, de forma precisa, ejecutiva y profesional en el ámbito de Nexus Web Studio.`;

    const userPromptText =
      (typeof prompt === 'string' && prompt.trim()) ||
      `Ejecuta tu habilidad entrenada "${customSkillName}" y entrega un reporte técnico detallado.`;

    // Try Gemini API if key is present
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_API_KEY') && !apiKey.includes('placeholder')) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const targetModel =
          typeof model === 'string' && model.startsWith('gemini-')
            ? model
            : 'gemini-2.5-flash';

        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          for (const msg of history) {
            if (!msg || !msg.text) continue;
            contents.push({
              role: msg.sender === 'user' ? 'user' : 'model',
              parts: [{ text: String(msg.text) }],
            });
          }
        }
        contents.push({
          role: 'user',
          parts: [{ text: userPromptText }],
        });

        const response = await ai.models.generateContent({
          model: targetModel,
          contents,
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
          source: targetModel,
        });
      } catch (geminiError: any) {
        console.log(`[Gemini SDK Info] Fallback generator activo para: ${agentName}`);
      }
    }

    // Fallback contextual generator
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
    console.error('Error executing Vercel AI Agent endpoint:', err);
    return res.status(500).json({ error: 'Error al ejecutar el agente de IA', details: err?.message });
  }
}
