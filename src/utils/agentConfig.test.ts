import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAgentBaseUrl,
  isValidHttpUrl,
  extractUrlFromPrompt,
  validateAgentConfiguration,
  buildConfiguredAgentDocument,
  resolveGeminiModelId,
  derivePageTitleFromUrl,
  formatTimeHHMM,
  buildAgentWelcomeMessage,
  buildGeminiChatContents,
  buildAgentSystemInstruction,
  truncateAgentLabel,
  buildAgentMessageAnalytics,
  formatLocalDateKey,
  formatDisplayDateFromKey,
  sanitizeChatMessagesForStorage,
  deriveConversationTitle,
  buildChatConversationSession,
  filterChatConversations,
  restoreConversationMessages,
  buildInitialSeedConversations,
  ChatMessageItem,
} from './agentConfig.ts';

test('normalizeAgentBaseUrl prepends https:// when scheme is omitted', () => {
  assert.equal(normalizeAgentBaseUrl('nexuswebstudio.com'), 'https://nexuswebstudio.com');
  assert.equal(normalizeAgentBaseUrl('  https://app.example.com/v1  '), 'https://app.example.com/v1');
  assert.equal(normalizeAgentBaseUrl('HTTP://localhost:3000'), 'http://localhost:3000');
  assert.equal(normalizeAgentBaseUrl(''), '');
});

test('isValidHttpUrl validates HTTP/HTTPS URLs and rejects malformed ones', () => {
  assert.equal(isValidHttpUrl('https://nexuswebstudio.com'), true);
  assert.equal(isValidHttpUrl('http://localhost:3000/sistema'), true);
  assert.equal(isValidHttpUrl('example.org'), true);
  assert.equal(isValidHttpUrl('ftp://files.example.com'), false);
  assert.equal(isValidHttpUrl('not a valid url'), false);
  assert.equal(isValidHttpUrl(''), false);
});

test('extractUrlFromPrompt extracts and normalizes URLs embedded in chat messages', () => {
  assert.equal(
    extractUrlFromPrompt('Analiza esta página por favor: https://github.com/nexuswebstudio.'),
    'https://github.com/nexuswebstudio'
  );
  assert.equal(
    extractUrlFromPrompt('Revisa web.whatsapp.com y dime el estado'),
    'https://web.whatsapp.com'
  );
  assert.equal(extractUrlFromPrompt('Hola agente, dame un resumen'), undefined);
});

test('validateAgentConfiguration returns specific Spanish errors for invalid inputs', () => {
  const emptyResult = validateAgentConfiguration({
    name: '',
    trainedInstructions: '',
    baseUrl: '',
  });
  assert.equal(emptyResult.valid, false);
  assert.ok(emptyResult.errors.name);
  assert.ok(emptyResult.errors.trainedInstructions);
  assert.ok(emptyResult.errors.baseUrl);

  const invalidUrlResult = validateAgentConfiguration({
    name: 'Agente Ventas',
    trainedInstructions: 'Responder consultas comerciales con claridad y precisión.',
    baseUrl: 'ftp://invalido',
  });
  assert.equal(invalidUrlResult.valid, false);
  assert.equal(invalidUrlResult.errors.name, undefined);
  assert.equal(invalidUrlResult.errors.trainedInstructions, undefined);
  assert.ok(invalidUrlResult.errors.baseUrl);

  const validResult = validateAgentConfiguration({
    name: 'Agente Ventas',
    trainedInstructions: 'Responder consultas comerciales con claridad y precisión.',
    baseUrl: 'nexuswebstudio.com',
  });
  assert.equal(validResult.valid, true);
  assert.deepEqual(validResult.errors, {});
});

