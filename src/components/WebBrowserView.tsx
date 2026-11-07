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
        <div className="bg-slate-900 text-slate-300 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0 font-mono">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              Sitio en {browserTheme.toUpperCase()}: <strong className="text-white">{activeTab.url}</strong>
            </span>
          </div>

          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg flex items-center gap-1 shrink-0 font-bold"
          >
            <span>Abrir en Pestaña Directa</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* VIEWPORT CONTENT (Simulated Interactive Web View or Live iframe) */}
        <div className="flex-1 relative bg-slate-950 overflow-y-auto font-sans">
          
          {/* SPECIAL INTERACTIVE SIMULATED VIEW FOR FACEBOOK */}
          {isFacebook ? (
            <div className="bg-[#18191a] text-slate-100 min-h-full p-4 space-y-4 animate-in fade-in duration-200">
              {/* Facebook Top Navigation Header */}
              <div className="bg-[#242526] border border-[#393a3b] rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                    f
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      readOnly
                      value="Nexus Web Studio"
                      className="bg-[#3a3b3c] text-white rounded-full pl-9 pr-4 py-1.5 text-xs font-sans w-48 sm:w-64 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-6 text-slate-400">
                  <div className="p-2 border-b-2 border-blue-500 text-blue-500 cursor-pointer">
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="p-2 hover:bg-[#3a3b3c] rounded-xl cursor-pointer">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="p-2 hover:bg-[#3a3b3c] rounded-xl cursor-pointer">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div className="p-2 hover:bg-[#3a3b3c] rounded-xl cursor-pointer">
                    <Bell className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Official Facebook Page Profile Cover Header Card */}
              <div className="bg-[#242526] border border-[#393a3b] rounded-3xl overflow-hidden shadow-2xl">
                {/* Banner Cover */}
                <div className="h-44 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 relative p-4 flex items-end justify-between">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-mono text-cyan-300 font-bold border border-cyan-500/30">
                    Página Oficial de Facebook
                  </span>
                </div>

                {/* Profile Avatar & Info */}
                <div className="p-6 relative pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-4">
                    <div className="flex items-end gap-4">
                      <div className="w-24 h-24 rounded-2xl border-4 border-[#242526] bg-white overflow-hidden p-1 shadow-2xl">
                        <img
                          src={OFFICIAL_NEXUS_LOGO}
                          alt="Nexus Web Studio Facebook"
                          className="w-full h-full object-contain rounded-xl"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>Nexus Web Studio</span>
                          <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                            ✓
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">@nexuswebstudio • 1.2K Me gusta • 1.5K Seguidores</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFacebookLiked((prev) => !prev);
                          setFacebookLikesCount((prev) => (facebookLiked ? prev - 1 : prev + 1));
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          facebookLiked
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                            : 'bg-[#3a3b3c] text-slate-200 hover:bg-[#4e4f50]'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{facebookLiked ? 'Te gusta' : 'Me gusta'}</span>
                      </button>

                      <a
                        href="https://api.whatsapp.com/send?phone=573043470984&text=Hola%20Nexus%20Web%20Studio!%20Vengo%20desde%20Facebook."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar mensaje</span>
                      </a>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed border-t border-[#393a3b] pt-3">
                    🚀 <strong>Nexus Web Studio</strong> | Agencia Especializada en Desarrollo Web, Software de Gestión Corporativa y Agentes Autónomos de Inteligencia Artificial 24/7.
                  </p>
                </div>
              </div>

              {/* Facebook Posts Feed Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Feed Column */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Create Post Card */}
                  <div className="bg-[#242526] border border-[#393a3b] rounded-2xl p-4 space-y-3 shadow-lg">
                    <form onSubmit={handleAddFacebookComment} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                          N
                        </div>
                        <input
                          type="text"
                          value={facebookCommentText}
                          onChange={(e) => setFacebookCommentText(e.target.value)}
                          placeholder="¿Qué piensas de la plataforma Nexus Web Studio?"
                          className="flex-1 bg-[#3a3b3c] border border-transparent focus:border-blue-500 rounded-full px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Comentar</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Facebook Post 1 */}
                  <div className="bg-[#242526] border border-[#393a3b] rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={OFFICIAL_NEXUS_LOGO}
                          alt="Nexus Logo"
                          className="w-10 h-10 rounded-full border border-blue-500/50 p-0.5 bg-white object-contain"
                        />
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-1">
                            <span>Nexus Web Studio</span>
                            <span className="text-blue-400 text-[10px]">✓</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">Publicado hace 2 horas • 🌎 Público</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      🔥 ¡Presentamos nuestro nuevo sistema de <strong>Agentes de Navegación Autónomos</strong>! Ahora puedes visualizar e interactuar en sitios web externos (Facebook, GitHub, Google) en tiempo real con emulación multinavegador en Google Chrome, Apple Safari, Microsoft Edge y Opera. 🌐✨
                    </p>

                    <div className="bg-[#18191a] border border-[#393a3b] rounded-xl p-4 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-[11px]">
                        <Globe className="w-4 h-4" />
                        <span>Visualización activa en {browserTheme.toUpperCase()}</span>
                      </div>
                      <p className="text-slate-300">
                        Navega fluido, ejecuta prompts inteligentes y gestiona tus sitios desde la plataforma de Nexus.
                      </p>
                    </div>

                    {/* Post Reactions & Metrics */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-b border-[#393a3b] py-2">
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                          👍
                        </span>
                        <strong className="text-slate-200">{facebookLikesCount}</strong> Me gusta
                      </span>
                      <span>{facebookCommentsList.length} comentarios • 42 compartidos</span>
                    </div>

                    {/* Comments Feed */}
                    <div className="space-y-2 pt-2">
                      {facebookCommentsList.map((comm) => (
                        <div key={comm.id} className="flex items-start gap-2.5 text-xs">
                          <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {comm.author.charAt(0)}
                          </div>
                          <div className="bg-[#3a3b3c] p-2.5 rounded-2xl flex-1 text-slate-200">
                            <p className="font-bold text-white text-[11px]">{comm.author}</p>
                            <p className="text-slate-300 mt-0.5">{comm.text}</p>
                            <span className="text-[9px] text-slate-400 font-mono block mt-1">{comm.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar Column */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-[#242526] border border-[#393a3b] rounded-2xl p-4 space-y-3 shadow-lg text-xs">
                    <h4 className="font-bold text-white border-b border-[#393a3b] pb-2">Información de Contacto</h4>
                    <div className="space-y-2 text-slate-300">
                      <p className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-mono text-[11px]">nexuswebstudio.dev</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px]">+57 304 347 0984</span>
                      </p>
                    </div>

                    <a
                      href="https://www.facebook.com/profile.php?id=61593046477590"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs transition-all shadow-md mt-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir Facebook Oficial</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : isGoogle ? (
            /* SPECIAL SIMULATED VIEW FOR GOOGLE SEARCH */
            <div className="bg-[#202124] text-slate-100 min-h-full p-6 space-y-6">
              <div className="max-w-2xl mx-auto space-y-4 text-center pt-6">
                <h1 className="text-4xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                  <span className="text-blue-500">G</span>
                  <span className="text-red-500">o</span>
                  <span className="text-amber-500">o</span>
                  <span className="text-blue-500">g</span>
                  <span className="text-green-500">l</span>
                  <span className="text-red-500">e</span>
                </h1>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNavigate(urlInput);
                  }}
                  className="flex items-center gap-3 bg-[#303134] border border-[#5f6368] rounded-full px-5 py-3 shadow-lg"
                >
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Buscar en Google o escribir URL..."
                    className="w-full bg-transparent text-sm text-white focus:outline-none"
                  />
                </form>
              </div>

              {/* Google Results */}
              <div className="max-w-3xl mx-auto space-y-4 pt-4">
                <div className="bg-[#303134] p-4 rounded-2xl border border-slate-700 space-y-1">
                  <span className="text-xs text-slate-400 font-mono block">https://nexuswebstudio.dev</span>
                  <h3 className="text-base font-bold text-blue-400 hover:underline">
                    Nexus Web Studio | Desarrollo de Software & Agentes de IA 24/7
                  </h3>
                  <p className="text-xs text-slate-300">
                    Soluciones web de alto rendimiento, sistemas de gestión para empresas y agentes autónomos inteligentes integrados.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT LIVE IFRAME VIEWPORT WITH FALLBACK OVERLAY */
            <div className="w-full h-full relative">
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
                  <h3 className="text-base font-bold text-white">Seguridad X-Frame-Options / CSP Activa</h3>
                  <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                    El sitio web <code className="text-cyan-400 font-mono">{activeTab.url}</code> restringe la incrustación directa en marcos. Puedes abrirlo directamente en una pestaña independiente del navegador {browserTheme.toUpperCase()}.
                  </p>
                  <a
                    href={activeTab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir {activeTab.url} en Pestaña Directa ({browserTheme.toUpperCase()})</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
