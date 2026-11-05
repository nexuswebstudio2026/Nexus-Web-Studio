export interface AiAgentConfigInput {
  name: string;
  trainedInstructions: string;
  baseUrl: string;
  role?: string;
  description?: string;
  customSkillName?: string;
  model?: string;
  icon?: string;
  capabilities?: string[] | string;
  executionInterval?: number;
  isAutonomous247?: boolean;
}

export interface AiAgentConfigValidationErrors {
  name?: string;
  trainedInstructions?: string;
  baseUrl?: string;
}

export interface AiAgentConfigValidationResult {
  valid: boolean;
  errors: AiAgentConfigValidationErrors;
}

export interface ConfiguredAiAgentDocument {
  id: string;
  name: string;
  role: string;
  description: string;
  customSkillName: string;
  trainedInstructions: string;
  baseUrl: string;
  model: string;
  icon: string;
  status: 'active' | 'idle' | 'busy' | 'autonomous';
  capabilities: string[];
  executionInterval: number;
  isAutonomous247: boolean;
  lastRunTimestamp?: string;
  messagesCount?: number;
  createdAt: string;
  updatedAt: string;
  whatsappStatus?: 'disconnected' | 'qr_ready' | 'connecting' | 'connected';
  whatsappPhone?: string;
  whatsappPairedAt?: string;
  whatsappSessionId?: string;
}

export function normalizeAgentBaseUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim().replace(/^["']+|["']+$/g, '');
  if (!trimmed) return '';

  const withoutTrailingPunct = trimmed.replace(/[.,;:!?)]+$/, '');
  if (!withoutTrailingPunct) return '';

  if (/^https?:\/\//i.test(withoutTrailingPunct)) {
    return withoutTrailingPunct.replace(/^https?:\/\//i, (scheme) => scheme.toLowerCase());
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(withoutTrailingPunct)) {
    return withoutTrailingPunct;
  }

  return `https://${withoutTrailingPunct}`;
}

export function isValidHttpUrl(rawUrl: string): boolean {
  const candidate = normalizeAgentBaseUrl(rawUrl);
  if (!candidate || /\s/.test(candidate)) return false;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname;
    if (!host) return false;

    if (host === 'localhost') return true;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;

    return (
      host.includes('.') &&
      !host.startsWith('.') &&
      !host.endsWith('.') &&
      !host.includes('..')
    );
  } catch {
    return false;
  }
}