test('buildConfiguredAgentDocument produces normalized Firestore-ready document preserving existing metadata', () => {
  const doc = buildConfiguredAgentDocument(
    {
      name: '  Agente Soporte VIP  ',
      trainedInstructions: '  Actúa como especialista de soporte nivel 2 para Nexus Web Studio.  ',
      baseUrl: 'soporte.nexuswebstudio.com/panel',
      role: 'Soporte VIP',
      model: 'Gemini 3.8 Flash',
    },
    {
      id: 'agent_custom_1',
      existingAgent: {
        createdAt: '2026-01-15T10:00:00.000Z',
        whatsappStatus: 'connected',
        whatsappPhone: '+573043470984',
      },
      nowIso: '2026-03-01T12:00:00.000Z',
    }
  );

  assert.equal(doc.id, 'agent_custom_1');
  assert.equal(doc.name, 'Agente Soporte VIP');
  assert.equal(
    doc.trainedInstructions,
    'Actúa como especialista de soporte nivel 2 para Nexus Web Studio.'
  );
  assert.equal(doc.baseUrl, 'https://soporte.nexuswebstudio.com/panel');
  assert.equal(doc.createdAt, '2026-01-15T10:00:00.000Z');
  assert.equal(doc.updatedAt, '2026-03-01T12:00:00.000Z');
  assert.equal(doc.whatsappStatus, 'connected');
});

test('resolveGeminiModelId maps model labels to supported non-deprecated Gemini models', () => {
  assert.equal(resolveGeminiModelId('Gemini 3.8 Flash'), 'gemini-3.8-flash');
  assert.equal(resolveGeminiModelId('Gemini 3.1 Flash Lite'), 'gemini-3.1-flash-lite');
  assert.equal(resolveGeminiModelId(undefined), 'gemini-3.8-flash');
});

test('derivePageTitleFromUrl derives readable tab titles from URLs', () => {
  assert.equal(derivePageTitleFromUrl('https://web.whatsapp.com'), 'WhatsApp Web');
  assert.equal(derivePageTitleFromUrl('https://github.com/nexuswebstudio'), 'GitHub Repositorios');
  assert.equal(derivePageTitleFromUrl('nexuswebstudio.com/servicios'), 'nexuswebstudio.com');
  assert.equal(derivePageTitleFromUrl('http://localhost:3000/llms.txt'), 'localhost');
});

test('formatTimeHHMM formats hours and minutes cleanly with 2-digit padding', () => {
  const morning = new Date(2026, 2, 15, 9, 5, 42);
  const evening = new Date(2026, 2, 15, 21, 46, 0);
  assert.equal(formatTimeHHMM(morning), '09:05');
  assert.equal(formatTimeHHMM(evening), '21:46');
});

test('buildAgentWelcomeMessage includes agent identity, system prompt snippet, and normalized baseUrl', () => {
  const msg = buildAgentWelcomeMessage(
    {
      id: 'agent_1',
      name: 'Agente Arquitecto',
      role: 'Arquitectura Web',
      trainedInstructions: 'Evaluar seguridad, rendimiento y escalabilidad de aplicaciones React.',
      baseUrl: 'nexuswebstudio.com/servicios',
    },
    '14:15'
  );

  assert.equal(msg.id, 'welcome_agent_1');
  assert.equal(msg.sender, 'agent');
  assert.equal(msg.agentName, 'Agente Arquitecto');
  assert.equal(msg.timestamp, '14:15');
  assert.equal(msg.detectedUrl, 'https://nexuswebstudio.com/servicios');
  assert.match(msg.text, /Agente Arquitecto/);
  assert.match(msg.text, /https:\/\/nexuswebstudio\.com\/servicios/);
});

