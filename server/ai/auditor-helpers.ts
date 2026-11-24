export interface ParsedAiError {
  code: number | null;
  status: string | null;
  message: string;
}

export function parseAiError(err: unknown): ParsedAiError {
  const rawMessage =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Error inesperado';

  let code: number | null =
    typeof (err as { status?: unknown })?.status === 'number'
      ? ((err as { status: number }).status ?? null)
      : null;
  let status: string | null = null;
  let message = rawMessage;

  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart)) as {
        error?: { code?: number; status?: string; message?: string };
        code?: number;
        status?: string;
        message?: string;
      };
      const inner = parsed.error ?? parsed;
      if (typeof inner.code === 'number') code = inner.code;
      if (typeof inner.status === 'string') status = inner.status;
      if (typeof inner.message === 'string' && inner.message.trim()) {
        message = inner.message.trim();
      }
    } catch {
      // Fall back to regex inspection below
    }
  }

  if (code === null) {
    const codeMatch = rawMessage.match(/\b(400|401|403|404|429|500|502|503|504)\b/);
    if (codeMatch) {
      code = Number(codeMatch[1]);
    }
  }

  if (!status) {
    const statusMatch = rawMessage.match(
      /\b(UNAVAILABLE|RESOURCE_EXHAUSTED|PERMISSION_DENIED|API_KEY_INVALID|NOT_FOUND|INTERNAL)\b/
    );
    if (statusMatch) {
      status = statusMatch[1];
    }
  }

  return { code, status, message };
}

export function isTransientAiError(err: unknown): boolean {
  const parsed = parseAiError(err);
  if (parsed.code !== null && [429, 500, 502, 503, 504].includes(parsed.code)) {
    return true;
  }
  if (
    parsed.status &&
    ['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'INTERNAL'].includes(parsed.status)
  ) {
    return true;
  }
  const lower = parsed.message.toLowerCase();
  return (
    lower.includes('high demand') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('try again later') ||
    lower.includes('econnreset') ||
    lower.includes('etimedout') ||
    lower.includes('fetch failed')
  );
}

export function formatAiErrorSpanish(err: unknown, operation = 'la solicitud de IA'): string {
  const parsed = parseAiError(err);
  const lowerMessage = parsed.message.toLowerCase();

  if (
    parsed.code === 503 ||
    parsed.status === 'UNAVAILABLE' ||
    parsed.message.toLowerCase().includes('high demand')
  ) {
    return `Gemini presenta alta demanda temporal (código 503). No se pudo completar ${operation}; inténtalo de nuevo en unos minutos.`;
  }

  if (parsed.code === 429 || parsed.status === 'RESOURCE_EXHAUSTED') {
    return `Se alcanzó temporalmente el límite o la cuota de Gemini API (código 429) al ejecutar ${operation}. Espera unos momentos antes de volver a intentarlo.`;
  }

  if (
    parsed.status === 'API_KEY_INVALID' ||
    lowerMessage.includes('api key not valid') ||
    lowerMessage.includes('api key invalid') ||
    lowerMessage.includes('invalid api key')
  ) {
    return `Google rechazó la clave de Gemini configurada en el servidor al ejecutar ${operation}. Genera una clave válida en Google AI Studio, reemplaza GEMINI_API_KEY en el archivo .env local y reinicia el servidor. No pegues la clave en el chat.`;
  }

  if (
    parsed.code === 400 ||
    parsed.code === 403 ||
    parsed.status === 'PERMISSION_DENIED' ||
    lowerMessage.includes('permission denied')
  ) {
    return `Gemini rechazó la solicitud por clave o permisos (código 400/403) al ejecutar ${operation}. Revisa que GEMINI_API_KEY sea válida y tenga acceso al modelo configurado.`;
  }

  if (parsed.code === 404 || parsed.status === 'NOT_FOUND') {
    return `El modelo de IA configurado no está disponible (código 404) al ejecutar ${operation}.`;
  }

  return `No se pudo completar ${operation} con Gemini: ${parsed.message}`;
}