export function extractUrlFromPrompt(text: string): string | undefined {
  if (!text || !text.trim()) return undefined;

  const explicitMatch = text.match(/https?:\/\/[^\s<>"'`]+/i);
  const rawCandidate = explicitMatch
    ? explicitMatch[0]
    : text.match(
        /(?:www\.|[a-zA-Z0-9-]+\.)+(?:com|org|net|io|co|app|dev|me|es|ai|gov|edu|info|biz|localhost)(?::\d+)?(?:\/[^\s<>"'`]*)?/i
      )?.[0];

  if (!rawCandidate) return undefined;

  const cleaned = rawCandidate.replace(/[.,;:!?)]+$/, '');
  const normalized = normalizeAgentBaseUrl(cleaned);
  return isValidHttpUrl(normalized) ? normalized : undefined;
}

export function validateAgentConfiguration(
  input: AiAgentConfigInput
): AiAgentConfigValidationResult {
  const errors: AiAgentConfigValidationErrors = {};

  const trimmedName = (input.name || '').trim();
  const trimmedPrompt = (input.trainedInstructions || '').trim();
  const trimmedUrl = (input.baseUrl || '').trim();

  if (!trimmedName) {
    errors.name = 'El nombre del agente es obligatorio.';
  } else if (trimmedName.length < 2) {
    errors.name = 'El nombre del agente debe tener al menos 2 caracteres.';
  }

  if (!trimmedPrompt) {
    errors.trainedInstructions = 'El sistema de prompts (instrucciones) es obligatorio.';
  } else if (trimmedPrompt.length < 5) {
    errors.trainedInstructions =
      'El sistema de prompts debe contener al menos 5 caracteres.';
  }

  if (!trimmedUrl) {
    errors.baseUrl =
      'La URL base del agente es obligatoria (ej: https://nexuswebstudio.com).';
  } else if (!isValidHttpUrl(trimmedUrl)) {
    errors.baseUrl =
      'Ingresa una URL base válida con protocolo http:// o https:// (ej: https://nexuswebstudio.com).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildConfiguredAgentDocument(
  input: AiAgentConfigInput,
  options?: {
    existingAgent?: Partial<ConfiguredAiAgentDocument>;
    id?: string;
    nowIso?: string;
  }
): ConfiguredAiAgentDocument {
  const validation = validateAgentConfiguration(input);
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors).join(' '));
  }

  const existing = options?.existingAgent;
  const nowIso = options?.nowIso || new Date().toISOString();
  const docId = options?.id || existing?.id || `agent_${Date.now()}`;
  const normalizedBaseUrl = normalizeAgentBaseUrl(input.baseUrl);
  const trimmedName = input.name.trim();
  const trimmedPrompt = input.trainedInstructions.trim();
  const isAutonomous = input.isAutonomous247 ?? existing?.isAutonomous247 ?? true;

  let resolvedCapabilities: string[] = [];
  if (Array.isArray(input.capabilities)) {
    resolvedCapabilities = input.capabilities.map((c) => c.trim()).filter(Boolean);
  } else if (typeof input.capabilities === 'string' && input.capabilities.trim()) {
    resolvedCapabilities = input.capabilities
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  } else if (existing?.capabilities && existing.capabilities.length > 0) {
    resolvedCapabilities = existing.capabilities;
  }

  if (resolvedCapabilities.length === 0) {
    resolvedCapabilities = ['System Prompt Personalizado', 'Navegación URL Base'];
  }

  const doc: ConfiguredAiAgentDocument = {
    id: docId,
    name: trimmedName,
    role: (input.role ?? existing?.role ?? '').trim() || 'Agente Especialista IA',
    description:
      (input.description ?? existing?.description ?? '').trim() ||
      `Agente IA configurado con URL base ${normalizedBaseUrl}.`,
    customSkillName:
      (input.customSkillName ?? existing?.customSkillName ?? '').trim() ||
      `Prompt: ${trimmedName}`,
    trainedInstructions: trimmedPrompt,
    baseUrl: normalizedBaseUrl,
    model: (input.model ?? existing?.model ?? '').trim() || 'Gemini 3.8 Flash',
    icon: (input.icon ?? existing?.icon ?? '').trim() || 'Bot',
    status: isAutonomous ? 'autonomous' : 'active',
    capabilities: resolvedCapabilities,
    executionInterval:
      Number(input.executionInterval ?? existing?.executionInterval ?? 30) || 30,
    isAutonomous247: Boolean(isAutonomous),
    messagesCount:
      typeof existing?.messagesCount === 'number' && Number.isFinite(existing.messagesCount)
        ? Math.max(0, Math.floor(existing.messagesCount))
        : 0,
    createdAt: existing?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  if (existing?.lastRunTimestamp) {
    doc.lastRunTimestamp = existing.lastRunTimestamp;
  }
  if (existing?.whatsappStatus) {
    doc.whatsappStatus = existing.whatsappStatus;
  }
  if (existing?.whatsappPhone) {
    doc.whatsappPhone = existing.whatsappPhone;
  }
  if (existing?.whatsappPairedAt) {
    doc.whatsappPairedAt = existing.whatsappPairedAt;
  }
  if (existing?.whatsappSessionId) {
    doc.whatsappSessionId = existing.whatsappSessionId;
  }

  return doc;
}

export function resolveGeminiModelId(selectedModel?: string): string {
  const normalized = (selectedModel || '').toLowerCase();
  if (normalized.includes('lite')) return 'gemini-3.1-flash-lite';
  if (normalized.includes('latest')) return 'gemini-flash-latest';
  return 'gemini-3.8-flash';
}

export function derivePageTitleFromUrl(rawUrl: string): string {
  const formatted = normalizeAgentBaseUrl(rawUrl);
  if (!formatted) return 'Navegador Web';
  if (formatted.includes('whatsapp.com')) return 'WhatsApp Web';
  if (formatted.includes('github.com')) return 'GitHub Repositorios';
  if (formatted.includes('facebook.com')) return 'Facebook';
  if (formatted.includes('linkedin.com')) return 'LinkedIn';
  if (formatted.includes('x.com') || formatted.includes('twitter.com')) return 'X / Twitter';
  if (formatted.includes('instagram.com')) return 'Instagram';
  if (formatted.includes('google.com')) return 'Google Search';

  try {
    return new URL(formatted).hostname || 'Sitio Web';
  } catch {
    return 'Sitio Web';
  }
}

export function formatTimeHHMM(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'agent';
  agentName?: string;
  text: string;
  timestamp: string;
  detectedUrl?: string;
}

export interface GeminiContentTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export function buildAgentWelcomeMessage(
  agent: {
    id?: string;
    name: string;
    role?: string;
    trainedInstructions?: string;
    baseUrl?: string;
  },
  timestamp: string = formatTimeHHMM()
): ChatMessageItem {
  const cleanUrl = agent.baseUrl ? normalizeAgentBaseUrl(agent.baseUrl) : '';
  const promptPreview = (agent.trainedInstructions || '').trim();
  const promptSnippet =
    promptPreview.length > 140 ? `${promptPreview.slice(0, 140)}...` : promptPreview;

  const lines = [
    `Hola, soy **${agent.name}**${agent.role ? ` (${agent.role})` : ''}.`,
    promptSnippet
      ? `Opero bajo mi prompt del sistema: "${promptSnippet}"`
      : 'Estoy listo para asistirte según mi configuración.',
  ];

  if (cleanUrl) {
    lines.push(`Contexto web configurado: ${cleanUrl}`);
  }

  lines.push('Escríbeme tu consulta o envíame una URL para analizarla y abrirla en el navegador.');

  return {
    id: `welcome_${agent.id || 'default'}`,
    sender: 'agent',
    agentName: agent.name,
    text: lines.join('\n\n'),
    timestamp,
    detectedUrl: cleanUrl || undefined,
  };
}

export function buildGeminiChatContents(
  history: ChatMessageItem[],
  newUserPrompt: string,
  maxHistoryMessages: number = 12
): GeminiContentTurn[] {
  const trimmedPrompt = (newUserPrompt || '').trim();
  const nonWelcomeHistory = history.filter((m) => !m.id.startsWith('welcome_'));
  const recent = nonWelcomeHistory.slice(-maxHistoryMessages);

  const turns: GeminiContentTurn[] = [];
  for (const msg of recent) {
    const cleanText = (msg.text || '').trim();
    if (!cleanText) continue;
    const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';

    // Gemini multi-turn contents must start with 'user'
    if (turns.length === 0 && role !== 'user') {
      continue;
    }

    const prev = turns[turns.length - 1];
    if (prev && prev.role === role) {
      prev.parts.push({ text: cleanText });
    } else {
      turns.push({ role, parts: [{ text: cleanText }] });
    }
  }

  if (trimmedPrompt) {
    const prev = turns[turns.length - 1];
    if (prev && prev.role === 'user') {
      prev.parts.push({ text: trimmedPrompt });
    } else {
      turns.push({ role: 'user', parts: [{ text: trimmedPrompt }] });
    }
  }

  return turns;
}

export function buildAgentSystemInstruction(params: {
  agentName?: string;
  role?: string;
  customSkillName?: string;
  description?: string;
  trainedInstructions?: string;
  baseUrl?: string;
  capabilities?: string[];
  sessionContext?: string;
}): string {
  const name = (params.agentName || 'Agente IA Nexus').trim();
  const role = (params.role || 'Especialista IA').trim();
  const skill = (params.customSkillName || '').trim();
  const description = (params.description || '').trim();
  const instructions = (params.trainedInstructions || 'Responder con precisión técnica.').trim();
  const cleanUrl = params.baseUrl ? normalizeAgentBaseUrl(params.baseUrl) : '';
  const caps = Array.isArray(params.capabilities)
    ? params.capabilities.map((c) => c.trim()).filter(Boolean)
    : [];
  const extraContext = (params.sessionContext || '').trim();

  const sections: string[] = [
    `Eres ${name}, un agente de IA especializado en "${role}"${skill ? ` con la habilidad "${skill}"` : ''}.`,
  ];

  if (description) {
    sections.push(`Descripción del agente: ${description}`);
  }
  if (cleanUrl) {
    sections.push(`URL base configurada para este agente: ${cleanUrl}`);
  }
  if (caps.length > 0) {
    sections.push(`Capacidades clave: ${caps.join(', ')}`);
  }

  sections.push(`Instrucciones del sistema (System Prompt):\n${instructions}`);

  if (extraContext) {
    sections.push(`Contexto adicional proporcionado por el usuario para esta sesión:\n${extraContext}`);
  }

  sections.push(
    'Mantén coherencia con los mensajes previos de la conversación y responde directamente en idioma español aplicando tus instrucciones del sistema y configuración de contexto.'
  );

  return sections.join('\n\n');
}

export interface AgentMessageMetric {
  id: string;
  name: string;
  shortName: string;
  role: string;
  messages: number;
  isSelected: boolean;
}

export interface AgentAnalyticsSummary {
  totalMessages: number;
  activeAgentsCount: number;
  totalAgentsCount: number;
  topAgentName: string | null;
  topAgentMessages: number;
}

export interface AgentMessageAnalyticsResult {
  chartData: AgentMessageMetric[];
  summary: AgentAnalyticsSummary;
}

export function truncateAgentLabel(name: string, maxLength: number = 18): string {
  const clean = (name || '').trim();
  if (!clean) return 'Agente';
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(3, maxLength - 1)).trimEnd()}…`;
}

export function buildAgentMessageAnalytics(
  agents: Array<{
    id: string;
    name: string;
    role?: string;
    messagesCount?: number;
  }>,
  selectedAgentId?: string,
  onlyWithMessages: boolean = false
): AgentMessageAnalyticsResult {
  const normalizedItems: AgentMessageMetric[] = (agents || []).map((ag) => {
    const rawCount = Number(ag.messagesCount);
    const messages =
      Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 0;
    const fullName = (ag.name || '').trim() || 'Agente IA';

    return {
      id: ag.id,
      name: fullName,
      shortName: truncateAgentLabel(fullName, 18),
      role: (ag.role || '').trim() || 'Agente Especialista IA',
      messages,
      isSelected: Boolean(selectedAgentId && ag.id === selectedAgentId),
    };
  });

  const totalMessages = normalizedItems.reduce((sum, item) => sum + item.messages, 0);
  const activeItems = normalizedItems.filter((item) => item.messages > 0);
  const activeAgentsCount = activeItems.length;

  let topAgentName: string | null = null;
  let topAgentMessages = 0;
  for (const item of activeItems) {
    if (item.messages > topAgentMessages) {
      topAgentMessages = item.messages;
      topAgentName = item.name;
    }
  }

  const chartData = onlyWithMessages ? activeItems : normalizedItems;

  return {
    chartData,
    summary: {
      totalMessages,
      activeAgentsCount,
      totalAgentsCount: normalizedItems.length,
      topAgentName,
      topAgentMessages,
    },
  };
}

export interface ChatConversationSession {
  id: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  title: string;
  messages: ChatMessageItem[];
  sessionContext: string;
  includeBaseUrlContext: boolean;
  includeCapabilitiesContext: boolean;
  baseUrl: string;
  trainedInstructionsSnapshot: string;
  dateKey: string; // YYYY-MM-DD in local calendar time
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messageCount: number;
}

export interface ChatHistoryFilterCriteria {
  agentId?: string;
  dateKey?: string;
  searchQuery?: string;
}

export function formatLocalDateKey(input: Date | string = new Date()): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }

  const d = input instanceof Date ? input : new Date(input);
  const resolved = Number.isNaN(d.getTime()) ? new Date() : d;
  const year = resolved.getFullYear();
  const month = String(resolved.getMonth() + 1).padStart(2, '0');
  const day = String(resolved.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDateFromKey(dateKey: string): string {
  const clean = (dateKey || '').trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return clean || '--/--/----';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function sanitizeChatMessagesForStorage(
  messages: ChatMessageItem[]
): ChatMessageItem[] {
  return (messages || [])
    .filter((msg) => msg && !String(msg.id || '').startsWith('welcome_'))
    .map((msg) => {
      const cleanItem: ChatMessageItem = {
        id: String(msg.id || `msg_${Date.now()}`),
        sender: msg.sender === 'user' ? 'user' : 'agent',
        text: String(msg.text || ''),
        timestamp: String(msg.timestamp || '00:00'),
      };
      if (msg.agentName) {
        cleanItem.agentName = msg.agentName;
      }
      if (msg.detectedUrl) {
        cleanItem.detectedUrl = msg.detectedUrl;
      }
      return cleanItem;
    });
}

export function deriveConversationTitle(
  messages: ChatMessageItem[],
  fallbackAgentName?: string
): string {
  const nonWelcome = (messages || []).filter(
    (m) => m && !String(m.id || '').startsWith('welcome_') && (m.text || '').trim()
  );
  const firstUser = nonWelcome.find((m) => m.sender === 'user') || nonWelcome[0];
  if (!firstUser) {
    return `Conversación con ${(fallbackAgentName || 'Agente IA').trim()}`;
  }
  const singleLine = firstUser.text.trim().replace(/\s+/g, ' ');
  if (singleLine.length <= 64) return singleLine;
  return `${singleLine.slice(0, 63).trimEnd()}…`;
}

export function buildChatConversationSession(params: {
  id: string;
  agent: {
    id: string;
    name: string;
    role?: string;
    baseUrl?: string;
    trainedInstructions?: string;
  };
  messages: ChatMessageItem[];
  sessionContext?: string;
  includeBaseUrlContext?: boolean;
  includeCapabilitiesContext?: boolean;
  existingCreatedAt?: string;
  now?: Date;
}): ChatConversationSession {
  const now = params.now || new Date();
  const nowIso = now.toISOString();
  const cleanMessages = sanitizeChatMessagesForStorage(params.messages);
  const cleanBaseUrl = params.agent.baseUrl
    ? normalizeAgentBaseUrl(params.agent.baseUrl)
    : '';

  return {
    id: params.id,
    agentId: params.agent.id,
    agentName: (params.agent.name || '').trim() || 'Agente IA',
    agentRole: (params.agent.role || '').trim() || 'Especialista IA',
    title: deriveConversationTitle(cleanMessages, params.agent.name),
    messages: cleanMessages,
    sessionContext: (params.sessionContext || '').trim(),
    includeBaseUrlContext: params.includeBaseUrlContext ?? true,
    includeCapabilitiesContext: params.includeCapabilitiesContext ?? true,
    baseUrl: cleanBaseUrl,
    trainedInstructionsSnapshot: (params.agent.trainedInstructions || '').trim(),
    dateKey: formatLocalDateKey(now),
    createdAt: params.existingCreatedAt || nowIso,
    updatedAt: nowIso,
    messageCount: cleanMessages.length,
  };
}

export function filterChatConversations(
  sessions: ChatConversationSession[],
  filters: ChatHistoryFilterCriteria
): ChatConversationSession[] {
  const targetAgent = (filters.agentId || '').trim();
  const targetDate = (filters.dateKey || '').trim();
  const queryText = (filters.searchQuery || '').trim().toLowerCase();

  return [...(sessions || [])]
    .filter((session) => {
      if (targetAgent && targetAgent !== 'all' && session.agentId !== targetAgent) {
        return false;
      }
      if (targetDate && session.dateKey !== targetDate) {
        return false;
      }
      if (queryText) {
        const haystack = [
          session.title,
          session.agentName,
          session.agentRole,
          session.sessionContext,
          session.baseUrl,
          ...(session.messages || []).map((m) => m.text),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(queryText)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const timeCompare = (b.updatedAt || '').localeCompare(a.updatedAt || '');
      if (timeCompare !== 0) return timeCompare;
      return (b.id || '').localeCompare(a.id || '');
    });
}

export function restoreConversationMessages(
  session: ChatConversationSession,
  currentAgent?: {
    id?: string;
    name: string;
    role?: string;
    trainedInstructions?: string;
    baseUrl?: string;
  }
): ChatMessageItem[] {
  const resolvedAgent = currentAgent || {
    id: session.agentId,
    name: session.agentName,
    role: session.agentRole,
    trainedInstructions: session.trainedInstructionsSnapshot,
    baseUrl: session.baseUrl,
  };
  const welcome = buildAgentWelcomeMessage(resolvedAgent);
  return [welcome, ...(session.messages || [])];
}

export function buildInitialSeedConversations(
  now: Date = new Date()
): ChatConversationSession[] {
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 20, 0);
  const earlierTodayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 45, 0);
  const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 16, 15, 0);

  return [
    buildChatConversationSession({
      id: 'conv_seed_architect_1',
      agent: {
        id: 'agent_architect',
        name: 'Nexus Code Architect Agent',
        role: 'Arquitectura & Refactorización',
        baseUrl: 'https://github.com/nexuswebstudio/nexus-platform-v2',
        trainedInstructions:
          'Revisar la sintaxis de los componentes React, asegurar tipado estricto en TypeScript sin "any", optimizar hooks de React y mantener arquitectura modular limpia.',
      },
      messages: [
        {
          id: 'u_seed_1',
          sender: 'user',
          text: 'Audita la modularización de componentes y hooks en https://github.com/nexuswebstudio/nexus-platform-v2',
          timestamp: '11:18',
          detectedUrl: 'https://github.com/nexuswebstudio/nexus-platform-v2',
        },
        {
          id: 'a_seed_1',
          sender: 'agent',
          agentName: 'Nexus Code Architect Agent',
          text: 'Revisión completada sobre https://github.com/nexuswebstudio/nexus-platform-v2: se recomienda extraer utilidades puras en TypeScript estricto y memoizar selectores derivados con useMemo.',
          timestamp: '11:20',
          detectedUrl: 'https://github.com/nexuswebstudio/nexus-platform-v2',
        },
      ],
      sessionContext: 'Priorizar React 19, TypeScript estricto y cero renders innecesarios',
      includeBaseUrlContext: true,
      includeCapabilitiesContext: true,
      existingCreatedAt: todayDate.toISOString(),
      now: todayDate,
    }),
    buildChatConversationSession({
      id: 'conv_seed_qa_1',
      agent: {
        id: 'agent_qa',
        name: 'Nexus QA & Pentest Agent',
        role: 'Auditoría & Pruebas E2E',
        baseUrl: 'https://nexuswebstudio.com/auditoria-qa',
        trainedInstructions:
          'Verificar minuciosamente la configuración de Firestore Security Rules, comprobar que ningún endpoint exponga tokens sensibles y validar esquemas de datos.',
      },
      messages: [
        {
          id: 'u_seed_2',
          sender: 'user',
          text: 'Verifica las reglas de seguridad de Firestore y validación de formularios en auditoría QA',
          timestamp: '09:42',
        },
        {
          id: 'a_seed_2',
          sender: 'agent',
          agentName: 'Nexus QA & Pentest Agent',
          text: 'Auditoría completada en https://nexuswebstudio.com/auditoria-qa: valida los esquemas en firebase-blueprint.json y despliega reglas actualizadas con firestore.rules.',
          timestamp: '09:45',
          detectedUrl: 'https://nexuswebstudio.com/auditoria-qa',
        },
      ],
      sessionContext: 'Enfoque en validación de entradas y reglas de colección Firestore',
      includeBaseUrlContext: true,
      includeCapabilitiesContext: true,
      existingCreatedAt: earlierTodayDate.toISOString(),
      now: earlierTodayDate,
    }),
    buildChatConversationSession({
      id: 'conv_seed_seo_1',
      agent: {
        id: 'agent_seo',
        name: 'Nexus SEO & Content Agent',
        role: 'Optimización Orgánica & Meta',
        baseUrl: 'https://nexuswebstudio.com/seo-schema',
        trainedInstructions:
          'Generar metadatos OpenGraph, Schema.org de tipo Organization/WebSite y auditar el etiquetado semántico HTML de la plataforma.',
      },
      messages: [
        {
          id: 'u_seed_3',
          sender: 'user',
          text: 'Genera etiquetas OpenGraph y Schema.org JSON-LD para Nexus Web Studio',
          timestamp: '16:12',
        },
        {
          id: 'a_seed_3',
          sender: 'agent',
          agentName: 'Nexus SEO & Content Agent',
          text: 'Esquema JSON-LD Organization y tarjetas OpenGraph configuradas para https://nexuswebstudio.com/seo-schema con títulos y descripciones sincronizados.',
          timestamp: '16:15',
          detectedUrl: 'https://nexuswebstudio.com/seo-schema',
        },
      ],
      sessionContext: 'Optimizar conversión orgánica B2B en español',
      includeBaseUrlContext: true,
      includeCapabilitiesContext: false,
      existingCreatedAt: yesterdayDate.toISOString(),
      now: yesterdayDate,
    }),
  ];
}




