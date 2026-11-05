import React, { useState, useEffect } from 'react';
import {
  Globe,
  Lock,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Plus,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Copy,
  CheckCircle2,
  Code,
  MessageSquare,
  Share2,
  Bookmark,
  Monitor,
  Terminal,
  Search,
  Sparkles,
  GitBranch,
  Folder,
  FileCode,
  Send,
  User,
  ThumbsUp,
  MessageCircle,
  QrCode,
  Check,
  AlertTriangle
} from 'lucide-react';
import { normalizeAgentBaseUrl, derivePageTitleFromUrl } from '../utils/agentConfig';

export interface WebBrowserViewProps {
  initialUrl?: string;
  agentName?: string;
  agentRole?: string;
  onExecuteAgentAction?: (action: string, url: string, payload?: any) => void;
  onClose?: () => void;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading?: boolean;
}

export const WebBrowserView: React.FC<WebBrowserViewProps> = ({
  initialUrl = 'https://web.whatsapp.com',
  agentName = 'Agente de IA Nexus',
  agentRole = 'Automatización & Navegación Web 24/7',
  onExecuteAgentAction,
  onClose,
}) => {
  // Tabs State
  const resolvedInitialUrl = normalizeAgentBaseUrl(initialUrl) || 'https://web.whatsapp.com';
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab_1',
      title: derivePageTitleFromUrl(resolvedInitialUrl),
      url: resolvedInitialUrl,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  // Active Tab Derived Properties
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const [urlInput, setUrlInput] = useState<string>(activeTab ? activeTab.url : resolvedInitialUrl);
  const [renderMode, setRenderMode] = useState<'emulator' | 'iframe'>('emulator');
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Navigation History
  const [historyStack, setHistoryStack] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // GitHub Specific State Simulation
  const [githubRepo, setGithubRepo] = useState({
    name: 'nexus-platform-v2',
    owner: 'nexuswebstudio',
    branch: 'main',
    stars: 128,
    forks: 34,
    lastCommitMsg: 'feat: add AI Agents Module with WhatsApp & GitHub integrations',
    lastCommitTime: 'Hace 10 minutos',
    files: [
      { name: 'src/components/modules/AiAgentsModule.tsx', type: 'file', size: '78 KB' },
      { name: 'src/components/WebBrowserView.tsx', type: 'file', size: '32 KB' },
      { name: 'src/lib/webhookHandlers.ts', type: 'file', size: '12 KB' },
      { name: 'server.ts', type: 'file', size: '14 KB' },
      { name: 'package.json', type: 'file', size: '2 KB' },
    ],
  });
  const [githubCommitInput, setGithubCommitInput] = useState('');
  const [githubStatusMsg, setGithubStatusMsg] = useState<string | null>(null);

  // WhatsApp Specific State Simulation
  const [whatsappPhone, setWhatsappPhone] = useState('+573043470984');
  const [whatsappIsConnected, setWhatsappIsConnected] = useState(true);
  const [whatsappChatInput, setWhatsappChatInput] = useState('');
  const [whatsappMessages, setWhatsappMessages] = useState<{ sender: 'user' | 'agent' | 'system'; text: string; time: string }[]>([
    {
      sender: 'system',
      text: '🟢 Sesión de WhatsApp Web del Agente vinculada mediante código QR.',
      time: '12:00 PM',
    },
    {
      sender: 'agent',
      text: '¡Hola! Soy el Agente de IA. Estoy conectado a tu WhatsApp del negocio y respondiendo consultas 24/7.',
      time: '12:01 PM',
    },
  ]);

  // Social Media Post Simulation State
  const [socialPostInput, setSocialPostInput] = useState('');
  const [socialFeed, setSocialFeed] = useState<{ id: string; author: string; avatar: string; content: string; time: string; likes: number }[]>([
    {
      id: 'p1',
      author: 'Nexus Web Studio',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      content: '🚀 Lanzamos oficialmente nuestro Módulo de Agentes de IA autónomos con navegación web directa.',
      time: 'Hace 1 hora',
      likes: 42,
    },
  ]);

  const isKnownEmulatorDomain = (url: string): boolean =>
    url.includes('whatsapp.com') ||
    url.includes('github.com') ||
    url.includes('facebook.com') ||
    url.includes('linkedin.com') ||
    url.includes('x.com') ||
    url.includes('twitter.com') ||
    url.includes('instagram.com');

  // Helper: Normalize URL
  const normalizeUrl = (input: string): string => {
    const clean = normalizeAgentBaseUrl(input);
    return clean || 'https://google.com';
  };

  // Navigate to URL
  const handleNavigate = (targetUrl: string, recordHistory: boolean = true) => {
    const formatted = normalizeUrl(targetUrl);
    setUrlInput(formatted);

    // Update active tab
    const pageTitle = derivePageTitleFromUrl(formatted);

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: formatted, title: pageTitle } : t))
    );

    if (recordHistory) {
      setHistoryStack((prev) => {
        if (prev[historyIndex] === formatted) return prev;
        const newStack = prev.slice(0, historyIndex + 1);
        newStack.push(formatted);
        setHistoryIndex(newStack.length - 1);
        return newStack;
      });
    }

    setRenderMode(isKnownEmulatorDomain(formatted) ? 'emulator' : 'iframe');
    setIframeError(false);
  };

  // Keep input bar in sync with active tab URL
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      setIframeError(false);
    }
  }, [activeTabId, activeTab]);

  // Sync external initialUrl prop changes into active browser tab
  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      const normalized = normalizeUrl(initialUrl);
      const nextTitle = derivePageTitleFromUrl(normalized);
      if (activeTab && activeTab.url !== normalized) {
        handleNavigate(normalized, true);
      } else {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === activeTabId && t.title !== nextTitle ? { ...t, title: nextTitle } : t
          )
        );
        setRenderMode(isKnownEmulatorDomain(normalized) ? 'emulator' : 'iframe');
      }
    }
  }, [initialUrl]);

  // Tab Management
  const handleCreateNewTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTabObj: BrowserTab = {
      id: newId,
      title: 'Nueva Pestaña',
      url: 'https://github.com',
    };
    setTabs((prev) => [...prev, newTabObj]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab
    const filtered = tabs.filter((t) => t.id !== idToClose);
    setTabs(filtered);
    if (activeTabId === idToClose) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  // GitHub Commit Action Simulation
  const handleSimulateGitHubCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubCommitInput.trim()) return;

    setGithubStatusMsg('Subiendo cambios y ejecutando commit...');
    setTimeout(() => {
      setGithubRepo((prev) => ({
        ...prev,
        lastCommitMsg: githubCommitInput.trim(),
        lastCommitTime: 'Justo ahora',
      }));
      setGithubStatusMsg(`✅ Commit exitoso: "${githubCommitInput.trim()}" publicado en rama ${githubRepo.branch}`);
      setGithubCommitInput('');
      if (onExecuteAgentAction) {
        onExecuteAgentAction('github_commit', activeTab.url, { message: githubCommitInput });
      }
    }, 1200);
  };

  // WhatsApp Message Action Simulation
  const handleSendWhatsAppMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappChatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const msg = whatsappChatInput.trim();

    setWhatsappMessages((prev) => [...prev, { sender: 'agent', text: msg, time: timeStr }]);
    setWhatsappChatInput('');

    if (onExecuteAgentAction) {
      onExecuteAgentAction('whatsapp_send', activeTab.url, { message: msg, phone: whatsappPhone });
    }
  };

  // Social Post Action Simulation
  const handlePublishSocialPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialPostInput.trim()) return;

    const newPost = {
      id: `p_${Date.now()}`,
      author: 'Nexus AI Agent',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      content: socialPostInput.trim(),
      time: 'Justo ahora',
      likes: 1,
    };

    setSocialFeed((prev) => [newPost, ...prev]);
    setSocialPostInput('');

    if (onExecuteAgentAction) {
      onExecuteAgentAction('social_post', activeTab.url, { post: socialPostInput });
    }
  };

  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(activeTab.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  return (
    <div className="bg-slate-950 border border-cyan-800/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[780px] animate-in fade-in duration-200">
      
      {/* WINDOW TITLEBAR & TABS BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-0 flex items-center justify-between gap-3 shrink-0">
        
        {/* Left Mac Window Dots + Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 pr-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500/90 hover:bg-rose-600 transition-colors flex items-center justify-center text-[8px] text-rose-950 font-bold"
              title="Cerrar ventana"
            >
              ✕
            </button>
            <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
          </div>

          {/* Browser Tabs List */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-3.5 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 max-w-[200px] shrink-0 border-t border-x ${
                    isActive
                      ? 'bg-slate-950 text-white border-cyan-500/60 shadow-md'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate text-[11px] font-sans">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleCreateNewTab}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
              title="Nueva Pestaña"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Active Agent Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0 pl-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-cyan-400 font-bold hidden md:inline">{agentName}</span>
          <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
            Navegador IA
          </span>
        </div>
      </div>

      {/* ADDRESS TOOLBAR & QUICK BOOKMARKS */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 space-y-2 shrink-0">
        
        {/* Navigation & Address Bar Line */}
        <div className="flex items-center gap-2">
          
          {/* Back Button */}
          <button
            onClick={() => {
              if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                handleNavigate(historyStack[newIndex]);
              }
            }}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Atrás"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          {/* Forward Button */}
          <button
            onClick={() => {
              if (historyIndex < historyStack.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                handleNavigate(historyStack[newIndex]);
              }
            }}
            disabled={historyIndex >= historyStack.length - 1}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Adelante"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Reload Button */}
          <button
            onClick={() => handleNavigate(activeTab.url)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Recargar página"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Home Button */}
          <button
            onClick={() => handleNavigate('https://web.whatsapp.com')}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Página principal"
          >
            <Home className="w-3.5 h-3.5" />
          </button>

          {/* Address Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNavigate(urlInput);
            }}
            className="flex-1 flex items-center gap-2 bg-slate-950 border border-slate-800 focus-within:border-cyan-500 rounded-xl px-3 py-1.5 transition-all shadow-inner"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Ingresa cualquier URL (ej: web.whatsapp.com, github.com, facebook.com)..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
            />

            <button
              type="button"
              onClick={copyCurrentUrl}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors shrink-0"
              title="Copiar URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="submit"
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Ir
            </button>
          </form>

          {/* Render Mode Switcher Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 text-[11px] font-bold">
            <button
              onClick={() => setRenderMode('emulator')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                renderMode === 'emulator'
                  ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Emulador IA</span>
            </button>

            <button
              onClick={() => setRenderMode('iframe')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                renderMode === 'iframe'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>iFrame Directo</span>
            </button>
          </div>
        </div>

        {/* Quick Bookmarks Shortcuts Bar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] font-sans pt-1">
          <span className="text-slate-500 font-mono flex items-center gap-1 shrink-0">
            <Bookmark className="w-3 h-3 text-purple-400" /> Accesos Rápidos:
          </span>

          <button
            onClick={() => handleNavigate('https://web.whatsapp.com')}
            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 font-semibold cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp Web</span>
          </button>

          <button
            onClick={() => handleNavigate('https://github.com/nexuswebstudio/nexus-platform-v2')}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 font-semibold cursor-pointer"
          >
            <Code className="w-3.5 h-3.5 text-purple-400" />
            <span>GitHub Repositorios</span>
          </button>

          <button
            onClick={() => handleNavigate('https://facebook.com')}
            className="px-2.5 py-1 bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 font-semibold cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Facebook</span>
          </button>

          <button
            onClick={() => handleNavigate('https://linkedin.com')}
            className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 font-semibold cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>LinkedIn</span>
          </button>

          <button
            onClick={() => handleNavigate('https://x.com')}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 font-semibold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-300" />
            <span>X / Twitter</span>
          </button>

          <button
            onClick={() => handleNavigate('https://google.com')}
            className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 font-semibold cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Google Search</span>
          </button>
        </div>
      </div>

      {/* BROWSER VIEWPORT & INTERACTIVE AGENT ENGINE */}
      <div className="flex-1 bg-slate-950 overflow-hidden relative flex flex-col">
        
        {renderMode === 'iframe' ? (
          /* DIRECT IFRAME MODE */
          <div className="w-full h-full relative flex flex-col">
            <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
              <div className="flex items-center gap-2 text-slate-300 font-mono truncate">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">
                  Navegando en: <strong className="text-white">{activeTab.url}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRenderMode('emulator')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Cambiar a Inspector IA
                </button>
                <a
                  href={activeTab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-semibold rounded-lg border border-cyan-800 flex items-center gap-1 transition-colors"
                >
                  <span>Abrir externo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex-1 relative">
              <iframe
                key={activeTab.url}
                src={activeTab.url}
                title={activeTab.title}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                onError={() => setIframeError(true)}
              />

              {iframeError && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <AlertTriangle className="w-12 h-12 text-amber-400 animate-pulse" />
                  <h3 className="text-base font-bold text-white">Protección X-Frame-Options Detectada</h3>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                    El sitio web <code className="text-cyan-400 font-mono">{activeTab.url}</code> restringe la incrustación en iFrames directos por políticas de seguridad CSP de dominio externo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRenderMode('emulator')}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Cambiar a Emulador Visual IA Interactivo</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AI EMULATOR INTERACTIVE MODE */
          <div className="w-full h-full overflow-y-auto bg-[#0b141a] text-slate-100 font-sans p-6 flex flex-col items-center justify-start">
            
            {/* 1. WHATSAPP WEB EMULATOR VIEW */}
            {activeTab.url.includes('whatsapp.com') && (
              <div className="w-full max-w-4xl bg-[#111b21] rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-950 border border-emerald-700 rounded-2xl text-emerald-400">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>WhatsApp Web Business - Agente IA Vinculado</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      </h3>
                      <p className="text-xs text-emerald-400 font-mono">
                        Sesión activa para {whatsappPhone} (Protocolo Baileys Socket)
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    🟢 En línea 24/7
                  </span>
                </div>

                {/* WhatsApp Chat Log Feed */}
                <div className="bg-[#0b141a] border border-slate-800 rounded-2xl p-4 space-y-3 max-h-[350px] overflow-y-auto font-sans">
                  {whatsappMessages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : m.sender === 'agent' ? 'items-start' : 'items-center'}`}>
                      {m.sender === 'system' ? (
                        <span className="text-[10px] font-mono px-3 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800 my-1">
                          {m.text}
                        </span>
                      ) : (
                        <div className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                          m.sender === 'user' ? 'bg-[#005c4b] text-white rounded-br-none shadow-md' : 'bg-[#202c33] text-slate-100 rounded-bl-none border border-slate-700/50 shadow-md'
                        }`}>
                          <p>{m.text}</p>
                          <span className="text-[9px] text-slate-400 font-mono block text-right mt-1">{m.time}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* WhatsApp Send Form */}
                <form onSubmit={handleSendWhatsAppMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={whatsappChatInput}
                    onChange={(e) => setWhatsappChatInput(e.target.value)}
                    placeholder="Escribe un mensaje de WhatsApp para enviar desde este agente..."
                    className="flex-1 bg-[#202c33] border border-slate-700/60 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <button
                    type="submit"
                    disabled={!whatsappChatInput.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar WhatsApp</span>
                  </button>
                </form>
              </div>
            )}

            {/* 2. GITHUB REPOSITORIES EMULATOR VIEW */}
            {activeTab.url.includes('github.com') && (
              <div className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-950 border border-purple-800 rounded-2xl text-purple-400">
                      <Code className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>{githubRepo.owner} / {githubRepo.name}</span>
                        <span className="text-xs font-mono text-purple-300 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-800">
                          Public
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Repositorio vinculado al Agente de IA para refactorización y commits automáticos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                    <span className="px-3 py-1 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" /> {githubRepo.branch}
                    </span>
                    <span className="px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
                      ⭐ {githubRepo.stars} stars
                    </span>
                  </div>
                </div>

                {/* Commit Form */}
                <form onSubmit={handleSimulateGitHubCommit} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-purple-400" /> Ejecutar Commit & Push con Agente de IA:
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Rama: {githubRepo.branch}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={githubCommitInput}
                      onChange={(e) => setGithubCommitInput(e.target.value)}
                      placeholder="Ej: feat: refactor React components and optimize PostgreSQL queries..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>Commit & Push</span>
                    </button>
                  </div>
                  {githubStatusMsg && (
                    <p className="text-xs text-emerald-400 font-mono pt-1 animate-in fade-in">
                      {githubStatusMsg}
                    </p>
                  )}
                </form>

                {/* File Tree List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase font-mono">Archivos del Proyecto:</h4>
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs divide-y divide-slate-800/60 font-mono">
                    {githubRepo.files.map((f, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                        <div className="flex items-center gap-2.5 text-slate-200 font-semibold">
                          <FileCode className="w-4 h-4 text-cyan-400" />
                          <span>{f.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{f.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. SOCIAL MEDIA EMULATOR VIEW (Facebook / Instagram / LinkedIn / Twitter) */}
            {(activeTab.url.includes('facebook.com') ||
              activeTab.url.includes('linkedin.com') ||
              activeTab.url.includes('x.com') ||
              activeTab.url.includes('twitter.com') ||
              activeTab.url.includes('instagram.com')) && (
              <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-950 border border-blue-800 rounded-2xl text-blue-400">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Perfil Social & Gestión de Redes</h3>
                      <p className="text-xs text-blue-400 font-mono">{activeTab.url}</p>
                    </div>
                  </div>
                </div>

                {/* Post Creator */}
                <form onSubmit={handlePublishSocialPost} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-200 block">
                    Publicar Novedad o Respuesta Automática en Redes:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={socialPostInput}
                    onChange={(e) => setSocialPostInput(e.target.value)}
                    placeholder="Escribe la publicación para publicar desde la cuenta del negocio..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Publicar en Red Social</span>
                    </button>
                  </div>
                </form>

                {/* Social Feed List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 font-mono">Publicaciones del Perfil:</h4>
                  {socialFeed.map((post) => (
                    <div key={post.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{post.author}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{post.time}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{post.content}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1 text-blue-400 font-bold">
                          <ThumbsUp className="w-3.5 h-3.5" /> {post.likes} Me gusta
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. GENERIC WEB PAGE EMULATOR VIEW */}
            {!activeTab.url.includes('whatsapp.com') &&
              !activeTab.url.includes('github.com') &&
              !activeTab.url.includes('facebook.com') &&
              !activeTab.url.includes('linkedin.com') &&
              !activeTab.url.includes('x.com') &&
              !activeTab.url.includes('twitter.com') &&
              !activeTab.url.includes('instagram.com') && (
                <div className="w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl text-center space-y-5 my-auto">
                  <div className="p-4 bg-cyan-950 border border-cyan-800 rounded-2xl text-cyan-400 w-max mx-auto">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Navegando en {activeTab.url}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Agente <strong className="text-cyan-400">{agentName}</strong> conectado e inspeccionando la página
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 text-left font-mono">
                    <span className="text-emerald-400 font-bold block">🟢 Estado de Inspección IA:</span>
                    <p>Dominio normalizado: {activeTab.url}</p>
                    <p>Protocolo SSL: {activeTab.url.startsWith('https://') ? 'Seguro (HTTPS)' : 'HTTP Local'}</p>
                    <p>Agente activo: {agentName} ({agentRole})</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRenderMode('iframe')}
                      className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Monitor className="w-4 h-4" />
                      <span>Cargar Página Web en Visor iFrame</span>
                    </button>
                  </div>
                </div>
              )}

          </div>
        )}

      </div>

    </div>
  );
};
