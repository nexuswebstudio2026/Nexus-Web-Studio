import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Code,
  ShieldCheck,
  FileText,
  MessageSquare,
  Cpu,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Zap,
  Plus,
  Play,
  Pause,
  Activity,
  Brain,
  Clock,
  Trash2,
  X,
  Sliders,
  Terminal,
  Radio,
  Layers,
  Globe,
  Laptop,
  Smartphone,
  Wifi,
  ArrowLeft,
  Copy,
  ExternalLink,
  QrCode,
  Power,
  Lock,
  Check,
  Crown,
  Briefcase,
  DollarSign,
  ClipboardList,
  Target,
  Award,
  TrendingUp,
  Building2,
  BarChart2,
  History,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { UserAccount } from '../../types';
import {
  setupFirebaseInboxWebhookListener,
  sendWhatsAppNotification,
  getAdminWhatsAppPhone,
  checkAndTriggerUrgentWhatsAppAlert,
  sendUrgentAlert,
} from '../../lib/webhookHandlers';
import { WebBrowserView } from '../WebBrowserView';
import { ChatHistoryPanel } from './ChatHistoryPanel';
import {
  AiAgentConfigValidationErrors,
  validateAgentConfiguration,
  buildConfiguredAgentDocument,
  extractUrlFromPrompt,
  normalizeAgentBaseUrl,
  formatTimeHHMM,
  ChatMessageItem,
  ChatConversationSession,
  buildAgentWelcomeMessage,
  buildAgentMessageAnalytics,
  buildChatConversationSession,
  restoreConversationMessages,
  buildInitialSeedConversations,
} from '../../utils/agentConfig';


interface AiAgentsModuleProps {
  currentUser: UserAccount;
}

export interface AiAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  customSkillName: string;
  trainedInstructions: string;
  baseUrl?: string;
  model: string;
  icon: string;
  status: 'active' | 'idle' | 'busy' | 'autonomous';
  capabilities: string[];
  executionInterval: number; // in seconds (e.g. 15, 30, 60, 300)
  isAutonomous247: boolean;
  lastRunTimestamp?: string;
  messagesCount?: number;
  createdAt?: string;
  updatedAt?: string;
  whatsappStatus?: 'disconnected' | 'qr_ready' | 'connecting' | 'connected';
  whatsappPhone?: string;
  whatsappPairedAt?: string;
  whatsappSessionId?: string;
}

export interface AiAgentLog {
  id: string;
  agentId: string;
  agentName: string;
  skillExecuted: string;
  outputSummary: string;
  status: 'completed' | 'executing' | 'warning';
  timestamp: string;
}

export interface WebhookEvent {
  id: string;
  eventType: 'project.created' | 'project.updated' | 'project.deleted';
  projectId: string;
  projectName: string;
  clientName: string;
  status: 'dispatched' | 'processed' | 'pending';
  triggeredAgentIds?: string[];
  summary: string;
  timestamp: string;
}

export const DEFAULT_INITIAL_AGENTS: AiAgent[] = [
  {
    id: 'agent_president',
    name: 'Presidente de la Junta Directiva',
    role: 'Presidente de la Junta Directiva',
    description: 'Especialista en visión estratégica corporativa, gobernanza de Nexus Web Studio, alianzas de alto nivel y toma de decisiones colegiadas.',
    customSkillName: 'Visión Estratégica & Directrices de Gobierno Corporativo',
    trainedInstructions:
      'Liderar la toma de decisiones directivas de Nexus Web Studio, evaluar riesgos globales, validar fusiones o alianzas corporativas y supervisar el cumplimiento de la visión empresarial.',
    baseUrl: 'https://nexuswebstudio.com/junta-directiva',
    model: 'Gemini 3.8 Flash',
    icon: 'Crown',
    status: 'autonomous',
    capabilities: ['Visión Estratégica', 'Gobernanza Corporativa', 'Decisiones de Junta', 'Alianzas Clave'],
    executionInterval: 30,
    isAutonomous247: true,
  },
  {
    id: 'agent_treasurer',
    name: 'Tesorero de la Junta Directiva',
    role: 'Tesorero de la Junta Directiva',
    description: 'Supervisa la salud financiera, flujo de caja, presupuestos anuales de software/infraestructura y rentabilidad de Nexus Web Studio.',
    customSkillName: 'Auditoría Financiera & Control de Presupuestos 24/7',
    trainedInstructions:
      'Auditar estados financieros, controlar presupuestos operativos y de desarrollo, proyectar flujo de caja y maximizar la rentabilidad de la empresa.',
    baseUrl: 'https://nexuswebstudio.com/finanzas',
    model: 'Gemini 3.8 Flash',
    icon: 'DollarSign',
    status: 'autonomous',
    capabilities: ['Control Financiero', 'Flujo de Caja', 'Auditoría de Gastos', 'Presupuesto I+D'],
    executionInterval: 30,
    isAutonomous247: true,
  },
  {
    id: 'agent_secretary',
    name: 'Secretaria de la Junta Directiva',
    role: 'Secretaria de la Junta Directiva',
    description: 'Gestiona actas de junta directiva, minutas de decisiones ejecutivas, seguimiento de acuerdos y cumplimiento normativo corporativo.',
    customSkillName: 'Redacción de Actas & Gobernanza de Acuerdos Ejecutivos',
    trainedInstructions:
      'Registrar minutas detalladas de sesiones de junta directiva, organizar el calendario de acuerdos, formalizar actas institucionales y garantizar compliance.',
    baseUrl: 'https://nexuswebstudio.com/actas',
    model: 'Gemini 3.8 Flash',
    icon: 'ClipboardList',
    status: 'autonomous',
    capabilities: ['Actas de Junta', 'Seguimiento de Acuerdos', 'Compliance & Estatutos', 'Documentación Ejecutiva'],
    executionInterval: 15,
    isAutonomous247: true,
  },
  {
    id: 'agent_ceo',
    name: 'CEO (Chief Executive Officer)',
    role: 'CEO - Director Ejecutivo General',
    description: 'Dirige la ejecución operativa general, estrategia de mercado, expansión del modelo de negocio y rendimiento de proyectos en Nexus Web Studio.',
    customSkillName: 'Dirección Ejecutiva & Coordinación General de Negocio',
    trainedInstructions:
      'Transformar la visión de la Junta Directiva en ejecución operativa real, supervisar metas comerciales de software y garantizar la máxima excelencia al cliente.',
    baseUrl: 'https://nexuswebstudio.com',
    model: 'Gemini 3.8 Flash',
    icon: 'Target',
    status: 'autonomous',
    capabilities: ['Dirección General', 'Cumplimiento de Metas', 'Liderazgo Operativo', 'Estrategia de Mercado'],
    executionInterval: 15,
    isAutonomous247: true,
  },
  {
    id: 'agent_architect',
    name: 'Nexus Code Architect Agent',
    role: 'Arquitectura & Refactorización',
    description: 'Especialista en React 19, TypeScript, Express y PostgreSQL. Revisa patrones de diseño y optimiza rendimiento.',
    customSkillName: 'Refactorización Limpia & Diagnóstico de Código',
    trainedInstructions:
      'Revisar la sintaxis de los componentes React, asegurar tipado estricto en TypeScript sin "any", optimizar hooks de React y mantener arquitectura modular limpia.',
    baseUrl: 'https://github.com/nexuswebstudio/nexus-platform-v2',
    model: 'Gemini 3.8 Flash',
    icon: 'Code',
    status: 'active',
    capabilities: ['Code Review', 'Estructura DB', 'Optimización Vite', 'Refactorización RBAC'],
    executionInterval: 15,
    isAutonomous247: true,
  },
  {
    id: 'agent_qa',
    name: 'Nexus QA & Pentest Agent',
    role: 'Auditoría & Pruebas E2E',
    description: 'Genera test suites para Playwright, audita Firestore Security Rules y detecta vulnerabilidades OWASP.',
    customSkillName: 'Auditoría Continua de Reglas de Seguridad',
    trainedInstructions:
      'Verificar minuciosamente la configuración de Firestore Security Rules, comprobar que ningún endpoint exponga tokens sensibles y validar esquemas de datos.',
    baseUrl: 'https://nexuswebstudio.com/auditoria-qa',
    model: 'Gemini 3.8 Flash',
    icon: 'ShieldCheck',
    status: 'autonomous',
    capabilities: ['Audit Rules', 'Pruebas E2E Playwright', 'Análisis OWASP', 'Linter de Sintaxis'],
    executionInterval: 30,
    isAutonomous247: true,
  },
  {
    id: 'agent_seo',
    name: 'Nexus SEO & Content Agent',
    role: 'Optimización Orgánica & Meta',
    description: 'Crea contenido optimizado, JSON-LD Schema.org, OpenGraph cards y sitemaps para buscadores.',
    customSkillName: 'Indexación Automática & Schema JSON-LD',
    trainedInstructions:
      'Generar metadatos OpenGraph, Schema.org de tipo Organization/WebSite y auditar el etiquetado semántico HTML de la plataforma.',
    baseUrl: 'https://nexuswebstudio.com/seo-schema',
    model: 'Gemini 3.8 Flash',
    icon: 'FileText',
    status: 'active',
    capabilities: ['JSON-LD Schema', 'OpenGraph Cards', 'Copywriting Técnico', 'Análisis Keywords'],
    executionInterval: 60,
    isAutonomous247: false,
  },
  {
    id: 'agent_support',
    name: 'Nexus Client Care Agent',
    role: 'Atención Automatizada Nivel 1',
    description: 'Redacta respuestas inteligentes a tickets de clientes, resúmenes de avances de Sprints y estados de facturas.',
    customSkillName: 'Monitoreo de Tickets & Respuestas SLA 24/7',
    trainedInstructions:
      'Escanear tickets de soporte pendientes, redactar respuestas profesionales en español y clasificar prioridades según acuerdos SLA.',
    baseUrl: 'https://web.whatsapp.com',
    model: 'Gemini 3.8 Flash',
    icon: 'MessageSquare',
    status: 'active',
    capabilities: ['Respuesta a Tickets', 'Resumen Sprints', 'Reportes de Cobro', 'SLA Tracking'],
    executionInterval: 45,
    isAutonomous247: true,
  },
];

