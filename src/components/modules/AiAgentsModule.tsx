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
} from 'lucide-react';
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
import { db } from '../../lib/firebase';
import { UserAccount } from '../../types';

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
  model: string;
  icon: string;
  status: 'active' | 'idle' | 'busy' | 'autonomous';
  capabilities: string[];
  executionInterval: number; // in seconds (e.g. 15, 30, 60, 300)
  isAutonomous247: boolean;
  lastRunTimestamp?: string;
  createdAt?: string;
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

const DEFAULT_INITIAL_AGENTS: AiAgent[] = [
  {
    id: 'agent_architect',
    name: 'Nexus Code Architect Agent',
    role: 'Arquitectura & Refactorización',
    description: 'Especialista en React 19, TypeScript, Express y PostgreSQL. Revisa patrones de diseño y optimiza rendimiento.',
    customSkillName: 'Refactorización Limpia & Diagnóstico de Código',
    trainedInstructions:
      'Revisar la sintaxis de los componentes React, asegurar tipado estricto en TypeScript sin "any", optimizar hooks de React y mantener arquitectura modular limpia.',
    model: 'Gemini 2.5 Flash / Pro',
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
    model: 'Gemini 2.5 Security',
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
    model: 'Gemini 2.5 Content',
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
    model: 'Gemini 2.5 Flash',
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
  const [activeTab, setActiveTab] = useState<'agents' | 'training' | 'logs' | 'chat'>('agents');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent_architect');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Agent Form State
  const [newAgent, setNewAgent] = useState<{
    name: string;
    role: string;
    description: string;
    customSkillName: string;
    trainedInstructions: string;
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
    model: 'Gemini 2.5 Flash',
    icon: 'Brain',
    capabilities: 'Monitoreo, Auditoría, Reporte',
    executionInterval: 30,
    isAutonomous247: true,
  });

  // Training Form State
  const [trainingData, setTrainingData] = useState<{
    customSkillName: string;
    trainedInstructions: string;
    executionInterval: number;
    model: string;
    isAutonomous247: boolean;
  }>({
    customSkillName: '',
    trainedInstructions: '',
    executionInterval: 30,
    model: 'Gemini 2.5 Flash',
    isAutonomous247: true,
  });

  // Chat State
  const [promptInput, setPromptInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'agent'; text: string; timestamp: string }[]>([
    {
      sender: 'agent',
      text: '¡Hola! Soy el Agente Inteligente con habilidad entrenada 24/7. ¿En qué tarea puedo aplicarla hoy?',
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [master247Active, setMaster247Active] = useState(true);

  // Sync with Firestore
  useEffect(() => {
    const agentsRef = collection(db, 'ai_agents');
    const unsubscribeAgents = onSnapshot(
      agentsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedAgents: AiAgent[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AiAgent, 'id'>),
          }));
          setAgents(loadedAgents);
        } else {
          // Seed defaults if empty
          DEFAULT_INITIAL_AGENTS.forEach(async (ag) => {
            await setDoc(doc(db, 'ai_agents', ag.id), ag);
          });
        }
      },
      (error) => {
        console.warn('Firestore agents sync error:', error);
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
      }
    );

    return () => {
      unsubscribeAgents();
      unsubscribeLogs();
    };
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  // Sync training data form when selected agent changes
  useEffect(() => {
    if (selectedAgent) {
      setTrainingData({
        customSkillName: selectedAgent.customSkillName || '',
        trainedInstructions: selectedAgent.trainedInstructions || '',
        executionInterval: selectedAgent.executionInterval || 30,
        model: selectedAgent.model || 'Gemini 2.5 Flash',
        isAutonomous247: selectedAgent.isAutonomous247 ?? true,
      });
    }
  }, [selectedAgentId, selectedAgent]);

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

        // Write to Firestore
        await addDoc(collection(db, 'ai_agent_logs'), newLogEntry);

        // Update agent last run timestamp
        await updateDoc(doc(db, 'ai_agents', randomAgent.id), {
          lastRunTimestamp: timeFormatted,
          status: 'autonomous',
        });
      } catch (err) {
        console.error('24/7 Autonomous execution error:', err);
      }
    }, 12000); // Fired every 12 seconds in live preview for immediate visual 24/7 feedback

    return () => clearInterval(intervalId);
  }, [agents, master247Active]);

  // Handle New Agent Creation
  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name.trim() || !newAgent.customSkillName.trim()) return;

    const newId = `agent_${Date.now()}`;
    const capsArray = newAgent.capabilities.split(',').map((c) => c.trim()).filter(Boolean);

    const createdAgent: AiAgent = {
      id: newId,
      name: newAgent.name.trim(),
      role: newAgent.role.trim() || 'Especialista en IA',
      description: newAgent.description.trim() || 'Agente de IA entrenado para tareas autónomas.',
      customSkillName: newAgent.customSkillName.trim(),
      trainedInstructions: newAgent.trainedInstructions.trim() || 'Aplicar el entrenamiento con máxima precisión.',
      model: newAgent.model,
      icon: newAgent.icon,
      status: newAgent.isAutonomous247 ? 'autonomous' : 'active',
      capabilities: capsArray.length > 0 ? capsArray : ['Habilidad Entrenada', 'Ejecución 24/7'],
      executionInterval: Number(newAgent.executionInterval) || 30,
      isAutonomous247: newAgent.isAutonomous247,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'ai_agents', newId), createdAgent);

      // Add log
      await addDoc(collection(db, 'ai_agent_logs'), {
        agentId: newId,
        agentName: createdAgent.name,
        skillExecuted: `Creación y Entrenamiento Inicial: ${createdAgent.customSkillName}`,
        outputSummary: `El agente "${createdAgent.name}" ha sido creado y entrenado exitosamente con la habilidad "${createdAgent.customSkillName}".`,
        status: 'completed',
        timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
      });

      setSelectedAgentId(newId);
      setIsCreateModalOpen(false);
      setNewAgent({
        name: '',
        role: '',
        description: '',
        customSkillName: '',
        trainedInstructions: '',
        model: 'Gemini 2.5 Flash',
        icon: 'Brain',
        capabilities: 'Monitoreo, Auditoría, Reporte',
        executionInterval: 30,
        isAutonomous247: true,
      });
    } catch (err) {
      console.error('Error saving agent to Firestore:', err);
    }
  };

  // Handle Training Save
  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;

    try {
      await updateDoc(doc(db, 'ai_agents', selectedAgent.id), {
        customSkillName: trainingData.customSkillName,
        trainedInstructions: trainingData.trainedInstructions,
        executionInterval: Number(trainingData.executionInterval),
        model: trainingData.model,
        isAutonomous247: trainingData.isAutonomous247,
        status: trainingData.isAutonomous247 ? 'autonomous' : 'active',
      });

      await addDoc(collection(db, 'ai_agent_logs'), {
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        skillExecuted: `Re-Entrenamiento de Habilidad`,
        outputSummary: `Se actualizó el entrenamiento de "${trainingData.customSkillName}". Instrucciones de habilidad reconfiguradas.`,
        status: 'completed',
        timestamp: `${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
      });
    } catch (err) {
      console.error('Error updating training in Firestore:', err);
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
    }
  };

  // Send Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || !selectedAgent) return;

    const userText = promptInput.trim();
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, timestamp: timeStr }]);
    setPromptInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/gemini-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: selectedAgent.name,
          role: selectedAgent.role,
          customSkillName: selectedAgent.customSkillName,
          trainedInstructions: selectedAgent.trainedInstructions,
          prompt: userText,
          isAutonomousRun: false,
        }),
      });

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: data.output || `[${selectedAgent.name}]: Respuesta generada aplicando la habilidad "${selectedAgent.customSkillName}".`,
          timestamp: timeStr,
        },
      ]);
    } catch (err) {
      console.error('Error sending chat query:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: `[${selectedAgent.name}]: Ocurrió un inconveniente al procesar la respuesta. Intenta nuevamente.`,
          timestamp: timeStr,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Icon Helper Component
  const renderAgentIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
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
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'agents'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Catálogo de Agentes ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'training'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>Entrenar Habilidad Propia</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Auditoría 24/7 ({logs.length})</span>
          {master247Active && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-1 right-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Playground de Prueba</span>
        </button>
      </div>

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

                  {/* Trained Skill Box */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-purple-400">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3.5 h-3.5" /> Habilidad Entrenada:
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{ag.model}</span>
                    </div>
                    <p className="text-xs text-white font-medium">{ag.customSkillName}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic">{ag.trainedInstructions}</p>
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

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedAgentId(ag.id);
                        setActiveTab('training');
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Entrenar</span>
                    </button>

                    <button
                      onClick={() => handleRunSkillManual(ag)}
                      disabled={isProcessing}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-600/20 disabled:opacity-50"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Ejecutar Ya</span>
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
                  <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Ultrarrápido)</option>
                  <option value="Gemini 2.5 Pro">Gemini 2.5 Pro (Razonamiento Complejo)</option>
                  <option value="Gemini 2.5 Security">Gemini 2.5 Security (Auditoría & Parches)</option>
                  <option value="Gemini 2.5 Thinking">Gemini 2.5 Thinking (Pensamiento Profundo)</option>
                </select>
              </div>
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
                onClick={() => handleRunSkillManual(selectedAgent)}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors border border-slate-700 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Probar Habilidad en Vivo</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
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

      {/* TAB 4: PLAYGROUND DE CHAT INTERACTIVO */}
      {activeTab === 'chat' && selectedAgent && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400">
                {renderAgentIcon(selectedAgent.icon, 'w-6 h-6')}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{selectedAgent.name}</h2>
                <p className="text-xs text-cyan-400 font-semibold">
                  Habilidad Entrenada: {selectedAgent.customSkillName} ({selectedAgent.model})
                </p>
              </div>
            </div>

            <button
              onClick={() => setChatMessages([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpiar Chat</span>
            </button>
          </div>

          <div className="h-80 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-sans text-xs">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-center gap-2">
                <Brain className="w-8 h-8 text-slate-600" />
                <span>Conversa directamente con {selectedAgent.name} aplicando su habilidad entrenada.</span>
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
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md whitespace-pre-wrap'
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
                <span>Aplicando la habilidad entrenada con Gemini SDK...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder={`Solicita una tarea o consulta a ${selectedAgent.name}...`}
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

            <form onSubmit={handleCreateAgent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Nombre del Agente:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Nexus DevOps Sentinel"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Rol / Especialidad:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Monitoreo & Despliegue CI/CD"
                    value={newAgent.role}
                    onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Habilidad Propia Entrenada:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Auditoría de Logs y Alertas 24/7"
                    value={newAgent.customSkillName}
                    onChange={(e) => setNewAgent({ ...newAgent, customSkillName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Modelo Gemini:</label>
                  <select
                    value={newAgent.model}
                    onChange={(e) => setNewAgent({ ...newAgent, model: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Gemini 2.5 Flash">Gemini 2.5 Flash</option>
                    <option value="Gemini 2.5 Pro">Gemini 2.5 Pro</option>
                    <option value="Gemini 2.5 Security">Gemini 2.5 Security</option>
                    <option value="Gemini 2.5 Thinking">Gemini 2.5 Thinking</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Descripción Breve:</label>
                <input
                  type="text"
                  placeholder="Explica sintéticamente el propósito de este agente..."
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Instrucciones de Entrenamiento / System Prompt:</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detalla exactamente cómo debe responder y aplicar su habilidad entrenada..."
                  value={newAgent.trainedInstructions}
                  onChange={(e) => setNewAgent({ ...newAgent, trainedInstructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
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
    </div>
  );
};
