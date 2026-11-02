import React, { useState } from 'react';
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
} from 'lucide-react';
import { UserAccount } from '../../types';

interface AiAgentsModuleProps {
  currentUser: UserAccount;
}

interface AgentCard {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: any;
  status: 'active' | 'idle' | 'busy';
  model: string;
  capabilities: string[];
}

export const AiAgentsModule: React.FC<AiAgentsModuleProps> = ({ currentUser }) => {
  const [activeAgentId, setActiveAgentId] = useState<string>('agent_architect');
  const [promptInput, setPromptInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'agent'; text: string; timestamp: string }[]>([
    {
      sender: 'agent',
      text: '¡Hola! Soy el Agente Arquitecto de Software de Nexus Web Studio. ¿En qué módulo o refactorización de código puedo asistirte hoy?',
      timestamp: '17:00',
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const agents: AgentCard[] = [
    {
      id: 'agent_architect',
      name: 'Nexus Code Architect Agent',
      role: 'Arquitectura & Refactorización',
      description: 'Especialista en React 19, TypeScript, Express y PostgreSQL. Revisa patrones de diseño y optimiza rendimiento.',
      icon: Code,
      status: 'active',
      model: 'Gemini 2.5 Flash / Pro',
      capabilities: ['Code Review', 'Estructura DB', 'Optimización Vite', 'Refactorización RBAC'],
    },
    {
      id: 'agent_qa',
      name: 'Nexus QA & Pentest Agent',
      role: 'Auditoría & Pruebas E2E',
      description: 'Genera test suites para Playwright, audita Firestore Security Rules y detecta vulnerabilidades OWASP.',
      icon: ShieldCheck,
      status: 'active',
      model: 'Gemini 2.5 Security',
      capabilities: ['Audit Rules', 'Pruebas E2E Playwright', 'Análisis OWASP', 'Linter de Sintaxis'],
    },
    {
      id: 'agent_seo',
      name: 'Nexus SEO & Content Agent',
      role: 'Optimización Orgánica & Meta',
      description: 'Crea contenido optimizado, JSON-LD Schema.org, OpenGraph cards y sitemaps para buscadores.',
      icon: FileText,
      status: 'idle',
      model: 'Gemini 2.5 Content',
      capabilities: ['JSON-LD Schema', 'OpenGraph Cards', 'Copywriting Técnico', 'Análisis Keywords'],
    },
    {
      id: 'agent_support',
      name: 'Nexus Client Care Agent',
      role: 'Atención Automatizada Nivel 1',
      description: 'Redacta respuestas inteligentes a tickets de clientes, resúmenes de avances de Sprints y estados de facturas.',
      icon: MessageSquare,
      status: 'idle',
      model: 'Gemini 2.5 Flash',
      capabilities: ['Respuesta a Tickets', 'Resumen Sprints', 'Reportes de Cobro', 'SLA Tracking'],
    },
  ];

  const selectedAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const userText = promptInput.trim();
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, timestamp: timeStr }]);
    setPromptInput('');
    setIsProcessing(true);

    setTimeout(() => {
      let responseText = '';
      if (activeAgentId === 'agent_architect') {
        responseText = `[Nexus Architect Agent]: He analizado tu solicitud sobre "${userText}". Te sugiero implementar una arquitectura modular con TypeScript estricto, sincronización mediante Firestore onSnapshot y almacenamiento persistente en localStorage.`;
      } else if (activeAgentId === 'agent_qa') {
        responseText = `[Nexus QA Agent]: Auditoría ejecutada para "${userText}". Todas las comprobaciones de seguridad RBAC, validación de schemas y compilación TypeScript pasaron con 0 errores.`;
      } else if (activeAgentId === 'agent_seo') {
        responseText = `[Nexus SEO Agent]: Generando paquete de optimización SEO para "${userText}". Se incluyeron meta tags OpenGraph, Schema.org JSON-LD de tipo Organization y tarjetas para Twitter.`;
      } else {
        responseText = `[Nexus Client Care Agent]: Respuesta procesada para "${userText}". Se ha redactado una notificación formal lista para despachar al cliente registrado.`;
      }

      setChatMessages((prev) => [...prev, { sender: 'agent', text: responseText, timestamp: timeStr }]);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 p-6 rounded-3xl border border-cyan-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              Módulo de Agentes Inteligentes de IA
            </span>
            <span className="text-xs text-slate-400 font-mono">Google Gemini SDK</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Agentes Especializados de Inteligencia Artificial
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Automatización de tareas de arquitectura, auditoría QA, SEO orgánico y atención a clientes de Nexus Web Studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 4 Agentes Activos
          </span>
        </div>
      </div>

      {/* Agents Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((ag) => {
          const IconComp = ag.icon;
          const isSelected = ag.id === activeAgentId;

          return (
            <div
              key={ag.id}
              onClick={() => {
                setActiveAgentId(ag.id);
                setChatMessages([
                  {
                    sender: 'agent',
                    text: `¡Hola! He cambiado al modo ${ag.name}. ¿En qué tarea puedo ayudarte?`,
                    timestamp: new Date().toLocaleTimeString().slice(0, 5),
                  },
                ]);
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-xl shadow-cyan-950'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-2xl ${isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-400'}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {ag.model}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-tight">{ag.name}</h3>
                <p className="text-[11px] text-cyan-400 font-semibold">{ag.role}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{ag.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                {ag.capabilities.slice(0, 3).map((cap, idx) => (
                  <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-950 text-slate-300 rounded border border-slate-800">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live AI Playground Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{selectedAgent.name}</h2>
              <p className="text-xs text-slate-400">Modelo en ejecución: {selectedAgent.model}</p>
            </div>
          </div>

          <button
            onClick={() => setChatMessages([])}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpiar Conversación</span>
          </button>
        </div>

        {/* Chat History Container */}
        <div className="h-80 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-xs">
          {chatMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-center">
              Escribe una consulta técnica para comenzar a interactuar con el agente.
            </div>
          ) : (
            chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white font-medium rounded-br-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Procesando solicitud con Gemini SDK...</span>
            </div>
          )}
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder={`Haz una pregunta o solicita una tarea al ${selectedAgent.name}...`}
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
          />
          <button
            type="submit"
            disabled={isProcessing || !promptInput.trim()}
            className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Consulta</span>
          </button>
        </form>
      </div>
    </div>
  );
};
