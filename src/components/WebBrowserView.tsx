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
  Copy,
  Check,
  Bookmark,
  Search,
  Monitor,
  ShieldCheck,
  AlertTriangle,
  Share2,
  ThumbsUp,
  MessageCircle,
  Send,
  Heart,
  Sparkles,
  Compass,
  Radio,
  Terminal,
  Grid,
  Users,
  Bell,
  Play,
  Layers,
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
}

export type BrowserTheme = 'chrome' | 'safari' | 'edge' | 'opera';

const OFFICIAL_NEXUS_LOGO = '/assets/aistudio/768420689_122100971391434882_47020785483964272_n__1__df72d03a.jpg';

export const WebBrowserView: React.FC<WebBrowserViewProps> = ({
  initialUrl = 'https://www.facebook.com/profile.php?id=61593046477590',
  agentName = 'Agente de IA Nexus',
  agentRole = 'Navegación Web 24/7',
  onClose,
}) => {
  const resolvedInitialUrl = normalizeAgentBaseUrl(initialUrl) || 'https://www.facebook.com/profile.php?id=61593046477590';

  // Browser theme engines: Google Chrome, Apple Safari, Microsoft Edge, Opera
  const [browserTheme, setBrowserTheme] = useState<BrowserTheme>('chrome');

  // Tabs State
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
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [useProxyMode, setUseProxyMode] = useState<boolean>(true);


  // Navigation History
  const [historyStack, setHistoryStack] = useState<string[]>([resolvedInitialUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Interactive Facebook Simulation States
  const [facebookLiked, setFacebookLiked] = useState<boolean>(true);
  const [facebookLikesCount, setFacebookLikesCount] = useState<number>(1284);
  const [facebookCommentText, setFacebookCommentText] = useState<string>('');
  const [facebookCommentsList, setFacebookCommentsList] = useState<
    { id: string; author: string; avatar?: string; text: string; time: string }[]
  >([
    {
      id: 'c1',
      author: 'Carlos Mendoza',
      text: 'Excelente plataforma. Los agentes autónomos optimizan el flujo de trabajo increíblemente.',
      time: 'Hace 15 min',
    },
    {
      id: 'c2',
      author: 'María Fernanda Ruiz',
      text: '¡El sistema de navegación multinavegador en tiempo real está fantástico! 🔥',
      time: 'Hace 5 min',
    },
  ]);

  // Helper: Normalize URL
  const normalizeUrl = (input: string): string => {
    const clean = normalizeAgentBaseUrl(input);
    return clean || 'https://www.facebook.com';
  };

  // Navigate to URL
  const handleNavigate = (targetUrl: string, recordHistory: boolean = true) => {
    const formatted = normalizeUrl(targetUrl);
    setUrlInput(formatted);

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

    setIframeError(false);
  };

  // Keep input bar in sync with active tab URL
  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      setIframeError(false);
    }
  }, [activeTabId, activeTab]);

  // Sync external initialUrl prop changes
  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      const normalized = normalizeUrl(initialUrl);
      if (activeTab && activeTab.url !== normalized) {
        handleNavigate(normalized, true);
      }
    }
  }, [initialUrl]);

  // Tab Management
  const handleCreateNewTab = () => {
    const newId = `tab_${Date.now()}`;
    const newTabObj: BrowserTab = {
      id: newId,
      title: 'Nueva Pestaña',
      url: 'https://www.facebook.com',
    };
    setTabs((prev) => [...prev, newTabObj]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const filtered = tabs.filter((t) => t.id !== idToClose);
    setTabs(filtered);
    if (activeTabId === idToClose) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  const copyCurrentUrl = () => {
    navigator.clipboard.writeText(activeTab.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 3000);
  };

  const handleAddFacebookComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facebookCommentText.trim()) return;
    const newComm = {
      id: `comm_${Date.now()}`,
      author: 'Usuario Nexus',
      text: facebookCommentText.trim(),
      time: 'Justo ahora',
    };
    setFacebookCommentsList((prev) => [newComm, ...prev]);
    setFacebookCommentText('');
  };

  // Detect which site simulation to render if blocked or external domain
  const currentDomain = (activeTab?.url || '').toLowerCase();
  const isFacebook = currentDomain.includes('facebook.com');
  const isGoogle = currentDomain.includes('google.com');
  const isInstagram = currentDomain.includes('instagram.com');
  const isXTwitter = currentDomain.includes('x.com') || currentDomain.includes('twitter.com');
  const isGitHub = currentDomain.includes('github.com');

  return (
    <div
      className={`rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[820px] transition-all duration-200 border select-none ${
        browserTheme === 'chrome'
          ? 'bg-[#202124] border-slate-700'
          : browserTheme === 'safari'
          ? 'bg-[#28282b] border-slate-700/80'
          : browserTheme === 'edge'
          ? 'bg-[#1b1c1f] border-indigo-900/60'
          : 'bg-[#18191c] border-rose-950/60'
      }`}
    >
      {/* 1. TOP BAR: BROWSER THEME ENGINE SELECTOR (Chrome, Safari, Edge, Opera) */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Traffic Light Controls & Engine Buttons */}
        <div className="flex items-center gap-3">
          {/* Traffic Lights */}
          <div className="flex items-center gap-1.5 pr-2">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-rose-500/90 hover:bg-rose-600 transition-colors flex items-center justify-center text-[8px] text-rose-950 font-bold cursor-pointer"
              title="Cerrar navegador"
            >
              ✕
            </button>
            <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block" />
          </div>

          {/* Browser Theme Selector: Chrome | Safari | Edge | Opera */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
            <span className="text-[10px] text-slate-400 font-mono px-2 uppercase tracking-wider hidden sm:inline">
              Navegador:
            </span>

            {/* Google Chrome */}
            <button
              onClick={() => setBrowserTheme('chrome')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                browserTheme === 'chrome'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" />
              </svg>
              <span>Chrome</span>
            </button>

            {/* Apple Safari */}
            <button
              onClick={() => setBrowserTheme('safari')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                browserTheme === 'safari'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>Safari</span>
            </button>

            {/* Microsoft Edge */}
            <button
              onClick={() => setBrowserTheme('edge')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                browserTheme === 'edge'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-[8px] font-black shrink-0 text-white">
                e
              </div>
              <span>Edge</span>
            </button>

            {/* Opera */}
            <button
              onClick={() => setBrowserTheme('opera')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                browserTheme === 'opera'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black shrink-0">
                O
              </span>
              <span>Opera</span>
            </button>
          </div>
        </div>

        {/* Right: Active Agent Indicator Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300 font-bold hidden md:inline">{agentName}</span>
          <span
            className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
              browserTheme === 'chrome'
                ? 'bg-blue-950 text-blue-300 border-blue-800'
                : browserTheme === 'safari'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                : browserTheme === 'edge'
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}
          >
            Motor {browserTheme.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. ENGINE-SPECIFIC TOOLBAR & OMNIBOX ADDRESS BAR */}

      {/* GOOGLE CHROME THEME UI */}
      {browserTheme === 'chrome' && (
        <div className="bg-[#202124] text-slate-200">
          <div className="px-3 pt-2 flex items-center gap-1 overflow-x-auto scrollbar-none border-b border-[#292a2d]">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 max-w-[220px] shrink-0 border-t border-x ${
                    isActive
                      ? 'bg-[#35363a] text-white border-[#4a4d52] shadow-md'
                      : 'bg-[#202124] text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#292a2d]'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="truncate text-[11px] font-sans">{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleCreateNewTab}
              className="p-1.5 rounded-xl hover:bg-[#35363a] text-slate-400 hover:text-white shrink-0 ml-1"
              title="Nueva Pestaña en Chrome"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2.5 bg-[#292a2d] border-b border-[#171717] flex items-center gap-2 text-xs">
            <button
              onClick={() => historyIndex > 0 && handleNavigate(historyStack[historyIndex - 1])}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 disabled:opacity-30"
              title="Atrás"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => historyIndex < historyStack.length - 1 && handleNavigate(historyStack[historyIndex + 1])}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 disabled:opacity-30"
              title="Adelante"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate(activeTab.url)}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300"
              title="Recargar"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(urlInput);
              }}
              className="flex-1 flex items-center gap-2 bg-[#202124] border border-[#3c4043] focus-within:border-blue-500 rounded-full px-4 py-1.5 shadow-inner"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Escribe una URL (ej. www.facebook.com o https://google.com)..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={copyCurrentUrl}
                className="text-slate-400 hover:text-white"
                title="Copiar URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </form>

            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full flex items-center gap-1 text-[11px] shrink-0"
            >
              <span>Abrir Chrome</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* APPLE SAFARI THEME UI */}
      {browserTheme === 'safari' && (
        <div className="bg-[#28282b] text-slate-200">
          <div className="p-3 bg-[#1e1e20] border-b border-[#36363a] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => historyIndex > 0 && handleNavigate(historyStack[historyIndex - 1])}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg hover:bg-[#36363a] text-slate-300 disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => historyIndex < historyStack.length - 1 && handleNavigate(historyStack[historyIndex + 1])}
                disabled={historyIndex >= historyStack.length - 1}
                className="p-1.5 rounded-lg hover:bg-[#36363a] text-slate-300 disabled:opacity-30"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNavigate(activeTab.url)}
                className="p-1.5 rounded-lg hover:bg-[#36363a] text-slate-300"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(urlInput);
              }}
              className="flex-1 max-w-xl flex items-center gap-2 bg-[#121214] border border-[#3a3a3d] focus-within:border-cyan-500 rounded-xl px-4 py-1.5 mx-auto"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-transparent text-xs text-white text-center focus:text-left focus:outline-none font-mono"
              />
              <button type="button" onClick={copyCurrentUrl} className="text-slate-400 hover:text-white">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </form>

            <div className="flex items-center gap-2">
              <button onClick={handleCreateNewTab} className="p-1.5 rounded-lg hover:bg-[#36363a] text-slate-300">
                <Plus className="w-4 h-4" />
              </button>
              <a
                href={activeTab.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-1 text-[11px] shrink-0"
              >
                <span>Pestaña Safari</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MICROSOFT EDGE THEME UI */}
      {browserTheme === 'edge' && (
        <div className="bg-[#1b1c1f] text-slate-200">
          <div className="p-2.5 bg-[#141517] border-b border-indigo-950/80 flex items-center gap-2 text-xs">
            <div className="p-1 bg-indigo-950 border border-indigo-700 rounded-lg text-indigo-300 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-mono font-bold">Bing Copilot</span>
            </div>

            <button
              onClick={() => historyIndex > 0 && handleNavigate(historyStack[historyIndex - 1])}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => historyIndex < historyStack.length - 1 && handleNavigate(historyStack[historyIndex + 1])}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => handleNavigate(activeTab.url)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300">
              <RotateCw className="w-4 h-4" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(urlInput);
              }}
              className="flex-1 flex items-center gap-2 bg-[#232428] border border-indigo-900/60 focus-within:border-indigo-500 rounded-xl px-4 py-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
              />
              <button type="button" onClick={copyCurrentUrl} className="text-slate-400 hover:text-white">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </form>

            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1 text-[11px] shrink-0"
            >
              <span>Abrir Edge</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* OPERA THEME UI */}
      {browserTheme === 'opera' && (
        <div className="bg-[#18191c] text-slate-200">
          <div className="p-2.5 bg-[#101113] border-b border-rose-950/80 flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-rose-900/50">
              O
            </div>

            <button
              onClick={() => historyIndex > 0 && handleNavigate(historyStack[historyIndex - 1])}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => historyIndex < historyStack.length - 1 && handleNavigate(historyStack[historyIndex + 1])}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button onClick={() => handleNavigate(activeTab.url)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300">
              <RotateCw className="w-4 h-4" />
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleNavigate(urlInput);
              }}
              className="flex-1 flex items-center gap-2 bg-[#1f2024] border border-rose-900/60 focus-within:border-rose-500 rounded-xl px-4 py-1.5"
            >
              <Search className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
              />
              <button type="button" onClick={copyCurrentUrl} className="text-slate-400 hover:text-white">
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </form>

            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center gap-1 text-[11px] shrink-0"
            >
              <span>Abrir Opera</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* QUICK BOOKMARKS BAR */}
      <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-slate-500 font-mono flex items-center gap-1 shrink-0">
          <Bookmark className="w-3 h-3 text-cyan-400" /> Accesos Rápidos:
        </span>

        {[
          { name: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61593046477590' },
          { name: 'Nexus Web Studio', url: 'https://nexuswebstudio.dev' },
          { name: 'Google Search', url: 'https://google.com' },
          { name: 'Instagram', url: 'https://instagram.com/nexuswebstudio' },
          { name: 'GitHub', url: 'https://github.com/nexuswebstudio/nexus-platform-v2' },
          { name: 'WhatsApp Web', url: 'https://web.whatsapp.com' },
        ].map((b) => (
          <button
            key={b.name}
            onClick={() => handleNavigate(b.url)}
            className="px-2.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono shrink-0 cursor-pointer"
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* 3. MAIN WEBPAGE VIEWPORT CONTAINER */}
      <div className="flex-1 bg-slate-950 relative flex flex-col overflow-hidden">
        {/* URL Status Bar */}
        <div className="bg-slate-900 text-slate-300 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 font-mono">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              Sitio en {browserTheme.toUpperCase()}: <strong className="text-white">{activeTab.url}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle: Universal Proxy (Unlocked) vs Direct Iframe */}
            <button
              onClick={() => setUseProxyMode((prev) => !prev)}
              className={`px-3 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                useProxyMode
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={useProxyMode ? 'Modo Proxy Activo (Bypass de X-Frame-Options para cargar todo Internet)' : 'Modo Iframe Directo'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{useProxyMode ? '🔓 Proxy Web Desbloqueado' : '⚡ Iframe Directo'}</span>
            </button>

            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 shrink-0 font-bold transition-all"
            >
              <span>Abrir Pestaña Directa</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* VIEWPORT CONTENT (Universal Web Proxy for Live Browsing of ANY Website) */}
        <div className="flex-1 relative bg-slate-950 overflow-hidden font-sans">
          {useProxyMode ? (
            /* UNIVERSAL SERVER PROXY VIEWPORT - RENDERS ANY WEBSITE IN THE WORLD LIVE */
            <iframe
              key={`proxy_${activeTab.url}`}
              src={`/api/proxy-web?url=${encodeURIComponent(activeTab.url)}`}
              title={activeTab.title}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              onError={() => setIframeError(true)}
            />
          ) : (
            /* DIRECT IFRAME VIEWPORT */
            <div className="w-full h-full relative">
              <iframe
                key={`direct_${activeTab.url}`}
                src={activeTab.url}
                title={activeTab.title}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                onError={() => setIframeError(true)}
              />

              {iframeError && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <AlertTriangle className="w-12 h-12 text-amber-400 animate-pulse" />
                  <h3 className="text-base font-bold text-white">Seguridad X-Frame-Options / CSP Activa</h3>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                    El sitio web <code className="text-cyan-400 font-mono">{activeTab.url}</code> restringe la incrustación directa. Activa el <strong>Proxy Web Desbloqueado</strong> arriba para visualizarlo directamente en este navegador.
                  </p>
                  <button
                    onClick={() => setUseProxyMode(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Activar Proxy Web Desbloqueado</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