test('buildGeminiChatContents skips welcome messages and builds alternating user/model turns', () => {
  const history: ChatMessageItem[] = [
    {
      id: 'welcome_1',
      sender: 'agent',
      text: 'Hola, soy el agente',
      timestamp: '14:00',
    },
    {
      id: 'm1',
      sender: 'user',
      text: 'Mi sitio es nexuswebstudio.com',
      timestamp: '14:01',
    },
    {
      id: 'm2',
      sender: 'agent',
      text: 'Entendido, revisaré nexuswebstudio.com',
      timestamp: '14:01',
    },
  ];

  const contents = buildGeminiChatContents(history, '¿Qué sitio te acabo de indicar?');
  assert.equal(contents.length, 3);
  assert.equal(contents[0].role, 'user');
  assert.equal(contents[0].parts[0].text, 'Mi sitio es nexuswebstudio.com');
  assert.equal(contents[1].role, 'model');
  assert.equal(contents[2].role, 'user');
  assert.equal(contents[2].parts[0].text, '¿Qué sitio te acabo de indicar?');
});

test('buildAgentSystemInstruction combines system prompt, baseUrl, capabilities, and sessionContext', () => {
  const instruction = buildAgentSystemInstruction({
    agentName: 'Agente SEO',
    role: 'SEO Técnico',
    trainedInstructions: 'Auditar meta tags y JSON-LD.',
    baseUrl: 'nexuswebstudio.com',
    capabilities: ['JSON-LD', 'OpenGraph'],
    sessionContext: 'Enfoque en conversión B2B',
  });

  assert.match(instruction, /Agente SEO/);
  assert.match(instruction, /https:\/\/nexuswebstudio\.com/);
  assert.match(instruction, /Auditar meta tags y JSON-LD\./);
  assert.match(instruction, /JSON-LD, OpenGraph/);
  assert.match(instruction, /Enfoque en conversión B2B/);
});

test('truncateAgentLabel truncates long names cleanly while preserving short names', () => {
  assert.equal(truncateAgentLabel('CEO Agent', 18), 'CEO Agent');
  assert.equal(
    truncateAgentLabel('Presidente de la Junta Directiva', 18),
    'Presidente de la…'
  );
  assert.equal(truncateAgentLabel('', 18), 'Agente');
});

test('buildAgentMessageAnalytics aggregates exchanged messages per agent, filters active, and handles empty lists', () => {
  const agents = [
    {
      id: 'ag_1',
      name: 'Nexus Code Architect Agent',
      role: 'Arquitectura Web',
      messagesCount: 6,
    },
    {
      id: 'ag_2',
      name: 'Nexus SEO & Content Agent',
      role: 'SEO Técnico',
      messagesCount: 0,
    },
    {
      id: 'ag_3',
      name: 'Presidente de la Junta Directiva',
      role: 'Gobernanza',
      messagesCount: 14,
    },
  ];

  const fullResult = buildAgentMessageAnalytics(agents, 'ag_1', false);
  assert.equal(fullResult.chartData.length, 3);
  assert.equal(fullResult.chartData[0].messages, 6);
  assert.equal(fullResult.chartData[0].isSelected, true);
  assert.equal(fullResult.chartData[1].messages, 0);
  assert.equal(fullResult.chartData[2].shortName, 'Presidente de la…');
  assert.equal(fullResult.summary.totalMessages, 20);
  assert.equal(fullResult.summary.activeAgentsCount, 2);
  assert.equal(fullResult.summary.totalAgentsCount, 3);
  assert.equal(fullResult.summary.topAgentName, 'Presidente de la Junta Directiva');
  assert.equal(fullResult.summary.topAgentMessages, 14);

  const activeOnlyResult = buildAgentMessageAnalytics(agents, 'ag_2', true);
  assert.equal(activeOnlyResult.chartData.length, 2);
  assert.deepEqual(
    activeOnlyResult.chartData.map((d) => d.id),
    ['ag_1', 'ag_3']
  );

  const emptyResult = buildAgentMessageAnalytics([], undefined, false);
  assert.equal(emptyResult.chartData.length, 0);
  assert.equal(emptyResult.summary.totalMessages, 0);
  assert.equal(emptyResult.summary.topAgentName, null);
});

test('formatLocalDateKey and formatDisplayDateFromKey format calendar dates without timezone drift', () => {
  assert.equal(formatLocalDateKey('2026-11-05'), '2026-11-05');
  assert.equal(formatLocalDateKey(new Date(2026, 10, 5, 23, 59, 0)), '2026-11-05');
  assert.equal(formatDisplayDateFromKey('2026-11-05'), '05/11/2026');
});