export const AiAgentsModule: React.FC<AiAgentsModuleProps> = ({ currentUser }) => {
  const [agents, setAgents] = useState<AiAgent[]>(DEFAULT_INITIAL_AGENTS);
  const [logs, setLogs] = useState<AiAgentLog[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history' | 'agents' | 'browser' | 'training' | 'logs' | 'webhooks'>('chat');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_architect');
  const [browserStartUrl, setBrowserStartUrl] = useState<string>('https://github.com/nexuswebstudio/nexus-platform-v2');
  const [showInlineTraining, setShowInlineTraining] = useState<boolean>(false);
  const hasSeededRef = React.useRef<boolean>(false);
  const hasSeededHistoryRef = React.useRef<boolean>(false);
  const hasLoadedFirestoreRef = React.useRef<boolean>(false);
  const isConfigDirtyRef = React.useRef<boolean>(false);
  const syncedAgentIdRef = React.useRef<string>('');
  const [chatHistorySessions, setChatHistorySessions] = useState<ChatConversationSession[]>([]);
  const [activeConversationIdByAgent, setActiveConversationIdByAgent] = useState<Record<string, string>>({});
  const contextConfigByAgentRef = React.useRef<
    Record<
      string,
      {
        sessionContext: string;
        includeBaseUrlContext: boolean;
        includeCapabilitiesContext: boolean;
      }
    >
  >({});

  // Webhook Simulator State
  const [simulatedProjectName, setSimulatedProjectName] = useState('Plataforma FinTech Latam');
  const [simulatedClientName, setSimulatedClientName] = useState('FinTech Latam S.A.');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Live Skill Testing Modal State
  const [isLiveTestModalOpen, setIsLiveTestModalOpen] = useState(false);
  const [liveTestAgent, setLiveTestAgent] = useState<AiAgent | null>(null);
  const [liveTestSkillName, setLiveTestSkillName] = useState('');
  const [liveTestInstructions, setLiveTestInstructions] = useState('');
  const [liveTestPrompt, setLiveTestPrompt] = useState('');
  const [liveTestOutput, setLiveTestOutput] = useState<string | null>(null);
  const [isLiveTesting, setIsLiveTesting] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification(null);
    }, 4500);
  };

  const openLiveTestModal = (agent: AiAgent, customSkillOverride?: string, customInstructionsOverride?: string) => {
    setLiveTestAgent(agent);
    const skillName = customSkillOverride || agent.customSkillName || 'Habilidad de Agente';
    const instructions = customInstructionsOverride || agent.trainedInstructions || '';
    setLiveTestSkillName(skillName);
    setLiveTestInstructions(instructions);
    setLiveTestPrompt(`Ejecutar la habilidad "${skillName}" y generar un análisis de estado.`);
    setLiveTestOutput(null);
    setIsLiveTestModalOpen(true);
  };

  // Agent Detail & WhatsApp Browser Preview Page State
  const [activeAgentDetail, setActiveAgentDetail] = useState<AiAgent | null>(null);
  const [browserUrl, setBrowserUrl] = useState<string>('');
  const [isPairingWhatsApp, setIsPairingWhatsApp] = useState(false);
  const [pairedPhoneNumber, setPairedPhoneNumber] = useState('+573043470984');
  const [customTestMessage, setCustomTestMessage] = useState('');
  const [whatsappChatLog, setWhatsappChatLog] = useState<{ sender: 'agent' | 'user' | 'system'; text: string; time: string }[]>([]);

  // Open Agent Detail View with Browser Preview
  const openAgentDetailView = (agent: AiAgent) => {
    setActiveAgentDetail(agent);
    setBrowserUrl(`https://web.whatsapp.com/session/agent_${agent.id}`);
    setWhatsappChatLog([
      {
        sender: 'system',
        text: `Sesión de WhatsApp del Agente "${agent.name}" iniciada.`,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      },
      {
        sender: 'agent',
        text: `Hola, soy ${agent.name}. Estoy vinculado 24/7 para enviar y responder mensajes en WhatsApp aplicando mi habilidad "${agent.customSkillName}".`,
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Connect / Pair WhatsApp Session for Agent
  const handlePairWhatsAppSession = async (agent: AiAgent) => {
    setIsPairingWhatsApp(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800)); // Simulate Web Socket handshake

      const updatedAgentData = {
        whatsappStatus: 'connected' as const,
        whatsappPhone: pairedPhoneNumber.trim() || '+573043470984',
        whatsappPairedAt: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
        whatsappSessionId: `wa_sess_${Date.now()}`,
      };

      // Save session status in Firestore
      try {
        await updateDoc(doc(db, 'ai_agents', agent.id), updatedAgentData);
      } catch (err) {
        console.warn('Firestore agent session update notice:', err);
      }

      // Update local state
      setActiveAgentDetail((prev) => (prev && prev.id === agent.id ? { ...prev, ...updatedAgentData } : prev));
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, ...updatedAgentData } : a)));

      showToast(`¡WhatsApp Web de "${agent.name}" vinculado exitosamente con el número ${updatedAgentData.whatsappPhone}!`, 'success');

      setWhatsappChatLog((prev) => [
        ...prev,
        {
          sender: 'system',
          text: `🟢 ¡Dispositivo vinculado! WhatsApp Web activo para ${updatedAgentData.whatsappPhone}.`,
          time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Error pairing WhatsApp session:', err);
      showToast('Error al vincular la sesión de WhatsApp Web.', 'error');
    } finally {
      setIsPairingWhatsApp(false);
    }
  };

  // Disconnect WhatsApp Session for Agent
  const handleDisconnectWhatsAppSession = async (agent: AiAgent) => {
    try {
      const updatedAgentData = {
        whatsappStatus: 'disconnected' as const,
        whatsappPhone: '',
        whatsappPairedAt: '',
        whatsappSessionId: '',
      };

      try {
        await updateDoc(doc(db, 'ai_agents', agent.id), updatedAgentData);
      } catch (err) {
        console.warn('Firestore disconnect notice:', err);
      }

      setActiveAgentDetail((prev) => (prev && prev.id === agent.id ? { ...prev, ...updatedAgentData } : prev));
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, ...updatedAgentData } : a)));

      showToast(`Sesión de WhatsApp Web de "${agent.name}" desconectada.`, 'info');
    } catch (err) {
      console.error('Error disconnecting WhatsApp session:', err);
    }
  };

  // Send Test Message from Paired Agent WhatsApp Web Session
  const handleSendTestWhatsAppMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAgentDetail || !customTestMessage.trim()) return;

    const msgText = customTestMessage.trim();
    const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    setWhatsappChatLog((prev) => [...prev, { sender: 'agent', text: msgText, time: timeStr }]);
    setCustomTestMessage('');

    showToast(`Mensaje despachado desde la sesión de WhatsApp de "${activeAgentDetail.name}"`, 'success');

    // Trigger Twilio/WhatsApp alert behind the scenes
    try {
      await sendUrgentAlert(`[Mensaje desde Agente ${activeAgentDetail.name} vía WhatsApp Web]: ${msgText}`);
    } catch (err) {
      console.warn('Dispatch notice:', err);
    }
  };

  // Dedicated Agent Configuration Form State (Nombre, Sistema de Prompts, URL Base -> Firestore ai_agents)
  const [configMode, setConfigMode] = useState<'edit' | 'create'>('edit');
  const [configForm, setConfigForm] = useState<{
    name: string;
    trainedInstructions: string;
    baseUrl: string;
    role: string;
    model: string;
  }>({
    name: '',
    trainedInstructions: '',
    baseUrl: '',
    role: '',
    model: 'Gemini 3.8 Flash',
  });
  const [configErrors, setConfigErrors] = useState<AiAgentConfigValidationErrors>({});
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveStatus, setConfigSaveStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [createModalErrors, setCreateModalErrors] = useState<AiAgentConfigValidationErrors>({});

  // New Agent Form State
  const [newAgent, setNewAgent] = useState<{
    name: string;
    role: string;
    description: string;
    customSkillName: string;
    trainedInstructions: string;
    baseUrl: string;
    model: string;
    icon: string;
    capabilities: string;
    executionInterval: number;
    isAutonomous247: boolean;
  }>({
    name: '',
    role: '',
    description: '',
    customSkillName: '',
    trainedInstructions: '',
    baseUrl: 'https://nexuswebstudio.com',
    model: 'Gemini 3.8 Flash',
    icon: 'Brain',
    capabilities: 'Monitoreo, Auditoría, Reporte',
    executionInterval: 30,
    isAutonomous247: true,
  });

  // Training Form State
  const [trainingData, setTrainingData] = useState<{
    customSkillName: string;
    trainedInstructions: string;
    baseUrl: string;
    executionInterval: number;
    model: string;
    isAutonomous247: boolean;
  }>({
    customSkillName: '',
    trainedInstructions: '',
    baseUrl: '',
    executionInterval: 30,
    model: 'Gemini 3.8 Flash',
    isAutonomous247: true,
  });

  // Interactive Multi-Turn Chat State (per-agent conversation history + context settings)
  const [promptInput, setPromptInput] = useState('');
  const [chatThreadsByAgent, setChatThreadsByAgent] = useState<Record<string, ChatMessageItem[]>>({});
  const [sessionContextNote, setSessionContextNote] = useState<string>('');
  const [includeBaseUrlContext, setIncludeBaseUrlContext] = useState<boolean>(true);
  const [includeCapabilitiesContext, setIncludeCapabilitiesContext] = useState<boolean>(true);
  const [showFullContextDrawer, setShowFullContextDrawer] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [master247Active, setMaster247Active] = useState(false);
  const chatFeedRef = React.useRef<HTMLDivElement | null>(null);

  // Automated Project Webhook Event Processor
  const handleProcessProjectWebhook = async (eventId: string, webhook: WebhookEvent) => {
    try {
      const timeFormatted = `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;
      const triggeredIds: string[] = [];

      // 1. Code Architect Agent reaction
      const architect = agents.find((a) => a.id === 'agent_architect') || agents[0];
      if (architect) {
        triggeredIds.push(architect.id);
        const actionDesc =
          webhook.eventType === 'project.created'
            ? `✨ [WEBHOOK AUTOMÁTICO]: Proyecto "${webhook.projectName}" creado. Agente ajustó arquitectura React/TypeScript, configuró microservicios Express y asignó estructura PostgreSQL.`
            : webhook.eventType === 'project.updated'
            ? `⚡ [WEBHOOK AUTOMÁTICO]: Proyecto "${webhook.projectName}" modificado. Agente re-evaluó planificación de dependencias y refactorización modular.`
            : `🗑️ [WEBHOOK AUTOMÁTICO]: Proyecto "${webhook.projectName}" eliminado. Agente archivó repositorio y liberó recursos de servidor.`;

        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: architect.id,
          agentName: architect.name,
          skillExecuted: `Ajuste Automático por Webhook de Proyecto (${webhook.eventType})`,
          outputSummary: actionDesc,
          status: 'completed',
          timestamp: timeFormatted,
        });

        // Automatically add development task to tasks collection
        if (webhook.eventType === 'project.created') {
          await addDoc(collection(db, 'tasks'), {
            id: `tsk_auto_${Date.now()}`,
            taskNumber: `DEV-${Math.floor(100 + Math.random() * 900)}`,
            title: `[IA Architect] Inicializar arquitectura y hooks de React para ${webhook.projectName}`,
            projectName: webhook.projectName,
            platform: 'web',
            assigneeName: architect.name,
            status: 'in_progress',
            priority: 'high',
            estimatedHours: 8,
            loggedHours: 1,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 2. QA & Pentest Agent reaction
      const qaAgent = agents.find((a) => a.id === 'agent_qa');
      if (qaAgent) {
        triggeredIds.push(qaAgent.id);
        const actionDesc =
          webhook.eventType === 'project.created'
            ? `🛡️ [WEBHOOK AUTOMÁTICO]: Generada suite de pruebas E2E para Playwright y auditoría de Firestore Security Rules en "${webhook.projectName}".`
            : `🛡️ [WEBHOOK AUTOMÁTICO]: Pruebas de regresión OWASP ejecutadas tras cambios en "${webhook.projectName}".`;

        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: qaAgent.id,
          agentName: qaAgent.name,
          skillExecuted: `Generación de Pruebas & Auditoría (${webhook.eventType})`,
          outputSummary: actionDesc,
          status: 'completed',
          timestamp: timeFormatted,
        });
      }

      // 3. Client Support Agent reaction
      const supportAgent = agents.find((a) => a.id === 'agent_support');
      if (supportAgent) {
        triggeredIds.push(supportAgent.id);
        const actionDesc = `💬 [WEBHOOK AUTOMÁTICO]: Configurada cola de atención SLA y bienvenida automatizada para el cliente "${webhook.clientName}" en "${webhook.projectName}".`;

        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: supportAgent.id,
          agentName: supportAgent.name,
          skillExecuted: `SLA & Cola de Soporte (${webhook.eventType})`,
          outputSummary: actionDesc,
          status: 'completed',
          timestamp: timeFormatted,
        });
      }

      // Mark webhook event as processed in Firestore
      await updateDoc(doc(db, 'webhook_events', eventId), {
        status: 'processed',
        triggeredAgentIds: triggeredIds,
      });

    } catch (err) {
      console.warn('Project webhook processing notice:', err);
    }
  };

  // Manual Webhook Simulator Function
  const handleSimulateProjectWebhook = async (type: 'project.created' | 'project.updated' | 'project.deleted') => {
    setIsSimulatingWebhook(true);
    try {
      const pName = simulatedProjectName.trim() || 'App Móvil iOS/Android';
      const cName = simulatedClientName.trim() || 'Cliente Corporativo';
      const eventId = `wh_sim_${Date.now()}`;

      const newWh: WebhookEvent = {
        id: eventId,
        eventType: type,
        projectId: `prj_${Date.now()}`,
        projectName: pName,
        clientName: cName,
        status: 'dispatched',
        triggeredAgentIds: [],
        summary:
          type === 'project.created'
            ? `✨ [WEBHOOK MANUAL SIMULADO] Creado proyecto "${pName}" para ${cName}.`
            : type === 'project.updated'
            ? `⚡ [WEBHOOK MANUAL SIMULADO] Actualizado avance del proyecto "${pName}".`
            : `🗑️ [WEBHOOK MANUAL SIMULADO] Eliminado proyecto "${pName}" de Firebase.`,
        timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
      };

      await setDoc(doc(db, 'webhook_events', eventId), newWh);
    } catch (err) {
      console.error('Error simulating webhook:', err);
      handleFirestoreError(err, OperationType.CREATE, 'webhook_events');
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  // Sync with Firestore
  useEffect(() => {
    const agentsRef = collection(db, 'ai_agents');
    const unsubscribeAgents = onSnapshot(
      agentsRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          hasSeededRef.current = true;
          const loadedAgents: AiAgent[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AiAgent, 'id'>),
          }));

          if (!hasLoadedFirestoreRef.current) {
            hasLoadedFirestoreRef.current = true;
            if (!isConfigDirtyRef.current) {
              syncedAgentIdRef.current = '';
            }
          }

          setAgents(loadedAgents);
        } else if (!hasSeededRef.current) {
          hasSeededRef.current = true;
          for (const ag of DEFAULT_INITIAL_AGENTS) {
            try {
              await setDoc(doc(db, 'ai_agents', ag.id), ag, { merge: true });
            } catch (err) {
              console.warn('Initial seed notice:', err);
            }
          }
          if (!isConfigDirtyRef.current) {
            syncedAgentIdRef.current = '';
          }
          setAgents(DEFAULT_INITIAL_AGENTS);
        }
      },
      (error) => {
        console.warn('Firestore agents sync error:', error);
        handleFirestoreError(error, OperationType.LIST, 'ai_agents');
      }
    );

    const logsRef = collection(db, 'ai_agent_logs');
    const logsQuery = query(logsRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeLogs = onSnapshot(
      logsQuery,
      (snapshot) => {
        const loadedLogs: AiAgentLog[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AiAgentLog, 'id'>),
        }));
        setLogs(loadedLogs);
      },
      (error) => {
        console.warn('Firestore logs sync error:', error);
        handleFirestoreError(error, OperationType.LIST, 'ai_agent_logs');
      }
    );

    const webhooksRef = collection(db, 'webhook_events');
    const webhooksQuery = query(webhooksRef, orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeWebhooks = onSnapshot(
      webhooksQuery,
      (snapshot) => {
        const loadedWebhooks: WebhookEvent[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WebhookEvent, 'id'>),
        }));
        setWebhookEvents(loadedWebhooks);

        // Auto-process unhandled dispatched webhooks
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as WebhookEvent;
          if (data.status === 'dispatched') {
            handleProcessProjectWebhook(docSnap.id, data);
          }
        });
      },
      (error) => {
        console.warn('Firestore webhooks sync notice:', error);
      }
    );

    const conversationsRef = collection(db, 'ai_agent_conversations');
    const conversationsQuery = query(
      conversationsRef,
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    const unsubscribeConversations = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          hasSeededHistoryRef.current = true;
          try {
            localStorage.setItem('nexus_chat_history_seeded_v1', '1');
          } catch {}
          const loadedSessions: ChatConversationSession[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ChatConversationSession, 'id'>),
          }));
          setChatHistorySessions(loadedSessions);
        } else {
          let alreadySeeded = hasSeededHistoryRef.current;
          try {
            if (localStorage.getItem('nexus_chat_history_seeded_v1') === '1') {
              alreadySeeded = true;
            }
          } catch {}

          if (!alreadySeeded) {
            hasSeededHistoryRef.current = true;
            try {
              localStorage.setItem('nexus_chat_history_seeded_v1', '1');
            } catch {}
            const initialSeeds = buildInitialSeedConversations();
            setChatHistorySessions(initialSeeds);
            for (const seed of initialSeeds) {
              try {
                await setDoc(doc(db, 'ai_agent_conversations', seed.id), seed, {
                  merge: true,
                });
              } catch (seedErr) {
                console.warn('Initial chat history seed notice:', seedErr);
              }
            }
          } else {
            setChatHistorySessions([]);
          }
        }
      },
      (error) => {
        console.warn('Firestore chat conversations sync error:', error);
        handleFirestoreError(error, OperationType.LIST, 'ai_agent_conversations');
      }
    );

    // Auto-listen for urgent Firebase Inbox contact messages to dispatch WhatsApp alert
    const unsubscribeInbox = setupFirebaseInboxWebhookListener((msg, result) => {
      console.log('Alerta WhatsApp 24/7 procesada por mensaje urgente de Firebase:', msg.name, result.statusText);
    });

    return () => {
      unsubscribeAgents();
      unsubscribeLogs();
      unsubscribeWebhooks();
      unsubscribeConversations();
      unsubscribeInbox();
    };
  }, []);


  const [inFlightMessagesByAgent, setInFlightMessagesByAgent] = useState<Record<string, number>>({});
  const [analyticsOnlyActive, setAnalyticsOnlyActive] = useState<boolean>(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const activeChatMessages: ChatMessageItem[] = React.useMemo(() => {
    if (!selectedAgent) return [];
    const existingThread = chatThreadsByAgent[selectedAgent.id];
    if (existingThread && existingThread.length > 0) {
      return existingThread;
    }
    return [buildAgentWelcomeMessage(selectedAgent)];
  }, [selectedAgent, chatThreadsByAgent]);

  const agentAnalytics = React.useMemo(() => {
    const mergedAgents = agents.map((ag) => ({
      id: ag.id,
      name: ag.name,
      role: ag.role,
      messagesCount: (ag.messagesCount || 0) + (inFlightMessagesByAgent[ag.id] || 0),
    }));
    return buildAgentMessageAnalytics(mergedAgents, selectedAgentId, analyticsOnlyActive);
  }, [agents, inFlightMessagesByAgent, selectedAgentId, analyticsOnlyActive]);

  // Auto-scroll chat feed when messages change
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [activeChatMessages.length, selectedAgentId]);

  const populateFormsFromAgent = (agent: AiAgent) => {
    const resolvedBaseUrl = agent.baseUrl || 'https://nexuswebstudio.com';
    setTrainingData({
      customSkillName: agent.customSkillName || '',
      trainedInstructions: agent.trainedInstructions || '',
      baseUrl: resolvedBaseUrl,
      executionInterval: agent.executionInterval || 30,
      model: agent.model || 'Gemini 3.8 Flash',
      isAutonomous247: agent.isAutonomous247 ?? true,
    });
    if (configMode === 'edit') {
      setConfigForm({
        name: agent.name || '',
        trainedInstructions: agent.trainedInstructions || '',
        baseUrl: resolvedBaseUrl,
        role: agent.role || 'Agente Especialista IA',
        model: agent.model || 'Gemini 3.8 Flash',
      });
      setConfigErrors({});
    }
    setBrowserStartUrl(normalizeAgentBaseUrl(resolvedBaseUrl));
  };

  // Auto-switch selected agent if deleted
  useEffect(() => {
    if (agents.length > 0 && !agents.some((a) => a.id === selectedAgentId)) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  // Sync forms when selectedAgentId changes or first Firestore snapshot arrives (without overwriting active typing)
  useEffect(() => {
    const matched = agents.find((a) => a.id === selectedAgentId) || agents[0];
    if (matched && !isConfigDirtyRef.current && syncedAgentIdRef.current !== matched.id) {
      syncedAgentIdRef.current = matched.id;
      populateFormsFromAgent(matched);
    }
  }, [selectedAgentId, agents]);

  const handleSelectAgent = (agentId: string) => {
    if (selectedAgentId && selectedAgentId !== agentId) {
      contextConfigByAgentRef.current[selectedAgentId] = {
        sessionContext: sessionContextNote,
        includeBaseUrlContext,
        includeCapabilitiesContext,
      };
    }

    syncedAgentIdRef.current = '';
    isConfigDirtyRef.current = false;
    setConfigMode('edit');
    setConfigSaveStatus(null);
    setSelectedAgentId(agentId);
    const matched = agents.find((a) => a.id === agentId);
    if (matched) {
      syncedAgentIdRef.current = matched.id;
      populateFormsFromAgent(matched);
    }

    if (selectedAgentId !== agentId) {
      const savedCtx = contextConfigByAgentRef.current[agentId];
      if (savedCtx) {
        setSessionContextNote(savedCtx.sessionContext);
        setIncludeBaseUrlContext(savedCtx.includeBaseUrlContext);
        setIncludeCapabilitiesContext(savedCtx.includeCapabilitiesContext);
      } else {
        setSessionContextNote('');
        setIncludeBaseUrlContext(true);
        setIncludeCapabilitiesContext(true);
      }
    }
  };

  const handleResumeConversation = (session: ChatConversationSession) => {
    const existingAgent = agents.find((a) => a.id === session.agentId);
    const targetAgentId = existingAgent ? existingAgent.id : session.agentId;

    if (!existingAgent) {
      const reconstructedAgent: AiAgent = {
        id: session.agentId,
        name: session.agentName,
        role: session.agentRole || 'Agente Especialista IA',
        description: `Agente restaurado desde historial (${session.title}).`,
        customSkillName: `Prompt: ${session.agentName}`,
        trainedInstructions:
          session.trainedInstructionsSnapshot ||
          'Responder aplicando el historial y contexto de la conversación.',
        baseUrl: session.baseUrl || 'https://nexuswebstudio.com',
        model: 'Gemini 3.8 Flash',
        icon: 'Bot',
        status: 'active',
        capabilities: ['Historial Restaurado', 'Contexto Continuo'],
        executionInterval: 30,
        isAutonomous247: false,
      };
      setAgents((prev) => [reconstructedAgent, ...prev]);
    }

    const resolvedAgentForWelcome = existingAgent || {
      id: session.agentId,
      name: session.agentName,
      role: session.agentRole,
      trainedInstructions: session.trainedInstructionsSnapshot,
      baseUrl: session.baseUrl,
    };

    const restoredMessages = restoreConversationMessages(
      session,
      resolvedAgentForWelcome
    );

    const restoredContext = {
      sessionContext: session.sessionContext || '',
      includeBaseUrlContext: session.includeBaseUrlContext ?? true,
      includeCapabilitiesContext: session.includeCapabilitiesContext ?? true,
    };
    contextConfigByAgentRef.current[targetAgentId] = restoredContext;

    syncedAgentIdRef.current = '';
    isConfigDirtyRef.current = false;
    setConfigMode('edit');
    setConfigSaveStatus(null);
    setSelectedAgentId(targetAgentId);

    setActiveConversationIdByAgent((prev) => ({
      ...prev,
      [targetAgentId]: session.id,
    }));

    setChatThreadsByAgent((prev) => ({
      ...prev,
      [targetAgentId]: restoredMessages,
    }));

    setSessionContextNote(restoredContext.sessionContext);
    setIncludeBaseUrlContext(restoredContext.includeBaseUrlContext);
    setIncludeCapabilitiesContext(restoredContext.includeCapabilitiesContext);
    if (restoredContext.sessionContext) {
      setShowFullContextDrawer(true);
    }

    if (existingAgent) {
      syncedAgentIdRef.current = existingAgent.id;
      populateFormsFromAgent(existingAgent);
    }

    if (session.baseUrl) {
      setBrowserStartUrl(normalizeAgentBaseUrl(session.baseUrl));
    }

    setActiveTab('chat');
    showToast(
      `Conversación "${session.title}" restaurada con su contexto completo.`,
      'success'
    );
  };

  const handleDeleteConversation = async (sessionId: string) => {
    setChatHistorySessions((prev) => prev.filter((s) => s.id !== sessionId));
    try {
      await deleteDoc(doc(db, 'ai_agent_conversations', sessionId));
      showToast('Conversación eliminada del historial.', 'info');
    } catch (err) {
      console.error('Error deleting chat conversation:', err);
      handleFirestoreError(err, OperationType.DELETE, `ai_agent_conversations/${sessionId}`);
    }
  };

  const handleSwitchConfigMode = (mode: 'edit' | 'create') => {
    setConfigMode(mode);
    setConfigErrors({});
    setConfigSaveStatus(null);
    isConfigDirtyRef.current = false;
    if (mode === 'create') {
      setConfigForm({
        name: '',
        trainedInstructions: '',
        baseUrl: 'https://nexuswebstudio.com',
        role: 'Agente Especialista IA',
        model: 'Gemini 3.8 Flash',
      });
    } else if (selectedAgent) {
      setConfigForm({
        name: selectedAgent.name || '',
        trainedInstructions: selectedAgent.trainedInstructions || '',
        baseUrl: selectedAgent.baseUrl || 'https://nexuswebstudio.com',
        role: selectedAgent.role || 'Agente Especialista IA',
        model: selectedAgent.model || 'Gemini 3.8 Flash',
      });
    }
  };

  // Save Agent Configuration (Nombre, Sistema de Prompts, URL Base) directly to Firestore `ai_agents`
  const handleSaveAgentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAgentConfiguration(configForm);
    if (!validation.valid) {
      setConfigErrors(validation.errors);
      setConfigSaveStatus({
        type: 'error',
        message: 'Por favor completa correctamente todos los campos requeridos.',
      });
      return;
    }

    setIsSavingConfig(true);
    setConfigErrors({});
    setConfigSaveStatus(null);

    const isEditingExisting = configMode === 'edit' && Boolean(selectedAgent);
    const targetId =
      isEditingExisting && selectedAgent ? selectedAgent.id : `agent_${Date.now()}`;

    const configuredDoc = buildConfiguredAgentDocument(configForm, {
      id: targetId,
      existingAgent: isEditingExisting ? selectedAgent : undefined,
    });

    try {
      await setDoc(doc(db, 'ai_agents', configuredDoc.id), configuredDoc, { merge: true });

      setAgents((prev) => {
        const exists = prev.some((a) => a.id === configuredDoc.id);
        if (exists) {
          return prev.map((a) => (a.id === configuredDoc.id ? configuredDoc : a));
        }
        return [configuredDoc, ...prev];
      });

      syncedAgentIdRef.current = configuredDoc.id;
      isConfigDirtyRef.current = false;
      setSelectedAgentId(configuredDoc.id);
      setConfigMode('edit');
      setConfigForm({
        name: configuredDoc.name,
        trainedInstructions: configuredDoc.trainedInstructions,
        baseUrl: configuredDoc.baseUrl,
        role: configuredDoc.role,
        model: configuredDoc.model,
      });
      setBrowserStartUrl(configuredDoc.baseUrl);
      setConfigSaveStatus({
        type: 'success',
        message: `Configuración guardada en Firestore bajo la colección ai_agents (ID: ${configuredDoc.id}).`,
      });
      showToast(
        `¡Configuración de "${configuredDoc.name}" guardada en Firestore (ai_agents)!`,
        'success'
      );

      try {
        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: configuredDoc.id,
          agentName: configuredDoc.name,
          skillExecuted: isEditingExisting
            ? 'Actualización de Configuración (Nombre, Prompt y URL Base)'
            : 'Registro de Nuevo Agente en ai_agents',
          outputSummary: `Agente: "${configuredDoc.name}" | URL Base: ${configuredDoc.baseUrl} | System Prompt configurado (${configuredDoc.trainedInstructions.length} caracteres).`,
          status: 'completed',
          timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
        });
      } catch (logErr) {
        console.warn('Config audit log notice:', logErr);
      }
    } catch (err) {
      console.error('Error saving agent configuration in Firestore:', err);
      setConfigSaveStatus({
        type: 'error',
        message: 'Error al guardar la configuración en Firestore.',
      });
      handleFirestoreError(err, OperationType.WRITE, `ai_agents/${configuredDoc.id}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // 24/7 Continuous Background Autonomous Execution Ticker
  useEffect(() => {
    if (!master247Active) return;

    const intervalId = setInterval(async () => {
      const activeAutonomousAgents = agents.filter((ag) => ag.isAutonomous247);
      if (activeAutonomousAgents.length === 0) return;

      // Randomly pick one autonomous agent to execute background task
      const randomAgent = activeAutonomousAgents[Math.floor(Math.random() * activeAutonomousAgents.length)];

      try {
        const response = await fetch('/api/gemini-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentName: randomAgent.name,
            role: randomAgent.role,
            customSkillName: randomAgent.customSkillName,
            trainedInstructions: randomAgent.trainedInstructions,
            baseUrl: randomAgent.baseUrl,
            model: randomAgent.model,
            prompt: `Ejecución automática 24/7 de la habilidad "${randomAgent.customSkillName}"`,
            isAutonomousRun: true,
          }),
        });

        const data = await response.json();
        const now = new Date();
        const timeFormatted = `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`;

        const newLogEntry: Omit<AiAgentLog, 'id'> = {
          agentId: randomAgent.id,
          agentName: randomAgent.name,
          skillExecuted: randomAgent.customSkillName,
          outputSummary: data.output || `Ejecución 24/7 completada con éxito.`,
          status: 'completed',
          timestamp: timeFormatted,
        };

        // Write to Firestore with fallback
        try {
          await addDoc(collection(db, 'ai_agent_logs'), newLogEntry);
          await setDoc(
            doc(db, 'ai_agents', randomAgent.id),
            {
              lastRunTimestamp: timeFormatted,
              status: 'autonomous',
            },
            { merge: true }
          );
        } catch (dbErr) {
          setLogs((prev) => [
            { id: `log_${Date.now()}`, ...newLogEntry },
            ...prev.slice(0, 49),
          ]);
          setAgents((prev) =>
            prev.map((ag) => (ag.id === randomAgent.id ? { ...ag, lastRunTimestamp: timeFormatted } : ag))
          );
        }
      } catch (err) {
        console.warn('24/7 Autonomous background tick executed with local state fallback.');
      }
    }, 12000);

    return () => clearInterval(intervalId);
  }, [agents, master247Active]);

  // Handle New Agent Creation
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAgentConfiguration({
      name: newAgent.name,
      trainedInstructions: newAgent.trainedInstructions,
      baseUrl: newAgent.baseUrl,
    });

    if (!validation.valid) {
      setCreateModalErrors(validation.errors);
      return;
    }

    setCreateModalErrors({});
    const newId = `agent_${Date.now()}`;
    const createdAgent: AiAgent = buildConfiguredAgentDocument(
      {
        name: newAgent.name,
        trainedInstructions: newAgent.trainedInstructions,
        baseUrl: newAgent.baseUrl,
        role: newAgent.role || 'Especialista en IA',
        description: newAgent.description || 'Agente de IA configurado y guardado en Firestore.',
        customSkillName: newAgent.customSkillName || newAgent.name,
        model: newAgent.model,
        icon: newAgent.icon,
        capabilities: newAgent.capabilities,
        executionInterval: newAgent.executionInterval,
        isAutonomous247: newAgent.isAutonomous247,
      },
      { id: newId }
    );

    try {
      await setDoc(doc(db, 'ai_agents', newId), createdAgent, { merge: true });

      setAgents((prev) => [createdAgent, ...prev]);

      // Add log
      try {
        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: newId,
          agentName: createdAgent.name,
          skillExecuted: `Creación y Configuración Inicial: ${createdAgent.customSkillName}`,
          outputSummary: `El agente "${createdAgent.name}" ha sido creado y guardado en la colección ai_agents con URL base ${createdAgent.baseUrl}.`,
          status: 'completed',
          timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
        });
      } catch (logErr) {
        console.warn('Create agent log notice:', logErr);
      }

      syncedAgentIdRef.current = newId;
      setSelectedAgentId(newId);
      setBrowserStartUrl(createdAgent.baseUrl || 'https://nexuswebstudio.com');
      setConfigForm({
        name: createdAgent.name,
        trainedInstructions: createdAgent.trainedInstructions,
        baseUrl: createdAgent.baseUrl || '',
        role: createdAgent.role,
        model: createdAgent.model,
      });
      setIsCreateModalOpen(false);
      showToast(`¡El agente "${createdAgent.name}" ha sido creado y guardado en Firebase (ai_agents)!`, 'success');
      setNewAgent({
        name: '',
        role: '',
        description: '',
        customSkillName: '',
        trainedInstructions: '',
        baseUrl: 'https://nexuswebstudio.com',
        model: 'Gemini 3.8 Flash',
        icon: 'Brain',
        capabilities: 'Monitoreo, Auditoría, Reporte',
        executionInterval: 30,
        isAutonomous247: true,
      });
    } catch (err) {
      console.error('Error saving agent to Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, `ai_agents/${newId}`);
    }
  };

  // Handle Training Save
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const normalizedUrl = normalizeAgentBaseUrl(
      trainingData.baseUrl || selectedAgent.baseUrl || 'https://nexuswebstudio.com'
    );

    const updatedPayload = {
      customSkillName: trainingData.customSkillName,
      trainedInstructions: trainingData.trainedInstructions,
      baseUrl: normalizedUrl,
      executionInterval: Number(trainingData.executionInterval),
      model: trainingData.model,
      isAutonomous247: trainingData.isAutonomous247,
      status: (trainingData.isAutonomous247 ? 'autonomous' : 'active') as AiAgent['status'],
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'ai_agents', selectedAgent.id), updatedPayload, { merge: true });

      setAgents((prev) =>
        prev.map((a) => (a.id === selectedAgent.id ? { ...a, ...updatedPayload } : a))
      );
      setBrowserStartUrl(normalizedUrl);
      if (configMode === 'edit') {
        setConfigForm((prev) => ({
          ...prev,
          trainedInstructions: trainingData.trainedInstructions,
          baseUrl: normalizedUrl,
          model: trainingData.model,
        }));
      }

      try {
        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          skillExecuted: `Re-Entrenamiento de Habilidad`,
          outputSummary: `Se actualizó el entrenamiento de "${trainingData.customSkillName}" (URL Base: ${normalizedUrl}).`,
          status: 'completed',
          timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
        });
      } catch (logErr) {
        console.warn('Training audit log notice:', logErr);
      }

      showToast(
        `¡Agente "${selectedAgent.name}" guardado y reentrenado con éxito en Firestore!`,
        'success'
      );
    } catch (err) {
      console.error('Error updating training in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `ai_agents/${selectedAgent.id}`);
    }
  };

  // Live Skill Interactive Test Execution Handler
  const handleRunLiveTestExecution = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!liveTestAgent || !liveTestPrompt.trim()) return;

    setIsLiveTesting(true);
    setLiveTestOutput(null);

    try {
      const response = await fetch('/api/gemini-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: liveTestAgent.name,
          role: liveTestAgent.role,
          customSkillName: liveTestSkillName,
          trainedInstructions: liveTestInstructions,
          prompt: liveTestPrompt.trim(),
          isAutonomousRun: false,
        }),
      });

      const data = await response.json();
      const outputText = data.output || 'Prueba de habilidad en vivo ejecutada correctamente sin observaciones.';
      setLiveTestOutput(outputText);

      const timeStr = `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;

      // Write execution log to Firestore
      try {
        await addDoc(collection(db, 'ai_agent_logs'), {
          agentId: liveTestAgent.id,
          agentName: liveTestAgent.name,
          skillExecuted: `Prueba en Vivo: ${liveTestSkillName}`,
          outputSummary: outputText,
          status: 'completed',
          timestamp: timeStr,
        });

        await updateDoc(doc(db, 'ai_agents', liveTestAgent.id), {
          lastRunTimestamp: timeStr,
        });
      } catch (logErr) {
        console.warn('Live test log save notice:', logErr);
      }

      showToast(`¡Habilidad de "${liveTestAgent.name}" probada en vivo con éxito!`, 'success');
    } catch (err) {
      console.error('Error executing live skill test:', err);
      setLiveTestOutput('Error de comunicación con el motor AI Gemini.');
      showToast('No se pudo ejecutar la prueba en vivo.', 'error');
    } finally {
      setIsLiveTesting(false);
    }
  };

  // Manual Trigger of Skill
  const handleRunSkillManual = async (agent: AiAgent) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/gemini-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.name,
          role: agent.role,
          customSkillName: agent.customSkillName,
          trainedInstructions: agent.trainedInstructions,
          prompt: `Ejecución manual iniciada por el usuario ${currentUser.name}`,
          isAutonomousRun: false,
        }),
      });

      const data = await response.json();
      const timeStr = `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`;

      await addDoc(collection(db, 'ai_agent_logs'), {
        agentId: agent.id,
        agentName: agent.name,
        skillExecuted: agent.customSkillName,
        outputSummary: data.output || 'Ejecución manual completada con éxito.',
        status: 'completed',
        timestamp: timeStr,
      });

      await updateDoc(doc(db, 'ai_agents', agent.id), {
        lastRunTimestamp: timeStr,
      });
    } catch (err) {
      console.error('Error executing manual skill:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Autonomous status for single agent
  const handleToggleAutonomous = async (agent: AiAgent) => {
    try {
      const updatedStatus = !agent.isAutonomous247;
      await updateDoc(doc(db, 'ai_agents', agent.id), {
        isAutonomous247: updatedStatus,
        status: updatedStatus ? 'autonomous' : 'active',
      });
    } catch (err) {
      console.error('Error toggling autonomous mode:', err);
      handleFirestoreError(err, OperationType.UPDATE, `ai_agents/${agent.id}`);
    }
  };

  // Delete Agent
  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este agente de IA y sus registros?')) return;
    try {
      await deleteDoc(doc(db, 'ai_agents', agentId));
      if (selectedAgentId === agentId) {
        const remaining = agents.filter((a) => a.id !== agentId);
        if (remaining.length > 0) setSelectedAgentId(remaining[0].id);
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
      handleFirestoreError(err, OperationType.DELETE, `ai_agents/${agentId}`);
    }
  };

  // Helper to extract URLs from text
  const extractUrlFromString = (text: string): string | undefined => {
    return extractUrlFromPrompt(text);
  };

  // Send Multi-Turn Chat Message using Selected Agent's System Prompt & Context Configuration
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !selectedAgent) return;

    const targetAgent = selectedAgent;
    const userText = promptInput.trim();
    const timeStr = formatTimeHHMM();
    const userDetectedUrl = extractUrlFromString(userText);
    const priorMessages = activeChatMessages;

    const currentConvId =
      activeConversationIdByAgent[targetAgent.id] || `conv_${Date.now()}`;
    if (!activeConversationIdByAgent[targetAgent.id]) {
      setActiveConversationIdByAgent((prev) => ({
        ...prev,
        [targetAgent.id]: currentConvId,
      }));
    }
    const existingConv = chatHistorySessions.find((s) => s.id === currentConvId);

    const userMsg: ChatMessageItem = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: timeStr,
      detectedUrl: userDetectedUrl,
    };

    setChatThreadsByAgent((prev) => ({
      ...prev,
      [targetAgent.id]: [...priorMessages, userMsg],
    }));

    setInFlightMessagesByAgent((prev) => ({
      ...prev,
      [targetAgent.id]: (prev[targetAgent.id] || 0) + 1,
    }));

    setPromptInput('');
    setIsProcessing(true);

    let completedThread: ChatMessageItem[] = [...priorMessages, userMsg];

    try {
      const effectiveBaseUrl = includeBaseUrlContext ? targetAgent.baseUrl : undefined;
      const effectiveCapabilities = includeCapabilitiesContext ? targetAgent.capabilities : [];

      const response = await fetch('/api/gemini-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: targetAgent.name,
          role: targetAgent.role,
          customSkillName: targetAgent.customSkillName,
          description: targetAgent.description,
          trainedInstructions: targetAgent.trainedInstructions,
          baseUrl: effectiveBaseUrl,
          capabilities: effectiveCapabilities,
          sessionContext: sessionContextNote.trim() || undefined,
          model: targetAgent.model,
          prompt: userText,
          history: priorMessages,
          isAutonomousRun: false,
        }),
      });

      const data = await response.json();
      const outputText =
        data.output ||
        `[${targetAgent.name}]: Respuesta generada aplicando la habilidad "${targetAgent.customSkillName}".`;
      const agentDetectedUrl =
        extractUrlFromString(outputText) || userDetectedUrl || effectiveBaseUrl;

      const replyTimeStr = formatTimeHHMM();
      const agentMsg: ChatMessageItem = {
        id: `agent_${Date.now() + 1}`,
        sender: 'agent',
        agentName: targetAgent.name,
        text: outputText,
        timestamp: replyTimeStr,
        detectedUrl: agentDetectedUrl,
      };

      completedThread = [...priorMessages, userMsg, agentMsg];
      setChatThreadsByAgent((prev) => ({
        ...prev,
        [targetAgent.id]: completedThread,
      }));
    } catch (err) {
      console.error('Error sending chat query:', err);
      const errorMsg: ChatMessageItem = {
        id: `agent_err_${Date.now() + 1}`,
        sender: 'agent',
        agentName: targetAgent.name,
        text: `[${targetAgent.name}]: Ocurrió un inconveniente al procesar la respuesta. Intenta nuevamente.`,
        timestamp: formatTimeHHMM(),
        detectedUrl: userDetectedUrl || targetAgent.baseUrl,
      };
      completedThread = [...priorMessages, userMsg, errorMsg];
      setChatThreadsByAgent((prev) => ({
        ...prev,
        [targetAgent.id]: completedThread,
      }));
    } finally {
      setIsProcessing(false);
      let nextMessagesCount = (targetAgent.messagesCount || 0) + 2;
      setAgents((prev) =>
        prev.map((ag) => {
          if (ag.id === targetAgent.id) {
            nextMessagesCount = (ag.messagesCount || 0) + 2;
            return { ...ag, messagesCount: nextMessagesCount };
          }
          return ag;
        })
      );
      setInFlightMessagesByAgent((prev) => ({
        ...prev,
        [targetAgent.id]: Math.max(0, (prev[targetAgent.id] || 0) - 1),
      }));

      const savedSession = buildChatConversationSession({
        id: currentConvId,
        agent: targetAgent,
        messages: completedThread,
        sessionContext: sessionContextNote,
        includeBaseUrlContext,
        includeCapabilitiesContext,
        existingCreatedAt: existingConv?.createdAt,
      });

      setChatHistorySessions((prev) => {
        const remaining = prev.filter((s) => s.id !== savedSession.id);
        return [savedSession, ...remaining];
      });

      try {
        await setDoc(
          doc(db, 'ai_agents', targetAgent.id),
          {
            messagesCount: nextMessagesCount,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('Firestore messagesCount update notice:', dbErr);
      }

      try {
        await setDoc(doc(db, 'ai_agent_conversations', savedSession.id), savedSession, {
          merge: true,
        });
      } catch (convErr) {
        console.warn('Firestore chat conversation save error:', convErr);
        handleFirestoreError(
          convErr,
          OperationType.WRITE,
          `ai_agent_conversations/${savedSession.id}`
        );
      }
    }
  };

  // Icon Helper Component
  const renderAgentIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'Crown':
        return <Crown className={className} />;
      case 'DollarSign':
        return <DollarSign className={className} />;
      case 'ClipboardList':
        return <ClipboardList className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Building2':
        return <Building2 className={className} />;
      case 'Code':
        return <Code className={className} />;
      case 'ShieldCheck':
        return <ShieldCheck className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'MessageSquare':
        return <MessageSquare className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      default:
        return <Brain className={className} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {activeAgentDetail ? (
        /* FULL AGENT DETAIL & WHATSAPP WEB VIRTUAL BROWSER PREVIEW PAGE */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Navigation Back Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveAgentDetail(null)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-colors flex items-center gap-2 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>Volver al Catálogo</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400">
                  {renderAgentIcon(activeAgentDetail.icon, 'w-6 h-6')}
                </div>
                <div>
                  <h2 className="text-base font-black text-white leading-tight flex items-center gap-2">
                    <span>{activeAgentDetail.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                        activeAgentDetail.whatsappStatus === 'connected'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {activeAgentDetail.whatsappStatus === 'connected'
                        ? '🟢 WhatsApp Web Conectado'
                        : '🟡 QR Pendiente de Escaneo'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Especialidad: <strong className="text-cyan-400">{activeAgentDetail.role}</strong> ({activeAgentDetail.model})
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openLiveTestModal(activeAgentDetail)}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-purple-950 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Probar Habilidad</span>
              </button>

              <button
                onClick={() => {
                  setSelectedAgentId(activeAgentDetail.id);
                  setActiveAgentDetail(null);
                  setActiveTab('training');
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-2xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Editar Entrenamiento</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Left Specs & WhatsApp Status - Right Virtual Browser Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Agent Specs & Pairing Instructions */}
            <div className="lg:col-span-4 space-y-5">
              {/* Agent Overview Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" /> Perfil del Agente de IA
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    ID: {activeAgentDetail.id}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{activeAgentDetail.description}</p>

                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-400 block font-mono">⚡ Habilidad Entrenada:</span>
                  <p className="text-xs text-white font-bold">{activeAgentDetail.customSkillName}</p>
                  <p className="text-xs text-slate-400 italic font-mono leading-relaxed max-h-32 overflow-y-auto">
                    "{activeAgentDetail.trainedInstructions}"
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeAgentDetail.capabilities.map((cap, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg border border-slate-800"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* WhatsApp Business Connection Status Card */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" /> Vincular WhatsApp del Negocio
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Protocolo Baileys Web
                  </span>
                </div>

                <div className="space-y-3">
                  {activeAgentDetail.whatsappStatus === 'connected' ? (
                    <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> WhatsApp Conectado 🟢
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">{activeAgentDetail.whatsappPairedAt}</span>
                      </div>
                      <p className="text-xs text-slate-200">
                        Número vinculado:{' '}
                        <strong className="text-white font-mono">{activeAgentDetail.whatsappPhone || '+573043470984'}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        El agente <strong className="text-white">{activeAgentDetail.name}</strong> está listo para recibir
                        mensajes y responder consultas automáticamente en WhatsApp.
                      </p>

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => handleDisconnectWhatsAppSession(activeAgentDetail)}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Desconectar Sesión</span>
                        </button>

                        <span className="text-[10px] font-mono text-emerald-400">Estado: Activo 24/7</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                        <QrCode className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Esperando Vinculación por Código QR</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Escanea el código QR que se visualiza en el navegador de la derecha usando la cámara de WhatsApp de tu
                        celular.
                      </p>

                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-slate-300 block">Número de Teléfono a Vincular:</label>
                        <input
                          type="text"
                          value={pairedPhoneNumber}
                          onChange={(e) => setPairedPhoneNumber(e.target.value)}
                          placeholder="+57 304 3470984"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <button
                        onClick={() => handlePairWhatsAppSession(activeAgentDetail)}
                        disabled={isPairingWhatsApp}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isPairingWhatsApp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Estableciendo Socket Baileys...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                            <span>Simular Escaneo QR / Confirmar Vinculación</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Browser Preview Frame (CODEX STYLE BROWSER) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[680px]">
              {/* Virtual Chrome Browser Header Toolbar */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>

                {/* Browser URL Input Bar */}
                <div className="flex-1 max-w-xl mx-auto flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-500 select-none">https://</span>
                  <input
                    type="text"
                    value={browserUrl.replace('https://', '')}
                    onChange={(e) => setBrowserUrl(`https://${e.target.value}`)}
                    className="w-full bg-transparent text-slate-200 focus:outline-none font-mono text-xs"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(browserUrl);
                      showToast('URL copiada al portapapeles', 'info');
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                    title="Copiar URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="hidden sm:inline text-slate-300">Navegador Activo</span>
                </div>
              </div>

              {/* Browser Content Viewport */}
              <div className="flex-1 bg-[#0b141a] overflow-y-auto p-6 flex flex-col justify-center items-center text-slate-100 font-sans relative">
                {activeAgentDetail.whatsappStatus === 'connected' ? (
                  /* WHATSAPP WEB ACTIVE CHAT SESSION INTERFACE */
                  <div className="w-full h-full flex flex-col justify-between space-y-4 max-w-2xl mx-auto bg-[#111b21] rounded-2xl border border-slate-800 p-4 shadow-2xl animate-in fade-in duration-200">
                    {/* Chat Session Top Bar */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-950 border border-emerald-700 rounded-xl text-emerald-400">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>WhatsApp Web - Sesión Agente IA</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          </h4>
                          <p className="text-[11px] text-emerald-400 font-mono">
                            Número Vinculado: {activeAgentDetail.whatsappPhone || '+573043470984'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          Modo 24/7 Automatizado
                        </span>
                      </div>
                    </div>

                    {/* Chat Log Feed */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-[#0b141a] rounded-xl border border-slate-800/60 font-sans max-h-[380px]">
                      {whatsappChatLog.map((log, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col ${
                            log.sender === 'user' ? 'items-end' : log.sender === 'agent' ? 'items-start' : 'items-center'
                          }`}
                        >
                          {log.sender === 'system' ? (
                            <span className="text-[10px] font-mono px-3 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800 my-1">
                              {log.text}
                            </span>
                          ) : (
                            <div
                              className={`max-w-lg p-3 rounded-2xl text-xs leading-relaxed ${
                                log.sender === 'user'
                                  ? 'bg-[#005c4b] text-white rounded-br-none shadow-md'
                                  : 'bg-[#202c33] text-slate-100 rounded-bl-none border border-slate-700/50 shadow-md'
                              }`}
                            >
                              <p>{log.text}</p>
                              <span className="text-[9px] text-slate-400 font-mono block text-right mt-1">{log.time}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Chat Bottom Message Form */}
                    <form onSubmit={handleSendTestWhatsAppMessage} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={customTestMessage}
                        onChange={(e) => setCustomTestMessage(e.target.value)}
                        placeholder={`Escribe un mensaje para enviar por WhatsApp desde ${activeAgentDetail.name}...`}
                        className="flex-1 bg-[#202c33] border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!customTestMessage.trim()}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar por WhatsApp</span>
                      </button>
                    </form>
                  </div>
                ) : (
                  /* WHATSAPP WEB UNPAIRED QR LANDING INTERFACE */
                  <div className="w-full max-w-2xl bg-[#111b21] rounded-3xl border border-slate-800 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 text-left animate-in zoom-in-95 duration-200">
                    {/* Left Steps */}
                    <div className="space-y-4 max-w-sm">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-7 h-7 text-emerald-400" />
                        <h3 className="text-lg font-black text-white tracking-tight">Vincular WhatsApp Web</h3>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        Conecta la cuenta de WhatsApp del negocio para que{' '}
                        <strong className="text-cyan-400">{activeAgentDetail.name}</strong> responda y envíe mensajes de forma
                        continua 24/7.
                      </p>

                      <ol className="space-y-2 text-xs text-slate-300 font-sans list-decimal list-inside leading-relaxed">
                        <li>
                          Abre <strong className="text-white">WhatsApp</strong> en tu teléfono.
                        </li>
                        <li>
                          Toca <strong className="text-white">Menú</strong> en Android o{' '}
                          <strong className="text-white">Configuración</strong> en iPhone.
                        </li>
                        <li>
                          Toca <strong className="text-white">Dispositivos vinculados</strong> y luego{' '}
                          <strong className="text-white">Vincular un dispositivo</strong>.
                        </li>
                        <li>Apunta la cámara de tu celular hacia este código QR.</li>
                      </ol>
                    </div>

                    {/* Right Dynamic QR Code Display */}
                    <div className="flex flex-col items-center justify-center space-y-3 bg-[#202c33] p-5 rounded-2xl border border-slate-700/60 shadow-xl shrink-0">
                      <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-300">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                            `https://web.whatsapp.com/pair?agent=${activeAgentDetail.id}&phone=${pairedPhoneNumber}`
                          )}`}
                          alt="Código QR WhatsApp Web"
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>

                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-emerald-400" /> Escanear con WhatsApp
                      </span>

                      <button
                        onClick={() => handlePairWhatsAppSession(activeAgentDetail)}
                        disabled={isPairingWhatsApp}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simular Escaneo QR</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Banner with 24/7 Master Control */}
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-purple-950 p-6 rounded-3xl border border-cyan-800/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 shadow-sm">
              <Bot className="w-4 h-4 text-cyan-400" />
              Módulo de Agentes de IA 24/7
            </span>
            <span className="text-xs font-mono text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800">
              Gemini SDK + Firestore
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Agentes Autónomos con Habilidades Personalizadas
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Crea, entrena y delega habilidades específicas a tus agentes de Inteligencia Artificial para que trabajen
            de forma continua las <strong className="text-cyan-400">24 horas, los 7 días de la semana</strong>.
          </p>
        </div>

        {/* Master Controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setMaster247Active(!master247Active)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 shadow-lg ${
              master247Active
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600 hover:bg-emerald-900 shadow-emerald-950'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Activity className={`w-4 h-4 ${master247Active ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Motor 24/7: {master247Active ? 'ACTIVO 🟢' : 'PAUSADO ⏸️'}</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs rounded-2xl shadow-xl shadow-cyan-950 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Agente</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span>Studio Chat & Config</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>Historial de Chat ({chatHistorySessions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('browser')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'browser'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Navegador Web</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
            activeTab === 'agents'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bot className="w-3.5 h-3.5 shrink-0" />
          <span>Agentes ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'training'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Brain className="w-3.5 h-3.5 shrink-0" />
          <span>Entrenamiento</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 relative cursor-pointer tabular-nums ${
            activeTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 shrink-0" />
          <span>Auditoría 24/7 ({logs.length})</span>
          {master247Active && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 relative cursor-pointer tabular-nums ${
            activeTab === 'webhooks'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span>Webhooks ({webhookEvents.length})</span>
          {webhookEvents.some((w) => w.status === 'dispatched') && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
          )}
        </button>
      </div>

      {/* TAB HISTORIAL DE CONVERSACIONES POR FECHA Y AGENTE */}
      {activeTab === 'history' && (
        <ChatHistoryPanel
          sessions={chatHistorySessions}
          agents={agents}
          activeAgentId={selectedAgentId}
          onResumeConversation={handleResumeConversation}
          onDeleteConversation={handleDeleteConversation}
          onNavigateToChat={() => setActiveTab('chat')}
          onOpenBrowserUrl={(url) => {
            setBrowserStartUrl(normalizeAgentBaseUrl(url));
            setActiveTab('browser');
          }}
        />
      )}

      {/* TAB NAVEGADOR WEB & REDES SOCIALES */}
      {activeTab === 'browser' && (
        <WebBrowserView
          initialUrl={browserStartUrl}
          agentName={selectedAgent ? selectedAgent.name : 'Agente de IA Nexus'}
          agentRole={selectedAgent ? selectedAgent.role : 'Navegación & Redes Sociales'}
          onExecuteAgentAction={(action, url, payload) => {
            showToast(`Acción de IA "${action}" ejecutada exitosamente en ${url}`, 'success');
          }}
        />
      )}

      {/* TAB 1: CATÁLOGO DE AGENTES */}
      {activeTab === 'agents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((ag) => {
            const isSelected = ag.id === selectedAgentId;

            return (
              <div
                key={ag.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
                  isSelected
                    ? 'bg-slate-900/90 border-cyan-500 shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-2xl border ${
                          ag.isAutonomous247
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700'
                            : 'bg-slate-800 text-cyan-400 border-slate-700'
                        }`}
                      >
                        {renderAgentIcon(ag.icon, 'w-6 h-6')}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">{ag.name}</h3>
                        <p className="text-xs text-cyan-400 font-semibold mt-0.5">{ag.role}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAgent(ag.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                      title="Eliminar agente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{ag.description}</p>

                  {/* Trained Skill & Base URL Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-400">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" /> Habilidad Entrenada:
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{ag.model}</span>
                    </div>
                    <p className="text-xs text-white font-medium">{ag.customSkillName}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic">{ag.trainedInstructions}</p>
                    {ag.baseUrl && (
                      <div className="pt-1.5 mt-1 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="text-cyan-400 truncate">🌐 {ag.baseUrl}</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectAgent(ag.id);
                            setBrowserStartUrl(normalizeAgentBaseUrl(ag.baseUrl || ''));
                            setActiveTab('browser');
                          }}
                          className="text-[10px] px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-md shrink-0 cursor-pointer"
                        >
                          Abrir
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Capabilities tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ag.capabilities.map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-300 rounded-lg border border-slate-800"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Trabajo 24/7 ({ag.executionInterval}s)
                    </span>
                    <button
                      onClick={() => handleToggleAutonomous(ag)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                        ag.isAutonomous247
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {ag.isAutonomous247 ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
                      <span>{ag.isAutonomous247 ? 'Activo' : 'Pausado'}</span>
                    </button>
                  </div>

                  {/* Primary WhatsApp Web & Agent Detail Browser Button */}
                  <button
                    onClick={() => openAgentDetailView(ag)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <Globe className="w-4 h-4 text-emerald-200" />
                    <span>Abrir Navegador & Vincular WhatsApp</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectAgent(ag.id);
                        setActiveTab('chat');
                      }}
                      className="px-2.5 py-2 bg-purple-950/90 hover:bg-purple-900 text-purple-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors border border-purple-700/70 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-300" />
                      <span>Chatear</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleSelectAgent(ag.id);
                        setActiveTab('chat');
                      }}
                      className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Configurar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openLiveTestModal(ag)}
                      className="px-2.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-white" />
                      <span>Ejecutar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ENTRENAR HABILIDAD PROPIA */}
      {activeTab === 'training' && selectedAgent && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl text-purple-400">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Estudio de Entrenamiento de Agente</h2>
                <p className="text-xs text-slate-400">
                  Configurando las directrices de respuesta y la ejecución 24/7 para{' '}
                  <strong className="text-cyan-400">{selectedAgent.name}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300">Seleccionar Agente:</label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.customSkillName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSaveTraining} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nombre de la Habilidad */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-purple-400" /> Nombre de la Habilidad Entrenada:
                </label>
                <input
                  type="text"
                  required
                  value={trainingData.customSkillName}
                  onChange={(e) => setTrainingData({ ...trainingData, customSkillName: e.target.value })}
                  placeholder="Ej: Auditoría OWASP y Optimización de Sitemaps"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                />
              </div>

              {/* Modelo Gemini */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" /> Modelo Inteligente:
                </label>
                <select
                  value={trainingData.model}
                  onChange={(e) => setTrainingData({ ...trainingData, model: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Gemini 3.8 Flash">Gemini 3.8 Flash (Recomendado)</option>
                  <option value="Gemini 3.1 Flash Lite">Gemini 3.1 Flash Lite (Ligero y Rápido)</option>
                  <option value="Gemini Flash Latest">Gemini Flash Latest</option>
                </select>
              </div>
            </div>

            {/* URL Base del Agente en Tab Entrenamiento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" /> URL Base del Agente:
              </label>
              <input
                type="text"
                value={trainingData.baseUrl}
                onChange={(e) => setTrainingData({ ...trainingData, baseUrl: e.target.value })}
                placeholder="Ej: https://nexuswebstudio.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Instrucciones de Entrenamiento (Prompt de Sistema) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" /> Instrucciones de Entrenamiento (Prompt del Sistema):
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Define cómo debe actuar el agente al ejecutar su habilidad
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={trainingData.trainedInstructions}
                onChange={(e) => setTrainingData({ ...trainingData, trainedInstructions: e.target.value })}
                placeholder="Escribe las directrices, reglas de negocio, formato de respuesta y restricciones para este agente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
              />
            </div>

            {/* Frecuencia de Ejecución 24/7 y Toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" /> Frecuencia de Ejecución Autonóma:
                </label>
                <select
                  value={trainingData.executionInterval}
                  onChange={(e) => setTrainingData({ ...trainingData, executionInterval: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={10}>Cada 10 segundos (Modo Prueba Intensiva)</option>
                  <option value={30}>Cada 30 segundos (Continuo)</option>
                  <option value={60}>Cada 1 minuto (Estándar)</option>
                  <option value={300}>Cada 5 minutos (Ahorro)</option>
                  <option value={900}>Cada 15 minutos (Periódico)</option>
                </select>
              </div>

              <div className="flex items-center justify-between self-end pb-1">
                <div>
                  <h4 className="text-xs font-bold text-white">Trabajo Autónomo 24/7</h4>
                  <p className="text-[11px] text-slate-400">Permite que el agente ejecute su habilidad en segundo plano</p>
                </div>
                <input
                  type="checkbox"
                  checked={trainingData.isAutonomous247}
                  onChange={(e) => setTrainingData({ ...trainingData, isAutonomous247: e.target.checked })}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  openLiveTestModal(
                    selectedAgent,
                    trainingData.customSkillName,
                    trainingData.trainedInstructions
                  )
                }
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-950 border border-amber-500/40 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-200 fill-current" />
                <span>Probar Habilidad en Vivo</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar & Re-Entrenar Agente</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: AUDITORÍA Y LOGS 24/7 */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-2xl text-emerald-400">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Historial de Ejecución Autónoma 24/7</h2>
                <p className="text-xs text-slate-400">
                  Registro en tiempo real de las tareas y habilidades ejecutadas por los agentes en segundo plano
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Sync Firestore Activo
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Hora / Fecha</th>
                  <th className="p-3">Agente de IA</th>
                  <th className="p-3">Habilidad Ejecutada</th>
                  <th className="p-3">Resumen del Resultado</th>
                  <th className="p-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      Iniciando registros de auditoría 24/7... Espera unos segundos para ver las primeras tareas automáticas.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3 font-bold text-white whitespace-nowrap">{log.agentName}</td>
                      <td className="p-3 text-cyan-400 font-semibold">{log.skillExecuted}</td>
                      <td className="p-3 text-slate-300 max-w-md truncate">{log.outputSummary}</td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-end gap-1 w-max ml-auto">
                          <CheckCircle2 className="w-3 h-3" /> Completado 24/7
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS & TRIGGERS DE PROYECTOS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 border border-amber-800/60 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-950 border border-amber-800 rounded-2xl text-amber-400">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Sistema de Webhooks & Triggers de Proyectos (Firebase)</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40 font-bold">
                      Real-Time Dispatch
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Notificaciones en tiempo real al crear o modificar proyectos en Firestore. Los agentes de IA reaccionan y reajustan sus tareas de desarrollo, pruebas y soporte instantáneamente.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Firestore Webhooks Activos
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Total Eventos Recibidos</span>
                <span className="text-amber-400 font-bold text-base block mt-0.5">{webhookEvents.length} eventos</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Agentes de IA Suscritos</span>
                <span className="text-cyan-400 font-bold text-base block mt-0.5">{agents.length} agentes</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Modo de Notificación</span>
                <span className="text-emerald-400 font-bold block mt-1">Firebase onSnapshot</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Endpoint Webhook REST</span>
                <span className="text-purple-300 font-bold block truncate mt-1">/api/webhooks/projects</span>
              </div>
            </div>
          </div>

          {/* Interactive Webhook Simulator Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Simulador / Disparador de Webhooks de Proyectos</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Prueba directa de notificaciones e integración de IA</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Proyecto:</label>
                <input
                  type="text"
                  value={simulatedProjectName}
                  onChange={(e) => setSimulatedProjectName(e.target.value)}
                  placeholder="ej. App de Pagos en Tiempo Real"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nombre del Cliente:</label>
                <input
                  type="text"
                  value={simulatedClientName}
                  onChange={(e) => setSimulatedClientName(e.target.value)}
                  placeholder="ej. Billetera Móvil Latam S.A."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSimulateProjectWebhook('project.created')}
                disabled={isSimulatingWebhook}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>⚡ Disparar "project.created"</span>
              </button>

              <button
                onClick={() => handleSimulateProjectWebhook('project.updated')}
                disabled={isSimulatingWebhook}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>⚡ Disparar "project.updated"</span>
              </button>

              <button
                onClick={() => handleSimulateProjectWebhook('project.deleted')}
                disabled={isSimulatingWebhook}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-700 to-pink-700 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>⚡ Disparar "project.deleted"</span>
              </button>
            </div>
          </div>

          {/* AI Agents Subscribed Reaction Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-950 border border-blue-800 rounded-xl text-blue-400">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Nexus Code Architect Agent</h4>
                  <p className="text-[10px] text-cyan-400 font-mono">Suscripción: project.created & project.updated</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al recibir el webhook, crea automáticamente la arquitectura técnica, asigna tareas de desarrollo frontend/backend en la colección <code className="text-amber-300">tasks</code> de Firestore y valida el stack técnico.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-950 border border-purple-800 rounded-xl text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Nexus QA & Pentest Agent</h4>
                  <p className="text-[10px] text-purple-300 font-mono">Suscripción: project.created & project.updated</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Al crearse o modificarse un proyecto, genera suites de pruebas Playwright E2E, verifica las reglas de seguridad de Firestore y ejecuta análisis de vulnerabilidades OWASP.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Nexus Client Care Agent</h4>
                  <p className="text-[10px] text-emerald-300 font-mono">Suscripción: project.created & project.updated</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Configura monitoreo de acuerdos SLA para el cliente, genera reportes de progreso de entregables y organiza la cola de tickets de soporte en tiempo real.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-950 border border-amber-800 rounded-xl text-amber-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Nexus SEO & Content Agent</h4>
                  <p className="text-[10px] text-amber-300 font-mono">Suscripción: project.created</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Genera etiquetas OpenGraph de compartición social, marcado de esquemas estructurados Schema.org JSON-LD y optimización de palabras clave para el proyecto.
              </p>
            </div>
          </div>

          {/* Real-Time Webhook Feed Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Historial de Eventos Webhook en Firestore (Live Feed)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">{webhookEvents.length} Notificaciones Registradas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Hora / Fecha</th>
                    <th className="p-3">Tipo de Evento</th>
                    <th className="p-3">Proyecto / Cliente</th>
                    <th className="p-3">Resumen de Notificación Webhook</th>
                    <th className="p-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {webhookEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                        No hay eventos webhook aún. Crea un nuevo proyecto en el panel de administración o usa el simulador superior para ver notificaciones en tiempo real.
                      </td>
                    </tr>
                  ) : (
                    webhookEvents.map((wh) => (
                      <tr key={wh.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{wh.timestamp}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                              wh.eventType === 'project.created'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : wh.eventType === 'project.updated'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}
                          >
                            {wh.eventType}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          {wh.projectName}
                          <span className="block text-[10px] text-slate-400 font-normal">{wh.clientName}</span>
                        </td>
                        <td className="p-3 text-slate-300 max-w-md truncate">{wh.summary}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-end gap-1 w-max ml-auto border ${
                              wh.status === 'processed'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" /> {wh.status === 'processed' ? 'PROCESADO POR IA 🟢' : 'DESPACHANDO ⚡'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STUDIO CHATGPT & GEMINI + CONFIGURACIÓN DE AGENTE (ai_agents) */}
      {activeTab === 'chat' && selectedAgent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          
          {/* LEFT COLUMN: FORMULARIO DE CONFIGURACIÓN DEL AGENTE -> FIRESTORE ai_agents */}
          <div className="lg:col-span-5 min-w-0 bg-slate-900 border border-cyan-800/50 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white leading-tight">
                    Configuración de Agente de IA
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Guarda nombre, sistema de prompts y URL base en Firestore (<code className="text-cyan-400 font-mono">ai_agents</code>)
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Toggle: Editar Seleccionado vs Crear Nuevo Agente */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleSwitchConfigMode('edit')}
                className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                  configMode === 'edit'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Editar Seleccionado
              </button>
              <button
                type="button"
                onClick={() => handleSwitchConfigMode('create')}
                className={`py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
                  configMode === 'create'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Nuevo Agente
              </button>
            </div>

            <form onSubmit={handleSaveAgentConfig} noValidate className="space-y-4 text-xs">
              {/* Campo 1: Nombre del Agente */}
              <div className="space-y-1.5">
                <label htmlFor="agent-config-name" className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Nombre del Agente *</span>
                </label>
                <input
                  id="agent-config-name"
                  name="name"
                  type="text"
                  value={configForm.name}
                  onChange={(e) => {
                    isConfigDirtyRef.current = true;
                    setConfigForm({ ...configForm, name: e.target.value });
                    if (configErrors.name) setConfigErrors({ ...configErrors, name: undefined });
                  }}
                  placeholder="Ej: Agente Analista Web Nexus"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-sans ${
                    configErrors.name
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {configErrors.name && (
                  <p role="alert" className="text-[11px] text-rose-400 font-semibold">
                    {configErrors.name}
                  </p>
                )}
              </div>

              {/* Campo 2: Sistema de Prompts (Instrucciones) */}
              <div className="space-y-1.5">
                <label htmlFor="agent-config-prompt" className="font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sistema de Prompts (Instrucciones) *</span>
                </label>
                <textarea
                  id="agent-config-prompt"
                  name="trainedInstructions"
                  rows={4}
                  value={configForm.trainedInstructions}
                  onChange={(e) => {
                    isConfigDirtyRef.current = true;
                    setConfigForm({ ...configForm, trainedInstructions: e.target.value });
                    if (configErrors.trainedInstructions) {
                      setConfigErrors({ ...configErrors, trainedInstructions: undefined });
                    }
                  }}
                  placeholder="Escribe las instrucciones del sistema, objetivos, tono de respuesta y reglas de operación para el agente..."
                  className={`w-full bg-slate-950 border rounded-xl p-3 text-xs text-slate-100 focus:outline-none font-mono leading-relaxed ${
                    configErrors.trainedInstructions
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-purple-500'
                  }`}
                />
                {configErrors.trainedInstructions && (
                  <p role="alert" className="text-[11px] text-rose-400 font-semibold">
                    {configErrors.trainedInstructions}
                  </p>
                )}
              </div>

              {/* Campo 3: URL Base del Agente */}
              <div className="space-y-1.5">
                <label htmlFor="agent-config-base-url" className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>URL Base del Agente *</span>
                </label>
                <input
                  id="agent-config-base-url"
                  name="baseUrl"
                  type="text"
                  value={configForm.baseUrl}
                  onChange={(e) => {
                    isConfigDirtyRef.current = true;
                    setConfigForm({ ...configForm, baseUrl: e.target.value });
                    if (configErrors.baseUrl) setConfigErrors({ ...configErrors, baseUrl: undefined });
                  }}
                  placeholder="Ej: https://nexuswebstudio.com"
                  className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono ${
                    configErrors.baseUrl
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-emerald-500'
                  }`}
                />
                {configErrors.baseUrl && (
                  <p role="alert" className="text-[11px] text-rose-400 font-semibold">
                    {configErrors.baseUrl}
                  </p>
                )}
              </div>

              {/* Campos opcionales: Rol y Modelo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="agent-config-role" className="font-semibold text-slate-300 block">
                    Rol / Especialidad
                  </label>
                  <input
                    id="agent-config-role"
                    type="text"
                    value={configForm.role}
                    onChange={(e) => setConfigForm({ ...configForm, role: e.target.value })}
                    placeholder="Especialista IA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="agent-config-model" className="font-semibold text-slate-300 block">
                    Modelo Gemini
                  </label>
                  <select
                    id="agent-config-model"
                    value={configForm.model}
                    onChange={(e) => setConfigForm({ ...configForm, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Gemini 3.8 Flash">Gemini 3.8 Flash</option>
                    <option value="Gemini 3.1 Flash Lite">Gemini 3.1 Flash Lite</option>
                    <option value="Gemini Flash Latest">Gemini Flash Latest</option>
                  </select>
                </div>
              </div>

              {/* Feedback Banner */}
              {configSaveStatus && (
                <div
                  role="status"
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                    configSaveStatus.type === 'success'
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                      : 'bg-rose-950/80 border-rose-700 text-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{configSaveStatus.message}</span>
                </div>
              )}

              {/* Submit & Browse Actions */}
              <div className="flex flex-col 2xl:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Guardando en Firestore...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        {configMode === 'create'
                          ? 'Crear y Guardar en Firestore (ai_agents)'
                          : 'Guardar Configuración en Firestore'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetUrl =
                      normalizeAgentBaseUrl(configForm.baseUrl) ||
                      selectedAgent.baseUrl ||
                      'https://nexuswebstudio.com';
                    setBrowserStartUrl(targetUrl);
                    setActiveTab('browser');
                  }}
                  className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                  title="Abrir URL base en el navegador integrado"
                >
                  <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Probar URL</span>
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: STUDIO CHATGPT & GEMINI INTERACTIVO POR AGENTE */}
          <div className="lg:col-span-7 min-w-0 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            
            {/* Top Studio Controls: Saved Agent Selector + Context & Browser Actions */}
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="studio-agent-select"
                  className="text-[11px] font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <span className="p-1.5 bg-purple-950 border border-purple-800 rounded-lg text-purple-300 shrink-0">
                    {renderAgentIcon(selectedAgent.icon, 'w-4 h-4')}
                  </span>
                  <span>Seleccionar Agente para Conversar ({agents.length})</span>
                </label>

                {/* Quick Action Studio Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAgent.baseUrl) {
                        setBrowserStartUrl(normalizeAgentBaseUrl(selectedAgent.baseUrl));
                      }
                      setActiveTab('browser');
                    }}
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Abrir Navegador Web</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap tabular-nums"
                    title="Ver historial de conversaciones pasadas por fecha o agente"
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>Historial ({chatHistorySessions.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextConvId = `conv_${Date.now()}`;
                      setActiveConversationIdByAgent((prev) => ({
                        ...prev,
                        [selectedAgent.id]: nextConvId,
                      }));
                      setChatThreadsByAgent((prev) => ({
                        ...prev,
                        [selectedAgent.id]: [buildAgentWelcomeMessage(selectedAgent)],
                      }));
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                    title="Iniciar una nueva conversación manteniendo las anteriores en el historial"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    <span>Nueva Charla</span>
                  </button>
                </div>
              </div>

              <select
                id="studio-agent-select"
                value={selectedAgentId}
                onChange={(e) => handleSelectAgent(e.target.value)}
                className="w-full bg-slate-950 text-white font-bold text-xs sm:text-sm border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Active Agent System Prompt & Context Configuration Panel */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-cyan-400 font-bold">
                    URL Base: <span className="text-white">{selectedAgent.baseUrl || 'No configurada'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                    {selectedAgent.model}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullContextDrawer((prev) => !prev)}
                  className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  {showFullContextDrawer ? 'Ocultar contexto' : 'Configurar / Ver contexto completo'}
                </button>
              </div>

              <p className={`text-[11px] text-slate-300 font-mono ${showFullContextDrawer ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                <strong className="text-purple-400">Prompt del Sistema:</strong> {selectedAgent.trainedInstructions}
              </p>

              {showFullContextDrawer && (
                <div className="pt-2.5 border-t border-slate-800/90 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeBaseUrlContext}
                        onChange={(e) => setIncludeBaseUrlContext(e.target.checked)}
                        className="accent-cyan-500 rounded"
                      />
                      <span>Incluir URL Base en contexto</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCapabilitiesContext}
                        onChange={(e) => setIncludeCapabilitiesContext(e.target.checked)}
                        className="accent-purple-500 rounded"
                      />
                      <span>Incluir Capacidades ({selectedAgent.capabilities.length})</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="chat-session-context" className="text-[11px] font-semibold text-slate-300 block">
                      Contexto Adicional de Conversación (opcional):
                    </label>
                    <input
                      id="chat-session-context"
                      type="text"
                      value={sessionContextNote}
                      onChange={(e) => setSessionContextNote(e.target.value)}
                      placeholder="Ej: Prioriza recomendaciones de rendimiento React y seguridad Firestore..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Messages Feed Stream */}
            <div
              ref={chatFeedRef}
              className="h-80 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 font-sans text-xs"
            >
              {activeChatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-full sm:max-w-2xl p-4 rounded-2xl text-xs leading-relaxed shadow-lg break-words overflow-hidden ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none whitespace-pre-wrap'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-80 text-[10px] font-mono">
                      {msg.sender === 'user' ? (
                        <span className="font-bold">{currentUser.name} (Tú)</span>
                      ) : (
                        <span className="font-bold text-purple-300 flex items-center gap-1">
                          <Bot className="w-3 h-3 text-purple-400 shrink-0" /> {msg.agentName || selectedAgent.name}
                        </span>
                      )}
                    </div>

                    <p className="[overflow-wrap:anywhere]">{msg.text}</p>

                    {/* Interactive URL Launcher Button */}
                    {msg.detectedUrl && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            setBrowserStartUrl(msg.detectedUrl!);
                            setActiveTab('browser');
                          }}
                          className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer max-w-full text-left"
                        >
                          <Globe className="w-4 h-4 text-emerald-200 shrink-0" />
                          <span className="truncate">Abrir "{msg.detectedUrl}" en Navegador Integrado</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-purple-400 text-xs font-mono p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                  <span>Procesando consulta con {selectedAgent.name}...</span>
                </div>
              )}
            </div>

            {/* Interactive Input Form */}
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  id="ai-chat-input"
                  type="text"
                  placeholder={`Escribe a ${selectedAgent.name} o pega una URL...`}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500 font-sans shadow-inner"
                />

                <button
                  type="submit"
                  disabled={isProcessing || !promptInput.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar a IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url =
                      extractUrlFromString(promptInput) ||
                      selectedAgent.baseUrl ||
                      'https://web.whatsapp.com';
                    setBrowserStartUrl(url);
                    setActiveTab('browser');
                  }}
                  className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  title="Navegar URL ingresada en el Navegador Web"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Navegar URL</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ANALYTICS SECTION: MENSAJES INTERCAMBIADOS POR AGENTE (RECHARTS BAR CHART) */}
      <section
        id="ai-agents-analytics"
        aria-labelledby="ai-agents-analytics-heading"
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <h2
              id="ai-agents-analytics-heading"
              className="text-base sm:text-lg font-bold text-white flex items-center gap-2"
            >
              <BarChart2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Analíticas de Mensajes por Agente</span>
            </h2>
            <p className="text-xs text-slate-400">
              Cantidad total de mensajes intercambiados con cada agente en el chat interactivo (haz clic en una barra para conversar con ese agente).
            </p>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAnalyticsOnlyActive(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !analyticsOnlyActive
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({agentAnalytics.summary.totalAgentsCount})
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsOnlyActive(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                analyticsOnlyActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Con mensajes ({agentAnalytics.summary.activeAgentsCount})
            </button>
          </div>
        </div>

        {/* Clean Unboxed Summary Metadata with Tabular Numerals */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-300 font-mono tabular-nums">
          <span>
            Total intercambiados:{' '}
            <strong className="text-white">{agentAnalytics.summary.totalMessages}</strong> mensajes
          </span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span>
            Agentes con historial:{' '}
            <strong className="text-cyan-400">{agentAnalytics.summary.activeAgentsCount}</strong> de{' '}
            {agentAnalytics.summary.totalAgentsCount}
          </span>
          {agentAnalytics.summary.topAgentName && (
            <>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span>
                Más activo:{' '}
                <strong className="text-purple-300">{agentAnalytics.summary.topAgentName}</strong> (
                {agentAnalytics.summary.topAgentMessages})
              </span>
            </>
          )}
        </div>

        {/* Empty / Zero-Messages Guidance Strip */}
        {agentAnalytics.summary.totalMessages === 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-xs text-slate-300">
            <span>
              Aún no se han intercambiado mensajes en el chat. Envía una consulta arriba para ver crecer las barras de actividad por agente.
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('chat');
                document.getElementById('ai-chat-input')?.focus();
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Iniciar conversación
            </button>
          </div>
        )}

        {/* Simple Responsive Recharts Bar Chart */}
        {agentAnalytics.chartData.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-3 bg-slate-950/60 border border-slate-800/70 rounded-2xl p-6 text-center">
            <p className="text-xs text-slate-400">
              Ningún agente registra mensajes intercambiados todavía con el filtro actual.
            </p>
            <button
              type="button"
              onClick={() => setAnalyticsOnlyActive(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Mostrar todos los agentes
            </button>
          </div>
        ) : (
          <div className="w-full h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agentAnalytics.chartData}
                margin={{ top: 12, right: 20, left: 44, bottom: 34 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="shortName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  padding={{ left: 12, right: 8 }}
                  interval="preserveStartEnd"
                  minTickGap={18}
                  angle={-18}
                  textAnchor="end"
                  height={62}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const item = payload[0].payload as {
                      name: string;
                      role: string;
                      messages: number;
                    };
                    return (
                      <div className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.role}</p>
                        <p className="font-mono tabular-nums text-cyan-300 font-bold pt-0.5">
                          Mensajes intercambiados: {item.messages}
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="messages"
                  name="Mensajes intercambiados"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                  className="cursor-pointer"
                  onClick={(barEntry) => {
                    const targetId = (barEntry as unknown as { id?: string })?.id;
                    if (targetId) {
                      handleSelectAgent(targetId);
                      setActiveTab('chat');
                    }
                  }}
                >
                  {agentAnalytics.chartData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.isSelected ? '#06b6d4' : '#8b5cf6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  )}

      {/* MODAL: CREAR NUEVO AGENTE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800/60 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Crear Nuevo Agente de IA</h3>
                  <p className="text-xs text-slate-400">Define el nombre, rol e instrucciones de su habilidad propia</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} noValidate className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-agent-name" className="font-bold text-slate-300">Nombre del Agente *:</label>
                  <input
                    id="modal-agent-name"
                    type="text"
                    placeholder="Ej: Nexus DevOps Sentinel"
                    value={newAgent.name}
                    onChange={(e) => {
                      setNewAgent({ ...newAgent, name: e.target.value });
                      if (createModalErrors.name) setCreateModalErrors({ ...createModalErrors, name: undefined });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                  {createModalErrors.name && (
                    <p role="alert" className="text-[11px] text-rose-400 font-semibold">{createModalErrors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-agent-base-url" className="font-bold text-slate-300">URL Base *:</label>
                  <input
                    id="modal-agent-base-url"
                    type="text"
                    placeholder="Ej: https://nexuswebstudio.com"
                    value={newAgent.baseUrl}
                    onChange={(e) => {
                      setNewAgent({ ...newAgent, baseUrl: e.target.value });
                      if (createModalErrors.baseUrl) setCreateModalErrors({ ...createModalErrors, baseUrl: undefined });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  {createModalErrors.baseUrl && (
                    <p role="alert" className="text-[11px] text-rose-400 font-semibold">{createModalErrors.baseUrl}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-agent-role" className="font-bold text-slate-300">Rol / Especialidad:</label>
                  <input
                    id="modal-agent-role"
                    type="text"
                    placeholder="Ej: Monitoreo & Despliegue CI/CD"
                    value={newAgent.role}
                    onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-agent-model" className="font-bold text-slate-300">Modelo Gemini:</label>
                  <select
                    id="modal-agent-model"
                    value={newAgent.model}
                    onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Gemini 3.8 Flash">Gemini 3.8 Flash</option>
                    <option value="Gemini 3.1 Flash Lite">Gemini 3.1 Flash Lite</option>
                    <option value="Gemini Flash Latest">Gemini Flash Latest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-agent-skill" className="font-bold text-slate-300">Habilidad Propia Entrenada:</label>
                  <input
                    id="modal-agent-skill"
                    type="text"
                    placeholder="Ej: Auditoría de Logs y Alertas 24/7"
                    value={newAgent.customSkillName}
                    onChange={(e) => setNewAgent({ ...newAgent, customSkillName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-agent-desc" className="font-bold text-slate-300">Descripción Breve:</label>
                  <input
                    id="modal-agent-desc"
                    type="text"
                    placeholder="Explica sintéticamente el propósito de este agente..."
                    value={newAgent.description}
                    onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-agent-prompt" className="font-bold text-slate-300">Sistema de Prompts / Instrucciones *:</label>
                <textarea
                  id="modal-agent-prompt"
                  rows={4}
                  placeholder="Detalla exactamente cómo debe responder y aplicar su configuración..."
                  value={newAgent.trainedInstructions}
                  onChange={(e) => {
                    setNewAgent({ ...newAgent, trainedInstructions: e.target.value });
                    if (createModalErrors.trainedInstructions) {
                      setCreateModalErrors({ ...createModalErrors, trainedInstructions: undefined });
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
                {createModalErrors.trainedInstructions && (
                  <p role="alert" className="text-[11px] text-rose-400 font-semibold">{createModalErrors.trainedInstructions}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Etiquetas de Capacidad (separadas por coma):</label>
                  <input
                    type="text"
                    placeholder="Monitoreo, Auditoría, Reporte CI/CD"
                    value={newAgent.capabilities}
                    onChange={(e) => setNewAgent({ ...newAgent, capabilities: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Frecuencia de Trabajo 24/7:</label>
                  <select
                    value={newAgent.executionInterval}
                    onChange={(e) => setNewAgent({ ...newAgent, executionInterval: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value={10}>Cada 10 segundos</option>
                    <option value={30}>Cada 30 segundos</option>
                    <option value={60}>Cada 1 minuto</option>
                    <option value={300}>Cada 5 minutos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-white">Activar Ejecución 24/7 al Crear</h4>
                  <p className="text-[11px] text-slate-400">Comenzará a auditar y trabajar en segundo plano</p>
                </div>
                <input
                  type="checkbox"
                  checked={newAgent.isAutonomous247}
                  onChange={(e) => setNewAgent({ ...newAgent, isAutonomous247: e.target.checked })}
                  className="w-5 h-5 accent-cyan-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Crear y Registrar Agente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION BANNER */}
      {toastNotification && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5 duration-300">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
              toastNotification.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-950'
                : toastNotification.type === 'error'
                ? 'bg-rose-950/95 border-rose-500 text-rose-200 shadow-rose-950'
                : 'bg-cyan-950/95 border-cyan-500 text-cyan-200 shadow-cyan-950'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold font-sans">{toastNotification.message}</span>
            <button
              onClick={() => setToastNotification(null)}
              className="p-1 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: PROBAR HABILIDAD EN VIVO / EJECUTAR AGENTE */}
      {isLiveTestModalOpen && liveTestAgent && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-700/60 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400">
                  {renderAgentIcon(liveTestAgent.icon, 'w-6 h-6')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">{liveTestAgent.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                      Ejecución Interactiva
                    </span>
                  </div>
                  <p className="text-xs text-purple-300 font-medium">
                    Habilidad: <strong className="text-white">{liveTestSkillName}</strong> ({liveTestAgent.model})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLiveTestModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions Preview Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                📋 Instrucciones de Entrenamiento del Agente:
              </span>
              <p className="text-xs text-slate-300 italic font-mono leading-relaxed max-h-24 overflow-y-auto">
                "{liveTestInstructions}"
              </p>
            </div>

            {/* Test Form */}
            <form onSubmit={handleRunLiveTestExecution} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Indicación de Entrada para la Prueba:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Personaliza el escenario a evaluar</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={liveTestPrompt}
                  onChange={(e) => setLiveTestPrompt(e.target.value)}
                  placeholder="Escribe el mensaje o consulta de prueba para el agente..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLiveTestModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isLiveTesting || !liveTestPrompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLiveTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ejecutando IA...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current text-amber-300" />
                      <span>Ejecutar Habilidad en Vivo</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Live Test Output Result Box */}
            {liveTestOutput && (
              <div className="bg-slate-950 border border-emerald-800/80 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resultado de Ejecución en Tiempo Real:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Motor Gemini 2.5 Active</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 font-sans leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {liveTestOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