test('buildChatConversationSession strips welcome banner, removes undefined keys, and preserves full chat context', () => {
  const fixedNow = new Date(2026, 10, 5, 14, 30, 0);
  const rawMessages: ChatMessageItem[] = [
    buildAgentWelcomeMessage({
      id: 'agent_architect',
      name: 'Nexus Code Architect Agent',
      baseUrl: 'nexuswebstudio.com',
      trainedInstructions: 'Revisar hooks',
    }),
    {
      id: 'u_1',
      sender: 'user',
      text: '  Auditar   componentes   en https://nexuswebstudio.com  ',
      timestamp: '14:29',
      detectedUrl: 'https://nexuswebstudio.com',
    },
    {
      id: 'a_1',
      sender: 'agent',
      agentName: 'Nexus Code Architect Agent',
      text: 'Auditoría lista.',
      timestamp: '14:30',
      detectedUrl: undefined,
    },
  ];

  const sanitized = sanitizeChatMessagesForStorage(rawMessages);
  assert.equal(sanitized.length, 2);
  assert.equal('detectedUrl' in sanitized[1], false);

  const session = buildChatConversationSession({
    id: 'conv_100',
    agent: {
      id: 'agent_architect',
      name: 'Nexus Code Architect Agent',
      role: 'Arquitectura Web',
      baseUrl: 'nexuswebstudio.com',
      trainedInstructions: 'Revisar hooks',
    },
    messages: rawMessages,
    sessionContext: 'Enfoque en React 19',
    includeBaseUrlContext: true,
    includeCapabilitiesContext: false,
    now: fixedNow,
  });

  assert.equal(session.id, 'conv_100');
  assert.equal(session.dateKey, '2026-11-05');
  assert.equal(session.messageCount, 2);
  assert.equal(session.baseUrl, 'https://nexuswebstudio.com');
  assert.equal(session.sessionContext, 'Enfoque en React 19');
  assert.equal(session.includeBaseUrlContext, true);
  assert.equal(session.includeCapabilitiesContext, false);
  assert.equal(session.trainedInstructionsSnapshot, 'Revisar hooks');
  assert.match(session.title, /^Auditar componentes en/);
  assert.equal(deriveConversationTitle([], 'CEO Agent'), 'Conversación con CEO Agent');
});

test('filterChatConversations filters accurately by agent, date, keyword, and preserves newest-first order', () => {
  const fixedNow = new Date(2026, 10, 5, 14, 0, 0);
  const seeds = buildInitialSeedConversations(fixedNow);
  assert.equal(seeds.length, 3);

  const byAgent = filterChatConversations(seeds, { agentId: 'agent_qa' });
  assert.equal(byAgent.length, 1);
  assert.equal(byAgent[0].id, 'conv_seed_qa_1');

  const byToday = filterChatConversations(seeds, { dateKey: '2026-11-05' });
  assert.deepEqual(
    byToday.map((s) => s.id),
    ['conv_seed_architect_1', 'conv_seed_qa_1']
  );

  const byYesterday = filterChatConversations(seeds, { dateKey: '2026-11-04' });
  assert.deepEqual(
    byYesterday.map((s) => s.id),
    ['conv_seed_seo_1']
  );

  const combined = filterChatConversations(seeds, {
    agentId: 'agent_architect',
    dateKey: '2026-11-05',
    searchQuery: 'React 19',
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].id, 'conv_seed_architect_1');

  const noMatch = filterChatConversations(seeds, { dateKey: '2024-01-01' });
  assert.equal(noMatch.length, 0);

  const restored = restoreConversationMessages(seeds[0]);
  assert.equal(restored.length, 3);
  assert.ok(restored[0].id.startsWith('welcome_'));
  assert.equal(restored[1].id, 'u_seed_1');
});




